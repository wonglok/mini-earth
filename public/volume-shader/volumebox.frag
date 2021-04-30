precision highp float;
precision highp sampler2D;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec3 vOrigin;
varying vec3 vDirection;


uniform float threshold;
uniform float steps;
uniform float detail;

#define STEPS 100

vec2 hitBox( vec3 orig, vec3 dir ) {
  const vec3 box_min = vec3( - 0.5 );
  const vec3 box_max = vec3( 0.5 );
  vec3 inv_dir = 1.0 / dir;
  vec3 tmin_tmp = ( box_min - orig ) * inv_dir;
  vec3 tmax_tmp = ( box_max - orig ) * inv_dir;
  vec3 tmin = min( tmin_tmp, tmax_tmp );
  vec3 tmax = max( tmin_tmp, tmax_tmp );
  float t0 = max( tmin.x, max( tmin.y, tmin.z ) );
  float t1 = min( tmax.x, min( tmax.y, tmax.z ) );
  return vec2( t0, t1 );
}

// uniform sampler2D tex3D;
// uniform float sliceSize;
// uniform float numRows;
// uniform float slicesPerRow;

// // tex is a texture with each slice of the cube placed in grid in a texture.
// // texCoord is a 3d texture coord
// // size is the size if the cube in pixels.
// // slicesPerRow is how many slices there are across the texture
// // numRows is the number of rows of slices
// vec2 computeSliceOffset(float slice, float slicesPerRow, vec2 sliceSize) {
//   return sliceSize * vec2(mod(slice, slicesPerRow),
//                           floor(slice / slicesPerRow));
// }

// vec4 scan3DTextureValue (
//     sampler2D tex, vec3 texCoord, float size, float numRows, float slicesPerRow) {
//   float slice   = texCoord.z * size;
//   float sliceZ  = floor(slice);                         // slice we need
//   float zOffset = fract(slice);                         // dist between slices
//   vec2 sliceSize = vec2(1.0 / slicesPerRow,             // u space of 1 slice
//                         1.0 / numRows);                 // v space of 1 slice
//   vec2 slice0Offset = computeSliceOffset(sliceZ, slicesPerRow, sliceSize);
//   vec2 slice1Offset = computeSliceOffset(sliceZ + 1.0, slicesPerRow, sliceSize);
//   vec2 slicePixelSize = sliceSize / size;               // space of 1 pixel
//   vec2 sliceInnerSize = slicePixelSize * (size - 1.0);  // space of size pixels
//   vec2 uv = slicePixelSize * 0.5 + texCoord.xy * sliceInnerSize;
//   vec4 slice0Color = texture2D(tex, slice0Offset + uv);
//   vec4 slice1Color = texture2D(tex, slice1Offset + uv);
//   return mix(slice0Color, slice1Color, zOffset);
//   return slice0Color;
// }

// float sample1( vec3 p ) {
//   vec4 texture3Doutput = scan3DTextureValue(tex3D, p, sliceSize, numRows, slicesPerRow);
//   return texture3Doutput.a;
// }

// #define epsilon .0001
// vec3 getNormal( vec3 coord ) {
//   if ( coord.x < epsilon ) return vec3( 1.0, 0.0, 0.0 );
//   if ( coord.y < epsilon ) return vec3( 0.0, 1.0, 0.0 );
//   if ( coord.z < epsilon ) return vec3( 0.0, 0.0, 1.0 );
//   if ( coord.x > 1.0 - epsilon ) return vec3( - 1.0, 0.0, 0.0 );
//   if ( coord.y > 1.0 - epsilon ) return vec3( 0.0, - 1.0, 0.0 );
//   if ( coord.z > 1.0 - epsilon ) return vec3( 0.0, 0.0, - 1.0 );
//   float step = 0.01;
//   float x = sample1( coord + vec3( - step, 0.0, 0.0 ) ) - sample1( coord + vec3( step, 0.0, 0.0 ) );
//   float y = sample1( coord + vec3( 0.0, - step, 0.0 ) ) - sample1( coord + vec3( 0.0, step, 0.0 ) );
//   float z = sample1( coord + vec3( 0.0, 0.0, - step ) ) - sample1( coord + vec3( 0.0, 0.0, step ) );
//   return normalize( vec3( x, y, z ) );
// }

//	Classic Perlin 3D Noise
//	by Stefan Gustavson
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec3 P){
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

void main () {
  vec3 rayDir = normalize( vDirection );
  vec2 bounds = hitBox( vOrigin, rayDir );
  if (bounds.x > bounds.y) discard;

  bounds.x = max( bounds.x, 0.0 );

  vec3 p = vOrigin + bounds.x * rayDir;
  vec3 inc = 1.0 / abs( rayDir );
  float delta = min( inc.x, min( inc.y, inc.z ) );
  delta /= steps;

  vec4 color = vec4(0.0);
  color.a = 0.0;

  vec3 pos;

  float tt = bounds.x;
  for (int i = 0; i < STEPS; i++) {
    if (tt < bounds.y) {
      pos = p;
      // pos *= 5.0;

      // float d = sample1(pos);

      // if (d < 0.0) {
      //   color.rgb = calcNormal(pos) * 0.5 + 0.5;
      //   color.a = 1.0 - d;
      //   break;
      // }

      vec3 uv3 = pos;

      float noiseRes = cnoise(uv3 * detail * 100.0);


      if ( noiseRes > threshold ) {
        color.rgb = vec3(noiseRes);

        color.a += noiseRes;

        // color.rgba = vec3(p, 0.5);
        break;
      }


      // vec4 scanResult = scan3DTextureValue(tex3D, p + 0.5, sliceSize, numRows, slicesPerRow);
      // float d = scanResult.a;
      // if ( d > threshold ) {
      //   color.rgba = vec3(p, 0.5);
      //   break;
      // }

      p += rayDir * delta;

      tt += delta;
    }
  }

  // for (int i = 0; i < STEPS; i++) {
  //   vec4 scanResult = scan3DTextureValue(tex3D, p + 0.5, sliceSize, numRows, slicesPerRow);
  //   float d = scanResult.a;
  //   if ( d > threshold ) {
  //     color.rgba = scanResult.rgba;
  //     break;
  //   }
  //   p += rayDir * delta;
  // }

  // color = vec4(1.0, 0.0, 0.0, 0.5);

  // debug
  if ( color.a <= 0.0 ) {
    color.a = 0.0;
  }


  gl_FragColor = color;
}