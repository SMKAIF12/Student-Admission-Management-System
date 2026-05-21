import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import LoadingSpinner from './LoadingSpinner';

const ViewInstitutes = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const token = localStorage.getItem('token');
    const baseUrl = 'https://student-admission-management-system.vercel.app';

    // State parameters for searching and multi-mode ordering metrics
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState("none"); 
    const [localNotice, setLocalNotice] = useState({ show: false, message: '', type: '' });

    // ✅ ADDED: Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Adjust if you want fewer cards per page

    // Fetching all institutes from the server mapping stack
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["allInstitutesList"],
        queryFn: async () => {
            const response = await axios.get(`${baseUrl}/application/institutes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data?.institutes || response.data || [];
        }
    });

    // Handles deleting an institute record permanently
    const deleteInstituteMutation = useMutation({
        mutationFn: async (instituteId) => {
            return await axios.delete(`${baseUrl}/admin/institutes/${instituteId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: (response) => {
            setLocalNotice({
                show: true,
                message: response.data?.message || 'Institute record wiped from the grid successfully.',
                type: 'success'
            });
            queryClient.invalidateQueries(["allInstitutesList"]);
        },
        onError: (err) => {
            setLocalNotice({
                show: true,
                message: err.response?.data?.message || 'Failed to remove the requested institute element.',
                type: 'danger'
            });
        }
    });

    const handleDeleteClick = (id, name) => {
        if (window.confirm(`CRITICAL WARNING: Are you sure you want to completely delete "${name}"? This action removes all mapped seat structures and cannot be undone.`)) {
            deleteInstituteMutation.mutate(id);
        }
    };

    // Routes to edit view passing existing data inside history state layers
    const handleEditClick = (inst) => {
        navigate('/admin/addinstitute', { state: { editMode: true, instituteData: inst } });
    };

    // Cycles sort state: None -> Ascending -> Descending -> None
    const handleSortToggle = () => {
        if (sortOrder === "none") setSortOrder("asc");
        else if (sortOrder === "asc") setSortOrder("desc");
        else setSortOrder("none");
        setCurrentPage(1); // ✅ ADDED: Reset page to 1 when sorting changes
    };

    if (isLoading) {
        return (
            <div className="container py-5 mt-5">
                <LoadingSpinner message="Querying registered educational campuses..." />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="container py-5 mt-5">
                <div className="alert alert-danger border-start border-4 border-danger p-4 shadow-sm rounded-3">
                    <h5 className="fw-bold text-dark">
                        <i className="bi bi-exclamation-octagon-fill me-2 text-danger"></i>Data Fetch Failure
                    </h5>
                    <p className="text-secondary small m-0 mt-1">{error.message}</p>
                </div>
            </div>
        );
    }

    const institutes = Array.isArray(data) ? data : [];

    // Filter down matching lists first
    const filteredInstitutes = institutes.filter(inst => {
        const name = inst.name?.toLowerCase() || "";
        const code = inst.code?.toLowerCase() || "";
        const area = inst.location?.area?.toLowerCase() || "";
        const city = inst.location?.city?.toLowerCase() || "";
        const legacyLoc = typeof inst.location === 'string' ? inst.location.toLowerCase() : "";
        const target = searchTerm.toLowerCase();

        return name.includes(target) || code.includes(target) || area.includes(target) || city.includes(target) || legacyLoc.includes(target);
    });

    // Isolated safe sort matrix block supporting explicit Ascending vs Descending values alternation
    const displayedInstitutes = sortOrder === "none" 
        ? filteredInstitutes 
        : [...filteredInstitutes].sort((a, b) => {
            const rankA = a.ranking !== undefined && a.ranking !== null ? Number(a.ranking) : (sortOrder === "asc" ? Infinity : -Infinity);
            const rankB = b.ranking !== undefined && b.ranking !== null ? Number(b.ranking) : (sortOrder === "asc" ? Infinity : -Infinity);
            
            return sortOrder === "asc" ? rankA - rankB : rankB - rankA;
        });

    // ✅ ADDED: Pagination Logic Calculations
    const totalPages = Math.ceil(displayedInstitutes.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = displayedInstitutes.slice(indexOfFirstItem, indexOfLastItem);

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
                            <i className="bi bi-building me-2" style={{ color: '#f59e0b' }}></i>Affiliated Institutes Matrix
                        </h3>
                        <p className="text-white-50 m-0 mt-1 small">Explore seat matrix distributions, counseling cutoff scores, and program vacancies.</p>
                    </div>
                    <span className="badge bg-white text-indigo px-3 py-2 fw-bold border text-nowrap" style={{ color: '#4f46e5' }}>
                        Total Campuses: {displayedInstitutes.length}
                    </span>
                </div>

                {/* Control Toolbar Panel filters */}
                <div className="card-body bg-light border-bottom p-3">
                    <div className="row g-3 align-items-center">
                        <div className="col-12 col-md-8">
                            <div className="input-group input-group-sm">
                                <span className="input-group-text bg-white text-muted border-end-0"><i className="bi bi-search"></i></span>
                                <input 
                                    type="text" 
                                    className="form-control border-start-0 shadow-none py-2" 
                                    placeholder="Search campuses by name keyword, institution code, or location..."
                                    value={searchTerm}
                                    // ✅ ADDED: Reset page to 1 when searching
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                />
                            </div>
                        </div>
                        <div className="col-12 col-md-4 text-md-end">
                            <button 
                                type="button"
                                className={`btn btn-sm fw-semibold w-100 py-2 shadow-sm ${sortOrder !== "none" ? 'btn-indigo text-white' : 'btn-outline-dark bg-white'}`}
                                onClick={handleSortToggle}
                                style={sortOrder !== "none" ? { backgroundColor: '#4f46e5', borderColor: '#4f46e5' } : {}}
                            >
                                <i className={`bi ${sortOrder === "asc" ? "bi-sort-numeric-down" : sortOrder === "desc" ? "bi-sort-numeric-up-alt" : "bi-filter"} me-2`}></i>
                                {sortOrder === "none" && "Sort by Ranking"}
                                {sortOrder === "asc" && "Ranking: Top First (1 → Max)"}
                                {sortOrder === "desc" && "Ranking: Bottom First (Max → 1)"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid distribution displaying campuses */}
            <div className="row g-4">
                
                {/* INTERACTIVE DASHED "ADD NEW INSTITUTE" CARD ELEMENT */}
                <div className="col-12 col-lg-6">
                    <div 
                        className="card h-100 d-flex flex-column align-items-center justify-content-center text-center p-5 rounded-3 border-dashed-custom bg-white cursor-pointer transition-all animate-hover-box"
                        onClick={() => navigate('/admin/addinstitute')}
                        style={{ minHeight: '280px' }}
                    >
                        <div className="mb-3 rounded-circle bg-indigo bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', color: '#4f46e5' }}>
                            <i className="bi bi-plus-lg fs-3"></i>
                        </div>
                        <h5 className="fw-bold text-dark m-0">Add New Institute</h5>
                        <p className="text-muted small mt-1 mb-0" style={{ maxWidth: '280px' }}>
                            Provision a brand new educational campus facility, establish seat allocations, and set up counseling workflows.
                        </p>
                    </div>
                </div>

                {/* RENDERING DYNAMIC DATABASE CARDS */}
                {/* ✅ ADDED: Mapping over currentItems instead of displayedInstitutes */}
                {currentItems.length > 0 ? (
                    currentItems.map((inst) => {
                        const totalCapacity = inst.offeredCourses?.reduce((acc, curr) => acc + (curr.totalSeats || 0), 0) || 0;
                        const totalFilled = inst.offeredCourses?.reduce((acc, curr) => acc + (curr.filledSeats || 0), 0) || 0;
                        const remainingSeats = totalCapacity - totalFilled;

                        return (
                            <div className="col-12 col-lg-6" key={inst._id}>
                                <div className="card border-0 shadow-sm h-100 bg-white rounded-3 overflow-hidden border hover-card-trigger position-relative d-flex flex-column justify-content-between">
                                    
                                    <div>
                                        {/* Card Inner Heading Header */}
                                        <div className="card-header bg-white pt-3 px-4 border-0 pb-1">
                                            <div className="d-flex justify-content-between align-items-start gap-2">
                                                <div>
                                                    <span className="badge bg-light text-muted border fw-mono extra-small mb-1.5">CODE: {inst.code}</span>
                                                    <h5 className="fw-bold text-dark m-0 tracking-tight lh-base" style={{ fontSize: '1.15rem' }}>{inst.name}</h5>
                                                    <p className="text-muted extra-small m-0 mt-1">
                                                        <i className="bi bi-geo-alt-fill me-1 text-danger"></i>
                                                        {inst.location?.area ? `${inst.location.area}, ${inst.location.city}` : inst.location || "Location N/A"}
                                                    </p>
                                                </div>
                                                {/* Circular badge displaying ranking index value */}
                                                <div className="text-center p-2 rounded-3 shadow-xs border bg-light" style={{ minWidth: '65px' }}>
                                                    <span className="text-muted text-uppercase d-block fw-bold" style={{ fontSize: '0.6rem', letterSpacing: '0.5px' }}>Rank</span>
                                                    <strong className="fs-5 text-indigo fw-black" style={{ color: '#4f46e5' }}>#{inst.ranking || "N/A"}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Content Body displaying sub-courses list table */}
                                        <div className="card-body px-4 py-2">
                                            <div className="mt-1 border rounded-3 overflow-hidden bg-light bg-opacity-30">
                                                <div className="px-3 py-2 text-muted extra-small fw-bold text-uppercase border-bottom bg-light tracking-wider">
                                                    <i className="bi bi-diagram-3-fill me-1 text-indigo"></i>Offered Stream Seats & Cutoffs Matrix
                                                </div>
                                                {inst.offeredCourses && inst.offeredCourses.length > 0 ? (
                                                    <div className="table-responsive m-0" style={{ maxHeight: '180px' }}>
                                                        <table className="table table-sm table-hover align-middle m-0 extra-small text-secondary">
                                                            <tbody>
                                                                {inst.offeredCourses.map((offered) => {
                                                                    const courseDoc = offered.courseId;
                                                                    if (!courseDoc) return null;
                                                                    
                                                                    const degreePrefix = courseDoc.degree?.endsWith('Technology') ? 'BTECH' : 'BE';
                                                                    const structuralVacancies = offered.totalSeats - offered.filledSeats;

                                                                    return (
                                                                        <tr key={offered._id}>
                                                                            <td className="ps-3 py-2 fw-semibold text-dark text-truncate" style={{ maxWidth: '160px' }}>
                                                                                <span className="text-indigo me-1 fw-bold">[{degreePrefix}]</span>
                                                                                {courseDoc.course}
                                                                            </td>
                                                                            <td className="text-center py-2">
                                                                                <span className="text-muted">Cutoff: </span>
                                                                                <strong className="text-dark fw-mono">{offered.cutoff?.toFixed(2) || "0.00"}</strong>
                                                                            </td>
                                                                            <td className="pe-3 text-end py-2">
                                                                                <span className={`badge rounded-pill px-2 py-1 fw-medium ${structuralVacancies > 0 ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                                                                                    {structuralVacancies} Left
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="p-3 text-center text-muted italic extra-small">No course disciplines mapped under this institution framework yet.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer Elements */}
                                    <div>
                                        <div className="bg-light px-4 py-2 d-flex justify-content-between align-items-center border-top border-bottom flex-wrap gap-2">
                                            <div className="d-flex gap-3 extra-small text-muted fw-semibold">
                                                {inst.contact?.email && (
                                                    <span className="text-truncate" style={{ maxWidth: '160px' }}><i className="bi bi-envelope-fill me-1 text-primary"></i>{inst.contact.email}</span>
                                                )}
                                                {inst.contact?.phone && (
                                                    <span><i className="bi bi-telephone-fill me-1 text-success"></i>{inst.contact.phone}</span>
                                                )}
                                            </div>
                                            <div className="extra-small fw-bold text-dark">
                                                Vacancies: <span className="text-indigo font-mono ms-1">{remainingSeats}</span>
                                            </div>
                                        </div>

                                        {/* Action Button Strip */}
                                        <div className="p-2 bg-white d-flex justify-content-end gap-2 px-3">
                                            <button 
                                                type="button" 
                                                className="btn btn-xs btn-outline-primary border-0 shadow-none py-1 px-2.5 rounded-2 d-flex align-items-center fw-bold text-uppercase extra-small style-btn-action"
                                                onClick={() => handleEditClick(inst)}
                                            >
                                                <i className="bi bi-pencil-square me-1.5 fs-6"></i>Edit Campus
                                            </button>
                                            <button 
                                                type="button" 
                                                className="btn btn-xs btn-outline-danger border-0 shadow-none py-1 px-2.5 rounded-2 d-flex align-items-center fw-bold text-uppercase extra-small style-btn-action-delete"
                                                disabled={deleteInstituteMutation.isPending}
                                                onClick={() => handleDeleteClick(inst._id, inst.name)}
                                            >
                                                <i className="bi bi-trash3-fill me-1.5 fs-6"></i>Delete Record
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        );
                    })
                ) : searchTerm.trim() !== "" ? (
                    <div className="col-12 col-lg-6">
                        <div className="card border-0 shadow-sm p-5 text-center bg-white rounded-3 h-100 d-flex align-items-center justify-content-center">
                            <i className="bi bi-building-fill-x text-muted mb-2" style={{ fontSize: '2.5rem' }}></i>
                            <h5 className="fw-bold text-dark">No Matching Results</h5>
                            <p className="text-muted small mx-auto m-0 mt-1" style={{ maxWidth: '300px' }}>
                                No existing campuses found matching your current filter keywords.
                            </p>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* ✅ ADDED: Pagination Footer */}
            {displayedInstitutes.length > 0 && (
                <div className="d-flex align-items-center justify-content-between p-3 mt-4 border bg-white rounded-3 shadow-sm">
                    <div className="small text-muted">
                        Showing {displayedInstitutes.length === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, displayedInstitutes.length)} of {displayedInstitutes.length} entries
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

            {/* Embedded Interactive Hover CSS micro-transitions */}
            <style>{`
                .hover-card-trigger { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
                .hover-card-trigger:hover { transform: translateY(-4px); box-shadow: 0 10px 20px -5px rgba(0,0,0,0.08) !important; }
                .btn-indigo { background-color: #4f46e5 !important; border-color: #4f46e5 !important; }
                .text-indigo { color: #4f46e5 !important; }
                .extra-small { font-size: 0.75rem !important; }
                .fs-7 { font-size: 0.7rem !important; }
                .fw-black { font-weight: 900 !important; }
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
            `}</style>
        </div>
    );
};

export default ViewInstitutes;