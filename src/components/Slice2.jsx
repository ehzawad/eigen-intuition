import React, { useState, useEffect, useRef } from 'react';
import { matmul, interpolateMatrix } from '../utils/matrix';
import { createTransform, drawAxes } from '../utils/useCanvas';

export default function Slice2({ matrix, analysis }) {
  const canvasRef = useRef(null);
  const [t, setT] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [gridDensity, setGridDensity] = useState(20);
  const [showOriginal, setShowOriginal] = useState(true);
  const [colorByArea, setColorByArea] = useState(true);
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
    const det = At[0][0] * At[1][1] - At[0][1] * At[1][0];

    // Draw original grid (faint)
    if (showOriginal) {
      ctx.strokeStyle = '#d0d0d0';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 3]);
      
      const gridRange = 4;
      const step = gridRange * 2 / gridDensity;
      
      // Vertical lines
      for (let i = 0; i <= gridDensity; i++) {
        const x = -gridRange + i * step;
        const [sx1, sy1] = transform.toScreen(x, -gridRange);
        const [sx2, sy2] = transform.toScreen(x, gridRange);
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();
      }
      
      // Horizontal lines
      for (let i = 0; i <= gridDensity; i++) {
        const y = -gridRange + i * step;
        const [sx1, sy1] = transform.toScreen(-gridRange, y);
        const [sx2, sy2] = transform.toScreen(gridRange, y);
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();
      }
      
      ctx.setLineDash([]);
    }

    // Draw transformed grid
    const gridRange = 4;
    const step = gridRange * 2 / gridDensity;
    
    // Determine color based on determinant
    let strokeColor = '#333';
    if (colorByArea) {
      if (det > 1.5) {
        strokeColor = '#ef4444'; // Expanding
      } else if (det < -0.1) {
        strokeColor = '#8b5cf6'; // Reflecting
      } else if (Math.abs(det) < 0.3) {
        strokeColor = '#f59e0b'; // Near-singular
      } else {
        strokeColor = '#3b82f6'; // Normal
      }
    }
    
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    
    // Vertical lines (transform constant-x lines)
    for (let i = 0; i <= gridDensity; i++) {
      const x = -gridRange + i * step;
      ctx.beginPath();
      
      for (let j = 0; j <= gridDensity * 2; j++) {
        const y = -gridRange + j * step / 2;
        const v = matmul(At, [x, y]);
        const [sx, sy] = transform.toScreen(v[0], v[1]);
        
        // Clip to reasonable bounds
        if (Math.abs(v[0]) > 20 || Math.abs(v[1]) > 20) continue;
        
        if (j === 0) {
          ctx.moveTo(sx, sy);
        } else {
          ctx.lineTo(sx, sy);
        }
      }
      ctx.stroke();
    }
    
    // Horizontal lines (transform constant-y lines)
    for (let i = 0; i <= gridDensity; i++) {
      const y = -gridRange + i * step;
      ctx.beginPath();
      
      for (let j = 0; j <= gridDensity * 2; j++) {
        const x = -gridRange + j * step / 2;
        const v = matmul(At, [x, y]);
        const [sx, sy] = transform.toScreen(v[0], v[1]);
        
        // Clip to reasonable bounds
        if (Math.abs(v[0]) > 20 || Math.abs(v[1]) > 20) continue;
        
        if (j === 0) {
          ctx.moveTo(sx, sy);
        } else {
          ctx.lineTo(sx, sy);
        }
      }
      ctx.stroke();
    }

    // Draw eigenvector lines if real
    if (analysis.eigenvalues.type === 'real' && analysis.eigenvectors) {
      const colors = ['#3b82f6', '#ef4444'];
      
      analysis.eigenvectors.forEach((ev, i) => {
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        
        const [s1x, s1y] = transform.toScreen(-5 * ev[0], -5 * ev[1]);
        const [s2x, s2y] = transform.toScreen(5 * ev[0], 5 * ev[1]);
        
        ctx.beginPath();
        ctx.moveTo(s1x, s1y);
        ctx.lineTo(s2x, s2y);
        ctx.stroke();
        
        // Label
        const lambda = analysis.eigenvalues.values[i];
        ctx.fillStyle = colors[i];
        ctx.font = 'bold 11px sans-serif';
        ctx.setLineDash([]);
        ctx.fillText(`λ${i + 1}=${lambda.toFixed(2)}`, s2x + 5, s2y - 5);
      });
      
      ctx.setLineDash([]);
    }

    // Determinant visualization
    const detSign = det > 0 ? '+' : det < 0 ? '−' : '0';
    const detColor = det > 0 ? '#10b981' : det < 0 ? '#8b5cf6' : '#f59e0b';
    
    ctx.fillStyle = detColor;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`det = ${det.toFixed(3)} (${detSign})`, 20, 30);
    
    // Area factor
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText(`Area factor: ${Math.abs(det).toFixed(2)}×`, 20, 52);

  }, [matrix, t, gridDensity, showOriginal, colorByArea, analysis]);

  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="bg-purple-50 p-3 rounded text-sm">
        <p className="font-semibold mb-1">Deformation Grid</p>
        <p className="text-gray-700">
          A square grid is transformed by A. The <strong>determinant</strong> controls area scaling.
          Eigenvector lines <span className="text-blue-600">(blue/red dashed)</span> remain invariant under A.
          Colors encode magnitude/sign of det: <span className="text-red-500">expanding</span>,{' '}
          <span className="text-purple-600">reflecting</span>, <span className="text-amber-500">near-singular</span>.
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
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-medium"
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
            <span className="font-medium">Grid lines:</span>
            <input
              type="range"
              min="10"
              max="40"
              step="5"
              value={gridDensity}
              onChange={(e) => setGridDensity(parseInt(e.target.value))}
              className="w-32"
            />
            <span className="w-8">{gridDensity}</span>
          </label>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOriginal}
              onChange={(e) => setShowOriginal(e.target.checked)}
              className="rounded"
            />
            <span>Show original grid</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={colorByArea}
              onChange={(e) => setColorByArea(e.target.checked)}
              className="rounded"
            />
            <span>Color by area change</span>
          </label>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
        <p>
          <strong>Determinant meaning:</strong> |det A| = area scaling factor; det A &lt; 0 means orientation reversal.
        </p>
        <p>
          <strong>Invariant lines:</strong> Eigenvector directions (when real) remain unchanged; grid lines along these
          directions only stretch/compress.
        </p>
      </div>
    </div>
  );
}
