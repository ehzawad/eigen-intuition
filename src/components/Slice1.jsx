import React, { useState, useEffect, useRef } from 'react';
import { matmul, interpolateMatrix, generateLattice, length } from '../utils/matrix';
import { createTransform, drawArrow, drawAxes } from '../utils/useCanvas';

export default function Slice1({ matrix, analysis }) {
  const canvasRef = useRef(null);
  const [t, setT] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [density, setDensity] = useState(9);
  const [showEigen, setShowEigen] = useState(true);
  const [probeVector, setProbeVector] = useState([2, 1]);
  const [isDragging, setIsDragging] = useState(false);
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

    // Draw lattice vectors
    const lattice = generateLattice(density, [-3, 3]);
    lattice.forEach((v) => {
      const Av = matmul(At, v);
      const [sx, sy] = transform.toScreen(0, 0);
      const [ex, ey] = transform.toScreen(Av[0], Av[1]);
      
      // Clip very long vectors
      const len = length(Av);
      if (len > 10) return;
      
      drawArrow(ctx, sx, sy, ex, ey, '#999', 1);
    });

    // Draw eigenvectors (if real)
    if (showEigen && analysis.eigenvalues.type === 'real' && analysis.eigenvectors) {
      const colors = ['#3b82f6', '#ef4444'];
      const [ox, oy] = transform.toScreen(0, 0);
      
      analysis.eigenvectors.forEach((ev, i) => {
        const lambda = analysis.eigenvalues.values[i];
        const scale = Math.abs(lambda) * 2;
        const direction = lambda < 0 ? -1 : 1;
        
        // Draw ray in both directions
        for (let sign of [-1, 1]) {
          const [ex, ey] = transform.toScreen(
            ev[0] * scale * sign * direction,
            ev[1] * scale * sign * direction
          );
          
          ctx.strokeStyle = colors[i];
          ctx.lineWidth = 3;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
          
          // Add arrowhead for positive direction
          if (sign > 0) {
            const dx = ex - ox;
            const dy = ey - oy;
            const angle = Math.atan2(dy, dx);
            const headLen = 10;
            
            ctx.fillStyle = colors[i];
            ctx.beginPath();
            ctx.moveTo(ex, ey);
            ctx.lineTo(
              ex - headLen * Math.cos(angle - Math.PI / 6),
              ey - headLen * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
              ex - headLen * Math.cos(angle + Math.PI / 6),
              ey - headLen * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();
          }
        }
        
        // Label
        const [lx, ly] = transform.toScreen(ev[0] * scale * 1.2, ev[1] * scale * 1.2);
        ctx.fillStyle = colors[i];
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`λ${i + 1}=${lambda.toFixed(2)}`, lx + 5, ly - 5);
      });
    }

    // Draw probe vector
    const probeTransformed = matmul(At, probeVector);
    const [psx, psy] = transform.toScreen(0, 0);
    const [pex, pey] = transform.toScreen(probeTransformed[0], probeTransformed[1]);
    drawArrow(ctx, psx, psy, pex, pey, '#10b981', 2.5);

    // Draw original probe (faint)
    const [opex, opey] = transform.toScreen(probeVector[0], probeVector[1]);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#10b98144';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(psx, psy);
    ctx.lineTo(opex, opey);
    ctx.stroke();
    ctx.setLineDash([]);

  }, [matrix, t, density, showEigen, analysis, probeVector]);

  // Mouse interaction
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const transform = createTransform(rect.width, rect.height);
    const [wx, wy] = transform.toWorld(x, y);
    
    // Check if near probe vector
    const dx = wx - probeVector[0];
    const dy = wy - probeVector[1];
    if (Math.sqrt(dx * dx + dy * dy) < 0.5) {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const transform = createTransform(rect.width, rect.height);
    const [wx, wy] = transform.toWorld(x, y);
    
    setProbeVector([wx, wy]);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="bg-blue-50 p-3 rounded text-sm">
        <p className="font-semibold mb-1">Plane Vectors + Eigenvector Rays</p>
        <p className="text-gray-700">
          Generic vectors <span className="text-gray-500">(gray)</span> rotate and scale under A.
          Eigenvectors <span className="text-blue-600">(blue/red rays)</span> stay collinear—only scaling occurs.
          The probe vector <span className="text-green-600">(green)</span> is draggable.
        </p>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full border border-gray-300 rounded cursor-crosshair"
        style={{ height: '500px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Controls */}
      <div className="space-y-3">
        {/* Animation controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
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
              min="5"
              max="17"
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
              checked={showEigen}
              onChange={(e) => setShowEigen(e.target.checked)}
              className="rounded"
            />
            <span>Show eigenvector rays</span>
          </label>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
        <p>
          <strong>Interpolation:</strong> A(t) = (1−t)I + tA, where t={t.toFixed(2)}
        </p>
        <p>
          <strong>Insight:</strong> Eigenvectors don't rotate as t increases—they maintain direction.
        </p>
      </div>
    </div>
  );
}
