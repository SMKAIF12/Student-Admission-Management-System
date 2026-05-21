const express = require('express');
const cors = require('cors');
const connectDB = require('./connection/connection');
// const adminRoutes = require('./routes/admin-routes');
// const authRoutes = require('./routes/auth-routes');
// const applicationRoutes = require('./routes/applicant-routes');
const routes = require('./routes/routes')
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());
connectDB();
app.use('/admin',routes);
app.use('/',routes);
app.use('/application',routes)
app.listen(PORT, () => {
    console.log('Server listening on:', PORT);
})