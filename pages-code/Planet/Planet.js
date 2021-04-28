import { Canvas, useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  AnimationMixer,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  // MultiplyBlending,
  // RepeatWrapping,
  ShaderMaterial,
  TextureLoader,
  Vector3,
} from "three";
// import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise";
import { Floor } from "../Floor/Floor";
import { HDR } from "../HDR/HDR";
import { MapCam } from "../MapCam/MapCam";
// import { Water } from "three/examples/jsm/objects/Water.js";
import { useTools } from "../useTools/useTools";
import { useAnimations, useFBX, useGLTF, useTexture } from "@react-three/drei";
import { SkeletonUtils } from "three/examples/jsm/utils/SkeletonUtils";
export function Planet() {
  return (
    <Canvas>
      <ambientLight></ambientLight>
      <Suspense fallback={null}>
        <HDR></HDR>
        <FunGeo></FunGeo>
      </Suspense>
      <MapCam></MapCam>
      <Floor></Floor>
    </Canvas>
  );
}

function makeGeo({ seed }) {
  let SimplexNoise = require("simplex-noise");
  var simplex = new SimplexNoise(seed);

  let radius = 6.5,
    widthSegments = 75,
    heightSegments = 75,
    phiStart = 0,
    phiLength = Math.PI * 2,
    thetaStart = 0,
    thetaLength = Math.PI;
  widthSegments = Math.max(3, Math.floor(widthSegments));
  heightSegments = Math.max(2, Math.floor(heightSegments));

  const thetaEnd = Math.min(thetaStart + thetaLength, Math.PI);

  let index = 0;
  const grid = [];

  const vertex = new Vector3();
  const normal = new Vector3();

  // buffers

  const indices = [];
  const vertices = [];
  const earthVert = [];
  const altitude = [];
  const normals = [];
  const uvs = [];
  const rayData = [];

  // generate vertices, normals and uvs

  for (let iy = 0; iy <= heightSegments; iy++) {
    const verticesRow = [];

    const v = iy / heightSegments;

    // special case for the poles

    let uOffset = 0;

    if (iy == 0 && thetaStart == 0) {
      uOffset = 0.5 / widthSegments;
    } else if (iy == heightSegments && thetaEnd == Math.PI) {
      uOffset = -0.5 / widthSegments;
    }

    for (let ix = 0; ix <= widthSegments; ix++) {
      const u = ix / widthSegments;

      // vertex

      vertex.x =
        -radius *
        Math.cos(phiStart + u * phiLength) *
        Math.sin(thetaStart + v * thetaLength);

      vertex.y = radius * Math.cos(thetaStart + v * thetaLength);
      vertex.z =
        radius *
        Math.sin(phiStart + u * phiLength) *
        Math.sin(thetaStart + v * thetaLength);

      normal.copy(vertex);
      normal.normalize();
      // normal
      normals.push(normal.x, normal.y, normal.z);

      let addon =
        1.5 +
        ((0.5 *
          simplex.noise3D(
            (1 / radius) * vertex.x,
            (1 / radius) * vertex.y,
            (1 / radius) * vertex.z
          )) %
          1);

      let perlin = simplex.noise3D(
        addon * normal.x,
        addon * normal.y,
        addon * normal.z
      );

      perlin = perlin * 0.16;

      // make land flat
      if (perlin >= 0.045) {
        perlin = 0.045;
      }

      // make sea
      if (perlin <= -0.04) {
        perlin = -0.04;
      }

      perlin = perlin * radius;

      altitude.push(perlin);

      vertices.push(vertex.x, vertex.y, vertex.z);

      let perlinRay = perlin;
      if (perlinRay <= 0) {
        perlinRay = 0;
      }

      let rayPt = vertex.clone().add(normal.clone().multiplyScalar(perlinRay));
      rayData.push(rayPt.x, rayPt.y, rayPt.z);

      let earth = vertex.clone().add(normal.clone().multiplyScalar(perlin));
      earthVert.push(earth.x, earth.y, earth.z);

      // uv
      uvs.push(u + uOffset, 1 - v);

      verticesRow.push(index++);
    }

    grid.push(verticesRow);
  }

  // indices

  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < widthSegments; ix++) {
      const a = grid[iy][ix + 1];
      const b = grid[iy][ix];
      const c = grid[iy + 1][ix];
      const d = grid[iy + 1][ix + 1];

      if (iy !== 0 || thetaStart > 0) indices.push(a, b, d);
      if (iy !== heightSegments - 1 || thetaEnd < Math.PI)
        indices.push(b, c, d);
    }
  }

  // build geometry
  let buffEarth = new BufferGeometry();
  buffEarth.setIndex(indices);

  buffEarth.setAttribute("altitude", new Float32BufferAttribute(altitude, 1));
  buffEarth.setAttribute("position", new Float32BufferAttribute(rayData, 3));
  buffEarth.setAttribute("earth", new Float32BufferAttribute(earthVert, 3));
  buffEarth.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  buffEarth.setAttribute("uv", new Float32BufferAttribute(uvs, 2));

  // build geometry
  let buffSea = new BufferGeometry();
  buffSea.setIndex(indices);

  buffSea.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  buffSea.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  buffSea.setAttribute("uv", new Float32BufferAttribute(uvs, 2));

  return {
    hill: buffEarth,
    sea: buffSea,
  };
}

