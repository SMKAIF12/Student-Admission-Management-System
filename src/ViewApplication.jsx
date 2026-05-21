import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import React from 'react';
import { useNavigate } from 'react-router';
import LoadingSpinner from './LoadingSpinner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ViewApplication = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const baseUrl = 'https://student-admission-management-system.vercel.app';

    let candidateId = null;
    if (token) {
        try {
            const currentUser = jwtDecode(token);
            candidateId = currentUser.id;
        } catch (err) { console.error("Invalid token format:", err); }
    }

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["viewApplication", candidateId],
        queryFn: async () => {
            const response = await axios.get(`${baseUrl}/application/get/${candidateId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        },
        enabled: !!candidateId
    });

    if (isLoading) return <div className="container py-5 mt-5"><LoadingSpinner message="Loading profile..." /></div>;
    if (isError || !data?.application) return <div className="container py-5 mt-5 text-center">No profile found.</div>;

    const app = data.application;
    const hscTotal = app.marks ? Object.values(app.marks).reduce((s, m) => s + (Number(m) || 0), 0) : 0;

    const convertImageUrlToBase64 = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.setAttribute('crossOrigin', 'anonymous'); 
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg'));
            };
            img.onerror = (err) => reject(err);
            img.src = url;
        });
    };

const handleExportReportPDF = async () => {
        const doc = new jsPDF();
        
        // 1. Header Information
        doc.setFontSize(18);
        doc.text("Admission Application Profile", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Application Number: #${app.applicationNumber || "DRAFT"}`, 14, 30);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);

        // 2. Embed Photo
        if (app.personalDetails?.photo?.url) {
            try {
                const base64Image = await convertImageUrlToBase64(app.personalDetails.photo.url);
                doc.addImage(base64Image, 'JPEG', 160, 14, 30, 35);
            } catch (e) { console.warn("Photo could not be embedded"); }
        }

        // 3. Personal Details Table
        autoTable(doc, {
            startY: 55,
            head: [['Field', 'Details']],
            body: [
                ['Full Name', app.personalDetails?.fullname || 'N/A'],
                ['Phone', app.personalDetails?.phoneNumber || 'N/A'],
                ['Aadhar', app.personalDetails?.aadharNumber || 'N/A'],
                ['DOB', app.personalDetails?.dob ? new Date(app.personalDetails.dob).toLocaleDateString() : 'N/A'],
                ['Application Status', app.status?.toUpperCase() || 'N/A'],
                ['Fee Status', app.fee?.toUpperCase() || 'N/A']
            ],
            headStyles: { fillColor: [79, 70, 229] }
        });

        // 4. Academic Marks Table
        const marksRows = app.marks 
            ? Object.entries(app.marks).map(([subject, mark]) => [subject.toUpperCase(), mark])
            : [["No marks found", ""]];

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Subject', 'Score']],
            body: marksRows,
            headStyles: { fillColor: [79, 70, 229] }
        });

        // 5. Preferences/Choices Table
        const prefRows = app.selectedCourses?.map((pref, idx) => [
            idx + 1,
            pref.institute?.name || "N/A",
            pref.course?.course || "N/A"
        ]) || [];

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 10,
            head: [['#', 'Institute', 'Course']],
            body: prefRows,
            headStyles: { fillColor: [79, 70, 229] }
        });

        // 6. Allocation Status (If exists)
        if (app.status === 'allocated' && app.allocatedCourse) {
            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 10,
                head: [['Seat Allocation Details']],
                body: [[`Allotted: ${app.allocatedCourse.course?.course || 'N/A'} at ${app.allocatedCourse.institute?.name || 'N/A'}`]],
                headStyles: { fillColor: [40, 167, 69] }
            });
        }

        doc.save(`Application_${app.applicationNumber || 'Profile'}.pdf`);
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'allocated': return 'bg-success text-white';
            case 'rejected': return 'bg-danger text-white';
            case 'applied': return 'bg-info text-dark';
            default: return 'bg-secondary text-white';
        }
    };

    return (
        <div className="container py-5" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', marginTop: '2.5rem' }}>
            <div className="card border-0 shadow-sm mx-auto rounded-3 bg-white overflow-hidden" style={{ maxWidth: '1040px' }}>
                
                <div className="p-4 d-flex justify-content-between align-items-center flex-wrap gap-3 text-white" 
                     style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' }}>
                    <div>
                        <span className="badge bg-white text-dark fw-mono border mb-2 fs-6 px-3 py-1.5">ID: #{app.applicationNumber || 'N/A'}</span>
                        <h3 className="fw-extrabold m-0">Admission Application Profile</h3>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-warning fw-bold px-3 py-2" onClick={handleExportReportPDF}>
                            <i className="bi bi-file-earmark-pdf me-1"></i> Export PDF
                        </button>
                        <button className="btn btn-sm btn-light fw-bold px-3 py-2" onClick={() => navigate('/student/dashboard')}>
                            <i className="bi bi-arrow-left me-1"></i> Back
                        </button>
                    </div>
                </div>

                <div className="card-body p-4">
                    <div className="row g-3 mb-4">
                        <div className="col-md-3">
                            <span className="text-muted d-block small">Status</span>
                            <span className={`badge ${getStatusBadgeClass(app.status)}`}>{app.status}</span>
                        </div>
                        <div className="col-md-3">
                            <span className="text-muted d-block small">Cutoff</span>
                            <h4 className="fw-bold">{app.cutoff?.toFixed(2)}</h4>
                        </div>
                        <div className="col-md-3">
                            <span className="text-muted d-block small">HSC Total</span>
                            <h4 className="fw-bold">{hscTotal} / 600</h4>
                        </div>
                    </div>

                    <div className="row g-4">
                        <div className="col-lg-6">
                            <div className="row">
                                <div className="col-md-5">
                                    {app.personalDetails?.photo?.url ? (
                                        <img src={app.personalDetails.photo.url} alt="Profile" className="img-thumbnail w-100" />
                                    ) : (
                                        <div className="bg-light p-4 text-center border">No Photo</div>
                                    )}
                                </div>
                                <div className="col-md-7">
                                    <h5 className="border-bottom pb-2">Personal</h5>
                                    <p><strong>Name:</strong> {app.personalDetails?.fullname}</p>
                                    <p><strong>Phone:</strong> {app.personalDetails?.phoneNumber}</p>
                                    <p><strong>Aadhar:</strong> {app.personalDetails?.aadharNumber}</p>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-6">
                            <h5 className="border-bottom pb-2 mb-3">Marks Breakdown</h5>
                            <ul className="list-group">
                                {Object.entries(app.marks || {}).map(([sub, mark]) => (
                                    <li key={sub} className="list-group-item d-flex justify-content-between">
                                        <span className="text-capitalize">{sub}</span>
                                        <strong>{mark}</strong>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <h5 className="border-bottom pb-2 mt-4 mb-3">Selected Preferences</h5>
                    <table className="table table-striped">
                        <thead><tr><th>#</th><th>Institute</th><th>Course</th></tr></thead>
                        <tbody>
                            {app.selectedCourses?.map((pref, idx) => (
                                <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td>{pref.institute?.name || "N/A"}</td>
                                    <td>{pref.course?.course || "N/A"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {app.status === 'allocated' && app.allocatedCourse && (
                        <div className="alert alert-success mt-4">
                            <strong>Allotted:</strong> {app.allocatedCourse.course?.course} at {app.allocatedCourse.institute?.name}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewApplication;