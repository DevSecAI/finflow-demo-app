terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "eu-west-1"

  # Hardcoded credentials — should use IAM roles or environment variables
  access_key = "AKIAIOSFODNN7FINFLOW1"
  secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYFINFLOWKEY"
}

# -----------------------------------------------
# S3 — Public bucket with no encryption
# -----------------------------------------------
resource "aws_s3_bucket" "finflow_reports" {
  bucket = "finflow-prod-reports"

  # Missing: versioning, logging, encryption, lifecycle rules
  tags = {
    Environment = "production"
    App         = "finflow"
  }
}

# Bucket ACL set to public-read — exposes all financial reports
resource "aws_s3_bucket_acl" "finflow_reports_acl" {
  bucket = aws_s3_bucket.finflow_reports.id
  acl    = "public-read"
}

# Public access block disabled — allows public access to bucket
resource "aws_s3_bucket_public_access_block" "finflow_reports" {
  bucket = aws_s3_bucket.finflow_reports.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# No server-side encryption configured
# No bucket versioning configured
# No access logging configured

# -----------------------------------------------
# Networking — overly permissive security groups
# -----------------------------------------------
resource "aws_security_group" "finflow_api" {
  name        = "finflow-api-sg"
  description = "Security group for FinFlow API"

  # Allows all inbound traffic from anywhere on all ports
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all inbound"
  }

  # Allows all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "finflow_db" {
  name        = "finflow-db-sg"
  description = "Security group for FinFlow RDS"

  # Database port open to the entire internet
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "PostgreSQL open to world"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# -----------------------------------------------
# RDS — Unencrypted, publicly accessible database
# -----------------------------------------------
resource "aws_db_instance" "finflow_postgres" {
  identifier        = "finflow-prod"
  engine            = "postgres"
  engine_version    = "14.8"
  instance_class    = "db.t3.medium"
  allocated_storage = 100

  db_name  = "finflow"
  username = "finflow_admin"
  password = "Sup3rS3cr3t!"  # Hardcoded plaintext password

  # Publicly accessible — database reachable from internet
  publicly_accessible = true

  # No encryption at rest
  storage_encrypted = false

  # Automated backups disabled
  backup_retention_period = 0

  # Deletion protection off — database can be destroyed
  deletion_protection = false

  # No multi-AZ for production database
  multi_az = false

  # No performance insights, no enhanced monitoring
  vpc_security_group_ids = [aws_security_group.finflow_db.id]

  skip_final_snapshot = true

  tags = {
    Environment = "production"
  }
}

# -----------------------------------------------
# IAM — Wildcard permissions
# -----------------------------------------------
resource "aws_iam_role" "finflow_app_role" {
  name = "finflow-app-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "finflow_app_policy" {
  name = "finflow-app-policy"
  role = aws_iam_role.finflow_app_role.id

  # Wildcard permissions — grants full access to all AWS services
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "*"
      Resource = "*"
    }]
  })
}

# -----------------------------------------------
# CloudTrail disabled — no audit logging
# -----------------------------------------------
# (CloudTrail resource intentionally omitted)

# -----------------------------------------------
# EC2 — Instance with IMDSv1 enabled (metadata service vulnerable to SSRF)
# -----------------------------------------------
resource "aws_instance" "finflow_api" {
  ami           = "ami-0694d931cee176e7d"
  instance_type = "t3.medium"

  # IMDSv1 enabled — allows SSRF attacks to steal instance credentials
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "optional"  # Should be "required" for IMDSv2
    http_put_response_hop_limit = 2
  }

  # No key pair — SSH access issues
  # No IAM instance profile with least-privilege role

  vpc_security_group_ids = [aws_security_group.finflow_api.id]

  user_data = <<-EOF
    #!/bin/bash
    # Hardcoded secrets in user_data — visible in AWS console
    export DB_PASSWORD="Sup3rS3cr3t!"
    export STRIPE_SECRET="FINFLOW_DEMO_USE_ENV_NOT_A_REAL_STRIPE_KEY"
    export JWT_SECRET="finflow_super_secret_key_2024"
    cd /app && npm start
  EOF

  tags = {
    Name = "finflow-api-prod"
  }
}
