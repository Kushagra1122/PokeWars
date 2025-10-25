const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.me);

// Wallet-first identity routes
router.post('/auth/link-wallet', authMiddleware, authController.linkWallet);
router.post('/auth/create-wallet-user', authController.createWalletUser);

module.exports = router;
