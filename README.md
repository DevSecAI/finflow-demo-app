# FinFlow Demo App — Intentionally Vulnerable Fintech Application

> ⚠️ **This application is intentionally insecure.** It is designed for security education and tooling demonstrations only. **Never deploy this to a real environment.**

FinFlow is a mock payments and transaction platform built to demonstrate common security vulnerabilities across a realistic multi-language codebase. It includes a Node.js/Express API, a React frontend, Python data processing scripts, and Terraform infrastructure — each containing deliberate security issues.

---

## What's Inside

```
finflow/
├── backend/          # Node.js + Express API
│   ├── server.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   └── admin.js
│   └── middleware/
│       └── auth.js
├── frontend/         # React SPA
│   └── src/
│       ├── components/
│       │   ├── Dashboard.jsx
│       │   └── Transfer.jsx
│       └── utils/
│           └── api.js
├── scripts/          # Python data processing
│   ├── process_transactions.py
│   └── user_import.py
├── terraform/        # AWS infrastructure
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
└── .github/
    └── workflows/
        └── deploy.yml
```

---

## Vulnerabilities by Category

### Credential Exposure
- Hardcoded JWT secret in `backend/server.js` and `backend/middleware/auth.js`
- Live Stripe API keys hardcoded in `backend/server.js` and `frontend/src/utils/api.js`
- AWS access key and secret hardcoded in `terraform/main.tf`, `scripts/process_transactions.py`, and `.github/workflows/deploy.yml`
- Database password hardcoded across multiple files
- Secrets logged to stdout in `backend/server.js` and `scripts/process_transactions.py`

### Injection
- SQL injection in login query — `backend/routes/auth.js` (`' OR '1'='1` bypasses auth)
- SQL injection in transaction transfer — `backend/routes/transactions.js`
- SQL injection in user import — `scripts/user_import.py`
- Shell injection via filename — `backend/routes/admin.js` and `scripts/process_transactions.py`
- Arbitrary code execution via `eval()` — `backend/server.js`
- Command injection via `os.system()` — `scripts/user_import.py`

### Authentication & Authorisation
- `jwt.decode()` used instead of `jwt.verify()` — signature never validated (`backend/routes/transactions.js`)
- Authentication middleware fails open — unauthenticated requests proceed as guest
- IDOR on `/transactions/history/:userId` — any user can view any user's transactions
- Admin endpoint role check relies on unverified token decode
- 30-day JWT expiry with no revocation mechanism
- Plaintext passwords stored in database

### Frontend / XSS
- `dangerouslySetInnerHTML` with URL parameter input — `frontend/src/components/Dashboard.jsx`
- JWT and API keys stored in `localStorage` — vulnerable to XSS theft
- API keys hardcoded in frontend source — visible to anyone

### Insecure Deserialisation
- `pickle.load()` on untrusted file — `scripts/process_transactions.py`
- `yaml.load()` without `safe_load` — `scripts/user_import.py`

### Infrastructure Misconfigurations
- S3 bucket set to `public-read` ACL — all financial reports publicly accessible
- Public access block disabled on S3
- No S3 server-side encryption
- No S3 versioning or access logging
- RDS instance publicly accessible (`publicly_accessible = true`)
- RDS has no encryption at rest (`storage_encrypted = false`)
- RDS backup retention set to 0 — no backups
- Security group allows all inbound traffic on all ports (`0.0.0.0/0`)
- Database port 5432 open to the internet
- IAM policy uses wildcard `Action: "*"` and `Resource: "*"`
- EC2 IMDSv1 enabled — SSRF can steal instance credentials
- Secrets in EC2 `user_data` — visible in AWS console
- Terraform outputs expose passwords in plaintext
- No CloudTrail configured — no audit logging

### Miscellaneous
- Verbose error messages expose stack traces and internal hostnames to clients
- Mass assignment in transaction update endpoint — any field can be overwritten
- Path traversal in avatar upload — `scripts/user_import.py`
- SSRF via unvalidated URL in exchange rate fetcher
- No rate limiting on authentication endpoints
- Predictable password reset tokens
- CI/CD pipeline auto-approves Terraform to production with no review gate

---

## Getting Started (Local Demo)

**Prerequisites:** Node.js 18+, Python 3.10+

```bash
# Backend
cd backend && npm install && npm start

# Frontend (separate terminal)
cd frontend && npm install && npm start
```

The API runs on `localhost:3001`, the frontend on `localhost:3000`.

Default credentials: `alice / password123`, `admin / admin`

---

## Licence

MIT — use freely for education and tooling demos.
