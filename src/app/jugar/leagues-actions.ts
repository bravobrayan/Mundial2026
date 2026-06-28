"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type LeagueActionState = { error: string } | null;

export async function createLeague(
  _prev: LeagueActionState,
  formData: FormData,
): Promise<LeagueActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Escribe un nombre para la liga." };
  const type = String(formData.get("type") ?? "grupos");
  const p_type = type === "eliminatorias" ? "eliminatorias" : "grupos";

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_league", {
    p_name: name,
    p_type,
  });
  if (error) return { error: error.message };

  revalidatePath("/jugar");
  redirect(`/liga/${data.id}`);
}

export async function joinLeague(
  _prev: LeagueActionState,
  formData: FormData,
): Promise<LeagueActionState> {
  const code = String(formData.get("code") ?? "").trim();
  if (code.length < 4) return { error: "Escribe el código de la liga." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_league", {
    p_code: code,
  });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("no existe"))
      return { error: "No existe una liga con ese código." };
    return { error: error.message };
  }

  revalidatePath("/jugar");
  redirect(`/liga/${data.id}`);
}
