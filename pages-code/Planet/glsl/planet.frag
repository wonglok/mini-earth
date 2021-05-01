#include <common>

varying float vAltitude;
varying vec2 vUv;

uniform vec3 seaColor;
uniform vec3 landColor;
uniform vec3 rockColor;

uniform sampler2D rock;

varying vec3 vViewPosition;

void main (void) {

  vec3 viewPos = vViewPosition;
  vec3 normal = normalize( cross( dFdx( viewPos ), dFdy( viewPos ) )  );

  //  #if MAX_POINT_LIGHTS > 0
  //  for(int l = 0; l < MAX_POINT_LIGHTS; l++) {
  //      vec3 lightDirection = normalize(v_position - pointLightPosition[l]);
  //      addedLights.rgb += clamp(dot(-lightDirection, normal), 0.0, 1.0) * pointLightColor[l];
  //  }
  //  #endif

  float avg = (normal.x + normal.y + normal.z ) / 3.0 + 0.1;

  // vec4 rockC = texture2D(rock, vUv);
  vec4 rockC = vec4(1.0);
  rockC.rgb = vec3(avg);

  vec3 outColor = vec3(rockC.rgb);

  float vA = vAltitude;
  if (vA < 0.0) {
    outColor = ((rockC.rgb)) * seaColor;
  } else {
    outColor = ((rockC.rgb * (vA + 2.0))) * landColor;

    float hillThreshold = 1.35;
    if (vA >= hillThreshold) {

      // float hh = (vA) / hillThreshold * 0.5 + 0.1;
      // if (hh >= 1.0) {
      //   hh = 1.0;
      // }
      outColor = ((rockC.rgb)) * rockColor;
    }
  }

  gl_FragColor = vec4(outColor, 1.0);
}