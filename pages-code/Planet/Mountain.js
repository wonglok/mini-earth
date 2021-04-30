import { useFBX, useGLTF } from "@react-three/drei";
import { useGraph } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import {
  Color,
  ConeBufferGeometry,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

export function Peak({ surfaceGeo }) {
  let ref = useRef();

  useEffect(() => {
    const surfaceMesh = new Mesh(surfaceGeo, new MeshBasicMaterial());

    const sampler = new MeshSurfaceSampler(surfaceMesh)
      .setWeightAttribute("peak")
      .build();

    const manyMeshMat = new MeshStandardMaterial({
      color: new Color("#824f10").offsetHSL(0, 0.3, -0.2),
      metalness: 0.9,
      roughness: 0.4,
      flatShading: true,
      // vertexColors: true,
    });

    const count = 250;
    const peakGeo = new ConeBufferGeometry(1.5, 6, 5, 2);
    peakGeo.rotateX(-0.5 * Math.PI);

    const manyMesh = new InstancedMesh(peakGeo, manyMeshMat, count);

    const tempPosition = new Vector3();
    const obj3 = new Object3D();
    const worldPos = new Vector3();
    const tempNormal = new Vector3();
    const tempColor = new Color();
    surfaceMesh.getWorldPosition(worldPos);

    // Sample randomly from the surface, creating an instance of the sample
    // geometry at each sample point.

    for (let i = 0; i < count; i++) {
      sampler.sample(tempPosition, tempNormal, tempColor);

      obj3.position.copy(tempPosition);
      obj3.lookAt(worldPos.x, worldPos.y, worldPos.z);
      obj3.scale.setScalar(Math.random() * 0.5 + 0.5);
      obj3.updateMatrix();

      tempColor.offsetHSL(0.1, 0.1, 0.1);

      manyMesh.setColorAt(i, tempColor);
      // _matrix.makeTranslation(tempPosition.x, tempPosition.y, tempPosition.z);
      // _matrix.lookAt(worldPos);

      manyMesh.setMatrixAt(i, obj3.matrix);
    }
    manyMesh.instanceMatrix.needsUpdate = true;

    ref.current.add(manyMesh);
    return () => {
      ref.current.remove(manyMesh);
    };
  }, [surfaceGeo]);

  return <group ref={ref}></group>;
}

export function Mountain({ surfaceGeo }) {
  const ref = useRef();

  const tree = useFBX("/fbx/tree.fbx");

  const { nodes } = useGraph(tree);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const surfaceMesh = new Mesh(surfaceGeo, new MeshBasicMaterial());

    let brownGeo = nodes.Cylinder.geometry.clone();
    brownGeo.applyMatrix4(nodes.Cylinder.matrixWorld);
    brownGeo.scale(0.001, 0.001, 0.001);
    brownGeo.rotateX(Math.PI * -0.5);

    let greenGeo = nodes.Icosphere.geometry.clone();
    greenGeo.applyMatrix4(nodes.Icosphere.matrixWorld);
    greenGeo.scale(0.001, 0.001, 0.001);
    greenGeo.rotateX(Math.PI * -0.5);

    const count = 200;

    // const sampleGeometry = new ConeBufferGeometry(1, 5, 6, 1);
    // sampleGeometry.rotateX(Math.PI * -0.5);

    const sampleMaterialGreen = new MeshStandardMaterial({
      color: new Color("#42692f").offsetHSL(0, 0.3, -0.2),
      metalness: 0.9,
      roughness: 0.4,
    });

    const sampleMaterialBrown = new MeshStandardMaterial({
      color: new Color("#845e0b").offsetHSL(0, 0.3, -0.2),
      metalness: 0.9,
      roughness: 0.4,
    });

    const sampler = new MeshSurfaceSampler(surfaceMesh)
      .setWeightAttribute("sampler")
      .build();

    const manyMeshBrown = new InstancedMesh(
      brownGeo,
      sampleMaterialBrown,
      count
    );

    const manyMeshGreen = new InstancedMesh(
      greenGeo,
      sampleMaterialGreen,
      count
    );

    // const _matrix = new Matrix4();

    const tempPosition = new Vector3();
    const obj3 = new Object3D();
    const worldPos = new Vector3();
    surfaceMesh.getWorldPosition(worldPos);

    // Sample randomly from the surface, creating an instance of the sample
    // geometry at each sample point.

    for (let i = 0; i < count; i++) {
      sampler.sample(tempPosition);

      obj3.position.copy(tempPosition);
      obj3.lookAt(worldPos.x, worldPos.y, worldPos.z);
      obj3.scale.setScalar(Math.random() * 0.6 + 0.4);
      obj3.updateMatrix();

      // _matrix.makeTranslation(tempPosition.x, tempPosition.y, tempPosition.z);
      // _matrix.lookAt(worldPos);

      manyMeshBrown.setMatrixAt(i, obj3.matrix);
      manyMeshGreen.setMatrixAt(i, obj3.matrix);
    }

    manyMeshBrown.instanceMatrix.needsUpdate = true;
    manyMeshGreen.instanceMatrix.needsUpdate = true;

    ref.current.add(manyMeshGreen);
    ref.current.add(manyMeshBrown);

    return () => {
      ref.current.remove(manyMeshGreen);
      ref.current.remove(manyMeshBrown);
    };
    //
  }, [surfaceGeo]);

  return <group ref={ref}>{/* <Peak surfaceGeo={surfaceGeo}></Peak> */}</group>;
}
