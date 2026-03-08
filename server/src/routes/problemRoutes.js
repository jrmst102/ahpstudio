const express = require('express');
const problemController = require('../controllers/problemController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Problem CRUD
router.post('/', problemController.createProblem);
router.get('/', problemController.listProblems);
router.get('/:id', problemController.getProblem);
router.put('/:id', problemController.updateProblem);
router.delete('/:id', problemController.deleteProblem);
router.post('/:id/save', problemController.saveProblem);
router.get('/:id/download', problemController.downloadProblem);
router.post('/upload', problemController.uploadProblem);

// Participant management
router.get('/:id/participants', problemController.listParticipants);
router.post('/:id/participants', problemController.addParticipant);
router.put('/:id/participants/:pid', problemController.updateParticipant);
router.delete('/:id/participants/:pid', problemController.removeParticipant);
router.post('/:id/participants/:pid/regenerate-pin', problemController.regeneratePin);

// Problem config
router.put('/:id/config', problemController.updateConfig);

// Round management
router.post('/:id/round/close', problemController.closeRound);
router.post('/:id/round/reopen', problemController.reopenRound);
router.post('/:id/round/new', problemController.newRound);
router.post('/:id/finalize', problemController.finalizeProblem);

// Consensus & rounds
router.get('/:id/consensus', problemController.getConsensus);
router.get('/:id/rounds', problemController.listRounds);

module.exports = router;
