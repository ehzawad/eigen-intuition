# Eigenvalue & Eigenvector Intuition Builder

Interactive geometric visualizations for building intuition about eigenvalues and eigenvectors of real 2×2 matrices.

## Overview

This project provides six focused interactive canvases that progressively build understanding of eigenstructure through direct geometric visualization. Each perspective demonstrates one key insight with minimal UI and crisp visuals.

## Features

### Six Interactive Perspectives

1. **Vector Field**
   - Visualize how generic vectors rotate and scale under linear transformation
   - Eigenvectors appear as invariant rays (colored) that only scale, never rotate
   - Draggable probe vector for exploration

2. **Grid Transform**
   - Watch a square grid transform under matrix A
   - Determinant controls area scaling and orientation
   - Eigenvector lines remain invariant under transformation

3. **Circle to Ellipse**
   - Unit circle maps to an ellipse under A
   - Compare eigenvectors (invariant directions) vs SVD axes (principal stretch)
   - Understand the distinction between eigen and singular decompositions

4. **Spiral Motion**
   - When discriminant Δ < 0, no real eigenvectors exist
   - Trajectories spiral (rotation + scaling)
   - Visualize modulus ρ (scale factor) and angle θ (rotation)

5. **Jordan Form**
   - Repeated eigenvalue (Δ = 0) can be diagonalizable or defective
   - Defective matrices show Jordan block behavior: shear along eigenline
   - Contrast with scalar matrices (all vectors are eigenvectors)

6. **3D View**
   - Interactive 3D visualization with orbital camera controls
   - Matrix transforms vectors in the XY plane with Z-axis for spatial depth
   - Eigenvectors rendered as 3D arrows
   - Animated grid deformation in 3D space

## Mathematical Foundation

- **Eigenvalue equation**: λ² − (tr A)λ + det A = 0
- **Discriminant**: Δ = (tr A)² − 4 det A
  - Δ > 0: two real eigenvalues
  - Δ = 0: repeated eigenvalue
  - Δ < 0: complex conjugate pair
- **Eigenvectors**: Solutions to (A − λI)v = 0
- All computations use hand-rolled 2×2 linear algebra (no heavy dependencies)

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Canvas API** - 2D visualizations with HiDPI-aware rendering
- **Three.js + React Three Fiber** - 3D visualization engine
- **React Three Drei** - Helpers for Three.js (OrbitControls, Grid, etc.)
- **Hand-rolled linear algebra** - Pure JavaScript 2×2 matrix operations

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will open automatically at `http://localhost:3000`.

## Usage

1. **Select a tab** to switch between the five perspectives
2. **Use presets** to quickly load interesting matrices (diagonal stretch, shear, saddle, spiral, etc.)
3. **Adjust matrix entries** manually for custom exploration
4. **Play/pause animation** to watch the interpolation from identity I to matrix A
5. **Read the analysis panel** for trace, determinant, discriminant, eigenvalues, and classification

Each slice automatically loads an appropriate preset when activated.

## Key Insights

- **Eigenvectors** are the rare directions that don't rotate under A—they only scale
- **Complex eigenvalues** mean no real invariant directions exist; motion is a spiral
- **Determinant** encodes area scaling; negative det means orientation reversal
- **Defective matrices** (repeated λ with one eigenvector) exhibit shear behavior
- **SVD axes** differ from eigenvectors unless A is symmetric

## Performance

- Optimized for 60fps with requestAnimationFrame
- HiDPI-aware canvas rendering (devicePixelRatio scaling)
- Vector field clipping for large transformations
- Minimal allocations per frame

## Educational Goals

Users should be able to:
- Point to eigenvector rays and explain they don't rotate, only scale
- Predict behavior from trace/determinant readouts
- Recognize when eigenvalues are complex by absence of invariant rays
- Understand defective matrices through visual shear effects

## License

MIT

## Deployment to GitHub

```bash
# Create repository on GitHub, then:
git remote add origin https://github.com/ehzawad/eigen-intuition.git
git branch -M main
git push -u origin main
```

For GitHub Pages deployment, add to vite.config.js:
```javascript
export default defineConfig({
  base: '/eigen-intuition/',
  // ... rest of config
});
```

Then build and deploy:
```bash
npm run build
# Deploy the dist/ folder to gh-pages branch
```

## Contributing

Pull requests welcome. For major changes, please open an issue first to discuss proposed modifications.
