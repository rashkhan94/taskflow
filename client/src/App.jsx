import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import BoardsPage from './pages/BoardsPage.jsx';
import BoardDetailPage from './pages/BoardDetailPage.jsx';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (!user) return <Navigate to="/login" />;
    return children;
}

function GuestRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (user) return <Navigate to="/boards" />;
    return children;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
            <Route path="/boards" element={<ProtectedRoute><BoardsPage /></ProtectedRoute>} />
            <Route path="/boards/:id" element={<ProtectedRoute><BoardDetailPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/boards" />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
