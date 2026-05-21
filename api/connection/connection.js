const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = async()=>{
    try {
        await mongoose.connect(process.env.URL);
        console.log('MongoDB connection successful.');
    } catch (error) {
        console.error('MongoDB connection Failed: ', error);
        process.exit(1);
    }
}
module.exports = connectDB;