const express = require('express');
const router = express.Router();
const { validateAdmin, authMiddleWare } = require('../middleware/auth-middleware');
const { addInstitute, addCourse, getAllApplications, getCourses, editCourse, deleteInstitute, deleteCourse, editInstitute, allocateSeat, manageStatus } = require('../controllers/admin-course-controller');
const {getAllInstitutes} = require('../controllers/common-controller')
// admin routes
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

module.exports = router;