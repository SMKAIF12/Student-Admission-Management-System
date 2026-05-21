const multer = require('multer');
const storage = multer.memoryStorage(); // CRITICAL for Vercel
const upload = multer({ storage: storage });

// Use these exact names in your Frontend FormData
router.post('/submit', upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'sslc', maxCount: 1 },
    { name: 'hsc', maxCount: 1 }
]), createApplication);