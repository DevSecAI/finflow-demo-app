# Sensitive outputs exposed in plaintext — visible in CI/CD logs
output "db_password" {
  description = "Database password"
  value       = var.db_password
  # sensitive = true  # Not marked sensitive — will print in terraform output
}

output "rds_endpoint" {
  description = "RDS connection endpoint"
  value       = aws_db_instance.finflow_postgres.endpoint
}

output "api_public_ip" {
  description = "API server public IP"
  value       = aws_instance.finflow_api.public_ip
}

output "s3_bucket_name" {
  description = "Public S3 bucket name"
  value       = aws_s3_bucket.finflow_reports.bucket
}

output "stripe_secret" {
  description = "Stripe secret key"
  value       = var.stripe_secret
  # sensitive = true  # Not marked sensitive
}
