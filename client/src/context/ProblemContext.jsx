import React, { createContext, useState, useContext } from 'react';
import problemService from '../services/problemService';

const ProblemContext = createContext(null);

export const useProblem = () => {
  const context = useContext(ProblemContext);
  if (!context) {
    throw new Error('useProblem must be used within a ProblemProvider');
  }
  return context;
};

export const ProblemProvider = ({ children }) => {
  const [currentProblem, setCurrentProblem] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadProblems = async () => {
    setLoading(true);
    try {
      const data = await problemService.listProblems();
      setProblems(data.problems);
    } catch (error) {
      console.error('Error loading problems:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadProblem = async (problemId) => {
    setLoading(true);
    try {
      const data = await problemService.getProblem(problemId);
      setCurrentProblem(data.problem);
      return data.problem;
    } catch (error) {
      console.error('Error loading problem:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createProblem = async (problemData) => {
    setLoading(true);
    try {
      const data = await problemService.createProblem(problemData);
      setProblems([data.problem, ...problems]);
      setCurrentProblem(data.problem);
      return data.problem;
    } catch (error) {
      console.error('Error creating problem:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProblem = async (problemId, updates) => {
    setLoading(true);
    try {
      const data = await problemService.updateProblem(problemId, updates);
      setCurrentProblem(data.problem);
      setProblems(problems.map(p => p.id === problemId ? data.problem : p));
      return data.problem;
    } catch (error) {
      console.error('Error updating problem:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteProblem = async (problemId) => {
    setLoading(true);
    try {
      await problemService.deleteProblem(problemId);
      setProblems(problems.filter(p => p.id !== problemId));
      if (currentProblem?.id === problemId) {
        setCurrentProblem(null);
      }
    } catch (error) {
      console.error('Error deleting problem:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const saveProblem = async (problemId, problemData) => {
    setLoading(true);
    try {
      const data = await problemService.saveProblem(problemId, problemData);
      return data;
    } catch (error) {
      console.error('Error saving problem:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentProblem,
    problems,
    loading,
    setCurrentProblem,
    loadProblems,
    loadProblem,
    createProblem,
    updateProblem,
    deleteProblem,
    saveProblem,
  };

  return <ProblemContext.Provider value={value}>{children}</ProblemContext.Provider>;
};
