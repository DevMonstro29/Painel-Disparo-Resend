import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env (especificando o caminho relativo)
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

class Config:
    # Opcional: chave padrão do servidor (cada utilizador pode enviar X-Resend-API-Key pelo painel)
    RESEND_API_KEY: str = (os.environ.get("RESEND_API_KEY") or "").strip()
    RESEND_API_URL = "https://api.resend.com"
    
    # Credenciais de Login Local
    ADMIN_USERNAME: str = (os.environ.get("ADMIN_USERNAME") or "admin").strip()
    ADMIN_PASSWORD_HASH: str = (os.environ.get("ADMIN_PASSWORD_HASH") or "").strip()
    JWT_SECRET_KEY: str = (os.environ.get("JWT_SECRET_KEY") or "super-secret-key-change-me").strip()
    
    # Cache em memória
    templates: dict = {}
    contacts: dict = {}
    broadcasts: dict = {}
    sent_emails: dict = {}
    segments: dict = {}
    topics: dict = {}
    logs: list = []
    webhooks: dict = {}
    domains: dict = {}
    
config = Config()
