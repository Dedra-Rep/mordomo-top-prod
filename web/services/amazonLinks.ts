// web/services/amazonLinks.ts
export const AMAZON_DEFAULT_TAG = "mordomoai-20"; // ajuste aqui se quiser outro

export function buildAmazonSearchUrl(query: string, tag: string = AMAZON_DEFAULT_TAG) {
  const q = (query || "").trim();
  const safeQ = encodeURIComponent(q.length ? q : "produto");
  const safeTag = encodeURIComponent((tag || AMAZON_DEFAULT_TAG).trim());
  return `https://www.amazon.com.br/s?k=${safeQ}&tag=${safeTag}`;
}

/**
 * Placeholder local (Data URI SVG).
 * - Não depende de API
 * - Sempre carrega
 * - Deixa os cards bonitos mesmo sem imagem real
 */
export function buildPlaceholderImage(title: string) {
  const t = (title || "Produto").trim();
  const label = t.length > 34 ? t.slice(0, 34) + "…" : t;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0b1220"/>
        <stop offset="100%" stop-color="#182742"/>
      </linearGradient>
    </defs>
    <rect width="960" height="540" rx="28" fill="url(#g)"/>
    <circle cx="820" cy="120" r="88" fill="rgba(245,158,11,0.12)"/>
    <circle cx="140" cy="430" r="120" fill="rgba(56,189,248,0.10)"/>
    <text x="60" y="290" fill="rgba(255,255,255,0.92)" font-size="38"
      font-family="Arial, Helvetica, sans-serif" font-weight="800">
      ${escapeXml(label)}
    </text>
    <text x="60" y="350" fill="rgba(255,255,255,0.65)" font-size="20"
      font-family="Arial, Helvetica, sans-serif">
      Mordomo.AI • Amazon Brasil
    </text>
  </svg>`.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
