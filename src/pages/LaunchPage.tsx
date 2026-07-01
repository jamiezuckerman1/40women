import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { colors } from '../colors';
import { s } from '../styles';
import { REASONS, REASON_LABELS } from '../types';
import type { Reason } from '../types';

function nextSaturdayNight(): string {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSat = day === 6 ? 7 : 6 - day;
  const sat = new Date(now);
  sat.setDate(now.getDate() + daysUntilSat);
  sat.setHours(23, 59, 59, 0);
  return sat.toISOString();
}

function upcomingShabbatDate(): string {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSat = day === 6 ? 7 : 6 - day;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + daysUntilSat);
  return saturday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export default function LaunchPage() {
  const navigate = useNavigate();
  const [hebrewName, setHebrewName] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentType, setParentType] = useState<'mother' | 'father'>('mother');
  const [reason, setReason] = useState<Reason | null>(null);
  const [note, setNote] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [launchedName, setLaunchedName] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('users').select('city').eq('id', user.id).single().then(({ data }) => {
        if (data) setCity(data.city ?? '');
      });
    });
  }, []);

  async function handleLaunch(e: React.FormEvent) {
    e.preventDefault();
    if (!hebrewName.trim()) { setError("Please enter the person's Hebrew name"); return; }
    if (!reason) { setError('Please select a reason'); return; }
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fullName = parentName.trim()
      ? `${hebrewName.trim()} ${parentType === 'mother' ? 'bat' : 'ben'} ${parentName.trim()}`
      : hebrewName.trim();

    setLoading(true);
    const { error: err } = await supabase.from('campaigns').insert({
      name: fullName, reason, created_by: user.id,
      expires_at: nextSaturdayNight(),
      ...(note.trim() ? { note: note.trim() } : {}),
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setLaunchedName(hebrewName.trim());
    setDone(true);
  }

  if (done) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🕯️</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 12 }}>Campaign launched!</h2>
      <p style={{ color: colors.textLight, fontSize: 15, marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>
        May {launchedName} have a complete {reason?.toLowerCase()} through the zechus of this challah baking.
      </p>
      <button style={{ ...s.btn }} onClick={() => navigate('/home')}>Back to Home</button>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.text, marginBottom: 20 }}>Launch a Campaign</h2>

      <form onSubmit={handleLaunch}>
        <label style={s.label}>Hebrew Name</label>
        <input style={s.input} placeholder="e.g. Chana Leah" value={hebrewName} onChange={e => setHebrewName(e.target.value)} />

        <label style={{ ...s.label, marginTop: 20 }}>
          Parent's Name <span style={{ fontWeight: 400, color: colors.textMuted, fontSize: 13 }}>(optional)</span>
        </label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          {(['mother', 'father'] as const).map(pt => (
            <button
              key={pt}
              type="button"
              style={{
                flex: 1, padding: '10px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                border: `1.5px solid ${parentType === pt ? colors.primary : colors.border}`,
                background: parentType === pt ? colors.primary : colors.white,
                color: parentType === pt ? colors.white : colors.textLight,
                cursor: 'pointer',
              }}
              onClick={() => setParentType(pt)}
            >
              {pt === 'mother' ? 'bat (daughter of)' : 'ben (son of)'}
            </button>
          ))}
        </div>
        <input style={s.input} placeholder="Parent's Hebrew name" value={parentName} onChange={e => setParentName(e.target.value)} />

        {parentName.trim() && (
          <div style={{ marginTop: 10, padding: 12, background: colors.border, borderRadius: 8 }}>
            <span style={{ fontSize: 14, color: colors.text }}>
              Full name: <strong style={{ color: colors.primary }}>{hebrewName.trim() || '—'} {parentType === 'mother' ? 'bat' : 'ben'} {parentName.trim()}</strong>
            </span>
          </div>
        )}

        <label style={{ ...s.label, marginTop: 20 }}>Reason</label>
        {REASONS.map(r => (
          <div
            key={r}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: 14, borderRadius: 10, marginBottom: 8, cursor: 'pointer',
              border: `1.5px solid ${reason === r ? colors.primary : colors.border}`,
              background: reason === r ? '#FFF0F5' : colors.white,
            }}
            onClick={() => setReason(r)}
          >
            <span style={{ fontSize: 18, color: reason === r ? colors.primary : colors.textMuted }}>
              {reason === r ? '⦿' : '○'}
            </span>
            <span style={{ fontSize: 15, color: reason === r ? colors.primary : colors.textLight, fontWeight: reason === r ? 600 : 400 }}>
              {REASON_LABELS[r]}
            </span>
          </div>
        ))}

        <label style={{ ...s.label, marginTop: 20 }}>
          Additional context <span style={{ fontWeight: 400, color: colors.textMuted, fontSize: 13 }}>(optional)</span>
        </label>
        <textarea
          style={{ ...s.input, minHeight: 72, resize: 'vertical' }}
          placeholder="e.g. mother of 3, just diagnosed…"
          value={note}
          onChange={e => setNote(e.target.value)}
          maxLength={120}
        />
        {note.length > 80 && <p style={{ textAlign: 'right', fontSize: 12, color: colors.textMuted, marginTop: 4 }}>{note.length}/120</p>}

        {city && (
          <p style={{ fontSize: 13, color: colors.textMuted, marginTop: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
            📍 Campaign will be listed under <strong style={{ color: colors.textLight }}>{city}</strong>
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, color: colors.textMuted }}>🕐</span>
          <p style={{ fontSize: 13, color: colors.textMuted }}>This campaign is for challah baking for Shabbat of {upcomingShabbatDate()}</p>
        </div>

        {error && <p style={s.errorMsg}>{error}</p>}

        <button type="submit" style={{ ...s.btn, width: '100%', marginTop: 24 }} disabled={loading}>
          {loading ? 'Launching…' : 'Launch Campaign'}
        </button>
      </form>
    </div>
  );
}
