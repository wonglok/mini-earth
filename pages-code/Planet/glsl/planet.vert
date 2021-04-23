

attribute float altitude;
varying float vAltitude;
varying vec2 vUv;
void main (void) {
  vUv = uv;
  vAltitude = altitude;

  vec3 nPos = position;

  nPos += normal * altitude;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(nPos, 1.0);
}