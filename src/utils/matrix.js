// 2×2 matrix operations with eigenvalue/eigenvector computations

const EPSILON = 1e-9;

// Matrix operations
export function matmul(A, v) {
  // A is [[a11, a12], [a21, a22]], v is [x, y]
  return [
    A[0][0] * v[0] + A[0][1] * v[1],
    A[1][0] * v[0] + A[1][1] * v[1]
  ];
}

export function trace(A) {
  return A[0][0] + A[1][1];
}

export function det(A) {
  return A[0][0] * A[1][1] - A[0][1] * A[1][0];
}

export function interpolateMatrix(A, t) {
  // Linear interpolation: (1-t)I + tA
  const I = [[1, 0], [0, 1]];
  return [
    [(1 - t) * I[0][0] + t * A[0][0], (1 - t) * I[0][1] + t * A[0][1]],
    [(1 - t) * I[1][0] + t * A[1][0], (1 - t) * I[1][1] + t * A[1][1]]
  ];
}

export function normalize(v) {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
  if (len < EPSILON) return [1, 0];
  return [v[0] / len, v[1] / len];
}

export function length(v) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

// Eigenvalue computation
export function eigenvalues(A) {
  const tr = trace(A);
  const d = det(A);
  const discriminant = tr * tr - 4 * d;
  
  if (Math.abs(discriminant) < EPSILON) {
    // Repeated eigenvalue
    const lambda = tr / 2;
    return {
      type: 'repeated',
      values: [lambda, lambda],
      discriminant: 0
    };
  } else if (discriminant > 0) {
    // Two distinct real eigenvalues
    const sqrtDisc = Math.sqrt(discriminant);
    const lambda1 = (tr + sqrtDisc) / 2;
    const lambda2 = (tr - sqrtDisc) / 2;
    return {
      type: 'real',
      values: [lambda1, lambda2],
      discriminant
    };
  } else {
    // Complex conjugate pair
    const real = tr / 2;
    const imag = Math.sqrt(-discriminant) / 2;
    const modulus = Math.sqrt(real * real + imag * imag);
    const angle = Math.atan2(imag, real);
    return {
      type: 'complex',
      values: [
        { re: real, im: imag },
        { re: real, im: -imag }
      ],
      modulus,
      angle,
      discriminant
    };
  }
}

// Eigenvector computation for real eigenvalues
export function eigenvector(A, lambda) {
  // Solve (A - λI)v = 0
  const B = [
    [A[0][0] - lambda, A[0][1]],
    [A[1][0], A[1][1] - lambda]
  ];
  
  // Find a non-zero vector in the nullspace
  // Try [-B[0][1], B[0][0]] first (perpendicular to first row)
  let v = [-B[0][1], B[0][0]];
  if (Math.abs(v[0]) < EPSILON && Math.abs(v[1]) < EPSILON) {
    // First row is zero, try second row
    v = [-B[1][1], B[1][0]];
  }
  
  // Check if this is actually an eigenvector
  const Av = matmul(A, v);
  const lambdaV = [lambda * v[0], lambda * v[1]];
  const error = Math.sqrt(
    (Av[0] - lambdaV[0]) ** 2 + (Av[1] - lambdaV[1]) ** 2
  );
  
  if (error > 0.1 * Math.abs(lambda)) {
    // Try alternative approach
    v = [-B[1][1], B[1][0]];
  }
  
  return normalize(v);
}

// Check if matrix is defective (repeated eigenvalue with only one eigenvector)
export function isDefective(A) {
  const eigs = eigenvalues(A);
  if (eigs.type !== 'repeated') return false;
  
  const lambda = eigs.values[0];
  const v = eigenvector(A, lambda);
  
  // Check if geometric multiplicity is 1
  // For a 2×2 matrix, if A = λI, then it's not defective
  const diff = Math.abs(A[0][0] - lambda) + Math.abs(A[1][1] - lambda) + 
               Math.abs(A[0][1]) + Math.abs(A[1][0]);
  
  return diff > EPSILON;
}

