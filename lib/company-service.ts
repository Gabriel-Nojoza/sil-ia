import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type {
  CompanyBaseInput,
  CompanyInsertRow,
  CompanyRecord,
  CompanyRow,
  CreateCompanyInput,
  UpdateCompanyInput,
} from "@/types/company";

type LegacyCompanyRow = Omit<
  CompanyRow,
  | "tenant_id"
  | "client_id"
  | "client_secret"
  | "webhook_url"
  | "monthly_message_limit"
  | "overage_price_cents"
> & {
  tenant_id?: string | null;
  client_id?: string | null;
  client_secret?: string | null;
  webhook_url?: string | null;
  monthly_message_limit?: number | null;
  overage_price_cents?: number | null;
};

const COMPANY_SELECT = [
  "id",
  "name",
  "workspace_id",
  "dataset_id",
  "tenant_id",
  "client_id",
  "client_secret",
  "webhook_url",
  "timezone",
  "language",
  "powerbi_identity_mode",
  "monthly_message_limit",
  "overage_price_cents",
  "created_at",
].join(", ");

const LEGACY_COMPANY_SELECT = [
  "id",
  "name",
  "workspace_id",
  "dataset_id",
  "tenant_id",
  "client_id",
  "client_secret",
  "timezone",
  "language",
  "powerbi_identity_mode",
  "created_at",
].join(", ");

const ULTRA_LEGACY_COMPANY_SELECT = [
  "id",
  "name",
  "workspace_id",
  "dataset_id",
  "timezone",
  "language",
  "powerbi_identity_mode",
  "created_at",
].join(", ");

export const initialCompanies: CompanyRecord[] = [
  {
    id: "7c4f1db3-3532-4e8e-b599-15dc0eb3318a",
    name: "SIL Inteligencia Analitica",
    workspaceId: "09b9f53f-2894-40f3-841d-828fb4689eb2",
    datasetId: "63b6d1a8-b95a-4730-9d0b-04d6b17af932",
    tenantId: "",
    clientId: "",
    clientSecret: "",
    webhookUrl: "",
    timezone: "America/Sao_Paulo",
    language: "pt-BR",
    powerbiIdentityMode: "service_principal",
    monthlyMessageLimit: 40,
    overagePriceCents: 250,
    createdAt: "2026-04-19T12:00:00.000Z",
  },
];

function mapCompanyRow(row: CompanyRow | LegacyCompanyRow): CompanyRecord {
  return {
    id: row.id,
    name: row.name,
    workspaceId: row.workspace_id,
    datasetId: row.dataset_id,
    tenantId: row.tenant_id ?? "",
    clientId: row.client_id ?? "",
    clientSecret: row.client_secret ?? "",
    webhookUrl: row.webhook_url ?? "",
    timezone: row.timezone,
    language: row.language,
    powerbiIdentityMode: row.powerbi_identity_mode,
    monthlyMessageLimit: row.monthly_message_limit ?? null,
    overagePriceCents: row.overage_price_cents ?? null,
    createdAt: row.created_at,
  };
}

function mapCompanyInput(input: CompanyBaseInput): CompanyInsertRow {
  return {
    name: input.name,
    workspace_id: input.workspaceId,
    dataset_id: input.datasetId,
    tenant_id: input.tenantId,
    client_id: input.clientId,
    client_secret: input.clientSecret,
    webhook_url: input.webhookUrl,
    timezone: input.timezone,
    language: input.language,
    powerbi_identity_mode: input.powerbiIdentityMode,
    monthly_message_limit: input.monthlyMessageLimit,
    overage_price_cents: input.overagePriceCents,
  };
}

function mapLegacyCompanyInput(input: CompanyBaseInput) {
  return {
    name: input.name,
    workspace_id: input.workspaceId,
    dataset_id: input.datasetId,
    tenant_id: input.tenantId,
    client_id: input.clientId,
    client_secret: input.clientSecret,
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
    name: input.name,
    workspaceId: input.workspaceId,
    datasetId: input.datasetId,
    tenantId: input.tenantId,
    clientId: input.clientId,
    clientSecret: input.clientSecret,
    webhookUrl: input.webhookUrl,
    timezone: input.timezone,
    language: input.language,
    powerbiIdentityMode: input.powerbiIdentityMode,
    monthlyMessageLimit: input.monthlyMessageLimit,
    overagePriceCents: input.overagePriceCents,
    createdAt: new Date().toISOString(),
  };
}

function isLegacyCompanySchemaError(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("webhook_url") ||
    normalized.includes("monthly_message_limit") ||
    normalized.includes("overage_price_cents") ||
    normalized.includes("schema cache")
  );
}

