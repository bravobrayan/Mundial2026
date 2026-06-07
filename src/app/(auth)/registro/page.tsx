import { AuthForm } from "../AuthForm";

export default function RegistroPage() {
  return (
    <>
      <h1 className="mb-1 text-xl font-bold text-white">Crear cuenta</h1>
      <p className="mb-6 text-sm text-slate-400">
        Regístrate para llenar tu quiniela antes del primer partido.
      </p>
      <AuthForm mode="signup" />
    </>
  );
}
