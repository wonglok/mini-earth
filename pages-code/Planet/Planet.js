import { Canvas, useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { Suspense, useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  MultiplyBlending,
  RepeatWrapping,
  ShaderMaterial,
  TextureLoader,
  Vector3,
} from "three";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise";
import { Floor } from "../Floor/Floor";
import { HDR } from "../HDR/HDR";
import { MapCam } from "../MapCam/MapCam";
import { Water } from "three/examples/jsm/objects/Water.js";
import { useTools } from "../useTools/useTools";
import { useTexture } from "@react-three/drei";

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

  let radius = 4,
    widthSegments = 360,
    heightSegments = 360,
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
  const height = new Vector3();
  const noise = new Vector3();
  const altitudeTemp = new Vector3();

  // buffers

  const indices = [];
  const vertices = [];
  const colorData = [];
  const heightData = [];
  const altitude = [];
  const normals = [];
  const uvs = [];

  let improvedNoise = new ImprovedNoise();

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

      let perlin =
        simplex.noise3D(2.0 * normal.x, 2.0 * normal.y, 2.0 * normal.z) * 1.5;

      noise.multiplyScalar(0);
      height
        // .copy(vertex)
        .copy(normal);

      for (let j = 0; j < 5; j++) {
        noise.x = Math.cos(
          Math.sin(
            improvedNoise.noise(
              normal.x * perlin,
              normal.x * perlin,
              normal.x * perlin
            )
          )
        );
        noise.y = Math.cos(
          Math.sin(
            improvedNoise.noise(
              normal.y * perlin,
              normal.y * perlin,
              normal.y * perlin
            )
          )
        );
        noise.z = Math.cos(
          Math.sin(
            improvedNoise.noise(
              normal.z * perlin,
              normal.z * perlin,
              normal.z * perlin
            )
          )
        );

        height.multiply(noise).multiplyScalar(1.1);
      }

      height.multiplyScalar(2);

      //
      heightData.push(
        //Math.abs
        height.x,
        //Math.abs
        height.y,
        //Math.abs
        height.z
      );

      let altitudeOne = 1;
      for (let j = 0; j < 5; j++) {
        altitudeOne +=
          height.normalize().sub(vertex.normalize()).length() - noise.length();
      }
      altitudeOne *= 0.1;
      if (altitudeOne >= 0.9) {
        altitudeOne = 0.9;
      }

      altitude.push(altitudeOne);

      colorData.push(height.x, height.y, height.z);

      // normal
      normals.push(normal.x, normal.y, normal.z);

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
  buff.setAttribute("height", new Float32BufferAttribute(heightData, 3));
  buff.setAttribute("color", new Float32BufferAttribute(colorData, 3));
  buff.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  buff.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  buff.setAttribute("uv", new Float32BufferAttribute(uvs, 2));

  // build geometry
  let buffSea = new BufferGeometry();
  buffSea.setIndex(indices);

  // buffSea.setAttribute("altitude", new Float32BufferAttribute(altitude, 1));
  // buffSea.setAttribute("height", new Float32BufferAttribute(heightData, 3));
  buffSea.setAttribute("color", new Float32BufferAttribute(colorData, 3));
  buffSea.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  buffSea.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  buffSea.setAttribute("uv", new Float32BufferAttribute(uvs, 2));

  return {
    hill: buff,
    sea: buffSea,
  };
}

let tt = 0;
let cache = new Map();
function makeMat({ params }) {
  let vs = require("!raw-loader!./glsl/planet.vert").default;
  let fs = require("!raw-loader!./glsl/planet.frag").default;

  let mat = new ShaderMaterial({
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

  let waternormals = useTexture("/textures/waternormals.jpg");
  let params = useControls({
    hillColor: "#5f7927",
    seaColor: "#2f4f87",
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

  // useEffect(() => {
  //   let obj = new Water(sea, {
  //     textureWidth: 256,
  //     textureHeight: 256,
  //     waterNormals: new TextureLoader().load(
  //       "/textures/waternormals.jpg",
  //       (texture) => {
  //         texture.wrapS = texture.wrapT = RepeatWrapping;
  //       }
  //     ),
  //     sunDirection: new Vector3(),
  //     sunColor: 0xffffff,
  //     waterColor: 0x001e0f,
  //     distortionScale: 1.7,
  //     fog: false,
  //   });

  //   fun.current.add(obj);

  //   return () => {};
  // }, []);

  return (
    <group scale={1.5} ref={fun}>
      {/*  */}
      <mesh geometry={hill} material={mat}></mesh>
      <mesh geometry={sea} rotation-x={0.6 * 0.5 * Math.PI}>
        <meshStandardMaterial
          opacity={1}
          normalMap={waternormals}
          metalness={0.7}
          roughness={0.08}
          transparent={true}
          blending={AdditiveBlending}
          color={params.seaColor}
        ></meshStandardMaterial>
      </mesh>
    </group>
  );
}
