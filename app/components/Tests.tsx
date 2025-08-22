"use client";

import { useState } from "react";

type CheckResult = { name: string; ok: boolean; info?: string };

export default function Tests() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);

  async function run() {
    setRunning(true);
    const out: CheckResult[] = [];

    // 1) /api/auth -> hasAdminPassword:true
    try {
      const r = await fetch("/api/auth", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      out.push({
        name: "Auth: hasAdminPassword",
        ok: j?.hasAdminPassword === true,
        info: JSON.stringify(j),
      });
    } catch (e: any) {
      out.push({ name: "Auth: hasAdminPassword", ok: false, info: String(e) });
    }

    // 2) /api/state -> struttura minima corretta
    try {
      const r = await fetch("/api/state", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();

      const d = j?.data ?? j; // supporta sia {data:{...}} che {...}
      const checks = [
        ["teams (10)", Array.isArray(d?.teams) && d.teams.length === 10],
        ["settings.weeks (38)", d?.settings?.weeks === 38],
        ["settings.matchesPerWeek (5)", d?.settings?.matchesPerWeek === 5],
        ["settings.allowDraw (bool)", typeof d?.settings?.allowDraw === "boolean"],
        ["picks (object)", typeof d?.picks === "object" && d?.picks !== null],
        ["results (object)", typeof d?.results === "object" && d?.results !== null],
        ["schedule (array)", Array.isArray(d?.schedule)],
      ] as const;

      for (const [label, ok] of checks) {
        out.push({ name: `State: ${label}`, ok: !!ok });
      }
    } catch (e: any) {
      out.push({ name: "State: fetch/read", ok: false, info: String(e) });
    }

    setResults(out);
    setRunning(false);
  }

  const allOk = results.length > 0 && results.every(x => x.ok);

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-2xl font-semibold">Tests</h2>
      <p className="text-sm opacity-80">
        Esegui controlli rapidi su <code>/api/auth</code> e <code>/api/state</code>.
      </p>
      <button
        onClick={run}
        disabled={running}
        className="px-4 py-2 rounded-2xl shadow border text-sm hover:opacity-90 disabled:opacity-50"
      >
        {running ? "Esecuzione..." : "Esegui test"}
      </button>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <span>{r.ok ? "✅" : "❌"}</span>
              <div>
                <div className="font-medium">{r.name}</div>
                {r.info && <pre className="text-xs opacity-70 overflow-auto">{r.info}</pre>}
              </div>
            </div>
          ))}

          <div className={`p-3 rounded-2xl ${allOk ? "bg-green-100" : "bg-yellow-100"}`}>
            {allOk ? "Tutto OK." : "Alcuni controlli non sono ok. Controlla i dettagli sopra."}
          </div>
        </div>
      )}
    </div>
  );
}
