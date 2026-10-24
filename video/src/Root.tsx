import { Composition, Folder, Still } from "remotion";
import { KabCentinela } from "./KabCentinela";
import { FondoPanal } from "./FondoPanal";
import { Intro } from "./escenas/Intro";
import { Fumigacion } from "./escenas/Fumigacion";
import { Alerta } from "./escenas/Alerta";
import { Expediente } from "./escenas/Expediente";
import { Pasaporte } from "./escenas/Pasaporte";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="KabCentinela" component={KabCentinela} durationInFrames={450} fps={30} width={1920} height={1080} />
      <Composition id="FondoPanal" component={FondoPanal} durationInFrames={240} fps={30} width={1280} height={720} />
      <Still id="FondoPanalPoster" component={FondoPanal} width={1280} height={720} />
      <Folder name="Escenas">
        <Composition id="Marca" component={Intro} durationInFrames={98} fps={30} width={1920} height={1080} defaultProps={{ conTexto: true }} />
        <Composition id="Fumigacion" component={Fumigacion} durationInFrames={96} fps={30} width={1920} height={1080} />
        <Composition id="Alerta" component={Alerta} durationInFrames={96} fps={30} width={1920} height={1080} />
        <Composition id="Expediente" component={Expediente} durationInFrames={96} fps={30} width={1920} height={1080} />
        <Composition id="Pasaporte" component={Pasaporte} durationInFrames={96} fps={30} width={1920} height={1080} />
      </Folder>
    </>
  );
};
