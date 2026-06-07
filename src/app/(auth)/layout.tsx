import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex flex-col items-center text-center">
        <Logo size={56} className="mb-3" />
        <span className="block text-xs font-semibold uppercase tracking-[0.3em] text-gold-400">
          Copa Mundial 2026
        </span>
        <span className="block text-2xl font-black text-white">
          Quiniela 2026
        </span>
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-navy-900/70 p-7 shadow-2xl backdrop-blur">
        {children}
      </div>
    </main>
  );
}
