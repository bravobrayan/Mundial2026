/**
 * Convierte un emoji de bandera al código de país (ISO 3166-1 alpha-2,
 * o subdivisión gb-eng / gb-sct / gb-wls) para usar con flagcdn.
 * Los emojis de bandera no se renderizan en Windows, por eso usamos imágenes.
 */
export function flagToCode(flag?: string | null): string | null {
  if (!flag) return null;
  const cps = Array.from(flag).map((c) => c.codePointAt(0) ?? 0);

  // Banderas de subdivisión (bandera negra 0x1F3F4 + etiquetas): Inglaterra, Escocia…
  if (cps.includes(0x1f3f4)) {
    const letters = cps
      .filter((cp) => cp >= 0xe0061 && cp <= 0xe007a)
      .map((cp) => String.fromCharCode(cp - 0xe0061 + 97))
      .join("");
    if (letters.startsWith("gb") && letters.length >= 5) {
      return "gb-" + letters.slice(2); // gbeng -> gb-eng
    }
    return null;
  }

  // Pares de indicadores regionales (0x1F1E6 = 'A' … 0x1F1FF = 'Z')
  const ri = cps.filter((cp) => cp >= 0x1f1e6 && cp <= 0x1f1ff);
  if (ri.length >= 2) {
    return ri
      .slice(0, 2)
      .map((cp) => String.fromCharCode(cp - 0x1f1e6 + 97))
      .join("");
  }
  return null;
}

export function flagUrl(flag?: string | null): string | null {
  const code = flagToCode(flag);
  return code ? `/flags/${code}.svg` : null;
}
