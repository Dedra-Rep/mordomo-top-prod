import type { AIResponse, AffiliateIds, Plan, UserRole } from "../types";

export async function sendChat(
  message: string,
  role: UserRole,
  plan: Plan,
  affiliate: AffiliateIds
): Promise<AIResponse> {
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, role, plan, affiliate }),
  });

  const data = await r.json().catch(() => ({}));

  if (!r.ok) {
    return {
      text: data?.error ? String(data.error) : `Falha no /api/chat (HTTP ${r.status})`,
      recommendations: [],
    };
  }

  return {
    text: String(data?.text || ""),
    recommendations: Array.isArray(data?.recommendations) ? data.recommendations : [],
  };
}

export async function unlockPlan(plan: "PRO" | "EXEC", code: string): Promise<boolean> {
  const r = await fetch("/api/unlock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, code }),
  });

  const data = await r.json().catch(() => ({}));
  return Boolean(data?.ok);
}
