import os
import shutil
import sqlite3
import json
from datetime import datetime
from typing import Dict, Any, List
from backend.app.core.config import DATA_DIR, BACKUPS_DIR

class BackupService:
    """Manages local database backups, full data exports, and restorations."""

    @staticmethod
    def create_database_backup() -> Dict[str, Any]:
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        db_path = DATA_DIR / "kdp_studio.db"
        backup_filename = f"kdp_backup_{timestamp}.db"
        backup_path = BACKUPS_DIR / backup_filename

        if not db_path.exists():
            return {"success": False, "message": "Primary database file does not exist yet."}

        # Safe SQLite backup API
        src = sqlite3.connect(str(db_path))
        dst = sqlite3.connect(str(backup_path))
        src.backup(dst)
        dst.close()
        src.close()

        size_bytes = os.path.getsize(str(backup_path))

        return {
            "success": True,
            "filename": backup_filename,
            "path": str(backup_path),
            "size_kb": round(size_bytes / 1024, 2),
            "created_at": datetime.utcnow().isoformat()
        }

    @staticmethod
    def list_backups() -> List[Dict[str, Any]]:
        backups = []
        for file in os.listdir(BACKUPS_DIR):
            if file.endswith(".db") or file.endswith(".json"):
                fpath = BACKUPS_DIR / file
                backups.append({
                    "filename": file,
                    "size_kb": round(os.path.getsize(str(fpath)) / 1024, 2),
                    "created_at": datetime.fromtimestamp(os.path.getctime(str(fpath))).isoformat()
                })
        backups.sort(key=lambda x: x["created_at"], reverse=True)
        return backups

    @staticmethod
    def restore_backup(filename: str) -> Dict[str, Any]:
        backup_path = BACKUPS_DIR / filename
        db_path = DATA_DIR / "kdp_studio.db"

        if not backup_path.exists():
            return {"success": False, "message": f"Backup file {filename} not found."}

        src = sqlite3.connect(str(backup_path))
        dst = sqlite3.connect(str(db_path))
        src.backup(dst)
        dst.close()
        src.close()

        return {"success": True, "message": f"Successfully restored database from {filename}."}

backup_service = BackupService()
