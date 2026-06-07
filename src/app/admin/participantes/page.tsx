import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Participant = {
  user_id: string;
  display_name: string;
  group_preds: number;
  groups_done: number;
  ko_preds: number;
  total_preds: number;
  last_pred: string | null;
  joined_at: string;
};

const fmt = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Caracas",
});

export default async function ParticipantesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.rpc("participants");
  const rows = (data ?? []) as Participant[];

  const totalGruposListos = rows.filter((r) => r.groups_done === 12).length;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8">
      <h1 className="text-2xl font-black text-white">Participantes</h1>
      <p className="mb-6 text-sm text-slate-400">
        Quién se registró y cuánto lleva de su quiniela. No se muestran sus
        marcadores.
      </p>

      {error && (
        <div className="rounded-xl border border-gold-400/30 bg-gold-400/10 px-4 py-3 text-sm text-gold-400">
          Función no disponible (¿corriste la migración 0003?).
        </div>
      )}

      {!error && (
        <>
          <div className="mb-5 flex flex-wrap gap-3">
            <Stat label="Registrados" value={rows.length} />
            <Stat label="Grupos completos (12/12)" value={totalGruposListos} />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-navy-900/70 text-[11px] uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Jugador</th>
                  <th className="px-2 py-3 text-center font-medium">Grupos</th>
                  <th className="px-2 py-3 text-center font-medium">Elim.</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Último envío
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.user_id} className="border-t border-white/5">
                    <td className="px-4 py-3 font-medium text-white">
                      {r.display_name}
                    </td>
                    <td className="px-2 py-3">
                      <GroupProgress done={r.groups_done} preds={r.group_preds} />
                    </td>
                    <td className="px-2 py-3 text-center tabular-nums text-slate-300">
                      {r.ko_preds > 0 ? r.ko_preds : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400">
                      {r.last_pred ? fmt.format(new Date(r.last_pred)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length === 0 && (
            <p className="mt-4 text-center text-slate-400">
              Aún no hay jugadores registrados.
            </p>
          )}
        </>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-navy-900/50 px-4 py-3">
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}

function GroupProgress({ done, preds }: { done: number; preds: number }) {
  const complete = done === 12;
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-navy-950">
        <div
          className={`h-full rounded-full ${
            complete ? "bg-pitch-500" : "bg-gold-400"
          }`}
          style={{ width: `${(done / 12) * 100}%` }}
        />
      </div>
      <span
        className={`text-xs tabular-nums ${
          complete ? "text-pitch-500" : "text-slate-400"
        }`}
      >
        {done}/12{complete ? " ✓" : ""}
      </span>
    </div>
  );
}
