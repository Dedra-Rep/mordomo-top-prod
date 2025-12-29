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
  amazonTag?: string;       // ex: mordomoai-20
  mercadoLivreId?: string;
  shopeeId?: string;
  ebayId?: string;
  aliexpressId?: string;
};

export type SubscriberProfile = {
  plan: Plan;
  name?: string;
  email?: string;
  ids: AffiliateIds;
  createdAt: number;
};
