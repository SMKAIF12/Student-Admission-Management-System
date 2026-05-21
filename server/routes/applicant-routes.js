const express = require('express');
const { createApplication, confirmFeesPayment, withDrawApplication,getApplication } = require('../controllers/candidate-controller');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage(); // CRITICAL for Vercel
const { authMiddleWare } = require('../middleware/auth-middleware');
const upload = multer({ storage: storage });
const { getAllInstitutes } = require('../controllers/common-controller')
router.post('/create', authMiddleWare, upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'sslc', maxCount: 1 },
    { name: 'hsc', maxCount: 1 }
]), createApplication)
router.post('/payfee', authMiddleWare, confirmFeesPayment);
router.delete('/withdraw',authMiddleWare,withDrawApplication)
router.get('/institutes', authMiddleWare, getAllInstitutes);
router.get('/get/:id', authMiddleWare, getApplication);
module.exports = router;