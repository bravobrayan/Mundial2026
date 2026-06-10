import { AuthForm } from "../AuthForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <>
      <h1 className="mb-1 text-xl font-bold text-white">Iniciar sesión</h1>
      <p className="mb-6 text-sm text-slate-400">
        Bienvenido de vuelta. Entra para ver y editar tus pronósticos.
      </p>
      {error && (
        <p className="mb-4 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/30">
          {error}
        </p>
      )}
      <AuthForm mode="login" next={next} />
    </>
  );
}