// Full eigenstructure analysis
export function analyzeMatrix(A) {
  const tr = trace(A);
  const d = det(A);
  const eigs = eigenvalues(A);
  
  let classification = '';
  let eigenvectors = null;
  
  if (eigs.type === 'real') {
    const [lambda1, lambda2] = eigs.values;
    eigenvectors = [
      eigenvector(A, lambda1),
      eigenvector(A, lambda2)
    ];
    
    if (lambda1 * lambda2 < 0) {
      classification = 'Saddle';
    } else if (Math.abs(lambda1) < 1 && Math.abs(lambda2) < 1) {
      classification = 'Stable Node';
    } else if (Math.abs(lambda1) > 1 && Math.abs(lambda2) > 1) {
      classification = 'Unstable Node';
    } else {
      classification = 'Node';
    }
  } else if (eigs.type === 'complex') {
    const { modulus, angle } = eigs;
    if (Math.abs(modulus - 1) < EPSILON) {
      classification = 'Center (Rotation)';
    } else if (modulus < 1) {
      classification = 'Stable Spiral';
    } else {
      classification = 'Unstable Spiral';
    }
  } else {
    // repeated
    const defective = isDefective(A);
    eigenvectors = [eigenvector(A, eigs.values[0])];
    if (defective) {
      classification = 'Defective (Shear-like)';
    } else {
      classification = 'Repeated Eigenvalue (Scaling)';
    }
  }
  
  return {
    trace: tr,
    determinant: d,
    eigenvalues: eigs,
    eigenvectors,
    classification,
    isDefective: eigs.type === 'repeated' && isDefective(A)
  };
}

// SVD for 2×2 (simplified, only singular values and vectors)
export function svd2x2(A) {
  // Compute A^T A
  const ATA = [
    [
      A[0][0] * A[0][0] + A[1][0] * A[1][0],
      A[0][0] * A[0][1] + A[1][0] * A[1][1]
    ],
    [
      A[0][1] * A[0][0] + A[1][1] * A[1][0],
      A[0][1] * A[0][1] + A[1][1] * A[1][1]
    ]
  ];
  
  // Eigenvalues of A^T A give squared singular values
  const eigs = eigenvalues(ATA);
  
  if (eigs.type !== 'real') {
    // This shouldn't happen for A^T A, but handle gracefully
    return null;
  }
  
  const [lambda1, lambda2] = eigs.values;
  const sigma1 = Math.sqrt(Math.max(0, lambda1));
  const sigma2 = Math.sqrt(Math.max(0, lambda2));
  
  // Right singular vectors (eigenvectors of A^T A)
  const v1 = eigenvector(ATA, lambda1);
  const v2 = eigenvector(ATA, lambda2);
  
  return {
    singularValues: [sigma1, sigma2],
    rightVectors: [v1, v2]
  };
}

// Classify matrix regime based on trace-determinant
export function classifyRegime(tr, det) {
  const disc = tr * tr - 4 * det;
  
  if (Math.abs(disc) < EPSILON) {
    return 'repeated';
  } else if (disc > 0) {
    return 'two-real';
  } else {
    return 'complex';
  }
}

// Generate sample vectors on a lattice
export function generateLattice(density, bounds) {
  const vectors = [];
  const step = (bounds[1] - bounds[0]) / (density - 1);
  
  for (let i = 0; i < density; i++) {
    for (let j = 0; j < density; j++) {
      const x = bounds[0] + i * step;
      const y = bounds[0] + j * step;
      if (Math.abs(x) > EPSILON || Math.abs(y) > EPSILON) {
        vectors.push([x, y]);
      }
    }
  }
  
  return vectors;
}

// Presets
export const PRESETS = {
  identity: [[1, 0], [0, 1]],
  diagonalStretch: [[2, 0], [0, 0.5]],
  shear: [[1, 1], [0, 1]],
  reflection: [[-1, 0], [0, 1]],
  saddle: [[2, 0], [0, -0.5]],
  rotation30: [
    [Math.cos(Math.PI / 6), -Math.sin(Math.PI / 6)],
    [Math.sin(Math.PI / 6), Math.cos(Math.PI / 6)]
  ],
  rotation90: [[0, -1], [1, 0]],
  spiral: [
    [0.9 * Math.cos(0.3), -0.9 * Math.sin(0.3)],
    [0.9 * Math.sin(0.3), 0.9 * Math.cos(0.3)]
  ],
  expandingSpiral: [
    [1.1 * Math.cos(0.3), -1.1 * Math.sin(0.3)],
    [1.1 * Math.sin(0.3), 1.1 * Math.cos(0.3)]
  ],
  defectiveShear: [[1, 1], [0, 1]]
};
