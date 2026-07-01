import { useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../colors';

const NAV_LINKS = [
  { to: '/home', label: 'Home' },
  { to: '/mine', label: 'Mine' },
  { to: '/parsha', label: 'Parsha' },
  { to: '/zmanim', label: 'Shabbat Times' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/account', label: 'Account' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: colors.background }}>
      <style>{`
        .desktop-nav { display: flex; }
        .hamburger-btn { display: none; }
        @media (max-width: 640px) {
          .desktop-nav { display: none; }
          .hamburger-btn { display: flex; }
        }
      `}</style>

      {/* Top nav */}
      <header style={{
        background: colors.white,
        borderBottom: `1.5px solid ${colors.border}`,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <span
          onClick={() => navigate('/home')}
          style={{ fontSize: 18, fontWeight: 800, color: colors.primary, letterSpacing: '-0.3px', whiteSpace: 'nowrap', cursor: 'pointer' }}
        >
          40 Women
        </span>

        {/* Desktop nav */}
        <nav className="desktop-nav" style={{ gap: 2 }}>
          {NAV_LINKS.map(({ to, label }) => (
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
                whiteSpace: 'nowrap',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Hamburger button */}
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen(o => !o)}
          style={{
            flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            gap: 5, width: 40, height: 40, background: 'none', border: 'none', cursor: 'pointer', padding: 8,
          }}
        >
          <span style={{ display: 'block', width: 22, height: 2, background: menuOpen ? colors.primary : colors.text, borderRadius: 2, transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none', transition: 'all 0.2s' }} />
          <span style={{ display: 'block', width: 22, height: 2, background: menuOpen ? colors.primary : colors.text, borderRadius: 2, opacity: menuOpen ? 0 : 1, transition: 'all 0.2s' }} />
          <span style={{ display: 'block', width: 22, height: 2, background: menuOpen ? colors.primary : colors.text, borderRadius: 2, transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none', transition: 'all 0.2s' }} />
        </button>
      </header>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 56, left: 0, right: 0, zIndex: 99,
          background: colors.white, borderBottom: `1.5px solid ${colors.border}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}>
          {NAV_LINKS.map(({ to, label }) => {
            const isActive = location.pathname === to;
            return (
              <button
                key={to}
                onClick={() => { navigate(to); setMenuOpen(false); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '14px 20px', fontSize: 16, fontWeight: 600,
                  color: isActive ? colors.primary : colors.text,
                  background: isActive ? '#FFF0F5' : 'none',
                  border: 'none', borderBottom: `1px solid ${colors.border}`, cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Overlay to close menu */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 98, top: 56 }}
        />
      )}

      {/* Page content */}
      <main style={{ flex: 1, maxWidth: 680, width: '100%', margin: '0 auto', padding: '20px 16px 80px' }}>
        {children}
      </main>

      {/* FAB */}
      <button
        onClick={() => navigate('/launch')}
        style={{
          position: 'fixed', bottom: 28, right: 20,
          width: 56, height: 56, borderRadius: '50%',
          background: colors.primary, color: colors.white,
          fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 16px ${colors.primary}66`, border: 'none', cursor: 'pointer',
        }}
        title="Launch a campaign"
      >
        +
      </button>
    </div>
  );
}
