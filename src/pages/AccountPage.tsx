import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { colors } from '../colors';
import { s } from '../styles';

export default function AccountPage() {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? '');
      const { data } = await supabase.from('users').select('name, city').eq('id', user.id).single();
      if (data) { setName(data.name ?? ''); setCity(data.city ?? ''); }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your name'); return; }
    setSaving(true); setError(''); setSaveMsg('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [profileRes] = await Promise.all([
      supabase.from('users').update({ name: name.trim(), city: city.trim() }).eq('id', user.id),
      supabase.from('signups').update({ city: city.trim() }).eq('user_id', user.id),
    ]);
    setSaving(false);
    if (profileRes.error) setError(profileRes.error.message);
    else setSaveMsg('Saved! Your profile and active signups have been updated.');
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  async function handleDeleteAccount() {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('delete_account');
      if (error) throw error;
      await supabase.auth.signOut();
    } catch (err: any) {
      setLoading(false);
      setError(err.message ?? 'Could not delete account.');
      setConfirmDelete(false);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', marginTop: 60, color: colors.textMuted }}>Loading…</div>;

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.text, marginBottom: 20 }}>Account</h2>

      <div style={{ background: colors.white, border: `1.5px solid ${colors.border}`, borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Signed in as</p>
        <p style={{ fontSize: 15, color: colors.text, fontWeight: 500 }}>{email}</p>
      </div>

      <form onSubmit={handleSave}>
        <label style={s.label}>Name</label>
        <input style={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />

        <label style={{ ...s.label, marginTop: 16 }}>City</label>
        <input style={s.input} value={city} onChange={e => setCity(e.target.value)} placeholder="Your city" />

        {error && <p style={s.errorMsg}>{error}</p>}
        {saveMsg && <p style={{ color: colors.success, fontSize: 13, marginTop: 8 }}>{saveMsg}</p>}

        <button type="submit" style={{ ...s.btn, width: '100%', marginTop: 24 }} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      <button style={{ ...s.btnOutline, width: '100%', marginTop: 12 }} onClick={() => setConfirmSignOut(true)}>
        Sign Out
      </button>

      <button style={{ ...s.btnDanger, width: '100%', marginTop: 12 }} onClick={() => setConfirmDelete(true)}>
        Delete Account
      </button>

      {confirmSignOut && (
        <div style={s.modalOverlay} onClick={() => setConfirmSignOut(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <p style={{ fontWeight: 700, fontSize: 17, color: colors.text, marginBottom: 8 }}>Sign out?</p>
            <p style={{ color: colors.textLight, fontSize: 14, marginBottom: 20 }}>Are you sure you want to sign out?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ ...s.btnOutline, flex: 1 }} onClick={() => setConfirmSignOut(false)}>Cancel</button>
              <button style={{ ...s.btnDanger, flex: 1 }} onClick={handleSignOut}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div style={s.modalOverlay} onClick={() => setConfirmDelete(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <p style={{ fontWeight: 700, fontSize: 17, color: colors.text, marginBottom: 8 }}>Delete Account</p>
            <p style={{ color: colors.textLight, fontSize: 14, marginBottom: 20 }}>
              This will permanently delete your account and all your data. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ ...s.btnOutline, flex: 1 }} onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button style={{ ...s.btnDanger, flex: 1 }} onClick={handleDeleteAccount}>Delete Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
