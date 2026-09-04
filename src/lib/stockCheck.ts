// Fetches a stored StockWatch product-page URL and infers in-stock /
// out-of-stock status. Deliberately retailer-agnostic (unlike retailers.ts's
// sitemap adapters) since a StockWatch can point at any URL a user adds, not
// just the four sitemap-friendly retailers. Fetching still only succeeds for
// sites that don't block plain HTTP requests -- Argos/Very/Smyths/Pokémon
// Center block this the same way they block sitemap access (see README), so
// a watch against those simply fails the check with an error, exactly like
// it does today with no automation at all.

const USER_AGENT = "Mozilla/5.0 (compatible; PokeStockBot/1.0; +https://github.com/JoshEds2527/PokeStock)";

export type DetectedStatus = "IN_STOCK" | "OUT_OF_STOCK" | "UNKNOWN";

// Checked before the in-stock phrases: a page can mention "add to basket"
// inside disabled/greyed-out markup right next to an explicit "out of
// stock" notice, so treat the negative signal as authoritative when both
// are present.
const OUT_OF_STOCK_PHRASES = [
  "out of stock",
  "sold out",
  "currently unavailable",
  "temporarily out of stock",
  "notify me when available",
  "notify me when back in stock",
  "email me when back in stock",
];

const IN_STOCK_PHRASES = ["add to basket", "add to cart", "add to trolley", "add to bag", "in stock"];

function statusFromSchemaAvailability(availability: string): DetectedStatus | null {
  const normalized = availability.toLowerCase();
  if (normalized.includes("outofstock") || normalized.includes("soldout") || normalized.includes("discontinued")) {
    return "OUT_OF_STOCK";
  }
  if (normalized.includes("instock") || normalized.includes("limitedavailability") || normalized.includes("preorder")) {
    return "IN_STOCK";
  }
  return null;
}

// Most UK retailers embed schema.org Product/Offer JSON-LD for SEO -- this
// is far more reliable than scraping visible text, so it's tried first.
function extractJsonLdAvailability(html: string): DetectedStatus | null {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

  for (const block of blocks) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(block[1]);
    } catch {
      continue; // Malformed/partial JSON-LD -- ignore and try the next block.
    }

    const roots = Array.isArray(parsed) ? parsed : [parsed];
    for (const root of roots) {
      const record = root as Record<string, unknown> | null;
      const nodes = Array.isArray(record?.["@graph"]) ? (record!["@graph"] as unknown[]) : [record];

      for (const node of nodes) {
        const offers = (node as Record<string, unknown> | null)?.offers as Record<string, unknown> | Record<string, unknown>[] | undefined;
        const offer = Array.isArray(offers) ? offers[0] : offers;
        const availability = offer?.availability;
        if (typeof availability === "string") {
          const status = statusFromSchemaAvailability(availability);
          if (status) return status;
        }
      }
    }
  }

  return null;
}

function statusFromBodyText(html: string): DetectedStatus {
  const text = html.toLowerCase();
  if (OUT_OF_STOCK_PHRASES.some((phrase) => text.includes(phrase))) return "OUT_OF_STOCK";
  if (IN_STOCK_PHRASES.some((phrase) => text.includes(phrase))) return "IN_STOCK";
  return "UNKNOWN";
}

export async function checkStockStatus(url: string): Promise<DetectedStatus> {
  // cache: "no-store" avoids the same Next.js fetch-cache failure documented
  // in retailers.ts for large sitemap responses.
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Page fetch failed (${res.status}). This retailer may be blocking automated checks.`);
  }

  const html = await res.text();
  return extractJsonLdAvailability(html) ?? statusFromBodyText(html);
}
