const jwt = require('jsonwebtoken');
const authMiddleWare = (req, res, next) => {
    const header = req.headers['authorization'];
    const token = header && header.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({ success: false, message: 'Access denied, Invalid Token. Please login to continue' })
    }
    try {
        const verifiedUser = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (!verifiedUser) {
            return res.status(401).json({ success: false, message: 'Access denied, Invalid Token. Please login to continue' })
        }
        req.userInfo = verifiedUser;
        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: error })
    }
}
const validateAdmin = (req, res, next) => {
    if (!req.userInfo) {
        return res.status(401).json({ success: false, message: 'Access denied, Invalid Token. Please login to continue' })
    }
    if (req.userInfo.role === 'admin') {
        next();
    }
    else {
        return res.status(401).json({ success: false, message: 'Access denied' });
    }
}
module.exports = { authMiddleWare, validateAdmin }