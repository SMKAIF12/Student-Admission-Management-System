const mongoose = require('mongoose');
const SelectedCourse = new mongoose.Schema({
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }
})
module.exports = mongoose.model('SelectedCourse', SelectedCourse);