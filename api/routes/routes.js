const express = require('express');
const router = express.Router();
const { validateAdmin, authMiddleWare } = require('../middleware/auth-middleware');
const { addInstitute, addCourse, getAllApplications, getCourses, editCourse, deleteInstitute, deleteCourse, editInstitute, allocateSeat, manageStatus } = require('../controllers/admin-course-controller');
const {getAllInstitutes} = require('../controllers/common-controller')
const { createApplication, confirmFeesPayment, withDrawApplication,getApplication } = require('../controllers/candidate-controller');
const multer = require('multer');
const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });
const { login, register, auth } = require('../controllers/auth-controller');
// institution routes
router.post('/institute/add', authMiddleWare, validateAdmin, addInstitute);
router.put('/institute/edit/:id', authMiddleWare, validateAdmin, editInstitute);
router.get('/institute/get', authMiddleWare, validateAdmin, getAllInstitutes);
router.delete('/institute/delete/:id', authMiddleWare, validateAdmin, deleteInstitute)
// course routes
router.post('/course/add', authMiddleWare, validateAdmin, addCourse);
router.get('/course/get', authMiddleWare, validateAdmin, getCourses);
router.put('/course/edit/:id', authMiddleWare, validateAdmin, editCourse);
router.delete('/course/delete/:id', authMiddleWare, validateAdmin, deleteCourse)
// application routes.
router.get('/applications/get', authMiddleWare, validateAdmin, getAllApplications);
router.post('/allocateseat', authMiddleWare, validateAdmin, allocateSeat);
router.put('/managestatus', authMiddleWare, validateAdmin, manageStatus);
// applicant
router.post('/create', authMiddleWare, upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'sslc', maxCount: 1 },
    { name: 'hsc', maxCount: 1 }
]), createApplication)
router.post('/payfee', authMiddleWare, confirmFeesPayment);
router.delete('/withdraw',authMiddleWare,withDrawApplication)
router.get('/institutes', authMiddleWare, getAllInstitutes);
router.get('/get/:id', authMiddleWare, getApplication);

// auth routes
router.post('/login', login);
router.post('/register', register);
router.get('/auth',authMiddleWare,auth)

module.exports = router;
