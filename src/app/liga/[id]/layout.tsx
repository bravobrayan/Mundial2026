import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMembership } from "@/lib/quiniela/leagues";
import { getCompletedGroups } from "@/lib/quiniela/progress";
import { Logo } from "@/components/Logo";
import { UserMenu, type NavLink as NavLinkT } from "@/components/UserMenu";
import { NotificationsBell, type Notif } from "@/components/NotificationsBell";

export default async function LigaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const league = await getMembership(supabase, user.id, id);
  if (!league) redirect("/jugar"); // no eres miembro de esta liga

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, display_name")
    .eq("id", user.id)
    .maybeSingle();
  const nombre = profile?.display_name ?? user.email?.split("@")[0] ?? "Jugador";

  // Notificaciones (de esta liga)
  const completed = await getCompletedGroups(supabase, user.id, id);
  const { data: koOpen } = await supabase
    .from("matches")
    .select("id")
    .neq("stage", "group")
    .not("home_team_id", "is", null)
    .limit(1);

  const notifs: Notif[] = [];
  if (completed.size < 12)
    notifs.push({
      id: "grupos",
      emoji: "📝",
      title: "Completa tus grupos",
      desc: `Te faltan ${12 - completed.size} de 12 grupos en ${league.name}.`,
      href: `/liga/${id}/grupos`,
    });
  if (koOpen && koOpen.length > 0)
    notifs.push({
      id: "elim",
      emoji: "🏆",
      title: "¡Eliminatorias abiertas!",
      desc: "Ya hay cruces definidos. Predice los marcadores.",
      href: `/liga/${id}/cuadro`,
    });

  const navLinks: NavLinkT[] = [
    { href: `/liga/${id}/grupos`, label: "Grupos" },
    { href: `/liga/${id}/cuadro`, label: "Eliminatorias" },
    { href: `/liga/${id}/partidos`, label: "Partidos" },
    { href: `/liga/${id}/ranking`, label: "Ranking" },
    { href: "/jugar/reglas", label: "Reglas" },
    { href: "/jugar", label: "Mis ligas" },
  ];
  if (profile?.is_admin) navLinks.push({ href: "/admin", label: "Admin" });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-navy-950/80 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <Link href="/jugar" className="shrink-0">
              <Logo size={30} />
            </Link>
            <Link
              href={`/liga/${id}`}
              className="truncate font-black text-white"
            >
              {league.name}
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <div className="mr-1 hidden items-center gap-1 sm:flex">
              {navLinks.slice(0, 5).map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-white/5"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <NotificationsBell items={notifs} />
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
