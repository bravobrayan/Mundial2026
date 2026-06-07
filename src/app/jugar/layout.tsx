import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { Logo } from "@/components/Logo";

export default async function JugarLayout({
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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-navy-950/80 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/jugar" className="flex items-center gap-2">
            <Logo size={30} />
            <span className="font-black text-white">Quiniela 2026</span>
          </Link>
          <div className="flex items-center gap-1 text-sm">
            <NavLink href="/jugar/grupos">Grupos</NavLink>
            <NavLink href="/jugar/cuadro">Cuadro</NavLink>
            <NavLink href="/jugar/ranking">Ranking</NavLink>
            {profile?.is_admin && <NavLink href="/admin">Admin</NavLink>}
            <form action={logout} className="ml-2">
              <button className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-300 transition hover:bg-white/5">
                Salir
              </button>
            </form>
          </div>
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
