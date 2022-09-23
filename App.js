import { GLView } from "expo-gl";
import { Renderer, TextureLoader } from "expo-three";
import { PanResponder, Dimensions } from "react-native";
import {
  Mesh,
  ShaderMaterial,
  PerspectiveCamera,
  Scene, SphereGeometry,
  AdditiveBlending,
  BackSide,
} from "three";
import React, {useEffect, useState} from "react";


export default function App() {
  let cameraInitialPositionX = 0;
  let cameraInitialPositionY = 0;
  let cameraInitialPositionZ = 15;

  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  const [finger, setFinger] = useState({x:undefined, y: undefined});

  // Pan
  const panResponder = React.useRef(
    PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) =>
        true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) =>
        true,
      onPanResponderMove: (evt, gestureState) => {
        setFinger({x: (gestureState.moveX / windowWidth) * 2 - 1, y:-(gestureState.moveY / windowHeight) * 2 + 1});
      },
      onPanResponderTerminationRequest: (evt, gestureState) =>
        true,
      onShouldBlockNativeResponder: (evt, gestureState) => {
        // Returns whether this component should block native components from becoming the JS
        // responder. Returns true by default. Is currently only supported on android.
        return true;
      }
    })
  ).current;

  useEffect(() => {
    console.log(finger)
  }, [finger])


  return <GLView
    {...panResponder.panHandlers}
    style={{ flex: 1 }}
    onContextCreate={async (gl) => {
      // GL Parameter disruption
      const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

      const camera = new PerspectiveCamera(100, width/height, 0.01, 1000);

      // Create vertex shader (shape & position)
      const globeVert = `
        varying vec2 vUV;
        varying vec3 vNormal;
        
        void main(void) {
          vUV = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `;

      const atmosphereVert = `
        varying vec3 vNormal;
        
        void main(void) {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `;

      // Create fragment shader (for globe)
      const globeFrag = `
        uniform sampler2D globeTexture;
        varying vec2 vUV;
        varying vec3 vNormal;
        
        void main(void) {
          float intensity = 1.05 - dot(vNormal, vec3(0.0, 0.0, 1.0));
          vec3 atmosphere = vec3(0.3, 0.6, 1.0) * pow(intensity, 1.5);
          gl_FragColor = vec4(atmosphere + texture2D(globeTexture, vUV).xyz, 1.0);
        }
        `;

      const atmosphereFrag = `
        varying vec3 vNormal;
        
        void main(void) {
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
        }
        `;

      // Renderer declaration and set properties
      const renderer = new Renderer({ gl });
      renderer.setSize(width, height);
      renderer.setClearColor("#000");

      // Scene declaration, add a fog, and a grid helper to see axes dimensions
      const scene = new Scene();

      // Add sphere object instance to our scene
      const sphere = new SphereMesh(globeVert, globeFrag, {
        uniforms: {
          globeTexture: {
            value: new TextureLoader().load(require('./img/globe.jpg'))
          }
        }
      });
      // Atmosphere
      const atmosphere = new SphereMesh(atmosphereVert, atmosphereFrag, {
        blending: AdditiveBlending,
        side: BackSide
      });
      atmosphere.scale.set(1.1, 1.1, 1.1)

      scene.add(sphere);
      scene.add(atmosphere);

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
        sphere.rotation.y += 0.001;
        gl.endFrameEXP();
      };
      render();
    }}
    >
    </GLView>
};

class SphereMesh extends Mesh {
  constructor(vert, frag, config) {
    super(
      new SphereGeometry(5, 50, 50),
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        ...config
      })
    );
  }
}
