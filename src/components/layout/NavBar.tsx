import { NavLink, useLocation } from 'react-router-dom';
import { Home, Receipt, PieChart, Grid3X3, Settings } from 'lucide-react';

const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/transactions', icon: Receipt, label: 'Transactions' },
    { path: '/analytics', icon: PieChart, label: 'Analytics' },
    { path: '/categories', icon: Grid3X3, label: 'Categories' },
    { path: '/settings', icon: Settings, label: 'Settings' }
];

export const NavBar = () => {
    const location = useLocation();

    return (
        <nav className="nav-bar">
            {navItems.map(({ path, icon: Icon, label }) => (
                <NavLink
                    key={path}
                    to={path}
                    className={`nav-item ${location.pathname === path ? 'active' : ''}`}
                >
                    <Icon className="nav-icon" />
                    <span className="nav-label">{label}</span>
                </NavLink>
            ))}
        </nav>
    );
};
