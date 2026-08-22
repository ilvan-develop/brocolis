# Variáveis do core IaC (F7). Nenhum segredo real aqui — injectar via TF_VAR_*
# ou -var na CLI (ver docs/runbooks/secrets-rotation.md).

variable "environment" {
  description = "Ambiente lógico (staging | production)."
  type        = string

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment tem de ser staging ou production."
  }
}

variable "region" {
  description = "Região cloud (Supabase/Postgres)."
  type        = string
  default     = "eu-central-1"
}

variable "supabase_organization_id" {
  description = "ID da organização Supabase."
  type        = string
}

variable "db_instance_size" {
  description = "Tamanho da instância Postgres (Supabase)."
  type        = string
  default     = "small"
}

variable "database_password" {
  description = "Password do Postgres. SENSÍVEL — fornecer via TF_VAR_database_password."
  type        = string
  sensitive   = true
}

variable "redis_endpoint" {
  description = "Endpoint externo do Redis gerido (Upstash/ElastiCache) até ADR de provider."
  type        = string
}

variable "documents_bucket_name" {
  description = "Nome do bucket de documentos (receitas, comprovativos)."
  type        = string
  default     = "brocolis-documents"
}
