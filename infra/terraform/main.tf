###############################################################################
# Brócolis — IaC core (F7, blueprint 08 §9 / FACTOS F7 §4)
#
# Skeleton: providers pinned + backend remoto (S3 + DynamoDB lock) + variáveis
# e outputs para Postgres (Supabase), Redis (endpoint externo até ADR) e object
# storage. Recursos de exemplo comentados — completar após ADR arq-0013
# (Terraform vs Pulumi) e escolha final do provider Redis.
#
# Uso:
#   terraform init -backend-config=environments/staging.backend.hcl
#   terraform plan  -var-file=environments/staging.tfvars
#   terraform apply -var-file=environments/staging.tfvars
###############################################################################

terraform {
  required_version = "~> 1.13"

  # State remoto OBRIGATÓRIO (FACTOS §4): S3 + lock DynamoDB.
  # Credenciais via env (AWS_PROFILE/AWS_ACCESS_KEY_ID) — nunca em tfvars.
  backend "s3" {
    bucket         = "brocolis-tfstate" # placeholder: por ambiente em environments/*.backend.hcl
    key            = "core/terraform.tfstate"
    region         = "eu-central-1"
    dynamodb_table = "brocolis-tflock"
    encrypt        = true
  }

  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.5"
    }
  }
}

provider "supabase" {
  # SUPABASE_ACCESS_TOKEN via env/TF_VAR — nunca commitado (runbook secrets-rotation).
}

locals {
  name_prefix = "brocolis-${var.environment}"
}

# ---------------------------------------------------------------------------
# Postgres (Supabase) — recurso de referência; descomentar quando o ADR arq-0013
# estiver registado e a organization_id existir como variável.
# ---------------------------------------------------------------------------
# resource "supabase_project" "main" {
#   name               = local.name_prefix
#   organization_id    = var.supabase_organization_id
#   database_password  = var.database_password # sensível — injectar via TF_VAR
#   region             = var.region
#   instance_size      = var.db_instance_size
# }

# ---------------------------------------------------------------------------
# Object storage (Supabase Storage, S3-compatible) — bucket de documentos
# (receitas, comprovativos). API fala S3-compatible via client `minio`.
# ---------------------------------------------------------------------------
# resource "supabase_object_storage_bucket" "documents" {
#   project_ref = supabase_project.main.id
#   name        = "${local.name_prefix}-documents"
#   public      = false
# }

# ---------------------------------------------------------------------------
# Redis — decisão pendente (Upstash vs ElastiCache). Enquanto isso, o endpoint
# é injectado como variável por ambiente e apenas exposto em output.
# ---------------------------------------------------------------------------
