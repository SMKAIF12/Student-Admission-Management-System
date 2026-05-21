import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import LoadingSpinner from './LoadingSpinner';
import InfoMessage from './InfoMessage';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ViewAllApplications = () => {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');
  const baseUrl = 'http://localhost:3000';

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  // ✅ ADDED STATE: Tracks targeted sort modes ("none", "cutoff", "newest", "oldest")
  const [sortMode, setSortMode] = useState("none");
  const [notice, setNotice] = useState({ show: false, message: '', type: '' });

  // ✅ ADDED: Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Tracks which application row dropdown is actively open by storing its application ID
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  // Tracks which table row is currently expanded to show details
  const [expandedRowId, setExpandedRowId] = useState(null);

  // Fetching all application records from the server endpoint mapping stack
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["allApplicationsList"],
    queryFn: async () => {
      const response = await axios.get(`${baseUrl}/admin/applications/get`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data?.applications || response.data || [];
    }
  });

  // Close any open dropdown menu instantly if the administrator clicks anywhere else on the window workspace
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Individual action mutation: Dedicated to manual review adjustments, Waitlisting, and Rejections
  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, nextStatus }) => {
      return await axios.put(`${baseUrl}/admin/managestatus`,
        { applicationId, status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: (response) => {
      setNotice({
        show: true,
        message: response.data?.message || 'Application record updated successfully.',
        type: 'success'
      });
      setActiveDropdownId(null); // Auto-close dropdown menu block on execution success
      queryClient.invalidateQueries(["allApplicationsList"]);
    },
    onError: (err) => {
      setNotice({
        show: true,
        message: err.response?.data?.message || 'Failed to update application criteria.',
        type: 'danger'
      });
      setActiveDropdownId(null);
    }
  });

  // Global Bulk Pooling Process Trigger Engine
  const bulkAllocationMutation = useMutation({
    mutationFn: async () => {
      return await axios.post(`${baseUrl}/admin/allocateseat`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: (response) => {
      setNotice({
        show: true,
        message: response.data?.message || 'Bulk seat matching counseling completed successfully!',
        type: 'success'
      });
      queryClient.invalidateQueries(["allApplicationsList"]);
    },
    onError: (err) => {
      setNotice({
        show: true,
        message: err.response?.data?.message || 'Bulk engine processing failure.',
        type: 'danger'
      });
    }
  });
  const handleExportAllPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text("All Candidate Applications Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    // Prepare table rows from the filtered list
    const tableRows = displayedApplications.map(app => [
      `#${app.applicationNumber || "N/A"}`,
      app.personalDetails?.fullname || "N/A",
      app.status?.toUpperCase() || "N/A",
      app.fee?.toUpperCase() || "N/A",
      app.cutoff?.toFixed(2) || "0.00",
      app.createdAt || "N/A"
    ]);

    // Use autoTable to generate the list
    autoTable(doc, {
      startY: 40,
      head: [['App ID', 'Name', 'Status', 'Fee', 'Cutoff','Applied on']],
      body: tableRows,
      headStyles: { fillColor: [79, 70, 229] }, // Matches your indigo theme
      styles: { fontSize: 10 }
    });

    doc.save(`All_Applications_Report_${new Date().toLocaleDateString()}.pdf`);
  };
  const handleIndividualStatusUpdate = (applicationId, targetStatus) => {
    let confirmMessage = "";
    if (targetStatus === 'rejected') {
      confirmMessage = "Are you sure you want to permanently reject this candidate's admission application file?";
    } else if (targetStatus === 'waitinglist') {
      confirmMessage = "Are you sure you want to move this candidate to the official waiting list pool?";
    } else if (targetStatus === 'applied') {
      confirmMessage = "Are you sure you want to update this application's status to 'Applied'?";
    }

    if (window.confirm(confirmMessage)) {
      updateStatusMutation.mutate({ applicationId, nextStatus: targetStatus });
    }
  };

  const handleRunBulkAllocation = () => {
    if (window.confirm("CRITICAL ACTION: This will process every active, fee-paid applicant against current seat capacities sorted by merit cutoff. Proceed?")) {
      bulkAllocationMutation.mutate();
    }
  };

  const toggleRowExpand = (id) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="container py-5" style={{ marginTop: '3rem' }}>
        <LoadingSpinner message="Extracting candidate admission profile applications list..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container py-5" style={{ marginTop: '3rem' }}>
        <div className="alert alert-danger border-start border-4 border-danger p-4 shadow-sm">
          <h5 className="fw-bold text-dark"><i className="bi bi-exclamation-octagon-fill me-2 text-danger"></i>Data Engine Failure</h5>
          <p className="text-secondary small m-0 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  const applications = Array.isArray(data) ? data : [];

  // Filter application files based on the text string and status selections
  const filteredApplications = applications.filter(app => {
    const studentName = app.personalDetails?.fullname?.toLowerCase() || "";
    const aadharNum = app.personalDetails?.aadharNumber || app.personalDetails?.aadhar || "";
    const appNum = app.applicationNumber?.toLowerCase() || "";
    const matchesSearch = studentName.includes(searchTerm.toLowerCase()) ||
      aadharNum.includes(searchTerm) ||
      appNum.includes(searchTerm.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && app.status === statusFilter;
  });

  // ✅ REFACTORED ELEMENT: High-performance sorting engine running date transformations safely
  const displayedApplications = [...filteredApplications].sort((a, b) => {
    if (sortMode === "cutoff") {
      const cutA = a.cutoff !== undefined && a.cutoff !== null ? Number(a.cutoff) : 0;
      const cutB = b.cutoff !== undefined && b.cutoff !== null ? Number(b.cutoff) : 0;
      return cutB - cutA; // Highest merit cutoff comes first
    }

    if (sortMode === "newest") {
      // Descending timestamps re-ordering
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    }

    if (sortMode === "oldest") {
      // Ascending timestamps re-ordering
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : Infinity;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : Infinity;
      return dateA - dateB;
    }

    return 0; // Fallback default unordered structure array loop
  });

  // ✅ ADDED: Pagination Logic Calculations
  const totalPages = Math.ceil(displayedApplications.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = displayedApplications.slice(indexOfFirstItem, indexOfLastItem);

  const getBadgeClass = (status, fee) => {
    if (fee === 'pending') return 'bg-warning text-dark';
    switch (status) {
      case 'allocated': return 'bg-success text-white';
      case 'rejected': return 'bg-danger text-white';
      case 'waitinglist': return 'bg-dark text-warning';
      case 'applied': return 'bg-info text-dark';
      default: return 'bg-secondary text-white';
    }
  };
  const handleExportSinglePDF = (app) => {
    const doc = new jsPDF();
    const hscTotal = app.marks ? Object.values(app.marks).reduce((s, m) => s + (Number(m) || 0), 0) : 0;

    // Header
    doc.setFontSize(18);
    doc.text("Application Summary Report", 14, 22);
    doc.setFontSize(11);
    doc.text(`Application Number: #${app.applicationNumber}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);

    // Data Rows
    const body = [
      ["Applicant Name", app.personalDetails?.fullname || "N/A"],
      ["Application Status", app.status?.toUpperCase() || "N/A"],
      ["Fee Status", app.fee?.toUpperCase() || "N/A"],
      ["Cutoff Score", app.cutoff?.toFixed(2) || "0.00"],
      ["HSC Aggregate", `${hscTotal} / 600`]
    ];

    autoTable(doc, {
      startY: 45,
      head: [['Field', 'Details']],
      body: body,
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`Application_${app.applicationNumber}.pdf`);
  };
  return (
    <div className="container py-5" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>

      {notice.show && (
        <InfoMessage
          message={notice.message}
          type={notice.type}
          onClose={() => setNotice({ show: false, message: '', type: '' })}
        />
      )}

      {/* Dashboard Workspace Header Layout banner */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden mb-4">
        <div className="p-4 text-white d-flex justify-content-between align-items-center flex-wrap gap-3"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' }}>
          <div>
            <h3 className="fw-extrabold m-0 tracking-tight"><i className="bi bi-people-fill me-2"></i>Candidate Applications Matrix</h3>
            <p className="text-white-50 m-0 mt-1 small">Track individual candidate statuses and execute global counseling placement loops.</p>
          </div>
          <div className="d-flex gap-2">
            {/* New PDF Export Button */}
            <button className="btn btn-outline-light fw-bold shadow-sm px-3 py-2" onClick={handleExportAllPDF}>
              <i className="bi bi-file-earmark-pdf me-2"></i>Export All
            </button>
            <button
              className="btn btn-warning fw-bold text-dark shadow-sm px-3 py-2 border-0"
              onClick={handleRunBulkAllocation}
              disabled={bulkAllocationMutation.isPending}
            >
              {bulkAllocationMutation.isPending ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Allocating Pool...</>
              ) : (
                <><i className="bi bi-cpu-fill me-2"></i>Process Bulk Seat Allocation</>
              )}
            </button>
          </div>

        </div>

        {/* Control Panel: Integrated Search, Filter and Date Sorting Dropdowns */}
        <div className="card-body bg-light border-bottom p-3">
          <div className="row g-3">
            {/* Search Input Box */}
            <div className="col-12 col-md-5">
              <div className="input-group input-group-sm h-100">
                <span className="input-group-text bg-white text-muted border-end-0"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control border-start-0 shadow-none py-2"
                  placeholder="Search by student name, application ID, or Aadhar..."
                  value={searchTerm}
                  // ✅ ADDED: Reset page on search
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            {/* Lifecycle Phase Filter Selection Box */}
            <div className="col-12 col-sm-6 col-md-3">
              <select
                className="form-select form-select-sm shadow-none py-2 text-secondary fw-semibold bg-white"
                value={statusFilter}
                // ✅ ADDED: Reset page on filter
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">🔍 Filter: All Phases</option>
                <option value="pending">⏳ Filter: Fee Pending</option>
                <option value="applied">📥 Filter: Applied Files</option>
                <option value="waitinglist">⏱️ Filter: Waiting List</option>
                <option value="allocated">🎓 Filter: Allocated Seats</option>
                <option value="rejected">❌ Filter: Rejected Files</option>
              </select>
            </div>

            {/* ✅ EXPLICIT CHRONOLOGICAL DATE & SCORE SORT DROPDOWN SELECTION */}
            <div className="col-12 col-sm-6 col-md-4">
              <select
                className="form-select form-select-sm shadow-none py-2 text-secondary fw-semibold bg-white"
                value={sortMode}
                // ✅ ADDED: Reset page on sort
                onChange={(e) => { setSortMode(e.target.value); setCurrentPage(1); }}
              >
                <option value="none">➡️ Sort Rules: Default Processing</option>
                <option value="cutoff">🔢 Sort Rules: Highest Cutoff Scores</option>
                <option value="newest">📅 Sort Rules: Newest Submission First</option>
                <option value="oldest">📅 Sort Rules: Oldest Submission First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Work Content Layout Table View */}
        <div className="card-body p-0 bg-white">
          {displayedApplications.length > 0 ? (
            <div className="table-responsive" style={{ minHeight: '350px' }}>
              <table className="table table-hover align-middle m-0 small text-secondary">
                <thead className="table-light text-dark border-bottom fw-bold">
                  <tr>
                    <th style={{ width: '150px' }} className="ps-4 text-nowrap">App ID</th>
                    <th>Applicant Name</th>
                    <th>Academic Info</th>
                    <th>Preferences Summary</th>
                    <th className="text-center">Lifecycle Phase</th>
                    <th style={{ width: '100px' }} className="pe-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* ✅ ADDED: Map over currentItems instead of displayedApplications */}
                  {currentItems.map((app) => {
                    const hscTotal = app.marks ? Object.values(app.marks).reduce((s, m) => s + (Number(m) || 0), 0) : 0;
                    const isDropdownOpen = activeDropdownId === app._id;
                    const isRowExpanded = expandedRowId === app._id;

                    return (
                      <React.Fragment key={app._id}>
                        {/* PRIMARY APPLICATION LIST ENTRY ROW */}
                        <tr style={{ cursor: 'pointer', transition: 'background-color 0.2s' }} className={isRowExpanded ? 'table-light' : ''}>
                          <td className="fw-mono fw-bold text-indigo ps-4 text-nowrap" onClick={() => toggleRowExpand(app._id)}>
                            <i className={`bi ${isRowExpanded ? 'bi-chevron-up' : 'bi-chevron-down'} me-2 small text-muted`} style={{ transition: 'transform 0.2s' }}></i>
                            #{app.applicationNumber || "DRAFT"}
                          </td>
                          <td onClick={() => toggleRowExpand(app._id)}>
                            <div className="fw-bold text-dark">{app.personalDetails?.fullname}</div>
                            {/* Trace stamp display context tool mapping timestamp strings beautifully */}
                            {app.createdAt && (
                              <span className="extra-small text-muted d-block mt-0.5 font-mono">
                                <i className="bi bi-clock-history me-1"></i>
                                Sub: {new Date(app.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </td>
                          <td onClick={() => toggleRowExpand(app._id)}>
                            <div className="fw-semibold text-dark">Cutoff: <span className="text-indigo">{app.cutoff?.toFixed(2) || "0.00"}</span></div>
                            <span className="text-muted extra-small d-block">HSC Agg: {hscTotal} / 600</span>
                          </td>

                          <td onClick={() => toggleRowExpand(app._id)}>
                            <div className="text-truncate fw-bold text-dark" style={{ maxWidth: '240px' }}>
                              {app.status === 'allocated' && app.allocatedCourse
                                ? `${app.allocatedCourse.course?.course || "Allotted Stream"}`
                                : app.selectedCourses?.[0]?.course?.course || app.selectedCourses?.[0]?.courseId?.course || "No options mapped"
                              }
                            </div>
                            <span className="text-muted extra-small d-block mt-0.5" style={{ lineHeight: '1.4' }}>
                              <div>
                                <i className="bi bi-building me-1 small text-indigo"></i>
                                {app.status === 'allocated' && app.allocatedCourse
                                  ? app.allocatedCourse.institute?.name || "Allotted Campus"
                                  : app.selectedCourses?.[0]?.institute?.name || app.selectedCourses?.[0]?.instituteId?.name || "N/A"}
                              </div>
                              {app.selectedCourses && app.selectedCourses.length > 1 && (
                                <div className="text-indigo fw-semibold mt-0.5">
                                  <i className="bi bi-list-stars me-1"></i>
                                  +{app.selectedCourses.length - 1} Alternative Choices
                                </div>
                              )}
                            </span>
                          </td>

                          <td className="text-center" onClick={() => toggleRowExpand(app._id)}>
                            <span className={`badge px-2.5 py-1.5 rounded-pill fw-semibold text-uppercase ${getBadgeClass(app.status, app.fee)}`}>
                              {app.fee === 'pending' ? 'Draft - Unpaid' : app.status}
                            </span>
                          </td>
                          <td className="pe-4 text-center">
                            {app.fee === 'pending' ? (
                              <span className="text-muted extra-small d-block py-1 text-nowrap"><i className="bi bi-lock-fill me-1"></i>Unpaid</span>
                            ) : app.status === 'allocated' ? (
                              <span className="text-success extra-small fw-bold text-nowrap"><i className="bi bi-check2-circle me-1"></i>Finalized</span>
                            ) : (
                              /* Actions Dropdown Button Layout */
                              <div className="d-inline-block" ref={isDropdownOpen ? dropdownRef : null} style={{ position: 'relative' }}>
                                <button
                                  className="btn btn-sm p-0 d-flex align-items-center justify-content-center border shadow-sm rounded-circle bg-white hover-bg-light"
                                  type="button"
                                  onClick={() => setActiveDropdownId(isDropdownOpen ? null : app._id)}
                                  disabled={updateStatusMutation.isPending}
                                  style={{ width: '32px', height: '32px', transition: 'all 0.2s' }}
                                >
                                  <i className="bi bi-three-dots text-dark fs-6"></i>
                                </button>

                                {isDropdownOpen && (
                                  <ul
                                    className="dropdown-menu show border rounded-3 p-1 position-absolute end-0 bg-white"
                                    style={{
                                      zIndex: 1050,
                                      top: '110%',
                                      minWidth: '180px',
                                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                      animation: 'fadeIn 0.15s ease-out'
                                    }}
                                  >
                                    <div className="px-2 py-1 text-muted extra-small text-uppercase border-bottom fw-bold tracking-wider mb-1">
                                      Application File
                                    </div>
                                    {app.status !== 'applied' && (
                                      <li>
                                        <button
                                          type="button"
                                          className="dropdown-item py-2 rounded-2 fw-semibold d-flex align-items-center text-primary style-hover-review"
                                          onClick={() => handleIndividualStatusUpdate(app._id, 'applied')}
                                          style={{ fontSize: '0.8rem' }}
                                        >
                                          <i className="bi bi-arrow-clockwise me-2 fs-6"></i>Mark as Applied
                                        </button>
                                      </li>
                                    )}
                                    {app.status !== 'waitinglist' && (
                                      <li>
                                        <button
                                          type="button"
                                          className="dropdown-item py-2 rounded-2 fw-semibold d-flex align-items-center text-dark style-hover-wait"
                                          onClick={() => handleIndividualStatusUpdate(app._id, 'waitinglist')}
                                          style={{ fontSize: '0.8rem' }}
                                        >
                                          <i className="bi bi-hourglass-split text-warning me-2 fs-6"></i>Move to Waitlist
                                        </button>
                                      </li>
                                    )}
                                    <li><hr className="dropdown-divider my-1" /></li>
                                    {app.status !== 'rejected' && (
                                      <li>
                                        <button
                                          type="button"
                                          className="dropdown-item py-2 rounded-2 fw-semibold d-flex align-items-center text-danger style-hover-reject"
                                          onClick={() => handleIndividualStatusUpdate(app._id, 'rejected')}
                                          style={{ fontSize: '0.8rem' }}
                                        >
                                          <i className="bi bi-x-circle me-2 fs-6"></i>Reject File
                                        </button>
                                      </li>
                                    )}
                                  </ul>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>

                        {/* EXPANDABLE INNER DETAILS DRAWER PANEL */}
                        {isRowExpanded && (
                          <tr className="bg-light bg-opacity-25" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                            <td colSpan="6" className="p-4 border-bottom bg-light bg-opacity-40">
                              <div className="card border-0 shadow-xs rounded-3 p-3 bg-white border">
                                <div className="row align-items-center g-4">

                                  {/* 1. Passport Photograph Box */}
                                  <div className="col-12 col-md-3 col-lg-2 text-center border-end-md pe-md-4">
                                    <div className="mx-auto rounded-3 overflow-hidden shadow-sm border p-1 bg-white mb-2" style={{ width: '100px', height: '120px' }}>
                                      {app.personalDetails?.photo?.url ? (
                                        <img src={app.personalDetails.photo.url} alt="Applicant Avatar" className="w-100 h-100 object-fit-cover rounded-2" />
                                      ) : (
                                        <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted flex-column bg-light extra-small">
                                          <i className="bi bi-person-bounding-box fs-3 mb-1"></i>No Image
                                        </div>
                                      )}
                                    </div>
                                    <div className="extra-small text-uppercase fw-bold text-muted tracking-wider">Passport Photo</div>
                                  </div>

                                  {/* 2. Full Transcripts Ledger Display Grid */}
                                  <div className="col-12 col-md-6 col-lg-7">
                                    <div className="px-1">
                                      <h6 className="fw-bold text-dark mb-2.5 d-flex align-items-center" style={{ fontSize: '0.85rem' }}>
                                        <i className="bi bi-journal-check me-2 text-indigo"></i>HSC Marks Split Transcript
                                      </h6>
                                      <div className="row g-2 text-center">
                                        {app.marks ? Object.keys(app.marks).map((subj) => (
                                          <div className="col-4 col-sm-2" key={subj}>
                                            <div className="p-2 bg-light border rounded-2 shadow-xs">
                                              <span className="text-capitalize extra-small text-muted d-block text-truncate border-bottom pb-1 mb-1 fw-bold">{subj}</span>
                                              <strong className="fs-6 fw-bold text-dark d-block">{app.marks[subj]}</strong>
                                            </div>
                                          </div>
                                        )) : <div className="text-muted extra-small py-2 text-start">No marks schema payload found.</div>}
                                      </div>
                                    </div>
                                  </div>

                                  {/* 3. Document Certificate Attachments Suite */}
                                  <div className="col-12 col-md-3 col-lg-3 text-md-end border-start-md ps-md-4">
                                    <h6 className="fw-bold text-dark mb-2.5 text-md-start" style={{ fontSize: '0.85rem' }}>
                                      <i className="bi bi-file-earmark-check me-2 text-indigo"></i>Verified Credentials
                                    </h6>
                                    <div className="d-flex flex-column gap-2">
                                      <a href={app.academics?.sslc?.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-dark text-start bg-white shadow-none text-truncate fw-semibold">
                                        <i className="bi bi-file-earmark-pdf text-danger me-2 fs-6"></i>SSLC Marksheet Certificate
                                      </a>
                                      <a href={app.academics?.hsc?.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-dark text-start bg-white shadow-none text-truncate fw-semibold">
                                        <i className="bi bi-file-earmark-pdf text-danger me-2 fs-6"></i>HSC Marksheet Certificate
                                      </a>
                                    </div>
                                  </div>

                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-5 text-muted border-top border-dashed rounded bg-white">
              <i className="bi bi-folder-x fs-2 d-block mb-2"></i> No applications found matching your criteria.
            </div>
          )}

          {/* ✅ ADDED: Pagination Footer */}
          {displayedApplications.length > 0 && (
            <div className="d-flex align-items-center justify-content-between p-3 border-top bg-white">
              <div className="small text-muted">
                Showing {displayedApplications.length === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, displayedApplications.length)} of {displayedApplications.length} entries
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

        </div>
      </div>

      {/* Embedded Micro-Transitions Styling Block */}
      <style>{`
                .style-hover-review:hover { background-color: #f0fdf4 !important; }
                .style-hover-wait:hover { background-color: #fefce8 !important; }
                .style-hover-reject:hover { background-color: #fef2f2 !important; }
                .hover-bg-light:hover { background-color: #f1f5f9 !important; transform: scale(1.05); }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @media (min-width: 768px) {
                    .border-end-md { border-right: 1px solid #e2e8f0 !important; }
                    .border-start-md { border-left: 1px solid #e2e8f0 !important; }
                }
            `}</style>
    </div>
  );
};

export default ViewAllApplications;