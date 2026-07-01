import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { colors } from '../colors';
import { s } from '../styles';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim()) { setResetError('Please enter your email'); return; }
    setResetLoading(true); setResetError('');
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim());
    setResetLoading(false);
    if (error) setResetError(error.message);
    else setResetSent(true);
  }

  return (
    <div style={s.authWrap}>
      <div style={s.authBox}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: colors.primary, marginBottom: 6 }}>40 Women</h1>
          <p style={{ color: colors.textLight, fontSize: 15 }}>Community for Jewish women, worldwide</p>
        </div>

        <form onSubmit={handleSignIn}>
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />

          <label style={{ ...s.label, marginTop: 16 }}>Password</label>
          <input style={s.input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />

          <button
            type="button"
            onClick={() => { setForgotOpen(true); setResetEmail(email); }}
            style={{ ...s.linkBtn, marginTop: 10, marginLeft: 'auto', display: 'block' }}
          >
            Forgot password?
          </button>

          {error && <p style={s.errorMsg}>{error}</p>}

          <button type="submit" style={{ ...s.btn, marginTop: 20, width: '100%' }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: colors.textLight }}>
          Don't have an account?{' '}
          <Link to="/sign-up" style={{ color: colors.primary, fontWeight: 700 }}>Sign up</Link>
        </p>
      </div>

      {forgotOpen && (
        <div style={s.modalOverlay} onClick={() => setForgotOpen(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>Reset Password</span>
              <button onClick={() => { setForgotOpen(false); setResetSent(false); setResetError(''); }} style={{ color: colors.primary, fontWeight: 600, fontSize: 15 }}>Cancel</button>
            </div>

            {resetSent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
                <p style={{ fontWeight: 700, fontSize: 17, color: colors.text, marginBottom: 8 }}>Check your email</p>
                <p style={{ color: colors.textLight, fontSize: 14, marginBottom: 20 }}>
                  We sent a reset link to <strong style={{ color: colors.primary }}>{resetEmail}</strong>
                </p>
                <button style={{ ...s.btn, width: '100%' }} onClick={() => setForgotOpen(false)}>Done</button>
              </div>
            ) : (
              <form onSubmit={handleReset}>
                <p style={{ color: colors.textLight, fontSize: 14, marginBottom: 16 }}>Enter your email and we'll send a reset link.</p>
                <label style={s.label}>Email</label>
                <input style={s.input} type="email" placeholder="you@example.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} autoFocus />
                {resetError && <p style={s.errorMsg}>{resetError}</p>}
                <button type="submit" style={{ ...s.btn, width: '100%', marginTop: 16 }} disabled={resetLoading}>
                  {resetLoading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
