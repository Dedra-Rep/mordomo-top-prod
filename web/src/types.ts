export type PlanId = "free" | "pro" | "exec";

export type Card = {
  badge: string;
  title: string;
  priceRange?: string;
  bullets?: string[];
  url?: string;
};

export type ProFeatures = {
  filters?: string[]; // ex.: "20 polegadas", "até R$ 1500", "frete grátis"
};

export type ExecFeatures = {
  strategy?: string;     // resumo estratégico (ROI, risco, decisão)
  checklist?: string[];  // passos práticos
  risks?: string[];      // riscos/pegadinhas
};

export type ChatResponse = {
  ok: boolean;
  plan: PlanId;
  reply: string;
  cards: Card[];
  pro?: ProFeatures;
  exec?: ExecFeatures;
  meta?: {
    cached?: boolean;
    ms?: number;
    amazonTagUsed?: string;
  };
  error?: string;
};
