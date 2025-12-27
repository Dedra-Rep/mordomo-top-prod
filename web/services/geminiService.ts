import type { UserRole, AIResponse, AffiliateIDs } from "../types";

export async function processUserRequest(
  prompt: string,
  role: UserRole,
  affiliateIds: AffiliateIDs = {}
): Promise<AIResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, role, affiliateIds }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`api_error ${res.status} ${txt}`);
  }

  return (await res.json()) as AIResponse;
}
