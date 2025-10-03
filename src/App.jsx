import React, { useState, useEffect } from 'react';
import MatrixInput from './components/MatrixInput';
import Slice1 from './components/Slice1';
import Slice2 from './components/Slice2';
import Slice3 from './components/Slice3';
import Slice4 from './components/Slice4';
import Slice5 from './components/Slice5';
import { analyzeMatrix, PRESETS } from './utils/matrix';

function App() {
  const [matrix, setMatrix] = useState(PRESETS.diagonalStretch);
  const [activeTab, setActiveTab] = useState(0);
  
  const analysis = analyzeMatrix(matrix);

  const tabs = [
    { id: 0, name: 'Plane Vectors', component: Slice1, color: 'blue', preset: 'diagonalStretch' },
    { id: 1, name: 'Deformation Grid', component: Slice2, color: 'purple', preset: 'saddle' },
    { id: 2, name: 'Circle to Ellipse', component: Slice3, color: 'green', preset: 'diagonalStretch' },
    { id: 3, name: 'Complex Regime', component: Slice4, color: 'amber', preset: 'spiral' },
    { id: 4, name: 'Repeated/Defective', component: Slice5, color: 'red', preset: 'shear' }
  ];

  // Auto-select appropriate preset when tab changes
  useEffect(() => {
    const presetName = tabs[activeTab].preset;
    if (presetName && PRESETS[presetName]) {
      setMatrix(PRESETS[presetName]);
    }
  }, [activeTab]);

  const ActiveComponent = tabs[activeTab].component;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 px-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Eigenvalue & Eigenvector Intuition Builder</h1>
        <p className="text-blue-100 text-sm">
          Interactive geometric perspectives for 2×2 matrices · Build intuition through visualization
        </p>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel - Matrix Input */}
          <div className="lg:col-span-1">
            <MatrixInput 
              matrix={matrix} 
              onChange={setMatrix} 
              analysis={analysis}
            />
            
            {/* Quick navigation */}
            <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Quick Navigation</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <p><strong>Slice 1:</strong> See eigenvectors as invariant rays</p>
                <p><strong>Slice 2:</strong> Grid deformation & determinant</p>
                <p><strong>Slice 3:</strong> Circle to ellipse, eigen vs SVD axes</p>
                <p><strong>Slice 4:</strong> Complex eigenvalues and spirals</p>
                <p><strong>Slice 5:</strong> Repeated eigenvalue and Jordan behavior</p>
              </div>
            </div>

            {/* Keyboard shortcuts */}
            <div className="mt-4 bg-gray-50 p-3 rounded text-xs text-gray-600">
              <p className="font-semibold mb-2">Tips:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Use presets to explore different regimes</li>
                <li>Watch trace & discriminant to predict behavior</li>
                <li>Complex eigenvalues have no real eigenvectors</li>
                <li>Defective matrices show shear-like distortion</li>
              </ul>
            </div>
          </div>

          {/* Right panel - Interactive Canvas */}
          <div className="lg:col-span-2">
            {/* Tab navigation */}
            <div className="bg-white rounded-t-lg shadow-md border-b border-gray-200">
              <nav className="flex overflow-x-auto">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const colorClasses = {
                    blue: isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-blue-600',
                    purple: isActive ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-purple-600',
                    green: isActive ? 'border-green-600 text-green-600' : 'border-transparent text-gray-600 hover:text-green-600',
                    amber: isActive ? 'border-amber-600 text-amber-600' : 'border-transparent text-gray-600 hover:text-amber-600',
                    red: isActive ? 'border-red-600 text-red-600' : 'border-transparent text-gray-600 hover:text-red-600'
                  };
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${colorClasses[tab.color]}`}
                    >
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Canvas content */}
            <div className="bg-white rounded-b-lg shadow-md p-6">
              <ActiveComponent matrix={matrix} analysis={analysis} />
            </div>

            {/* Mathematical context */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Mathematical Context</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-semibold text-blue-600 mb-1">Eigenvalue Equation</h4>
                  <p className="text-xs">λ² − (tr A)λ + det A = 0</p>
                  <p className="text-xs mt-1">Discriminant: Δ = (tr A)² − 4 det A</p>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-600 mb-1">Eigenvector Equation</h4>
                  <p className="text-xs">(A − λI)v = 0</p>
                  <p className="text-xs mt-1">Finds directions preserved by A</p>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-600 mb-1">Classification</h4>
                  <p className="text-xs">Δ &gt; 0: two real eigenvalues</p>
                  <p className="text-xs">Δ = 0: repeated eigenvalue</p>
                  <p className="text-xs">Δ &lt; 0: complex conjugate pair</p>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-600 mb-1">Geometric Intuition</h4>
                  <p className="text-xs">Eigenvectors: invariant directions</p>
                  <p className="text-xs">Eigenvalues: scaling factors</p>
                  <p className="text-xs">Complex λ: rotation + scaling</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-4 px-8 mt-12 text-center text-sm">
        <p>
          Interactive eigenvalue visualization | Hand-rolled 2x2 linear algebra | Built with React + Canvas
        </p>
      </footer>
    </div>
  );
}

export default App;
