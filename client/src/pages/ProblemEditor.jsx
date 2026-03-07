import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProblem } from '../context/ProblemContext';
import Alert from '../components/common/Alert';

const ProblemEditor = () => {
  const { problemId } = useParams();
  const { currentProblem, loadProblem, loading } = useProblem();
  const [activeTab, setActiveTab] = useState('definition');
  const [error, setError] = useState('');

  useEffect(() => {
    if (problemId) {
      loadProblem(problemId).catch(err => {
        setError('Failed to load problem');
      });
    }
  }, [problemId]);

  const tabs = [
    { id: 'definition', label: 'Problem Definition', icon: '📝' },
    { id: 'criteria', label: 'Criteria', icon: '📊' },
    { id: 'alternatives', label: 'Alternatives', icon: '🎯' },
    { id: 'comparisons', label: 'Comparisons', icon: '⚖️' },
    { id: 'results', label: 'Results', icon: '📈' },
    { id: 'sensitivity', label: 'Sensitivity', icon: '🔍' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nyu-violet mx-auto"></div>
          <p className="mt-4 text-nyu-text-secondary">Loading problem...</p>
        </div>
      </div>
    );
  }

  if (!currentProblem && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert type="error" message="Problem not found" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-nyu-text-primary mb-2">
          {currentProblem?.title || 'Untitled Problem'}
        </h2>
        {currentProblem?.description && (
          <p className="text-nyu-text-secondary">{currentProblem.description}</p>
        )}
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-nyu-violet text-white border-b-2 border-nyu-violet'
                  : 'text-nyu-text-secondary hover:bg-nyu-violet-ultra'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="card min-h-[500px]">
        {activeTab === 'definition' && (
          <div>
            <h3 className="text-xl font-semibold text-nyu-text-primary mb-4">
              Problem Definition
            </h3>
            <p className="text-nyu-text-secondary">
              Define your decision goal and problem statement.
            </p>
            {/* Problem definition form will go here */}
          </div>
        )}

        {activeTab === 'criteria' && (
          <div>
            <h3 className="text-xl font-semibold text-nyu-text-primary mb-4">
              Criteria Management
            </h3>
            <p className="text-nyu-text-secondary">
              Add and organize your decision criteria (up to {10} criteria).
            </p>
            {/* Criteria management will go here */}
          </div>
        )}

        {activeTab === 'alternatives' && (
          <div>
            <h3 className="text-xl font-semibold text-nyu-text-primary mb-4">
              Alternatives Management
            </h3>
            <p className="text-nyu-text-secondary">
              Define the alternatives you're evaluating (up to {12} alternatives).
            </p>
            {/* Alternatives management will go here */}
          </div>
        )}

        {activeTab === 'comparisons' && (
          <div>
            <h3 className="text-xl font-semibold text-nyu-text-primary mb-4">
              Pairwise Comparisons
            </h3>
            <p className="text-nyu-text-secondary">
              Compare criteria and alternatives using Saaty's 1-9 scale.
            </p>
            {/* Comparison interface will go here */}
          </div>
        )}

        {activeTab === 'results' && (
          <div>
            <h3 className="text-xl font-semibold text-nyu-text-primary mb-4">
              Analysis Results
            </h3>
            <p className="text-nyu-text-secondary">
              View the computed priorities and final rankings.
            </p>
            {/* Results visualization will go here */}
          </div>
        )}

        {activeTab === 'sensitivity' && (
          <div>
            <h3 className="text-xl font-semibold text-nyu-text-primary mb-4">
              Sensitivity Analysis
            </h3>
            <p className="text-nyu-text-secondary">
              Analyze how changes in criteria weights affect the rankings.
            </p>
            {/* Sensitivity analysis will go here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemEditor;
