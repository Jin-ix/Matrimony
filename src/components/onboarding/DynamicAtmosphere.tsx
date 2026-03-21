import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

// A fluid, shifting atmosphere that changes color based on 'mood' prop
export default function DynamicAtmosphere({ mood = 'neutral' }: { mood?: 'neutral' | 'warm' | 'cool' }) {
    return (
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }} className="h-full w-full">
            <ambientLight intensity={0.5} />
            <FluidMesh mood={mood} />
        </Canvas>
    );
}

function FluidMesh({ mood }: { mood: 'neutral' | 'warm' | 'cool' }) {
    const meshRef = useRef<THREE.Mesh>(null);

    // Create a custom shader material for soft, fluid gradients
    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor1: { value: new THREE.Color('#EBE2D3') }, // Pearl 300
                uColor2: { value: new THREE.Color('#C29F80') }, // Pearl 600
            },
            vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        uniform float uTime;
        void main() {
          vUv = uv;
          vPosition = position;
          vec3 pos = position;
          pos.z += sin(pos.x * 2.0 + uTime) * 0.5;
          pos.z += cos(pos.y * 2.0 + uTime) * 0.5;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
            fragmentShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uTime;
        void main() {
          float mixValue = (sin(vPosition.x * 0.5 + uTime) + cos(vPosition.y * 0.5 + uTime) + 2.0) / 4.0;
          vec3 finalColor = mix(uColor1, uColor2, mixValue);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
            wireframe: false,
        });
    }, []);

    useFrame((state) => {
        if (meshRef.current) {
            const mat = meshRef.current.material as THREE.ShaderMaterial;
            mat.uniforms.uTime.value = state.clock.elapsedTime * 0.5;

            // Interpolate colors based on mood
            const targetColor1 = new THREE.Color(
                mood === 'warm' ? '#dfc27a' : mood === 'cool' ? '#FBF9F6' : '#EBE2D3'
            );
            const targetColor2 = new THREE.Color(
                mood === 'warm' ? '#b16f21' : mood === 'cool' ? '#937660' : '#C29F80'
            );

            mat.uniforms.uColor1.value.lerp(targetColor1, 0.05);
            mat.uniforms.uColor2.value.lerp(targetColor2, 0.05);
        }
    });

    return (
        <mesh ref={meshRef} position={[0, 0, -2]}>
            <planeGeometry args={[20, 20, 64, 64]} />
            <primitive object={material} />
        </mesh>
    );
}
