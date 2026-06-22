import os

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from config import config
from services.resend_service import resend_service

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/server-key-configured")

async def server_key_configured():
    """Indica se o servidor tem RESEND_API_KEY (sem revelar o valor)."""
    env = (os.environ.get("RESEND_API_KEY") or "").strip()
    cfg = (getattr(config, "RESEND_API_KEY", "") or "").strip()
    return {"configured": bool(env or cfg)}

class AdminCredentials(BaseModel):
    username: str
    password: str

class ResendKeyUpdate(BaseModel):
    api_key: str

@router.post("/admin-credentials")
async def update_admin_credentials(creds: AdminCredentials):
    from argon2 import PasswordHasher
    ph = PasswordHasher()
    hashed = ph.hash(creds.password)
    
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    try:
        with open(env_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except FileNotFoundError:
        lines = []

    username_found = False
    password_found = False
    new_lines = []
    
    for line in lines:
        if line.startswith("ADMIN_USERNAME="):
            new_lines.append(f"ADMIN_USERNAME={creds.username}\n")
            username_found = True
        elif line.startswith("ADMIN_PASSWORD_HASH="):
            new_lines.append(f"ADMIN_PASSWORD_HASH='{hashed}'\n")
            password_found = True
        else:
            new_lines.append(line)
            
    if not username_found:
        new_lines.append(f"ADMIN_USERNAME={creds.username}\n")
    if not password_found:
        new_lines.append(f"ADMIN_PASSWORD_HASH='{hashed}'\n")
        
    with open(env_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
        
    config.ADMIN_USERNAME = creds.username
    config.ADMIN_PASSWORD_HASH = hashed
    
    return {"message": "Credenciais atualizadas com sucesso"}

@router.post("/resend-key")
async def update_resend_key(data: ResendKeyUpdate):
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    try:
        with open(env_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except FileNotFoundError:
        lines = []

    key_found = False
    new_lines = []
    
    for line in lines:
        if line.startswith("RESEND_API_KEY="):
            new_lines.append(f"RESEND_API_KEY={data.api_key}\n")
            key_found = True
        else:
            new_lines.append(line)
            
    if not key_found:
        new_lines.append(f"RESEND_API_KEY={data.api_key}\n")
        
    with open(env_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
        
    config.RESEND_API_KEY = data.api_key
    os.environ["RESEND_API_KEY"] = data.api_key
    return {"message": "RESEND_API_KEY atualizada com sucesso"}

# ==================== API KEYS ====================
@router.get("/api-keys")
async def list_api_keys():
    """Lista as chaves de API da conta"""
    result = await resend_service.list_api_keys()
    if result.get("success"):
        return result
    raise HTTPException(status_code=500, detail=result.get("error"))

@router.post("/api-keys")
async def create_api_key(name: str):
    """Cria uma nova chave de API"""
    result = await resend_service.create_api_key(name)
    if result.get("success"):
        return result
    raise HTTPException(status_code=500, detail=result.get("error"))

@router.delete("/api-keys/{key_id}")
async def delete_api_key(key_id: str):
    """Deleta uma chave de API"""
    result = await resend_service.delete_api_key(key_id)
    if result.get("success"):
        return result
    raise HTTPException(status_code=500, detail=result.get("error"))

# ==================== USO (QUOTA) ====================
@router.get("/usage")
async def get_usage():
    """Obtém limites de uso e cotas em tempo real"""
    result = await resend_service.get_usage()
    if result.get("success"):
        return result
    raise HTTPException(status_code=500, detail=result.get("error"))
