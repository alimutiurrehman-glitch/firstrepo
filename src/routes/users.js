const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validators, validate } = require('../utils/validators');

// Get all users
router.get('/', userController.getAllUsers);

// Create new user
router.post('/', userController.createUser);

// Get user by ID
router.get('/:id', validators.objectId('id'), validate, userController.getUserById);

// Get user watch history
router.get('/:id/history', validators.objectId('id'), validate, userController.getUserHistory);

// Add movie to watch history
router.post('/:id/watch', validators.objectId('id'), validate, userController.addToWatchHistory);

module.exports = router;

