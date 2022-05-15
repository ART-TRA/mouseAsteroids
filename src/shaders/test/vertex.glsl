attribute float sizes;
varying vec2 vUv;

void main() {
  vec4 modelPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = (400.0 * sizes + 5.0) * (1.0 / -modelPosition.z);
  gl_Position = projectionMatrix * modelPosition;

  vUv = uv;
}
