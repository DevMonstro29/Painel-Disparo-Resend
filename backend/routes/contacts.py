from fastapi import APIRouter, HTTPException
from models import ContactModel, PropertyModel, SegmentModel, TopicModel
from services.resend_service import resend_service
from config import config

router = APIRouter(prefix="/contacts", tags=["contacts"])

# ==================== CONTATOS ====================
@router.post("/create")
async def create_contact(contact: ContactModel):
    """Cria um novo contato"""
    try:
        result = await resend_service.create_contact(
            email=contact.email,
            first_name=contact.first_name,
            last_name=contact.last_name,
            properties=contact.properties
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_contacts(limit: int = 50):
    """Lista todos os contatos"""
    try:
        result = await resend_service.list_contacts(limit=limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{audience_id}/{contact_id}")
async def update_contact(audience_id: str, contact_id: str, contact: ContactModel):
    """Atualiza um contato existente"""
    try:
        # Extrai apenas campos não nulos relevantes para o update
        update_fields = {}
        if contact.email: update_fields["email"] = contact.email
        if contact.first_name is not None: update_fields["first_name"] = contact.first_name
        if contact.last_name is not None: update_fields["last_name"] = contact.last_name
        if contact.unsubscribed is not None: update_fields["unsubscribed"] = contact.unsubscribed
        if contact.properties is not None: update_fields["properties"] = contact.properties

        result = await resend_service.update_contact(
            audience_id=audience_id,
            contact_id=contact_id,
            fields=update_fields
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{audience_id}/{contact_id}")
async def delete_contact(audience_id: str, contact_id: str):
    """Deleta um contato"""
    try:
        result = await resend_service.delete_contact(
            audience_id=audience_id,
            contact_id=contact_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== PROPRIEDADES ====================
@router.post("/properties/add")
async def add_property(contact_id: str, property: PropertyModel):
    """Adiciona uma propriedade a um contato"""
    try:
        if contact_id in config.contacts:
            if "properties" not in config.contacts[contact_id]:
                config.contacts[contact_id]["properties"] = {}
            config.contacts[contact_id]["properties"][property.key] = property.value
            await resend_service.log_action("PROPERTY_ADDED", f"Propriedade {property.key} adicionada ao contato {contact_id}")
            return {"success": True, "message": "Propriedade adicionada"}
        else:
            raise HTTPException(status_code=404, detail="Contato não encontrado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/properties/{contact_id}")
async def get_properties(contact_id: str):
    """Obtém as propriedades de um contato"""
    if contact_id in config.contacts:
        return {"success": True, "properties": config.contacts[contact_id].get("properties", {})}
    else:
        raise HTTPException(status_code=404, detail="Contato não encontrado")

# ==================== SEGMENTOS ====================
@router.post("/segments/create")
async def create_segment(segment: SegmentModel):
    """Cria um novo segmento"""
    try:
        segment_id = f"seg_{len(config.segments)}"
        config.segments[segment_id] = {
            "id": segment_id,
            "name": segment.name,
            "description": segment.description,
            "contacts": []
        }
        await resend_service.log_action("SEGMENT_CREATED", f"Segmento '{segment.name}' criado")
        return {"success": True, "id": segment_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/segments/list")
async def list_segments():
    """Lista todos os segmentos"""
    return {"success": True, "data": list(config.segments.values())}

@router.post("/segments/{segment_id}/add-contact")
async def add_contact_to_segment(segment_id: str, contact_id: str):
    """Adiciona um contato a um segmento"""
    try:
        if segment_id in config.segments and contact_id in config.contacts:
            if contact_id not in config.segments[segment_id]["contacts"]:
                config.segments[segment_id]["contacts"].append(contact_id)
            await resend_service.log_action("CONTACT_ADDED_SEGMENT", f"Contato {contact_id} adicionado ao segmento {segment_id}")
            return {"success": True}
        else:
            raise HTTPException(status_code=404, detail="Segmento ou contato não encontrado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== TÓPICOS ====================
@router.post("/topics/create")
async def create_topic(topic: TopicModel):
    """Cria um novo tópico"""
    try:
        topic_id = f"topic_{len(config.topics)}"
        config.topics[topic_id] = {
            "id": topic_id,
            "name": topic.name,
            "unsubscribed": topic.unsubscribed
        }
        await resend_service.log_action("TOPIC_CREATED", f"Tópico '{topic.name}' criado")
        return {"success": True, "id": topic_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/topics/list")
async def list_topics():
    """Lista todos os tópicos"""
    return {"success": True, "data": list(config.topics.values())}

@router.put("/topics/{contact_id}")
async def update_contact_topics(contact_id: str, topics: dict):
    """Atualiza os tópicos de um contato"""
    try:
        if contact_id in config.contacts:
            if "topics" not in config.contacts[contact_id]:
                config.contacts[contact_id]["topics"] = {}
            config.contacts[contact_id]["topics"].update(topics)
            await resend_service.log_action("TOPICS_UPDATED", f"Tópicos atualizados para contato {contact_id}")
            return {"success": True}
        else:
            raise HTTPException(status_code=404, detail="Contato não encontrado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/topics/{contact_id}")
async def get_contact_topics(contact_id: str):
    """Obtém os tópicos de um contato"""
    if contact_id in config.contacts:
        return {"success": True, "topics": config.contacts[contact_id].get("topics", {})}
    else:
        raise HTTPException(status_code=404, detail="Contato não encontrado")
