from fastapi import APIRouter, HTTPException
from typing import List
from models import SendEmailRequest, CampaignModel
from services.resend_service import resend_service

router = APIRouter(prefix="/campaigns", tags=["campaigns"])

@router.post("/send")
async def send_campaign(request: SendEmailRequest):
    """Envia uma campanha para um ou múltiplos contatos"""
    try:
        result = await resend_service.send_email(
            to=request.to,
            subject=request.subject,
            html=request.html,
            from_email=request.from_email,
            reply_to=request.reply_to
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send-batch")
async def send_batch_campaign(emails: List[dict]):
    """Envia uma campanha em lote (até 100 contatos)"""
    try:
        if len(emails) > 100:
            raise HTTPException(status_code=400, detail="Limite máximo de 100 emails por lote")
        
        result = await resend_service.send_batch_emails(emails)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_campaigns():
    """Lista todas as campanhas"""
    return {"success": True, "data": []}

@router.post("/create")
async def create_campaign(campaign: CampaignModel):
    """Cria uma nova campanha"""
    try:
        return {"success": True, "data": campaign}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
