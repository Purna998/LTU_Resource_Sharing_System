import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, PerspectiveCamera, OrbitControls, Stars, Text, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';

const KnowledgeHub = () => {
  const meshRef = useRef();
  const ringRef1 = useRef();
  const ringRef2 = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.2;
      meshRef.current.position.y = Math.sin(t) * 0.1;
    }
    if (ringRef1.current) {
      ringRef1.current.rotation.x = t * 0.3;
      ringRef1.current.rotation.y = t * 0.1;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.z = t * 0.2;
      ringRef2.current.rotation.y = -t * 0.15;
    }
  });

  return (
    <group>
      {/* Core Knowledge Sphere */}
      <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
        <Sphere ref={meshRef} args={[1, 64, 64]}>
          <MeshDistortMaterial
            color="#3b82f6"
            attach="material"
            distort={0.4}
            speed={1.5}
            roughness={0.1}
            metalness={0.8}
            emissive="#1e40af"
            emissiveIntensity={0.5}
          />
        </Sphere>
      </Float>

      {/* Holographic Rings */}
      <mesh ref={ringRef1}>
        <torusGeometry args={[1.8, 0.02, 16, 100]} />
        <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={2} transparent opacity={0.6} />
      </mesh>

      <mesh ref={ringRef2}>
        <torusGeometry args={[2.2, 0.015, 16, 100]} />
        <meshStandardMaterial color="#93c5fd" emissive="#93c5fd" emissiveIntensity={1.5} transparent opacity={0.4} />
      </mesh>

      {/* Internal Glow Lights */}
      <pointLight position={[0, 0, 0]} intensity={2} color="#3b82f6" />
      <spotLight position={[5, 5, 5]} angle={0.3} penumbra={1} intensity={1} castShadow />
    </group>
  );
};

const Hero3DScene = () => {
  return (
    <div style={{ width: '100%', height: '500px', cursor: 'grab' }}>
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={45} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />

        <PresentationControls
          global
          config={{ mass: 2, tension: 500 }}
          snap={{ mass: 4, tension: 1500 }}
          rotation={[0, 0.3, 0]}
          polar={[-Math.PI / 4, Math.PI / 4]}
          azimuth={[-Math.PI / 4, Math.PI / 4]}
        >
          <KnowledgeHub />
        </PresentationControls>

        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
};

export default Hero3DScene;
