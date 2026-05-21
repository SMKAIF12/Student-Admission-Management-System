import React from 'react';
// ⚡ IMPORT: Core document primitive building blocks
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Define strict camelCase styles optimized for vector sheet layouts
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#334155',
        backgroundColor: '#ffffff',
    },
    // Premium Accent Banner Header
    headerBanner: {
        backgroundColor: '#3730a3',
        padding: 20,
        borderRadius: 6,
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        color: '#e0e7ff',
        fontSize: 10,
        marginTop: 4,
    },
    appNumberBadge: {
        backgroundColor: '#ffffff',
        color: '#3730a3',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 'bold',
    },
    // Metrics Summary Section Row
    summaryRow: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 6,
        padding: 12,
        marginBottom: 25,
    },
    summaryBlock: {
        flex: 1,
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#cbd5e1',
    },
    summaryBlockLast: {
        flex: 1,
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 8,
        textTransform: 'uppercase',
        color: '#64748b',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    cutoffHighlight: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4f46e5',
    },
    // Two-Column Personal Details Grid Section
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1e1b4b',
        textTransform: 'uppercase',
        borderBottomWidth: 1,
        borderBottomColor: '#4f46e5',
        paddingBottom: 4,
        marginBottom: 12,
    },
    profileContainer: {
        flexDirection: 'row',
        marginBottom: 25,
    },
    photoBox: {
        width: 105,
        height: 125,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 4,
        padding: 3,
        marginRight: 20,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    placeholderAvatar: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailsGrid: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridItem: {
        width: '50%',
        marginBottom: 12,
        paddingRight: 10,
    },
    gridLabel: {
        fontSize: 8,
        color: '#64748b',
        marginBottom: 2,
    },
    gridValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    // Tabular Layout Grid Structure
    table: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 25,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingVertical: 7,
        paddingHorizontal: 10,
    },
    col1: { width: '15%', textAlign: 'center' },
    col2: { width: '45%' },
    col3: { width: '40%' },
    colMarksLabel: { width: '25%', textAlign: 'center', fontWeight: 'bold' },
    colMarksVal: { width: '25%', textAlign: 'center' },
    // Allocated Banner
    allocationCard: {
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#bbf7d0',
        borderRadius: 6,
        padding: 15,
        marginTop: 10,
    },
    allocationHeading: {
        color: '#15803d',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    allocationText: {
        color: '#1e293b',
        fontSize: 9,
        lineHeight: 1.4,
    }
});

