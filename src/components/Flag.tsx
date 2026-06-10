import { flagUrl } from "@/lib/quiniela/flag";

/**
 * Bandera de país como imagen local (se ve en todos los dispositivos).
 * Proporción 3:2 exacta (sin recortes), esquinas redondeadas limpias.
 * Pasa solo el ANCHO en className (ej. "w-7"); el alto se calcula solo.
 */
export function Flag({
  flag,
  className = "w-6",
}: {
  flag?: string | null;
  className?: string;
}) {
  const url = flagUrl(flag);
  if (!url) return null;
  return (
    <span
      className={`inline-block shrink-0 overflow-hidden rounded-[3px] align-middle ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        loading="lazy"
        className="block aspect-[3/2] h-auto w-full object-cover"
      />
    </span>
  );
}
