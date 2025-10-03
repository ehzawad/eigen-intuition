import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { matmul } from '../utils/matrix';

// 3D visualization of 2x2 matrix action in R^3
// Shows the XY plane transformation with Z-axis for visual depth

function VectorArrow({ start, end, color = 'blue', lineWidth = 2 }) {
  const points = useMemo(() => {
    return [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  }, [start, end]);

  return (
    <>
      <Line points={points} color={color} lineWidth={lineWidth} />
      <mesh position={end}>
        <coneGeometry args={[0.05, 0.15, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </>
  );
}

function TransformedGrid({ matrix, t }) {
  const lines = useMemo(() => {
    const gridLines = [];
    const range = 3;
    const step = 0.5;

    // Interpolate matrix
    const At = [
      [(1 - t) + t * matrix[0][0], t * matrix[0][1]],
      [t * matrix[1][0], (1 - t) + t * matrix[1][1]]
    ];

    // Grid lines parallel to X
    for (let y = -range; y <= range; y += step) {
      const linePoints = [];
      for (let x = -range; x <= range; x += step / 2) {
        const transformed = matmul(At, [x, y]);
        linePoints.push(new THREE.Vector3(transformed[0], transformed[1], 0));
      }
      gridLines.push(linePoints);
    }

    // Grid lines parallel to Y
    for (let x = -range; x <= range; x += step) {
      const linePoints = [];
      for (let y = -range; y <= range; y += step / 2) {
        const transformed = matmul(At, [x, y]);
        linePoints.push(new THREE.Vector3(transformed[0], transformed[1], 0));
      }
      gridLines.push(linePoints);
    }

    return gridLines;
  }, [matrix, t]);

  return (
    <>
      {lines.map((points, i) => (
        <Line key={i} points={points} color="#3b82f6" lineWidth={1} transparent opacity={0.6} />
      ))}
    </>
  );
}

function EigenVectors({ analysis }) {
  if (analysis.eigenvalues.type !== 'real' || !analysis.eigenvectors) {
    return null;
  }

  const colors = ['#ef4444', '#10b981'];

  return (
    <>
      {analysis.eigenvectors.map((ev, i) => {
        const lambda = analysis.eigenvalues.values[i];
        const scale = Math.abs(lambda) * 1.5;
        
        return (
          <group key={i}>
            <VectorArrow
              start={[0, 0, 0]}
              end={[ev[0] * scale, ev[1] * scale, 0]}
              color={colors[i]}
              lineWidth={3}
            />
            <Text
              position={[ev[0] * scale * 1.2, ev[1] * scale * 1.2, 0.3]}
              fontSize={0.15}
              color={colors[i]}
            >
              λ{i + 1}={lambda.toFixed(2)}
            </Text>
          </group>
        );
      })}
    </>
  );
}

function AnimatedVectors({ matrix, t }) {
  const testVectors = useMemo(() => {
    return [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
      [0.5, 1],
    ];
  }, []);

  const At = useMemo(() => {
    return [
      [(1 - t) + t * matrix[0][0], t * matrix[0][1]],
      [t * matrix[1][0], (1 - t) + t * matrix[1][1]]
    ];
  }, [matrix, t]);

  return (
    <>
      {testVectors.map((v, i) => {
        const transformed = matmul(At, v);
        return (
          <group key={i}>
            {/* Original vector (faint) */}
            <VectorArrow
              start={[0, 0, 0]}
              end={[v[0], v[1], 0]}
              color="#cccccc"
              lineWidth={1}
            />
            {/* Transformed vector */}
            <VectorArrow
              start={[0, 0, 0]}
              end={[transformed[0], transformed[1], 0]}
              color="#f59e0b"
              lineWidth={2}
            />
          </group>
        );
      })}
    </>
  );
}

function Scene({ matrix, analysis, t }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      {/* Ground plane grid */}
      <Grid
        args={[10, 10]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#999999"
        sectionSize={1}
        sectionThickness={1}
        sectionColor="#666666"
        fadeDistance={30}
        fadeStrength={1}
        position={[0, 0, -0.01]}
      />

      {/* Axes */}
      <VectorArrow start={[0, 0, 0]} end={[3, 0, 0]} color="#ff0000" lineWidth={2} />
      <VectorArrow start={[0, 0, 0]} end={[0, 3, 0]} color="#00ff00" lineWidth={2} />
      <VectorArrow start={[0, 0, 0]} end={[0, 0, 3]} color="#0000ff" lineWidth={2} />
      
      <Text position={[3.2, 0, 0]} fontSize={0.2} color="#ff0000">X</Text>
      <Text position={[0, 3.2, 0]} fontSize={0.2} color="#00ff00">Y</Text>
      <Text position={[0, 0, 3.2]} fontSize={0.2} color="#0000ff">Z</Text>

      {/* Transformed grid */}
      <TransformedGrid matrix={matrix} t={t} />

      {/* Eigenvectors */}
      <EigenVectors analysis={analysis} />

      {/* Animated test vectors */}
      <AnimatedVectors matrix={matrix} t={t} />

      <OrbitControls makeDefault />
    </>
  );
}

export default function EigenSpace3D({ matrix, analysis }) {
  const [t, setT] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);

  React.useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setT((prev) => {
        const next = prev + 0.01 * speed;
        return next > 1 ? 0 : next;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="bg-indigo-50 p-3 rounded text-sm">
        <p className="font-semibold mb-1">3D Eigenspace Visualization</p>
        <p className="text-gray-700">
          The 2×2 matrix transforms vectors in the XY plane (Z=0).
          Eigenvectors appear as invariant directions (red/green).
          Rotate the view with mouse/trackpad to see the transformation from different angles.
        </p>
      </div>

      {/* 3D Canvas */}
      <div className="w-full border border-gray-300 rounded" style={{ height: '500px' }}>
        <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
          <Scene matrix={matrix} analysis={analysis} t={t} />
        </Canvas>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={() => setT(0)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Reset
          </button>
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium">t:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={t}
              onChange={(e) => setT(parseFloat(e.target.value))}
              className="w-48"
            />
            <span className="w-12">{t.toFixed(2)}</span>
          </label>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <label className="flex items-center gap-2">
            <span className="font-medium">Speed:</span>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-32"
            />
            <span className="w-8">{speed.toFixed(1)}×</span>
          </label>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
        <p>
          <strong>3D Perspective:</strong> While the matrix operates on 2D vectors, this 3D view provides
          spatial depth to better understand the geometric action. The Z-axis helps visualize the plane
          transformation.
        </p>
      </div>
    </div>
  );
}
