import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompletedGroups } from "@/lib/quiniela/progress";

export default async function JugarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const nombre = profile?.display_name ?? user.email?.split("@")[0] ?? "jugador";
  const completed = await getCompletedGroups(supabase, user.id);
  const pct = Math.round((completed.size / 12) * 100);

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12">
      <p className="text-sm text-slate-400">Hola,</p>
      <h1 className="text-3xl font-black text-white">{nombre} 👋</h1>

      <div className="mt-8 rounded-2xl border border-white/10 bg-navy-900/50 p-6">
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
          href="/jugar/grupos"
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
          desc="Predice los marcadores de los cruces reales, de Dieciseisavos a la final. Se habilitan cuando se definen los equipos."
          href="/jugar/cuadro"
        />
        <Card
          title="Ranking"
          desc="Mira la tabla general en vivo conforme entran resultados."
          href="/jugar/ranking"
        />
      </div>
    </main>
  );
}

function Card({
  title,
  desc,
  href,
  disabled,
  hint,
}: {
  title: string;
  desc: string;
  href: string;
  disabled?: boolean;
  hint?: string;
}) {
  const inner = (
    <div
      className={`h-full rounded-2xl border border-white/10 bg-navy-900/50 p-5 transition ${
        disabled ? "opacity-50" : "hover:border-white/20"
      }`}
    >
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">{desc}</p>
      {hint && <p className="mt-2 text-xs text-gold-400">🔒 {hint}</p>}
    </div>
  );
  return disabled ? inner : <Link href={href}>{inner}</Link>;
}
