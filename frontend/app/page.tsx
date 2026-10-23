"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

type Jogador = {
  id: number;
  name: string;
  position: string;
  age: number;
  condition: string;
  market_value: number;
  overall: number;
  club_id: number | null;
};

type PaginaJogadores = {
  data: Jogador[];
  meta: { page: number; limit: number; total_items: number; total_pages: number };
};

type Clube = {
  id: number;
  name: string;
  acronym: string;
  cash: number;
  squad_value: number;
  net_worth: number;
};

const API = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1").replace(/\/$/, "");
const moeda = (valor: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(valor);

async function requisicao<T>(caminho: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(`${API}${caminho}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null);
    const mensagem = Array.isArray(corpo?.message) ? corpo.message.join("; ") : corpo?.message;
    throw new Error(mensagem || `Falha na API (${resposta.status}).`);
  }
  if (resposta.status === 204) return undefined as T;
  return resposta.json() as Promise<T>;
}

const camposAtributos = [
  ["pace", "Velocidade"], ["shooting", "Finalização"], ["passing", "Passe"],
  ["dribbling", "Drible"], ["defending", "Defesa"], ["physical", "Físico"],
] as const;

export default function Home() {
  const [aba, setAba] = useState<"players" | "clubs">("players");
  const [jogadores, setJogadores] = useState<PaginaJogadores | null>(null);
  const [clubes, setClubes] = useState<Clube[]>([]);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [mostrarCadastro, setMostrarCadastro] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setErro("");
    try {
      const query = new URLSearchParams({ page: String(pagina), limit: "10", sort: "name" });
      if (busca.trim().length >= 2) query.set("search", busca.trim());
      const [listaJogadores, listaClubes] = await Promise.all([
        requisicao<PaginaJogadores>(`/players?${query.toString()}`),
        requisicao<Clube[]>("/clubs?sort=name"),
      ]);
      setJogadores(listaJogadores);
      setClubes(listaClubes);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar os dados.");
    } finally {
      setCarregando(false);
    }
  }, [busca, pagina]);

  useEffect(() => {
  let cancelado = false;

  async function carregarDados() {
    setErro("");

    try {
      const query = new URLSearchParams({
        page: String(pagina),
        limit: "10",
        sort: "name",
      });

      if (busca.trim().length >= 2) {
        query.set("search", busca.trim());
      }

      const [listaJogadores, listaClubes] = await Promise.all([
        requisicao<PaginaJogadores>(`/players?${query.toString()}`),
        requisicao<Clube[]>("/clubs?sort=name"),
      ]);

      if (!cancelado) {
        setJogadores(listaJogadores);
        setClubes(listaClubes);
      }
    } catch (e) {
      if (!cancelado) {
        setErro(
          e instanceof Error
            ? e.message
            : "Não foi possível carregar os dados.",
        );
      }
    } finally {
      if (!cancelado) {
        setCarregando(false);
      }
    }
  }

  void carregarDados();

  return () => {
    cancelado = true;
  };
}, [busca, pagina]);

  const totalJogadores = jogadores?.meta.total_items ?? 0;
  const valorElencos = useMemo(() => clubes.reduce((soma, clube) => soma + clube.squad_value, 0), [clubes]);

  async function cadastrarJogador(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget);
    const dados: Record<string, string | number> = {};
    for (const campo of ["name", "position"] as const) dados[campo] = String(formulario.get(campo) || "").trim();
    for (const campo of ["agility", "age", "potential", ...camposAtributos.map(([chave]) => chave)]) {
      dados[campo] = Number(formulario.get(campo));
    }
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await requisicao<Jogador>("/players", { method: "POST", body: JSON.stringify(dados) });
      setMensagem("Jogador cadastrado.");
      setMostrarCadastro(false);
      setPagina(1);
      if (pagina === 1) await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível cadastrar o jogador.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">Football Market</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Central da liga</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-400">Gerencie atletas, acompanhe clubes e consulte os valores do mercado.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setAba("players"); setPagina(1); }} className={`rounded-xl px-4 py-2 text-sm font-semibold ${aba === "players" ? "bg-emerald-400 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>Jogadores</button>
            <button onClick={() => setAba("clubs")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${aba === "clubs" ? "bg-emerald-400 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>Clubes</button>
            <button onClick={() => void carregar()} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800">Atualizar</button>
          </div>
        </header>

        <section className="grid gap-3 py-6 sm:grid-cols-2 lg:grid-cols-4">
          <Resumo titulo="Jogadores cadastrados" valor={String(totalJogadores)} detalhe="Atletas ativos no catálogo" />
          <Resumo titulo="Clubes na liga" valor={String(clubes.length)} detalhe="Clubes registrados" />
          <Resumo titulo="Valor dos elencos" valor={moeda(valorElencos)} detalhe="Soma dos valores de elenco" />
          <Resumo titulo="API" valor={erro ? "Atenção" : carregando ? "Conectando…" : "Conectada"} detalhe={erro ? "Verifique o backend" : `Base: ${API}`} />
        </section>

        {erro && <div role="alert" className="mb-5 rounded-xl border border-rose-900 bg-rose-950/60 px-4 py-3 text-sm text-rose-200">{erro}</div>}
        {mensagem && <div role="status" className="mb-5 rounded-xl border border-emerald-800 bg-emerald-950/60 px-4 py-3 text-sm text-emerald-200">{mensagem}</div>}

        {aba === "players" ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70">
            <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div><h2 className="text-lg font-bold">Mercado de jogadores</h2><p className="mt-1 text-sm text-slate-400">Consulte posição, condição, overall e valor de mercado.</p></div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input aria-label="Buscar jogador" value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} placeholder="Buscar por nome…" className="min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-400 sm:w-56" />
                <button onClick={() => { setMostrarCadastro(!mostrarCadastro); setErro(""); }} className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-300">{mostrarCadastro ? "Fechar formulário" : "+ Novo jogador"}</button>
              </div>
            </div>
            {mostrarCadastro && <form onSubmit={cadastrarJogador} className="grid gap-3 border-b border-slate-800 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
              <Campo nome="name" rotulo="Nome completo" texto obrigatorio />
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-400">Posição<select name="position" required className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"><option value="ATA">Atacante (ATA)</option><option value="MEI">Meio-campo (MEI)</option><option value="ZAG">Zagueiro (ZAG)</option><option value="LAT">Lateral (LAT)</option><option value="GOL">Goleiro (GOL)</option></select></label>
              <Campo nome="age" rotulo="Idade" numero minimo={16} maximo={45} inicial="24" />
              <Campo nome="agility" rotulo="Agilidade" numero minimo={1} maximo={100} inicial="80" />
              {camposAtributos.map(([nome, rotulo]) => <Campo key={nome} nome={nome} rotulo={rotulo} numero minimo={1} maximo={99} inicial={nome === "pace" ? "85" : nome === "shooting" ? "88" : nome === "passing" ? "72" : nome === "dribbling" ? "81" : nome === "defending" ? "40" : "77"} />)}
              <Campo nome="potential" rotulo="Potencial" numero minimo={1} maximo={99} inicial="90" />
              <div className="flex items-end"><button disabled={salvando} className="w-full rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">{salvando ? "Salvando…" : "Cadastrar jogador"}</button></div>
              <p className="text-xs text-slate-500 sm:col-span-2 lg:col-span-4">O backend calcula valor base e overall. As regras de domínio da API continuam sendo aplicadas.</p>
            </form>}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Jogador</th><th className="px-4 py-3">Posição</th><th className="px-4 py-3">Idade</th><th className="px-4 py-3">Condição</th><th className="px-4 py-3">Overall</th><th className="px-5 py-3 text-right">Valor de mercado</th></tr></thead>
                <tbody className="divide-y divide-slate-800">
                  {carregando && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">Carregando dados…</td></tr>}
                  {!carregando && jogadores?.data.map((jogador) => <tr key={jogador.id} className="hover:bg-slate-800/40"><td className="px-5 py-4"><div className="font-semibold text-white">{jogador.name}</div><div className="mt-1 text-xs text-slate-500">ID #{jogador.id}{jogador.club_id ? ` · Clube ${jogador.club_id}` : " · Livre no mercado"}</div></td><td className="px-4 py-4"><span className="rounded-md bg-slate-800 px-2 py-1 text-xs font-bold">{jogador.position}</span></td><td className="px-4 py-4 text-slate-300">{jogador.age}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${jogador.condition === "APTO" ? "bg-emerald-950 text-emerald-300" : jogador.condition === "DOENTE" ? "bg-rose-950 text-rose-300" : "bg-amber-950 text-amber-300"}`}>{jogador.condition.replaceAll("_", " ")}</span></td><td className="px-4 py-4 font-bold text-emerald-300">{jogador.overall}</td><td className="px-5 py-4 text-right font-semibold tabular-nums">{moeda(jogador.market_value)}</td></tr>)}
                  {!carregando && jogadores?.data.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">Nenhum jogador encontrado para essa busca.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 px-4 py-4 text-sm text-slate-400 sm:px-5"><span>{jogadores?.meta.total_items ?? 0} resultado(s) · página {jogadores?.meta.page ?? pagina} de {Math.max(1, jogadores?.meta.total_pages ?? 1)}</span><div className="flex gap-2"><button disabled={pagina <= 1 || carregando} onClick={() => setPagina((p) => Math.max(1, p - 1))} className="rounded-lg border border-slate-700 px-3 py-1.5 disabled:opacity-40">Anterior</button><button disabled={pagina >= (jogadores?.meta.total_pages ?? 1) || carregando} onClick={() => setPagina((p) => p + 1)} className="rounded-lg border border-slate-700 px-3 py-1.5 disabled:opacity-40">Próxima</button></div></div>
          </section>
        ) : (
          <section><div className="mb-4"><h2 className="text-xl font-bold">Clubes da liga</h2><p className="mt-1 text-sm text-slate-400">Caixa, valor de elenco e patrimônio calculados pelo backend.</p></div>
            {carregando ? <p className="py-10 text-center text-slate-400">Carregando clubes…</p> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{clubes.map((clube) => <article key={clube.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-400">{clube.acronym}</p><h3 className="mt-2 text-lg font-bold">{clube.name}</h3></div><span className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-bold">#{clube.id}</span></div><div className="mt-5 grid grid-cols-2 gap-3"><MiniMetrica titulo="Caixa" valor={moeda(clube.cash)} /><MiniMetrica titulo="Valor do elenco" valor={moeda(clube.squad_value)} /><div className="col-span-2 rounded-xl bg-emerald-950/50 p-3"><p className="text-xs text-emerald-300">Patrimônio</p><p className="mt-1 text-xl font-black text-emerald-200">{moeda(clube.net_worth)}</p></div></div></article>)}</div>}
            {!carregando && clubes.length === 0 && <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-400">Nenhum clube cadastrado.</div>}
          </section>
        )}
        <footer className="mt-8 flex flex-col gap-1 border-t border-slate-800 pt-5 text-xs text-slate-500 sm:flex-row sm:justify-between"><span>Football Market · Estudo de caso Full Stack</span><span>Frontend Next.js · API NestJS · PostgreSQL</span></footer>
      </div>
    </main>
  );
}

function Resumo({ titulo, valor, detalhe }: { titulo: string; valor: string; detalhe: string }) {
  return <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{titulo}</p><p className="mt-2 break-words text-2xl font-black tracking-tight">{valor}</p><p className="mt-1 break-words text-xs text-slate-500">{detalhe}</p></article>;
}

function MiniMetrica({ titulo, valor }: { titulo: string; valor: string }) {
  return <div className="rounded-xl bg-slate-950 p-3"><p className="text-xs text-slate-500">{titulo}</p><p className="mt-1 break-words font-bold">{valor}</p></div>;
}

function Campo({ nome, rotulo, numero = false, texto = false, obrigatorio = false, minimo, maximo, inicial }: { nome: string; rotulo: string; numero?: boolean; texto?: boolean; obrigatorio?: boolean; minimo?: number; maximo?: number; inicial?: string }) {
  return <label className="flex flex-col gap-1 text-xs font-medium text-slate-400">{rotulo}<input name={nome} type={numero ? "number" : texto ? "text" : "number"} required={obrigatorio || numero} min={minimo} max={maximo} defaultValue={inicial} step="1" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400" /></label>;
}
