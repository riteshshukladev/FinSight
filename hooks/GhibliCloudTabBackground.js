// GhibliCloudTabBackground.js - Advanced version for expo-router tabs
import React, { useRef, useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { GLView } from "expo-gl";
import { Renderer } from "expo-three";
import * as THREE from "three";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function GhibliCloudTabBackground({
  children,
  style,
  intensity = 0.8,
  speed = 0.4,
  cloudCount = 18,
  performanceMode = "balanced",
}) {
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const glRef = useRef(null);
  const [isGLReady, setIsGLReady] = useState(false);

  const getPerformanceSettings = () => {
    switch (performanceMode) {
      case "performance":
        return { clouds: 12, segments: 16, animationSteps: 0.015 };
      case "quality":
        return { clouds: 24, segments: 32, animationSteps: 0.008 };
      default: // balanced
        return { clouds: 18, segments: 24, animationSteps: 0.012 };
    }
  };

  const onContextCreate = async (gl) => {
    try {
      const settings = getPerformanceSettings();

      // Scene setup
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        1000
      );
      camera.position.z = 35;
      cameraRef.current = camera;

      const renderer = new Renderer({ gl, alpha: true, antialias: true });
      // Transparent clear so clouds show with no black
      renderer.setClearColor(0x000000, 0);
      gl.clearColor(0, 0, 0, 0);
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      rendererRef.current = renderer;
      glRef.current = gl;
      renderer.setClearColor("#87CEEB", 1.0);

      // Advanced sky dome with atmospheric scattering
      const skyGeometry = new THREE.SphereGeometry(300, 32, 32);
      const skyMaterial = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {
          u_time: { value: 0 },
          u_sunPosition: { value: new THREE.Vector3(0.3, 0.6, 0.8) },
        },
        vertexShader: `
          varying vec3 vWorldPosition;
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float u_time;
          uniform vec3 u_sunPosition;
          varying vec3 vWorldPosition;
          varying vec3 vNormal;

          void main() {
            vec3 viewDir = normalize(vWorldPosition);
            float sunDot = dot(viewDir, normalize(u_sunPosition));

            // Atmospheric colors
            vec3 skyTop = vec3(0.4, 0.7, 1.0);      // Deep blue
            vec3 skyHorizon = vec3(0.7, 0.9, 1.0);  // Light blue  
            vec3 sunColor = vec3(1.0, 0.95, 0.8);   // Warm sun

            // Height-based gradient
            float h = normalize(vWorldPosition + vec3(0.0, 200.0, 0.0)).y;
            vec3 skyColor = mix(skyHorizon, skyTop, max(pow(h, 0.8), 0.0));

            // Sun halo effect
            float sunHalo = pow(max(sunDot, 0.0), 8.0) * 0.3;
            skyColor = mix(skyColor, sunColor, sunHalo);

            // Atmospheric perspective
            float atmosphere = 1.0 - pow(max(h, 0.0), 2.0);
            skyColor = mix(skyColor, vec3(0.9, 0.95, 1.0), atmosphere * 0.2);

            gl_FragColor = vec4(skyColor, 1.0);
          }
        `,
      });

      const sky = new THREE.Mesh(skyGeometry, skyMaterial);
      scene.add(sky);

      // Advanced cloud system with multiple layers
      const cloudLayers = [];

      for (let layer = 0; layer < 4; layer++) {
        const layerClouds = [];
        const layerHeight = 10 + layer * 5;
        const layerDistance = 15 + layer * 12;
        const layerOpacity = intensity * (0.8 - layer * 0.15);

        for (let i = 0; i < Math.floor(settings.clouds / 4); i++) {
          // Advanced cloud geometry with more detail
          const cloudGeometry = new THREE.PlaneGeometry(
            6 + Math.random() * 4,
            3 + Math.random() * 2,
            settings.segments,
            settings.segments
          );

          // Advanced cloud shader with volumetric appearance
          const cloudMaterial = new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            uniforms: {
              u_opacity: { value: layerOpacity },
              u_time: { value: 0 },
              u_layer: { value: layer },
              u_seed: { value: Math.random() * 100 },
              u_sunPosition: { value: new THREE.Vector3(0.3, 0.6, 0.8) },
            },
            vertexShader: `
              varying vec2 vUv;
              varying vec3 vNormal;
              varying vec3 vWorldPosition;
              uniform float u_time;
              uniform float u_seed;

              // Noise function for vertex displacement
              float noise(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233)) + u_seed) * 43758.5453123);
              }

              void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);

                // Add subtle vertex displacement for cloud volume
                vec3 pos = position;
                float displacement = noise(uv * 3.0 + u_time * 0.1) * 0.3;
                pos += normal * displacement;

                vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
              }
            `,
            fragmentShader: `
              uniform float u_opacity;
              uniform float u_time;
              uniform float u_layer;
              uniform float u_seed;
              uniform vec3 u_sunPosition;
              varying vec2 vUv;
              varying vec3 vNormal;
              varying vec3 vWorldPosition;

              // Advanced noise functions
              float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233)) + u_seed) * 43758.5453123);
              }

              float noise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
              }

              // Fractal Brownian Motion for organic cloud texture
              float fbm(vec2 st) {
                float value = 0.0;
                float amplitude = 0.5;
                for (int i = 0; i < 4; i++) {
                  value += amplitude * noise(st);
                  st *= 2.0;
                  amplitude *= 0.5;
                }
                return value;
              }

              void main() {
                vec2 animatedUV = vUv + vec2(u_time * 0.02, u_time * 0.01);

                // Create complex cloud shape
                float cloudDensity = fbm(animatedUV * 2.0);
                cloudDensity += fbm(animatedUV * 5.0) * 0.5;
                cloudDensity += fbm(animatedUV * 10.0) * 0.25;

                // Soft cloud edges
                vec2 center = vec2(0.5, 0.5);
                float edgeFade = 1.0 - smoothstep(0.3, 0.6, distance(vUv, center));
                cloudDensity *= edgeFade;

                // Lighting calculation
                vec3 lightDir = normalize(u_sunPosition);
                float lightDot = dot(vNormal, lightDir);

                // Ghibli-style cloud colors
                vec3 cloudHighlight = vec3(1.0, 0.98, 0.95);   // Warm white
                vec3 cloudShadow = vec3(0.8, 0.85, 0.95);      // Cool shadow
                vec3 cloudBase = vec3(0.9, 0.93, 0.98);        // Base cloud color

                // Mix colors based on lighting
                vec3 cloudColor = mix(cloudShadow, cloudHighlight, max(lightDot, 0.0) * 0.7 + 0.3);
                cloudColor = mix(cloudColor, cloudBase, 0.5);

                // Layer-based color variation
                cloudColor = mix(cloudColor, vec3(0.85, 0.9, 0.98), u_layer * 0.1);

                float alpha = cloudDensity * u_opacity;
                alpha = smoothstep(0.2, 0.8, alpha);

                gl_FragColor = vec4(cloudColor, alpha);
              }
            `,
          });

          const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);

          // Natural cloud positioning
          cloud.position.set(
            (Math.random() - 0.5) * 50,
            layerHeight + Math.random() * 3,
            -layerDistance + (Math.random() - 0.5) * 20
          );

          cloud.scale.set(
            1.2 + Math.random() * 0.6,
            0.8 + Math.random() * 0.4,
            1
          );

          cloud.rotation.z = (Math.random() - 0.5) * 0.5;

          const cloudData = {
            mesh: cloud,
            speed: speed * (0.4 + Math.random() * 0.8),
            bobSpeed: 0.3 + Math.random() * 0.7,
            originalY: cloud.position.y,
            phase: Math.random() * Math.PI * 2,
          };

          layerClouds.push(cloudData);
          scene.add(cloud);
        }

        cloudLayers.push(layerClouds);
      }

      // Advanced lighting setup
      const ambientLight = new THREE.AmbientLight("#E8F4FF", 0.7);
      scene.add(ambientLight);

      const sunLight = new THREE.DirectionalLight("#FFF2D4", 1.3);
      sunLight.position.set(20, 25, 10);
      scene.add(sunLight);

      // Subtle rim lighting for depth
      const rimLight = new THREE.DirectionalLight("#B8D4F0", 0.6);
      rimLight.position.set(-15, 20, -10);
      scene.add(rimLight);

      // Advanced animation loop
      const animate = () => {
        requestAnimationFrame(animate);

        const time = Date.now() * 0.001;

        // Update sky
        if (sky.material.uniforms) {
          sky.material.uniforms.u_time.value = time;
        }

        // Advanced cloud animation
        cloudLayers.forEach((layer, layerIndex) => {
          layer.forEach((cloudData, cloudIndex) => {
            const { mesh, speed, bobSpeed, originalY, phase } = cloudData;

            // Horizontal drift with slight variation per layer
            mesh.position.x +=
              speed * settings.animationSteps * (1 + layerIndex * 0.2);

            // Wrap around with staggered reset
            if (mesh.position.x > 40 + layerIndex * 5) {
              mesh.position.x = -40 - layerIndex * 5;
            }

            // Complex vertical movement
            const bobOffset = Math.sin(time * bobSpeed + phase) * 0.8;
            const layerFloat = Math.sin(time * 0.2 + layerIndex) * 0.3;
            mesh.position.y =
              originalY + bobOffset * 0.005 + layerFloat * 0.002;

            // Subtle rotation
            mesh.rotation.z += Math.sin(time * 0.1 + cloudIndex) * 0.0001;

            // Update shader uniforms
            if (mesh.material.uniforms) {
              mesh.material.uniforms.u_time.value = time;
            }
          });
        });

        renderer.render(scene, camera);
        gl.endFrameEXP();
      };

      animate();
      setIsGLReady(true);
    } catch (error) {
      console.error("Error creating advanced cloud scene:", error);
    }
  };

  const onLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const gl = glRef.current;
    if (!renderer || !camera || !gl) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }, []);

  return (
    <View
      style={[{ flex: 1 }, style]}
      pointerEvents="box-none"
      onLayout={onLayout}
    >
      <GLView
        style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]}
        onContextCreate={onContextCreate}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  glView: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: "transparent",
  },
});
