"use client";
import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function BoardPage(){
  const [data, setData] = React.useState<any|null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(()=>{ (async()=>{
    try{
      const r = await fetch("/api/state", { cache: "no-store" });
      const j = await r.json();
      setData(j);
    } finally { setLoading(false); }
  })(); },[]);

  if (loading) return <div className="p-4">Carico…</div>;
  if (!data) return <div className="p-4">Nessun dato</div>;

  const settings = data?.settings ?? {};
  const results  = data?.results  ?? {};
  const picks    = data?.picks    ?? {};
  const players  = Object.keys(((settings as any)?.players ?? {}) as Record<string, any>);
  const weeks    = Array.from({ length: Number(((settings as any)?.weeks) ?? 38) }, (_,i)=>i+1);
  const pointsCorrect  = Number(((settings as any)?.pointsCorrect) ?? 1);
  const bonusPerfect   = Number(((settings as any)?.bonusPerfectWeek) ?? 0);
  const matchesPerWeek = Number(((settings as any)?.matchesPerWeek) ?? 5);
  const sign = (hg:any, ag:any) => (Number(hg)>Number(ag) ? "1" : Number(hg)<Number(ag) ? "2" : "X");

  // Classifica totale
  const totals = players.map(u=>{
    let tot = 0;
    weeks.forEach(w=>{
      let correct = 0;
      for(let m=1;m<=matchesPerWeek;m++){
        const r = results?.[`${w}_${m}`];
        if(!r) continue;
        const s = sign(r.hg, r.ag);
        const p = picks?.[u]?.weeks?.[w]?.[m];
        if(p && p===s) correct++;
      }
      tot += (correct*pointsCorrect) + (correct===matchesPerWeek ? bonusPerfect : 0);
    });
    return { user:u, name: (settings?.players?.[u]?.name ?? u), points: tot };
  }).sort((a,b)=> b.points - a.points);

  // Serie settimanale (per grafico)
  const weekly = weeks.map(w=>{
    const row:any = { week: w };
    players.forEach(u=>{
      let correct = 0;
      for(let m=1;m<=matchesPerWeek;m++){
        const r = results?.[`${w}_${m}`];
        if(!r) continue;
        const s = sign(r.hg, r.ag);
        const p = picks?.[u]?.weeks?.[w]?.[m];
        if(p && p===s) correct++;
      }
      const pts = (correct*pointsCorrect) + (correct===matchesPerWeek ? bonusPerfect : 0);
      row[u] = (picks?.[u]?.weeks?.[w]) ? pts : null; // lascia buchi se non hanno giocato
    });
    return row;
  });

  const palette = ['#e6194B','#3cb44b','#ffe119','#4363d8','#f58231','#911eb4','#46f0f0','#f032e6','#bcf60c','#fabebe'];

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Classifica</h1>
      <div className="border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-black/5">
              <th className="text-left p-2">#</th>
              <th className="text-left p-2">Giocatore</th>
              <th className="text-right p-2">Punti</th>
            </tr>
          </thead>
          <tbody>
            {totals.map((r, i)=>(
              <tr key={r.user} className="border-t">
                <td className="p-2">{i+1}</td>
                <td className="p-2">{r.name}</td>
                <td className="p-2 text-right font-medium">{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border rounded p-3">
        <div className="mb-2 font-semibold">Andamento settimanale</div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weekly} margin={{ left:8, right:16, top:8, bottom:8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" label={{ value:'Week', position:'insideBottomRight', offset:-5 }} />
              <YAxis domain={[0, matchesPerWeek]} ticks={Array.from({length: matchesPerWeek+1}, (_,i)=>i)} allowDecimals={false} label={{ value:'Punti', angle:-90, position:'insideLeft' }} />
              <Tooltip />
              <Legend />
              {players.map((u, idx)=>(
                <Line key={u} type="monotone" dataKey={u} stroke={palette[idx % palette.length]} dot={false} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
