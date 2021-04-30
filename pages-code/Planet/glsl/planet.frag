
varying float vAltitude;
varying vec2 vUv;

uniform vec3 seaColor;
uniform vec3 landColor;

uniform sampler2D rock;
void main (void) {
  vec4 rockC = texture2D(rock, vUv);
  vec3 outColor = vec3(rockC.rgb);

  float vA = vAltitude;
  if (vA < 0.0) {
    outColor = ((rockC.rgb * -vA)) * seaColor;
  } else {
    outColor = ((rockC.rgb * (vA + 0.5))) * landColor;
  }

  gl_FragColor = vec4(outColor, 1.0);
}