# Outputs do core IaC (F7). Valores sensíveis marcados sensitive — consumir
# via `terraform output -raw` em pipelines, nunca commitar.

output "database_host" {
  description = "Host Postgres (Supabase) do ambiente."
  value       = "TODO(supabase_project.main).database_host" # descomentar com o recurso
}

output "database_port" {
  description = "Porta Postgres."
  value       = 5432
}

output "database_connection_string_secret_ref" {
  description = "Referência ao segredo (nunca o valor): DATABASE_URL vive no secret manager do ambiente."
  value       = "env/${var.environment}/DATABASE_URL"
}

output "redis_endpoint" {
  description = "Endpoint Redis gerido do ambiente."
  value       = var.redis_endpoint
}

output "documents_bucket" {
  description = "Bucket de object storage (S3-compatible) do ambiente."
  value       = "${var.environment}-${var.documents_bucket_name}"
}
