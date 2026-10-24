import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { useVideoConfig } from "remotion";
import { Intro } from "./escenas/Intro";
import { Fumigacion } from "./escenas/Fumigacion";
import { Alerta } from "./escenas/Alerta";
import { Expediente } from "./escenas/Expediente";
import { Pasaporte } from "./escenas/Pasaporte";

// 15 s: marca, fumigación, alerta y SMS, expediente sellado, pasaporte con QR verificado.
// Cinco escenas de ~3 s; cada fundido de 8 cuadros se encima, por eso suman 482 y el video dura 450.
export const KabCentinela: React.FC = () => {
  const { fps } = useVideoConfig();
  const fundido = <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 8 })} />;
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence name="Marca" durationInFrames={98} premountFor={fps}><Intro /></TransitionSeries.Sequence>
      {fundido}
      <TransitionSeries.Sequence name="Fumigación" durationInFrames={96} premountFor={fps}><Fumigacion /></TransitionSeries.Sequence>
      {fundido}
      <TransitionSeries.Sequence name="Alerta y SMS" durationInFrames={96} premountFor={fps}><Alerta /></TransitionSeries.Sequence>
      {fundido}
      <TransitionSeries.Sequence name="Expediente" durationInFrames={96} premountFor={fps}><Expediente /></TransitionSeries.Sequence>
      {fundido}
      <TransitionSeries.Sequence name="Pasaporte" durationInFrames={96} premountFor={fps}><Pasaporte /></TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
