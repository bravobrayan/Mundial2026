import { flagUrl } from "@/lib/quiniela/flag";

/**
 * Bandera de país como imagen (se ve en todos los dispositivos, incluido Windows).
 * Recibe el emoji de bandera guardado y lo convierte a imagen.
 */
export function Flag({
  flag,
  className = "h-4 w-6",
}: {
  flag?: string | null;
  className?: string;
}) {
  const url = flagUrl(flag);
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      loading="lazy"
      className={`inline-block shrink-0 rounded-[2px] object-cover shadow-sm ring-1 ring-black/15 ${className}`}
    />
  );
}
