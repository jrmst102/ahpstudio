const express = require('express');
const problemController = require('../controllers/problemController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', problemController.createProblem);
router.get('/', problemController.listProblems);
router.get('/:id', problemController.getProblem);
router.put('/:id', problemController.updateProblem);
router.delete('/:id', problemController.deleteProblem);
router.post('/:id/save', problemController.saveProblem);
router.get('/:id/download', problemController.downloadProblem);
router.post('/upload', problemController.uploadProblem);

module.exports = router;
