"use client";
import React, { useState } from "react";

export default function ScheduleImportPage() {
  const [csv, setCsv] = useState("");
  const [adminPw, setAdminPw] = useState("");
  const [jsonPreview, setJsonPreview] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  function parseCSV(text: string) {
    const clean = text.trim();
    if (!clean) return [];
    const commaCount = (clean.match(/,/g) || []).length;
    const semiCount = (clean.match(/;/g) || []).length;
    const delim = semiCount > commaCount ? ";" : ",";

    const rows = clean.split(/\r?\n/).filter((r) => r.trim() !== "");
    if (rows.length === 0) return [];

    const norm = (s: string) =>
      s.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9_]/g, "");

    const header = rows[0].split(delim).map((h) => norm(h));
    let weekIdx = header.findIndex((h) => h === "week");
    let matchIdx =
      header.findIndex((h) => h === "matchnumber") !== -1
        ? header.findIndex((h) => h === "matchnumber")
        : header.findIndex((h) => h === "match");
    let homeIdx = header.findIndex((h) => h === "home");
    let awayIdx = header.findIndex((h) => h === "away");

    // fallback: prime 4 colonne
    if (weekIdx < 0 || matchIdx < 0 || homeIdx < 0 || awayIdx < 0) {
      weekIdx = 0;
      matchIdx = 1;
      homeIdx = 2;
      awayIdx = 3;
    }

    const out: any[] = [];
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(delim);
      const w = Number(String(cols[weekIdx] ?? "").trim());
      const m = Number(String(cols[matchIdx] ?? "").trim());
      const h = String(cols[homeIdx] ?? "").trim();
      const a = String(cols[awayIdx] ?? "").trim();
      if (!w || !m || !h || !a) continue;
      out.push({ week: w, matchNumber: m, home: h, away: a });
    }
    return out;
  }

  const handleConvert = () => {
    try {
      const arr = parseCSV(csv);
      setJsonPreview(arr);
      setMsg(`Convertite ${arr.length} righe.`);
    } catch (e: any) {
      setMsg(e?.message || "Errore conversione CSV");
    }
  };

  const handleUpdate = async () => {
    try {
      if (!adminPw) {
        setMsg("Inserisci la password admin.");
        return;
      }
      if (!jsonPreview.length) {
        setMsg("Converti prima il CSV.");
        return;
      }
      setMsg("Aggiornamento in corso…");

      // 1) Leggo stato attuale
      const getRes = await fetch("/api/state", { method: "GET" });
      if (!getRes.ok) {
        setMsg("Errore lettura stato");
        return;
      }
      const data = await getRes.json();

      // 2) Sostituisco schedule e aggiorno timestamp
      const newData = { ...data, schedule: jsonPreview, updatedAt: new Date().toISOString() };

      // 3) Salvo su Supabase tramite API admin-protetta
      const postRes = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPw, data: newData }),
      });
      const body = await postRes.json().catch(() => ({}));
      if (!postRes.ok) {
        throw new Error(body?.error || "Errore salvataggio");
      }
      setMsg("OK: schedule aggiornato.");
    } catch (e: any) {
      setMsg(e?.message || "Errore aggiornamento");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">Importa calendario da CSV</h1>
      <p className="text-sm opacity-80">
        Colonne richieste: <code>week, matchNumber, home, away</code> (delimitatore <code>,</code> o <code>;</code>).
      </p>

      <div className="grid gap-2">
        <label className="text-sm">CSV</label>
        <textarea
          className="w-full h-48 p-2 border rounded"
          placeholder={`week,matchNumber,home,away
1,1,OFF,ISAMU
1,2,SPIAZE,HORTO
...`}
          value={csv}
          onChange={(e) => setCsv(e.currentTarget.value)}
        />
      </div>

      <div className="grid gap-2 max-w-sm">
        <label className="text-sm">Password Admin (ADMIN_PASSWORD)</label>
        <input
          type="password"
          className="p-2 border rounded"
          value={adminPw}
          onChange={(e) => setAdminPw(e.currentTarget.value)}
          placeholder="••••••"
        />
      </div>

      <div className="flex gap-2">
        <button className="px-3 py-2 border rounded" onClick={handleConvert}>Converti</button>
        <button className="px-3 py-2 border rounded" onClick={handleUpdate}>Aggiorna Supabase</button>
      </div>

      {msg && <div className="text-sm">{msg}</div>}

      {jsonPreview.length > 0 && (
        <div className="text-sm">
          <div className="mb-2">Anteprima JSON ({jsonPreview.length} righe):</div>
          <pre className="p-2 bg-black/5 rounded overflow-auto max-h-64">
{JSON.stringify(jsonPreview.slice(0, 10), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
