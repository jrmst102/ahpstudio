const { v4: uuidv4 } = require('uuid');
const storageService = require('../services/storageService');

// Problem index key per user – stores metadata for all their problems
function indexKey(userId) {
  return `users/${userId}/problems/index.json`;
}

async function loadIndex(userId) {
  const data = await storageService.getJSON(indexKey(userId));
  return data || [];
}

async function saveIndex(userId, problems) {
  await storageService.putJSON(indexKey(userId), problems);
}

// ── Controllers ───────────────────────────────────────────────────────

async function createProblem(req, res) {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: { message: 'Problem title is required' } });
    }

    const problems = await loadIndex(req.user.id);
    const now = new Date().toISOString();
    const problem = {
      id: uuidv4(),
      userId: req.user.id,
      title,
      description: description || '',
      fileKey: null,
      createdAt: now,
      updatedAt: now,
    };

    problems.push(problem);
    await saveIndex(req.user.id, problems);

    res.status(201).json({ problem });
  } catch (error) {
    console.error('Create problem error:', error);
    res.status(500).json({ error: { message: 'Failed to create problem' } });
  }
}

async function listProblems(req, res) {
  try {
    const problems = await loadIndex(req.user.id);
    problems.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json({ problems });
  } catch (error) {
    console.error('List problems error:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve problems' } });
  }
}

async function getProblem(req, res) {
  try {
    const { id } = req.params;
    const problems = await loadIndex(req.user.id);
    let problem = problems.find(p => p.id === id);

    if (!problem && req.user.role === 'ADMIN') {
      // Admin may access another user's problem – not supported in flat index
      return res.status(404).json({ error: { message: 'Problem not found' } });
    }
    if (!problem) {
      return res.status(404).json({ error: { message: 'Problem not found' } });
    }

    let problemData = null;
    if (problem.fileKey) {
      try {
        problemData = await storageService.downloadProblemFile(problem.fileKey);
      } catch (err) {
        console.error('Error loading problem file:', err);
      }
    }

    res.json({ problem: { ...problem, data: problemData } });
  } catch (error) {
    console.error('Get problem error:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve problem' } });
  }
}

async function updateProblem(req, res) {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const problems = await loadIndex(req.user.id);
    const idx = problems.findIndex(p => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: { message: 'Problem not found' } });
    }

    if (title) problems[idx].title = title;
    if (description !== undefined) problems[idx].description = description;
    problems[idx].updatedAt = new Date().toISOString();

    await saveIndex(req.user.id, problems);
    res.json({ problem: problems[idx] });
  } catch (error) {
    console.error('Update problem error:', error);
    res.status(500).json({ error: { message: 'Failed to update problem' } });
  }
}

async function deleteProblem(req, res) {
  try {
    const { id } = req.params;
    const problems = await loadIndex(req.user.id);
    const problem = problems.find(p => p.id === id);
    if (!problem) {
      return res.status(404).json({ error: { message: 'Problem not found' } });
    }

    if (problem.fileKey) {
      try {
        await storageService.deleteProblemFile(problem.fileKey);
      } catch (err) {
        console.error('Error deleting problem file:', err);
      }
    }

    await saveIndex(req.user.id, problems.filter(p => p.id !== id));
    res.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    console.error('Delete problem error:', error);
    res.status(500).json({ error: { message: 'Failed to delete problem' } });
  }
}

async function saveProblem(req, res) {
  try {
    const { id } = req.params;
    const problemData = req.body;
    const problems = await loadIndex(req.user.id);
    const idx = problems.findIndex(p => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: { message: 'Problem not found' } });
    }

    const fileKey = await storageService.uploadProblemFile(req.user.id, id, problemData);
    problems[idx].fileKey = fileKey;
    problems[idx].updatedAt = new Date().toISOString();
    await saveIndex(req.user.id, problems);

    res.json({ message: 'Problem saved successfully', fileKey });
  } catch (error) {
    console.error('Save problem error:', error);
    res.status(500).json({ error: { message: 'Failed to save problem' } });
  }
}

async function downloadProblem(req, res) {
  try {
    const { id } = req.params;
    const problems = await loadIndex(req.user.id);
    const problem = problems.find(p => p.id === id);
    if (!problem) {
      return res.status(404).json({ error: { message: 'Problem not found' } });
    }
    if (!problem.fileKey) {
      return res.status(404).json({ error: { message: 'Problem file not found' } });
    }

    const url = await storageService.getSignedUrl(problem.fileKey);
    res.json({ downloadUrl: url });
  } catch (error) {
    console.error('Download problem error:', error);
    res.status(500).json({ error: { message: 'Failed to download problem' } });
  }
}

async function uploadProblem(req, res) {
  try {
    const { problemData } = req.body;
    if (!problemData) {
      return res.status(400).json({ error: { message: 'Problem data is required' } });
    }
    if (!problemData.problem || !problemData.problem.title) {
      return res.status(400).json({ error: { message: 'Invalid .AHP file format' } });
    }

    const problems = await loadIndex(req.user.id);
    const now = new Date().toISOString();
    const problem = {
      id: uuidv4(),
      userId: req.user.id,
      title: problemData.problem.title,
      description: problemData.problem.description || '',
      fileKey: null,
      createdAt: now,
      updatedAt: now,
    };

    const fileKey = await storageService.uploadProblemFile(req.user.id, problem.id, problemData);
    problem.fileKey = fileKey;

    problems.push(problem);
    await saveIndex(req.user.id, problems);

    res.status(201).json({ message: 'Problem imported successfully', problem });
  } catch (error) {
    console.error('Upload problem error:', error);
    res.status(500).json({ error: { message: 'Failed to import problem' } });
  }
}

module.exports = {
  createProblem, listProblems, getProblem, updateProblem,
  deleteProblem, saveProblem, downloadProblem, uploadProblem,
};
