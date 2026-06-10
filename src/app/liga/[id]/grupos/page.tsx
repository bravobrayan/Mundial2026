import { redirect } from "next/navigation";

export default async function GruposIndex({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/liga/${id}/grupos/A`);
}
