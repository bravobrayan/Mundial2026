import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompletedGroups } from "@/lib/quiniela/progress";
import { ShareCode } from "./ShareCode";

export default async function LigaDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: league } = await supabase
    .from("leagues")
    .select("id, name, code")
    .eq("id", id)
    .maybeSingle();
  if (!league) redirect("/jugar");

  const { count: members } = await supabase
    .from("league_members")
    .select("user_id", { count: "exact", head: true })
    .eq("league_id", id);

  const completed = await getCompletedGroups(supabase, user.id, id);
  const pct = Math.round((completed.size / 12) * 100);

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-black text-white">{league.name}</h1>
      <p className="mt-1 text-sm text-slate-400">
        {members ?? 1} {members === 1 ? "miembro" : "miembros"} · tu quiniela en
        esta liga
      </p>

      {/* Invitar */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-navy-900/50 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Invita a tus amigos
        </h2>
        <p className="mb-3 mt-1 text-sm text-slate-400">
          Comparte este código para que se unan a <strong>{league.name}</strong>:
        </p>
        <ShareCode code={league.code} />
      </div>

      {/* Progreso de grupos */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-navy-900/50 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Fase de grupos</h2>
          <span className="text-sm text-slate-400">
            {completed.size}/12 grupos
          </span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-navy-950">
          <div
            className="h-full rounded-full bg-pitch-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <Link
          href={`/liga/${id}/grupos`}
          className="mt-5 inline-block rounded-xl bg-pitch-500 px-5 py-2.5 font-semibold text-navy-950 transition hover:bg-pitch-600"
        >
          {completed.size === 0
            ? "Empezar mis pronósticos →"
            : completed.size === 12
              ? "Revisar mis grupos →"
              : "Continuar →"}
        </Link>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card
          title="Eliminatorias"
          desc="Predice los cruces reales, de Dieciseisavos a la final."
          href={`/liga/${id}/cuadro`}
        />
        <Card
          title="Ranking"
          desc="La tabla de esta liga, en vivo."
          href={`/liga/${id}/ranking`}
        />
      </div>
    </main>
  );
}

function Card({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="h-full rounded-2xl border border-white/10 bg-navy-900/50 p-5 transition hover:border-white/20">
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{desc}</p>
      </div>
    </Link>
  );
}
