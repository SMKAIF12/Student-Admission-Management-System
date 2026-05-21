const User = require('../models/User')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const currentUser = await User.findOne({ email });
        if (!currentUser) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const isPasswordMatched = await bcrypt.compare(password, currentUser.password);
        if (!isPasswordMatched) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const webToken = jwt.sign({
            username: currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
            id: currentUser.id
        }, process.env.JWT_SECRET_KEY, { expiresIn: '30m' })
        return res.status(200).json({ success: true, message: 'Login successful!', token: webToken });
    } catch (error) {
        res.status(500).json({ success: false, message: `Error occured: ${error}` })
    }
}
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await User.findOne({ email });
        if (user) {
            return res.status(409).json({ success: false, message: 'User already registered with this email' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = await User.create({ name: name, email: email, password: hashedPassword})
        if (!newUser) {
            return res.status(500).json({ success: false, message: `Failed to Register, Please try again` })
        }
        return res.status(200).json({ success: true, message: 'User registered successfully', data: newUser })
    } catch (error) {
        res.status(500).json({ success: false, message: `Error occured: ${error}` });
    }
}
const auth = async (req, res)=>{
    return res.status(201).json({success:true,message:'User verified',user: req.userInfo})
}
module.exports = { login, register, auth }