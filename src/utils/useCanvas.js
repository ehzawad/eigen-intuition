import { useEffect, useRef } from 'react';

export function useCanvas(draw, dependencies = []) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Setup HiDPI canvas
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    contextRef.current = ctx;

    // Call draw function
    draw(ctx, rect.width, rect.height);
  }, dependencies);

  return canvasRef;
}

// World-to-screen coordinate transform
export function createTransform(width, height, worldBounds = [-4, 4, -4, 4]) {
  const [minX, maxX, minY, maxY] = worldBounds;
  const worldWidth = maxX - minX;
  const worldHeight = maxY - minY;
  
  const scale = Math.min(width / worldWidth, height / worldHeight) * 0.9;
  const centerX = width / 2;
  const centerY = height / 2;
  
  return {
    toScreen: (x, y) => [
      centerX + (x - (minX + maxX) / 2) * scale,
      centerY - (y - (minY + maxY) / 2) * scale
    ],
    toWorld: (sx, sy) => [
      (sx - centerX) / scale + (minX + maxX) / 2,
      -(sy - centerY) / scale + (minY + maxY) / 2
    ],
    scale
  };
}

// Drawing primitives
export function drawArrow(ctx, x1, y1, x2, y2, color = '#000', width = 1.5) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  if (len < 0.01) return;
  
  const headLen = Math.min(8, len * 0.3);
  const angle = Math.atan2(dy, dx);
  
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  
  // Line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  
  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLen * Math.cos(angle - Math.PI / 6),
    y2 - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    x2 - headLen * Math.cos(angle + Math.PI / 6),
    y2 - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

export function drawGrid(ctx, transform, spacing = 1, color = '#e0e0e0', width = 0.5) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  
  // Vertical lines
  for (let x = -10; x <= 10; x += spacing) {
    const [sx1, sy1] = transform.toScreen(x, -10);
    const [sx2, sy2] = transform.toScreen(x, 10);
    ctx.beginPath();
    ctx.moveTo(sx1, sy1);
    ctx.lineTo(sx2, sy2);
    ctx.stroke();
  }
  
  // Horizontal lines
  for (let y = -10; y <= 10; y += spacing) {
    const [sx1, sy1] = transform.toScreen(-10, y);
    const [sx2, sy2] = transform.toScreen(10, y);
    ctx.beginPath();
    ctx.moveTo(sx1, sy1);
    ctx.lineTo(sx2, sy2);
    ctx.stroke();
  }
}

export function drawAxes(ctx, transform) {
  const [ox, oy] = transform.toScreen(0, 0);
  const [x1, y1] = transform.toScreen(-10, 0);
  const [x2, y2] = transform.toScreen(10, 0);
  const [y1x, y1y] = transform.toScreen(0, -10);
  const [y2x, y2y] = transform.toScreen(0, 10);
  
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  
  // X-axis
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  
  // Y-axis
  ctx.beginPath();
  ctx.moveTo(y1x, y1y);
  ctx.lineTo(y2x, y2y);
  ctx.stroke();
}

export function drawCircle(ctx, x, y, radius, color, fill = false) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  if (fill) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.stroke();
  }
}
