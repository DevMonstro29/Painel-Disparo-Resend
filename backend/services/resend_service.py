import httpx
import json
import re
from typing import Optional, List, Dict, Any
from datetime import datetime
from config import config
from domain_utils import normalize_domain_name
from resend_key_context import resolve_resend_api_key

def _fix_resend_variables(html: str) -> str:
    if not html:
        return html
    # Auto-converte href="{{VAR}}" para href="{{{VAR}}}" conforme exigência da Resend.
    fixed = re.sub(r'href=["\']\{\{(?!\{)(.*?)(?<!\})\}\}["\']', r'href="{{{\1}}}"', html)
    fixed = re.sub(r'src=["\']\{\{(?!\{)(.*?)(?<!\})\}\}["\']', r'src="{{{\1}}}"', fixed)
    return fixed


def _validate_custom_return_path(s: str) -> Optional[str]:
    """
    Regras Resend: ≤63 chars; começa com letra; termina com letra ou dígito;
    apenas letras, números e hífens. Ver documentação Custom Return Path.
    """
    t = (s or "").strip()
    if not t:
        return "Informe o caminho de retorno ou use o padrão «send»."
    if len(t) > 63:
        return "O caminho de retorno deve ter no máximo 63 caracteres."
    if not t[0].isalpha():
        return "O caminho de retorno deve começar com uma letra."
    if not (t[-1].isalpha() or t[-1].isdigit()):
        return "O caminho de retorno deve terminar com uma letra ou um número."
    for c in t:
        if c.isalnum() or c == "-":
            continue
        return "O caminho de retorno só pode conter letras, números e hífens."
    return None


