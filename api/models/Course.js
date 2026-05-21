const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  degree: {
    type: String,
    enum: ['Bachelor Of Technology', 'Bachelor of Engineering'],
    required: true
  },
  course: { type: String, required: true },
  description: String
});
CourseSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const Institute = mongoose.model('Institute');
    await Institute.updateMany(
      { "offeredCourses.courseId": doc._id },
      { $pull: { offeredCourses: { courseId: doc._id } } }
    );
  }
})
module.exports = mongoose.model('Course', CourseSchema);