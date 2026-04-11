# FinFlow Demo App — Intentionally Vulnerable Fintech Application

> ⚠️ **This application is intentionally insecure.** It is designed for security education and tooling demonstrations only. **Never deploy this to a real environment.**

FinFlow is a mock payments and transaction platform built to demonstrate common security vulnerabilities across a realistic multi-language codebase. It includes a Node.js/Express API, a React frontend, Python data processing scripts, and Terraform infrastructure — each containing deliberate security issues.

Use it to test out IDE-based security tools and see how many issues they catch in real time.

---

## Quick Start — Clone This Repo and Scan It

### Step 1: Install an IDE

If you don't already have one of these, grab any of:

- **VS Code**: https://code.visualstudio.com/download
- **Cursor**: https://www.cursor.com/downloads
- **Windsurf**: https://windsurf.com/download

### Step 2: Clone this repo

Open a terminal (Terminal app on Mac, Command Prompt or PowerShell on Windows) and run:

```bash
git clone https://github.com/DevSecAI/finflow-demo-app.git
```

This downloads the project to your computer. Then open it in your editor:

```bash
cd finflow-demo-app
code .
```

(Use `cursor .` instead of `code .` if you're using Cursor.)

> **Don't have Git installed?** Download it from https://git-scm.com/downloads — follow the installer, restart your terminal, then try again.

### Step 3: Install ARKO

ARKO is a free security extension that scans your code for vulnerabilities as you work. It runs in VS Code, Cursor, and Windsurf.

**Option A — Install from inside your editor:**

1. Open VS Code, Cursor, or Windsurf
2. Go to the **Extensions** panel (click the square icon on the left sidebar, or press `Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for **ARKO**
4. Click **Install**

**Option B — Install directly from the marketplace:**

- **VS Code**: https://marketplace.visualstudio.com/items?itemName=DevSecAI.arko
- **Cursor / Windsurf**: https://open-vsx.org/extension/DevSecAI/arko

### Step 4: Open the project and watch ARKO light up

Once ARKO is installed, just open any file in the project — `backend/server.js` is a great place to start. ARKO will start highlighting security issues inline as you browse the code.

Try opening these files to see different types of vulnerabilities:

| File | What you'll see |
|------|----------------|
| `backend/server.js` | Hardcoded secrets, `eval()`, insecure CORS |
| `backend/routes/auth.js` | SQL injection, plaintext passwords |
| `backend/routes/transactions.js` | Broken auth (`jwt.decode` vs `jwt.verify`), IDOR |
| `frontend/src/utils/api.js` | API keys in source code, tokens in localStorage |
| `scripts/process_transactions.py` | Hardcoded AWS creds, pickle deserialisation, shell injection |
| `terraform/main.tf` | Public S3 bucket, wildcard IAM, unencrypted RDS, open security groups |
| `.github/workflows/deploy.yml` | Secrets hardcoded in CI/CD pipeline |

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
