import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';

const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#f59e0b', '#22c55e', '#3b82f6', '#ef4444'];

function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(name) {
    return (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="navbar">
            <Link to="/boards" className="navbar-brand">
                <div className="navbar-brand-icon">T</div>
                <h1>TaskFlow</h1>
            </Link>

            <div className="navbar-actions">
                <div className="navbar-user">
                    <div
                        className="navbar-user-avatar"
                        style={{ background: getAvatarColor(user?.name) }}
                    >
                        {getInitials(user?.name)}
                    </div>
                    <span className="navbar-user-name">{user?.name}</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={logout}>
                    Logout
                </button>
            </div>
        </nav>
    );
}

export { getAvatarColor, getInitials };
