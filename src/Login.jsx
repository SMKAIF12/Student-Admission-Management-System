import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios'; // Import Axios
import { jwtDecode } from 'jwt-decode';
const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('https://student-admission-management-system.vercel.app/login', formData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = response.data;
            localStorage.setItem('token', data.token);
            const user = jwtDecode(data.token);
            if (user && user.role === 'admin') {
                navigate('/admin/applications')
            }
            else {
                navigate('/student/dashboard')
            }
            // navigate('/student/dashboard')
        } catch (err) {
            // Axios automatically intercepts non-2xx status codes and puts them into the catch block
            if (err.response && err.response.data) {
                setError(err.response.data.message || 'Invalid credentials');
            } else {
                console.log(err);
                setError('Server error. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid vh-100 overflow-hidden bg-light">
            <div className="row h-100">

                {/* Left Side: Visual Branding Panel (hidden on small screens) */}
                <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center text-white p-5"
                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' }}>
                    <div style={{ maxWidth: '460px' }}>
                        <h1 className="display-3 fw-extrabold mb-1 tracking-tight">SAMS</h1>
                        <p className="lead text-light opacity-75 mb-0">Student Admission Management System</p>
                        <div className="my-4 bg-warning" style={{ height: '4px', width: '60px' }}></div>
                        <p className="lh-lg text-light opacity-90">
                            Your portal to academic excellence. Manage applications, view counseling cutoffs, and secure your future seamlessly.
                        </p>
                    </div>
                </div>

                {/* Right Side: Login Interactive Form */}
                <div className="col-10 col-sm-8 col-md-6 mx-auto d-flex align-items-center justify-content-center p-4">
                    <div className="w-100" style={{ maxWidth: '420px' }}>

                        <h2 className="fw-bold text-dark mb-1">Welcome Back</h2>
                        <p className="text-muted mb-4 small">Please sign in to access your dashboard</p>

                        {/* Error Message Box */}
                        {error && (
                            <div className="alert alert-danger d-flex align-items-center m-0 mb-4 py-2 px-3 small border-0 shadow-sm" role="alert">
                                <div>{error}</div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">

                            {/* Email Input */}
                            <div className="form-group">
                                <label className="form-label fw-semibold text-secondary small">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    className="form-control py-2.5 shadow-sm"
                                    placeholder="name@university.edu"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Password Input */}
                            <div className="form-group">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <label className="form-label fw-semibold text-secondary small m-0">Password</label>
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    className="form-control py-2.5 shadow-sm"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn text-white fw-bold py-2.5 mt-2 shadow-sm"
                                style={{ backgroundColor: '#4f46e5', borderColor: '#4f46e5' }}
                            >
                                {loading ? (
                                    <div className="d-flex align-items-center justify-content-center gap-2">
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        <span>Authenticating...</span>
                                    </div>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        {/* Footer Text */}
                        <p className="text-center text-muted small mt-4 pt-2">
                            New applicant? <span className="text-decoration-none text-primary fw-bold ms-1" onClick={() => { navigate('/register') }} style={{cursor:'pointer'}}>Create an account</span>
                        </p>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;