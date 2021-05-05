import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  AnimationMixer,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  RepeatWrapping,
  // MultiplyBlending,
  // RepeatWrapping,
  ShaderMaterial,
  TextureLoader,
  UniformsLib,
  Vector3,
} from "three";
// import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise";
import { Floor } from "../Floor/Floor";
import { HDR } from "../HDR/HDR";
import { OrbitCam } from "../MapCam/OrbitCam";
// import { Water } from "three/examples/jsm/objects/Water.js";
import { useTools } from "../useTools/useTools";
import {
  Cloud,
  useAnimations,
  useFBX,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import { SkeletonUtils } from "three/examples/jsm/utils/SkeletonUtils";
import { CloudMesh } from "../CloudMesh/CloudMesh";
import { Mountain } from "./Mountain";

//
// import { EngineMini } from "../EngineMini/EngineMini";
// import { VolumeBox } from "../CloudVolume/VolumeBox";
// import { VolumeVisualiser } from "../CloudVolume/VolumeVisualiser";
// import { VolumeControls } from "../CloudVolume/VolumeControls";
export function Planet() {
  return (
    //camera={{ position: [0, 15, 15], lookAt: [0, 0, 0] }}
    <Canvas
      dpr={typeof devicePixelRatio !== "undefined" ? devicePixelRatio : 1.0}
    >
      <ambientLight></ambientLight>
      <Suspense fallback={null}>
        <HDR></HDR>
        <FunGeo></FunGeo>
        <OrbitCam></OrbitCam>
        <CloudMesh></CloudMesh>
      </Suspense>
      <Floor></Floor>
      {/* <VolumetricCloud></VolumetricCloud> */}
    </Canvas>
  );
}

// function VolumetricCloud() {
//   let mini = useRef();
//   let volume = useRef();

//   let params = useControls({
//     threshold: 0.45,
//     detail: 0.07,
//   });
//   // let volumeControls = useRef();
//   let { gl, camera, scene } = useThree();
//   useEffect(async () => {
//     mini.current = new EngineMini({
//       name: "mini",
//       window,
//       domElement: gl.domElement,
//     });
//     mini.current.set("camera", camera);
//     mini.current.set("scene", scene);
//     mini.current.set("renderer", gl);
//     // volumeControls.current = new VolumeControls(mini.current);
//     volume.current = new VolumeBox(mini.current);
//     scene.background = new Color("#3193d5");
//     return () => {
//       mini.current.clean();
//     };
//   }, []);

//   useFrame(() => {
//     if (mini.current) {
//       mini.current.work();
//     }
//     if (volume.current && volume.current.compute) {
//       volume.current.compute();
//     }
//     if (volume.current && volume.current.material) {
//       volume.current.material.uniforms.threshold.value = params.threshold;
//       volume.current.material.uniforms.detail.value = params.detail;
//     }
//   });

//   useEffect(() => {}, []);

//   return <group></group>;
// }

function makeGeo({ seed }) {
  let SimplexNoise = require("../Noise/simplex");
  var simplex = new SimplexNoise(seed);

  let radius = 40.0,
    widthSegments = 80,
    heightSegments = 80,
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

  const sampler = [];
  const peak = [];

  // buffers

  const indices = [];
  const waterSurface = [];
  const earthVert = [];
  const altitude = [];
  const normals = [];
  const uvs = [];
  const rayData = [];

  const hillThreshold = 1.3;

  function mulberry32(a) {
    return function () {
      var t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // let seededRand = ;

  let myRand = (v = 0) => mulberry32(v)(seed);

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

      let addon = 1.15;

      let perlin = simplex.noise3D(
        addon * normal.x,
        addon * normal.y,
        addon * normal.z
      );

      perlin = perlin * 2.0;

      // // make land flat
      // if (perlin >= 0.045) {
      //   perlin = 0.045;
      // }

      // // make sea
      // if (perlin <= -0.04) {
      //   perlin = -0.04;
      // }

      let extra = 0;
      for (let level = 0; level < 20; level++) {
        if (perlin >= hillThreshold + level * 0.1) {
          extra += perlin * 0.35;
        }
      }

      extra += (0.3 * myRand(vertex.x)) / 3;
      extra += (0.3 * myRand(vertex.y)) / 3;
      extra += (0.3 * myRand(vertex.z)) / 3;

      // let water = vertex.clone();
      // water.x += myRand(water.x) * -0.8;
      // water.y += myRand(water.y) * -0.8;
      // water.z += myRand(water.z) * -0.8;

      waterSurface.push(vertex.x, vertex.y, vertex.z);

      let base = vertex.clone();

      base.x += extra * 0.2;
      base.y += extra * 0.2;
      base.z += extra * 0.2;

      perlin += extra;

      altitude.push(perlin);

      let perlinRaycasting = perlin;
      if (perlinRaycasting <= 0) {
        perlinRaycasting = 0;
      }

      let rayPt = base
        .clone()
        .add(normal.clone().multiplyScalar(perlinRaycasting));
      rayData.push(rayPt.x, rayPt.y, rayPt.z);

      let earth = base.clone().add(normal.clone().multiplyScalar(perlin));

      earthVert.push(earth.x, earth.y, earth.z);

      let treeArea = perlin;
      if (treeArea >= 0.0 && treeArea <= hillThreshold) {
        treeArea = 1;
      } else {
        treeArea = 0;
      }

      let peakEntry = perlin;
      if (peakEntry >= 0.9) {
        peakEntry = 0.9;
      } else {
        peakEntry = 0;
      }

      sampler.push(treeArea);
      peak.push(treeArea);

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

  let buffScan = new BufferGeometry();
  buffScan.setAttribute("position", new Float32BufferAttribute(rayData, 3));
  buffScan.setAttribute("peak", new Float32BufferAttribute(peak, 1));
  buffScan.setAttribute("sampler", new Float32BufferAttribute(sampler, 1));

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

  buffSea.setAttribute("position", new Float32BufferAttribute(waterSurface, 3));
  buffSea.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  buffSea.setAttribute("uv", new Float32BufferAttribute(uvs, 2));

  return {
    hillThreshold,
    scan: buffScan,
    land: buffEarth,
    sea: buffSea,
  };
}

let cache = new Map();
function makeMat({ params }) {
  let vs = require("!raw-loader!./glsl/planet.vert").default;
  let fs = require("!raw-loader!./glsl/planet.frag").default;

  let mat = new ShaderMaterial({
    extensions: {
      derivatives: true,
    },
    lights: true,
    transparent: true,
    uniforms: {
      ...UniformsLib["lights"],
      rockColor: { value: new Color(params.rockColor) },
      landColor: { value: new Color(params.landColor) },
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
    man.visible = false;
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
      newman.visible = true;
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
  useEffect(() => {
    waternormals.wrapS = RepeatWrapping;
    waternormals.wrapT = RepeatWrapping;
    waternormals.repeat.set(1.0, 1.0);
  }, [waternormals]);

  let params = useControls({
    rockColor: "#ffffff",
    landColor: "#526c1c",
    seaColor: "#194665",
    cloudColor: "#1b678d",
    seed: 1,
  });

  let { scan, land, sea, hillThreshold } = useMemo(() => {
    return makeGeo({ seed: params.seed });
  }, [params.seed]);

  let mat = useMemo(() => {
    return makeMat({ params });
  }, [params]);
  let fun = useRef();

  // let fun = () => {
  //   cloudColor
  // }

  useEffect(() => {
    scene.background = new Color(params.cloudColor);
  }, [params.cloudColor]);

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

  let earthRef = useRef();

  let tempWorldPos = new Vector3();

  let dekstop = {
    onPointerMove: (e) => {
      fun.current.getWorldPosition(tempWorldPos);

      helper.current.position.copy(e.point);
      helper.current.lookAt(tempWorldPos);

      // metalman.scene.position.copy(e.point);
      // metalman.scene.lookAt(tempWorldPos);
    },
  };
  if (window.innerWidth <= 500) {
    delete dekstop["onPointerMove"];
  }
  // hillThreshold
  return (
    <group>
      <mesh ref={helper}>
        <coneBufferGeometry args={[0.1 * 3, 0.2 * 3, 32]}></coneBufferGeometry>
        <meshNormalMaterial></meshNormalMaterial>
      </mesh>

      <group scale={100}>
        <Cloud position={[-4, -2, 0]} args={[3, 2]} />
        <Cloud position={[-4, 2, 0]} args={[3, 2]} />
        <Cloud args={[3, 2]} />
        <Cloud position={[4, -2, 0]} args={[3, 2]} />
        <Cloud position={[4, 2, 0]} args={[3, 2]} />
      </group>

      <group ref={fun}>
        {items.map((i) => {
          return (
            <group key={i._id} position={i.position}>
              <Suspense fallback={null}>
                <Metalman lookAt={i.lookAt}></Metalman>
              </Suspense>
            </group>
          );
        })}

        {scan && <Mountain surfaceGeo={scan}></Mountain>}

        <mesh
          ref={earthRef}
          {...dekstop}
          onPointerDown={(e) => {
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
          geometry={land}
          material={mat}
        ></mesh>

        <mesh geometry={sea} rotation-x={0.6 * 0.5 * Math.PI}>
          <meshStandardMaterial
            opacity={0.9}
            normalMap={waternormals}
            metalness={0.9}
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
/*

drei
<Cloud position={[-4, -2, 0]} args={[3, 2]} />
<Cloud position={[-4, 2, 0]} args={[3, 2]} />
<Cloud args={[3, 2]} />
<Cloud position={[4, -2, 0]} args={[3, 2]} />
<Cloud position={[4, 2, 0]} args={[3, 2]} />

*/
