import time
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from config import config
from auth import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

# Rate limiting simples em memória
# formatação: Dicionário onde a key é o IP e o value é uma lista de timestamps (flops)
failed_attempts = {}

MAX_ATTEMPTS = 5
BLOCK_TIME_SECONDS = 300 # Bloqueia IP por 5 minutos

class LoginRequest(BaseModel):
    # Pode ser username ou e-mail na teoria, depende do usuário
    username: str
    password: str

@router.post("/login")
async def login(request: Request, body: LoginRequest):
    client_ip = request.client.host
    now = time.time()
    
    # Limpa tentativas antigas do histórico do IP atual
    if client_ip in failed_attempts:
        failed_attempts[client_ip] = [ts for ts in failed_attempts[client_ip] if now - ts < BLOCK_TIME_SECONDS]
        
        # Se ultrapassar o limite, recusa
        if len(failed_attempts[client_ip]) >= MAX_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Muitas tentativas falhas. Tente novamente mais tarde."
            )
            
    # Mensagem de erro padrão para evitar Account Enumeration
    invalid_credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Usuário ou senha incorretos."
    )

    if body.username != config.ADMIN_USERNAME:
        # Registra a falha
        failed_attempts.setdefault(client_ip, []).append(now)
        raise invalid_credentials_error
        
    if not verify_password(body.password, config.ADMIN_PASSWORD_HASH):
        # Registra a falha
        failed_attempts.setdefault(client_ip, []).append(now)
        raise invalid_credentials_error

    # Se estiver correto, limpa o histórico de falhas do IP
    if client_ip in failed_attempts:
        del failed_attempts[client_ip]

    # Gera o token
    access_token = create_access_token(data={"sub": config.ADMIN_USERNAME})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "username": config.ADMIN_USERNAME
    }
