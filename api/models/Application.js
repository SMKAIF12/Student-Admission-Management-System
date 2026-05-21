const mongoose = require('mongoose');
const Counter = require('./Counter')
const ApplicationSchema = new mongoose.Schema({
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    personalDetails: {
        fullname:{type:String,required:true,unique:true},
        phoneNumber: { type: String, required: true, unique: true },
        aadharNumber: { type: String, required: true, unique: true },
        dob: { type: Date, required: true },
        photo: {
            url: { type: String, required: true },
            publicId: { type: String, required: true }
        },
    },
    academics: {
        sslc: {
            url: { type: String, required: true },
            publicId: { type: String, required: true }
        },
        hsc: {
            url: { type: String, required: true },
            publicId: { type: String, required: true }
        },
        hscregisternumber: { type: String, required: true }
    },
    marks: {
        language: { type: Number, required: true, min: 0, max: 100 },
        english: { type: Number, required: true, min: 0, max: 100 },
        mathematics: { type: Number, required: true, min: 0, max: 100 },
        physics: { type: Number, required: true, min: 0, max: 100 },
        chemistry: { type: Number, required: true, min: 0, max: 100 },
        elective: { type: Number, required: true, min: 0, max: 100 },
    },
    cutoff: { type: Number },
    status: {
        type: String,
        enum: ['pending', 'applied', 'allocated', 'rejected','waitinglist'],
        default: 'pending'
    },
    fee: {
        type: String,
        enum: ['paid', 'pending'],
        default: 'pending'
    },
    applicationNumber: { type: String, unique: true },
    selectedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SelectedCourse' }],
    allocatedCourse:{ type: mongoose.Schema.Types.ObjectId, ref: 'SelectedCourse' }
}, { timestamps: true })
ApplicationSchema.pre('save', async function (next) {
    try {
        if (this.isModified('marks')) {
            const { mathematics, physics, chemistry } = this.marks;
            this.cutoff = mathematics + (physics / 2) + (chemistry / 2);
        }

        // 2. Only generate Application Number for new documents
        if (this.isNew) {
            // Atomic update of the counter
            const counter = await Counter.findOneAndUpdate(
                { id: 'applicationNumber' }, 
                { $inc: { seq: 1 } },        
                { returnDocument: 'after', upsert: true } // Fixed the 'new' warning too
            );

            const year = new Date().getFullYear();
            this.applicationNumber = `APP-${year}-${counter.seq.toString().padStart(4, '0')}`;
        }
    } catch (error) {
        console.log(error);
        next(error); // Pass error to Mongoose if something goes wrong
    }
})
module.exports = mongoose.model('Application', ApplicationSchema)