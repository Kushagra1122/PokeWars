const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const authMiddleware = require('../middleware/authMiddleware');

// All match routes require authentication
router.use(authMiddleware);

// Create a new rated match
router.post('/create', matchController.createMatch);

// Join an existing match
router.post('/:matchId/join', matchController.joinMatch);

// Submit match result
router.post('/:matchId/result', matchController.submitResult);

// Get match details
router.get('/:matchId', matchController.getMatch);

// Get typed data for signing
router.get('/:matchId/typed-data', matchController.getTypedData);

// Get user's matches
router.get('/', matchController.getUserMatches);

module.exports = router;
