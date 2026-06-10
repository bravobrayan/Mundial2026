import Link from "next/link";
import { Logo } from "@/components/Logo";
import { HeroBackground } from "@/components/HeroBackground";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <HeroBackground />

      <Link
        href="/"
        className="relative z-10 mb-8 flex flex-col items-center text-center"
      >
        <Logo size={56} className="mb-3" />
        <span className="block text-xs font-semibold uppercase tracking-[0.3em] text-gold-400">
          Copa Mundial 2026
        </span>
        <span className="block text-2xl font-black text-white">
          Quiniela 2026
        </span>
      </Link>

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-navy-900/80 p-7 shadow-2xl backdrop-blur-md">
        {children}
      </div>
    </main>
  );
}
