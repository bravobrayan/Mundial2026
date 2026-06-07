import { AuthForm } from "../AuthForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <>
      <h1 className="mb-1 text-xl font-bold text-white">Iniciar sesión</h1>
      <p className="mb-6 text-sm text-slate-400">
        Bienvenido de vuelta. Entra para ver y editar tus pronósticos.
      </p>
      <AuthForm mode="login" next={next} />
    </>
  );
}
