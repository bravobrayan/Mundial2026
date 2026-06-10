import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { League } from "@/lib/quiniela/leagues";
import { CreateLeagueForm, JoinLeagueForm } from "../LeagueForms";

export default async function LigasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = Boolean(profile?.is_admin);

  const { data } = await supabase.rpc("my_leagues");
  const leagues = (data ?? []) as League[];

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-black text-white">Ligas</h1>
      <p className="mt-1 text-slate-400">
        Cada liga es una quiniela privada con su propio ranking.
      </p>

      {/* Mis ligas */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">
          Mis ligas
        </h2>
        {leagues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-navy-900/40 p-6 text-center text-sm text-slate-400">
            Aún no estás en ninguna liga. Únete con un código 👇
          </div>
        ) : (
          <div className="grid gap-3">
            {leagues.map((l) => (
              <Link
                key={l.id}
                href={`/liga/${l.id}`}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-navy-900/50 p-4 transition hover:border-white/25"
              >
                <div>
                  <div className="font-semibold text-white">{l.name}</div>
                  <div className="text-xs text-slate-400">
                    {l.members} {l.members === 1 ? "miembro" : "miembros"} ·
                    código{" "}
                    <span className="font-mono tracking-widest text-gold-400">
                      {l.code}
                    </span>
                  </div>
                </div>
                <span className="text-slate-400">→</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Unirse / Crear */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-navy-900/50 p-5">
          <h3 className="font-semibold text-white">Unirme a una liga</h3>
          <p className="mb-4 mt-1 text-sm text-slate-400">
            ¿Te pasaron un código? Pégalo aquí para entrar.
          </p>
          <JoinLeagueForm />
        </div>

        {isAdmin ? (
          <div className="rounded-2xl border border-white/10 bg-navy-900/50 p-5">
            <h3 className="font-semibold text-white">Crear una liga</h3>
            <p className="mb-4 mt-1 text-sm text-slate-400">
              Como admin, creas la liga y compartes el código.
            </p>
            <CreateLeagueForm />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-navy-900/30 p-5">
            <h3 className="font-semibold text-slate-300">Crear una liga</h3>
            <p className="mt-1 text-sm text-slate-500">
              Solo un administrador puede crear ligas. Pídele el código a quien
              creó la tuya. 😉
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
