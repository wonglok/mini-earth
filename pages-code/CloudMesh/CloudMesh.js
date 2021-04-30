import { useMemo, useRef } from "react";
import { CloudBufferGeo } from "./CloudBufferGeo";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils";
import { Geometry } from "three/examples/jsm/deprecated/Geometry";
import { useFrame } from "@react-three/fiber";

export let getBuff = ({ cloudResolution = 10, roughness = 0.5 }) => {
  const tuft1 = new CloudBufferGeo(
    1.5,
    cloudResolution,
    cloudResolution,
    roughness
  );
  tuft1.rotateZ(0.23 + Math.PI * 0.35);
  tuft1.rotateX(0.23 + Math.PI * -0.35);
  tuft1.translate(-2, 0, 0);
  const tuft2 = new CloudBufferGeo(
    1.5,
    cloudResolution,
    cloudResolution,
    roughness
  );
  tuft2.rotateZ(0.23 + Math.PI * 0.25);
  tuft2.rotateX(0.23 + Math.PI * -0.35);
  tuft2.translate(2, 0, 0);
  const tuft3 = new CloudBufferGeo(
    2.0,
    cloudResolution,
    cloudResolution,
    roughness
  );
  tuft3.rotateZ(0.23 + Math.PI * 0.35);
  tuft2.rotateX(0.23 + Math.PI * -0.35);
  tuft3.translate(0, 0, 0);
  let output = BufferGeometryUtils.mergeBufferGeometries([tuft1, tuft2, tuft3]);
  output.scale(1, 0.75, 1);
  let intermediate = new Geometry().fromBufferGeometry(output);

  // const map = (val, smin, smax, emin, emax) =>
  //   ((emax - emin) * (val - smin)) / (smax - smin) + emin;
  // const jitter = (geo, per) =>
  //   geo.vertices.forEach((v) => {
  //     let normal = v
  //       .clone()
  //       .normalize()
  //       .multiplyScalar(map(Math.random(), 0, 1, -per, per));
  //     v.add(normal);
  //     // v.x += map(Math.random(), 0, 1, -per, per);
  //     // v.y += map(Math.random(), 0, 1, -per, per);
  //     // v.z += map(Math.random(), 0, 1, -per, per);
  //   });
  // jitter(intermediate, 2 / cloudResolution);
  // const chopBottom = (geo, bottom) =>
  //   geo.vertices.forEach((v) => (v.y = Math.max(v.y, bottom)));
  // chopBottom(intermediate, -0.5);
  return intermediate.toBufferGeometry();
};

export const GeoCache = new Map();

export function OneCloudMesh({
  roughness = 0.5,
  cloudResolution = 10,
  floatSpeed = 1.0,
  floatOffset = 0.0,
  orbitOffset = 0.0,
  floatSize = 5,
}) {
  //

  const geo = useMemo(() => {
    if (GeoCache.has(`cloud-${cloudResolution}${roughness}`)) {
      return GeoCache.get(`cloud-${cloudResolution}${roughness}`);
    } else {
      let cloud = getBuff({ cloudResolution, roughness });
      GeoCache.set(`cloud-${cloudResolution}${roughness}`, cloud);
      return cloud;
    }
  });

  const ref = useRef();

  const time = useRef(0);

  useFrame((st, dt) => {
    if (ref.current) {
      time.current += dt;
      ref.current.position.y =
        Math.sin(time.current * floatSpeed + floatOffset) * floatSize;
    }
  });

  return (
    <group ref={ref}>
      <group rotation-y={orbitOffset}>
        <group scale={1} position-z={9}>
          <mesh geometry={geo}>
            <meshStandardMaterial
              metalness={0.9}
              roughness={0.5}
              flatShading={true}
            ></meshStandardMaterial>
          </mesh>
        </group>
      </group>
    </group>
  );
}

export function CloudMesh() {
  let ref = useRef();

  //
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += -0.002;
    }
  });

  //
  return (
    <group>
      <directionalLight position-z={10} position-y={10}></directionalLight>

      <group ref={ref}>
        <OneCloudMesh
          roughness={0.1}
          floatSpeed={-1.3}
          floatSize={1.4}
          floatOffset={0.1}
          orbitOffset={2.0 * Math.PI * 2.5 * 0.1}
          cloudResolution={5}
        ></OneCloudMesh>
        <OneCloudMesh
          roughness={0.2}
          floatSpeed={1.3}
          floatSize={2.4}
          floatOffset={0.2}
          orbitOffset={2.0 * Math.PI * 2.5 * 0.2}
          cloudResolution={6}
        ></OneCloudMesh>
        <OneCloudMesh
          roughness={0.3}
          floatSpeed={-1.3}
          floatSize={1.0}
          floatOffset={0.3}
          orbitOffset={2.0 * Math.PI * 2.5 * 0.3}
          cloudResolution={7}
        ></OneCloudMesh>
        <OneCloudMesh
          roughness={0.4}
          floatSpeed={1.3}
          floatSize={0.5}
          floatOffset={0.4}
          orbitOffset={2.0 * Math.PI * 2.5 * 0.4}
          cloudResolution={8}
        ></OneCloudMesh>

        {/*  */}
      </group>
    </group>
  );
}
