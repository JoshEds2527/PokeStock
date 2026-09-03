// eBay Browse API client. Client-credentials OAuth, token cached in memory
// (per server instance) and refreshed just before it expires.
//
// Note on scope: the Browse API only covers *active* listings, not sold
// ones. Real sold-price history needs eBay's Marketplace Insights API,
// which requires separate approval beyond a basic developer account -- see
// the README's eBay section for where that approval stands. Everything in
// this file works today with just a standard developer account and keys.

type EbayEnv = "sandbox" | "production";

function currentEnv(): EbayEnv {
  return process.env.EBAY_ENV === "production" ? "production" : "sandbox";
}

const API_BASE: Record<EbayEnv, string> = {
  sandbox: "https://api.sandbox.ebay.com",
  production: "https://api.ebay.com",
};

export function isEbayConfigured(): boolean {
  return Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET);
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("eBay API is not configured (EBAY_CLIENT_ID / EBAY_CLIENT_SECRET missing).");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const env = currentEnv();

  const res = await fetch(`${API_BASE[env]}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "https://api.ebay.com/oauth/api_scope",
    }),
  });

  if (!res.ok) {
    throw new Error(`eBay OAuth token request failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

export type EbayListing = {
  title: string;
  price: number;
  currency: string;
  url: string;
  condition: string | null;
  imageUrl: string | null;
};

type EbayItemSummary = {
  title: string;
  price?: { value?: string; currency?: string };
  itemWebUrl: string;
  condition?: string;
  image?: { imageUrl?: string };
};

// Active listings only -- see the file-level note above about sold prices.
export async function searchActiveListings(query: string, limit = 10): Promise<EbayListing[]> {
  const token = await getAccessToken();
  const env = currentEnv();

  const url = new URL(`${API_BASE[env]}/buy/browse/v1/item_summary/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_GB",
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`eBay Browse API request failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { itemSummaries?: EbayItemSummary[] };
  const items = data.itemSummaries ?? [];

  return items.map((item) => ({
    title: item.title,
    price: Number(item.price?.value ?? 0),
    currency: item.price?.currency ?? "GBP",
    url: item.itemWebUrl,
    condition: item.condition ?? null,
    imageUrl: item.image?.imageUrl ?? null,
  }));
}

// Sold/completed listing prices -- needs Marketplace Insights approval.
// Left as a clear, deliberate failure rather than silently returning
// active-listing prices mislabeled as sold ones.
export async function searchSoldListings(_query: string): Promise<EbayListing[]> {
  throw new Error(
    "Sold-listing prices need eBay's Marketplace Insights API, which requires separate approval beyond a standard developer account. See the README's eBay section for status."
  );
}
