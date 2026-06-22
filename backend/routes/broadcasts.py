from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from services.resend_service import resend_service

router = APIRouter(prefix="/broadcasts", tags=["broadcasts"])


# ==================== SCHEMAS ====================

class BroadcastCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, description="Nome da transmissão")
    from_email: str = Field(..., description="Endereço de e-mail remetente (ex: Sender <sender@domain.com>)")
    subject: str = Field(..., min_length=1, description="Assunto do e-mail")
    html: str = Field(..., min_length=1, description="Conteúdo HTML do e-mail")
    reply_to: Optional[str] = Field(None, description="E-mail para resposta")
    preview_text: Optional[str] = Field(None, description="Texto de preview")
    audience_id: str = Field(..., description="ID da audiência Resend")
    scheduled_at: Optional[str] = Field(None, description="Data/hora de envio agendado (ISO 8601)")


class BroadcastUpdateRequest(BaseModel):
    name: Optional[str] = None
    from_email: Optional[str] = None
    subject: Optional[str] = None
    html: Optional[str] = None
    reply_to: Optional[str] = None
    preview_text: Optional[str] = None
    audience_id: Optional[str] = None
    scheduled_at: Optional[str] = None


# ==================== ENDPOINTS ====================

@router.post("")
async def create_broadcast(body: BroadcastCreateRequest):
    """Cria uma nova transmissão na Resend"""
    try:
        result = await resend_service.create_broadcast(
            name=body.name,
            from_email=body.from_email,
            subject=body.subject,
            html=body.html,
            reply_to=body.reply_to,
            preview_text=body.preview_text,
            audience_id=body.audience_id,
            scheduled_at=body.scheduled_at,
        )
        if not result.get("success"):
            raise HTTPException(status_code=422, detail=result.get("error", "Erro ao criar transmissão"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def list_broadcasts(limit: int = 50):
    """Lista todas as transmissões"""
    try:
        result = await resend_service.list_broadcasts(limit=limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{broadcast_id}")
async def get_broadcast(broadcast_id: str):
    """Obtém detalhes de uma transmissão específica"""
    try:
        result = await resend_service.get_broadcast(broadcast_id=broadcast_id)
        if not result.get("success"):
            raise HTTPException(status_code=404, detail=result.get("error", "Transmissão não encontrada"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{broadcast_id}")
async def update_broadcast(broadcast_id: str, body: BroadcastUpdateRequest):
    """Atualiza uma transmissão existente"""
    try:
        fields = {k: v for k, v in body.model_dump().items() if v is not None}
        if not fields:
            raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
        result = await resend_service.update_broadcast(broadcast_id=broadcast_id, fields=fields)
        if not result.get("success"):
            raise HTTPException(status_code=422, detail=result.get("error", "Erro ao atualizar transmissão"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{broadcast_id}")
async def delete_broadcast(broadcast_id: str):
    """Remove uma transmissão"""
    try:
        result = await resend_service.delete_broadcast(broadcast_id=broadcast_id)
        if not result.get("success"):
            raise HTTPException(status_code=422, detail=result.get("error", "Erro ao deletar transmissão"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{broadcast_id}/send")
async def send_broadcast(broadcast_id: str, scheduled_at: Optional[str] = None):
    """Envia (ou agenda) uma transmissão"""
    try:
        result = await resend_service.send_broadcast(
            broadcast_id=broadcast_id,
            scheduled_at=scheduled_at,
        )
        if not result.get("success"):
            raise HTTPException(status_code=422, detail=result.get("error", "Erro ao enviar transmissão"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== COMPAT — rotas legadas ====================

@router.post("/create")
async def create_broadcast_legacy(body: BroadcastCreateRequest):
    """Alias legado — mantém compatibilidade com /broadcasts/create"""
    return await create_broadcast(body)


@router.get("/list")
async def list_broadcasts_legacy(limit: int = 50):
    """Alias legado — mantém compatibilidade com /broadcasts/list"""
    return await list_broadcasts(limit)
