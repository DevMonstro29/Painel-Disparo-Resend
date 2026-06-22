from models import SendEmailRequest
from services.resend_service import resend_service
from fastapi import APIRouter, HTTPException, UploadFile, File
import csv
import io

router = APIRouter(prefix="/emails", tags=["emails"])

@router.get("/sent")
async def list_sent_emails(limit: int = 50, offset: int = 0):
    """Lista todos os emails enviados"""
    try:
        result = await resend_service.list_emails(limit=limit, offset=offset)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sent/{email_id}")
async def get_sent_email(email_id: str):
    """Obtém detalhes de um email enviado"""
    try:
        result = await resend_service.get_email(email_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/received")
async def list_received_emails(limit: int = 50):
    """Lista todos os emails recebidos"""
    try:
        # Pode ser implementado quando a API suportar
        return {"success": True, "data": {"data": []}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_email_stats():
    """Obtém estatísticas de emails"""
    return {
        "total_sent": 0,
        "total_received": 0,
        "bounced": 0,
        "complained": 0
    }

# ==================== ENVIO ====================
@router.post("/send")
async def send_email(req: SendEmailRequest):
    """Envia um email unitário"""
    result = await resend_service.send_email(
        to=req.to,
        subject=req.subject,
        html=req.html,
        from_email=req.from_email,
        reply_to=req.reply_to
    )
    if result.get("success"):
        return result
    raise HTTPException(status_code=500, detail=result.get("error"))

@router.post("/batch-send")
async def batch_send_emails(emails: list):
    """Envia múltiplos emails via JSON"""
    result = await resend_service.send_batch_emails(emails)
    if result.get("success"):
        return result
    raise HTTPException(status_code=500, detail=result.get("error"))

@router.post("/batch-send-csv")
async def batch_send_csv(
    from_email: str,
    subject: str,
    html: str,
    file: UploadFile = File(...)
):
    """Processa um CSV e envia emails em lote"""
    try:
        content = await file.read()
        stream = io.StringIO(content.decode('utf-8'))
        reader = csv.DictReader(stream)
        
        emails_to_send = []
        for row in reader:
            if 'email' in row:
                emails_to_send.append({
                    "from": from_email,
                    "to": [row['email']],
                    "subject": subject,
                    "html": html
                })
        
        if not emails_to_send:
            raise HTTPException(status_code=400, detail="CSV sem coluna 'email' ou vazio")
            
        result = await resend_service.send_batch_emails(emails_to_send)
        if result.get("success"):
            return result
        raise HTTPException(status_code=500, detail=result.get("error"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
