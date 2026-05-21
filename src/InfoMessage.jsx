import React from 'react';
import { useNavigate } from 'react-router';

const InfoMessage = ({ 
    message = "An active application record was found for your account identity.", 
    type = "warning", // 'warning', 'danger', 'info', 'success'
    showViewButton = false, 
    onViewClick,
    onClose // New required callback prop to flip the state in parent component
}) => {
    const navigate = useNavigate();

    const getHeaderClasses = () => {
        switch (type) {
            case 'danger': return 'bg-danger text-white';
            case 'info': return 'bg-info text-white';
            case 'success': return 'bg-success text-white';
            case 'warning': default: return 'bg-warning text-dark';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'danger': return 'bi-exclamation-octagon-fill';
            case 'info': return 'bi-info-circle-fill';
            case 'success': return 'bi-check-circle-fill';
            case 'warning': default: return 'bi-exclamation-triangle-fill';
        }
    };

    const handleViewClick = () => {
        if (onViewClick) onViewClick();
        else navigate('/student/view-application');
    };
    const handleClose = ()=>{
        if (onClose) onClose();
        else navigate('/student/dashboard');
    }
    return (
        <>
            {/* Backdrop Layer */}
            <div 
                className="modal-backdrop fade show" 
                style={{ zIndex: 1050, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)' }}
                onClick={onClose}
            ></div>

            {/* Modal Box */}
            <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1060 }}>
                <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }}>
                    <div className="modal-content border-0 shadow-lg rounded-3 overflow-hidden">
                        
                        {/* Status Strip Header */}
                        <div className={`p-3 d-flex align-items-center gap-2 ${getHeaderClasses()}`}>
                            <i className={`bi ${getIcon()} fs-5`}></i>
                            <h6 className="fw-bold m-0">Portal Notice</h6>
                        </div>

                        {/* Content Body */}
                        <div className="modal-body p-4 bg-white">
                            <p className="text-secondary small m-0" style={{ lineHeight: '1.6' }}>
                                {message}
                            </p>
                        </div>

                        {/* Footer Control Actions */}
                        <div className="modal-footer bg-light border-top p-2.5 d-flex gap-2 justify-content-end">
                            <button 
                                type="button" 
                                className="btn btn-sm btn-outline-secondary fw-semibold px-3 py-1.5"
                                onClick={handleClose}
                            >
                                OK
                            </button>
                            
                            {showViewButton && (
                                <button 
                                    type="button" 
                                    className="btn btn-sm btn-dark fw-bold px-3 py-1.5 shadow-sm"
                                    onClick={handleViewClick}
                                >
                                    <i className="bi bi-file-earmark-text me-1"></i> View Application
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
};

export default InfoMessage;