const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const authValidation = require('../validations/authValidation');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');

// Public routes
router.post('/login', authValidation.login, validate, AuthController.login);
router.post('/refresh', authValidation.refreshToken, validate, AuthController.refreshToken);

// Protected routes
router.get('/me', authenticate, AuthController.getCurrentUser);
router.post('/change-password', authenticate, authValidation.changePassword, validate, AuthController.changePassword);
router.post('/logout', authenticate, AuthController.logout);

module.exports = router;