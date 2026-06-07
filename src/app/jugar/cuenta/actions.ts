"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CuentaState = { ok?: true; error?: string } | null;

export async function updateName(
  _prev: CuentaState,
  formData: FormData,
): Promise<CuentaState> {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Escribe un nombre válido (mín. 2 letras)." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Vuelve a entrar." };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: name })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/jugar");
  revalidatePath("/jugar/cuenta");
  return { ok: true };
}
