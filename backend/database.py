import os
import sqlite3
import json
from datetime import datetime
from typing import List, Optional

# O banco SQLite NAO pode ficar dentro do Proton Drive (pasta sincronizada),
# pois o lock da sincronizacao causa "disk I/O error". Por isso usamos uma
# pasta local fora da sincronizacao. Pode ser sobrescrito via env DB_PATH.
def _resolve_db_path() -> str:
    env_path = os.environ.get("DB_PATH")
    if env_path:
        return env_path
    base_dir = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
    data_dir = os.path.join(base_dir, "emails-painel")
    os.makedirs(data_dir, exist_ok=True)
    return os.path.join(data_dir, "resend_history.db")

DB_PATH = _resolve_db_path()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Tabela de Webhook Events
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS webhook_events (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            data TEXT NOT NULL,
            received_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Tabela de Emails Enviados (Opcional, para histórico local)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS email_history (
            id TEXT PRIMARY KEY,
            from_email TEXT NOT NULL,
            to_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            status TEXT DEFAULT 'sent',
            sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            payload TEXT
        )
    """)
    
    conn.commit()
    conn.close()

def save_webhook_event(event_id: str, event_type: str, created_at: str, data: dict):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR IGNORE INTO webhook_events (id, type, created_at, data) VALUES (?, ?, ?, ?)",
        (event_id, event_type, created_at, json.dumps(data))
    )
    conn.commit()
    conn.close()

def get_webhook_history(limit: int = 50):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM webhook_events ORDER BY received_at DESC LIMIT ?", 
        (limit,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# Iniciar banco ao importar
init_db()
