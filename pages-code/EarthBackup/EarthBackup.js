import { useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
// import { useGLTF, useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  MeshStandardMaterial,
  SphereBufferGeometry,
  Vector3,
} from "three";
// import { SkeletonUtils } from "three/examples/jsm/utils/SkeletonUtils";
import { MapControls } from "three/examples/jsm/controls/OrbitControls";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise";
import { HDR } from "../HDR/HDR";

// import { AnimationMixer, MeshStandardMaterial, Vector2, Vector3 } from "three";
// import { useControls } from "leva";

export function EarthBackup() {
  return (
    <Canvas>
      <ambientLight></ambientLight>
      <Suspense fallback={null}>
        <CamControls></CamControls>

        <FunGeo></FunGeo>

        <Floor></Floor>
        <HDR></HDR>
      </Suspense>
    </Canvas>
  );
}

function CamControls() {
  let { gl, camera, scene } = useThree();
  let ref = useRef();
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

  let onLoop = (v) => {
    loopers.current.push(v);
  };

  useEffect(() => {
    camera.position.copy({
      x: 0,
      y: 100,
      z: -10,
    });

    camera.far = 100000;
    camera.near = 0.001;
    camera.updateProjectionMatrix();

    let ctrls = new MapControls(camera, gl.domElement);
    ctrls.object.position.y = 10;
    ctrls.object.position.z = 10;
    ctrls.enableDamping = true;
    onLoop(() => {
      ctrls.update();
    });

    return () => {
      ctrls.dispose();
      loopers.current = [];
    };
  });

  useFrame(() => {
    loopers.current.forEach((l) => l());
  });

  return <group ref={ref}></group>;
}

function Floor() {
  return (
    <group>
      <gridHelper args={[100, 100]}></gridHelper>
    </group>
  );
}

// import { useEffect, useRef } from "react";

// export function DoughNut() {
//   const range = (length) => Array.from({ length }, (_, i) => i);

//   const steps = range(10).map((i) => {
//     return [
//       "translate",
//       { t: [i / 10 - 0.5, 0, 0] },
//       [
//         [
//           "blend",
//           { k: i / 10 },
//           [
//             ["torus", { r1: 0.01, r2: 0.03 }],
//             ["sphere", { r: 0.03 }],
//           ],
//         ],
//       ],
//     ];
//   });

//   const tree = [
//     "scale",
//     { s: 2.0 },
//     [
//       //
//       [
//         "rotate",
//         { r: [0.1, 0.25, 0.5] },
//         [
//           //
//           ["union", steps],
//         ],
//       ],
//     ],
//   ];

//   return tree;
// }

export function MyMap() {
  // const range = (length) => Array.from({ length }, (_, i) => i);

  const tree = [
    "blend",
    { k: 0.3 },
    [
      ["sphere", { r: 0.1 }],
      [
        "translate",
        { t: [0.2, 0, 0] },
        [
          //
          ["sphere", { r: 0.1 }],
        ],
      ],
    ],
  ];
  return tree;
}

export function makeGeo() {
  let SimplexNoise = require("simplex-noise");
  var simplex = new SimplexNoise();

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

  // buffers

  const indices = [];
  const vertices = [];
  const colorData = [];
  const heightData = [];
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
        noise.x = Math.sin(
          improvedNoise.noise(
            normal.x * perlin,
            normal.x * perlin,
            normal.x * perlin
          )
        );
        noise.y = Math.sin(
          improvedNoise.noise(
            normal.y * perlin,
            normal.y * perlin,
            normal.y * perlin
          )
        );
        noise.z = Math.sin(
          improvedNoise.noise(
            normal.z * perlin,
            normal.z * perlin,
            normal.z * perlin
          )
        );

        height.multiply(noise).multiplyScalar(0.9);
      }

      height.multiplyScalar(-2);

      //
      heightData.push(
        //Math.abs
        height.x,
        //Math.abs
        height.y,
        //Math.abs
        height.z
      );

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
  buff.setAttribute("height", new Float32BufferAttribute(heightData, 3));
  buff.setAttribute("color", new Float32BufferAttribute(colorData, 3));
  buff.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  buff.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  buff.setAttribute("uv", new Float32BufferAttribute(uvs, 2));

  return buff;
}

