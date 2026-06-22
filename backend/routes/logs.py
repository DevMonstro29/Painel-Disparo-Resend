from fastapi import APIRouter, HTTPException
from services.resend_service import resend_service

router = APIRouter(prefix="/logs", tags=["logs"])

@router.get("/list")
async def list_logs(limit: int = 50, offset: int = 0):
    """Lista todos os logs"""
    try:
        result = await resend_service.list_logs(limit=limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{log_id}")
async def get_log(log_id: str):
    """Obtém um log específico"""
    from config import config
    logs = [log for log in config.logs if log.get("id") == log_id]
    if logs:
        return {"success": True, "data": logs[0]}
    else:
        raise HTTPException(status_code=404, detail="Log não encontrado")
