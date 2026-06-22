import os
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel
import resend
from typing import List, Optional
from database import save_webhook_event, get_webhook_history

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

# Resend API Key setup
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
resend.api_key = RESEND_API_KEY

class WebhookCreate(BaseModel):
    url: str
    events: List[str]

# ─── Endpoints de Gerenciamento (Resend API) ──────────────────────────────────

@router.get("/")
async def list_webhooks():
    try:
        webhooks = resend.Webhooks.list()
        return {"data": webhooks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_webhook(webhook: WebhookCreate):
    try:
        new_webhook = resend.Webhooks.create({
            "url": webhook.url,
            "events": webhook.events
        })
        return {"data": new_webhook}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{webhook_id}")
async def delete_webhook(webhook_id: str):
    try:
        resend.Webhooks.remove(webhook_id)
        return {"message": "Webhook removido"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── Endpoint de Histórico (Local SQLite) ──────────────────────────────────

@router.get("/history")
async def get_history(limit: int = 50):
    try:
        history = get_webhook_history(limit)
        return {"data": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── Recebimento de Webhooks (Público) ──────────────────────────────────────

@router.post("/receive")
async def receive_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Endpoint público para capturar eventos da Resend.
    """
    payload = await request.json()
    
    # Processamento em background para resposta rápida à Resend
    background_tasks.add_task(process_webhook_event, payload)
    
    return {"status": "received"}

def process_webhook_event(payload: dict):
    try:
        event_id = payload.get("id")
        event_type = payload.get("type", "unknown")
        created_at = payload.get("created_at") or datetime.now().isoformat()
        
        # Salvar no banco local
        save_webhook_event(event_id, event_type, created_at, payload.get("data", {}))
        
        print(f"Webhook recebido e salvo: {event_type} ({event_id})")
    except Exception as e:
        print(f"Erro ao processar webhook: {e}")
