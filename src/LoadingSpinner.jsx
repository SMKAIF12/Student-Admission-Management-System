import React from 'react';

/**
 * Reusable Loading Spinner Component
 * @param {boolean} fullScreen - If true, darkens the page and centers the loader as an overlay
 * @param {string} message - Optional text to display under the spinner
 */
const LoadingSpinner = ({ fullScreen = false, message = "Processing your request..." }) => {
    
    // Core spinner element
    const spinnerElement = (
        <div className="d-flex flex-column align-items-center justify-content-center p-4">
            <div 
                className="spinner-border text-primary" 
                role="status" 
                style={{ width: '3rem', height: '3rem', animationDuration: '0.75s' }}
            >
                <span className="visually-hidden">Loading...</span>
            </div>
            {message && (
                <p className="text-muted small fw-semibold mt-3 mb-0 tracking-wide text-center">
                    {message}
                </p>
            )}
        </div>
    );

    // If full-screen, wrap it in a fixed backdrop modal overlay
    if (fullScreen) {
        return (
            <>
                {/* Dark translucent backdrop */}
                <div 
                    className="modal-backdrop fade show" 
                    style={{ zIndex: 1060, backgroundColor: 'rgba(15, 23, 42, 0.4)' }}
                ></div>
                
                {/* Centered overlay container */}
                <div 
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
                    style={{ zIndex: 1070, pointerEvents: 'none' }}
                >
                    <div className="card border-0 shadow-lg p-4 bg-white rounded-3 mx-3" style={{ maxWidth: '320px', pointerEvents: 'auto' }}>
                        {spinnerElement}
                    </div>
                </div>
            </>
        );
    }

    // Otherwise, return it as a normal inline component
    return spinnerElement;
};

export default LoadingSpinner;