export type PlanId = "free" | "pro" | "exec";

export type Card = {
  badge: string;
  title: string;
  priceRange?: string;
  bullets?: string[];
  url?: string;
};

export type ChatResponse = {
  ok: boolean;
  plan: PlanId;
  reply: string;
  cards: Card[];
  meta?: {
    cached?: boolean;
    ms?: number;
    amazonTagUsed?: string;
  };
  error?: string;
};
