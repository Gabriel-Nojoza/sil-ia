export type PowerBiRow = Record<string, unknown>;

interface CachedToken {
  token: string;
  expiresAt: number;
}

// In-process cache keyed by tenantId+clientId — tokens are valid for 1 hour,
// we refresh 5 min early to avoid serving a token that expires mid-request.
const tokenCache = new Map<string, CachedToken>();

export async function getPowerBiToken(
  tenantId: string,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const cacheKey = `${tenantId}::${clientId}`;
  const cached = tokenCache.get(cacheKey);

  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://analysis.windows.net/powerbi/api/.default",
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao obter token Power BI: ${response.status} - ${text}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in?: number };

  const ttlMs = ((data.expires_in ?? 3600) - 300) * 1000; // 5-min safety margin
  tokenCache.set(cacheKey, { token: data.access_token, expiresAt: Date.now() + ttlMs });

  return data.access_token;
}

export async function executePowerBiDax(
  workspaceId: string,
  datasetId: string,
  accessToken: string,
  dax: string,
): Promise<PowerBiRow[]> {
  const url = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/datasets/${datasetId}/executeQueries`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      queries: [{ query: dax }],
      serializerSettings: { includeNulls: true },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao executar DAX no Power BI: ${response.status} - ${text}`);
  }

  const data = await response.json();
  const rows: PowerBiRow[] = data?.results?.[0]?.tables?.[0]?.rows ?? [];
  return rows;
}
