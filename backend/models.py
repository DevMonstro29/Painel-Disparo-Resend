from pydantic import BaseModel, Field, field_validator, AliasChoices
from typing import Optional, List, Dict, Any

from domain_utils import normalize_domain_name
from datetime import datetime

# TEMPLATES
class TemplateModel(BaseModel):
    name: str
    from_email: str
    subject: str
    html: str
    id: Optional[str] = None
    created_at: Optional[str] = None

# CONTATOS
class ContactModel(BaseModel):
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    unsubscribed: Optional[bool] = None
    id: Optional[str] = None

class PropertyModel(BaseModel):
    key: str
    value: str
    id: Optional[str] = None
    created_at: Optional[str] = None

class ApiKeyModel(BaseModel):
    name: str
    permission: Optional[str] = "full_access" # or "sending_access"
    id: Optional[str] = None
    token: Optional[str] = None
    created_at: Optional[str] = None

class UsageModel(BaseModel):
    quota: int
    used: int
    remaining: int
    rate_limit: int
    reset_at: Optional[str] = None

class SegmentModel(BaseModel):
    name: str
    description: Optional[str] = None
    id: Optional[str] = None

class TopicModel(BaseModel):
    name: str
    unsubscribed: bool = False
    id: Optional[str] = None

# CAMPANHAS
class CampaignModel(BaseModel):
    name: str
    template_id: str
    recipients: List[str]
    id: Optional[str] = None

class SendEmailRequest(BaseModel):
    to: List[str]
    subject: str
    html: str
    from_email: str
    reply_to: Optional[str] = None

# EMAILS ENVIADOS
class SentEmailModel(BaseModel):
    to: str
    subject: str
    status: str
    id: Optional[str] = None
    created_at: Optional[str] = None

# TRANSMISSÕES
class BroadcastModel(BaseModel):
    name: str
    from_email: str
    subject: str
    html: str
    id: Optional[str] = None
    recipient_list_id: Optional[str] = None
    scheduled_at: Optional[str] = None

# DOMÍNIOS
class DomainModel(BaseModel):
    name: str
    status: str = "not_verified"
    id: Optional[str] = None
    dkim_status: Optional[str] = None
    dmarc_status: Optional[str] = None
    spf_status: Optional[str] = None


class DomainCreateRequest(BaseModel):
    """Corpo para POST /domains/create — alinhado à API Resend (campo `name`)."""

    name: str = Field(
        ...,
        validation_alias=AliasChoices("name", "domain"),
        description="Nome do domínio (aceita `name` ou `domain` no JSON).",
    )
    region: Optional[str] = None
    custom_return_path: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_nonempty_after_strip(cls, v: str) -> str:
        s = normalize_domain_name(v or "")
        if not s:
            raise ValueError("Informe o nome do domínio.")
        return s


class DomainUpdateBody(BaseModel):
    open_tracking: Optional[bool] = None
    click_tracking: Optional[bool] = None
    tls: Optional[str] = None
    capabilities: Optional[Dict[str, Any]] = None


class TrackingDomainCreateBody(BaseModel):
    subdomain: str

# WEBHOOKS
class WebhookModel(BaseModel):
    url: str
    events: List[str]
    id: Optional[str] = None

# LOGS
class LogModel(BaseModel):
    timestamp: str
    event_type: str
    message: str
    id: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

# MÉTRICAS
class MetricsModel(BaseModel):
    deliverability_rate: float
    bounce_rate: float
    complaint_rate: float
