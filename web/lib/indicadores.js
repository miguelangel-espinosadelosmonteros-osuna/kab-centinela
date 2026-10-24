// Convierte los números del sensor en palabras sencillas + un estado (sana/atencion/alerta/critica).

const mediana = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : null;
};

function valorHaceHoras(lecturas, campo, horas) {
  const fin = new Date(lecturas.at(-1).ts).getTime();
  let elegido = null;
  for (const l of lecturas) {
    if (fin - new Date(l.ts).getTime() >= horas * 3600e3) elegido = l[campo];
  }
  return elegido;
}

export function indicadores(lecturas) {
  if (!lecturas?.length) return [];
  const u = lecturas.at(-1);
  const serie = (campo) => lecturas.map((l) => ({ ts: l.ts, v: l[campo] }));
  const lista = [];

  // Peso
  const p6 = valorHaceHoras(lecturas, "peso_kg", 6) ?? lecturas[0].peso_kg;
  const p24 = valorHaceHoras(lecturas, "peso_kg", 24) ?? lecturas[0].peso_kg;
  const c6 = u.peso_kg - p6, c24 = u.peso_kg - p24;
  let peso = ["sana", "Estable"];
  if (c6 <= -1.5) peso = ["alerta", `Perdió ${Math.abs(c6).toFixed(1)} kg de golpe`];
  else if (c6 <= -0.5) peso = ["critica", `Bajó ${Math.abs(c6).toFixed(1)} kg en pocas horas`];
  else if (c24 <= -0.3) peso = ["atencion", "Va bajando poco a poco"];
  else if (c24 >= 0.2) peso = ["sana", "Va subiendo: está entrando miel"];
  lista.push({ clave: "peso", icono: "peso", etiqueta: "Peso de la colmena", valor: u.peso_kg, unidad: "kg", dec: 1,
    estado: peso[0], palabra: peso[1], serie: serie("peso_kg") });

  // Zumbido (comparado con lo normal de ESTA colmena)
  const anteriores = lecturas.slice(0, -3).map((l) => l.sonido_db).filter((v) => v != null);
  const base = mediana(anteriores.length ? anteriores : [u.sonido_db]);
  const dif = u.sonido_db - base;
  let zumbido = ["sana", "Normal: están activas"];
  if (dif <= -8) zumbido = ["critica", "Muy bajo: casi no zumban"];
  else if (dif <= -3) zumbido = ["atencion", "Más bajo que de costumbre"];
  lista.push({ clave: "zumbido", icono: "onda", etiqueta: "Zumbido (actividad)", valor: u.sonido_db, unidad: "dB", dec: 0,
    estado: zumbido[0], palabra: zumbido[1], serie: serie("sonido_db"), banda: [base - 3, base + 3] });

  // Calor de la cría
  const t = u.temp_int_c;
  let cria = ["sana", "Bien para la cría"];
  if (t >= 40) cria = ["critica", "Demasiado calor"];
  else if (t >= 38) cria = ["alerta", "Demasiado calor"];
  else if (t < 30) cria = ["alerta", "Frío para la cría"];
  else if (t < 32 || t > 36) cria = ["atencion", t < 32 ? "Algo fría" : "Algo caliente"];
  lista.push({ clave: "cria", icono: "termometro", etiqueta: "Calor de la cría", valor: t, unidad: "°C", dec: 1,
    estado: cria[0], palabra: cria[1], serie: serie("temp_int_c"), banda: [32, 36] });

  // Humedad de afuera
  if (u.humedad_pct != null) {
    const h = u.humedad_pct;
    let hum = ["sana", "Normal"];
    if (h < 30) hum = ["alerta", "Muy seco"];
    else if (h < 40) hum = ["atencion", "Seco"];
    else if (h > 85) hum = ["atencion", "Muy húmedo"];
    lista.push({ clave: "humedad", icono: "humedad", etiqueta: "Humedad del aire", valor: h, unidad: "%", dec: 0,
      estado: hum[0], palabra: hum[1], serie: serie("humedad_pct"), banda: [40, 85] });
  }
  return lista;
}

export function tono(hz) {
  if (hz == null) return "—";
  if (hz >= 350) return "Agudo (puede faltar la reina)";
  if (hz < 180) return "Grave";
  return "Normal";
}
