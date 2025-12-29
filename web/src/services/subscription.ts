import type { Plan, SubscriberProfile, AffiliateIds } from "../types";

const LS_KEY = "mordomo_subscriber_v1";

export const STRIPE_PRO_URL = "https://buy.stripe.com/aFa00c3ny7lS5tJ4gS08g00";
export const STRIPE_EXEC_URL = "https://buy.stripe.com/9B65kw4rCgWsf4jaFg08g01";

export function getSubscriber(): SubscriberProfile {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    plan: "FREE",
    ids: { amazonTag: "mordomoai-20" },
    createdAt: Date.now(),
  };
}

export function setSubscriber(next: SubscriberProfile) {
  localStorage.setItem(LS_KEY, JSON.stringify(next));
}

export function setPlan(plan: Plan) {
  const cur = getSubscriber();
  setSubscriber({ ...cur, plan, createdAt: cur.createdAt || Date.now() });
}

export function updateProfile(patch: Partial<Pick<SubscriberProfile, "name" | "email">>) {
  const cur = getSubscriber();
  setSubscriber({ ...cur, ...patch });
}

export function updateIds(ids: AffiliateIds) {
  const cur = getSubscriber();
  setSubscriber({ ...cur, ids: { ...cur.ids, ...ids } });
}

export function canUsePro(plan: Plan) {
  return plan === "PRO" || plan === "EXEC";
}

export function canUseExec(plan: Plan) {
  return plan === "EXEC";
}

/**
 * Link do assinante (MVP):
 * gera um identificador simples e persistente local.
 * Em produção “à prova de fraude”, trocamos por id assinado no backend.
 */
export function getSubscriberLink(): string {
  const cur = getSubscriber();
  const base = `${cur.email || "anon"}|${cur.createdAt}`;
  const ref = btoa(unescape(encodeURIComponent(base))).replace(/=+/g, "");
  const url = new URL(window.location.origin);
  url.searchParams.set("ref", ref);
  return url.toString();
}