export async function listCompanies(): Promise<CompanyRecord[]> {
  if (!isSupabaseConfigured()) {
    return listCompaniesMock();
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("companies")
    .select(COMPANY_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    if (isLegacyCompanySchemaError(error.message)) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("companies")
        .select(LEGACY_COMPANY_SELECT)
        .order("created_at", { ascending: false });

      if (legacyError) {
        if (isLegacyCompanySchemaError(legacyError.message)) {
          const { data: ultraLegacyData, error: ultraLegacyError } = await supabase
            .from("companies")
            .select(ULTRA_LEGACY_COMPANY_SELECT)
            .order("created_at", { ascending: false });

          if (ultraLegacyError) {
            throw new Error(
              `Falha ao carregar empresas no Supabase: ${ultraLegacyError.message}`,
            );
          }

          return (ultraLegacyData as unknown as LegacyCompanyRow[]).map(mapCompanyRow);
        }

        throw new Error(`Falha ao carregar empresas no Supabase: ${legacyError.message}`);
      }

      return (legacyData as unknown as LegacyCompanyRow[]).map(mapCompanyRow);
    }

    throw new Error(`Falha ao carregar empresas no Supabase: ${error.message}`);
  }

  return (data as unknown as CompanyRow[]).map(mapCompanyRow);
}

export async function deleteCompany(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw new Error(`Falha ao excluir empresa: ${error.message}`);
}

export async function updateCompany(
  id: string,
  input: UpdateCompanyInput,
): Promise<CompanyRecord> {
  if (!isSupabaseConfigured()) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      id,
      name: input.name,
      workspaceId: input.workspaceId,
      datasetId: input.datasetId,
      tenantId: input.tenantId,
      clientId: input.clientId,
      clientSecret: input.clientSecret,
      webhookUrl: input.webhookUrl,
      timezone: input.timezone,
      language: input.language,
      powerbiIdentityMode: input.powerbiIdentityMode,
      monthlyMessageLimit: input.monthlyMessageLimit,
      overagePriceCents: input.overagePriceCents,
      createdAt: new Date().toISOString(),
    };
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("companies")
    .update(mapCompanyInput(input))
    .eq("id", id)
    .select(COMPANY_SELECT)
    .single();

  if (error) {
    if (isLegacyCompanySchemaError(error.message)) {
      if (input.monthlyMessageLimit !== null || input.overagePriceCents !== null) {
        throw new Error(
          "Seu banco ainda nao tem todas as colunas opcionais da empresa. Rode a migration para adicionar webhook_url, monthly_message_limit e overage_price_cents na tabela companies.",
        );
      }

      const { data: legacyData, error: legacyError } = await supabase
        .from("companies")
        .update(mapLegacyCompanyInput(input))
        .eq("id", id)
        .select(LEGACY_COMPANY_SELECT)
        .single();

      if (legacyError) {
        throw new Error(`Falha ao atualizar empresa no Supabase: ${legacyError.message}`);
      }

      return mapCompanyRow(legacyData as unknown as LegacyCompanyRow);
    }

    throw new Error(`Falha ao atualizar empresa no Supabase: ${error.message}`);
  }

  return mapCompanyRow(data as unknown as CompanyRow);
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
    .select(COMPANY_SELECT)
    .single();

  if (error) {
    if (isLegacyCompanySchemaError(error.message)) {
      if (input.monthlyMessageLimit !== null || input.overagePriceCents !== null) {
        throw new Error(
          "Seu banco ainda nao tem todas as colunas opcionais da empresa. Rode a migration para adicionar webhook_url, monthly_message_limit e overage_price_cents na tabela companies.",
        );
      }

      const { data: legacyData, error: legacyError } = await supabase
        .from("companies")
        .insert(mapLegacyCompanyInput(input))
        .select(LEGACY_COMPANY_SELECT)
        .single();

      if (legacyError) {
        throw new Error(`Falha ao cadastrar empresa no Supabase: ${legacyError.message}`);
      }

      const company = mapCompanyRow(legacyData as unknown as LegacyCompanyRow);

      await supabase.from("users").insert({
        company_id: company.id,
        name: input.accessUserName,
        email: input.accessUserEmail,
        status: input.accessUserRole,
      });

      return company;
    }

    throw new Error(`Falha ao cadastrar empresa no Supabase: ${error.message}`);
  }

  const company = mapCompanyRow(data as unknown as CompanyRow);

  await supabase.from("users").insert({
    company_id: company.id,
    name: input.accessUserName,
    email: input.accessUserEmail,
    status: input.accessUserRole,
  });

  return company;
}
