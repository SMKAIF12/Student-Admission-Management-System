import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {jwtDecode} from 'jwt-decode'
const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [displayWithName, setDisplayWithName] = useState("User");
    const token = localStorage.getItem('token');
    const user = jwtDecode(token);
    useEffect(() => {
        setDisplayWithName(user.username);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('studentName');
        navigate('/login');
    };

    // Synchronizes structural link states directly with your primary login/register themes
    const getTabStyle = (path) => {
        const baseStyle = { 
            cursor: 'pointer', 
            transition: 'all 0.2s ease-in-out', 
            fontWeight: '500',
            borderBottom: '2px solid transparent',
            paddingBottom: '4px'
        };
        
        if (location.pathname === path) {
            return { 
                ...baseStyle, 
                color: '#ffffff', // Active state turns crisp white
                fontWeight: '700',
                borderBottom: '2px solid #f59e0b' // Highlight active path with the signature login accent line
            };
        }
        return { 
            ...baseStyle, 
            color: '#e0e7ff', // Soft lavender hue for unselected links
            opacity: '0.85'
        };
    };

    return (
        <nav className="navbar navbar-expand-lg sticky-top shadow-sm py-3" 
             style={{ 
                 background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', // Matches the login split-screen gradient path
                 boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
             }}>
            <div className="container px-4">
                
                {/* Brand / Logo */}
                <span 
                    className="navbar-brand fw-extrabold text-white tracking-tight d-flex align-items-center" 
                    onClick={() => navigate('/student/dashboard')}
                    style={{ cursor: 'pointer', letterSpacing: '0.5px', fontSize: '1.4rem' }}
                >
                    <i className="bi bi-mortarboard-fill me-2" style={{ color: '#f59e0b' }}></i>SAMS Portal
                </span>

                {/* Mobile Responsive Toggler */}
                <button 
                    className="navbar-toggler border-0 text-white" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#studentNavbarContent" 
                    aria-controls="studentNavbarContent" 
                    aria-expanded="false" 
                    aria-label="Toggle navigation"
                    style={{ filter: 'invert(1)' }} // Inverts standard dark hamburger lines to white
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* Navbar Content and Links */}
                <div className="collapse navbar-collapse" id="studentNavbarContent">
                    
                    {/* Centered Main Navigation Tabs */}
                    <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-3">
                        <li className="nav-item" style={{display:user.role==='student'?'block':'none'}}>
                            <span 
                                className="nav-link btn text-start px-3"
                                onClick={() => navigate('/student/dashboard')}
                                style={getTabStyle('/student/dashboard')}
                            >
                                <i className="bi bi-grid-1x2 me-2"></i>
                                Dashboard
                            </span>
                        </li>
                        <li className="nav-item" style={{display:user.role==='student'?'block':'none'}}>
                            <span 
                                className="nav-link btn text-start px-3"
                                onClick={() => navigate('/student/apply')}
                                style={getTabStyle('/student/apply')}
                            >
                                <i className="bi bi-file-earmark-plus me-2"></i>Apply for Admission
                            </span>
                        </li>
                        <li className="nav-item" style={{display:user.role==='admin'?'block':'none'}}>
                            <span 
                                className="nav-link btn text-start px-3"
                                onClick={() => navigate('/admin/applications')}
                                style={getTabStyle('/admin/applications')}
                            >
                                <i className="bi bi-people me-2"></i>Applications
                            </span>
                        </li>
                        <li className="nav-item" style={{display:user.role === 'student'? 'none':'block'}}>
                            <span 
                                className="nav-link btn text-start px-3"
                                onClick={() => navigate('/admin/institutes')}
                                style={getTabStyle('/admin/institutes')}
                            >
                               <i className="bi bi-building"></i> Institutes
                            </span>
                        </li>
                        <li className="nav-item" style={{display:user.role === 'student'? 'none':'block'}}>
                            <span 
                                className="nav-link btn text-start px-3"
                                onClick={() => navigate('/admin/courses')}
                                style={getTabStyle('/admin/courses')}
                            >
                               <i className="bi bi-journal-bookmark-fill"></i> Courses
                            </span>
                        </li>
                        <li className="nav-item" style={{display:'none'}}>
                            <span 
                                className="nav-link btn text-start px-3"
                                onClick={() => navigate('/student/view-application')}
                                style={getTabStyle('/student/view-application')}
                            >
                                <i className="bi bi-eye me-2"></i>View My Application
                            </span>
                        </li>
                    </ul>

                    {/* Right Side Profile Context and Sign Out */}
                    <div className="d-flex align-items-center gap-3 mt-3 mt-lg-0">
                        <div className="small d-none d-sm-block text-white-50">
                            <i className="bi bi-person-circle me-2" style={{ color: '#f59e0b' }}></i> 
                            Hello, <span className="fw-semibold text-white">{displayWithName}</span>
                        </div>
                        
                        <div className="bg-white opacity-25 d-none d-lg-block" style={{ width: '1px', minHeight: '20px' }}></div>
                        
                        <button 
                            className="btn btn-sm text-white fw-bold d-flex align-items-center gap-1 px-3 py-2 shadow-sm"
                            onClick={handleLogout}
                            style={{ 
                                backgroundColor: '#e54646', // Replaced the harsh red with login component button theme
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '6px',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3730a3'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                        >
                            <i className="bi bi-box-arrow-right"></i> Sign Out
                        </button>
                    </div>

                </div>
            </div>
        </nav>
    );
};

export default Navbar;