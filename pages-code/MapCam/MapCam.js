import { useEffect } from "react";
import { MapControls } from "three/examples/jsm/controls/OrbitControls";
import { useTools } from "../useTools/useTools";

export function MapCam() {
  let { camera, gl, scene, waitFor, onClean, onLoop } = useTools();
  useEffect(() => {
    //
    // camera.position.copy({
    //   x: 0,
    //   y: 100,
    //   z: -10,
    // });

    camera.far = 100000;
    camera.near = 0.001;
    camera.updateProjectionMatrix();

    let ctrls = new MapControls(camera, gl.domElement);
    ctrls.object.position.y = 100;
    ctrls.object.position.z = 150;
    ctrls.enableDamping = true;
    onLoop(() => {
      ctrls.update();
    });

    return () => {
      ctrls.dispose();
    };
  }, []);

  return null;
}
