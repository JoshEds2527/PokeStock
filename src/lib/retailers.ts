import { gunzipSync } from "zlib";

// Retailer sitemap adapters for the "listing watch" feature -- watches a
// retailer's product sitemap for new URLs matching a keyword, so a product
// page appearing (even before it's purchasable) gets caught early. This is
// deliberately sitemap-based, not page-scraping: sitemaps are published
// specifically to be crawled, so it works on sites that block ordinary
// scraping. Only retailers confirmed (2026-09-03) to serve a real, unblocked
// product sitemap are listed here -- Argos, Very, Smyths, and Pokémon Center
// all block sitemap access the same way they block everything else, so
// they're intentionally not included. See README's phase 2 section.

export type RetailerId = "JOHN_LEWIS" | "HAMLEYS" | "CHAOS_CARDS" | "ZAVVI";

type RetailerConfig = {
  id: RetailerId;
  label: string;
  // Returns the sitemap URL(s) that actually list product pages -- for
  // retailers whose product sitemap is split into many files, this crawls
  // the index first.
  getProductSitemapUrls: () => Promise<string[]>;
};

const USER_AGENT = "Mozilla/5.0 (compatible; PokeStockBot/1.0; +https://github.com/JoshEds2527/PokeStock)";

async function fetchSitemapText(url: string): Promise<string> {
  // cache: "no-store" is required, not just wanted: Next.js's patched fetch
  // otherwise tries to run these (multi-MB) responses through its data
  // cache and fails outright rather than just skipping caching.
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, cache: "no-store" });
  if (!res.ok) throw new Error(`Sitemap fetch failed for ${url}: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  // Gzip magic bytes -- some sitemaps are served as .gz files rather than
  // relying on HTTP-level Content-Encoding.
  if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
    return gunzipSync(buffer).toString("utf-8");
  }
  return buffer.toString("utf-8");
}

function extractLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

const RETAILERS: Record<RetailerId, RetailerConfig> = {
  JOHN_LEWIS: {
    id: "JOHN_LEWIS",
    label: "John Lewis",
    getProductSitemapUrls: async () => {
      const index = await fetchSitemapText("https://www.johnlewis.com/sitemap/products/products.xml");
      return extractLocs(index);
    },
  },
  HAMLEYS: {
    id: "HAMLEYS",
    label: "Hamleys",
    getProductSitemapUrls: async () => {
      const index = await fetchSitemapText("https://www.hamleys.com/media/sitemap.xml");
      return extractLocs(index);
    },
  },
  CHAOS_CARDS: {
    id: "CHAOS_CARDS",
    label: "Chaos Cards",
    getProductSitemapUrls: async () => {
      const index = await fetchSitemapText("https://www.chaoscards.co.uk/sitemap.xml");
      return extractLocs(index).filter((url) => url.includes("sitemap-products"));
    },
  },
  ZAVVI: {
    id: "ZAVVI",
    label: "Zavvi",
    getProductSitemapUrls: async () => {
      const index = await fetchSitemapText("https://www.zavvi.com/sitemapindex-product.xml.gz");
      return extractLocs(index);
    },
  },
};

export function listRetailers() {
  return Object.values(RETAILERS).map((r) => ({ id: r.id, label: r.label }));
}

export function isValidRetailer(id: string): id is RetailerId {
  return id in RETAILERS;
}

// Every product URL for the retailer whose loc contains `keyword`
// (case-insensitive substring match). Re-fetches and re-scans the whole
// sitemap each call -- "new" is determined by the caller comparing against
// previously seen URLs, not by anything cached here.
export async function findMatchingListings(retailerId: RetailerId, keyword: string): Promise<string[]> {
  const config = RETAILERS[retailerId];
  const sitemapUrls = await config.getProductSitemapUrls();
  const lowerKeyword = keyword.toLowerCase();

  const perFile = await Promise.all(
    sitemapUrls.map(async (url) => {
      try {
        const xml = await fetchSitemapText(url);
        return extractLocs(xml).filter((loc) => loc.toLowerCase().includes(lowerKeyword));
      } catch {
        // One sub-sitemap failing (timeout, transient error) shouldn't fail
        // the whole check -- it'll just be retried next time.
        return [];
      }
    })
  );

  return perFile.flat();
}
