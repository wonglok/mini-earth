import { Canvas, useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { Suspense, useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
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
import { useTexture } from "@react-three/drei";

export function PlanetWithHouse() {
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
    widthSegments = 100,
    heightSegments = 100,
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
  const altitude = [];
  const normals = [];
  const uvs = [];

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

      vertices.push(vertex.x, vertex.y, vertex.z);

      normal.copy(vertex);
      normal.normalize();
      // normal
      normals.push(normal.x, normal.y, normal.z);

      let addon =
        1.5 + 0.5 * Math.sin(simplex.noise3D(normal.x, normal.y, normal.z));

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
  let buff = new BufferGeometry();
  buff.setIndex(indices);

  buff.setAttribute("altitude", new Float32BufferAttribute(altitude, 1));
  buff.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  buff.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  buff.setAttribute("uv", new Float32BufferAttribute(uvs, 2));

  // build geometry
  let buffSea = new BufferGeometry();
  buffSea.setIndex(indices);

  buffSea.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  buffSea.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  buffSea.setAttribute("uv", new Float32BufferAttribute(uvs, 2));

  return {
    hill: buff,
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

export function FunGeo() {
  let { gl, camera, scene, waitFor, onClean, onLoop } = useTools();

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

  return (
    <group ref={fun}>
      <mesh geometry={hill} material={mat}></mesh>
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
  );
}

//
