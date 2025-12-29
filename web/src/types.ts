export type UserRole = "MORDOMO" | "AFILIADO" | "PRO";

export type Recommendation = {
  label: "MAIS BARATO" | "CUSTO-BENEFÍCIO" | "PREMIUM";
  title: string;
  why?: string;
  query?: string;
  priceText?: string;
  url: string;
};

export type AIResponse = {
  text: string;
  recommendations: Recommendation[];
};
