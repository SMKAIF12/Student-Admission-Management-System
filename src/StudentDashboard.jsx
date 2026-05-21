import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import LoadingSpinner from './LoadingSpinner';
import InfoMessage from './InfoMessage';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
const StudentDashboard = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    // Simulating user and application state.
    const [studentName, setStudentName] = useState("");
    const token = localStorage.getItem('token');
    const currentUser = jwtDecode(token);
    const candidate = currentUser.id;
        // States for modal and password tracking
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [infoMessage,setInfoMessage] = useState({
        show:false,
        message:'',
        type:''
    })
    const [application, setApplication] = useState({
        id: "",
        courseName: "",
        instituteName: "",
        status: "", // Core operational status
        isApplicationFeePaid: false,    // Gatekeeper to official submission
        length: 0
    });
    const baseUrl = 'https://student-admission-management-system.vercel.app';
    const fetchData = async()=>{
        return await axios.get(`${baseUrl}/application/get/${candidate}`,{
            headers:{
                Authorization:`Bearer ${token}`
            }
        });
    }
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["activeApplication"],
        queryFn: () => fetchData()

    })
    useEffect(() => {
        if (data && !data.data.success) {
            setApplication(undefined);
        }
        else if (data && data.data && data.data.application) {
            const candidate = data.data.application;
            let course = "";let institute = "";
            if (candidate.allocatedCourse) {
                course = candidate.allocatedCourse.course.degree.endsWith('Technology') ? 'BTECH' : 'BE';
                institute = candidate.allocatedCourse.course.course;
            }
            else {
                course =  `${candidate.selectedCourses[0].course.degree.endsWith('Technology') ? 'BTECH' : 'BE'} - ${candidate.selectedCourses[0].course.course}`;
                institute = `${candidate.selectedCourses[0].institute.name}` ;
            }
            setStudentName(candidate.personalDetails.fullname);
            setApplication({
                id: candidate.applicationNumber,
                courseName: course,
                instituteName: institute,
                status: candidate.status,
                isApplicationFeePaid: candidate.fee === 'pending' ? false : true,
                length: candidate.selectedCourses.length - 1
            })
        }
    }, [data])
    if (isLoading) {
        return (
            <div className="container py-5 mt-5">
                <LoadingSpinner message="Fetching data..." />
            </div>
        );
    }
    if(isError) {
        return(
            <div>
                {error.message}
            </div>
        )
    }
    // Dynamic styles for the application badges based on fee lifecycle
    const getStatusBadgeClass = (status, isPaid) => {
        if (!isPaid) return 'bg-warning text-dark'; // Highlight attention for unpaid submissions
        switch(status) {
            case 'allocated': return 'bg-success text-white';
            case 'rejected': return 'bg-danger text-white';
            case 'applied': return 'bg-info text-dark';
            default: return 'bg-secondary text-white';
        }
    };

    // Close modal and reset state completely
    const handleCloseModal = () => {
        setShowWithdrawModal(false);
        setConfirmPassword("");
        setPasswordError("");
    };

    // Handle withdrawal/deletion submission with password verification
    const handleWithdrawSubmit = async(e) => {
        e.preventDefault();
        try {
            const response = await axios.delete(`${baseUrl}/application/withdraw`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                data: {
                    password: confirmPassword,
                    candidate: currentUser.id
                }
            });
            if (response.data) {
                setInfoMessage({
                    show: true,
                    message: 'Application Withdrawn Successfully!',
                    type: 'success'
                })
            }
        } catch (error) {
            setPasswordError(error.response.data.message || 'Invalid password');
        }
        // if (confirmPassword === "password") { 
        //     setApplication(null); 
        //     handleCloseModal();
        // } else {
        //     setPasswordError("Incorrect account password. Please try again.");
        // }
    };

    // Action execution handler for the Application Submission Fee
    const handleFeePaymentAndSubmit = async() => {
        try {
            const response = await axios.post(`${baseUrl}/application/payfee`,{candidate: currentUser.id}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.data) {
               setInfoMessage({
                show:true,
                message:'Fees paid Sucessfully.',
                type:'success'
               })
            }
        } catch (error) {
            setInfoMessage({
                show:true,
                message:'Fees not paid, Please try again.',
                type:'danger'
            })
        }
    };
    const formattedDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div className="container py-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', position: 'relative' }}>
            {
                infoMessage.show && (
                    <InfoMessage message={infoMessage.message} type={infoMessage.type} onClose={() => { setInfoMessage({ show: false, message: '', type: '' }); queryClient.invalidateQueries(["activeApplication"]) }} />
                )
            }
            {/* 1. Header Section */}
            <header className="d-flex justify-content-between align-items-center border-bottom pb-4 mb-4 flex-wrap gap-2">
                <div>
                    <h1 className="fw-extrabold text-dark m-0" style={{ fontSize: '1.75rem', color: '#1e1b4b' }}>
                        Welcome Back, {studentName}!
                    </h1>
                    <p className="text-muted small m-0 mt-1">Manage your academic profile and portal admissions seamlessly.</p>
                </div>
                <div className="text-end">
                    <span className="badge bg-light text-dark border px-3 py-2 fw-semibold shadow-sm">
                        <i className="bi bi-calendar3 me-2 text-primary"></i>{formattedDate}
                    </span>
                </div>
            </header>

            {/* 2. Primary Workspace Split */}
            <div className="row g-4">
                
                {/* --- MAIN COLUMN (75%) --- */}
                <main className="col-12 col-lg-9">
                    
                    {/* Active Applications Block */}
                    <section className="mb-4">
                        <h4 className="fw-bold mb-3 d-flex align-items-center" style={{ color: '#312e81' }}>
                            <i className="bi bi-file-earmark-text me-2"></i>Active Application
                        </h4>

                        {application ? (
                            <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
                                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                                    <div>
                                        <span className="badge bg-light text-muted border mb-2 fw-mono">ID: #{application.id}</span>
                                        <h4 className="fw-bold m-0">{application.courseName}</h4>
                                        <p className="text-muted m-0 mt-1">
                                            <i className="bi bi-building me-2 text-indigo"></i>{application.instituteName} <br />
                                             + {application.length} More..
                                        </p>
                                    </div>
                                    <span className={`badge px-3 py-2 rounded-pill fw-semibold ${getStatusBadgeClass(application.status, application.isApplicationFeePaid)}`}>
                                        <i className="bi bi-record-fill me-1 small"></i>
                                        {!application.isApplicationFeePaid ? 'Draft - Fee Pending' : application.status}
                                    </span>
                                </div>
                                
                                {/* Dynamic Workflow Informational Alerts Based on Application Fee Settlement */}
                                {!application.isApplicationFeePaid ? (
                                    <div className="p-3 bg-warning bg-opacity-10 text-dark rounded border-start border-4 border-warning mb-4 small">
                                        <i className="bi bi-credit-card-2-back-fill me-2 text-warning fs-6"></i>
                                        <strong>Submission Action Required:</strong> Your application details have been saved, but it has <strong>not been submitted</strong> to the institute yet. Please pay the application processing fee to formally route your file to the admissions desk.
                                    </div>
                                ) : (
                                    <div className="p-3 bg-light rounded border-start border-4 border-info mb-4 small text-secondary">
                                        <i className="bi bi-info-circle-fill me-2 text-info"></i>
                                        Your application fee has been verified. Your file is securely compiled and currently waiting verification from the admissions selection panel.
                                    </div>
                                )}

                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 border-top pt-3">
                                    <div className="d-flex gap-2">
                                        <button 
                                            className="btn btn-sm btn-primary fw-semibold px-3 shadow-sm"
                                            onClick={() => navigate('/student/view-application')}
                                            style={{ backgroundColor: '#4f46e5', borderColor: '#4f46e5' }}
                                        >
                                            <i className="bi bi-eye me-1"></i> View Application
                                        </button>

                                        {/* CRITICAL CALL TO ACTION: PAY FEE TO SUBMIT */}
                                        {!application.isApplicationFeePaid && (
                                            <button 
                                                className="btn btn-sm btn-success fw-bold px-3 shadow-sm animation-pulse"
                                                onClick={handleFeePaymentAndSubmit}
                                                style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                                            >
                                                <i className="bi bi-wallet2 me-1"></i> Pay Fee & Submit Application
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* Dynamically checks whether to render Delete Draft or Withdraw Application action text */}
                                    {(!application.isApplicationFeePaid || (application.status !== 'allocated' && application.status !== 'rejected')) && (
                                        <button 
                                            className="btn btn-sm btn-outline-danger fw-semibold px-3"
                                            onClick={() => setShowWithdrawModal(true)}
                                        >
                                            {application.isApplicationFeePaid ? (
                                                <><i className="bi bi-box-arrow-left me-1"></i> Withdraw Application</>
                                            ) : (
                                                <><i className="bi bi-trash3 me-1"></i> Delete Draft</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="card border-0 shadow-sm p-5 text-center bg-white rounded-3">
                                <div className="text-muted mb-3">
                                    <i className="bi bi-folder-plus" style={{ fontSize: '3rem' }}></i>
                                </div>
                                <h5 className="fw-bold">No Applications Running</h5>
                                <p className="text-muted mx-auto small mb-3" style={{ maxWidth: '420px' }}>
                                    You don't have an open entry record. Browse available courses or tap below to start an official application.
                                </p>
                                <button 
                                    className="btn btn-primary fw-semibold px-4 shadow-sm align-self-center"
                                    onClick={() => navigate('/student/apply')}
                                    style={{ backgroundColor: '#4f46e5', borderColor: '#4f46e5' }}
                                >
                                    Start Application
                                </button>
                            </div>
                        )}
                    </section>

                    {/* Recommended Programs Block */}
                    <section>
                        <h5 className="fw-bold mb-3 text-secondary d-flex align-items-center">
                            <i className="bi bi-stars me-2 text-warning"></i>Recommended Programs
                        </h5>
                        <div className="row g-3">
                            {/* Replace 'data.data.recommendedInstitutes' with the actual path 
          where your array of institutes is returned from your API response.
        */}
                            {data?.data?.recommendedInstitutes && data.data.recommendedInstitutes.length > 0 ? (
                                data.data.recommendedInstitutes.map((inst) => {
                                    // Safely grab the first offered course from the institute if it exists
                                    const primaryCourseWrapper = inst.offeredCourses?.[0];
                                    const courseDetails = primaryCourseWrapper?.courseId; // This is populated with the Course model object

                                    // If this institute doesn't have any offered courses setup, skip rendering this card
                                    if (!courseDetails) return null;

                                    // Dynamically format the degree prefix (BTECH or BE) using your endsWith check
                                    const degreePrefix = courseDetails.degree?.endsWith('Technology') ? 'BTECH' : 'BE';

                                    return (
                                        <div className="col-12 col-md-6" key={inst._id}>
                                            <div className="card border-0 shadow-sm h-100 bg-white rounded-3 p-3">
                                                <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                                                    {/* 1. Display the mapped course name */}
                                                    <h6 className="fw-bold m-0 text-dark">
                                                        {degreePrefix} - {courseDetails.course}
                                                    </h6>
                                                    {/* 2. Display the mapped institute code as a small badge */}
                                                    <span className="badge bg-light text-muted border fw-mono extra-small">
                                                        Code: {inst.code}
                                                    </span>
                                                </div>

                                                {/* 3. Display the mapped institute name */}
                                                <p className="text-muted small mb-3">
                                                    <i className="bi bi-building me-1 small text-indigo"></i> {inst.name}
                                                </p>

                                                <div className="mt-auto border-top pt-2 d-flex justify-content-between align-items-center">
                                                    {/* Displaying extra context from the offered course details array */}
                                                    <span className="small text-muted fw-semibold">
                                                        Seats Available: {primaryCourseWrapper.totalSeats - primaryCourseWrapper.filledSeats}
                                                    </span>
                                                    <button
                                                        className="btn btn-link btn-sm p-0 fw-bold text-decoration-none"
                                                        style={{ color: '#4f46e5' }}
                                                        onClick={() => navigate(`/student/explore/${inst._id}`)}
                                                    >
                                                        Explore <i className="bi bi-arrow-right"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                // Fallback content if the recommendations list is empty or hasn't loaded
                                <div className="col-12">
                                    <div className="p-3 bg-white text-muted rounded text-center small shadow-sm border border-dashed">
                                        No matching institutional recommendations found at this time.
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </main>

                {/* --- SIDEBAR COLUMN (25%) --- */}
                <aside className="col-12 col-lg-3">
                    <div className="card border-0 shadow-sm p-3 bg-white rounded-3 mb-4">
                        <h5 className="fw-bold border-bottom pb-2 mb-3 text-dark" style={{ fontSize: '1.05rem' }}>
                            <i className="bi bi-calendar-event me-2 text-danger"></i>Important Dates
                        </h5>
                        <ul className="list-unstyled m-0 d-flex flex-column gap-3">
                            <li className="d-flex align-items-start gap-2">
                                <div className="bg-danger bg-opacity-10 text-danger px-2 py-1 rounded small fw-bold text-center" style={{ minWidth: '55px', fontSize: '0.75rem' }}>
                                    JUN 01
                                </div>
                                <div className="small">
                                    <p className="fw-semibold m-0 text-dark" style={{ lineHeight: '1.2' }}>Fall Admissions Deadline</p>
                                    <span className="text-muted extra-small">Main Term Enrollment</span>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* --- HELP & CONTACT DETAILS SECTION --- */}
                    <div className="card border-0 shadow-sm p-3 bg-white rounded-3">
                        <h5 className="fw-bold border-bottom pb-2 mb-3 text-dark" style={{ fontSize: '1.05rem' }}>
                            <i className="bi bi-headset me-2 text-primary"></i>Help & Support
                        </h5>
                        <p className="text-muted extra-small mb-3">Experiencing portal issues or have admissions queries? Get in touch with our helpdesk.</p>
                        <ul className="list-unstyled m-0 d-flex flex-column gap-2 small text-secondary">
                            <li className="d-flex align-items-center gap-2">
                                <i className="bi bi-telephone text-primary"></i>
                                <span>+1 (800) 555-0199</span>
                            </li>
                            <li className="d-flex align-items-center gap-2">
                                <i className="bi bi-envelope text-primary"></i>
                                <a href="mailto:support@portal.edu" className="text-decoration-none text-secondary text-break">support@portal.edu</a>
                            </li>
                            <li className="d-flex align-items-center gap-2">
                                <i className="bi bi-clock text-primary"></i>
                                <span className="extra-small">Mon - Fri: 9:00 AM - 5:00 PM</span>
                            </li>
                        </ul>
                    </div>
                </aside>
            </div>

            {/* --- WITHDRAW/DELETE CONFIRMATION MODAL WITH PASSWORD CHECK --- */}
            {showWithdrawModal && (
                <>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
                    
                    <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050, top: '15%' }}>
                        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
                            <div className="modal-content border-0 shadow-lg rounded-3">
                                
                                <form onSubmit={handleWithdrawSubmit}>
                                    
                                    <div className="modal-header border-0 pt-4 px-4 d-flex align-items-start">
                                        <div className="bg-danger bg-opacity-10 text-danger p-3 rounded-circle me-3">
                                            <i className="bi bi-shield-lock-fill fs-4"></i>
                                        </div>
                                        <div className="flex-grow-1">
                                            {/* Dynamic Modal Title Selection */}
                                            <h5 className="modal-title fw-extrabold text-dark">
                                                {application?.isApplicationFeePaid ? "Withdraw Application" : "Delete Draft Application"}
                                            </h5>
                                            <p className="text-muted small m-0 mt-1">Confirm your account identity to proceed.</p>
                                        </div>
                                        <button type="button" className="btn-close shadow-none" onClick={handleCloseModal}></button>
                                    </div>
                                    
                                    <div className="modal-body px-4 py-2">
                                        {/* Dynamic Modal Body Text Selection */}
                                        <p className="text-secondary small mb-3">
                                            You are requesting to permanently {application?.isApplicationFeePaid ? "withdraw your active submission profile" : "delete your draft application file"} for <strong>{application?.courseName}</strong>. This clears your data from our queue instantly. Please input your password below to proceed.
                                        </p>
                                        
                                        {/* Password Input Box */}
                                        <div className="mb-2">
                                            <label className="form-label small fw-bold text-secondary mb-1">Account Password</label>
                                            <input 
                                                type="password" 
                                                className={`form-control form-control-sm shadow-none ${passwordError ? 'is-invalid' : ''}`}
                                                placeholder="••••••••" 
                                                value={confirmPassword}
                                                onChange={(e) => {
                                                    setConfirmPassword(e.target.value);
                                                    if (passwordError) setPasswordError(""); 
                                                }}
                                                required
                                            />
                                            {passwordError && (
                                                <div className="invalid-feedback small fw-semibold mt-1">
                                                    <i className="bi bi-exclamation-circle me-1"></i>{passwordError}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="modal-footer border-0 bg-light p-3 rounded-bottom-3 d-flex gap-2 justify-content-end">
                                        <button 
                                            type="button" 
                                            className="btn btn-sm btn-outline-secondary fw-semibold px-3" 
                                            onClick={handleCloseModal}
                                        >
                                            Cancel
                                        </button>
                                        {/* Dynamic Modal Submission Button Action Selection */}
                                        <button 
                                            type="submit" 
                                            className="btn btn-sm btn-danger fw-semibold px-3 shadow-sm"
                                            disabled={!confirmPassword.trim()}
                                        >
                                            {application?.isApplicationFeePaid ? "Verify & Withdraw" : "Verify & Delete"}
                                        </button>
                                    </div>

                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}

        </div>
    );
};

export default StudentDashboard;