let cache = new Map();
function makeMat({ params }) {
  let vs = require("!raw-loader!./glsl/planet.vert").default;
  let fs = require("!raw-loader!./glsl/planet.frag").default;

  let mat = new ShaderMaterial({
    transparent: true,
    uniforms: {
      hillColor: { value: new Color(params.hillColor) },
      seaColor: { value: new Color(params.seaColor) },
      rock: { value: null },
    },
    vertexShader: vs,
    fragmentShader: fs,
  });

  if (cache.has("/textures/wall.jpg")) {
    mat.uniforms.rock.value = cache.get("/textures/wall.jpg");
  } else {
    new TextureLoader().load("/textures/wall.jpg", (tex) => {
      mat.uniforms.rock.value = tex;
      cache.set("/textures/wall.jpg", tex);
    });
  }

  return mat;
}

export const getID = function () {
  return (
    "_" +
    Math.random().toString(36).substr(2, 9) +
    Math.random().toString(36).substr(2, 9)
  );
};

export function Metalman({ lookAt }) {
  let ref = useRef();
  let metalman = useGLTF("/avatar/metalman.glb");
  let mixer = useRef(new AnimationMixer());
  let newman = useMemo(() => {
    let man = SkeletonUtils.clone(metalman.scene);
    man.rotation.x = Math.PI * -0.5;
    return man;
  }, []);
  let action = useFBX("/avatar/idle.fbx");
  useEffect(() => {
    let idleAct = mixer.current.clipAction(action.animations[0], newman);
    idleAct.play();

    if (ref.current) {
      ref.current.lookAt(...lookAt);
    }

    return () => {
      mixer.current.uncacheRoot(newman);
    };
  }, []);

  useFrame((state, dt) => {
    if (mixer.current) {
      mixer.current.update(dt);
    }
  });

  return (
    <group ref={ref}>
      <primitive
        scale={0.005}
        // rotation-x={}
        object={newman}
      ></primitive>
    </group>
  );
}

export function FunGeo() {
  const helper = useRef();
  const helper2 = useRef();
  let { gl, camera, scene, waitFor, onClean, onLoop } = useTools();

  const [items, setItems] = useState([]);

  camera.near = 0.1;
  camera.far = 100000;
  camera.updateProjectionMatrix();

  let waternormals = useTexture("/textures/waternormals.jpg");

  let params = useControls({
    hillColor: "#526c1c",
    seaColor: "#194665",
    seed: 1,
  });

  let { hill, sea } = useMemo(() => {
    return makeGeo({ seed: params.seed });
  }, [params.seed]);

  let mat = useMemo(() => {
    return makeMat({ params });
  }, [params]);
  let fun = useRef();

  useFrame(() => {
    if (fun.current) {
      fun.current.rotation.y += 0.003;
    }
  });

  useEffect(() => {
    if (!helper.current.geometry.rotationFix) {
      helper.current.geometry.rotationFix = true;
      helper.current.geometry.translate(0, -0.2 * 3 * 0.5, 0);
      helper.current.geometry.rotateX(0.5 * Math.PI);
    }
  }, []);

  let tempWorldPos = new Vector3();
  return (
    <group>
      <mesh ref={helper}>
        <coneBufferGeometry args={[0.1 * 3, 0.2 * 3, 32]}></coneBufferGeometry>
        <meshNormalMaterial></meshNormalMaterial>
      </mesh>

      <group ref={fun}>
        {items.map((i) => {
          return (
            <group key={i._id} position={i.position}>
              <Metalman lookAt={i.lookAt}></Metalman>
            </group>
          );
        })}
        <mesh
          onPointerMove={(e) => {
            fun.current.getWorldPosition(tempWorldPos);

            helper.current.position.copy(e.point);
            helper.current.lookAt(tempWorldPos);

            // metalman.scene.position.copy(e.point);
            // metalman.scene.lookAt(tempWorldPos);
          }}
          onClick={(e) => {
            setItems((s) => {
              fun.current.getWorldPosition(tempWorldPos);

              helper.current.position.copy(e.point);
              helper.current.lookAt(tempWorldPos);

              s.push({
                _id: getID(),
                position: e.object.worldToLocal(e.point.clone()).toArray(),
                lookAt: tempWorldPos.clone(0).toArray(),
              });
              return [...s];
            });
          }}
          geometry={hill}
          material={mat}
        ></mesh>
        <mesh geometry={sea} rotation-x={0.6 * 0.5 * Math.PI}>
          <meshStandardMaterial
            opacity={0.9}
            normalMap={waternormals}
            metalness={0.7}
            roughness={0.0}
            transparent={true}
            blending={AdditiveBlending}
            color={params.seaColor}
          ></meshStandardMaterial>
        </mesh>
      </group>
    </group>
  );
}

//
