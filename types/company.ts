export type PowerBiIdentityMode = "service_principal" | "delegated_user";

export interface CompanyRecord {
  id: string;
  name: string;
  workspaceId: string;
  datasetId: string;
  timezone: string;
  language: string;
  powerbiIdentityMode: PowerBiIdentityMode;
  createdAt: string;
}

export interface CreateCompanyInput {
  name: string;
  workspaceId: string;
  datasetId: string;
  webhookUrl: string;
  timezone: string;
  language: string;
  powerbiIdentityMode: PowerBiIdentityMode;
  accessUserName: string;
  accessUserEmail: string;
  accessUserRole: "admin" | "user";
}

export interface CompanyInsertRow {
  name: string;
  workspace_id: string;
  dataset_id: string;
  timezone: string;
  language: string;
  powerbi_identity_mode: PowerBiIdentityMode;
}

export interface CompanyRow extends CompanyInsertRow {
  id: string;
  created_at: string;
}
