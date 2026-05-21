const Institute = require('../models/Institute')
const Course = require('../models/Course')
const getAllInstitutes = async (req, res) => {
    try {
        const { search } = req.query;
        const filter = {};
        const institutes = await Institute.find().populate('offeredCourses.courseId');
        if (!institutes || institutes.length <= 0) {
            return res.status(200).json({ success: false, message: 'No Institutes found matching criteria' });
        }
        return res.status(200).json({ success: true, message: 'Institutes found!', institutes: institutes });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Error occurred: ${error.message}` });
    }
}
module.exports = { getAllInstitutes }