export function FunGeo() {
  let geo = useMemo(makeGeo, []);
  let fun = useRef();
  useFrame(() => {
    if (fun.current) {
      fun.current.rotation.y += 0.003;
    }
  });

  return (
    <group scale={1} ref={fun}>
      {/*  */}
      <mesh geometry={geo}>
        <MyMaterial></MyMaterial>
      </mesh>
    </group>
  );
}

function MyMaterial() {
  const texture = useTexture("/textures/wall.jpg");
  const materialRef = useRef(new MeshStandardMaterial());
  const time = useRef({ value: 0 });
  const nodeRef = useRef(false);
  const uicontrols = useControls({
    river: "#1e65c1",
    hill: "#ff7c00",
  });

  window.dispatchEvent(new CustomEvent("uicontrols", { detail: uicontrols }));

  let loops = useRef([]);
  let onLoop = (v) => loops.current.push(v);

  useEffect(() => {
    loops.current = [];

    let patternGLSL = /* glsl */ `
        uniform float time;
        uniform float density;
        uniform float colorSatuation;
        // varying vec2 vUv;

        const mat2 m = mat2( 0.80,  0.60, -0.60,  0.80 );

        float noise( in vec2 p ) {
          return sin(p.x)*sin(p.y);
        }

        float fbm4( vec2 p ) {
            float f = 0.0;
            f += 0.5000 * noise( p ); p = m * p * 2.02;
            f += 0.2500 * noise( p ); p = m * p * 2.03;
            f += 0.1250 * noise( p ); p = m * p * 2.01;
            f += 0.0625 * noise( p );
            return f / 0.9375;
        }

        float fbm6( vec2 p ) {
            float f = 0.0;
            f += 0.500000*(0.5 + 0.5 * noise( p )); p = m*p*2.02;
            f += 0.250000*(0.5 + 0.5 * noise( p )); p = m*p*2.03;
            f += 0.125000*(0.5 + 0.5 * noise( p )); p = m*p*2.01;
            f += 0.062500*(0.5 + 0.5 * noise( p )); p = m*p*2.04;
            f += 0.031250*(0.5 + 0.5 * noise( p )); p = m*p*2.01;
            f += 0.015625*(0.5 + 0.5 * noise( p ));
            return f/0.96875;
        }

        float pattern (vec2 p) {
          float vout = fbm4( p + time + fbm6(  p + fbm4( p + time )) );
          return abs(vout);
        }

        float seedPattern (vec2 p, float seed) {
          float vout = fbm4( p + seed + fbm6(  p + fbm4( p + seed )) );
          return abs(vout);
        }
    `;

    materialRef.current.onBeforeCompile = (node) => {
      node.uniforms.time = time.current;
      node.uniforms["density"] = { value: 1.5 };
      node.uniforms["colorSatuation"] = { value: 0.3 };

      node.uniforms["riverColor"] = { value: new Color("#3c9a9e") };
      node.uniforms["hillColor"] = { value: new Color("#773f0e") };

      window.addEventListener("uicontrols", ({ detail: { river, hill } }) => {
        node.uniforms["riverColor"].value.set(river);
        node.uniforms["hillColor"].value.set(hill);
      });
      window.dispatchEvent(
        new CustomEvent("uicontrols", { detail: uicontrols })
      );

      nodeRef.current = node;

      if (!materialRef.current.map) {
        node.vertexShader = node.vertexShader.replace(
          `#include <clipping_planes_pars_vertex>`,
          `#include <clipping_planes_pars_vertex>
            varying vec2 vUv;
          `
        );

        node.vertexShader = node.vertexShader.replace(
          `#include <fog_vertex>`,
          `#include <fog_vertex>
            vUv = uv;
          `
        );
      }

      node.vertexShader = node.vertexShader.replace(
        `#include <clipping_planes_pars_vertex>`,
        `#include <clipping_planes_pars_vertex>

        attribute vec3 height;
        varying vec3 vHeight;
        ${patternGLSL}
        `
      );

      node.vertexShader = node.vertexShader.replace(
        `#include <project_vertex>`,
        /* glsl */ `

        // float seed = 0.5;
        // vec3 dis = normal * vec3(
        //   1.0 * seedPattern(2.0 * normal.xx * density + -colorSatuation * cos(seed * 0.05), seed),
        //   1.0 * seedPattern(2.0 * normal.yy * density +  0.0 * cos(seed * 0.05), seed),
        //   1.0 * seedPattern(2.0 * normal.zz * density +  colorSatuation * cos(seed * 0.05), seed)
        // );
        // transformed += dis;

        transformed += height * 0.5;

        vHeight = height;

        vec4 mvPosition = vec4(transformed, 1.0 );
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;
      `
      );

      console.log(node.vertexShader);

      node.fragmentShader = node.fragmentShader.replace(
        `#include <clipping_planes_pars_fragment>`,
        /* glsl */ `
        #include <clipping_planes_pars_fragment>

        uniform vec3 hillColor;
        uniform vec3 riverColor;

        varying vec3 vHeight;
        ${patternGLSL}

        float avg3 (vec3 v3color) {
          return (v3color.r + v3color.g + v3color.b) / 3.0;
        }
      `
      );

      node.fragmentShader = node.fragmentShader.replace(
        `gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,
        /* glsl */ `

        // outgoingLight += mix(outgoingLight, vec3(
        //   pattern(gl_FragCoord.xx * density + -colorSatuation * cos(time * 0.05)),
        //   pattern(gl_FragCoord.yy * density +  0.0 * cos(time * 0.05)),
        //   pattern(gl_FragCoord.zz * density +  colorSatuation * cos(time * 0.05))
        // ), 0.0);



        // River
        if (length(vHeight) < length(vNormal)) {
          outgoingLight.r += 0.0001 / length((vHeight));
          outgoingLight.g += 0.0001 / length((vHeight));
          outgoingLight.b += 0.0001 / length((vHeight));
        }

        outgoingLight.r += hillColor.r * (0.0 - length(vHeight));
        outgoingLight.g += hillColor.g * (0.0 - length(vHeight));
        outgoingLight.b += hillColor.b * (0.0 - length(vHeight));

        outgoingLight.rgb -= length(vHeight) * 1.5 * (1.0 - hillColor.rgb);


        if (avg3(outgoingLight.rgb) > 0.9) {
          outgoingLight.rgb = riverColor;
        }

        // outgoingLight.rgb += (riverColor) * length(vHeight);
        // outgoingLight.rgb += (hillColor) * length(vHeight);


        // hill top black

        gl_FragColor = vec4(outgoingLight, diffuseColor.a);
      `
      );
    };
    materialRef.current.needsUpdate = true;
  });

  useFrame((state, dt) => {
    time.current.value += dt;
    loops.current.forEach((s) => s());
  });

  return (
    <meshStandardMaterial
      ref={materialRef}
      metalness={0.3}
      roughness={0.6}
      map={texture}
      map-flipY={true}
      transparent={true}
      opacity={1}
      skinning={false}
      vertexColors={false}
    ></meshStandardMaterial>
  );
}

// const geo = useMemo(() => {
//   const {
//     // compileShader,
//     compileFunction,
//     // glslHelpers,
//   } = require("hiccup-sdf");

//   const build = require("implicit-mesh");

//   const tree = MyMap();
//   const sdfFunc = compileFunction(tree);

//   // const { inject, model } = compileShader(tree);
//   // const shader = glslHelpers.createShaderFull(model, inject);
//   // let regl = displayRaw(shader);
//   // div.current.appendChild(regl._gl.canvas);

//   let mesh = build(128, (x, y, z) => {
//     return sdfFunc([x, y, z]);
//   });
//   console.log(mesh);

//   let indexData = [];
//   let positonData = [];

//   mesh.positions.forEach((arr) => {
//     positonData.push(...arr);
//   });
//   mesh.cells.forEach((arr) => {
//     indexData.push(...arr);
//   });

//   let buffer = new BufferGeometry();
//   buffer.setIndex(indexData);

//   buffer.setAttribute(
//     "position",
//     new BufferAttribute(new Float32Array(positonData), 3)
//   );

//   return buffer;
// });
