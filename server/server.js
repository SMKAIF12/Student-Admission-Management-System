const express = require('express');
const cors = require('cors');
const connectDB = require('./connection/connection');
const adminRoutes = require('./routes/admin-routes');
const authRoutes = require('./routes/auth-routes');
const applicationRoutes = require('./routes/applicant-routes');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());
connectDB();
app.use('/admin',adminRoutes);
app.use('/',authRoutes);
app.use('/application',applicationRoutes)
app.listen(PORT, () => {
    console.log('Server listening on:', PORT);
})
module.exports = app;