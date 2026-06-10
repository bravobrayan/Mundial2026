import { flagUrl } from "@/lib/quiniela/flag";

/**
 * Bandera de país como imagen local (se ve en todos los dispositivos).
 * Render minimalista: img directa, proporción 3:2 fija, esquinas redondeadas.
 * SIN ring/sombra (un `ring` heredaba el color del texto blanco y dibujaba
 * un borde blanco). Pasa solo el ANCHO en className (ej. "w-7").
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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      loading="lazy"
      style={{ aspectRatio: "3 / 2" }}
      className={`inline-block h-auto shrink-0 rounded-[2px] object-cover align-[-0.15em] ${className}`}
    />
  );
}
