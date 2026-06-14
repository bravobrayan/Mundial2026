-- ============================================================
--  Quiniela Mundial 2026 — Marcar partido como FINALIZADO
--  Permite al admin indicar explícitamente que un partido terminó,
--  en vez de adivinarlo por el tiempo. Mientras finished=false el
--  marcador se muestra como "En juego" (marcador en vivo).
--  Ejecutar en Supabase → SQL Editor (después de 0008). Es aditiva.
-- ============================================================

alter table public.results
  add column if not exists finished boolean not null default false;
