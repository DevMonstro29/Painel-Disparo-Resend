from fastapi import APIRouter, HTTPException

from models import (
    DomainCreateRequest,
    DomainUpdateBody,
    TrackingDomainCreateBody,
)
from services.resend_service import resend_service

router = APIRouter(prefix="/domains", tags=["domains"])


@router.post("/create")
async def create_domain(body: DomainCreateRequest):
    """Cria domínio na Resend (JSON com `name`, opcionalmente `region` e `custom_return_path`)."""
    try:
        result = await resend_service.create_domain(
            body.name,
            region=body.region,
            custom_return_path=body.custom_return_path,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/list")
async def list_domains():
    try:
        return await resend_service.list_domains()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{domain_id}")
async def get_domain(domain_id: str):
    result = await resend_service.get_domain(domain_id)
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "Erro ao obter domínio"))
    return result


@router.post("/{domain_id}/verify")
async def verify_domain(domain_id: str):
    result = await resend_service.verify_domain(domain_id)
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "Erro na verificação"))
    return result


@router.patch("/{domain_id}")
async def update_domain(domain_id: str, body: DomainUpdateBody):
    payload = body.model_dump(exclude_none=True)
    if not payload:
        raise HTTPException(status_code=400, detail="Informe ao menos um campo para atualizar")
    result = await resend_service.update_domain(domain_id, payload)
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "Erro ao atualizar"))
    return result


@router.delete("/{domain_id}")
async def delete_domain(domain_id: str):
    result = await resend_service.delete_domain(domain_id)
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "Erro ao remover"))
    return result


@router.post("/{domain_id}/tracking-domains")
async def create_tracking_domain(domain_id: str, body: TrackingDomainCreateBody):
    result = await resend_service.create_tracking_domain(domain_id, body.subdomain)
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "Erro ao criar tracking domain"))
    return result


@router.get("/{domain_id}/tracking-domains")
async def list_tracking_domains(domain_id: str):
    result = await resend_service.list_tracking_domains(domain_id)
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "Erro ao listar tracking domains"))
    return result


@router.get("/{domain_id}/tracking-domains/{tracking_domain_id}")
async def get_tracking_domain(domain_id: str, tracking_domain_id: str):
    result = await resend_service.get_tracking_domain(domain_id, tracking_domain_id)
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "Erro ao obter tracking domain"))
    return result


@router.post("/{domain_id}/tracking-domains/{tracking_domain_id}/verify")
async def verify_tracking_domain(domain_id: str, tracking_domain_id: str):
    result = await resend_service.verify_tracking_domain(domain_id, tracking_domain_id)
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "Erro ao verificar tracking domain"))
    return result


@router.delete("/{domain_id}/tracking-domains/{tracking_domain_id}")
async def delete_tracking_domain(domain_id: str, tracking_domain_id: str):
    result = await resend_service.delete_tracking_domain(domain_id, tracking_domain_id)
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "Erro ao remover tracking domain"))
    return result
