const ahpEngine = require('../services/ahpEngine');

/**
 * Compute priorities from a pairwise comparison matrix
 */
function computePriorities(req, res) {
  try {
    const { matrix } = req.body;
    
    if (!matrix || !Array.isArray(matrix)) {
      return res.status(400).json({
        error: { message: 'Valid comparison matrix is required' },
      });
    }
    
    const result = ahpEngine.computePriorities(matrix);
    
    res.json(result);
  } catch (error) {
    console.error('Compute priorities error:', error);
    res.status(500).json({
      error: { message: error.message || 'Failed to compute priorities' },
    });
  }
}

/**
 * Compute consistency metrics
 */
function computeConsistency(req, res) {
  try {
    const { matrix } = req.body;
    
    if (!matrix || !Array.isArray(matrix)) {
      return res.status(400).json({
        error: { message: 'Valid comparison matrix is required' },
      });
    }
    
    const n = matrix.length;
    const priorityVector = ahpEngine.computeEigenvector(matrix);
    const lambdaMax = ahpEngine.computeLambdaMax(matrix, priorityVector);
    const ci = ahpEngine.computeCI(lambdaMax, n);
    const cr = ahpEngine.computeCR(ci, n);
    
    res.json({
      lambdaMax,
      ci,
      cr,
      isConsistent: cr <= 0.10,
    });
  } catch (error) {
    console.error('Compute consistency error:', error);
    res.status(500).json({
      error: { message: error.message || 'Failed to compute consistency' },
    });
  }
}

/**
 * Synthesize global priorities
 */
function synthesize(req, res) {
  try {
    const { criteriaWeights, alternativePriorities } = req.body;
    
    if (!criteriaWeights || !alternativePriorities) {
      return res.status(400).json({
        error: { message: 'Criteria weights and alternative priorities are required' },
      });
    }
    
    const result = ahpEngine.synthesize(criteriaWeights, alternativePriorities);
    
    res.json(result);
  } catch (error) {
    console.error('Synthesize error:', error);
    res.status(500).json({
      error: { message: error.message || 'Failed to synthesize priorities' },
    });
  }
}

/**
 * Perform sensitivity analysis
 */
function sensitivityAnalysis(req, res) {
  try {
    const { criteriaWeights, alternativePriorities, targetCriterion, weightRange } = req.body;
    
    if (!criteriaWeights || !alternativePriorities || !targetCriterion) {
      return res.status(400).json({
        error: { message: 'Required parameters missing for sensitivity analysis' },
      });
    }
    
    const criteria = Object.keys(criteriaWeights);
    const alternatives = Object.keys(alternativePriorities[criteria[0]]);
    const targetWeight = criteriaWeights[targetCriterion];
    
    // Generate sensitivity data points
    const steps = weightRange || 20;
    const dataPoints = [];
    
    for (let i = 0; i <= steps; i++) {
      const newWeight = i / steps;
      const remainingWeight = 1 - newWeight;
      const otherCriteriaCount = criteria.length - 1;
      
      // Redistribute weights proportionally
      const newWeights = { ...criteriaWeights };
      newWeights[targetCriterion] = newWeight;
      
      criteria.forEach(c => {
        if (c !== targetCriterion && otherCriteriaCount > 0) {
          const originalProportion = criteriaWeights[c] / (1 - targetWeight || 1);
          newWeights[c] = remainingWeight * originalProportion;
        }
      });
      
      // Compute new priorities
      const result = ahpEngine.synthesize(newWeights, alternativePriorities);
      
      const point = {
        weight: newWeight,
        priorities: result.normalized,
      };
      
      dataPoints.push(point);
    }
    
    res.json({
      criterion: targetCriterion,
      dataPoints,
    });
  } catch (error) {
    console.error('Sensitivity analysis error:', error);
    res.status(500).json({
      error: { message: error.message || 'Failed to perform sensitivity analysis' },
    });
  }
}

module.exports = {
  computePriorities,
  computeConsistency,
  synthesize,
  sensitivityAnalysis,
};
