import { GLView } from "expo-gl";
import { Renderer, TextureLoader } from "expo-three";
import {
  AmbientLight,
  Fog,
  Mesh,
  ShaderMaterial,
  PerspectiveCamera,
  PointLight,
  Scene, SphereGeometry,
  SpotLight,
} from "three";


export default function App() {
  let cameraInitialPositionX = 0;
  let cameraInitialPositionY = 0;
  let cameraInitialPositionZ = 15;

  return <GLView
    style={{ flex: 1 }}
    onContextCreate={async (gl) => {
      // GL Parameter disruption
      const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

      const camera = new PerspectiveCamera(100, width/height, 0.01, 1000);

      // Create vertex shader (shape & position)
      const vert = `
        varying vec2 vUV;
        varying vec3 vNormal;
        
        void main(void) {
          vUV = uv;
          vNormal = normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `;

      // Create fragment shader (color)
      const frag = `
        uniform sampler2D globeTexture;
        varying vec2 vUV;
        varying vec3 vNormal;
        
        void main(void) {
          float intensity = 1.05 - dot(vNormal, vec3(0.0, 0.0, 1.0));
          vec3 atmosphere = vec3(0.3, 0.6, 1.0) * pow(intensity, 1.5);
          gl_FragColor = vec4(atmosphere + texture2D(globeTexture, vUV).xyz, 1.0);
        }
        `;

      // Renderer declaration and set properties
      const renderer = new Renderer({ gl });
      renderer.setSize(width, height);
      renderer.setClearColor("#fff");

      // Scene declaration, add a fog, and a grid helper to see axes dimensions
      const scene = new Scene();

      // Add sphere object instance to our scene
      const sphere = new SphereMesh(vert, frag);
      scene.add(sphere);

      // Set camera position and look to sphere
      camera.position.set(
        cameraInitialPositionX,
        cameraInitialPositionY,
        cameraInitialPositionZ
      );

      camera.lookAt(sphere.position);

      // Render function
      const render = () => {
        requestAnimationFrame(render);
        renderer.render(scene, camera);
        gl.endFrameEXP();
      };
      render();
    }}
  />
};

class SphereMesh extends Mesh {
  constructor(vert, frag) {
    super(
      new SphereGeometry(5, 50, 50),
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          globeTexture: {
            value: new TextureLoader().load(require('./img/globe.jpg'))
          }
        }
      })
    );
  }
}
