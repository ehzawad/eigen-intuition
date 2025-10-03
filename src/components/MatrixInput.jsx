import React from 'react';
import { PRESETS } from '../utils/matrix';

export default function MatrixInput({ matrix, onChange, analysis }) {
  const handleCellChange = (row, col, value) => {
    const newMatrix = matrix.map(r => [...r]);
    const num = parseFloat(value);
    if (!isNaN(num)) {
      newMatrix[row][col] = num;
      onChange(newMatrix);
    }
  };

  const loadPreset = (preset) => {
    onChange(preset);
  };

  const formatEigenvalue = (eig) => {
    if (eig.type === 'real') {
      return `λ₁ = ${eig.values[0].toFixed(3)}, λ₂ = ${eig.values[1].toFixed(3)}`;
    } else if (eig.type === 'complex') {
      const { re, im } = eig.values[0];
      return `λ = ${re.toFixed(3)} ± ${Math.abs(im).toFixed(3)}i (ρ=${eig.modulus.toFixed(3)}, θ=${(eig.angle * 180 / Math.PI).toFixed(1)}°)`;
    } else {
      return `λ = ${eig.values[0].toFixed(3)} (repeated)`;
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
      {/* Matrix Input */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">Matrix A</label>
        <div className="flex items-center gap-2">
          <span className="text-2xl">[</span>
          <div className="grid grid-cols-2 gap-2">
            {matrix.map((row, i) => (
              row.map((val, j) => (
                <input
                  key={`${i}-${j}`}
                  type="number"
                  step="0.1"
                  value={val.toFixed(2)}
                  onChange={(e) => handleCellChange(i, j, e.target.value)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ))
            ))}
          </div>
          <span className="text-2xl">]</span>
        </div>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">Presets</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => loadPreset(PRESETS.identity)}
            className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            Identity
          </button>
          <button
            onClick={() => loadPreset(PRESETS.diagonalStretch)}
            className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            Diagonal Stretch
          </button>
          <button
            onClick={() => loadPreset(PRESETS.shear)}
            className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            Shear
          </button>
          <button
            onClick={() => loadPreset(PRESETS.reflection)}
            className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            Reflection
          </button>
          <button
            onClick={() => loadPreset(PRESETS.saddle)}
            className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            Saddle
          </button>
          <button
            onClick={() => loadPreset(PRESETS.rotation30)}
            className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            Rotation 30°
          </button>
          <button
            onClick={() => loadPreset(PRESETS.rotation90)}
            className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            Rotation 90°
          </button>
          <button
            onClick={() => loadPreset(PRESETS.spiral)}
            className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            Spiral (Contracting)
          </button>
          <button
            onClick={() => loadPreset(PRESETS.expandingSpiral)}
            className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            Spiral (Expanding)
          </button>
        </div>
      </div>

      {/* Analysis Readout */}
      {analysis && (
        <div className="space-y-1 text-sm border-t pt-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold">Trace:</span> {analysis.trace.toFixed(3)}
            </div>
            <div>
              <span className="font-semibold">Det:</span> {analysis.determinant.toFixed(3)}
            </div>
          </div>
          <div>
            <span className="font-semibold">Discriminant Δ:</span> {analysis.eigenvalues.discriminant.toFixed(3)}
          </div>
          <div>
            <span className="font-semibold">Eigenvalues:</span> {formatEigenvalue(analysis.eigenvalues)}
          </div>
          <div>
            <span className="font-semibold">Classification:</span>{' '}
            <span className="text-blue-600 font-medium">{analysis.classification}</span>
          </div>
          {analysis.isDefective && (
            <div className="text-amber-600 text-xs italic">
              Warning: Defective - Only one eigenvector despite repeated eigenvalue
            </div>
          )}
        </div>
      )}
    </div>
  );
}
