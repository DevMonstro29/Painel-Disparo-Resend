from fastapi import APIRouter, HTTPException, Depends
from models import ContactModel, SegmentModel, TopicModel
from services.resend_service import resend_service
from typing import List, Optional
from pydantic import BaseModel

class AudienceCreate(BaseModel):
    name: str

router = APIRouter(prefix="/audiences", tags=["audiences"])

# ==================== PÚBLICOS (AUDIENCES) ====================
@router.get("/list")
async def list_audiences():
    """Lista todos os públicos da conta"""
    result = await resend_service.list_audiences()
    if result.get("success"):
        return result
    raise HTTPException(status_code=500, detail=result.get("error"))

@router.post("/create")
async def create_audience(audience: AudienceCreate):
    """Cria um novo público"""
    result = await resend_service.create_audience(audience.name)
    if result.get("success"):
        return result
    raise HTTPException(status_code=500, detail=result.get("error"))

@router.delete("/{audience_id}")
async def delete_audience(audience_id: str):
    """Remove um público"""
    result = await resend_service.delete_audience(audience_id)
    if result.get("success"):
        return result
    raise HTTPException(status_code=500, detail=result.get("error"))

# ==================== CONTATOS EM PÚBLICOS ====================
@router.get("/{audience_id}/contacts")
async def list_audience_contacts(audience_id: str):
    """Lista contatos de um público específico"""
    # Nota: A API da Resend usa o endpoint /audiences/{id}/contacts
    try:
        from services.resend_service import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{resend_service.api_url}/audiences/{audience_id}/contacts",
                headers=resend_service._auth_headers(),
                timeout=30
            )
            if response.status_code == 200:
                return {"success": True, "data": response.json().get("data", [])}
            raise HTTPException(status_code=response.status_code, detail=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{audience_id}/contacts")
async def create_audience_contact(audience_id: str, contact: ContactModel):
    """Adiciona um contato a um público"""
    try:
        from services.resend_service import httpx
        payload = {
            "email": contact.email,
            "first_name": contact.first_name,
            "last_name": contact.last_name,
            "unsubscribed": False
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{resend_service.api_url}/audiences/{audience_id}/contacts",
                json=payload,
                headers=resend_service._auth_headers(),
                timeout=30
            )
            if response.status_code == 201:
                return {"success": True, "data": response.json()}
            raise HTTPException(status_code=response.status_code, detail=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== SEGMENTOS & TÓPICOS ====================
# (Implementaremos conforme a necessidade da UI e limites da API Resend)
