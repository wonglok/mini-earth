

attribute vec3 height;
attribute float altitude;
varying float vAltitude;
varying vec3 vHeight;
varying vec2 vUv;
void main (void) {
  vUv = uv;
  vHeight = normal * altitude;
  vAltitude = altitude;

  vec3 nPos = position;

  nPos += normal * altitude;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(nPos, 1.0);
}