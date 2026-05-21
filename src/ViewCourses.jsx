import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import LoadingSpinner from './LoadingSpinner';

const ViewCourses = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const token = localStorage.getItem('token');
    const baseUrl = 'https://student-admission-management-system.vercel.app';

    // State parameters for searching, structural filtering, and system messaging
    const [searchTerm, setSearchTerm] = useState("");
    const [degreeFilter, setDegreeFilter] = useState("all");
    const [localNotice, setLocalNotice] = useState({ show: false, message: '', type: '' });

    // ✅ ADDED: Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Fetching all courses from the server endpoint mapping stack
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["allGlobalCoursesCatalogList"],
        queryFn: async () => {
            const response = await axios.get(`${baseUrl}/admin/course/get`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data?.courses || response.data || [];
        }
    });

    // Mutation Pipeline: Handles wiping out a course and triggers cascade array cleanup
    const deleteCourseMutation = useMutation({
        mutationFn: async (courseId) => {
            return await axios.delete(`${baseUrl}/admin/course/delete/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: (response) => {
            setLocalNotice({
                show: true,
                message: response.data?.message || 'Course program wiped from the database successfully.',
                type: 'success'
            });
            // Instantly sync cache keys across all workspace components
            queryClient.invalidateQueries(["allGlobalCoursesCatalogList"]);
            queryClient.invalidateQueries(["allInstitutesList"]);
        },
        onError: (err) => {
            setLocalNotice({
                show: true,
                message: err.response?.data?.message || 'Failed to remove the selected course discipline.',
                type: 'danger'
            });
        }
    });

    const handleDeleteClick = (id, title) => {
        if (window.confirm(`CRITICAL WARNING: Are you sure you want to completely delete "${title}"? This will automatically remove this program from all affiliated institutes' offering sheets.`)) {
            deleteCourseMutation.mutate(id);
        }
    };

    // Routes to add/edit view passing data inside history state layers
    const handleEditClick = (courseItem) => {
        navigate('/admin/addcourse', { state: { editMode: true, courseData: courseItem } });
    };

    if (isLoading) {
        return (
            <div className="container py-5 mt-5">
                <LoadingSpinner message="Querying active academic course disciplines catalog..." />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="container py-5 mt-5">
                <div className="alert alert-danger border-start border-4 border-danger p-4 shadow-sm rounded-3">
                    <h5 className="fw-bold text-dark">
                        <i className="bi bi-exclamation-octagon-fill me-2 text-danger"></i>Data Engine Failure
                    </h5>
                    <p className="text-secondary small m-0 mt-1">{error.message}</p>
                </div>
            </div>
        );
    }

    const courses = Array.isArray(data) ? data : [];

    // Multi-parameter evaluation filtering both text keywords and explicit dropdown selection strings
    const filteredCourses = courses.filter(item => {
        const title = item.course?.toLowerCase() || "";
        const code = item.code?.toLowerCase() || "";
        const degree = item.degree?.toLowerCase() || "";
        const target = searchTerm.toLowerCase();

        // 1. Text keyword lookup mapping
        const matchesSearch = title.includes(target) || code.includes(target) || degree.includes(target);
        
        // 2. Dropdown category match evaluation against schema enums
        if (degreeFilter === "all") return matchesSearch;
        return matchesSearch && item.degree === degreeFilter;
    });

    // ✅ ADDED: Pagination Logic Calculations
    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredCourses.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="container py-5" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            
            {localNotice.show && (
                <div className={`alert alert-${localNotice.type} alert-dismissible fade show shadow-sm border-0 mb-4 p-3 d-flex justify-content-between align-items-center`} role="alert">
                    <span className="small fw-semibold"><i className="bi bi-info-circle-fill me-2"></i>{localNotice.message}</span>
                    <button type="button" className="btn-close shadow-none small" onClick={() => setLocalNotice({ show: false, message: '', type: '' })}></button>
                </div>
            )}

            {/* Main Header Presentation banner */}
            <div className="card border-0 shadow-sm rounded-3 overflow-hidden mb-4">
                <div className="p-4 text-white d-flex justify-content-between align-items-center flex-wrap gap-3"
                     style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' }}>
                    <div>
                        <h3 className="fw-extrabold m-0 tracking-tight">
                            <i className="bi bi-journal-bookmark-fill me-2" style={{ color: '#f59e0b' }}></i>Academic Courses Catalog
                        </h3>
                        <p className="text-white-50 m-0 mt-1 small">Manage standardized academic specializations, degrees, and course properties globally.</p>
                    </div>
                    <span className="badge bg-white text-indigo px-3 py-2 fw-bold border text-nowrap" style={{ color: '#4f46e5' }}>
                        Total Programs: {filteredCourses.length}
                    </span>
                </div>

                {/* INTERFACE TOOLBAR: Two-column layout integrating structural filtering */}
                <div className="card-body bg-light border-bottom p-3">
                    <div className="row g-3 align-items-center">
                        <div className="col-12 col-md-8">
                            <div className="input-group input-group-sm">
                                <span className="input-group-text bg-white text-muted border-end-0"><i className="bi bi-search"></i></span>
                                <input 
                                    type="text" 
                                    className="form-control border-start-0 shadow-none py-2" 
                                    placeholder="Search programs by course name, uppercase code, or description content..."
                                    value={searchTerm}
                                    // ✅ ADDED: Reset page to 1 on search
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                />
                            </div>
                        </div>
                        <div className="col-12 col-md-4">
                            {/* Category selector linked with exact schema enum strings */}
                            <select
                                className="form-select form-select-sm shadow-none py-2 text-secondary fw-semibold bg-white"
                                value={degreeFilter}
                                // ✅ ADDED: Reset page to 1 on filter
                                onChange={(e) => { setDegreeFilter(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="all">🔍 Show All Streams</option>
                                <option value="Bachelor of Engineering">🎓 B.E. (Bachelor of Engineering)</option>
                                <option value="Bachelor Of Technology">🔬 B.Tech (Bachelor of Technology)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid distribution displaying programs */}
            <div className="row g-4">
                
                {/* INTERACTIVE DASHED "ADD NEW COURSE" CARD PLACEHOLDER ELEMENT */}
                <div className="col-12 col-md-6 col-lg-4">
                    <div 
                        className="card h-100 d-flex flex-column align-items-center justify-content-center text-center p-4 rounded-3 border-dashed-custom bg-white cursor-pointer transition-all animate-hover-box"
                        onClick={() => navigate('/admin/addcourse')}
                        style={{ minHeight: '230px' }}
                    >
                        <div className="mb-2 rounded-circle bg-indigo bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: '52px', height: '52px', color: '#4f46e5' }}>
                            <i className="bi bi-journal-plus fs-4"></i>
                        </div>
                        <h6 className="fw-bold text-dark m-0">Add New Program</h6>
                        <p className="text-muted extra-small mt-1 mb-0" style={{ maxWidth: '220px' }}>
                            Provision a new engineering or technology specialization to expand counseling intake boundaries.
                        </p>
                    </div>
                </div>

                {/* RENDERING DYNAMIC COURSE DATABASE CARDS */}
                {/* ✅ UPDATED: Map over currentItems instead of filteredCourses */}
                {currentItems.length > 0 ? (
                    currentItems.map((item) => {
                        const isTech = item.degree === 'Bachelor Of Technology';

                        return (
                            <div className="col-12 col-md-6 col-lg-4" key={item._id}>
                                <div className="card border-0 shadow-sm h-100 bg-white rounded-3 overflow-hidden border hover-card-trigger position-relative d-flex flex-column justify-content-between">
                                    
                                    <div>
                                        {/* Card Top Pill Badge Strip */}
                                        <div className="card-header bg-white pt-3 px-3.5 border-0 pb-1 d-flex justify-content-between align-items-center flex-wrap gap-1">
                                            <span className="badge bg-light text-muted border fw-mono extra-small">CODE: {item.code}</span>
                                            <span className={`badge rounded-pill px-2.5 py-1 text-uppercase font-semibold tracking-wide extra-small-tag ${isTech ? 'bg-info bg-opacity-10 text-info-dark' : 'bg-primary bg-opacity-10 text-primary-dark'}`}>
                                                {isTech ? 'B.Tech' : 'B.E.'}
                                            </span>
                                        </div>

                                        {/* Main Text Container Section */}
                                        <div className="card-body px-3.5 pt-2 pb-3">
                                            <h6 className="fw-bold text-dark m-0 mb-2 tracking-tight lh-base" style={{ fontSize: '1.05rem' }}>
                                                {item.course}
                                            </h6>
                                            <p className="text-secondary font-medium extra-small m-0 text-clamp-3">
                                                {item.description || "No description overview provisioned for this program specialization discipline row."}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons Strip */}
                                    <div className="p-2 bg-light d-flex justify-content-end gap-1 px-3 border-top">
                                        <button 
                                            type="button" 
                                            className="btn btn-xs btn-outline-primary border-0 shadow-none py-1 px-2 rounded-2 d-flex align-items-center fw-bold text-uppercase extra-small style-btn-action"
                                            onClick={() => handleEditClick(item)}
                                        >
                                            <i className="bi bi-pencil-square me-1 fs-6"></i>Edit
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-xs btn-outline-danger border-0 shadow-none py-1 px-2 rounded-2 d-flex align-items-center fw-bold text-uppercase extra-small style-btn-action-delete"
                                            disabled={deleteCourseMutation.isPending}
                                            onClick={() => handleDeleteClick(item._id, item.course)}
                                        >
                                            <i className="bi bi-trash3-fill me-1 fs-6"></i>Delete
                                        </button>
                                    </div>

                                </div>
                            </div>
                        );
                    })
                ) : searchTerm.trim() !== "" || degreeFilter !== "all" ? (
                    <div className="col-12 col-md-6 col-lg-8">
                        <div className="card border-0 shadow-sm p-5 text-center bg-white rounded-3 h-100 d-flex align-items-center justify-content-center">
                            <i className="bi bi-journal-x text-muted mb-2" style={{ fontSize: '2.5rem' }}></i>
                            <h5 className="fw-bold text-dark">No Matching Courses</h5>
                            <p className="text-muted small mx-auto m-0 mt-1" style={{ maxWidth: '300px' }}>
                                No program entries found matching your lookups inside the structural schema data matrices.
                            </p>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* ✅ ADDED: Pagination Footer */}
            {filteredCourses.length > 0 && (
                <div className="d-flex align-items-center justify-content-between p-3 mt-4 border bg-white rounded-3 shadow-sm">
                    <div className="small text-muted">
                        Showing {filteredCourses.length === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCourses.length)} of {filteredCourses.length} entries
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <button 
                            className="btn btn-sm btn-outline-secondary" 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                            disabled={currentPage === 1}
                        >
                            Prev
                        </button>
                        <span className="small text-muted">Page</span>
                        <input 
                            type="number" 
                            className="form-control form-control-sm text-center shadow-none" 
                            style={{ width: '60px' }}
                            value={currentPage}
                            onChange={(e) => {
                                const page = Number(e.target.value);
                                if (page >= 1 && page <= totalPages) setCurrentPage(page);
                            }}
                        />
                        <span className="small text-muted">of {totalPages || 1}</span>
                        <button 
                            className="btn btn-sm btn-outline-secondary" 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                            disabled={currentPage === totalPages || totalPages === 0}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Embedded Micro-Transitions and Specialized Color Utilities */}
            <style>{`
                .hover-card-trigger { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
                .hover-card-trigger:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05) !important; }
                .text-indigo { color: #4f46e5 !important; }
                .extra-small { font-size: 0.75rem !important; }
                .extra-small-tag { font-size: 0.68rem !important; letter-spacing: 0.3px; }
                .text-info-dark { color: #0284c7 !important; }
                .text-primary-dark { color: #4338ca !important; }
                .cursor-pointer { cursor: pointer !important; }
                .border-dashed-custom {
                    border: 2.5px dashed #cbd5e1 !important;
                    transition: all 0.2s ease-in-out;
                }
                .border-dashed-custom:hover {
                    border-color: #4f46e5 !important;
                    background-color: #f8fafc !important;
                    transform: scale(1.01);
                }
                .style-btn-action:hover { background-color: #f0fdf4 !important; color: #16a34a !important; }
                .style-btn-action-delete:hover { background-color: #fef2f2 !important; color: #dc2626 !important; }
                .text-clamp-3 {
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;  
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
};

export default ViewCourses;