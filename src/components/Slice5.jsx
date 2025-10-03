import React, { useState, useEffect, useRef } from 'react';
import { matmul, interpolateMatrix, generateLattice, length } from '../utils/matrix';
import { createTransform, drawAxes, drawArrow } from '../utils/useCanvas';

export default function Slice5({ matrix, analysis }) {
  const canvasRef = useRef(null);
  const [t, setT] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [density, setDensity] = useState(11);
  const [showEigenline, setShowEigenline] = useState(true);
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
        const newT = prevT + delta * speed * 0.5;
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

    // Check if repeated eigenvalue
    const isRepeated = analysis.eigenvalues.type === 'repeated';
    const isDefective = analysis.isDefective;

    if (isRepeated) {
      const lambda = analysis.eigenvalues.values[0];
      const eigenvector = analysis.eigenvectors[0];
      
      // Draw eigenvector line
      if (showEigenline) {
        const [ox, oy] = transform.toScreen(0, 0);
        const scale = 5;
        
        for (let sign of [-1, 1]) {
          const [ex, ey] = transform.toScreen(
            eigenvector[0] * scale * sign,
            eigenvector[1] * scale * sign
          );
          
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        }
        
        // Label
        const [lx, ly] = transform.toScreen(eigenvector[0] * scale * 0.7, eigenvector[1] * scale * 0.7);
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`Eigenline (λ=${lambda.toFixed(2)})`, lx + 10, ly);
      }
      
      // Draw vector field
      const lattice = generateLattice(density, [-3, 3]);
      lattice.forEach((v) => {
        const Av = matmul(At, v);
        const [sx, sy] = transform.toScreen(0, 0);
        const [ex, ey] = transform.toScreen(Av[0], Av[1]);
        
        const len = length(Av);
        if (len > 10) return;
        
        // Color based on alignment with eigenvector
        const dot = v[0] * eigenvector[0] + v[1] * eigenvector[1];
        const vLen = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
        const alignment = Math.abs(dot / (vLen + 0.001));
        
        let color = '#999';
        if (alignment > 0.95) {
          // On eigenline
          color = '#3b82f6';
        } else if (isDefective) {
          // Show shearing behavior
          color = '#ef4444';
        }
        
        drawArrow(ctx, sx, sy, ex, ey, color, alignment > 0.95 ? 2 : 1);
      });

      // Info overlay
      const overlayWidth = 260;
      const overlayHeight = isDefective ? 140 : 100;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(10, 10, overlayWidth, overlayHeight);
      ctx.strokeStyle = isDefective ? '#ef4444' : '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, overlayWidth, overlayHeight);
      
      ctx.fillStyle = '#000';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('Repeated Eigenvalue', 20, 30);
      ctx.font = '12px sans-serif';
      ctx.fillText(`λ = ${lambda.toFixed(3)} (multiplicity 2)`, 20, 50);
      
      if (isDefective) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('DEFECTIVE (Jordan block)', 20, 72);
        ctx.fillStyle = '#000';
        ctx.font = '11px sans-serif';
        ctx.fillText('Only 1 eigenvector exists.', 20, 90);
        ctx.fillText('Vectors off the eigenline experience', 20, 105);
        ctx.fillText('shear-like distortion, not pure scaling.', 20, 120);
      } else {
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('Diagonalizable (A = λI)', 20, 72);
        ctx.fillStyle = '#000';
        ctx.font = '11px sans-serif';
        ctx.fillText('All vectors are eigenvectors.', 20, 90);
      }
      
      // Annotation for defective case
      if (isDefective) {
        const [ax, ay] = transform.toScreen(-1, 2);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'italic 11px sans-serif';
        ctx.fillText('Generic vectors rotate', ax, ay);
        ctx.fillText('despite repeated λ', ax + 5, ay + 15);
      }
      
    } else {
      // Not repeated - show message
      ctx.fillStyle = 'rgba(255, 200, 100, 0.95)';
      ctx.fillRect(width / 2 - 220, height / 2 - 60, 440, 120);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(width / 2 - 220, height / 2 - 60, 440, 120);
      
      ctx.fillStyle = '#000';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('This matrix does NOT have repeated eigenvalues', width / 2, height / 2 - 25);
      ctx.font = '13px sans-serif';
      ctx.fillText('Current eigenvalues: ' + 
        (analysis.eigenvalues.type === 'real' 
          ? `λ₁=${analysis.eigenvalues.values[0].toFixed(2)}, λ₂=${analysis.eigenvalues.values[1].toFixed(2)}`
          : 'complex pair'),
        width / 2, height / 2 + 5);
      ctx.fillText('Choose "Shear" preset to see defective behavior,', width / 2, height / 2 + 30);
      ctx.fillText('or modify the matrix to get tr²=4det.', width / 2, height / 2 + 50);
      ctx.textAlign = 'left';
    }

  }, [matrix, t, density, showEigenline, analysis]);

  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="bg-red-50 p-3 rounded text-sm">
        <p className="font-semibold mb-1">Repeated Eigenvalue & Defective Behavior</p>
        <p className="text-gray-700">
          When <strong>discriminant Δ = 0</strong>, eigenvalue λ is repeated.
          If <strong>defective</strong> (only one eigenvector), the matrix has a Jordan block: vectors on the
          eigenline <span className="text-blue-600">(blue)</span> scale, but generic vectors{' '}
          <span className="text-red-500">(red)</span> experience shear.
          If <strong>diagonalizable</strong> (A = λI), all vectors are eigenvectors.
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
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
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

        {/* Speed and density */}
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
            <span className="font-medium">Density:</span>
            <input
              type="range"
              min="7"
              max="15"
              step="2"
              value={density}
              onChange={(e) => setDensity(parseInt(e.target.value))}
              className="w-32"
            />
            <span className="w-8">{density}×{density}</span>
          </label>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showEigenline}
              onChange={(e) => setShowEigenline(e.target.checked)}
              className="rounded"
            />
            <span>Show eigenline</span>
          </label>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded space-y-1">
        <p>
          <strong>Defective matrices:</strong> Occur when geometric multiplicity &lt; algebraic multiplicity.
          For 2×2, repeated λ with one eigenvector → Jordan form [[λ, 1], [0, λ]].
        </p>
        <p>
          <strong>Shear example:</strong> [[1, 1], [0, 1]] has λ=1 (repeated), but only one eigenvector (1,0).
          Horizontal vectors stay horizontal; others tilt upward.
        </p>
        <p>
          <strong>Diagonalizable case:</strong> A = λI (scalar matrix) has all vectors as eigenvectors—pure uniform scaling.
        </p>
      </div>
    </div>
  );
}
