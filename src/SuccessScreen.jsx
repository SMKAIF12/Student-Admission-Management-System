import React from 'react';
import { useNavigate } from 'react-router';

const SuccessScreen = ({ 
    title = "Submission Successful!", 
    message = "Your action has been completed securely and processed by our system.", 
    referenceId, 
    primaryActionText = "Go to Dashboard", 
    onPrimaryAction,
    secondaryActionText = "View Application",
    onSecondaryAction
}) => {
    const navigate = useNavigate();

    // Default fallbacks for actions if none are provided
    const handlePrimaryClick = onPrimaryAction || (() => navigate('/student/dashboard'));
    const handleSecondaryClick = onSecondaryAction || (() => navigate('/student/view-application'));

    return (
        <div className="container d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8fafc', minHeight: '80vh' }}>
            <div className="card border-0 shadow-lg text-center p-5 bg-white rounded-3" style={{ maxWidth: '520px', width: '100%' }}>
                
                {/* 1. Success Animated/Pulse Badge Icon */}
                <div className="mb-4 d-inline-block mx-auto rounded-circle p-3 d-flex align-items-center justify-content-center" 
                     style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', width: '84px', height: '84px' }}>
                    <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3.5rem', color: '#10b981' }}></i>
                </div>

                {/* 2. Success Details */}
                <h2 className="fw-extrabold text-dark mb-2" style={{ color: '#1e1b4b', fontSize: '1.85rem' }}>
                    {title}
                </h2>
                <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '400px', lineHeight: '1.6' }}>
                    {message}
                </p>

                {/* 3. Conditional Reference ID Banner (e.g., Application Number / Txn ID) */}
                {referenceId && (
                    <div className="p-3 bg-light rounded-3 border mb-4 d-flex justify-content-between align-items-center fw-mono small">
                        <span className="text-secondary fw-semibold">Reference ID:</span>
                        <span className="badge bg-dark text-white px-3 py-2 fs-6 shadow-sm">{referenceId}</span>
                    </div>
                )}

                {/* 4. Help Note */}
                <div className="p-3 bg-success bg-opacity-10 text-success rounded border-start border-4 border-success mb-4 small text-start">
                    <i className="bi bi-shield-check me-2 fs-6"></i>
                    A confirmation log has been updated in your profile pipeline. You can safely close or navigate away from this window.
                </div>

                {/* 5. Action Buttons Grid */}
                <div className="d-flex flex-column gap-2 mt-2">
                    <button 
                        className="btn btn-primary fw-semibold py-2.5 shadow-sm w-100"
                        onClick={handlePrimaryClick}
                        style={{ backgroundColor: '#4f46e5', borderColor: '#4f46e5' }}
                    >
                        <i className="bi bi-house-door me-2"></i>{primaryActionText}
                    </button>
                    
                    {secondaryActionText && (
                        <button 
                            type="button"
                            className="btn btn-outline-secondary fw-semibold py-2.5 w-100"
                            onClick={handleSecondaryClick}
                        >
                            <i className="bi bi-file-earmark-text me-2"></i>{secondaryActionText}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default SuccessScreen;