class ResendService:
    def __init__(self):
        self.api_url = config.RESEND_API_URL

    def _auth_headers(self) -> Dict[str, str]:
        key = resolve_resend_api_key()
        return {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }
    
    async def log_action(self, event_type: str, message: str, data: Optional[Dict] = None):
        """Registra todas as ações"""
        log_entry = {
            "id": f"log_{len(config.logs)}",
            "timestamp": datetime.now().isoformat(),
            "event_type": event_type,
            "message": message,
            "data": data
        }
        config.logs.append(log_entry)
    
    # ==================== EMAILS ====================
    async def send_email(self, to: List[str], subject: str, html: str, from_email: str, reply_to: Optional[str] = None):
        """Envia um email via Resend"""
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "from": from_email,
                    "to": to,
                    "subject": subject,
                    "html": html,
                }
                if reply_to:
                    payload["reply_to"] = reply_to
                
                response = await client.post(
                    f"{self.api_url}/emails",
                    json=payload,
                    headers=self._auth_headers(),
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    email_id = data.get("id")
                    
                    # Armazena o email enviado
                    for recipient in to:
                        config.sent_emails[email_id] = {
                            "id": email_id,
                            "to": recipient,
                            "subject": subject,
                            "status": "sent",
                            "created_at": datetime.now().isoformat()
                        }
                    
                    await self.log_action("EMAIL_SENT", f"Email enviado para {', '.join(to)}", {"email_id": email_id})
                    return {"success": True, "id": email_id, "data": data}
                else:
                    error_msg = response.text
                    await self.log_action("EMAIL_ERROR", error_msg)
                    return {"success": False, "error": error_msg}
        except Exception as e:
            await self.log_action("EMAIL_ERROR", str(e))
            return {"success": False, "error": str(e)}
    
    async def send_batch_emails(self, emails: List[Dict]):
        """Envia múltiplos emails (até 100)"""
        try:
            async with httpx.AsyncClient() as client:
                payload = {"messages": emails}
                
                response = await client.post(
                    f"{self.api_url}/emails/batch",
                    json=payload,
                    headers=self._auth_headers(),
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    await self.log_action("BATCH_EMAILS_SENT", f"{len(emails)} emails enviados em lote")
                    return {"success": True, "data": data}
                else:
                    error_msg = response.text
                    await self.log_action("BATCH_ERROR", error_msg)
                    return {"success": False, "error": error_msg}
        except Exception as e:
            await self.log_action("BATCH_ERROR", str(e))
            return {"success": False, "error": str(e)}
    
    async def list_emails(self, limit: int = 50, offset: int = 0):
        """Lista todos os emails enviados"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/emails?limit={limit}&offset={offset}",
                    headers=self._auth_headers(),
                    timeout=30
                )
                
                if response.status_code == 200:
                    return {"success": True, "data": response.json()}
                else:
                    return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def get_email(self, email_id: str):
        """Obtém detalhes de um email específico"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/emails/{email_id}",
                    headers=self._auth_headers(),
                    timeout=30
                )
                
                if response.status_code == 200:
                    return {"success": True, "data": response.json()}
                else:
                    return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ==================== TEMPLATES ====================
    async def create_template(self, name: str, from_email: str, subject: str, html: str, **extra):
        """Cria um novo template via Resend"""
        try:
            async with httpx.AsyncClient() as client:
                payload: Dict[str, Any] = {"name": name}
                if html:
                    payload["html"] = _fix_resend_variables(html)
                if subject:
                    payload["subject"] = subject
                if from_email:
                    payload["from"] = from_email
                payload.update({k: v for k, v in extra.items() if v is not None})

                response = await client.post(
                    f"{self.api_url}/templates",
                    json=payload,
                    headers=self._auth_headers(),
                    timeout=30,
                )

                if response.status_code in (200, 201):
                    data = response.json()
                    template_id = data.get("id")
                    config.templates[template_id] = {
                        "id": template_id,
                        "name": name,
                        "from_email": from_email,
                        "subject": subject,
                        "created_at": data.get("created_at", datetime.now().isoformat()),
                    }
                    await self.log_action("TEMPLATE_CREATED", f"Template '{name}' criado", {"template_id": template_id})
                    return {"success": True, "id": template_id, "data": data}
                else:
                    error_msg = response.text
                    await self.log_action("TEMPLATE_ERROR", error_msg)
                    return {"success": False, "error": error_msg}
        except Exception as e:
            await self.log_action("TEMPLATE_ERROR", str(e))
            return {"success": False, "error": str(e)}

    async def list_templates(self, limit: int = 50):
        """Lista todos os templates via Resend"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/templates?limit={limit}",
                    headers=self._auth_headers(),
                    timeout=30,
                )
                if response.status_code == 200:
                    return {"success": True, "data": response.json()}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def get_template(self, template_id: str):
        """Obtém um template específico via Resend"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/templates/{template_id}",
                    headers=self._auth_headers(),
                    timeout=30,
                )
                if response.status_code == 200:
                    return {"success": True, "data": response.json()}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def update_template(self, template_id: str, **kwargs):
        """Atualiza um template via Resend (PATCH)"""
        try:
            # from_email → from para a API Resend
            payload: Dict[str, Any] = {}
            for k, v in kwargs.items():
                key = "from" if k == "from_email" else k
                if key == "html" and v:
                    payload[key] = _fix_resend_variables(v)
                else:
                    payload[key] = v

            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.api_url}/templates/{template_id}",
                    json=payload,
                    headers=self._auth_headers(),
                    timeout=30,
                )
                if response.status_code == 200:
                    await self.log_action("TEMPLATE_UPDATED", f"Template {template_id} atualizado")
                    try:
                        data = response.json() if response.content else {}
                    except Exception:
                        data = {}
                    return {"success": True, "data": data}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def delete_template(self, template_id: str):
        """Deleta um template via Resend"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.api_url}/templates/{template_id}",
                    headers=self._auth_headers(),
                    timeout=30,
                )
                if response.status_code == 200:
                    config.templates.pop(template_id, None)
                    await self.log_action("TEMPLATE_DELETED", f"Template {template_id} deletado")
                    try:
                        data = response.json() if response.content else {}
                    except Exception:
                        data = {}
                    return {"success": True, "data": data}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def publish_template(self, template_id: str):
        """Publica (ativa) um template draft via Resend"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/templates/{template_id}/publish",
                    json={},
                    headers=self._auth_headers(),
                    timeout=30,
                )
                if response.status_code in (200, 201):
                    await self.log_action("TEMPLATE_PUBLISHED", f"Template {template_id} publicado")
                    try:
                        data = response.json() if response.content else {}
                    except Exception:
                        data = {}
                    return {"success": True, "data": data}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def duplicate_template(self, template_id: str):
        """Duplica um template: Get → Create com nome + ' (Copy)'"""
        try:
            get_result = await self.get_template(template_id)
            if not get_result.get("success"):
                return get_result

            original = get_result["data"]
            new_name = f"{original.get('name', 'Template')} (Copy)"
            new_result = await self.create_template(
                name=new_name,
                from_email=original.get("from") or "",
                subject=original.get("subject") or "",
                html=original.get("html") or "<p>Nenhum conteúdo definido</p>",
            )
            if new_result.get("success"):
                await self.log_action("TEMPLATE_DUPLICATED", f"Template {template_id} duplicado como '{new_name}'")
            return new_result
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ==================== CONTATOS ====================
    async def create_contact(self, email: str, first_name: Optional[str] = None, last_name: Optional[str] = None, properties: Optional[Dict] = None):
        """Cria um novo contato"""
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "email": email,
                }
                if first_name:
                    payload["first_name"] = first_name
                if last_name:
                    payload["last_name"] = last_name
                if properties:
                    payload["properties"] = properties
                
                response = await client.post(
                    f"{self.api_url}/contacts",
                    json=payload,
                    headers=self._auth_headers(),
                    timeout=30
                )
                
                if response.status_code == 201:
                    data = response.json()
                    contact_id = data.get("id")
                    
                    config.contacts[contact_id] = {
                        "id": contact_id,
                        "email": email,
                        "first_name": first_name,
                        "last_name": last_name,
                        "properties": properties or {}
                    }
                    
                    await self.log_action("CONTACT_CREATED", f"Contato '{email}' criado", {"contact_id": contact_id})
                    return {"success": True, "id": contact_id, "data": data}
                else:
                    error_msg = response.text
                    await self.log_action("CONTACT_ERROR", error_msg)
                    return {"success": False, "error": error_msg}
        except Exception as e:
            await self.log_action("CONTACT_ERROR", str(e))
            return {"success": False, "error": str(e)}
    
    async def list_contacts(self, limit: int = 50):
        """Lista todos os contatos"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/contacts?limit={limit}",
                    headers=self._auth_headers(),
                    timeout=30
                )
                
                if response.status_code == 200:
                    return {"success": True, "data": response.json()}
                else:
                    return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def update_contact(self, audience_id: str, contact_id: str, fields: Dict[str, Any]):
        """Atualiza um contato via Resend (PATCH)"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.api_url}/audiences/{audience_id}/contacts/{contact_id}",
                    json=fields,
                    headers=self._auth_headers(),
                    timeout=30,
                )

                if response.status_code == 200:
                    await self.log_action("CONTACT_UPDATED", f"Contato {contact_id} atualizado")
                    try:
                        data = response.json() if response.content else {}
                    except Exception:
                        data = {}
                    return {"success": True, "data": data}
                return {"success": False, "error": response.text}
        except Exception as e:
            await self.log_action("CONTACT_UPDATE_ERROR", str(e))
            return {"success": False, "error": str(e)}

    async def delete_contact(self, audience_id: str, contact_id: str):
        """Deleta um contato via Resend"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.api_url}/audiences/{audience_id}/contacts/{contact_id}",
                    headers=self._auth_headers(),
                    timeout=30,
                )

                if response.status_code == 200 or response.status_code == 204:
                    # Tenta remover do config local também se existir
                    config.contacts.pop(contact_id, None)
                    await self.log_action("CONTACT_DELETED", f"Contato {contact_id} deletado")
                    try:
                        data = response.json() if response.content else {}
                    except Exception:
                        data = {}
                    return {"success": True, "data": data}
                return {"success": False, "error": response.text}
        except Exception as e:
            await self.log_action("CONTACT_DELETE_ERROR", str(e))
            return {"success": False, "error": str(e)}
    
    # ==================== TRANSMISSÕES ====================
    async def create_broadcast(
        self,
        name: str,
        from_email: str,
        subject: str,
        html: str,
        reply_to: Optional[str] = None,
        preview_text: Optional[str] = None,
        audience_id: Optional[str] = None,
        scheduled_at: Optional[str] = None,
    ):
        """Cria uma nova transmissão via Resend"""
        try:
            async with httpx.AsyncClient() as client:
                payload: Dict[str, Any] = {
                    "name": name,
                    "from": from_email,
                    "subject": subject,
                    "html": html,
                }
                if reply_to:
                    payload["reply_to"] = reply_to
                if preview_text:
                    payload["preview_text"] = preview_text
                if audience_id:
                    payload["audience_id"] = audience_id
                if scheduled_at:
                    payload["scheduled_at"] = scheduled_at

                response = await client.post(
                    f"{self.api_url}/broadcasts",
                    json=payload,
                    headers=self._auth_headers(),
                    timeout=30,
                )

                if response.status_code in (200, 201):
                    data = response.json()
                    broadcast_id = data.get("id")

                    config.broadcasts[broadcast_id] = {
                        "id": broadcast_id,
                        "name": name,
                        "from_email": from_email,
                        "subject": subject,
                        "status": data.get("status", "draft"),
                        "created_at": data.get("created_at", datetime.now().isoformat()),
                    }

                    await self.log_action("BROADCAST_CREATED", f"Transmissão '{name}' criada", {"broadcast_id": broadcast_id})
                    return {"success": True, "id": broadcast_id, "data": data}
                else:
                    error_msg = response.text
                    await self.log_action("BROADCAST_ERROR", error_msg)
                    return {"success": False, "error": error_msg}
        except Exception as e:
            await self.log_action("BROADCAST_ERROR", str(e))
            return {"success": False, "error": str(e)}

    async def list_broadcasts(self, limit: int = 50):
        """Lista todas as transmissões via Resend"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/broadcasts?limit={limit}",
                    headers=self._auth_headers(),
                    timeout=30,
                )

                if response.status_code == 200:
                    return {"success": True, "data": response.json()}
                else:
                    return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def get_broadcast(self, broadcast_id: str):
        """Obtém detalhes de uma transmissão específica via Resend"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/broadcasts/{broadcast_id}",
                    headers=self._auth_headers(),
                    timeout=30,
                )

                if response.status_code == 200:
                    return {"success": True, "data": response.json()}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def update_broadcast(self, broadcast_id: str, fields: Dict[str, Any]):
        """Atualiza uma transmissão via Resend (PATCH)"""
        try:
            # Renomeia from_email → from para a API Resend
            payload = {}
            for k, v in fields.items():
                key = "from" if k == "from_email" else k
                payload[key] = v

            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.api_url}/broadcasts/{broadcast_id}",
                    json=payload,
                    headers=self._auth_headers(),
                    timeout=30,
                )

                if response.status_code == 200:
                    await self.log_action("BROADCAST_UPDATED", f"Transmissão {broadcast_id} atualizada")
                    try:
                        data = response.json() if response.content else {}
                    except Exception:
                        data = {}
                    return {"success": True, "data": data}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def delete_broadcast(self, broadcast_id: str):
        """Deleta uma transmissão via Resend"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.api_url}/broadcasts/{broadcast_id}",
                    headers=self._auth_headers(),
                    timeout=30,
                )

                if response.status_code == 200:
                    config.broadcasts.pop(broadcast_id, None)
                    await self.log_action("BROADCAST_DELETED", f"Transmissão {broadcast_id} deletada")
                    try:
                        data = response.json() if response.content else {}
                    except Exception:
                        data = {}
                    return {"success": True, "data": data}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def send_broadcast(self, broadcast_id: str, scheduled_at: Optional[str] = None):
        """Envia (ou agenda) uma transmissão via Resend"""
        try:
            payload: Dict[str, Any] = {}
            if scheduled_at:
                payload["scheduled_at"] = scheduled_at

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/broadcasts/{broadcast_id}/send",
                    json=payload,
                    headers=self._auth_headers(),
                    timeout=30,
                )

                if response.status_code in (200, 201):
                    await self.log_action("BROADCAST_SENT", f"Transmissão {broadcast_id} enviada")
                    try:
                        data = response.json() if response.content else {}
                    except Exception:
                        data = {}
                    return {"success": True, "data": data}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ==================== DOMÍNIOS ====================
    # API Resend: https://resend.com/docs/api-reference/domains/create-domain
    async def create_domain(
        self,
        name: str,
        region: Optional[str] = None,
        custom_return_path: Optional[str] = None,
    ):
        """Cria um novo domínio (body JSON usa a chave `name`, não `domain`)."""
        try:
            clean_name = normalize_domain_name(name or "")
            if not clean_name:
                return {"success": False, "error": "Informe o nome do domínio."}

            rp = (custom_return_path or "").strip() or "send"
            rp_err = _validate_custom_return_path(rp)
            if rp_err:
                return {"success": False, "error": rp_err}

            async with httpx.AsyncClient() as client:
                # Pelo menos uma capability ativa (Resend); envio é o caso típico.
                payload: Dict[str, Any] = {
                    "name": clean_name,
                    "capabilities": {"sending": "enabled", "receiving": "disabled"},
                }
                if region:
                    payload["region"] = region
                payload["custom_return_path"] = rp

                response = await client.post(
                    f"{self.api_url}/domains",
                    json=payload,
                    headers=self._auth_headers(),
                    timeout=30,
                )

                if response.status_code == 201:
                    data = response.json()
                    domain_id = data.get("id")

                    config.domains[domain_id] = {
                        "id": domain_id,
                        "name": clean_name,
                        "status": str(data.get("status", "not_started")),
                        "created_at": datetime.now().isoformat(),
                    }

                    await self.log_action(
                        "DOMAIN_CREATED",
                        f"Domínio '{clean_name}' criado",
                        {"domain_id": domain_id},
                    )
                    return {"success": True, "id": domain_id, "data": data}
                else:
                    error_msg = response.text
                    await self.log_action("DOMAIN_ERROR", error_msg)
                    return {"success": False, "error": error_msg}
        except Exception as e:
            await self.log_action("DOMAIN_ERROR", str(e))
            return {"success": False, "error": str(e)}

    async def list_domains(self):
        """Lista todos os domínios"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/domains",
                    headers=self._auth_headers(),
                    timeout=30,
                )

                if response.status_code == 200:
                    return {"success": True, "data": response.json()}
                else:
                    return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def get_domain(self, domain_id: str):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/domains/{domain_id}",
                    headers=self._auth_headers(),
                    timeout=30,
                )
                if response.status_code == 200:
                    return {"success": True, "data": response.json()}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def verify_domain(self, domain_id: str):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/domains/{domain_id}/verify",
                    headers=self._auth_headers(),
                    json={},
                    timeout=30,
                )
                if response.status_code in (200, 201):
                    return {"success": True, "data": response.json()}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def update_domain(self, domain_id: str, fields: Dict[str, Any]):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.api_url}/domains/{domain_id}",
                    json=fields,
                    headers=self._auth_headers(),
                    timeout=30,
                )
                if response.status_code == 200:
                    try:
                        if not response.content:
                            return {"success": True, "data": {}}
                        return {"success": True, "data": response.json()}
                    except Exception:
                        return {"success": True, "data": {}}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def delete_domain(self, domain_id: str):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.api_url}/domains/{domain_id}",
                    headers=self._auth_headers(),
                    timeout=30,
                )
                if response.status_code == 200:
                    return {"success": True, "data": response.json()}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def create_tracking_domain(self, domain_id: str, subdomain: str):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/domains/{domain_id}/tracking-domains",
                    json={"subdomain": subdomain},
                    headers=self._auth_headers(),
                    timeout=30,
                )
                if response.status_code == 201:
                    return {"success": True, "data": response.json()}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def list_tracking_domains(self, domain_id: str):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/domains/{domain_id}/tracking-domains",
                    headers=self._auth_headers(),
                    timeout=30,
                )
                if response.status_code == 200:
                    return {"success": True, "data": response.json()}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def get_tracking_domain(self, domain_id: str, tracking_domain_id: str):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/domains/{domain_id}/tracking-domains/{tracking_domain_id}",
                    headers=self._auth_headers(),
                    timeout=30,
                )
                if response.status_code == 200:
                    return {"success": True, "data": response.json()}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def verify_tracking_domain(self, domain_id: str, tracking_domain_id: str):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/domains/{domain_id}/tracking-domains/{tracking_domain_id}/verify",
                    headers=self._auth_headers(),
                    json={},
                    timeout=30,
                )
                if response.status_code in (200, 201):
                    return {"success": True, "data": response.json()}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def delete_tracking_domain(self, domain_id: str, tracking_domain_id: str):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.api_url}/domains/{domain_id}/tracking-domains/{tracking_domain_id}",
                    headers=self._auth_headers(),
                    timeout=30,
                )
                if response.status_code == 200:
                    return {"success": True, "data": response.json()}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ==================== WEBHOOKS ====================
    async def create_webhook(self, url: str, events: List[str]):
        """Cria um novo webhook"""
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "url": url,
                    "events": events
                }
                
                response = await client.post(
                    f"{self.api_url}/webhooks",
                    json=payload,
                    headers=self._auth_headers(),
                    timeout=30
                )
                
                if response.status_code == 201:
                    data = response.json()
                    webhook_id = data.get("id")
                    
                    config.webhooks[webhook_id] = {
                        "id": webhook_id,
                        "url": url,
                        "events": events,
                        "created_at": datetime.now().isoformat()
                    }
                    
                    await self.log_action("WEBHOOK_CREATED", f"Webhook criado para {url}", {"webhook_id": webhook_id})
                    return {"success": True, "id": webhook_id, "data": data}
                else:
                    error_msg = response.text
                    await self.log_action("WEBHOOK_ERROR", error_msg)
                    return {"success": False, "error": error_msg}
        except Exception as e:
            await self.log_action("WEBHOOK_ERROR", str(e))
            return {"success": False, "error": str(e)}
    
    async def list_webhooks(self):
        """Lista todos os webhooks"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/webhooks",
                    headers=self._auth_headers(),
                    timeout=30
                )
                
                if response.status_code == 200:
                    return {"success": True, "data": response.json()}
                else:
                    return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ==================== API KEYS ====================
    async def list_api_keys(self):
        """Lista todas as chaves de API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/api-keys",
                    headers=self._auth_headers(),
                    timeout=30
                )
                if response.status_code == 200:
                    return {"success": True, "data": response.json().get("data", [])}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def create_api_key(self, name: str, permission: str = "full_access"):
        """Cria uma nova chave de API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/api-keys",
                    json={"name": name, "permission": permission},
                    headers=self._auth_headers(),
                    timeout=30
                )
                if response.status_code == 201:
                    return {"success": True, "data": response.json()}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def delete_api_key(self, api_key_id: str):
        """Deleta uma chave de API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.api_url}/api-keys/{api_key_id}",
                    headers=self._auth_headers(),
                    timeout=30
                )
                if response.status_code == 200:
                    return {"success": True}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ==================== PÚBLICOS (AUDIENCES) ====================
    async def list_audiences(self):
        """Lista todos os públicos"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/audiences",
                    headers=self._auth_headers(),
                    timeout=30
                )
                if response.status_code == 200:
                    return {"success": True, "data": response.json().get("data", [])}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def create_audience(self, name: str):
        """Cria um novo público"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/audiences",
                    json={"name": name},
                    headers=self._auth_headers(),
                    timeout=30
                )
                if response.status_code == 201:
                    return {"success": True, "data": response.json()}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def delete_audience(self, audience_id: str):
        """Deleta um público"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.api_url}/audiences/{audience_id}",
                    headers=self._auth_headers(),
                    timeout=30
                )
                if response.status_code == 200:
                    return {"success": True}
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ==================== USO (QUOTA) ====================
    async def get_usage(self):
        """Obtém limites de uso via headers de uma requisição simples"""
        try:
            async with httpx.AsyncClient() as client:
                # Fazemos um GET simples para pegar os headers
                response = await client.get(
                    f"{self.api_url}/emails?limit=1",
                    headers=self._auth_headers(),
                    timeout=30
                )
                headers = response.headers
                
                # Resend headers podem variar dependendo do proxy/cliente. 
                # Tentamos variações comuns.
                def get_h(names):
                    for n in names:
                        val = headers.get(n)
                        if val is not None: return val
                    return "0"

                return {
                    "success": True,
                    "data": {
                        "daily_quota": get_h(["x-resend-daily-quota", "X-Resend-Daily-Quota", "daily-quota"]),
                        "monthly_quota": get_h(["x-resend-monthly-quota", "X-Resend-Monthly-Quota", "monthly-quota"]),
                        "ratelimit_limit": get_h(["ratelimit-limit", "x-ratelimit-limit", "X-RateLimit-Limit", "ratelimit-limit-emails"]),
                        "ratelimit_remaining": get_h(["ratelimit-remaining", "x-ratelimit-remaining", "X-RateLimit-Remaining", "ratelimit-remaining-emails"]),
                        "ratelimit_reset": get_h(["ratelimit-reset", "x-ratelimit-reset", "X-RateLimit-Reset", "ratelimit-reset-emails"])
                    }
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ==================== LOGS ====================
    async def list_logs(self, limit: int = 50):
        """Lista todos os logs"""
        return {
            "success": True,
            "data": {
                "data": config.logs[-limit:] if limit < len(config.logs) else config.logs,
                "object": "list"
            }
        }

# Instância global
resend_service = ResendService()
