import React from "react";
import type { Plan } from "../types";

type Props = {
  plan: Plan;
  onChange: (plan: Plan) => void;
};

function tabStyle(active: boolean) {
  return {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: active ? "rgba(59,130,246,0.20)" : "rgba(255,255,255,0.06)",
    color: "#fff",
    fontWeight: 900 as const,
    cursor: "pointer" as const,
    fontSize: 12,
    letterSpacing: 0.3,
  };
}

export const PlanBar: React.FC<Props> = ({ plan, onChange }) => {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      <button style={tabStyle(plan === "FREE")} onClick={() => onChange("FREE")}>GRÁTIS</button>
      <button style={tabStyle(plan === "PRO")} onClick={() => onChange("PRO")}>PROFISSIONAL</button>
      <button style={tabStyle(plan === "EXEC")} onClick={() => onChange("EXEC")}>EXECUTIVO</button>
    </div>
  );
};
