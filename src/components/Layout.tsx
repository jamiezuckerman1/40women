import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { colors } from '../colors';

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: colors.background }}>
      {/* Top nav */}
      <header style={{
        background: colors.white,
        borderBottom: `1.5px solid ${colors.border}`,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: colors.primary, letterSpacing: '-0.3px' }}>
          40 Women
        </span>
        <nav style={{ display: 'flex', gap: 2 }}>
          {[
            { to: '/home', label: 'Home' },
            { to: '/mine', label: 'Mine' },
            { to: '/parsha', label: 'Parsha' },
            { to: '/zmanim', label: 'Shabbat Times' },
            { to: '/how-it-works', label: 'How It Works' },
            { to: '/account', label: 'Account' },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: isActive ? colors.white : colors.textLight,
                background: isActive ? colors.primary : 'transparent',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Page content */}
      <main style={{ flex: 1, maxWidth: 680, width: '100%', margin: '0 auto', padding: '20px 16px 80px' }}>
        {children}
      </main>

      {/* FAB */}
      <button
        onClick={() => navigate('/launch')}
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: colors.primary,
          color: colors.white,
          fontSize: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 16px ${colors.primary}66`,
          border: 'none',
          cursor: 'pointer',
        }}
        title="Launch a campaign"
      >
        +
      </button>
    </div>
  );
}