// Structural PDF wrapper matching user document data variables
export const ApplicationPDFDocument = ({ app, totalMarks }) => {
    const maskAadhar = (num) => {
        if (!num) return "N/A";
        const cleaned = num.replace(/\s+/g, '');
        return `XXXX-XXXX-${cleaned.slice(-4)}`;
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                
                {/* 1. Header Block Context */}
                <View style={styles.headerBanner}>
                    <View>
                        <Text style={styles.headerTitle}>Admission Profile Document</Text>
                        <Text style={styles.headerSubtitle}>Centralized Merit Allocation Counseling Ledger</Text>
                    </View>
                    <Text style={styles.appNumberBadge}>#{app.applicationNumber || "DRAFT"}</Text>
                </View>

                {/* 2. Form Lifecycle Status Overview Segment */}
                <View style={styles.summaryRow}>
                    <View style={styles.summaryBlock}>
                        <Text style={styles.summaryLabel}>Application Status</Text>
                        <Text style={styles.summaryValue}>{app.status?.toUpperCase()}</Text>
                    </View>
                    <View style={styles.summaryBlock}>
                        <Text style={styles.summaryLabel}>Fee Transaction</Text>
                        <Text style={styles.summaryValue}>{app.fee === 'paid' ? 'PAID & VERIFIED' : 'PENDING'}</Text>
                    </View>
                    <View style={styles.summaryBlock}>
                        <Text style={styles.summaryLabel}>HSC Combined Marks</Text>
                        <Text style={styles.summaryValue}>{totalMarks} / 600</Text>
                    </View>
                    <View style={styles.summaryBlockLast}>
                        <Text style={styles.summaryLabel}>Calculated Cutoff</Text>
                        <Text style={[styles.summaryValue, styles.cutoffHighlight]}>{app.cutoff?.toFixed(2) || "0.00"}</Text>
                    </View>
                </View>

                {/* 3. Personal Core Grid layout block with Image support */}
                <Text style={styles.sectionTitle}>Candidate Identification Profile</Text>
                <View style={styles.profileContainer}>
                    <View style={styles.photoBox}>
                        {app.personalDetails?.photo?.url ? (
                            <Image src={app.personalDetails.photo.url} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.placeholderAvatar}><Text style={{fontSize: 8, color: '#94a3b8'}}>No Photo</Text></View>
                        )}
                    </View>
                    
                    <View style={styles.detailsGrid}>
                        <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>FULL NAME OF STUDENT</Text>
                            <Text style={styles.gridValue}>{app.personalDetails?.fullname || "N/A"}</Text>
                        </View>
                        <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>MOBILE PHONE NUMBER</Text>
                            <Text style={styles.gridValue}>{app.personalDetails?.phoneNumber || "N/A"}</Text>
                        </View>
                        <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>AADHAR NUMBER ID</Text>
                            <Text style={styles.gridValue}>{maskAadhar(app.personalDetails?.aadharNumber || app.personalDetails?.aadhar)}</Text>
                        </View>
                        <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>DATE OF BIRTH</Text>
                            <Text style={styles.gridValue}>
                                {app.personalDetails?.dob ? new Date(app.personalDetails.dob).toLocaleDateString('en-US', { dateStyle: 'long' }) : "N/A"}
                            </Text>
                        </View>
                        <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>HSC SYSTEM REGISTRATION ID</Text>
                            <Text style={styles.gridValue}>{app.academics?.hscregisternumber || "N/A"}</Text>
                        </View>
                    </View>
                </View>

                {/* 4. Transcripts Ledger Grid display */}
                <Text style={styles.sectionTitle}>HSC Marks Transcript split</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.colMarksLabel}>Subject</Text>
                        <Text style={styles.colMarksLabel}>Score</Text>
                        <Text style={styles.colMarksLabel}>Subject</Text>
                        <Text style={styles.colMarksLabel}>Score</Text>
                    </View>
                    {app.marks ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {Object.keys(app.marks).map((subj, i) => (
                                <View key={i} style={{ width: '50%', flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 6, paddingHorizontal: 10 }}>
                                    <Text style={{ width: '60%', textTransform: 'capitalize', color: '#475569' }}>{subj}</Text>
                                    <Text style={{ width: '40%', fontWeight: 'bold', textAlign: 'center' }}>{app.marks[subj]} / 100</Text>
                                </View>
                            ))}
                        </View>
                    ) : null}
                </View>

                {/* 5. Choice Preferences Pool Block */}
                <Text style={styles.sectionTitle}>Prioritized Counseling Choices</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.col1, { fontWeight: 'bold' }]}>Rank</Text>
                        <Text style={[styles.col2, { fontWeight: 'bold' }]}>Campus Name</Text>
                        <Text style={[styles.col3, { fontWeight: 'bold' }]}>Discipline Stream Specialization</Text>
                    </View>
                    {app.selectedCourses && app.selectedCourses.length > 0 ? (
                        app.selectedCourses.map((pref, idx) => (
                            <View style={styles.tableRow} key={idx}>
                                <Text style={styles.col1}>#{idx + 1}</Text>
                                <Text style={[styles.col2, { fontWeight: 'bold' }]}>{pref.institute?.name || "Unknown Campus"}</Text>
                                <Text style={styles.col3}>
                                    [{pref.course?.degree?.toLowerCase().endsWith('technology') ? 'BTECH' : 'BE'}] {pref.course?.course || "Unknown"}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <View style={{ padding: 10 }}><Text style={{ color: '#94a3b8' }}>No choices configured.</Text></View>
                    )}
                </View>

                {/* 6. Allotted Campus Placement Callout Alert */}
                {app.status === 'allocated' && app.allocatedCourse && (
                    <View style={styles.allocationCard}>
                        <Text style={styles.allocationHeading}>Admissions Counseling Seat Allocated</Text>
                        <Text style={styles.allocationText}>
                            Congratulations! Based on your cutoff score projection performance index, you have been officially allocated an academic seat profile grid at {app.allocatedCourse.institute?.name || "Target Campus"} within the engineering discipline branch specialization sheet of {app.allocatedCourse.course?.course || "Target Program Stream"}.
                        </Text>
                    </View>
                )}

            </Page>
        </Document>
    );
};