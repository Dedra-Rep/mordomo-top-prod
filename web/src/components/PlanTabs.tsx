import React, { useMemo, useState } from "react";
import type { PlanId } from "../types";

type Props = {
  plan: PlanId;
  onChange: (p: PlanId) => void;
};

function getUnlocked(plan: PlanId) {
  if (plan === "free") return true;
  const key = plan === "pro" ? "mordomo_unlocked_pro" : "mordomo_unlocked_exec";
  return localStorage.getItem(key) === "1";
}

function setUnlocked(plan: PlanId, value: boolean) {
  const key = plan === "pro" ? "mordomo_unlocked_pro" : "mordomo_unlocked_exec";
  localStorage.setItem(key, value ? "1" : "0");
}

export const PlanTabs: React.FC<Props> = ({ plan, onChange }) => {
  const [show, setShow] = useState<null | PlanId>(null);
  const [code, setCode] = useState("");

  const unlockedPro = useMemo(() => (typeof window !== "undefined" ? getUnlocked("pro") : false), []);
  const unlockedExec = useMemo(() => (typeof window !== "undefined" ? getUnlocked("exec") : false), []);

  function clickPlan(p: PlanId) {
    if (p === "free") return onChange("free");
    const unlocked = p === "pro" ? unlockedPro : unlockedExec;
    if (unlocked) return onChange(p);
    setShow(p);
    setCode("");
  }

  function confirm() {
    const p = show;
    if (!p) return;

    const expected = p === "pro"
      ? (import.meta as any).env.VITE_PRO_UNLOCK_CODE
      : (import.meta as any).env.VITE_EXEC_UNLOCK_CODE;

    // fallback: se não existirem VITE_*, desbloqueia via input e valida no backend depois (hoje: local)
    const ok = String(code || "").trim() && String(code || "").trim() === String(expected || "").trim();

    if (!expected) {
      // se não tiver env no Vite, permite continuar mas mantém travado sem código correto
      alert("Configuração ausente no front (VITE_*). Vou deixar você continuar no Grátis por enquanto.");
      setShow(null);
      return onChange("free");
    }

    if (!ok) {
      alert("Código inválido.");
      return;
    }

    setUnlocked(p, true);
    setShow(null);
    onChange(p);
  }

  const btn = (id: PlanId, label: string, locked: boolean) => {
    const active = plan === id;
    return (
      <button
        onClick={() => clickPlan(id)}
        className={[
          "px-4 py-2 rounded-full text-xs font-semibold border",
          active ? "bg-white/10 border-white/25 text-white" : "bg-black/20 border-white/10 text-white/70 hover:text-white hover:bg-white/5",
          locked ? "opacity-70" : ""
        ].join(" ")}
      >
        {label} {locked ? "🔒" : ""}
      </button>
    );
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {btn("free", "GRÁTIS", false)}
        {btn("pro", "PROFISSIONAL", !unlockedPro)}
        {btn("exec", "EXECUTIVO", !unlockedExec)}
      </div>

      {show && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0b1220] border border-white/10 p-5 text-white">
            <div className="text-lg font-bold">Desbloquear {show === "pro" ? "Profissional" : "Executivo"}</div>
            <div className="mt-2 text-sm text-white/70">
              Digite o código de desbloqueio.
            </div>

            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-4 w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-white/25"
              placeholder={show === "pro" ? "PRO-XXXX" : "EXEC-XXXX"}
            />

            <div className="mt-4 flex gap-2 justify-end">
              <button
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
                onClick={() => setShow(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 border border-white/20 font-semibold"
                onClick={confirm}
              >
                Desbloquear
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
