import type { Camera } from "@react-three/fiber";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { ClipStore } from "../store";
import type { FieldsBase, HandleProgress, ObjectsForTarget, StateBase, TargetFromBase } from "../orchestrate";
import { useRegister } from "./register";

// Mostly utility hooks, that aim to make some of the library features easier to use
export const useThreeCamera = <
  Fields extends FieldsBase,
  Base extends StateBase<Fields>,
  Obj extends ObjectsForTarget<Camera, Fields, Base>
>(
  store: ClipStore<Fields, Base>,
  obj: Obj,
  id?: string
) => {
  const register = useRegister(store);
  const camera = useThree(s => s.camera);
  useEffect(() => {
    // register the camera as the object
    register(obj, id)(<TargetFromBase<Fields, Base, Obj>>camera);
    // Also unregister on "unmount" to replicate the ref callback behavior of react
    return () => register(obj, id)(null);
  }, [camera, register, obj, id]);
};

export const useTimeProgress = (progress: HandleProgress, loop: number) => {
  useFrame(({ clock: { elapsedTime } }) => {
    const total = (elapsedTime % loop) / loop;
    progress(total);
  });
};
