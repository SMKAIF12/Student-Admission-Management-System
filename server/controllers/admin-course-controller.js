const Course = require('../models/Course');
const Institute = require('../models/Institute')
const Application = require('../models/Application')
const addCourse = async (req, res) => {
    try {
        const data = req.body;
        if (!data) {
            return res.status(400).json({ success: false, message: 'Invalid data' });
        }
        const existingCourse = await Course.findOne({ code: data.code });
        if (existingCourse) {
            return res.status(409).json({ success: true, message: 'Course already exists' });
        }
        const newCourse = await Course.create(data);
        return res.status(201).json({ success: true, message: 'Course Added successfully!', newCourse: newCourse })

    } catch (error) {
        res.status(500).json({ success: false, message: `Error occured: ${error}` });
    }
}
const addInstitute = async (req, res) => {
    try {
        const data = req.body;
        if (!data) {
            return res.status(400).json({ success: false, message: 'Invalid data' });
        }
        const existingInstitute = await Institute.findOne({ code: data.code });
        if (existingInstitute) {
            return res.status(409).json({ success: true, message: 'Institute already exists' });
        }
        const newInstitute = await Institute.create(data);
        return res.status(201).json({ success: true, message: 'Institute Added successfully!', newInstitute: newInstitute })
    } catch (error) {
        res.status(500).json({ success: false, message: `Error occured: ${error}` });
    }
}
const getAllApplications = async (req, res) => {
    try {
        // const { applicationStatus, feeStatus, course, sort, search } = req.query;
        // const page = parseInt(req.query.page) || 1;
        // const limit = parseInt(req.query.limit) || 0;
        // const filter = {};
        // const skip = (page - 1) * limit;
        // // filter.user = req.userInfo.userid;
        // if (applicationStatus) {
        //     filter.applicationStatus = applicationStatus;
        // }
        // if (feeStatus) {
        //     filter.fee = feeStatus;
        // }
        // if (search && search !== 'undefined') {
        //     filter.$or = [
        //         { applicationNumber: { $regex: search, $options: 'i' } },
        //     ]
        // }
        // const sortOptions = {};
        // if (sort === 'date_desc') {
        //     sortOptions.createdAt = -1;
        // }
        // else {
        //     sortOptions.createdAt = 1;
        // }
        const applications = await Application.find().populate({
                path: 'selectedCourses',
                populate: [
                    { path: 'institute', model: 'Institute' },
                    { path: 'course', model: 'Course' }
                ]
            })
            // 2. ✅ SAFE OPTIONAL POPULATION: Mongoose handles null/undefined natively here
            .populate({
                path: 'allocatedCourse', 
                populate: [
                    { path: 'institute', model: 'Institute' },
                    { path: 'course', model: 'Course' }
                ]
            });;
        if (!applications || applications.length <= 0) {
            return res.status(404).json({ success: false, message: 'No Applications Found' })
        }
        return res.status(200).json({ success: true, message: 'Applications found!', applications: applications })
    } catch (error) {
        res.status(500).json({ success: false, message: `Error occured: ${error}` });
    }
}
const getCourses = async (req, res) => {
    try {
        const courses = await Course.find();
        if (!courses || courses.length <= 0) {
            return res.status(404).json({ success: false, message: 'No courses Found' })
        }
        return res.status(200).json({ success: true, message: 'Courses found!', courses: courses })
    } catch (error) {
        res.status(500).json({ success: false, message: `Error occured: ${error}` });
    }
}
const editInstitute = async (req, res) => {
    try {
        const updatedInstitute = await Institute.findByIdAndUpdate(req.params.id, { ...req.body }, { returnDocument: 'after' })
        return res.status(200).json({ message: `institute updated.` })
    } catch (error) {
        res.status(500).json({ success: false, message: `Error occured: ${error}` });
    }
}
const editCourse = async (req, res) => {
    try {
        const udpatedCourse = await Course.findByIdAndUpdate(req.params.id, { ...req.body }, { returnDocument: 'after' })
        return res.status(200).json({ success: true, message: 'Course Updated', udpatedCourse: udpatedCourse })
    } catch (error) {
        res.status(500).json({ success: false, message: `Error occured: ${error}` });
    }
}
const deleteInstitute = async (req, res) => {
    try {
        const deletedInstitute = await Institute.findByIdAndDelete(req.params.id, { ...req.body }, { returnDocument: 'after' })
        return res.status(200).json({ success: true, message: 'Institute Deleted', deletedInstitute: deletedInstitute })
    } catch (error) {
        res.status(500).json({ success: false, message: `Error occured: ${error}` });
    }
}
const deleteCourse = async (req, res) => {
    try {
        const deletedCourse = await Course.findByIdAndDelete(req.params.id, { ...req.body }, { returnDocument: 'after' })
        return res.status(200).json({ success: true, message: 'course Deleted', deletedCourse: deletedCourse })
    } catch (error) {
        res.status(500).json({ success: false, message: `Error occured: ${error}` });
    }
}
const allocateSeat = async (req, res) => {
    try {
        // 1. Fetch all applications that are ready for allocation (status: 'applied')
        // We sort them globally based on your priority rules
        const candidates = await Application.find({ status: 'applied', fee: 'paid' })
            .sort({
                cutoff: -1,               // Higher cutoff first
                'marks.mathematics': -1,  // Higher Maths marks first
                'personalDetails.dob': 1, // Elder first (earlier date = smaller value)
                createdAt: 1              // Earlier application first
            })
            .populate('selectedCourses');
        if (!candidates || candidates.length <= 0) {
            return res.status(400).json({ success: false, message: 'No candidates to allocate seat!' })
        }
        const allocationResults = [];

        // 2. Iterate through each candidate in ranked order
        for (const app of candidates) {
            let allocated = false;

            // 3. Check the candidate's preferred courses in order
            for (const selection of app.selectedCourses) {
                const institute = await Institute.findById(selection.institute);

                // Find the specific course within that institute's offeredCourses array
                const offeredCourse = institute.offeredCourses.find(
                    c => c.courseId.toString() === selection.course.toString()
                );

                // 4. Check seat availability
                if (offeredCourse && offeredCourse.filledSeats < offeredCourse.totalSeats && app.cutoff >= offeredCourse.cutoff) {
                    // Update Institute filledSeats
                    offeredCourse.filledSeats += 1;
                    await institute.save();

                    // Update Application Status
                    app.allocatedCourse = selection._id;
                    app.status = 'allocated';
                    // You might want to store which course was allocated
                    await app.save();

                    allocated = true;
                    allocationResults.push({
                        candidate: app.applicationNumber,
                        institute: institute.name,
                        courseId: selection.course,
                        status: 'Allocated'
                    });
                    break; // Move to next candidate once allocated
                }
                else {
                    app.status = 'pending';
                    app.save();
                }
            }

            if (!allocated) {
                allocationResults.push({
                    candidate: app.applicationNumber,
                    status: 'No Seat Available'
                });
            }
        }

        res.status(200).json({ success: true, results: allocationResults, message:'Seat Allocation Completed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
const manageStatus = async (req, res) => {
    try {
        // console.log(req.body.applicationId);
        const application = await Application.findById(req.body.applicationId);
        if (!application) {
            return res.status(404).json({ success: false, message: 'No applications found' })
        }
        application.status = req.body.status;
        await application.save();
        return res.status(200).json({ success: true, message: 'Application Status updated successfully' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
module.exports = { addInstitute, addCourse, getAllApplications, getCourses, editInstitute, editCourse, deleteInstitute, deleteCourse, allocateSeat,manageStatus }