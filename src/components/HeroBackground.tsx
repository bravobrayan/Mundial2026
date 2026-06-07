"use client";

import { useState } from "react";

/**
 * Fondo de la portada a pantalla completa.
 * Prioridad: video (/brand/hero.mp4) → imagen (/brand/hero.jpg) → degradado.
 * Si un recurso no existe, cae al siguiente automáticamente.
 */
export function HeroBackground() {
  const [videoFailed, setVideoFailed] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {!videoFailed ? (
        <video
          className="h-full w-full scale-110 object-cover blur-[5px]"
          autoPlay
          muted
          loop
          playsInline
          poster="/brand/hero.jpg"
          onError={() => setVideoFailed(true)}
        >
          <source src="/brand/hero.mp4" type="video/mp4" />
        </video>
      ) : !imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/brand/hero.jpg"
          alt=""
          className="h-full w-full scale-110 object-cover blur-[5px]"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-b from-navy-700 via-navy-900 to-navy-950" />
      )}

      {/* Capa oscura para legibilidad del texto */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950/80 via-navy-950/55 to-navy-950" />
    </div>
  );
}
