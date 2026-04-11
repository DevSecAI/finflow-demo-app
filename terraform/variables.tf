variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

# Sensitive values hardcoded as defaults — should have no default and use secrets manager
variable "db_password" {
  description = "RDS master password"
  type        = string
  default     = "Sup3rS3cr3t!"
  # sensitive = true  # Not marked sensitive
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  default     = "finflow_super_secret_key_2024"
}

variable "stripe_secret" {
  description = "Stripe secret key"
  type        = string
  default     = "FINFLOW_DEMO_USE_ENV_NOT_A_REAL_STRIPE_KEY"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-1"
}
