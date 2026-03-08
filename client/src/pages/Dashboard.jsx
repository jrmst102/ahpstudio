import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProblem } from '../context/ProblemContext';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';

const Dashboard = () => {
  const navigate = useNavigate();
  const { problems, loadProblems, createProblem, deleteProblem, loading } = useProblem();
  const [showNewProblemModal, setShowNewProblemModal] = useState(false);
  const [newProblemTitle, setNewProblemTitle] = useState('');
  const [newProblemDescription, setNewProblemDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProblems();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateProblem = async () => {
    if (!newProblemTitle.trim()) {
      setError('Problem title is required');
      return;
    }

    try {
      const problem = await createProblem({
        title: newProblemTitle,
        description: newProblemDescription,
      });
      setSuccess('Problem created successfully');
      setShowNewProblemModal(false);
      setNewProblemTitle('');
      setNewProblemDescription('');
      navigate(`/editor/${problem.id}`);
    } catch (err) {
      setError('Failed to create problem');
    }
  };

  const handleDeleteProblem = async (problemId) => {
    if (!window.confirm('Are you sure you want to delete this problem?')) {
      return;
    }

    try {
      await deleteProblem(problemId);
      setSuccess('Problem deleted successfully');
    } catch (err) {
      setError('Failed to delete problem');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-nyu-text-primary mb-2">
          Welcome to AHP Studio
        </h2>
        <p className="text-nyu-text-secondary">
          Create and manage your decision problems using the Analytic Hierarchy Process
        </p>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* New Problem Card */}
        <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowNewProblemModal(true)}>
          <div className="flex items-center justify-center flex-col py-8">
            <div className="w-16 h-16 bg-nyu-violet-ultra rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-nyu-violet"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 4v16m8-8H4"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-nyu-text-primary mb-2">
              Create New Problem
            </h3>
            <p className="text-nyu-text-secondary text-center">
              Start a new AHP decision analysis
            </p>
          </div>
        </div>

        {/* Load Problem Card */}
        <div className="card">
          <div className="flex items-center justify-center flex-col py-8">
            <div className="w-16 h-16 bg-nyu-violet-ultra rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-nyu-violet"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-nyu-text-primary mb-2">
              Upload Problem
            </h3>
            <p className="text-nyu-text-secondary text-center mb-4">
              Import an existing .AHP file
            </p>
            <input
              type="file"
              accept=".AHP,.json"
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" size="sm" onClick={() => document.getElementById('file-upload').click()}>
                Choose File
              </Button>
            </label>
          </div>
        </div>
      </div>

      {/* Recent Problems */}
      <div className="card">
        <h3 className="text-xl font-semibold text-nyu-text-primary mb-4">
          Your Problems
        </h3>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nyu-violet mx-auto"></div>
            <p className="mt-2 text-nyu-text-secondary">Loading...</p>
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-8 text-nyu-text-secondary">
            <p>No problems yet. Create your first AHP decision problem!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {problems.map((problem) => (
              <div
                key={problem.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-nyu-violet-ultra transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-nyu-text-primary">
                    {problem.title}
                  </h4>
                  {problem.description && (
                    <p className="text-sm text-nyu-text-secondary mt-1">
                      {problem.description}
                    </p>
                  )}
                  <p className="text-xs text-nyu-text-tertiary mt-2">
                    Last updated: {new Date(problem.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/editor/${problem.id}`)}
                  >
                    Open
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteProblem(problem.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Problem Modal */}
      <Modal
        isOpen={showNewProblemModal}
        onClose={() => setShowNewProblemModal(false)}
        title="Create New Problem"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowNewProblemModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProblem} disabled={loading}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Problem Title*</label>
            <input
              type="text"
              className="input"
              value={newProblemTitle}
              onChange={(e) => setNewProblemTitle(e.target.value)}
              placeholder="e.g., Best Market Entry Strategy"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows="4"
              value={newProblemDescription}
              onChange={(e) => setNewProblemDescription(e.target.value)}
              placeholder="Describe your decision problem..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
