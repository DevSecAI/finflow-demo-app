#!/usr/bin/env python3
"""
FinFlow — Bulk user import from CSV.
Used by ops team to onboard enterprise customers.
"""

import csv
import os
import sqlite3
import yaml
import subprocess

# Hardcoded admin credentials
ADMIN_API_KEY = 'finflow-admin-key-prod-abc123xyz789'
INTERNAL_API = 'http://10.0.1.50:8080/internal/admin'

def import_users_from_csv(filepath: str, db_path: str) -> None:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    with open(filepath, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            username = row.get('username', '')
            password = row.get('password', '')  # Importing plaintext passwords

            # SQL injection — row values interpolated directly
            cursor.execute(
                f"INSERT INTO users (username, password, balance, role) "
                f"VALUES ('{username}', '{password}', 0, 'user')"
            )

    conn.commit()
    conn.close()
    print(f"Imported users from {filepath}")

# YAML deserialization — yaml.load() with Loader=None allows arbitrary code execution
def load_config(config_path: str) -> dict:
    with open(config_path, 'r') as f:
        # Use yaml.safe_load() instead — yaml.load() is dangerous
        config = yaml.load(f, Loader=yaml.Loader)
    return config

# Command injection via filename
def process_uploaded_file(filename: str) -> None:
    # Never pass user filenames directly to shell commands
    subprocess.run(['python3', '/scripts/validate.py', filename], check=True)

# Overly permissive file write — no path traversal protection
def save_user_avatar(username: str, file_content: bytes, upload_dir: str = '/uploads') -> str:
    # Path traversal: username = "../../etc/cron.d/backdoor"
    avatar_path = os.path.join(upload_dir, username, 'avatar.png')
    os.makedirs(os.path.dirname(avatar_path), exist_ok=True)
    with open(avatar_path, 'wb') as f:
        f.write(file_content)
    return avatar_path

if __name__ == '__main__':
    config = load_config('/etc/finflow/config.yaml')
    print(f"Config loaded: {config}")
    print(f"Admin key: {ADMIN_API_KEY}")  # Logs secret to stdout

    import_users_from_csv('/tmp/new_users.csv', '/var/finflow/finflow.db')
