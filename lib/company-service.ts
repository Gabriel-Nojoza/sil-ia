import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type {
  CompanyInsertRow,
  CompanyRecord,
  CompanyRow,
  CreateCompanyInput,
} from "@/types/company";

export const initialCompanies: CompanyRecord[] = [
  {
    id: "7c4f1db3-3532-4e8e-b599-15dc0eb3318a",
    name: "SIL Inteligencia Analitica",
    workspaceId: "09b9f53f-2894-40f3-841d-828fb4689eb2",
    datasetId: "63b6d1a8-b95a-4730-9d0b-04d6b17af932",
    timezone: "America/Sao_Paulo",
    language: "pt-BR",
    powerbiIdentityMode: "service_principal",
    createdAt: "2026-04-19T12:00:00.000Z",
  },
];

function mapCompanyRow(row: CompanyRow): CompanyRecord {
  return {
    id: row.id,
    name: row.name,
    workspaceId: row.workspace_id,
    datasetId: row.dataset_id,
    timezone: row.timezone,
    language: row.language,
    powerbiIdentityMode: row.powerbi_identity_mode,
    createdAt: row.created_at,
  };
}

function mapCompanyInput(input: CreateCompanyInput): CompanyInsertRow {
  return {
    name: input.name,
    workspace_id: input.workspaceId,
    dataset_id: input.datasetId,
    timezone: input.timezone,
    language: input.language,
    powerbi_identity_mode: input.powerbiIdentityMode,
  };
}

async function listCompaniesMock(): Promise<CompanyRecord[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return initialCompanies;
}

async function createCompanyMock(
  input: CreateCompanyInput,
): Promise<CompanyRecord> {
  await new Promise((resolve) => setTimeout(resolve, 700));

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };
}

export async function listCompanies(): Promise<CompanyRecord[]> {
  if (!isSupabaseConfigured()) {
    return listCompaniesMock();
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("companies")
    .select(
      "id, name, workspace_id, dataset_id, timezone, language, powerbi_identity_mode, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Falha ao carregar empresas no Supabase: ${error.message}`);
  }

  return (data satisfies CompanyRow[]).map(mapCompanyRow);
}

export async function createCompany(
  input: CreateCompanyInput,
): Promise<CompanyRecord> {
  if (!isSupabaseConfigured()) {
    return createCompanyMock(input);
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("companies")
    .insert(mapCompanyInput(input))
    .select(
      "id, name, workspace_id, dataset_id, timezone, language, powerbi_identity_mode, created_at",
    )
    .single();

  if (error) {
    throw new Error(`Falha ao cadastrar empresa no Supabase: ${error.message}`);
  }

  const company = mapCompanyRow(data satisfies CompanyRow);

  await supabase.from("users").insert({
    company_id: company.id,
    name: input.accessUserName,
    email: input.accessUserEmail,
    status: input.accessUserRole,
  });

  return company;
}
