"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Download, Upload, Trophy, Settings as SettingsIcon, CalendarDays,
  CheckCircle2, User, Star, BarChart3, RefreshCw, LogOut, Edit3,
  RotateCcw, ArrowLeftRight, Lock, Unlock
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

/**
 * Fantatipster — Prediction League (single-file React app)
 * - Admin con password lato server (/api/auth)
 * - Stato condiviso su cloud (/api/state, /api/pick)
 * - Non-admin: SOLO Schedina + Classifica
 * - Admin: + Risultati, Settings, Dati, Tests
 * - Admin non persistito su localStorage e forzato off a ogni load
 */

/* ------------------ Tiny UI (Tailwind-only) ------------------ */
type DivProps = React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode };
type Variant = "primary" | "secondary" | "ghost" | "outline" | "destructive";
type Size = "sm" | "md" | "lg";

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}
function Btn({
  children, onClick, variant = "primary", size = "md", className = "", type = "button", ...rest
}: BtnProps) {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition active:scale-[0.98]";
  const sizes: Record<Size, string> = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2", lg: "px-5 py-3 text-lg" };
  const variants: Record<Variant, string> = {
    primary: "bg-black text-white hover:opacity-90",
    secondary: "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700",
    ghost: "bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800",
    outline: "border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800",
    destructive: "bg-red-600 text-white hover:bg-red-500",
  };
  return (
    <button type={type} onClick={onClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
function Card({ children, className = "", ...rest }: DivProps) {
  return <div {...rest} className={`rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm ${className}`}>{children}</div>;
}
function CardHeader({ children, className = "", ...rest }: DivProps) {
  return <div {...rest} className={`p-5 ${className}`}>{children}</div>;
}
function CardTitle({ children, className = "", ...rest }: DivProps) {
  return <div {...rest} className={`text-xl font-semibold ${className}`}>{children}</div>;
}
function CardDescription({ children, className = "", ...rest }: DivProps) {
  return <div {...rest} className={`text-sm text-zinc-500 dark:text-zinc-400 ${className}`}>{children}</div>;
}
function CardContent({ children, className = "", ...rest }: DivProps) {
  return <div {...rest} className={`p-5 pt-0 ${className}`}>{children}</div>;
}
function Separator({ className = "", ...rest }: { className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={`h-px w-full bg-zinc-200 dark:bg-zinc-800 ${className}`}></div>;
}
function Badge(
  { children, variant = "default", className = "", ...rest }:
  { children?: React.ReactNode; variant?: "default"|"secondary"|"outline"|"destructive"; className?: string } & DivProps
) {
  const variants: Record<NonNullable<{ variant?: "default"|"secondary"|"outline"|"destructive" }["variant"]>, string> = {
    default: "bg-black text-white",
    secondary: "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white",
    outline: "border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200",
    destructive: "bg-red-600 text-white",
  };
  return <span {...rest} className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${variants[variant]} ${className}`}>{children}</span>;
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={`w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-400 ${className}`} />;
}
function Label({ children, className = "", ...rest }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...rest} className={`block text-sm font-medium mb-1 ${className}`}>{children}</label>;
}
// Select tipizzato con onValueChange(string)
type SelectBoxProps = {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value' | 'children'>;
function SelectBox({ value, onValueChange, children, className = "", ...rest }: SelectBoxProps) {
  return (
    <select value={value} onChange={(e) => onValueChange(e.target.value)}
      className={`w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 ${className}`} {...rest}>
      {children}
    </select>
  );
}
function SwitchToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button aria-pressed={checked} onClick={() => onChange(!checked)}
      className={`h-6 w-11 rounded-full relative transition ${checked ? 'bg-black' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
      <span className={`absolute top-1/2 -translate-y-1/2 left-1 ${checked ? 'translate-x-5' : ''} inline-block h-4 w-4 rounded-full bg-white transition`} />
    </button>
  );
}
function Modal(
  { open, onClose, title, description, children, footer }:
  { open: boolean; onClose: () => void; title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode }
) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl rounded-3xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl">
          <div className="p-5">
            <div className="text-lg font-semibold">{title}</div>
            {description ? <div className="text-sm text-zinc-500 mt-1">{description}</div> : null}
          </div>
          <div className="px-5 pb-5">{children}</div>
          <Separator />
          <div className="p-4 flex justify-end gap-2">{footer}</div>
        </div>
      </div>
    </div>
  );
}
function Tabs(
  { value, onValueChange, tabs }:
  { value: string; onValueChange: (v: string) => void; tabs: { value: string; label: string; content: React.ReactNode }[] }
) {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {tabs.map(t => (
          <Btn key={t.value} variant={value===t.value? 'primary':'secondary'} onClick={()=>onValueChange(t.value)}>
            {t.label}
          </Btn>
        ))}
      </div>
      <div className="mt-4">
        {tabs.find(t=>t.value===value)?.content}
      </div>
    </>
  );
}

/* ------------------ App Logic ------------------ */
const LS_KEY = "fantatipster_state_v2";
function loadState() {
  try { if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveState(state: any){
  try { if (typeof window !== 'undefined') localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
}
const defaultTeams = Array.from({ length: 10 }, (_, i) => `Team ${i + 1}`);
const defaultSettings = { numTeams: 10, weeks: 38, matchesPerWeek: 5, pointsCorrect: 1, bonusPerfectWeek: 2, allowDraw: true };

function generateRoundRobin(teams: string[]){
  const n=teams.length, arr=[...teams], weeks: {home:string; away:string}[][]=[];
  for(let r=0;r<n-1;r++){
    const pairs: {home:string; away:string}[]=[];
    for(let i=0;i<n/2;i++){ pairs.push({home:arr[i], away:arr[n-1-i]}); }
    weeks.push(pairs);
    arr.splice(1,0,arr.pop() as string);
  }
  return weeks;
}
function toSchedule(teams: string[], weeksWanted=38){
  const rr1=generateRoundRobin(teams);
  const rr2=generateRoundRobin([...teams]).map(w=>w.map(m=>({home:m.away, away:m.home})));
  let weeks=[...rr1,...rr2];
  while(weeks.length<weeksWanted){ weeks=[...weeks, ...weeks.map(w=>w.map(m=>({home:m.away, away:m.home})))]; }
  weeks=weeks.slice(0,weeksWanted);
  const out: {week:number; matchNumber:number; home:string; away:string}[]=[];
  weeks.forEach((w,wi)=> w.slice(0,5).forEach((m,mi)=> out.push({week:wi+1, matchNumber:mi+1, home:m.home, away:m.away})));
  return out;
}
function resultToSign(h: any,a: any){
  if(h===""||a===""||h==null||a==null) return "";
  const hg=Number(h), ag=Number(a);
  if(Number.isNaN(hg)||Number.isNaN(ag)) return "";
  return hg===ag?"X":(hg>ag?"1":"2");
}

export default function Fantatipster(){
  const persisted = loadState();
  const [user, setUser] = useState<{name:string; email:string}>(persisted?.user || { name: "", email: "" });
  const [settings, setSettings] = useState<typeof defaultSettings>(persisted?.settings || defaultSettings);
  const [teams, setTeams] = useState<string[]>(persisted?.teams || defaultTeams);
  const [schedule, setSchedule] = useState<{week:number; matchNumber:number; home:string; away:string}[]>(persisted?.schedule || toSchedule(defaultTeams, defaultSettings.weeks));
  const [results, setResults] = useState<Record<string, {hg:any; ag:any}>>(persisted?.results || {});
  const [picks, setPicks] = useState<Record<string, { name:string; weeks: Record<string, Record<string, '1'|'X'|'2'>> }>>(persisted?.picks || {});
  const [week, setWeek] = useState<number>(persisted?.week || 1);

  // Admin: NON persistito e forzato OFF ad ogni load
  const [adminLogged, setAdminLogged] = useState<boolean>(false);
  const [adminPw, setAdminPw] = useState<string>("");

  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminInput, setAdminInput] = useState("");

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [scheduleDraft, setScheduleDraft] = useState<{week:number; matchNumber:number; home:string; away:string}[]>([]);

  const [lastSync, setLastSync] = useState<string | null>(null);

  // Persistenza locale (senza admin)
  useEffect(()=>{ saveState({ user, settings, teams, schedule, results, picks, week }); },
    [user, settings, teams, schedule, results, picks, week]);

  // Forza stato non-admin a ogni mount
  useEffect(() => { setAdminLogged(false); setAdminPw(""); }, []);

  // Carica dallo stato cloud
  useEffect(()=>{ (async()=>{
    try {
      const r = await fetch('/api/state', { cache: 'no-store' });
      if(!r.ok){ return; }
      const data = await r.json();
      if (Array.isArray(data.teams)) setTeams(data.teams);
      if (data.settings) setSettings((s:any)=> ({...s, ...data.settings}));
      if (Array.isArray(data.schedule) && data.schedule.length>0) setSchedule(data.schedule);
      if (data.results) setResults(data.results);
      if (data.picks) setPicks(data.picks);
      if (data.updatedAt) setLastSync(data.updatedAt);
      if (!data.schedule || data.schedule.length===0) {
        const regen = toSchedule(data.teams || teams, (data.settings?.weeks)||settings.weeks);
        setSchedule(regen);
      }
    } catch(e){ /* cloud non configurato o offline */ }
  })(); }, []);

  const matchesThisWeek = useMemo(()=> schedule.filter(m=>m.week===week), [schedule, week]);

  function ensureUserNode(email:string, name:string){
    setPicks(prev=>{
      const next={...prev};
      if(!next[email]) next[email]={name, weeks:{}};
      if(!next[email].weeks[week]) next[email].weeks[week]={};
      return next;
    });
  }
  async function setPick(email:string, name:string, wk:number, matchNumber:number, value:'1'|'X'|'2'){
    setPicks(prev=>{
      const n={...prev};
      if(!n[email]) n[email]={name, weeks:{}};
      if(!n[email].weeks[wk]) n[email].weeks[wk]={};
      n[email].weeks[wk][matchNumber]=value;
      return n;
    });
    try {
      await fetch('/api/pick', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, name, week:wk, matchNumber, pick:value })
      });
      setLastSync(new Date().toISOString());
    } catch {}
  }
  function setResultLocal(wk:number, matchNumber:number, hg:any, ag:any){
    setResults(prev=>({ ...prev, [`${wk}_${matchNumber}`]: { hg, ag } }));
  }

  // Editor calendario
  function openEditor(){
    const draft= schedule.filter(s=>s.week===week).map(s=>({...s}));
    setScheduleDraft(draft); setModalOpen(true);
  }
  function setDraftField(idx:number, field:'home'|'away', value:string){
    setScheduleDraft(prev=> prev.map((r,i)=> i===idx? {...r, [field]:value}: r));
  }
  function swapSides(idx:number){
    setScheduleDraft(prev=> prev.map((r,i)=> i===idx? {...r, home:r.away, away:r.home}: r));
  }
  function resetWeek(){
    const base= toSchedule(teams, settings.weeks).filter(s=> s.week===week);
    setScheduleDraft(base.map(s=>({...s})));
  }
  function validateDraft(){
    const used=new Set<string>();
    for(const r of scheduleDraft){
      if(!r.home||!r.away) return {ok:false,msg:"Completa tutti gli incontri."};
      if(r.home===r.away) return {ok:false,msg:"Una squadra non può giocare contro se stessa."};
      const h=`H:${r.home}`, a=`A:${r.away}`;
      if(used.has(h)||used.has(a)) return {ok:false,msg:"Ogni squadra può apparire una sola volta."};
      used.add(h); used.add(a);
    }
    return {ok:true};
  }
  function applyDraftLocal(){
    const check=validateDraft();
    if(!check.ok){ alert(check.msg); return; }
    setSchedule(prev=> prev.map(item=>{
      if(item.week!==week) return item;
      const f= scheduleDraft.find(r=> r.matchNumber===item.matchNumber);
      return f? {...item, home:f.home, away:f.away}: item;
    }));
    setModalOpen(false);
    alert("Calendario aggiornato (non ancora salvato sul cloud)");
  }

  // Salvataggio cloud (Admin)
  async function saveCloud(){
    try{
      const payload={ password: adminPw, data:{ teams, settings, schedule, results, picks } };
      const r= await fetch('/api/state',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
      if(!r.ok){
        const e= await r.json().catch(()=>({error:'Errore'}));
        throw new Error(e.error||'Errore salvataggio');
      }
      alert('Salvato su cloud');
      setLastSync(new Date().toISOString());
    }catch(e:any){
      alert(e.message||'Errore salvataggio cloud');
    }
  }

  // punteggi
  const weeklyScores = useMemo(()=>{
    const out: Record<number, Record<string, {correct:number; perfect:boolean; points:number; name:string}>> = {};
    const {pointsCorrect, bonusPerfectWeek, matchesPerWeek}=settings;
    Object.entries(picks).forEach(([email,u])=>{
      Object.entries(u.weeks||{}).forEach(([wkStr, mmap])=>{
        const wk=Number(wkStr); let correct=0;
        for(let m=1;m<=5;m++){
          const pick=(mmap as any)[m];
          const res=results[`${wk}_${m}`];
          if(!res) continue;
          const sign=resultToSign(res.hg,res.ag);
          if(pick&&sign&&pick===sign) correct++;
        }
        const perfect= correct===matchesPerWeek;
        const points= correct*pointsCorrect + (perfect? bonusPerfectWeek: 0);
        if(!out[wk]) out[wk]={};
        out[wk][email]={correct, perfect, points, name:u.name||email};
      });
    });
    return out;
  }, [picks, results, settings]);
  const leaderboard = useMemo(()=>{
    const acc: Record<string, {name:string; correct:number; perfects:number; points:number}> = {};
    Object.values(weeklyScores).forEach((obj)=>{
      Object.entries(obj).forEach(([email,s])=>{
        if(!acc[email]) acc[email]={name:s.name, correct:0, perfects:0, points:0};
        acc[email].correct+=s.correct; acc[email].points+=s.points; if(s.perfect) acc[email].perfects+=1;
      });
    });
    return Object.entries(acc).map(([email,v])=>({email,...v}))
      .sort((a,b)=> b.points-a.points || b.correct-a.correct || b.perfects-a.perfects);
  }, [weeklyScores]);
  const myWeeklyData = useMemo(()=>{
    if(!user.email) return [];
    const rows: {week:string; points:number}[]=[];
    for(let w=1; w<=settings.weeks; w++){
      const s=weeklyScores[w]?.[user.email as string];
      rows.push({ week:`W${w}`, points: s? s.points: 0 });
    }
    return rows;
  }, [weeklyScores, user, settings.weeks]);

  /* ------------------ UI Sections ------------------ */
  function Header(){ return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <motion.div initial={{ rotate:-8, scale:0.9 }} animate={{ rotate:0, scale:1 }} className="rounded-2xl p-2 shadow"><Star className="w-6 h-6"/></motion.div>
        <div>
          <div className="text-2xl font-bold">Fantatipster — Prediction League</div>
          <div className="text-sm text-zinc-500">{settings.weeks} settimane · 10 squadre · 5 partite/sett.</div>
          {lastSync && <div className="text-xs text-zinc-400">Cloud sync: {new Date(lastSync).toLocaleString()}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {adminLogged ? (
          <>
            <Badge variant="secondary" className="text-sm"><Unlock className="w-4 h-4 mr-1"/> Admin</Badge>
            <Btn variant="outline" size="sm" onClick={()=>{ setAdminLogged(false); setAdminPw(""); alert("Admin disattivato"); }}>Logout Admin</Btn>
          </>
        ) : (
          <Btn variant="outline" size="sm" onClick={()=> setAdminModalOpen(true)}><Lock className="w-4 h-4"/> Login Admin</Btn>
        )}
        {user?.email && (
          <>
            <Badge variant="secondary" className="text-sm"><User className="w-4 h-4 mr-1"/>{user.name||user.email}</Badge>
            <Btn variant="ghost" size="sm" onClick={()=> setUser({name:"", email:""})}><LogOut className="w-4 h-4"/></Btn>
          </>
        )}
      </div>
    </div>
  ); }

  function AdminModal(){
    return (
      <Modal
        open={adminModalOpen}
        onClose={()=> setAdminModalOpen(false)}
        title="Login Admin"
        description="Inserisci la password admin (configurata su Vercel come ADMIN_PASSWORD)"
      >
        <div className="grid gap-3">
          <Input
            type="password"
            value={adminInput}
            onChange={(e)=> setAdminInput((e.target as HTMLInputElement).value)}
            placeholder="Password admin"
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="ghost" onClick={()=> setAdminModalOpen(false)}>Annulla</Btn>
          <Btn
            onClick={async ()=>{
              try{
                const r = await fetch("/api/auth", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ password: adminInput })
                });
                if (!r.ok) {
                  const e = await r.json().catch(()=>({error:"Errore login"}));
                  throw new Error(e.error || "Password errata");
                }
                setAdminPw(adminInput);
                setAdminLogged(true);
                setAdminModalOpen(false);
                alert("Admin attivo");
              }catch(e:any){
                alert(e.message || "Password errata");
              }
            }}
          >
            Entra
          </Btn>
        </div>
      </Modal>
    );
  }

  function LoginCard(){
    const [name,setName]=useState(user.name);
    const [email,setEmail]=useState(user.email);
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Accedi per compilare la schedina</CardTitle>
          <CardDescription>Usiamo l'email per associare le tue giocate e la classifica personale.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Nome</Label><Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Es. Ruben"/></div>
            <div className="md:col-span-2"><Label>Email</Label><Input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="nome@email.com"/></div>
          </div>
          <div className="flex justify-end">
            <Btn onClick={()=>{
              if(!email){ alert("Inserisci un'email valida"); return;}
              setUser({name:name.trim(), email:email.trim().toLowerCase()});
              ensureUserNode(email.trim().toLowerCase(), name.trim());
              alert("Benvenuto!");
            }}>Entra</Btn>
          </div>
        </CardContent>
      </Card>
    );
  }

  function WeekSelector(){
    return (
      <div className="flex items-center gap-3">
        <CalendarDays className="w-4 h-4"/><Label>Settimana</Label>
        <SelectBox value={String(week)} onValueChange={(v)=> setWeek(Number(v))} className="w-24">
          {Array.from({length:settings.weeks},(_,i)=> i+1).map(w=> <option key={w} value={w}>{w}</option>)}
        </SelectBox>
        <Separator className="h-6 w-px"/>
        <div className="text-sm text-zinc-500">{matchesThisWeek.length} partite</div>
      </div>
    );
  }

  function PredictionsTab(){
    if(!user?.email) return <LoginCard/>;
    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <WeekSelector/>
          <div className="text-sm text-zinc-500">Compila la tua schedina (1 / {settings.allowDraw? 'X / ': ''}2)</div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {matchesThisWeek.map(m=>{
            const key=`${m.week}_${m.matchNumber}`;
            const myPick=picks[user.email]?.weeks?.[week]?.[m.matchNumber]||"";
            const res=results[key]||{hg:"", ag:""};
            const sign=resultToSign(res.hg,res.ag);
            const done=!!sign;
            const correct= done && myPick && myPick===sign;
            return (
              <Card key={key} className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span>{m.home} <span className="text-zinc-500">vs</span> {m.away}</span>
                    {done? (
                      <Badge variant={correct? 'default':'secondary'} className="gap-1"><CheckCircle2 className="w-4 h-4"/> {sign}</Badge>
                    ) : (
                      <Badge variant="outline">in attesa</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Match {m.matchNumber} · Week {m.week}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Btn variant={myPick==='1'? 'primary':'secondary'} onClick={()=> setPick(user.email, user.name, week, m.matchNumber, '1')}>1</Btn>
                    {settings.allowDraw && <Btn variant={myPick==='X'? 'primary':'secondary'} onClick={()=> setPick(user.email, user.name, week, m.matchNumber, 'X')}>X</Btn>}
                    <Btn variant={myPick==='2'? 'primary':'secondary'} onClick={()=> setPick(user.email, user.name, week, m.matchNumber, '2')}>2</Btn>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  function ResultsTab(){
    if(!adminLogged) return (
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle>Riservato all'Admin</CardTitle><CardDescription>Esegui il login admin per inserire i risultati finali.</CardDescription></CardHeader>
        <CardContent><Btn onClick={()=> setAdminModalOpen(true)}><Lock className="w-4 h-4"/> Login Admin</Btn></CardContent>
      </Card>
    );
    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <WeekSelector/>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary" className="gap-1"><Unlock className="w-4 h-4"/> Admin</Badge>
            <Btn size="sm" variant="secondary" className="ml-2" onClick={openEditor}><Edit3 className="w-4 h-4"/> Modifica calendario settimana</Btn>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {matchesThisWeek.map(m=>{
            const key=`${m.week}_${m.matchNumber}`;
            const res=results[key]||{hg:"", ag:""};
            const sign=resultToSign(res.hg,res.ag)||"-";
            return (
              <Card key={key} className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span>{m.home} <span className="text-zinc-500">vs</span> {m.away}</span>
                    <Badge variant="secondary">Segno: {sign}</Badge>
                  </CardTitle>
                  <CardDescription>Inserisci i risultati per sbloccare i punteggi</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="w-16">Casa</Label>
                    <Input type="number" inputMode="numeric" className="w-20"
                      value={res.hg} disabled={!adminLogged}
                      onChange={(e)=> setResultLocal(m.week, m.matchNumber, (e.target as HTMLInputElement).value, res.ag)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-16">Trasf.</Label>
                    <Input type="number" inputMode="numeric" className="w-20"
                      value={res.ag} disabled={!adminLogged}
                      onChange={(e)=> setResultLocal(m.week, m.matchNumber, res.hg, (e.target as HTMLInputElement).value)} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="flex justify-end">
          <Btn onClick={saveCloud} disabled={!adminLogged}><Upload className="w-4 h-4"/> Salva su cloud</Btn>
        </div>
      </div>
    );
  }

  function LeaderboardTab(){
    return (
      <div className="grid gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5"/> Classifica generale</CardTitle>
            <CardDescription>Ordinata per punti totali, poi corretti, poi settimane perfette.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-12 text-sm font-medium mb-2">
              <div className="col-span-5">Partecipante</div>
              <div className="col-span-2 text-right">Corretti</div>
              <div className="col-span-2 text-right">Perfette</div>
              <div className="col-span-3 text-right">Punti</div>
            </div>
            <Separator className="mb-2"/>
            {leaderboard.length===0? (<div className="text-zinc-500">Ancora nessun dato. Inserisci risultati e schedine.</div>): null}
            {leaderboard.map((r,idx)=> (
              <div key={r.email} className="grid grid-cols-12 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2">
                <div className="col-span-5 flex items-center gap-2"><Badge variant={idx===0? 'default':'secondary'} className="w-6 justify-center">{idx+1}</Badge><span>{r.name}</span></div>
                <div className="col-span-2 text-right">{r.correct}</div>
                <div className="col-span-2 text-right">{r.perfects}</div>
                <div className="col-span-3 text-right font-semibold">{r.points}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {user?.email && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5"/> Andamento settimanale — {user.name||user.email}</CardTitle>
              <CardDescription>Punti per settimana</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{width:'100%', height:260}}>
                <ResponsiveContainer>
                  <BarChart data={myWeeklyData}>
                    <XAxis dataKey="week" hide={false} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="points" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function SettingsTab(){
    const [teamInputs, setTeamInputs]=useState(teams.join("\n"));
    function regen(){
      const list=teamInputs.split("\n").map(s=>s.trim()).filter(Boolean);
      if(list.length!==settings.numTeams){ alert(`Inserisci esattamente ${settings.numTeams} squadre`); return;}
      const newSched= toSchedule(list, settings.weeks);
      setTeams(list); setSchedule(newSched);
      alert("Calendario rigenerato (non ancora salvato su cloud)");
    }
    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><SettingsIcon className="w-5 h-5"/> Parametri</CardTitle>
            <CardDescription>Personalizza punteggi e regole base</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Punti per pronostico corretto</Label>
                <Input type="number" value={settings.pointsCorrect}
                  onChange={(e)=> setSettings({...settings, pointsCorrect: Number((e.target as HTMLInputElement).value||0)})}/>
              </div>
              <div><Label>Bonus settimana perfetta</Label>
                <Input type="number" value={settings.bonusPerfectWeek}
                  onChange={(e)=> setSettings({...settings, bonusPerfectWeek: Number((e.target as HTMLInputElement).value||0)})}/>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SwitchToggle checked={settings.allowDraw} onChange={(v)=> setSettings({...settings, allowDraw:v})}/>
              <span>Permetti segno "X" (pareggio)</span>
            </div>
            <Separator/>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Settimane</Label>
                <Input type="number" value={settings.weeks}
                  onChange={(e)=> setSettings({...settings, weeks: Number((e.target as HTMLInputElement).value||1)})}/>
              </div>
              <div><Label>Squadre</Label>
                <Input type="number" value={settings.numTeams}
                  onChange={(e)=> setSettings({...settings, numTeams: Number((e.target as HTMLInputElement).value||10)})}/>
              </div>
              <div><Label>Match / settimana</Label>
                <Input type="number" value={settings.matchesPerWeek} onChange={()=>{}}/>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex justify-between items-center">
            <div>
              <CardTitle>Squadre & Calendario</CardTitle>
              <CardDescription>Rigenera il calendario o salva su cloud</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Btn variant="outline" size="sm" onClick={()=> setWeek(Math.max(1, week-1))}>◀</Btn>
              <div className="text-sm text-zinc-500">Week {week}</div>
              <Btn variant="outline" size="sm" onClick={()=> setWeek(Math.min(settings.weeks, week+1))}>▶</Btn>
              <Btn variant="secondary" size="sm" onClick={openEditor} className="ml-2"><Edit3 className="w-4 h-4"/> Modifica settimana</Btn>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <textarea className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-700 p-3 min-h-[200px]"
              value={teamInputs} onChange={(e)=> setTeamInputs((e.target as HTMLTextAreaElement).value)}></textarea>
            <div className="flex justify-between items-center gap-2 flex-wrap">
              <div className="text-xs text-zinc-500">{adminLogged? 'Admin attivo: puoi salvare su cloud' : 'Esegui login admin per salvare su cloud'}</div>
              <div className="flex gap-2">
                <Btn variant="secondary" onClick={regen}><RefreshCw className="w-4 h-4"/> Rigenera calendario</Btn>
                <Btn disabled={!adminLogged} onClick={saveCloud}><Upload className="w-4 h-4"/> Salva su cloud</Btn>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function DataTab(){
    function handleExport(){
      const blob=new Blob([JSON.stringify({user, settings, teams, schedule, results, picks}, null, 2)], {type:'application/json'});
      const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='fantatipster_data.json'; a.click(); URL.revokeObjectURL(url);
    }
    function handleImport(e: React.ChangeEvent<HTMLInputElement>){
      const file=e.target.files?.[0]; if(!file) return;
      const r=new FileReader();
      r.onload=()=>{ try{
        const data=JSON.parse(r.result?.toString()||'{}');
        setUser(data.user||user); setSettings(data.settings||settings);
        setTeams(data.teams||teams); setSchedule(data.schedule||schedule);
        setResults(data.results||results); setPicks(data.picks||picks);
        alert('Dati importati (non ancora su cloud)');
      }catch{ alert('JSON non valido'); } };
      r.readAsText(file);
    }
    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="flex items-center gap-2"><Download className="w-5 h-5"/> Esporta</CardTitle><CardDescription>Scarica un backup/istantanea</CardDescription></CardHeader>
          <CardContent><Btn onClick={handleExport}>Scarica JSON</Btn></CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5"/> Importa</CardTitle><CardDescription>Carica un JSON esportato</CardDescription></CardHeader>
          <CardContent><input type="file" accept="application/json" onChange={handleImport} className="block w-full"/></CardContent>
        </Card>

        {adminLogged && (
          <Card className="border-0 shadow-md md:col-span-2">
            <CardHeader><CardTitle>Schedine ricevute (Admin)</CardTitle><CardDescription>Solo tu puoi vedere l'elenco completo</CardDescription></CardHeader>
            <CardContent>
              {Object.keys(picks).length===0 && <div className="text-sm text-zinc-500">Nessuna schedina ancora.</div>}
              {Object.entries(picks).map(([email, u])=> (
                <div key={email} className="mb-4">
                  <div className="font-medium">{u.name || email} <span className="text-xs text-zinc-500">({email})</span></div>
                  <div className="text-sm">
                    {Object.entries(u.weeks||{}).map(([wk, mm])=> (
                      <div key={wk} className="mt-1">
                        Week {wk}: {Object.entries(mm as any).map(([mn, val])=> (<Badge key={mn} variant="secondary" className="mr-1 mb-1">M{mn}:{val as string}</Badge>))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function Tests(){
    const [res, setRes]=useState<{name:string; pass:boolean}[]>([]);
    function run(){
      const tests: {name:string; pass:boolean}[]=[];
      tests.push({name:"resultToSign 2-1 => 1", pass: resultToSign(2,1)==="1"});
      tests.push({name:"resultToSign 1-1 => X", pass: resultToSign(1,1)==="X"});
      tests.push({name:"resultToSign 0-3 => 2", pass: resultToSign(0,3)==="2"});
      const sched= toSchedule(defaultTeams,38);
      tests.push({name:"toSchedule length 38*5", pass: sched.length===190});
      const w1=sched.filter(s=>s.week===1);
      const seen=new Set<string>(); let dup=false;
      for(const m of w1){ if(seen.has(m.home)||seen.has(m.away)){ dup=true; break;} seen.add(m.home); seen.add(m.away); }
      tests.push({name:"unique teams in week 1", pass: !dup});
      setRes(tests);
    }
    return (
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle>Runtime Tests</CardTitle><CardDescription>Verifiche base su funzioni chiave</CardDescription></CardHeader>
        <CardContent className="grid gap-4">
          <Btn variant="secondary" onClick={run}>Run tests</Btn>
          <div className="grid gap-2">
            {res.map((t,i)=>(
              <div key={i} className="flex items-center justify-between rounded-xl px-3 py-2 bg-zinc-100 dark:bg-zinc-800">
                <span className="text-sm">{t.name}</span>
                <Badge variant={t.pass? 'default':'destructive'}>{t.pass? 'PASS':'FAIL'}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Tabs: NON-ADMIN → solo Schedina + Classifica. ADMIN → + Risultati, Settings, Dati, Tests
  const baseTabs = [
    { value: "pred", label: "Schedina", content: <PredictionsTab/> },
    { value: "lead", label: "Classifica", content: <LeaderboardTab/> },
  ] as const;
  const adminOnly = [
    { value: "res",  label: "Risultati", content: <ResultsTab/> },
    { value: "set",  label: "Settings",  content: <SettingsTab/> },
    { value: "data", label: "Dati",      content: <DataTab/> },
    { value: "tests",label: "Tests",     content: <Tests/> },
  ] as const;
  const tabs = adminLogged ? [...baseTabs, ...adminOnly] : [...baseTabs];

  const [tab, setTab] = useState<string>('pred');

  // Se cambia adminLogged, assicura che la tab corrente sia valida
  useEffect(()=>{
    if(!tabs.find(t=>t.value===tab)) setTab(tabs[0].value);
  }, [adminLogged]); // eslint-disable-line

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <Header/>
      <Separator className="my-4"/>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5"/> Settimana corrente
          </CardTitle>
          <CardDescription>
            Compila la schedina con segni 1 / {settings.allowDraw? 'X / ': ''}2 — 5 partite
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v)} tabs={tabs as any}/>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-xs text-zinc-500">
        Built for friendly battles. Cloud sync via Vercel API + Supabase.
      </div>

      <AdminModal/>

      <Modal
        open={modalOpen}
        onClose={()=> setModalOpen(false)}
        title={`Modifica calendario — Week ${week}`}
        description="Personalizza gli scontri della settimana. Ogni squadra può apparire una sola volta."
      >
        <div className="grid gap-4">
          {scheduleDraft.map((row, idx)=> (
            <div key={idx} className="grid grid-cols-12 items-center gap-2">
              <div className="col-span-1 text-sm text-zinc-500">#{row.matchNumber}</div>
              <div className="col-span-5">
                <Label className="text-xs">Casa</Label>
                <SelectBox value={row.home} onValueChange={(v)=> setDraftField(idx,'home',v)}>
                  <option value="">Seleziona…</option>
                  {teams.map(t=> <option key={t} value={t}>{t}</option>)}
                </SelectBox>
              </div>
              <div className="col-span-1 text-center">vs</div>
              <div className="col-span-5">
                <Label className="text-xs">Trasferta</Label>
                <SelectBox value={row.away} onValueChange={(v)=> setDraftField(idx,'away',v)}>
                  <option value="">Seleziona…</option>
                  {teams.map(t=> <option key={t} value={t}>{t}</option>)}
                </SelectBox>
              </div>
              <div className="col-span-12 flex justify-end gap-2 mt-2">
                <Btn size="sm" variant="outline" onClick={()=> swapSides(idx)}><ArrowLeftRight className="w-4 h-4"/> Inverti</Btn>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="ghost" onClick={()=> setModalOpen(false)}>Annulla</Btn>
          <Btn variant="outline" onClick={resetWeek}><RotateCcw className="w-4 h-4"/> Reset week</Btn>
          <Btn onClick={applyDraftLocal}>Applica</Btn>
          {adminLogged && <Btn onClick={saveCloud}><Upload className="w-4 h-4"/> Salva su cloud</Btn>}
        </div>
      </Modal>
    </div>
  );
}
