const mongoose = require('mongoose');
const InstituteSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true},
    ranking: { type: Number, required: true },
    location: String,
    contact: {
        email: { type: String },
        phone: { type: String }
    },
    offeredCourses: [{
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
        totalSeats: { type: Number, required:true, default: 120 },
        filledSeats: { type: Number, required:true, default: 0 },
        cutoff: { type: Number, required: true, default: 0 }
    }]
})
module.exports = mongoose.model('Institute', InstituteSchema);