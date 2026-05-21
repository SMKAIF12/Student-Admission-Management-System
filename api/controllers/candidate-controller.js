const Institute = require('../models/Institute')
const Application = require('../models/Application')
const SelectedCourse = require('../models/SelectedCourse');
const cloudinary = require('../config/cloudinary')
const { uploadToCloudinary } = require('../helpers/cloudinaryHelper');
const bcrypt = require('bcrypt');
const { application } = require('express');
const User = require('../models/User');
const getApplication = async (req, res) => {
    try {
        const appl = await Application.find({candidate:req.params.id});
        const application = await Application.findOne({ candidate: req.params.id }).populate({
            path: 'selectedCourses',
            populate: [
                {
                    path: 'institute',
                    select:'name code'
                },
                {
                    path: 'course'
                }
            ]
        }).populate({
            path: 'allocatedCourse',
            populate: [
                {
                    path: 'institute'
                },
                {
                    path: 'course'
                }
            ]
        });
        if (!application) {
            return res.status(200).json({ success: false, message: 'No application found!' })
        }
        return res.status(200).json({ success: true, message: 'Application found!', application: application });
    } catch (error) {
        res.status(500).json({ success: false, message: `Error occured: ${error}` });
    }
}
const createApplication = async (req, res) => {
    try {

        const personalDetails = JSON.parse(req.body.personalDetails);
        const academics = JSON.parse(req.body.academics);
        const marks = JSON.parse(req.body.marks);
        const selectedCourses = JSON.parse(req.body.selectedCourses);
        const candidate = req.body.candidate;
        const photoData = await uploadToCloudinary(req.files.photo[0].buffer, 'applications/photos');
        const sslcData = await uploadToCloudinary(req.files.sslc[0].buffer, 'applications/documents');
        const hscData = await uploadToCloudinary(req.files.hsc[0].buffer, 'applications/documents');
        console.log(personalDetails)
        const existingApplication = await Application.findOne({ candidate: candidate });
        if (existingApplication) {
            return res.status(409).json({ success: false, message: 'Already an Active application Exists with this candidate' })
        }
        const selectedCoursesData = await SelectedCourse.insertMany(selectedCourses);
        const newApplication = await Application.create({
            candidate: candidate,
            personalDetails: { ...personalDetails, photo: photoData },
            academics: { ...academics, sslc: sslcData, hsc: hscData },
            marks: marks,
            selectedCourses: selectedCoursesData ,
            fee: 'pending',
            status: 'pending'
        })
        return res.status(201).json({ success: true, message: 'Application created!', application: newApplication });
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: `Error occured: ${error}` });
    }
}
const withDrawApplication = async (req, res) => {
    try {
        const user = await User.findById(req.body.candidate);
        const isPasswordMatched = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordMatched) {
            return res.status(401).json({ success: false, message: 'Incorrect Password' });
        }

        const currentApplication = await Application.findOne({ candidate: req.body.candidate });
        if (!currentApplication) {
            return res.status(404).json({ success: false, message: 'No application Found' })
        }
        await cloudinary.uploader.destroy(currentApplication.personalDetails.photo.publicId);
        await cloudinary.uploader.destroy(currentApplication.academics.sslc.publicId);
        await cloudinary.uploader.destroy(currentApplication.academics.hsc.publicId);
        await currentApplication.deleteOne();
        return res.status(200).json({ success: true, message: 'Application deleted', application: currentApplication })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: `Error occured: ${error}` });
    }
}
const confirmFeesPayment = async (req, res) => {
    try {
        const currentApplication = await Application.findOne({ candidate: req.body.candidate });
        console.log(currentApplication);
        if (!currentApplication) {
            return res.status(404).json({ success: false, message: 'No applications Found' })
        }
        currentApplication.fee = 'paid';
        currentApplication.status = 'applied';
        await currentApplication.save();
        return res.status(200).json({ success: true, message: 'Fees Payment Successful!', application: currentApplication })
    } catch (error) {
        res.status(500).json({ success: false, message: `Error occured: ${error}` });
    }
}

module.exports = { createApplication, getApplication, confirmFeesPayment, withDrawApplication }