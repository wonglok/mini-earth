import {
  AdditiveBlending,
  BoxBufferGeometry,
  Mesh,
  RawShaderMaterial,
} from "three";

export class VolumeBox {
  constructor(mini) {
    this.mini = mini;
    this.mini.set("VolumeBox", this);
    this.setup();
  }
  async setup() {
    let scene = await this.mini.get("scene");
    // let SDFTexture = await this.mini.get("SDFTexture");
    let vertexShader = await fetch("/volume-shader/volumebox.vert").then((s) =>
      s.text()
    );
    let fragmentShader = await fetch(
      "/volume-shader/volumebox.frag"
    ).then((s) => s.text());

    let geoBox = new BoxBufferGeometry(1, 1, 1);

    /*
    in vec3 position;
    uniform mat4 modelMatrix;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform vec3 cameraPos;
    out vec3 vOrigin;
    out vec3 vDirection;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
      vOrigin = vec3( inverse( modelMatrix ) * vec4( cameraPos, 1.0 ) ).xyz;
      vDirection = position - vOrigin;
      gl_Position = projectionMatrix * mvPosition;
    }*/

    let STEPS = 100;
    let matBox = new RawShaderMaterial({
      transparent: true,
      uniforms: {
        // uniform mat4 modelViewMatrix;
        // uniform mat4 projectionMatrix;
        // varying vec3 vOrigin;
        // varying vec3 vDirection;

        steps: { value: STEPS },

        // tex3D: { value: SDFTexture.renderTarget.texture },
        // sliceSize: { value: SDFTexture.info.SLICE_SIZE_PX },
        // numRows: { value: SDFTexture.info.NUM_ROW },
        // slicesPerRow: { value: SDFTexture.info.SLICE_PER_ROW },

        threshold: {
          value: 0.75,
        },
        detail: {
          value: 0.1,
        },
      },
      vertexShader: vertexShader.replace(
        `#define STEPS 100`,
        `#define STEPS ${STEPS.toFixed(0)}`
      ),
      fragmentShader,
      // blending: AdditiveBlending,
    });

    let meshBox = new Mesh(geoBox, matBox);
    meshBox.scale.set(15, 15, 15);
    meshBox.frustumCulled = false;
    scene.add(meshBox);
    this.mesh = meshBox;
    this.material = matBox;

    this.mini.onClean(() => {
      scene.remove(meshBox);
    });
  }
  clean() {}
}
