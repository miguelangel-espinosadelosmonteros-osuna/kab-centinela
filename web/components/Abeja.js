import Icono from "@/components/Icono";

/** Una sola abeja que cruza en su propio carril, para estados vacíos. Nunca pasa sobre texto. */
export default function Abeja() {
  return (
    <div className="vuelo" aria-hidden="true">
      <span className="abeja-vuela"><Icono nombre="abeja" tam={28} grosor={1.6} /></span>
    </div>
  );
}
