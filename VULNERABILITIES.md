# FinFlow Vulnerability Checklist

> **100 vulnerabilities hidden across 16 files** — How many can your security tools find? Open each file and see what gets flagged.

## Dockerfile

- [ ] Unpinned base image (`FROM node:latest`)
- [ ] Process runs as root (`USER root`, no privilege drop)
- [ ] Secrets passed via `ARG` (persist in image history / build args)
- [ ] Secrets passed via `ENV` (visible at runtime and in image config)
- [ ] SSH port exposed in container image (`EXPOSE 22`)
- [ ] No `HEALTHCHECK` defined
- [ ] `npm install` without `--production` (devDependencies shipped in prod image)
- [ ] `COPY . .` before dependency install (invalidates Docker layer cache on every source change)
- [ ] No `.dockerignore` — `.env`, `.git`, `node_modules`, and other junk copied into build context and image

## .env

- [ ] Secrets file committed to the repository (should never be in version control)
- [ ] Production JWT secret in plaintext
- [ ] Live-style Stripe secret key in plaintext
- [ ] Database host, user, and password exposed
- [ ] AWS access key ID and secret access key exposed
- [ ] Sentry DSN and analytics token exposed

## backend/server.js

- [ ] Insecure CORS (`origin: '*'` allows any site to call the API)
- [ ] Hardcoded JWT secret
- [ ] Hardcoded Stripe API key
- [ ] Hardcoded database password and host
- [ ] Weak default seed passwords (`password123`, `qwerty`, `admin`)
- [ ] Unsafe `eval()` on user-controlled `formula` (arbitrary code execution)
- [ ] Global error handler returns stack trace, message, and internal `dbHost` to clients
- [ ] JWT secret logged to stdout

## backend/middleware/auth.js

- [ ] Duplicated hardcoded JWT secret (drift risk with `server.js`)
- [ ] Missing token calls `next()` — fails open instead of rejecting
- [ ] JWT verification errors ignored — request proceeds unauthenticated
- [ ] Comment/doc notes that `transactions.js` bypasses this middleware with `decode()`

## backend/routes/admin.js

- [ ] Admin check uses `jwt.decode()` instead of `jwt.verify()` — forged tokens accepted
- [ ] Command injection via `exec()` — `filename` / `format` interpolated into shell command
- [ ] SQL injection in `GET /user/:id` — `id` concatenated into query
- [ ] Password hash/field returned in API response body
- [ ] Arbitrary SQL execution endpoint (`POST /query` with user-supplied `sql`)

## backend/routes/auth.js

- [ ] SQL injection in login — username/password concatenated into query
- [ ] JWT signed with hardcoded secret (no rotation, no KMS)
- [ ] Excessive token lifetime (`expiresIn: '30d'`)
- [ ] Login response includes full user object including password field
- [ ] No rate limiting on registration (account spam / enumeration)
- [ ] Registration stores plaintext password and uses string-concatenated SQL (injection + no hashing)
- [ ] Predictable password reset token derived from email and timestamp

## backend/routes/transactions.js

- [ ] Unauthenticated requests proceed as `guest` — fails open
- [ ] Uses `jwt.decode()` instead of `jwt.verify()` — signature never checked
- [ ] IDOR — any caller can read `/history/:userId` for any `userId`
- [ ] SQL injection risk in history query — `userId` interpolated
- [ ] No CSRF protection on state-changing `POST /transfer`
- [ ] No server-side validation of transfer amount (negative / abuse)
- [ ] SQL injection in transfer — `toUser` / `amount` concatenated into `INSERT`
- [ ] Mass assignment on `PUT /update/:id` — arbitrary columns from body
- [ ] Dynamic `UPDATE` built from user keys/values — SQL injection

## frontend/src/utils/api.js

- [ ] Hardcoded Stripe publishable key in client bundle
- [ ] Hardcoded Mixpanel token
- [ ] Hardcoded Sentry DSN
- [ ] Hardcoded Google Maps API key
- [ ] Hardcoded production API base URL over HTTP (cleartext, wrong environment coupling)
- [ ] JWT stored in `localStorage` (XSS can steal session)
- [ ] Stripe key stored in `localStorage`
- [ ] `debugLog` writes session data and tokens to the browser console

