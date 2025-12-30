export type UserRole = "MORDOMO" | "AFILIADO" | "PRO";

export type Plan = "FREE" | "PRO" | "EXEC";

export type RecommendationLabel = "MAIS BARATO" | "CUSTO-BENEFÍCIO" | "PREMIUM";

export type Recommendation = {
  label: RecommendationLabel;
  title: string;
  why?: string;
  query?: string;
  priceText?: string;
  url: string;
  imageUrl?: string;
};

export type AIResponse = {
  text: string;
  recommendations: Recommendation[];
};

export type AffiliateIds = {
  amazonTag: string;
  mercadoLivre?: string;
  shopee?: string;
  ebay?: string;
  aliexpress?: string;
};
