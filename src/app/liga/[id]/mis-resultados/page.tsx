import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AutoRefresh } from "@/components/AutoRefresh";
import { MyResults } from "@/components/MyResults";
import { getMyResults } from "@/lib/quiniela/myResults";

export default async function MisResultadosPage({
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

  const rows = await getMyResults(supabase, user.id, id);
  const total = rows.reduce((s, r) => s + r.points, 0);
  const exactos = rows.filter((r) => r.exact).length;

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8">
      <AutoRefresh />
      <h1 className="text-2xl font-black text-white">Mis resultados</h1>
      <p className="mb-5 text-sm text-slate-400">
        Tus pronósticos ya jugados, el marcador real y los puntos que sacaste.
      </p>

      {rows.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          <Stat label="Puntos" value={total} accent="text-white" />
          <Stat label="Jugados" value={rows.length} accent="text-slate-200" />
          <Stat label="Exactos" value={exactos} accent="text-pitch-500" />
        </div>
      )}

      <MyResults rows={rows} />
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-navy-900/50 px-4 py-3 text-center">
      <div className={`text-2xl font-black tabular-nums ${accent}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-slate-500">
        {label}
      </div>
    </div>
  );
}
