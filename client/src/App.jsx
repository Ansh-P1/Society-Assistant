import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ResidentDashboard from './pages/ResidentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NewComplaint from './pages/NewComplaint';
import MyComplaints from './pages/MyComplaints';
import ComplaintDetail from './pages/ComplaintDetail';
import AdminComplaints from './pages/AdminComplaints';
import AdminComplaintDetail from './pages/AdminComplaintDetail';
import AdminSettings from './pages/AdminSettings';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/resident"
        element={
          <ProtectedRoute role="resident">
            <ResidentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/complaints"
        element={
          <ProtectedRoute role="resident">
            <MyComplaints />
          </ProtectedRoute>
        }
      />
      <Route
        path="/complaints/new"
        element={
          <ProtectedRoute role="resident">
            <NewComplaint />
          </ProtectedRoute>
        }
      />
      <Route
        path="/complaints/:id"
        element={
          <ProtectedRoute role="resident">
            <ComplaintDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/complaints"
        element={
          <ProtectedRoute role="admin">
            <AdminComplaints />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/complaints/:id"
        element={
          <ProtectedRoute role="admin">
            <AdminComplaintDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute role="admin">
            <AdminSettings />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
