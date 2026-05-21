const express = require('express');
const router = express.Router();
const { login, register, auth } = require('../controllers/auth-controller');
const { authMiddleWare } = require('../middleware/auth-middleware');
router.post('/login', login);
router.post('/register', register);
router.get('/auth',authMiddleWare,auth)
module.exports = router;