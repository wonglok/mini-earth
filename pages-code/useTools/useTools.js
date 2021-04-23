import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

/*
let {
    gl,
    camera,
    scene,
    waitFor,
    onClean,
    onLoop,
  } = useTools()
*/
export function useTools() {
  let { scene, gl, camera } = useThree();
  let waitFor = (name, node = scene) => {
    return new Promise((resolve) => {
      let tt = setInterval(() => {
        let ans = node.getObjectByName(name);
        if (ans) {
          clearInterval(tt);
          resolve(ans);
        }
      }, 0);
    });
  };

  let loopers = useRef([]);
  let cleans = useRef([]);
  let onLoop = (v) => {
    loopers.current.push(v);
  };
  let onClean = (v) => {
    cleans.current.push(v);
  };
  useFrame(() => {
    loopers.current.forEach((l) => l());
  });
  useEffect(() => {
    loopers.current = [];
  });
  useEffect(() => {
    return () => {
      cleans.current.forEach((c) => c());
    };
  });

  return {
    gl,
    camera,
    scene,
    waitFor,
    onClean,
    onLoop,
  };
}
