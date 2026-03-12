import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login';

// Dashboard imports
import EmployeeDashboard from './pages/dashboards/EmployeeDashboard';
import CMDDashboard from './pages/dashboards/CMDDashboard';
import ComplaintOfficerDashboard from './pages/dashboards/ComplaintOfficerDashboard';
import EnquiryOfficerDashboard from './pages/dashboards/EnquiryOfficerDashboard';
import DADashboard from './pages/dashboards/DADashboard';
import CODashboard from './pages/dashboards/CODashboard';
import CCDashboard from './pages/dashboards/CCDashboard';
import AADashboard from './pages/dashboards/AADashboard';
import CircleHeadDashboard from './pages/dashboards/CircleHeadDashboard';
import GMDashboard from './pages/dashboards/GMDashboard';

// Feature imports
import ComplaintForm from './pages/complaints/ComplaintForm';
import GenericPortal from './pages/GenericPortal';

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboards */}
        <Route path="/dashboard/employee" element={<EmployeeDashboard />} />
        <Route path="/dashboard/cmd" element={<CMDDashboard />} />
        <Route path="/dashboard/complaint-officer" element={<ComplaintOfficerDashboard />} />
        <Route path="/dashboard/enquiry-officer" element={<EnquiryOfficerDashboard />} />
        <Route path="/dashboard/da" element={<DADashboard />} />
        <Route path="/dashboard/co" element={<CODashboard />} />
        <Route path="/dashboard/concurrence-committee" element={<CCDashboard />} />
        <Route path="/dashboard/appeal-authority" element={<AADashboard />} />
        <Route path="/dashboard/circle-head" element={<CircleHeadDashboard />} />
        <Route path="/dashboard/gm" element={<GMDashboard />} />

        {/* Feature Routes */}
        <Route path="/complaints/new" element={<ComplaintForm />} />
        <Route path="/complaints" element={<GenericPortal title="All Complaints" userRole="COMPLAINT_OFFICER" />} />

        <Route path="/cases/review" element={<GenericPortal title="Pending Cases Review" userRole="CMD" />} />
        <Route path="/officers" element={<GenericPortal title="Enquiry Officers" userRole="CMD" />} />

        <Route path="/cases/active" element={<GenericPortal title="Active Enquiries" userRole="DA" />} />
        <Route path="/orders/pending" element={<GenericPortal title="Pending Orders" userRole="DA" />} />

        <Route path="/enquiries/assigned" element={<GenericPortal title="My Enquiries" userRole="ENQUIRY_OFFICER" />} />
        <Route path="/reports/submit" element={<GenericPortal title="Submit Reports" userRole="ENQUIRY_OFFICER" />} />

        <Route path="/settings" element={<GenericPortal title="System Settings" />} />
        <Route path="/cases" element={<GenericPortal title="Case Management" />} />

        {/* Default redirect */}
        <Route path="/dashboard" element={<Navigate to="/dashboard/cmd" replace />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
