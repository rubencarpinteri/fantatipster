"use client";
import React, { useEffect, useState } from "react";

type Players = Record<string, { password?: string; name?: string }>;

export default function PlayersPage() {
  const [adminPw, setAdminPw] = useState("");
  const [players, setPlayers] = useState<Players>({});
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [n, setN] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setMsg("Carico stato…");
    try {
      const r = await fetch("/api/state");
      const data = await r.json();
      setPlayers((data?.settings?.players ?? {}) as Players);
      setMsg("Pronto");
    } catch {
      setMsg("Errore caricamento stato");
    } finally {
      setLoading(false);
    }
  }

  async function save(nextPlayers: Players) {
    if (!adminPw) { setMsg("Inserisci la password admin"); return; }
    setLoading(true);
    setMsg("Salvataggio…");
    try {
      // leggi stato attuale
      const r = await fetch("/api/state");
      const data = await r.json();

      const newData = {
        ...data,
        settings: { ...(data.settings ?? {}), players: nextPlayers },
        updatedAt: new Date().toISOString(),
      };

      const wr = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPw, data: newData }),
      });
      if (!wr.ok) {
        const e = await wr.json().catch(()=>({error:"Errore salvataggio"}));
        throw new Error(e.error || "Errore salvataggio");
      }
      setPlayers(nextPlayers);
      setMsg("OK salvato");
    } catch (e:any) {
      setMsg(e?.message || "Errore");
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    const key = (u || "").trim().toLowerCase();
    const pass = (p || "").trim();
    const name = (n || "").trim() || key;
    if (!key || !pass) { setMsg("Username e password sono obbligatori"); return; }
    const next = { ...players, [key]: { password: pass, name } };
    save(next);
    setU(""); setP(""); setN("");
  }

  function handleRemove(key: string) {
    if (!confirm(`Rimuovere l'utente "${key}" dalla lista? (Le schedine esistenti restano nei picks)`)) return;
    const next = { ...players };
    delete next[key];
    save(next);
  }

  useEffect(()=>{ load(); }, []);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">Gestione Utenti (players)</h1>

      <div className="grid gap-2 max-w-sm">
        <label className="text-sm">Password Admin (ADMIN_PASSWORD)</label>
        <input
          type="password"
          className="p-2 border rounded"
          value={adminPw}
          onChange={(e)=>setAdminPw(e.target.value)}
          placeholder="••••••"
        />
      </div>

      <div className="text-sm">{loading ? "⏳ " : ""}{msg}</div>

      <div className="border rounded p-3 space-y-2">
        <div className="font-medium">Aggiungi utente</div>
        <div className="grid gap-2 md:grid-cols-3">
          <input className="p-2 border rounded" placeholder="username (minuscolo)"
                 value={u} onChange={(e)=>setU(e.target.value)} />
          <input className="p-2 border rounded" placeholder="password"
                 value={p} onChange={(e)=>setP(e.target.value)} />
          <input className="p-2 border rounded" placeholder="Nome visibile (opzionale)"
                 value={n} onChange={(e)=>setN(e.target.value)} />
        </div>
        <button className="px-3 py-2 border rounded bg-gray-700 text-white hover:bg-gray-600"
                onClick={handleAdd}>
          Aggiungi
        </button>
      </div>

      <div className="border rounded">
        <div className="p-3 font-medium">Utenti attuali</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-black/5">
              <th className="text-left p-2">Username</th>
              <th className="text-left p-2">Nome</th>
              <th className="text-left p-2">Password</th>
              <th className="p-2">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(players).sort().map(k=>(
              <tr key={k} className="border-t">
                <td className="p-2 font-mono">{k}</td>
                <td className="p-2">{players[k]?.name ?? ""}</td>
                <td className="p-2">{players[k]?.password ?? ""}</td>
                <td className="p-2 text-center">
                  <button className="px-2 py-1 border rounded hover:bg-black/5"
                          onClick={()=>handleRemove(k)}>
                    Rimuovi
                  </button>
                </td>
              </tr>
            ))}
            {Object.keys(players).length===0 && (
              <tr><td className="p-2 text-zinc-500" colSpan={4}>Nessun utente</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-zinc-500">
        Nota: questa pagina aggiorna <code>settings.players</code>. Le schedine già inviate restano in <code>picks</code>.
      </div>
    </div>
  );
}
