// Textos en lenguaje sencillo para el apicultor. Un lugar para revisarlos y corregirlos.
// El ícono de cada problema es <Icono nombre={tipo} /> (components/Icono.js).

export const ESTADOS = {
  sana: { palabra: "Bien", frase: "Todo normal", icono: "bien" },
  atencion: { palabra: "Revisar pronto", frase: "Algo cambió, revísala en estos días", icono: "aviso" },
  alerta: { palabra: "Revisar hoy", frase: "Necesita que vayas hoy", icono: "aviso" },
  critica: { palabra: "¡Urgente!", frase: "Necesita ayuda ahora", icono: "urgente" },
  apagada: { palabra: "Sin señal", frase: "El sensor no responde", icono: "apagada" },
};

export const SEVERIDAD_A_ESTADO = { baja: "atencion", media: "atencion", alta: "alerta", critica: "critica" };

export const PROBLEMAS = {
  INTOXICACION: {
    titulo: "Posible envenenamiento",
    corto: "Las abejas casi dejaron de zumbar y la colmena perdió peso.",
    explicacion:
      "El zumbido bajó mucho y la colmena perdió peso al mismo tiempo. Eso pasa cuando fumigan cerca con veneno. Una noche fresca no hace las dos cosas.",
    pasos: [
      "Cierra la entrada de la colmena (la piquera).",
      "No muevas ni abras la colmena.",
      "Toma fotos de las abejas muertas y de cultivos, avionetas o drones cerca.",
      "Junta abejas muertas en una bolsa y guárdalas en el congelador.",
      "Ya guardamos una prueba que nadie puede borrar para tu denuncia.",
    ],
    prueba: true,
  },
  BROTE_REGIONAL: {
    titulo: "Fumigación en la zona",
    corto: "Varios apiarios cercanos se envenenaron casi a la misma hora.",
    explicacion:
      "Dos o más apiarios a menos de 3 km se envenenaron casi al mismo tiempo. Es la señal de una fumigación con avioneta o dron.",
    pasos: [
      "Avisa a los apicultores vecinos (a 3 km a la redonda).",
      "Anota la hora y si viste avioneta, dron o tractor fumigando.",
      "Anota qué se siembra cerca (soya, limón, maíz…).",
      "Usa la prueba guardada para denunciar ante PROFEPA o SENASICA.",
    ],
    prueba: true,
  },
  GOLPE_CALOR: {
    titulo: "Mucho calor en la colmena",
    corto: "Dentro de la colmena hace demasiado calor para la cría.",
    explicacion: "La cría (las abejas bebé) necesita entre 32 y 36 grados. Arriba de 38 grados se daña y la cera se ablanda.",
    pasos: [
      "Pon sombra sobre la colmena (ramas, malla o lámina con aire).",
      "Deja agua limpia cerca, con piedritas o palitos para que no se ahoguen.",
      "No abras la colmena al mediodía.",
    ],
  },
  SEQUIA: {
    titulo: "Falta agua",
    corto: "El aire está muy seco y caliente desde hace horas.",
    explicacion: "Con mucho calor y poca humedad las abejas gastan su energía buscando agua para enfriar la colmena.",
    pasos: [
      "Pon bebederos con agua limpia cerca del apiario.",
      "Ponles piedritas o palitos para que las abejas no se ahoguen.",
      "Revisa cuánta miel les queda.",
    ],
  },
  FRIO_EXTREMO: {
    titulo: "Hace mucho frío",
    corto: "La cría se está enfriando.",
    explicacion: "Con el viento del norte la colmena no logra calentar a la cría, que necesita al menos 32 grados.",
    pasos: [
      "Cierra un poco la entrada de la colmena.",
      "Protege la colmena del viento (ponla detrás de una barda o árboles).",
      "No la abras hasta que pase el frío.",
    ],
  },
  HAMBRUNA: {
    titulo: "Faltan flores: tienen hambre",
    corto: "La colmena pierde peso día con día.",
    explicacion:
      "Desde hace días la colmena pesa menos: las abejas se están comiendo su miel guardada porque no encuentran flores. Pasa con la sequía o cuando tumban el monte.",
    pasos: [
      "Dales de comer: agua con azúcar (mitad y mitad).",
      "Revisa cuánta miel les queda.",
      "Si no hay flores cerca, piensa en mover el apiario a donde haya monte.",
    ],
  },
  AUSENCIA_REINA: {
    titulo: "Puede que no tenga reina",
    corto: "El zumbido cambió a un tono agudo, como un lamento.",
    explicacion: "Cuando la colmena pierde a su reina, las abejas zumban más agudo y más fuerte.",
    pasos: [
      "Abre la colmena y busca huevitos o cría nueva.",
      "Si no hay, consigue una reina nueva o una celda real.",
    ],
  },
  ENJAMBRAZON: {
    titulo: "Se fue un enjambre",
    corto: "La colmena perdió más de 1.5 kg de golpe.",
    explicacion: "Media colonia salió con una reina a buscar otra casa. Si lo encuentras pronto, puedes recuperarlo.",
    pasos: [
      "Busca el enjambre colgado en árboles cerca del apiario.",
      "Captúralo en una caja vacía.",
      "Dale más espacio a la colmena (ponle un alza).",
    ],
  },
  VARROA_ENFERMEDAD: {
    titulo: "Puede estar enferma",
    corto: "La colmena no controla bien su calor y zumba cada vez menos.",
    explicacion: "Una colmena con varroa (un ácaro) o enferma se debilita poco a poco: ya no mantiene el calor y cada día suena menos.",
    pasos: [
      "Haz la prueba de varroa (azúcar glass o alcohol).",
      "Si sale más de 3 ácaros por cada 100 abejas, aplica tratamiento.",
      "Pide ayuda al técnico de tu cooperativa.",
    ],
  },
  DESCONEXION: {
    titulo: "El sensor no responde",
    corto: "Dejamos de recibir datos de esta colmena.",
    explicacion: "El sensor se apagó de golpe. Puede ser la batería, la señal, un robo o un incendio.",
    pasos: ["Ve al apiario a revisar que la colmena esté ahí.", "Revisa la batería y que el sensor esté bien puesto."],
  },
  BATERIA_BAJA: {
    titulo: "Batería baja",
    corto: "Al sensor le queda poca batería.",
    explicacion: "Si se acaba, dejaremos de cuidar esta colmena.",
    pasos: ["Cambia o recarga la batería del sensor en tu próxima visita."],
  },
};

export function problema(tipo) {
  return PROBLEMAS[tipo] || { titulo: tipo, corto: "", explicacion: "", pasos: [] };
}

export const FLORES = ["Tajonal", "Ts'íits'ilche'", "Dzidzilché", "Jabín", "Varias flores"];
