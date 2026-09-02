import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.models.db_models import Setting, DataSource
from backend.app.models.schemas import SettingsSchema, ConnectionTestResponse
from backend.app.core.config import settings
from backend.app.connectors.amazon_suggest import amazon_suggest_connector
from backend.app.connectors.amazon_live import amazon_live_connector
from backend.app.connectors.amazon_paapi import amazon_paapi_connector
from backend.app.connectors.openlibrary import openlibrary_connector
from backend.app.connectors.google_trends import google_trends_connector
from backend.app.ai.ollama_client import ollama_client
from backend.app.ai.openai_client import openai_client
from backend.app.services.backup_service import backup_service

router = APIRouter()

@router.get("", response_model=SettingsSchema)
async def get_settings(db: AsyncSession = Depends(get_db)):
    return SettingsSchema(
        amazon_access_key=settings.AMAZON_ACCESS_KEY,
        amazon_secret_key=settings.AMAZON_SECRET_KEY,
        amazon_associate_tag=settings.AMAZON_ASSOCIATE_TAG,
        amazon_default_marketplace=settings.AMAZON_DEFAULT_MARKETPLACE,
        ai_provider=settings.AI_PROVIDER,
        ollama_base_url=settings.OLLAMA_BASE_URL,
        ollama_model=settings.OLLAMA_MODEL,
        openai_api_key=settings.OPENAI_API_KEY,
        openai_base_url=settings.OPENAI_BASE_URL,
        openai_model=settings.OPENAI_MODEL,
        use_postgres=settings.USE_POSTGRES,
        postgres_url=settings.POSTGRES_URL
    )

@router.post("")
async def update_settings(new_settings: SettingsSchema, db: AsyncSession = Depends(get_db)):
    if new_settings.amazon_access_key is not None:
        settings.AMAZON_ACCESS_KEY = new_settings.amazon_access_key
        amazon_paapi_connector.access_key = new_settings.amazon_access_key
    if new_settings.amazon_secret_key is not None:
        settings.AMAZON_SECRET_KEY = new_settings.amazon_secret_key
        amazon_paapi_connector.secret_key = new_settings.amazon_secret_key
    if new_settings.amazon_associate_tag is not None:
        settings.AMAZON_ASSOCIATE_TAG = new_settings.amazon_associate_tag
        amazon_paapi_connector.partner_tag = new_settings.amazon_associate_tag
    if new_settings.amazon_default_marketplace:
        settings.AMAZON_DEFAULT_MARKETPLACE = new_settings.amazon_default_marketplace
    if new_settings.ai_provider:
        settings.AI_PROVIDER = new_settings.ai_provider
    if new_settings.ollama_base_url:
        settings.OLLAMA_BASE_URL = new_settings.ollama_base_url
        ollama_client.base_url = new_settings.ollama_base_url
    if new_settings.ollama_model:
        settings.OLLAMA_MODEL = new_settings.ollama_model
    if new_settings.openai_api_key is not None:
        settings.OPENAI_API_KEY = new_settings.openai_api_key
        openai_client.api_key = new_settings.openai_api_key
    if new_settings.openai_base_url:
        settings.OPENAI_BASE_URL = new_settings.openai_base_url
        openai_client.base_url = new_settings.openai_base_url
    if new_settings.openai_model:
        settings.OPENAI_MODEL = new_settings.openai_model
        openai_client.model = new_settings.openai_model

    # Persist in DB
    setting_row = await db.get(Setting, "app_config")
    if not setting_row:
        setting_row = Setting(key="app_config", value_json=new_settings.json())
        db.add(setting_row)
    else:
        setting_row.value_json = new_settings.json()
    await db.commit()

    return {"success": True, "message": "Settings updated successfully."}

@router.get("/test-connection/{connector_id}", response_model=ConnectionTestResponse)
async def test_connector(connector_id: str):
    cid = connector_id.lower()
    if cid == "amazon_suggest":
        t = await amazon_suggest_connector.test_connection()
        return ConnectionTestResponse(connector_id=cid, name="Amazon Suggest API", **t)
    elif cid == "amazon_live":
        t = await amazon_live_connector.test_connection()
        return ConnectionTestResponse(connector_id=cid, name="Amazon Live Catalog", **t)
    elif cid == "amazon_paapi":
        t = await amazon_paapi_connector.test_connection()
        return ConnectionTestResponse(connector_id=cid, name="Amazon Official PA-API", **t)
    elif cid == "google_trends":
        t = await google_trends_connector.test_connection()
        return ConnectionTestResponse(connector_id=cid, name="Google Trends Signals", **t)
    elif cid == "openlibrary":
        t = await openlibrary_connector.test_connection()
        return ConnectionTestResponse(connector_id=cid, name="Open Library Metadata", **t)
    elif cid == "ollama":
        t = await ollama_client.check_health()
        return ConnectionTestResponse(connector_id=cid, name="Local Ollama AI", **t)
    elif cid == "openai":
        t = await openai_client.check_health()
        return ConnectionTestResponse(connector_id=cid, name="OpenAI / Compatible Endpoint", **t)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown connector ID: {connector_id}")

@router.get("/test-all")
async def test_all_connectors():
    results = []
    c_ids = ["amazon_suggest", "amazon_live", "amazon_paapi", "google_trends", "openlibrary", "ollama", "openai"]
    for cid in c_ids:
        r = await test_connector(cid)
        results.append(r)
    return results

@router.post("/backup")
async def trigger_backup():
    return backup_service.create_database_backup()

@router.get("/backups")
async def list_backups():
    return backup_service.list_backups()

@router.post("/restore/{filename}")
async def restore_backup(filename: str):
    return backup_service.restore_backup(filename)
