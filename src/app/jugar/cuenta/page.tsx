import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CuentaForm } from "./CuentaForm";

export default async function CuentaPage() {
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

  const nombre = profile?.display_name ?? user.email?.split("@")[0] ?? "";

  return (
    <main className="mx-auto w-full max-w-md px-5 py-10">
      <h1 className="text-2xl font-black text-white">Mi cuenta</h1>
      <p className="mb-6 text-sm text-slate-400">
        Gestiona tu perfil de la quiniela.
      </p>

      <div className="mb-5 rounded-xl border border-white/10 bg-navy-900/50 p-4">
        <div className="text-xs uppercase tracking-wider text-slate-500">
          Correo
        </div>
        <div className="text-sm text-white">{user.email}</div>
      </div>

      <div className="rounded-xl border border-white/10 bg-navy-900/50 p-4">
        <CuentaForm initialName={nombre} />
      </div>
    </main>
  );
}
