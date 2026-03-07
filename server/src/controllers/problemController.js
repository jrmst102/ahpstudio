const { PrismaClient } = require('@prisma/client');
const storageService = require('../services/storageService');

const prisma = new PrismaClient();

/**
 * Create a new decision problem
 */
async function createProblem(req, res) {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({
        error: { message: 'Problem title is required' },
      });
    }
    
    const problem = await prisma.problem.create({
      data: {
        userId: req.user.id,
        title,
        description: description || '',
      },
    });
    
    res.status(201).json({ problem });
  } catch (error) {
    console.error('Create problem error:', error);
    res.status(500).json({
      error: { message: 'Failed to create problem' },
    });
  }
}

/**
 * List all problems for authenticated user
 */
async function listProblems(req, res) {
  try {
    const problems = await prisma.problem.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
    });
    
    res.json({ problems });
  } catch (error) {
    console.error('List problems error:', error);
    res.status(500).json({
      error: { message: 'Failed to retrieve problems' },
    });
  }
}

/**
 * Get a specific problem by ID
 */
async function getProblem(req, res) {
  try {
    const { id } = req.params;
    
    const problem = await prisma.problem.findUnique({
      where: { id },
    });
    
    if (!problem) {
      return res.status(404).json({
        error: { message: 'Problem not found' },
      });
    }
    
    // Check ownership
    if (problem.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: { message: 'Access denied' },
      });
    }
    
    // If file exists, load it
    let problemData = null;
    if (problem.fileKey) {
      try {
        problemData = await storageService.downloadProblemFile(problem.fileKey);
      } catch (error) {
        console.error('Error loading problem file:', error);
      }
    }
    
    res.json({
      problem: {
        ...problem,
        data: problemData,
      },
    });
  } catch (error) {
    console.error('Get problem error:', error);
    res.status(500).json({
      error: { message: 'Failed to retrieve problem' },
    });
  }
}

/**
 * Update a problem
 */
async function updateProblem(req, res) {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    
    const problem = await prisma.problem.findUnique({
      where: { id },
    });
    
    if (!problem) {
      return res.status(404).json({
        error: { message: 'Problem not found' },
      });
    }
    
    // Check ownership
    if (problem.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: { message: 'Access denied' },
      });
    }
    
    const updated = await prisma.problem.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
      },
    });
    
    res.json({ problem: updated });
  } catch (error) {
    console.error('Update problem error:', error);
    res.status(500).json({
      error: { message: 'Failed to update problem' },
    });
  }
}

/**
 * Delete a problem
 */
async function deleteProblem(req, res) {
  try {
    const { id } = req.params;
    
    const problem = await prisma.problem.findUnique({
      where: { id },
    });
    
    if (!problem) {
      return res.status(404).json({
        error: { message: 'Problem not found' },
      });
    }
    
    // Check ownership
    if (problem.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: { message: 'Access denied' },
      });
    }
    
    // Delete file from storage if exists
    if (problem.fileKey) {
      try {
        await storageService.deleteProblemFile(problem.fileKey);
      } catch (error) {
        console.error('Error deleting problem file:', error);
      }
    }
    
    await prisma.problem.delete({
      where: { id },
    });
    
    res.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    console.error('Delete problem error:', error);
    res.status(500).json({
      error: { message: 'Failed to delete problem' },
    });
  }
}

/**
 * Save problem to .AHP file
 */
async function saveProblem(req, res) {
  try {
    const { id } = req.params;
    const problemData = req.body;
    
    const problem = await prisma.problem.findUnique({
      where: { id },
    });
    
    if (!problem) {
      return res.status(404).json({
        error: { message: 'Problem not found' },
      });
    }
    
    // Check ownership
    if (problem.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: { message: 'Access denied' },
      });
    }
    
    // Upload to Spaces
    const fileKey = await storageService.uploadProblemFile(
      req.user.id,
      id,
      problemData
    );
    
    // Update problem with file key
    await prisma.problem.update({
      where: { id },
      data: { fileKey },
    });
    
    res.json({
      message: 'Problem saved successfully',
      fileKey,
    });
  } catch (error) {
    console.error('Save problem error:', error);
    res.status(500).json({
      error: { message: 'Failed to save problem' },
    });
  }
}

/**
 * Download problem .AHP file
 */
async function downloadProblem(req, res) {
  try {
    const { id } = req.params;
    
    const problem = await prisma.problem.findUnique({
      where: { id },
    });
    
    if (!problem) {
      return res.status(404).json({
        error: { message: 'Problem not found' },
      });
    }
    
    // Check ownership
    if (problem.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: { message: 'Access denied' },
      });
    }
    
    if (!problem.fileKey) {
      return res.status(404).json({
        error: { message: 'Problem file not found' },
      });
    }
    
    // Get signed URL
    const url = await storageService.getSignedUrl(problem.fileKey);
    
    res.json({ downloadUrl: url });
  } catch (error) {
    console.error('Download problem error:', error);
    res.status(500).json({
      error: { message: 'Failed to download problem' },
    });
  }
}

/**
 * Upload and import .AHP file
 */
async function uploadProblem(req, res) {
  try {
    const { problemData } = req.body;
    
    if (!problemData) {
      return res.status(400).json({
        error: { message: 'Problem data is required' },
      });
    }
    
    // Validate problem data structure
    if (!problemData.problem || !problemData.problem.title) {
      return res.status(400).json({
        error: { message: 'Invalid .AHP file format' },
      });
    }
    
    // Create problem
    const problem = await prisma.problem.create({
      data: {
        userId: req.user.id,
        title: problemData.problem.title,
        description: problemData.problem.description || '',
      },
    });
    
    // Upload file
    const fileKey = await storageService.uploadProblemFile(
      req.user.id,
      problem.id,
      problemData
    );
    
    // Update with file key
    await prisma.problem.update({
      where: { id: problem.id },
      data: { fileKey },
    });
    
    res.status(201).json({
      message: 'Problem imported successfully',
      problem,
    });
  } catch (error) {
    console.error('Upload problem error:', error);
    res.status(500).json({
      error: { message: 'Failed to import problem' },
    });
  }
}

module.exports = {
  createProblem,
  listProblems,
  getProblem,
  updateProblem,
  deleteProblem,
  saveProblem,
  downloadProblem,
  uploadProblem,
};
