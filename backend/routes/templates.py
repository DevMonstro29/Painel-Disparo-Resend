from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from services.resend_service import resend_service

router = APIRouter(prefix="/templates", tags=["templates"])


# ==================== SCHEMAS ====================

class TemplateCreateRequest(BaseModel):
    name: str = Field(..., min_length=1)
    subject: Optional[str] = None
    html: Optional[str] = None
    from_email: Optional[str] = None
    preview_text: Optional[str] = None


class TemplateUpdateRequest(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    html: Optional[str] = None
    from_email: Optional[str] = None
    preview_text: Optional[str] = None


# ==================== ENDPOINTS ====================

@router.post("")
async def create_template(body: TemplateCreateRequest):
    """Cria um novo template via Resend"""
    try:
        result = await resend_service.create_template(
            name=body.name,
            from_email=body.from_email or "",
            subject=body.subject or "",
            html=body.html or "",
        )
        if not result.get("success"):
            raise HTTPException(status_code=422, detail=result.get("error", "Erro ao criar template"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def list_templates(limit: int = 50):
    """Lista todos os templates via Resend"""
    try:
        result = await resend_service.list_templates(limit=limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{template_id}")
async def get_template(template_id: str):
    """Obtém um template específico via Resend"""
    try:
        result = await resend_service.get_template(template_id)
        if not result.get("success"):
            raise HTTPException(status_code=404, detail=result.get("error", "Template não encontrado"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{template_id}")
async def update_template(template_id: str, body: TemplateUpdateRequest):
    """Atualiza um template via Resend (PATCH)"""
    try:
        fields = {k: v for k, v in body.model_dump().items() if v is not None}
        if not fields:
            raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
        result = await resend_service.update_template(template_id, **fields)
        if not result.get("success"):
            raise HTTPException(status_code=422, detail=result.get("error", "Erro ao atualizar"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{template_id}")
async def update_template_put(template_id: str, body: TemplateUpdateRequest):
    """Alias PUT → PATCH para compatibilidade com cliente legado"""
    return await update_template(template_id, body)


@router.delete("/{template_id}")
async def delete_template(template_id: str):
    """Deleta um template via Resend"""
    try:
        result = await resend_service.delete_template(template_id)
        if not result.get("success"):
            raise HTTPException(status_code=422, detail=result.get("error", "Erro ao deletar"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{template_id}/publish")
async def publish_template(template_id: str):
    """Publica (ativa) um template via Resend"""
    try:
        result = await resend_service.publish_template(template_id)
        if not result.get("success"):
            raise HTTPException(status_code=422, detail=result.get("error", "Erro ao publicar"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{template_id}/duplicate")
async def duplicate_template(template_id: str):
    """Duplica um template existente (Get → Create com novo nome)"""
    try:
        result = await resend_service.duplicate_template(template_id)
        if not result.get("success"):
            raise HTTPException(status_code=422, detail=result.get("error", "Erro ao duplicar"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Compat routes ────────────────────────────────────────────────────────────

@router.post("/create")
async def create_template_legacy(body: TemplateCreateRequest):
    return await create_template(body)


@router.get("/list")
async def list_templates_legacy(limit: int = 50):
    return await list_templates(limit)
