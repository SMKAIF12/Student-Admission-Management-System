import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import SuccessScreen from './SuccessScreen';
import LoadingSpinner from './LoadingSpinner';
import { jwtDecode } from 'jwt-decode';
import InfoMessage from './InfoMessage';

const ApplyForAdmission = () => {
    const token = localStorage.getItem('token');
    const user = jwtDecode(token);
    const navigate = useNavigate();
    // 1. Form state hooks mapped directly to your Mongoose schemas
    const [personalDetails, setPersonalDetails] = useState({
        fullname: "",
        phoneNumber: "",
        aadharNumber: "",
        dob: ""
    });
    const [success, setSuccess] = useState({
        success: false,
        applicationNumber: ''
    })
    const [academics, setAcademics] = useState({
        hscregisternumber: ""
    });

    const [marks, setMarks] = useState({
        language: 0,
        english: 0,
        mathematics: 0,
        physics: 0,
        chemistry: 0,
        elective: 0
    });

    // File references matching schema criteria { url, publicId }
    const [files, setFiles] = useState({
        photo: null,
        sslc: null,
        hsc: null
    });

    // Selected choices submitted to target reference array (selectedCourses)
    const [preferences, setPreferences] = useState([]);

    // Core selection metrics
    const [currentSelection, setCurrentSelection] = useState({ instituteId: "", courseId: "" });

    // --- SEARCH / SEARCHABLE DROPDOWN STATE HOOKS ---
    const [instituteSearch, setInstituteSearch] = useState("");
    const [showInstDropdown, setShowInstDropdown] = useState(false);

    const [courseSearch, setCourseSearch] = useState("");
    const [showCourseDropdown, setShowCourseDropdown] = useState(false);

    // Refs to detect clicks outside the searchable dropdown to auto-close them
    const instRef = useRef(null);
    const courseRef = useRef(null);

    // --- MODIFIED: Initial states set as empty arrays to dynamically consume server queries ---
    const [availableInstitutes, setAvailableInstitutes] = useState([]);
    
    // --- NEW: Custom state to hold the full object of the currently selected institute ---
    const [selectedInstituteDoc, setSelectedInstituteDoc] = useState(null);

    const [calculatedCutoff, setCalculatedCutoff] = useState(0);
    const [errorMsg, setErrorMsg] = useState("");

    // State to track if backend checks are actively validating user permissions
    const [checkingExisting, setCheckingExisting] = useState(true);
    const [isalreadyExists, setIsalreadyExists] = useState(false);

    // --- 2. Continuous event listener to close search boxes ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (instRef.current && !instRef.current.contains(event.target)) setShowInstDropdown(false);
            if (courseRef.current && !courseRef.current.contains(event.target)) setShowCourseDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- 3. Dynamic Cutoff logic calculation ---
    useEffect(() => {
        const maths = Number(marks.mathematics) || 0;
        const physics = Number(marks.physics) || 0;
        const chemistry = Number(marks.chemistry) || 0;
        setCalculatedCutoff(maths + (physics / 2) + (chemistry / 2));
    }, [marks.mathematics, marks.physics, marks.chemistry]);

    // Change listeners
    const handlePersonalChange = (e) => setPersonalDetails({ ...personalDetails, [e.target.name]: e.target.value });
    const handleMarksChange = (e) => {
        const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
        setMarks({ ...marks, [e.target.name]: val });
    };
    const handleFileChange = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) setFiles({ ...files, [fieldName]: file });
    };

    // Build prioritized preference collection list
    const addPreference = () => {
        if (!currentSelection.instituteId || !currentSelection.courseId) {
            setErrorMsg("Please search and select an official choice option from both boxes first.");
            return;
        }

        const selectedInst = availableInstitutes.find(i => i._id === currentSelection.instituteId);
        
        // Find course details directly from the active institute document context wrapper
        const offeredCourseWrapper = selectedInstituteDoc?.offeredCourses?.find(o => o.courseId?._id === currentSelection.courseId);
        const selectedCrs = offeredCourseWrapper?.courseId;

        if (!selectedInst || !selectedCrs) {
            setErrorMsg("Selected choices could not be resolved from local data maps.");
            return;
        }

        const exists = preferences.some(p => p.instituteId === currentSelection.instituteId && p.courseId === currentSelection.courseId);
        if (exists) {
            setErrorMsg("This specific institute and program selection has already been added.");
            return;
        }

        setPreferences([...preferences, {
            instituteId: selectedInst._id,
            instituteName: selectedInst.name,
            courseId: selectedCrs._id,
            courseName: selectedCrs.course
        }]);

        setErrorMsg("");
        setCurrentSelection({ instituteId: "", courseId: "" });
        setInstituteSearch("");
        setCourseSearch("");
        setSelectedInstituteDoc(null); // --- NEW: Reset cascade target for next choice entry selection sequence ---
    };

    const removePreference = (index) => {
        setPreferences(preferences.filter((_, i) => i !== index));
    };

    const baseUrl = 'http://localhost:3000';
    const fetchExistingApplication = async () => {
        try {
            setCheckingExisting(true);
            const response = await axios.get(`${baseUrl}/application/get/${user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.application) {
                setIsalreadyExists(true);
            }
        } catch (error) {
            console.error("Error verifying registration criteria:", error);
        } finally {
            setCheckingExisting(false);
        }
    }
    
    // --- MODIFIED: Adjusted query parameters to match single unified search controller endpoint ---
    const fetchInsitutes = async () => {
        try {
            const response = await axios.get(`${baseUrl}/application/institutes?search=${instituteSearch}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (response.data && response.data.institutes) {
                setAvailableInstitutes(response.data.institutes);
            }
        } catch (error) {
            console.error(error);
        }
    }
    
    useEffect(() => {
        fetchExistingApplication();
    }, []);

    // --- MODIFIED: Trigger institute server queries cleanly dependent strictly on institute name search queries ---
    useEffect(() => {
        fetchInsitutes();
    }, [instituteSearch,courseSearch]);
     // Filter Query Lists
    const filteredInstitutes = availableInstitutes.filter(inst =>
        inst.name.toLowerCase().includes(instituteSearch.toLowerCase()) ||
        inst.code.toLowerCase().includes(instituteSearch.toLowerCase())
    );

    // --- MODIFIED: Dynamically filter courses locally directly from the parent institute's offered list ---
    const filteredCourses = selectedInstituteDoc && selectedInstituteDoc.offeredCourses
        ? selectedInstituteDoc.offeredCourses
            .map(offered => offered.courseId) // Extracts populated Course object mapping
            .filter(crs => crs && (
                crs.course.toLowerCase().includes(courseSearch.toLowerCase()) ||
                crs.code.toLowerCase().includes(courseSearch.toLowerCase())
            ))
        : [];

    const createMutation = useMutation({
        mutationFn: async () => {
            // Mapping formatted preferences arrays to target references array schema structure
            const dynamicCoursesPayload = preferences.map(p => ({ 
            candidate: user.id,        // Mapped to 'candidate' validation path
            institute: p.instituteId,  // Extracts 'instituteId' from state into 'institute'
            course: p.courseId         // Extracts 'courseId' from state into 'course'
            }));            
            const formData = new FormData();
            formData.append("personalDetails", JSON.stringify(personalDetails));
            formData.append("academics", JSON.stringify(academics));
            formData.append("marks", JSON.stringify(marks));
            formData.append("selectedCourses", JSON.stringify(dynamicCoursesPayload));
            formData.append("candidate", user.id);
            formData.append("photo", files.photo);
            formData.append("sslc", files.sslc);
            formData.append("hsc", files.hsc);
            return await axios.post(`${baseUrl}/application/create`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: (response) => {
            setSuccess({
                success: true,
                applicationNumber: response.data?.newApplication?.applicationNumber || response.data?.applicationNumber || "SUCCESS"
            });
        },
        onError: (error) => {
            setErrorMsg(error.response?.data?.message || "Submission pipeline execution failure.");
        }
    });

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");

        if (preferences.length === 0) {
            setErrorMsg("You must add at least one program preference mapping to proceed.");
            return;
        }

        // Fire the useMutation execution pipeline hook
        createMutation.mutate();
    };

    // --- 5. CONDITIONAL RENDER BLOCKS ---

    // Block A: Actively verifying database constraints (Fixes the form flickering)
    if (checkingExisting) {
        return (
            <div className="container py-5 mt-5 text-center">
                <LoadingSpinner message="Loading data...." />
            </div>
        );
    }

    // Block B: Form creation successful view
    if (success.success) {
        return (
            <SuccessScreen
                referenceId={success.applicationNumber}
                message='Your Application Has Been Submitted Successfully!!'
            />
        );
    }
    const onClose = ()=>{
        navigate('/student/dashboard');
    }
    // Block C: Active application conflict block matching profile pipeline
    if (isalreadyExists) {
        return (
            <div className="container py-5 mt-5">
                <InfoMessage
                    type="danger"
                    message="An active application already exists, please withdraw the application to apply new."
                    showViewButton={true}
                    onClose={onClose}
                />
            </div>
        );
    }

    // --- 6. DEFAULT JSX FORM CONTENT VIEW ---
    return (
        <div className="container py-5" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <div className="card border-0 shadow mx-auto rounded-3" style={{ maxWidth: '900px' }}>
                <div className="card-header border-0 text-white p-4" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' }}>
                    <h3 className="fw-extrabold m-0"><i className="bi bi-file-earmark-plus me-2"></i>Apply for Admission</h3>
                    <p className="text-white-50 m-0 mt-1 small">Fill in your identity details, scores transcript records, and query preferred campus metrics.</p>
                </div>

                <form onSubmit={handleFormSubmit} className="card-body p-4 bg-white">
                    {errorMsg && (
                        <div className="alert alert-danger d-flex align-items-center small p-3 mb-4 rounded-3">
                            <i className="bi bi-exclamation-triangle-fill me-2"></i>{errorMsg}
                        </div>
                    )}

                    {/* SECTION 1: PERSONAL DETAILS */}
                    <fieldset className="mb-4 border-bottom pb-4">
                        <legend className="fw-bold fs-5 text-indigo mb-3"><i className="bi bi-person-fill me-2"></i>Personal Details</legend>
                        <div className="row g-3">
                            <div className="col-12 col-md-6">
                                <label className="form-label small fw-bold text-secondary">Full Name (As per ID Card)</label>
                                <input
                                    type="text"
                                    name="fullname"
                                    className="form-control form-control-sm shadow-none"
                                    placeholder="e.g. ALEX MERCER"
                                    value={personalDetails.fullname}
                                    onChange={handlePersonalChange}
                                    required
                                />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label small fw-bold text-secondary">Contact Phone Number</label>
                                <input type="tel" name="phoneNumber" className="form-control form-control-sm shadow-none" placeholder="e.g. 9876543210" value={personalDetails.phoneNumber} onChange={handlePersonalChange} required />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label small fw-bold text-secondary">Aadhar Identity Number</label>
                                <input type="text" name="aadharNumber" className="form-control form-control-sm shadow-none" placeholder="12-Digit Unique Number" value={personalDetails.aadharNumber} onChange={handlePersonalChange} required />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label small fw-bold text-secondary">Date of Birth</label>
                                <input type="date" name="dob" className="form-control form-control-sm shadow-none" value={personalDetails.dob} onChange={handlePersonalChange} required />
                            </div>
                            <div className="col-12">
                                <label className="form-label small fw-bold text-secondary">Passport Photo Upload</label>
                                <input type="file" className="form-control form-control-sm shadow-none" accept="image/*" onChange={(e) => handleFileChange(e, 'photo')} required />
                            </div>
                        </div>
                    </fieldset>

                    {/* SECTION 2: ACADEMIC PROFILE & TRANSCRIPTS */}
                    <fieldset className="mb-4 border-bottom pb-4">
                        <legend className="fw-bold fs-5 text-indigo mb-3"><i className="bi bi-mortarboard-fill me-2"></i>Academic Profile & Transcripts</legend>
                        <div className="row g-3 mb-4">
                            <div className="col-12 col-md-4">
                                <label className="form-label small fw-bold text-secondary">HSC Register Number</label>
                                <input type="text" className="form-control form-control-sm shadow-none" value={academics.hscregisternumber} onChange={(e) => setAcademics({ hscregisternumber: e.target.value })} required />
                            </div>
                            <div className="col-12 col-md-4">
                                <label className="form-label small fw-bold text-secondary">SSLC MarkSheet</label>
                                <input type="file" className="form-control form-control-sm shadow-none" accept="application/pdf,image/*" onChange={(e) => handleFileChange(e, 'sslc')} required />
                            </div>
                            <div className="col-12 col-md-4">
                                <label className="form-label small fw-bold text-secondary">HSC MarkSheet</label>
                                <input type="file" className="form-control form-control-sm shadow-none" accept="application/pdf,image/*" onChange={(e) => handleFileChange(e, 'hsc')} required />
                            </div>
                        </div>

                        <div className="bg-light p-3 rounded-3 mb-3">
                            <h6 className="fw-bold text-dark mb-3 small text-uppercase">HSC Core Marks Summary (Max 100)</h6>
                            <div className="row g-2">
                                {Object.keys(marks).map((subject) => (
                                    <div className="col-6 col-md-2" key={subject}>
                                        <label className="form-label text-capitalize extra-small fw-bold text-muted mb-1">{subject}</label>
                                        <input type="number" name={subject} className="form-control form-control-sm shadow-none fw-bold" value={marks[subject]} onChange={handleMarksChange} required />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-3 bg-info bg-opacity-10 rounded border-start border-4 border-info d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="m-0 fw-bold text-indigo">Engineering Cutoff Score Projection</h6>
                                <p className="m-0 text-muted extra-small mt-0.5">Formula: $Maths + (Physics/2) + (Chemistry/2)$</p>
                            </div>
                            <div className="fs-3 fw-black text-indigo pe-2">{calculatedCutoff.toFixed(2)}</div>
                        </div>
                    </fieldset>

                    {/* SECTION 3: CAMPUS COURSE PREFERENCE PIPELINE */}
                    <fieldset className="mb-4">
                        <legend className="fw-bold fs-5 text-indigo mb-2"><i className="bi bi-building-add me-2"></i>Campus Course Preference Pipeline</legend>
                        <p className="text-muted extra-small mb-3">Search matching choices by entering keywords or official codes below.</p>

                        <div className="row g-2 align-items-end mb-3 bg-light p-3 rounded-3 border">
                            <div className="col-12 col-md-5 position-relative" ref={instRef}>
                                <label className="form-label small fw-bold text-secondary">Search Institute (Code/Name)</label>
                                <div className="input-group input-group-sm">
                                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-search"></i></span>
                                    <input
                                        type="text"
                                        className="form-control border-start-0 shadow-none"
                                        placeholder="e.g. GTI or Global Tech..."
                                        value={instituteSearch}
                                        onChange={(e) => {
                                            setInstituteSearch(e.target.value);
                                            setShowInstDropdown(true);
                                        }}
                                        onFocus={() => setShowInstDropdown(true)}
                                    />
                                </div>

                                {showInstDropdown && (
                                    <ul className="dropdown-menu show w-100 position-absolute overflow-auto shadow" style={{ maxHeight: '200px', zIndex: 1060 }}>
                                        {filteredInstitutes.length > 0 ? (
                                            filteredInstitutes.map(inst => (
                                                <li key={inst._id}>
                                                    <button
                                                        type="button"
                                                        className="dropdown-item small py-2 d-flex justify-content-between align-items-center"
                                                        onClick={() => {
                                                            // --- MODIFIED: Reset course selection parameters on parent node updates ---
                                                            setCurrentSelection(prev => ({ ...prev, instituteId: inst._id, courseId: "" }));
                                                            setCourseSearch(""); 
                                                            setSelectedInstituteDoc(inst); // --- NEW: Cache current object properties ---
                                                            setInstituteSearch(`${inst.name} [${inst.code}]`);
                                                            setShowInstDropdown(false);
                                                        }}
                                                    >
                                                        <span>{inst.name}</span>
                                                        <span className="badge bg-light text-dark border fw-mono ms-2">{inst.code}</span>
                                                    </button>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="p-2 text-center text-muted extra-small">No institutes match your search terms</li>
                                        )}
                                    </ul>
                                )}
                            </div>

                            <div className="col-12 col-md-5 position-relative" ref={courseRef}>
                                <label className="form-label small fw-bold text-secondary">Search Course Discipline (Code/Name)</label>
                                <div className="input-group input-group-sm">
                                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-search"></i></span>
                                    <input
                                        type="text"
                                        className="form-control border-start-0 shadow-none"
                                        placeholder="e.g. CSE or Computer Science..."
                                        value={courseSearch}
                                        onChange={(e) => {
                                            setCourseSearch(e.target.value);
                                            setShowCourseDropdown(true);
                                        }}
                                        onFocus={() => setShowCourseDropdown(true)}
                                    />
                                </div>

                                {showCourseDropdown && (
                                    <ul className="dropdown-menu show w-100 position-absolute overflow-auto shadow" style={{ maxHeight: '200px', zIndex: 1060 }}>
                                        {/* --- NEW/MODIFIED: Cascading logic layout constraints checks --- */}
                                        {!selectedInstituteDoc ? (
                                            <li className="p-2 text-center text-muted extra-small text-danger fw-semibold">
                                                <i className="bi bi-exclamation-circle me-1"></i> Please select an institute first
                                            </li>
                                        ) : filteredCourses.length > 0 ? (
                                            filteredCourses.map(crs => (
                                                <li key={crs._id}>
                                                    <button
                                                        type="button"
                                                        className="dropdown-item small py-2 d-flex justify-content-between align-items-center"
                                                        onClick={() => {
                                                            setCurrentSelection(prev => ({ ...prev, courseId: crs._id }));
                                                            setCourseSearch(crs.course);
                                                            setShowCourseDropdown(false);
                                                        }}
                                                    >
                                                        <div>
                                                            <div className="fw-semibold">{crs.course}</div>
                                                            <span className="text-muted extra-small">{crs.degree}</span>
                                                        </div>
                                                        <span className="badge bg-light text-secondary border fw-mono ms-2">{crs.code}</span>
                                                    </button>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="p-2 text-center text-muted extra-small">No courses found matching criteria for this campus</li>
                                        )}
                                    </ul>
                                )}
                            </div>

                            <div className="col-12 col-md-2">
                                <button type="button" className="btn btn-sm btn-indigo fw-semibold w-100 shadow-sm" onClick={addPreference} style={{ height: '31px' }}>
                                    <i className="bi bi-plus-circle me-1"></i> Add Choice
                                </button>
                            </div>
                        </div>

                        {/* Summary Table */}
                        {preferences.length > 0 ? (
                            <div className="table-responsive border rounded bg-white shadow-sm">
                                <table className="table table-sm m-0 align-middle text-secondary small">
                                    <thead className="table-light text-dark fw-bold">
                                        <tr>
                                            <th style={{ width: '80px' }} className="text-center">Priority</th>
                                            <th>Institute Name</th>
                                            <th>Discipline Stream</th>
                                            <th style={{ width: '60px' }} className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preferences.map((pref, idx) => (
                                            <tr key={idx}>
                                                <td className="text-center fw-bold text-indigo bg-light bg-opacity-50">#{idx + 1}</td>
                                                <td className="fw-semibold text-dark">{pref.instituteName}</td>
                                                <td>{pref.courseName}</td>
                                                <td className="text-center">
                                                    <button type="button" className="btn btn-link link-danger p-0 border-0" onClick={() => removePreference(idx)}>
                                                        <i className="bi bi-trash fs-6"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center p-3 border border-dashed rounded text-muted extra-small bg-white">
                                <i className="bi bi-list-ol fs-5 d-block mb-1"></i> No selection choices chosen yet. Query data using the search fields above.
                            </div>
                        )}
                    </fieldset>

                    {/* FORM FOOTER TERMINAL ACTIONS */}
                    <div className="modal-footer border-top pt-3 d-flex gap-2 justify-content-end">
                        <button type="button" className="btn btn-sm btn-outline-secondary fw-semibold px-4" onClick={() => navigate('/student/dashboard')} disabled={createMutation.isPending}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-sm btn-success fw-bold px-4 shadow-sm" disabled={createMutation.isPending} style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}>
                            {createMutation.isPending ? (
                                <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</>
                            ) : (
                                <><i className="bi bi-save2 me-1"></i> Save Draft & Proceed</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApplyForAdmission;