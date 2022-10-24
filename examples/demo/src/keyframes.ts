import { clips, InheritSymbol, orchestrate } from "jongleur";
import { Vector3 } from "three";

export const sceneAnimation = orchestrate(
  {
    bed: { scale: new Vector3(0, 0, 0) },
    lamp: { visible: true as boolean, position: new Vector3(0, 800, 0) },
    lampLights: { intensity: 0 }
  },
  {
    bed: {
      2: { scale: InheritSymbol },
      2.5: { scale: [new Vector3(1, 1, 1), "ease-out"] }
    },
    lamp: {
      2: { visible: InheritSymbol, position: InheritSymbol },
      2.8: { visible: [true, "start"], position: [new Vector3(0, 0, 0), "ease-out"] }
    },
    lampLights: {
      2.5: { intensity: InheritSymbol },
      3: { intensity: [1.5, "linear"] }
    }
  }
);
