import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import InfoMessage from './InfoMessage';

const AddInstitute = () => {
    const navigate = useNavigate();
    const location = useLocation(); 
    const queryClient = useQueryClient();
    const token = localStorage.getItem('token');
    const baseUrl = 'http://localhost:3000';

    // Parse whether the admin clicked 'Add' or 'Edit' from the matrix grid
    const isEditMode = !!location.state?.editMode;
    const existingData = location.state?.instituteData || null;

    const [errorMsg, setErrorMsg] = useState("");
    const [notice, setNotice] = useState({ show: false, message: '', type: '' });
    
    // Local state managing rows of chosen courses before form submission
    const [selectedCoursesList, setSelectedCoursesList] = useState([]);
    
    // Temporary states to capture individual row inputs for the course selector matrix
    const [currentCourseId, setCurrentCourseId] = useState("");
    const [currentTotalSeats, setCurrentTotalSeats] = useState("120"); 
    const [currentCutoff, setCurrentCutoff] = useState("");

    // 🔑 PRESERVED EXACTLY: Your preferred schema properties mapping layout structure
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        ranking: "",
        location: "",
        contact: {
            email: "",
            phone: ""
        },
        offeredCourses: ""
    });

    // Pre-fills all form values instantly if an administrator requests editing mode
    useEffect(() => {
        if (isEditMode && existingData) {
            setFormData({
                name: existingData.name || "",
                code: existingData.code || "",
                ranking: existingData.ranking || "",
                location: existingData.location || "",
                contact: {
                    email: existingData.contact?.email || "",
                    phone: existingData.contact?.phone || ""
                },
                offeredCourses: ""
            });

            // Map the nested offered courses out of the document into your active React list table
            if (existingData.offeredCourses && existingData.offeredCourses.length > 0) {
                const preMapped = existingData.offeredCourses.map(item => ({
                    courseId: item.courseId?._id || item.courseId,
                    courseName: item.courseId?.course || "Active Branch",
                    degree: item.courseId?.degree || "B.E.",
                    totalSeats: item.totalSeats || 120,
                    cutoff: item.cutoff || 0
                }));
                setSelectedCoursesList(preMapped);
            }
        }
    }, [isEditMode, existingData]);

    // Fetch global standard catalog from Courses collection
    const { data: globalCourses = [] } = useQuery({
        queryKey: ["globalCoursesCatalogList"],
        queryFn: async () => {
            const response = await axios.get(`${baseUrl}/admin/course/get`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data?.courses || response.data || [];
        }
    });

    // ⚡ ENHANCED HANDLER: Dynamically supports both single flat-keys and nested path assignments
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name.includes('.')) {
            const [parentKey, childKey] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parentKey]: {
                    ...prev[parentKey],
                    [childKey]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Pushes a course selection configuration into local temporary grid state
    const handleAddCourseToLocalList = () => {
        setErrorMsg("");
        if (!currentCourseId || !currentTotalSeats || !currentCutoff) {
            setErrorMsg("Please fill out the specialization choice, seat capacity, and cutoff threshold first.");
            return;
        }

        const isDuplicate = selectedCoursesList.some(item => item.courseId === currentCourseId);
        if (isDuplicate) {
            setErrorMsg("This course stream has already been added to the list below.");
            return;
        }

        const matchObj = globalCourses.find(c => c._id === currentCourseId);

        setSelectedCoursesList([
            ...selectedCoursesList,
            {
                courseId: currentCourseId,
                courseName: matchObj?.course || "Unknown Program",
                degree: matchObj?.degree || "B.E.",
                totalSeats: Number(currentTotalSeats),
                cutoff: Number(currentCutoff)
            }
        ]);

        setCurrentCourseId("");
        setCurrentCutoff("");
    };

    const handleRemoveCourseFromLocalList = (index) => {
        setSelectedCoursesList(selectedCoursesList.filter((_, i) => i !== index));
    };

    // Switches seamlessly between POST and PUT endpoints based on editMode state flags
    const submitInstituteMutation = useMutation({
        mutationFn: async (payload) => {
            if (isEditMode) {
                return await axios.put(`${baseUrl}/admin/institute/edit/${existingData._id}`, payload, {
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
                });
            } else {
                return await axios.post(`${baseUrl}/admin/institute/add`, payload, {
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
                });
            }
        },
        onSuccess: (response) => {
            setNotice({
                show: true,
                message: response.data?.message || `Institute entry successfully ${isEditMode ? 'updated' : 'registered'}!`,
                type: 'success'
            });
            queryClient.invalidateQueries(["allInstitutesList"]);
        },
        onError: (error) => {
            setErrorMsg(error.response?.data?.message || "Failed to process campus information updates.");
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMsg("");

        if (!formData.name.trim() || !formData.ranking || !formData.location.trim()) {
            setErrorMsg("Name, ranking position index, and location string are mandatory parameters.");
            return;
        }

        // Packages properties exactly following your model criteria rules
        const finalPayload = {
            name: formData.name.trim(),
            code: formData.code.toUpperCase().trim(),
            ranking: Number(formData.ranking),
            location: formData.location.trim(),
            contact: {
                email: formData.contact.email.trim(),
                phone: formData.contact.phone.trim()
            },
            offeredCourses: selectedCoursesList.map(item => ({
                courseId: item.courseId,
                totalSeats: item.totalSeats,
                filledSeats: existingData?.offeredCourses?.find(oc => (oc.courseId?._id || oc.courseId) === item.courseId)?.filledSeats || 0,
                cutoff: item.cutoff
            }))
        };

        submitInstituteMutation.mutate(finalPayload);
    };

    return (
        <div className="container py-5" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {notice.show && (
                <InfoMessage 
                    message={notice.message} 
                    type={notice.type} 
                    onClose={() => { setNotice({ show: false, message: '', type: '' }); navigate('/admin/institutes'); }} 
                />
            )}

            <div className="card border-0 shadow mx-auto rounded-3" style={{ maxWidth: '850px' }}>
                <div className="card-header border-0 text-white p-4" style={{ background: isEditMode ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' }}>
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <h3 className="fw-extrabold m-0">
                                <i className={`bi ${isEditMode ? 'bi-pencil-square' : 'bi-building-plus'} me-2`}></i>
                                {isEditMode ? `Modify ${existingData?.name}` : 'Register New Institute'}
                            </h3>
                            <p className="text-white-50 m-0 mt-1 small">Update administrative configurations, seat capacities, and cutoff scores.</p>
                        </div>
                        <button type="button" className="btn btn-sm btn-light text-dark fw-bold px-3 py-2" onClick={() => navigate('/admin/institutes')}>
                            <i className="bi bi-arrow-left me-1"></i> Back
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="card-body p-4 bg-white" autoComplete="off">
                    {errorMsg && (
                        <div className="alert alert-danger p-3 mb-4 rounded-3 small">{errorMsg}</div>
                    )}

                    {/* IDENTITY IDENTIFIERS */}
                    <fieldset className="mb-4 border-bottom pb-4">
                        <legend className="fw-bold fs-6 text-indigo mb-3"><i className="bi bi-bookmark-star-fill me-2"></i>Campus Identifiers</legend>
                        <div className="row g-3">
                            <div className="col-12">
                                <label className="form-label small fw-bold text-secondary">Institute Corporate Name</label>
                                <input type="text" name="name" className="form-control form-control-sm shadow-none" placeholder="e.g. College of Engineering, Guindy" value={formData.name} onChange={handleChange} required />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label small fw-bold text-secondary">Unique Code</label>
                                <input type="text" name="code" className="form-control form-control-sm shadow-none text-uppercase" placeholder="e.g. 0001" value={formData.code} onChange={handleChange} />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label small fw-bold text-secondary">Merit Ranking Position</label>
                                <input type="number" name="ranking" className="form-control form-control-sm shadow-none" placeholder="e.g. 1" min="1" value={formData.ranking} onChange={handleChange} required />
                            </div>
                        </div>
                    </fieldset>

                    {/* REGION LOCATION DETAILS */}
                    <fieldset className="mb-4 border-bottom pb-4">
                        <legend className="fw-bold fs-6 text-indigo mb-3"><i className="bi bi-geo-alt-fill me-2"></i>Location Details</legend>
                        <div className="row g-3">
                            <div className="col-12">
                                <label className="form-label small fw-bold text-secondary">Campus Location Address</label>
                                <input type="text" name="location" className="form-control form-control-sm shadow-none fw-semibold" placeholder="e.g. Guindy, Chennai, Tamil Nadu - 600025" value={formData.location} onChange={handleChange} required />
                            </div>
                        </div>
                    </fieldset>

                    {/* CONFIGURING OFFERED STREAM ARRAYS */}
                    <fieldset className="mb-4 border-bottom pb-4 bg-light bg-opacity-25 p-3 rounded-3 border">
                        <legend className="fw-bold fs-6 text-indigo mb-2"><i className="bi bi-diagram-3-fill me-2"></i>Configure Offered Course Programs</legend>
                        <p className="text-muted extra-small mb-3">Add or remove academic branches and specializations mapped into this campus array.</p>
                        
                        <div className="row g-2 align-items-end mb-3">
                            <div className="col-12 col-md-5">
                                <label className="form-label extra-small fw-bold text-secondary">Select Available Stream</label>
                                <select className="form-select form-select-sm shadow-none text-dark fw-medium" value={currentCourseId} onChange={(e) => setCurrentCourseId(e.target.value)}>
                                    <option value="">-- Choose Program --</option>
                                    {globalCourses.map(c => (
                                        <option key={c._id} value={c._id}>
                                            {c.degree?.endsWith('Technology') ? 'BTech' : 'BE'} - {c.course}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-6 col-md-3">
                                <label className="form-label extra-small fw-bold text-secondary">Seat Intake Capacity</label>
                                <input type="number" className="form-control form-control-sm shadow-none font-mono text-center" value={currentTotalSeats} min="1" onChange={(e) => setCurrentTotalSeats(e.target.value)} />
                            </div>
                            <div className="col-6 col-md-2">
                                <label className="form-label extra-small fw-bold text-secondary">Cutoff Threshold</label>
                                <input type="number" step="0.01" className="form-control form-control-sm shadow-none font-mono text-center fw-bold text-indigo" placeholder="190.00" value={currentCutoff} min="0" max="200" onChange={(e) => setCurrentCutoff(e.target.value)} />
                            </div>
                            <div className="col-12 col-md-2 d-grid">
                                <button type="button" className="btn btn-sm btn-dark fw-bold text-nowrap" onClick={handleAddCourseToLocalList}>
                                    <i className="bi bi-plus-lg me-1"></i> Add Course
                                </button>
                            </div>
                        </div>

                        {selectedCoursesList.length > 0 ? (
                            <div className="table-responsive border rounded-2 bg-white m-0 shadow-xs">
                                <table className="table table-sm align-middle m-0 extra-small text-secondary">
                                    <thead className="table-light text-dark font-semibold">
                                        <tr>
                                            <th className="ps-3 py-2">Stream Specialization</th>
                                            <th className="text-center">Cutoff Needed</th>
                                            <th className="text-center">Total Intake</th>
                                            <th className="pe-3 text-end" style={{ width: '60px' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedCoursesList.map((item, index) => (
                                            <tr key={index}>
                                                <td className="ps-3 py-2 fw-semibold text-dark">
                                                    <span className="text-indigo">[{item.degree?.endsWith('Technology') ? 'BTech' : 'BE'}]</span> {item.courseName}
                                                </td>
                                                <td className="text-center fw-mono fw-bold text-dark">{Number(item.cutoff).toFixed(2)}</td>
                                                <td className="text-center font-mono">{item.totalSeats}</td>
                                                <td className="pe-3 text-end">
                                                    <button type="button" className="btn btn-link text-danger p-0 border-0 m-0 shadow-none" onClick={() => handleRemoveCourseFromLocalList(index)}>
                                                        <i className="bi bi-trash-fill fs-6"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-3 text-muted bg-white border border-dashed rounded-2 extra-small">
                                <i className="bi bi-info-circle me-1 text-indigo"></i> No stream programs mapped yet. Use the fields above to add courses to this campus.
                            </div>
                        )}
                    </fieldset>

                    {/* CONTACTS */}
                    <fieldset className="mb-4">
                        <legend className="fw-bold fs-6 text-indigo mb-3"><i className="bi bi-telephone-outbound-fill me-2"></i>Contact Information</legend>
                        <div className="row g-3">
                            <div className="col-12 col-md-6">
                                <label className="form-label small fw-bold text-secondary">Official Admissions Mail</label>
                                {/* ✅ FIXED: Updated to target your specific nested path properties format */}
                                <input type="email" name="contact.email" className="form-control form-control-sm shadow-none" placeholder="admissions@campus.edu" value={formData.contact.email} onChange={handleChange} />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label small fw-bold text-secondary">Admissions Phone Hotline</label>
                                {/* ✅ FIXED: Updated to target your specific nested path properties format */}
                                <input type="tel" name="contact.phone" className="form-control form-control-sm shadow-none" placeholder="+91 44 2235 7003" value={formData.contact.phone} onChange={handleChange} />
                            </div>
                        </div>
                    </fieldset>

                    {/* FORM FOOTER BUTTONS */}
                    <div className="modal-footer border-top pt-3 d-flex gap-2 justify-content-end">
                        <button type="button" className="btn btn-sm btn-outline-secondary fw-semibold px-4" onClick={() => navigate('/admin/institutes')} disabled={submitInstituteMutation.isPending}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-sm text-white fw-bold px-4 shadow-sm" disabled={submitInstituteMutation.isPending} style={{ backgroundColor: isEditMode ? '#0284c7' : '#4f46e5', borderColor: isEditMode ? '#0284c7' : '#4f46e5' }}>
                            {submitInstituteMutation.isPending ? (
                                <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                            ) : (
                                <><i className={`bi ${isEditMode ? 'bi-check-circle' : 'bi-plus-circle'} me-1`}></i> {isEditMode ? 'Save Changes' : 'Register Campus'}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddInstitute;