import Link from "next/link";
import Icono from "@/components/Icono";
import Abeja from "@/components/Abeja";
import { Logo } from "@/components/Encabezado";

// Datos del problema con su fuente. Revisados el 24 oct 2026; cada cifra se atribuye a quien la publicó.
const DATOS = [
  {
    titulo: "Fumigación en Nohalal, Tekax (2025)",
    texto: "ECOSUR confirmó fipronil 39% arriba de la dosis letal media: 99 colmenas envenenadas en 5 apiarios, "
      + "349 ha contaminadas y 465 mil pesos de pérdidas. La prensa reportó más de 3 millones de abejas muertas. "
      + "Un año después nadie ha sido sancionado.",
    fuente: "Por Esto!, jul 2026",
    url: "https://www.poresto.com/yucatan/2026/7/19/apicultura-maya-lucha-por-sobrevivir-en-yucatan-ocho-millones-de-abejas-muertas-en-3-anos-2.html",
  },
  {
    titulo: "8 millones de abejas en 3 años",
    texto: "Hopelchén (2023), Tizimín (2024) y Nohalal (2025): más de 8 millones de abejas muertas por plaguicidas "
      + "en Campeche y Yucatán, sin responsables. El fipronil sigue autorizado en México y está prohibido en la UE.",
    fuente: "Por Esto!, jul 2025",
    url: "https://www.poresto.com/yucatan/2025/7/6/plaguicidas-matan-mas-de-8-millones-de-abejas-en-la-peninsula-de-yucatan-dos-ecocidios-masivos-siguen-impunes-y-sin-responsable.html",
  },
  {
    titulo: "Yucatán, primer productor de miel del país",
    texto: "9,893 toneladas en 2025, el 16.4% de la miel de México. México es el 9.º exportador mundial; "
      + "Alemania y EE. UU. compran más del 63% del valor.",
    fuente: "Por Esto! con datos de SADER, ago 2026",
    url: "https://www.poresto.com/yucatan/2026/8/31/yucatan-lidera-produccion-de-miel-en-mexico-con-casi-10-mil-toneladas.html",
  },
  {
    titulo: "El apicultor cobra poco",
    texto: "Los intermediarios pagan entre 35 y 50 pesos por kilo; el consumidor paga 150 o más. "
      + "En 2026 la miel convencional se pagó a 30–31 pesos, por debajo del punto de equilibrio (40–45).",
    fuente: "Por Esto! jul 2026; Diario de Yucatán, may 2026",
    url: "https://www.yucatan.com.mx/merida/2026/05/06/crisis-apicola-en-yucatan-frio-deforestacion-y-bajos-precios-golpea-la-produccion-de-miel.html",
  },
  {
    titulo: "Calor, sequía y frentes fríos",
    texto: "En 2023, con hasta 44 °C a la sombra, la producción cayó entre 20 y 30%. En febrero de 2026 los frentes "
      + "fríos secos marchitaron la floración y colapsaron colonias en Tizimín, Tahdziú y Tzucacab.",
    fuente: "N+, jun 2023; Diario de Yucatán, may 2026",
    url: "https://www.nmas.com.mx/estados/yucatan-calor-provoca-muerte-de-abejas-produccion-de-miel-en-riesgo/",
  },
  {
    titulo: "Deforestación: menos flores, menos miel",
    texto: "285,580 ha perdidas entre 2019 y 2023 en la Península por agroindustria, ganadería, megagranjas "
      + "porcinas, turismo y obras como el Tren Maya. Hay 17 mil apicultores y unos 48 mil empleos en juego.",
    fuente: "Por Esto!, abr 2026",
    url: "https://www.poresto.com/yucatan/2026/4/20/la-miel-que-se-acaba-deforestacion-y-pesticidas-amenazan-la-apicultura-maya-en-yucatan.html",
  },
  {
    titulo: "Sin abejas no hay cosechas",
    texto: "Cerca del 85% de los cultivos comestibles de México dependen de polinizadores; el servicio vale "
      + "unos 80 mil millones de pesos al año.",
    fuente: "Vandame et al., 2019 (ECOSUR)",
    url: "https://repositorio-socioecologia.conahcyt.mx/jspui/bitstream/1000/252/1/2.%20Abejas%20apicultores%20y%20acade%cc%81micos%20en%20alianza%20por%20la%20sostenibilidad%20de%20territorios%20con%20diversidad%20biocultural%20en%20Me%cc%81xico.pdf",
  },
  {
    titulo: "Varroa y abejas nativas",
    texto: "La varroa y el escarabajo de la colmena presionan a los apiarios de Peto. La abeja nativa "
      + "xunáan kab (Melipona beecheii) perdió 93% de sus colmenas en Quintana Roo en unos 25 años.",
    fuente: "Por Esto!, feb 2026; EcoAméricas, 2024",
    url: "https://www.ecoamericas.com/issues/article/2024/6/AA0DE55A-EDE8-4D9F-AC08-E41755653106",
  },
];

