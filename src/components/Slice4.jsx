import React, { useState, useEffect, useRef } from 'react';
import { matmul, interpolateMatrix } from '../utils/matrix';
import { createTransform, drawAxes } from '../utils/useCanvas';

export default function Slice4({ matrix, analysis }) {
  const canvasRef = useRef(null);
  const [t, setT] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [numOrbits, setNumOrbits] = useState(12);
  const [showAngleArc, setShowAngleArc] = useState(true);
  const animationRef = useRef(null);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;

    let lastTime = Date.now();
    const animate = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      setT((prevT) => {
        const newT = prevT + delta * speed * 0.3;
        return newT > 1 ? 0 : newT;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, speed]);

  // Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const transform = createTransform(width, height);

    // Clear
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, width, height);

    // Draw axes
    drawAxes(ctx, transform);

    // Current matrix
    const At = interpolateMatrix(matrix, t);

    // Check if we have complex eigenvalues
    const isComplex = analysis.eigenvalues.type === 'complex';

    if (isComplex) {
      const { modulus, angle } = analysis.eigenvalues;
      
      // Draw orbits (spiral trajectories)
      const angles = [];
      for (let i = 0; i < numOrbits; i++) {
        angles.push((i / numOrbits) * 2 * Math.PI);
      }
      
      angles.forEach((startAngle, idx) => {
        const radius = 1.5 + (idx % 3) * 0.5;
        const startX = radius * Math.cos(startAngle);
        const startY = radius * Math.sin(startAngle);
        
        // Compute orbit by repeatedly applying matrix
        const maxSteps = 30;
        const points = [[startX, startY]];
        let current = [startX, startY];
        
        for (let step = 0; step < maxSteps; step++) {
          current = matmul(At, current);
          points.push([...current]);
          
          // Stop if too large or too small
          const len = Math.sqrt(current[0] ** 2 + current[1] ** 2);
          if (len > 10 || len < 0.01) break;
        }
        
        // Draw spiral
        const hue = (idx / numOrbits) * 360;
        ctx.strokeStyle = `hsl(${hue}, 70%, 50%)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        
        points.forEach((p, i) => {
          const [sx, sy] = transform.toScreen(p[0], p[1]);
          if (i === 0) {
            ctx.moveTo(sx, sy);
          } else {
            ctx.lineTo(sx, sy);
          }
        });
        ctx.stroke();
        
        // Mark start point
        const [sx0, sy0] = transform.toScreen(points[0][0], points[0][1]);
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        ctx.beginPath();
        ctx.arc(sx0, sy0, 3, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Draw angle arc visualization
      if (showAngleArc) {
        const [ox, oy] = transform.toScreen(0, 0);
        const arcRadius = 50;
        
        // Reference direction
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + arcRadius, oy);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Rotated direction
        const rotAngle = -angle; // Negate for screen coords
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(
          ox + arcRadius * Math.cos(rotAngle),
          oy + arcRadius * Math.sin(rotAngle)
        );
        ctx.stroke();
        
        // Arc
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ox, oy, arcRadius * 0.7, 0, -rotAngle, rotAngle < 0);
        ctx.stroke();
        
        // Labels
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`θ = ${(angle * 180 / Math.PI).toFixed(1)}°`, ox + arcRadius * 0.4, oy - 10);
      }

      // Info overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(10, 10, 240, 90);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 240, 90);
      
      ctx.fillStyle = '#000';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('Complex Eigenvalues', 20, 30);
      ctx.font = '12px sans-serif';
      ctx.fillText(`λ = ${analysis.eigenvalues.values[0].re.toFixed(3)} ± ${Math.abs(analysis.eigenvalues.values[0].im).toFixed(3)}i`, 20, 50);
      ctx.fillText(`Modulus ρ = ${modulus.toFixed(3)}`, 20, 68);
      ctx.fillText(`Angle θ = ${(angle * 180 / Math.PI).toFixed(1)}°`, 20, 86);
      
      // No real eigenvector message
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 14px sans-serif';
      const [cx, cy] = transform.toScreen(0, -3.2);
      ctx.fillText('No real eigenvectors exist', cx - 100, cy);
      ctx.font = '11px sans-serif';
      ctx.fillText('Motion is rotation–scaling (spiral)', cx - 90, cy + 15);
      
    } else {
      // Not complex - show message
      ctx.fillStyle = 'rgba(255, 200, 100, 0.95)';
      ctx.fillRect(width / 2 - 200, height / 2 - 50, 400, 100);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(width / 2 - 200, height / 2 - 50, 400, 100);
      
      ctx.fillStyle = '#000';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('This matrix has REAL eigenvalues', width / 2, height / 2 - 15);
      ctx.font = '13px sans-serif';
      ctx.fillText('Choose a preset like "Spiral" or "Rotation 90°"', width / 2, height / 2 + 10);
      ctx.fillText('to see complex eigenvalue behavior.', width / 2, height / 2 + 30);
      ctx.textAlign = 'left';
    }

  }, [matrix, t, numOrbits, showAngleArc, analysis]);

  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="bg-amber-50 p-3 rounded text-sm">
        <p className="font-semibold mb-1">Complex Eigenvalue Regime (Rotation–Scaling)</p>
        <p className="text-gray-700">
          When <strong>discriminant Δ &lt; 0</strong>, eigenvalues are a complex conjugate pair.
          There are <strong>no real invariant directions</strong>; every trajectory spirals.
          The complex pair encodes <strong>rotation angle θ</strong> and <strong>scaling factor ρ</strong> (modulus).
        </p>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full border border-gray-300 rounded"
        style={{ height: '500px' }}
      />

      {/* Controls */}
      <div className="space-y-3">
        {/* Animation controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 font-medium"
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

        {/* Speed and orbits */}
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
          <label className="flex items-center gap-2">
            <span className="font-medium">Orbits:</span>
            <input
              type="range"
              min="6"
              max="24"
              step="3"
              value={numOrbits}
              onChange={(e) => setNumOrbits(parseInt(e.target.value))}
              className="w-32"
            />
            <span className="w-8">{numOrbits}</span>
          </label>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showAngleArc}
              onChange={(e) => setShowAngleArc(e.target.checked)}
              className="rounded"
            />
            <span>Show rotation angle</span>
          </label>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded space-y-1">
        <p>
          <strong>Complex eigenvalues:</strong> λ = α ± βi. Modulus ρ = √(α² + β²) controls expansion/contraction;
          angle θ = arctan(β/α) controls rotation per application.
        </p>
        <p>
          <strong>Spirals:</strong> ρ &lt; 1 → stable spiral (inward); ρ &gt; 1 → unstable spiral (outward);
          ρ = 1 → center (pure rotation).
        </p>
        <p>
          <strong>No collinear vectors:</strong> Unlike real eigenvalue cases, no direction stays on its line—every
          vector rotates.
        </p>
      </div>
    </div>
  );
}
