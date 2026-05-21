import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import InfoMessage from './InfoMessage';

const AddCourse = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const token = localStorage.getItem('token');
    const baseUrl = 'https://student-admission-management-system.vercel.app';

    // Safely verify if the user clicked 'Add' or 'Edit' from the course matrix screen
    const isEditMode = !!location.state?.editMode;
    const existingData = location.state?.courseData || null;

    const [errorMsg, setErrorMsg] = useState("");
    const [notice, setNotice] = useState({ show: false, message: '', type: '' });

    // 🔑 PRESERVED SCHEMA FIELDS: Maps directly to the parameters needed by Course.js schema
    const [formData, setFormData] = useState({
        code: "",
        degree: "",
        course: "",
        description: ""
    });

    // Automatically pre-fill the form inputs if editing an existing course program record
    useEffect(() => {
        if (isEditMode && existingData) {
            setFormData({
                code: existingData.code || "",
                degree: existingData.degree || "",
                course: existingData.course || "",
                description: existingData.description || ""
            });
        }
    }, [isEditMode, existingData]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // TanStack Mutation pipeline: Automatically switches network endpoint contexts based on edit state flags
    const submitCourseMutation = useMutation({
        mutationFn: async (payload) => {
            if (isEditMode) {
                // PUT request to update the record
                return await axios.put(`${baseUrl}/admin/course/edit/${existingData._id}`, payload, {
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
                });
            } else {
                // POST request to create a brand new program entry
                return await axios.post(`${baseUrl}/admin/course/add`, payload, {
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
                });
            }
        },
        onSuccess: (response) => {
            setNotice({
                show: true,
                message: response.data?.message || `Course specialization successfully ${isEditMode ? 'updated' : 'registered'}!`,
                type: 'success'
            });
            // Force React Query to wipe out stale cache trees globally
            queryClient.invalidateQueries(["allGlobalCoursesCatalogList"]);
            queryClient.invalidateQueries(["allInstitutesList"]);
        },
        onError: (error) => {
            setErrorMsg(error.response?.data?.message || "Failed to process course program updates.");
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMsg("");

        // Structural constraint checks matching model expectations
        if (!formData.code.trim() || !formData.degree || !formData.course.trim()) {
            setErrorMsg("Course name, program code, and degree selection are mandatory fields.");
            return;
        }

        const finalPayload = {
            code: formData.code.toUpperCase().trim(), // Force uppercase indexing rule constraint
            degree: formData.degree,
            course: formData.course.trim(),
            description: formData.description.trim()
        };

        submitCourseMutation.mutate(finalPayload);
    };

    return (
        <div className="container py-5" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {notice.show && (
                <InfoMessage 
                    message={notice.message} 
                    type={notice.type} 
                    // Redirects back to the main management grid upon notice acknowledgement
                    onClose={() => { setNotice({ show: false, message: '', type: '' }); navigate('/admin/courses'); }} 
                />
            )}

            <div className="card border-0 shadow mx-auto rounded-3" style={{ maxWidth: '680px' }}>
                {/* Visual Style Consistency: Switches to light blue gradient if editing, deep indigo if creating */}
                <div className="card-header border-0 text-white p-4" 
                     style={{ background: isEditMode ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' }}>
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <h3 className="fw-extrabold m-0">
                                <i className={`bi ${isEditMode ? 'bi-pencil-square' : 'bi-journal-plus'} me-2`}></i>
                                {isEditMode ? `Modify ${existingData?.course}` : 'Provision New Course'}
                            </h3>
                            <p className="text-white-50 m-0 mt-1 small">Configure engineering branch specializations and degree catalog attributes.</p>
                        </div>
                        <button type="button" className="btn btn-sm btn-light text-dark fw-bold px-3 py-2" onClick={() => navigate('/admin/courses')}>
                            <i className="bi bi-arrow-left me-1"></i> Back
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="card-body p-4 bg-white" autoComplete="off">
                    {errorMsg && (
                        <div className="alert alert-danger p-3 mb-4 rounded-3 small">
                            <i className="bi bi-exclamation-triangle-fill me-2"></i>{errorMsg}
                        </div>
                    )}

                    <fieldset className="mb-3">
                        <legend className="fw-bold fs-6 text-indigo mb-3"><i className="bi bi-bookmark-star-fill me-2"></i>Program Core Parameters</legend>
                        <div className="row g-3">
                            
                            {/* Course Structural Title Name */}
                            <div className="col-12">
                                <label className="form-label small fw-bold text-secondary">Course Specialization Title Name</label>
                                <input 
                                    type="text" 
                                    name="course" 
                                    className="form-control form-control-sm shadow-none" 
                                    placeholder="e.g. Computer Science and Engineering" 
                                    value={formData.course} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>

                            {/* Program Code Acronym Input */}
                            <div className="col-12 col-md-6">
                                <label className="form-label small fw-bold text-secondary">Unique Course Identifier Code</label>
                                <input 
                                    type="text" 
                                    name="code" 
                                    className="form-control form-control-sm shadow-none text-uppercase font-mono" 
                                    placeholder="e.g. 1000" 
                                    value={formData.code} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>

                            {/* Degree Classification Dropdown Enum Selector */}
                            <div className="col-12 col-md-6">
                                <label className="form-label small fw-bold text-secondary">Degree Type Classification</label>
                                <select 
                                    name="degree" 
                                    className="form-select form-select-sm shadow-none text-dark fw-medium"
                                    value={formData.degree}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">-- Select Qualification Stream --</option>
                                    <option value="Bachelor of Engineering">B.E. (Bachelor of Engineering)</option>
                                    <option value="Bachelor Of Technology">B.Tech (Bachelor Of Technology)</option>
                                </select>
                            </div>

                            {/* Descriptive text area summary block */}
                            <div className="col-12">
                                <label className="form-label small fw-bold text-secondary">Course Description Overview (Optional)</label>
                                <textarea 
                                    name="description" 
                                    rows="4" 
                                    className="form-control form-control-sm shadow-none" 
                                    placeholder="Provide a brief summary of syllabus focus areas, elective options, or target core industries..."
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </div>

                        </div>
                    </fieldset>

                    {/* ACTION SUBMIT CONTROL FOOTER STRIP */}
                    <div className="modal-footer border-top pt-3 d-flex gap-2 justify-content-end">
                        <button type="button" className="btn btn-sm btn-outline-secondary fw-semibold px-4" onClick={() => navigate('/admin/courses')} disabled={submitCourseMutation.isPending}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-sm text-white fw-bold px-4 shadow-sm" disabled={submitCourseMutation.isPending} 
                                style={{ backgroundColor: isEditMode ? '#0284c7' : '#4f46e5', borderColor: isEditMode ? '#0284c7' : '#4f46e5' }}>
                            {submitCourseMutation.isPending ? (
                                <><span className="spinner-border spinner-border-sm me-2"></span>Saving changes...</>
                            ) : (
                                <><i className={`bi ${isEditMode ? 'bi-check-circle' : 'bi-plus-circle'} me-1`}></i> {isEditMode ? 'Save Changes' : 'Register Program'}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCourse;