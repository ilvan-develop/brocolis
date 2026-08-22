terraform {
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = ">= 1.0.0"
    }
  }
}

provider "supabase" {
  project_ref = var.supabase_project_ref
}

resource "supabase_project" "brocolis" {
  organization_id = var.supabase_org_id
  name            = "brocolis"
  plan            = "free"
}

resource "supabase_branch" "preview" {
  project_id = supabase_project.brocolis.id
  name       = "preview"
}

variable "supabase_project_ref" {
  type        = string
  description = "Supabase project reference"
}

variable "supabase_org_id" {
  type        = string
  description = "Supabase organization ID"
}
