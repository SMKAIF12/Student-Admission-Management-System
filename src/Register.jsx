import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios'; // Import Axios

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    setSuccess('');

    // Client-side validation: Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      // Replaced fetch with axios.post
      // We pass only the properties needed by your backend register controller (name, email, password)
      const response = await axios.post('http://localhost:3000/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Axios puts the parsed body payload natively inside the '.data' object
      const data = response.data;
      if (data) {
        setSuccess('Account registered successfully! Redirecting to login...');
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      }
      // Redirect to login page after 2 seconds using the router's navigate method
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      // Axios routes failure statuses (like 409 Conflict) directly into the catch block
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Registration failed');
      } else {
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
              Create an account to submit your academic details, compute your admission cutoffs automatically, and apply to top engineering courses.
            </p>
          </div>
        </div>

        {/* Right Side: Register Interactive Form */}
        <div className="col-10 col-sm-8 col-md-6 mx-auto d-flex align-items-center justify-content-center p-4">
          <div className="w-100" style={{ maxWidth: '420px' }}>
            
            <h2 className="fw-bold text-dark mb-1">Create Account</h2>
            <p className="text-muted mb-4 small">Register as a prospective applicant</p>

            {/* Error Message Box */}
            {error && (
              <div className="alert alert-danger d-flex align-items-center m-0 mb-4 py-2 px-3 small border-0 shadow-sm" role="alert">
                <div>{error}</div>
              </div>
            )}

            {/* Success Message Box */}
            {success && (
              <div className="alert alert-success d-flex align-items-center m-0 mb-4 py-2 px-3 small border-0 shadow-sm" role="alert">
                <div>{success}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              
              {/* Full Name Input */}
              <div className="form-group">
                <label className="form-label fw-semibold text-secondary small">Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  className="form-control py-2.5 shadow-sm"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              {/* Email Input */}
              <div className="form-group">
                <label className="form-label fw-semibold text-secondary small">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  className="form-control py-2.5 shadow-sm"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {/* Password Input */}
              <div className="form-group">
                <label className="form-label fw-semibold text-secondary small">Password</label>
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

              {/* Confirm Password Input */}
              <div className="form-group">
                <label className="form-label fw-semibold text-secondary small">Confirm Password</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  required 
                  className="form-control py-2.5 shadow-sm"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
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
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Register'
                )}
              </button>
            </form>

            {/* Footer Text */}
            <p className="text-center text-muted small mt-4 pt-2">
              Already have an account? <span className="text-decoration-none text-primary fw-bold ms-1" onClick={() => { navigate('/login') }} style={{ cursor: 'pointer' }}>Sign In</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;