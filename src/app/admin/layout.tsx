import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  if (!profile?.is_admin) {
    return (
      <main className="mx-auto w-full max-w-lg px-5 py-16 text-center">
        <h1 className="text-2xl font-black text-white">Panel de admin</h1>
        <p className="mt-3 text-slate-400">
          No tienes permisos de administrador. Para activarte, corre esto en el
          SQL Editor de Supabase:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-navy-900 p-4 text-left text-xs text-pitch-500">
          {`update profiles set is_admin = true\nwhere id = '${user.id}';`}
        </pre>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-navy-950/80 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-1 text-sm">
            <span className="mr-2 font-black text-white">⚙️ Admin</span>
            <NavLink href="/admin">Resultados</NavLink>
            <NavLink href="/admin/participantes">Participantes</NavLink>
          </div>
          <Link
            href="/jugar"
            className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-300 transition hover:bg-white/5"
          >
            ← App
          </Link>
        </nav>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-1.5 font-medium text-slate-200 transition hover:bg-white/5"
    >
      {children}
    </Link>
  );
}
