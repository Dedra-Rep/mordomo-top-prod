export const AMAZON_DEFAULT_TAG = "mordomoai-20";

export function buildAmazonSearchUrl(query: string, tag: string = AMAZON_DEFAULT_TAG) {
  const q = encodeURIComponent(String(query || "").trim());
  const t = encodeURIComponent(String(tag || "").trim() || AMAZON_DEFAULT_TAG);
  return `https://www.amazon.com.br/s?k=${q}&tag=${t}`;
}

export function buildPlaceholderImage(seed: string) {
  // Placeholder leve, sem dependências; evita “quebrar layout”
  const text = encodeURIComponent((seed || "produto").slice(0, 24));
  return `https://dummyimage.com/800x800/0b1220/ffffff&text=${text}`;
}
