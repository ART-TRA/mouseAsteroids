uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform sampler2D uDispTexture;
uniform float uHover;
uniform float uDispFactor;
uniform float uEffectFactor;
varying vec2 vUv;

void main() {
  vec4 disp = texture2D(uDispTexture, vUv);
  vec2 distortedPosition = vec2(vUv.x, vUv.y + uDispFactor * (disp.r*uEffectFactor));
  vec2 distortedPosition2 = vec2(vUv.x, vUv.y - (1.0 - uDispFactor) * (disp.r*uEffectFactor));
  vec4 textureImg1 = texture2D(uTexture1, distortedPosition);
  vec4 textureImg2 = texture2D(uTexture2, distortedPosition2);
  vec4 finalTexture = mix(textureImg1, textureImg2, uDispFactor);

  gl_FragColor = vec4(textureImg1);
  gl_FragColor = finalTexture;
}