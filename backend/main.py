from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from resend_key_context import ResendApiKeyMiddleware
from auth import verify_token

# Import routers
from routes.auth import router as auth_router
from routes.campaigns import router as campaigns_router
from routes.emails import router as emails_router
from routes.templates import router as templates_router
from routes.contacts import router as contacts_router
from routes.broadcasts import router as broadcasts_router
from routes.domains import router as domains_router
from routes.logs import router as logs_router
from routes.webhooks import router as webhooks_router
from routes.metrics import router as metrics_router
from routes.settings import router as settings_router
from routes.audiences import router as audiences_router

app = FastAPI(
    title="Painel Resend Email",
    description="Sistema de Envio de Emails via Resend",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(ResendApiKeyMiddleware)

# Registrar rota de autenticação (Pública)
app.include_router(auth_router)

# Dependência global para as rotas protegidas
protected_routes = [Depends(verify_token)]

# Registrar rotas protegidas
app.include_router(audiences_router, dependencies=protected_routes)
app.include_router(campaigns_router, dependencies=protected_routes)
app.include_router(emails_router, dependencies=protected_routes)
app.include_router(templates_router, dependencies=protected_routes)
app.include_router(contacts_router, dependencies=protected_routes)
app.include_router(broadcasts_router, dependencies=protected_routes)
app.include_router(domains_router, dependencies=protected_routes)
app.include_router(logs_router, dependencies=protected_routes)
app.include_router(webhooks_router, dependencies=protected_routes)
app.include_router(metrics_router, dependencies=protected_routes)
app.include_router(settings_router, dependencies=protected_routes)

@app.get("/")
async def root():
    return {
        "message": "Painel Resend Email API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
