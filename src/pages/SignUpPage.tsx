import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { colors } from '../colors';
import { s } from '../styles';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) { setError('Please fill in all required fields'); return; }
    setLoading(true); setError('');
    const { data, error: signUpErr } = await supabase.auth.signUp({ email, password });
    if (signUpErr) { setLoading(false); setError(signUpErr.message); return; }
    if (data.user) {
      const { error: profileErr } = await supabase.from('users').insert({ id: data.user.id, name, email, city });
      if (profileErr) { setLoading(false); setError(profileErr.message); return; }
    }
    setLoading(false);
    setDone(true);
  }

  if (done) return (
    <div style={s.authWrap}>
      <div style={{ ...s.authBox, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.text, marginBottom: 8 }}>Check your email</h2>
        <p style={{ color: colors.textLight, fontSize: 15, marginBottom: 24 }}>
          A confirmation link has been sent to <strong style={{ color: colors.primary }}>{email}</strong>
        </p>
        <Link to="/sign-in" style={{ ...s.btn, display: 'block' }}>Back to Sign In</Link>
      </div>
    </div>
  );

  return (
    <div style={s.authWrap}>
      <div style={s.authBox}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: colors.primary, marginBottom: 6 }}>40 Women</h1>
          <p style={{ color: colors.textLight, fontSize: 15 }}>Community for Jewish women, worldwide</p>
        </div>

        <form onSubmit={handleSignUp}>
          <label style={s.label}>Full Name</label>
          <input style={s.input} placeholder="Sarah Miller" value={name} onChange={e => setName(e.target.value)} autoCapitalize="words" />

          <label style={{ ...s.label, marginTop: 16 }}>Email</label>
          <input style={s.input} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />

          <label style={{ ...s.label, marginTop: 16 }}>Password</label>
          <input style={s.input} type="password" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />

          <label style={{ ...s.label, marginTop: 16 }}>
            City <span style={{ fontWeight: 400, color: colors.textMuted, fontSize: 13 }}>(optional)</span>
          </label>
          <input style={s.input} placeholder="Los Angeles, CA" value={city} onChange={e => setCity(e.target.value)} />

          {error && <p style={s.errorMsg}>{error}</p>}

          <button type="submit" style={{ ...s.btn, width: '100%', marginTop: 24 }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: colors.textLight }}>
          Already have an account?{' '}
          <Link to="/sign-in" style={{ color: colors.primary, fontWeight: 700 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