const DETECTA = [
  ["INTOXICACION", "Intoxicación por plaguicida", "el zumbido y el peso caen a la vez"],
  ["BROTE_REGIONAL", "Brote regional (fumigación)", "intoxicación en 2 apiarios a menos de 3 km en menos de 6 h"],
  ["GOLPE_CALOR", "Golpe de calor", "la cámara de cría pasa de 38 °C"],
  ["SEQUIA", "Sequía", "humedad menor a 30% con más de 35 °C por horas"],
  ["FRIO_EXTREMO", "Frío extremo", "la cría baja de 30 °C"],
  ["HAMBRUNA", "Hambruna (deforestación)", "la colmena pierde peso durante días"],
  ["AUSENCIA_REINA", "Ausencia de reina", "zumbido agudo sostenido"],
  ["ENJAMBRAZON", "Enjambrazón", "cae 1.5 a 5 kg de golpe"],
  ["VARROA_ENFERMEDAD", "Varroa o enfermedad", "no regula su temperatura y el zumbido baja poco a poco"],
  ["DESCONEXION", "Sensor caído o robo", "Last Will de IoT Core"],
];

// Las tres cifras de la portada, con su fuente
const CIFRAS = [
  ["8 millones", "de abejas muertas por plaguicidas entre 2023 y 2025 en Campeche y Yucatán, sin responsables.", DATOS[1]],
  ["9,893 t", "de miel en 2025: Yucatán es el primer productor del país.", DATOS[2]],
  ["99 colmenas", "envenenadas con fipronil en Nohalal, Tekax (2025). Cuando llegó el apicultor, ya no había pruebas.", DATOS[0]],
];

export default function Problema() {
  return (
    <>
      <header className="portada">
        <Abeja />
        <div className="marca-portada"><Logo tam={56} /><span className="ceja">Tekax · Peto · Yucatán</span></div>
        <h1>KAB <em>Centinela</em></h1>
        <p className="lema">La colmena que escucha.</p>
        <p className="entrada">
          Cuando el apicultor llega al apiario ya no hay pruebas. KAB Centinela escucha cada colmena, avisa en
          minutos y convierte los datos en evidencia firmada que nadie puede borrar.
        </p>
        <div className="cifras">
          {CIFRAS.map(([cifra, texto, d]) => (
            <div className="cifra-grande" key={cifra}>
              <b>{cifra}</b>
              <span>{texto}</span>
              <a href={d.url} target="_blank" rel="noreferrer">Fuente: {d.fuente}</a>
            </div>
          ))}
        </div>
        <Link href="/" className="boton primario"><Icono nombre="colmena" />Ver el tablero</Link>
      </header>

      <h2>Por qué importa</h2>
      <div className="reportaje">
        {DATOS.map((d) => (
          <article key={d.titulo}>
            <h3>{d.titulo}</h3>
            <p>{d.texto}</p>
            <a className="chico" href={d.url} target="_blank" rel="noreferrer">Fuente: {d.fuente}</a>
          </article>
        ))}
      </div>

      <h2>Qué detecta cada colmena</h2>
      <ul className="detecta">
        {DETECTA.map(([tipo, a, b]) => (
          <li key={tipo}><Icono nombre={tipo} tam={28} /><span><b>{a}</b><span className="chico">{b}</span></span></li>
        ))}
      </ul>
    </>
  );
}
