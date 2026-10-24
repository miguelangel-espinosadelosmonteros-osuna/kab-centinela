"use client";

// Lee un texto en voz alta con la voz del teléfono (sin internet ni costo).

export function puedeHablar() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function hablar(texto, alTerminar) {
  if (!puedeHablar()) return false;
  const voz = window.speechSynthesis;
  voz.cancel();
  const frase = new SpeechSynthesisUtterance(texto);
  frase.lang = "es-MX";
  frase.rate = 0.92;
  const voces = voz.getVoices();
  const mexicana = voces.find((v) => v.lang === "es-MX") || voces.find((v) => v.lang?.startsWith("es"));
  if (mexicana) frase.voice = mexicana;
  if (alTerminar) {
    frase.onend = alTerminar;
    frase.onerror = alTerminar;
  }
  voz.speak(frase);
  return true;
}

export function callar() {
  if (puedeHablar()) window.speechSynthesis.cancel();
}