## frontend/src/components/Dashboard.jsx

- [ ] Trusts `localStorage` user JSON without validation
- [ ] URL query parameter rendered via `dangerouslySetInnerHTML` (reflected XSS)
- [ ] Client drives transaction fetch by `user.id` with no ownership guarantee (IDOR pattern)
- [ ] Exposes privileged `role` in the UI (information disclosure)

## frontend/src/components/Transfer.jsx

- [ ] No client-side validation of amount or recipient
- [ ] Full API error payload reflected into UI state (information leakage)
- [ ] Amount field is free text, not a constrained numeric input

## terraform/main.tf

- [ ] Long-lived AWS access key and secret hardcoded in `provider "aws"`
- [ ] S3 bucket ACL `public-read` — world-readable objects
- [ ] S3 public access block explicitly disabled (all four flags false)
- [ ] S3 bucket missing encryption, versioning, and access logging
- [ ] API security group allows all TCP ports `0–65535` from `0.0.0.0/0`
- [ ] Database security group exposes PostgreSQL (`5432`) to the entire internet
- [ ] RDS master password hardcoded in resource
- [ ] RDS `publicly_accessible = true`
- [ ] RDS `storage_encrypted = false` (no encryption at rest)
- [ ] RDS `backup_retention_period = 0` (no automated backups)
- [ ] RDS `deletion_protection = false` and `skip_final_snapshot = true`
- [ ] RDS `multi_az = false` for labelled production workload
- [ ] IAM role policy grants `Action: *` on `Resource: *`
- [ ] EC2 metadata options allow IMDSv1 (`http_tokens = "optional"`)
- [ ] Secrets embedded in EC2 `user_data` (visible in console/API)
- [ ] No CloudTrail / audit trail resource defined

## terraform/variables.tf

- [ ] Sensitive defaults committed for `db_password`, `jwt_secret`, and `stripe_secret`
- [ ] `db_password` not marked `sensitive` (Terraform may log values)

## terraform/outputs.tf

- [ ] `db_password` output not marked `sensitive` — leaks in CI logs and local state displays
- [ ] `stripe_secret` output not marked `sensitive`
- [ ] Sensitive infrastructure endpoints emitted without redaction strategy

## .github/workflows/deploy.yml

- [ ] AWS credentials hardcoded in workflow `env`
- [ ] Database password, Stripe secret, and JWT secret hardcoded in workflow
- [ ] Deploy step echoes `DB_PASSWORD` into logs
- [ ] `terraform apply -auto-approve` with no manual approval gate
- [ ] Migration step passes `PGPASSWORD` on the command line and uses hardcoded credentials/host

## scripts/user_import.py

- [ ] Hardcoded admin API key and internal API base URL
- [ ] SQL injection when inserting CSV rows — values interpolated into SQL strings
- [ ] Imports plaintext passwords from CSV into the database
- [ ] Unsafe YAML load (`yaml.load` with `Loader=yaml.Loader` — unsafe deserialisation)
- [ ] Command injection via `os.system` and user-controlled `filename`
- [ ] Path traversal in avatar path — `username` not sanitised before `join`
- [ ] Admin API key printed to stdout

## scripts/process_transactions.py

- [ ] Hardcoded AWS access key ID and secret access key
- [ ] Database connection string with embedded password (and logged)
- [ ] MD5 used for financial integrity hashing (collision weaknesses)
- [ ] Shell injection in `export_report` via `subprocess.call(..., shell=True)` with interpolated `report_name`
- [ ] Insecure deserialisation — `pickle.load` on file content
- [ ] SQL injection in `get_user_report` — username concatenated into query
- [ ] SSRF — `requests.get` on unvalidated user-controlled URL
- [ ] Predictable temp file path instead of `tempfile.mkstemp`
- [ ] S3 upload uses long-lived static credentials instead of IAM role
