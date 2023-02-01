import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { Interpolation } from "../src";
import { Clip, createField, FieldStores, helpers, InheritSymbol, ObjectConfig } from "../src/orchestrate";
import { parseKeyframes } from "../src/orchestrate/parse";

const fields = {
  position: createField(FieldStores.Vector3, () => {}, {}),
  rotation: createField(FieldStores.Number, () => {}, {})
};

const defaultConfig: Required<ObjectConfig> = { interpolation: "ease-in-out", damping: true, checkEq: true };

describe("parsing", () => {
  const checkClip = (
    a: Clip,
    start: Clip["start"],
    end: Clip["end"],
    interpolation: Interpolation = defaultConfig.interpolation
  ) => {
    expect(a).to.eql({ start, end, config: { interpolation, checkEq: defaultConfig.checkEq } }, "Unexpected clip");
  };

  it("clips & configs", () => {
    const [objects, keyframes, length] = parseKeyframes(
      fields,
      { test: { position: new Vector3(0, 0, 0) } },
      {
        test: {
          1: { position: helpers.state(new Vector3(0, 1, 0), "linear") },
          2: { position: helpers.state(new Vector3(0, 2, 0), undefined) }
        }
      },
      defaultConfig
    );

    expect(length).to.eql(2);
    expect(objects).to.eql(["test"]);
    expect(keyframes.test.fields).to.eql(["position"]);

    checkClip(keyframes.test.clips.position[0], [0, new Vector3(0, 0, 0)], [1, new Vector3(0, 1, 0)], "linear");
    checkClip(keyframes.test.clips.position[1], [1, new Vector3(0, 1, 0)], [2, new Vector3(0, 2, 0)]);
  });
  it("clips & inherit symbol", () => {
    const [, keyframes] = parseKeyframes(
      fields,
      { test: { position: new Vector3(0, 0, 0) } },
      {
        test: {
          0.5: { position: InheritSymbol },
          1: { position: helpers.state(new Vector3(0, 1, 0)) }
        }
      },
      defaultConfig
    );

    expect(keyframes.test.fields).to.eql(["position"]);
    checkClip(keyframes.test.clips.position[0], [0.5, new Vector3(0, 0, 0)], [1, new Vector3(0, 1, 0)]);
  });
  it("multiple clips with inherit", () => {
    const [, keyframes] = parseKeyframes(
      fields,
      { test: { position: new Vector3(0, 0, 0) } },
      {
        test: {
          0.5: { position: InheritSymbol },
          1: { position: helpers.state(new Vector3(0, 1, 0), "linear") },
          1.5: { position: InheritSymbol },
          2: { position: helpers.state(new Vector3(0, 2, 0), "ease-in") }
        }
      },
      defaultConfig
    );

    expect(keyframes.test.fields).to.eql(["position"]);
    checkClip(keyframes.test.clips.position[0], [0.5, new Vector3(0, 0, 0)], [1, new Vector3(0, 1, 0)], "linear");
    checkClip(keyframes.test.clips.position[1], [1.5, new Vector3(0, 1, 0)], [2, new Vector3(0, 2, 0)], "ease-in");
  });

  it("interleaved & unsorted clips", () => {
    const [, keyframes] = parseKeyframes(
      fields,
      { test: { position: new Vector3(0, 0, 0), rotation: 0 } },
      {
        test: {
          0.5: { position: InheritSymbol },
          0.7: { rotation: InheritSymbol },
          1: { position: helpers.state(new Vector3(0, 1, 0), "linear") },
          1.5: { position: InheritSymbol },
          2: { position: helpers.state(new Vector3(0, 2, 0), "ease-in") },
          2.3: { rotation: helpers.state(1, "start") }
        }
      },
      defaultConfig
    );

    expect(keyframes.test.fields).to.eql(["position", "rotation"]);
    checkClip(keyframes.test.clips.position[0], [0.5, new Vector3(0, 0, 0)], [1, new Vector3(0, 1, 0)], "linear");
    checkClip(keyframes.test.clips.position[1], [1.5, new Vector3(0, 1, 0)], [2, new Vector3(0, 2, 0)], "ease-in");
    checkClip(keyframes.test.clips.rotation[0], [0.7, 0], [2.3, 1], "start");
  });
});
