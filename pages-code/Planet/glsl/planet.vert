
attribute vec3 earth;
attribute float altitude;
varying float vAltitude;
varying vec2 vUv;

varying vec3 vViewPosition;

void main (void) {
  vUv = uv;
  vAltitude = altitude;

  vec3 nPos = earth;

  // nPos += normal * altitude;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(nPos, 1.0);

  vec4 mvPosition = modelViewMatrix * vec4( nPos, 1.0 );
  vViewPosition = - mvPosition.xyz; // vector from vertex to camera
}