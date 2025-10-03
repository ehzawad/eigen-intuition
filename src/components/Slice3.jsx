import React, { useState, useEffect, useRef } from 'react';
import { matmul, interpolateMatrix, svd2x2 } from '../utils/matrix';
import { createTransform, drawAxes } from '../utils/useCanvas';

export default function Slice3({ matrix, analysis }) {
  const canvasRef = useRef(null);
  const [t, setT] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showEigen, setShowEigen] = useState(true);
  const [showSVD, setShowSVD] = useState(true);
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

    // Draw original unit circle (faint)
    const numPoints = 100;
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const x = Math.cos(angle);
      const y = Math.sin(angle);
      const [sx, sy] = transform.toScreen(x, y);
      if (i === 0) {
        ctx.moveTo(sx, sy);
      } else {
        ctx.lineTo(sx, sy);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw transformed ellipse
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const x = Math.cos(angle);
      const y = Math.sin(angle);
      const v = matmul(At, [x, y]);
      const [sx, sy] = transform.toScreen(v[0], v[1]);
      
      // Clip very large ellipses
      if (Math.abs(v[0]) > 15 || Math.abs(v[1]) > 15) continue;
      
      if (i === 0) {
        ctx.moveTo(sx, sy);
      } else {
        ctx.lineTo(sx, sy);
      }
    }
    ctx.stroke();

    // Draw eigenvector axes (if real)
    if (showEigen && analysis.eigenvalues.type === 'real' && analysis.eigenvectors) {
      const colors = ['#3b82f6', '#ef4444'];
      const [ox, oy] = transform.toScreen(0, 0);
      
      analysis.eigenvectors.forEach((ev, i) => {
        const lambda = analysis.eigenvalues.values[i];
        const scale = Math.abs(lambda);
        
        // Draw axis
        for (let sign of [-1, 1]) {
          const [ex, ey] = transform.toScreen(
            ev[0] * scale * sign,
            ev[1] * scale * sign
          );
          
          ctx.strokeStyle = colors[i];
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
          
          // Arrowhead
          if (sign > 0) {
            const dx = ex - ox;
            const dy = ey - oy;
            const angle = Math.atan2(dy, dx);
            const headLen = 8;
            
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
        const [lx, ly] = transform.toScreen(ev[0] * scale * 1.3, ev[1] * scale * 1.3);
        ctx.fillStyle = colors[i];
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`eigen-axis ${i + 1}`, lx + 5, ly - 5);
      });
    }

    // Draw SVD principal axes
    if (showSVD) {
      const svdResult = svd2x2(At);
      if (svdResult) {
        const { singularValues, rightVectors } = svdResult;
        const svdColors = ['#10b981', '#f59e0b'];
        const [ox, oy] = transform.toScreen(0, 0);
        
        rightVectors.forEach((rv, i) => {
          const sigma = singularValues[i];
          
          // Draw axis
          for (let sign of [-1, 1]) {
            const [ex, ey] = transform.toScreen(
              rv[0] * sigma * sign,
              rv[1] * sigma * sign
            );
            
            ctx.strokeStyle = svdColors[i];
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(ox, oy);
            ctx.lineTo(ex, ey);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Arrowhead
            if (sign > 0) {
              const dx = ex - ox;
              const dy = ey - oy;
              const angle = Math.atan2(dy, dx);
              const headLen = 7;
              
              ctx.fillStyle = svdColors[i];
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
          const [lx, ly] = transform.toScreen(rv[0] * sigma * 1.3, rv[1] * sigma * 1.3);
          ctx.fillStyle = svdColors[i];
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(`SVD-axis ${i + 1} (σ=${sigma.toFixed(2)})`, lx + 5, ly + 15);
        });
      }
    }

  }, [matrix, t, showEigen, showSVD, analysis]);

  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="bg-green-50 p-3 rounded text-sm">
        <p className="font-semibold mb-1">Unit Circle → Ellipse</p>
        <p className="text-gray-700">
          The unit circle <span className="text-gray-400">(gray dashed)</span> maps to an ellipse{' '}
          <span className="text-blue-600">(blue)</span>.
          <strong> Eigenvectors</strong> <span className="text-blue-600">(blue/red solid)</span> are invariant
          directions (when real).
          <strong> SVD axes</strong> <span className="text-green-600">(green/amber dashed)</span> show principal
          stretch directions—these differ from eigenvectors unless A is symmetric.
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
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
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

        {/* Speed */}
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

        {/* Toggles */}
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showEigen}
              onChange={(e) => setShowEigen(e.target.checked)}
              className="rounded"
            />
            <span>Show eigenvector axes</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showSVD}
              onChange={(e) => setShowSVD(e.target.checked)}
              className="rounded"
            />
            <span>Show SVD principal axes</span>
          </label>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded space-y-1">
        <p>
          <strong>Eigenvectors vs SVD:</strong> For symmetric A, they coincide. Otherwise, eigenvectors show
          invariant directions (A·v = λv), while SVD axes show maximal/minimal stretch of the unit circle.
        </p>
        <p>
          <strong>Complex eigenvalues:</strong> When eigenvalues are complex, no real eigenvector axes exist—only
          the SVD principal axes are shown.
        </p>
      </div>
    </div>
  );
}
