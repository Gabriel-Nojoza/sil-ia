export type PowerBiIdentityMode = "service_principal" | "delegated_user";

export interface CompanyBaseInput {
  name: string;
  workspaceId: string;
  datasetId: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  webhookUrl: string;
  timezone: string;
  language: string;
  powerbiIdentityMode: PowerBiIdentityMode;
  monthlyMessageLimit: number | null;
  overagePriceCents: number | null;
}

export interface CompanyRecord {
  id: string;
  name: string;
  workspaceId: string;
  datasetId: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  webhookUrl: string;
  timezone: string;
  language: string;
  powerbiIdentityMode: PowerBiIdentityMode;
  monthlyMessageLimit: number | null;
  overagePriceCents: number | null;
  createdAt: string;
}

export interface CreateCompanyInput extends CompanyBaseInput {
  accessUserName: string;
  accessUserEmail: string;
  accessUserRole: "admin" | "user";
}

export interface UpdateCompanyInput extends CompanyBaseInput {}

export interface CompanyInsertRow {
  name: string;
  workspace_id: string;
  dataset_id: string;
  tenant_id: string;
  client_id: string;
  client_secret: string;
  webhook_url: string;
  timezone: string;
  language: string;
  powerbi_identity_mode: PowerBiIdentityMode;
  monthly_message_limit: number | null;
  overage_price_cents: number | null;
}

export interface CompanyRow extends CompanyInsertRow {
  id: string;
  created_at: string;
}
