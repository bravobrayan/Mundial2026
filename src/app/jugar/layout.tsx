import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { UserMenu, type NavLink as NavLinkT } from "@/components/UserMenu";

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
    .select("is_admin, display_name")
    .eq("id", user.id)
    .maybeSingle();

  const nombre = profile?.display_name ?? user.email?.split("@")[0] ?? "Jugador";

  const navLinks: NavLinkT[] = [
    { href: "/jugar", label: "Inicio" },
    { href: "/jugar/ligas", label: "Ligas" },
    { href: "/jugar/reglas", label: "Reglas" },
  ];
  if (profile?.is_admin) navLinks.push({ href: "/admin", label: "Admin" });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-navy-950/80 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/jugar" className="flex items-center gap-2">
            <Logo size={30} />
            <span className="font-black text-white">Quiniela 2026</span>
          </Link>
          <div className="flex items-center gap-1">
            <div className="mr-1 hidden items-center gap-1 sm:flex">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-white/5"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <UserMenu
              name={nombre}
              email={user.email ?? ""}
              navLinks={navLinks}
            />
          </div>
        </nav>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
