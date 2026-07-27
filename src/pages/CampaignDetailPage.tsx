import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { colors, reasonColors } from '../colors';
import { s } from '../styles';
import { REASONS, REASON_LABELS } from '../types';
import type { Reason } from '../types';

interface Campaign {
  id: string; name: string; reason: string; created_by: string; expires_at: string; note?: string;
}
interface SignupRow { id: string; city: string; user_id: string; }

// Splits a stored full name like "Chana Leah bat Sara" back into parts for editing.
function splitName(fullName: string): { hebrewName: string; parentName: string; parentType: 'mother' | 'father' } {
  const batIdx = fullName.indexOf(' bat ');
  const benIdx = fullName.indexOf(' ben ');
  if (batIdx !== -1) return { hebrewName: fullName.slice(0, batIdx), parentName: fullName.slice(batIdx + 5), parentType: 'mother' };
  if (benIdx !== -1) return { hebrewName: fullName.slice(0, benIdx), parentName: fullName.slice(benIdx + 5), parentType: 'father' };
  return { hebrewName: fullName, parentName: '', parentType: 'mother' };
}


export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [signups, setSignups] = useState<SignupRow[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myCity, setMyCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [signingUp, setSigningUp] = useState(false);
  const [error, setError] = useState('');
  const [confirmUnsign, setConfirmUnsign] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editHebrewName, setEditHebrewName] = useState('');
  const [editParentName, setEditParentName] = useState('');
  const [editParentType, setEditParentType] = useState<'mother' | 'father'>('mother');
  const [editReason, setEditReason] = useState<Reason | null>(null);
  const [editNote, setEditNote] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setMyUserId(user.id);
      supabase.from('users').select('city').eq('id', user.id).single().then(({ data }) => {
        if (data) setMyCity(data.city ?? '');
      });
    });
  }, []);

  async function fetchData() {
    const [{ data: camp }, { data: sups }] = await Promise.all([
      supabase.from('campaigns').select('*').eq('id', id).single(),
      supabase.from('signups').select('id, city, user_id').eq('campaign_id', id),
    ]);
    if (camp) setCampaign(camp);
    if (sups) setSignups(sups);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [id]);

  async function handleSignUp() {
    if (!myUserId || !id) return;
    setSigningUp(true); setError('');
    const { error: err } = await supabase.from('signups').insert({ campaign_id: id, user_id: myUserId, city: myCity });
    setSigningUp(false);
    if (err) { setError(err.message); return; }
    fetchData();
  }

  async function handleUnsign() {
    if (!myUserId || !id) return;
    await supabase.from('signups').delete().eq('campaign_id', id).eq('user_id', myUserId);
    setConfirmUnsign(false);
    fetchData();
  }

  function openEdit() {
    if (!campaign) return;
    const { hebrewName, parentName, parentType } = splitName(campaign.name);
    setEditHebrewName(hebrewName);
    setEditParentName(parentName);
    setEditParentType(parentType);
    setEditReason(campaign.reason as Reason);
    setEditNote(campaign.note ?? '');
    setEditError('');
    setEditing(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!campaign || !id) return;
    if (!editHebrewName.trim()) { setEditError("Please enter the person's Hebrew name"); return; }
    if (!editReason) { setEditError('Please select a reason'); return; }
    setEditError('');

    const fullName = editParentName.trim()
      ? `${editHebrewName.trim()} ${editParentType === 'mother' ? 'bat' : 'ben'} ${editParentName.trim()}`
      : editHebrewName.trim();

    setSaving(true);
    const { error: err } = await supabase.from('campaigns').update({
      name: fullName,
      reason: editReason,
      note: editNote.trim() ? editNote.trim() : null,
    }).eq('id', id);
    setSaving(false);
    if (err) { setEditError(err.message); return; }
    setEditing(false);
    fetchData();
  }

  if (loading) return <div style={{ textAlign: 'center', marginTop: 60, color: colors.textMuted }}>Loading…</div>;
  if (!campaign) return <div style={{ textAlign: 'center', marginTop: 60, color: colors.textMuted }}>Campaign not found.</div>;

  const hasSignedUp = myUserId ? signups.some(s => s.user_id === myUserId) : false;
  const signupCount = signups.length;
  const progress = Math.min(signupCount / 40, 1);
  const spotsLeft = Math.max(40 - signupCount, 0);
  const isCreator = myUserId ? myUserId === campaign.created_by : false;
  const isExpired = new Date(campaign.expires_at) < new Date();

  const cityCounts = signups.reduce<Record<string, number>>((acc, s) => {
    if (s.city) acc[s.city] = (acc[s.city] ?? 0) + 1;
    return acc;
  }, {});
  const cityList = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);

  if (editing) return (
    <div>
      <button onClick={() => setEditing(false)} style={{ ...s.linkBtn, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
        ← Cancel
      </button>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.text, marginBottom: 20 }}>Edit Campaign</h2>

      <form onSubmit={handleSaveEdit}>
        <label style={s.label}>Hebrew Name</label>
        <input style={s.input} placeholder="e.g. Chana Leah" value={editHebrewName} onChange={e => setEditHebrewName(e.target.value)} />

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
                border: `1.5px solid ${editParentType === pt ? colors.primary : colors.border}`,
                background: editParentType === pt ? colors.primary : colors.white,
                color: editParentType === pt ? colors.white : colors.textLight,
                cursor: 'pointer',
              }}
              onClick={() => setEditParentType(pt)}
            >
              {pt === 'mother' ? 'bat (daughter of)' : 'ben (son of)'}
            </button>
          ))}
        </div>
        <input style={s.input} placeholder="Parent's Hebrew name" value={editParentName} onChange={e => setEditParentName(e.target.value)} />

        <label style={{ ...s.label, marginTop: 20 }}>Reason</label>
        {REASONS.map(r => (
          <div
            key={r}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: 14, borderRadius: 10, marginBottom: 8, cursor: 'pointer',
              border: `1.5px solid ${editReason === r ? colors.primary : colors.border}`,
              background: editReason === r ? '#FFF0F5' : colors.white,
            }}
            onClick={() => setEditReason(r)}
          >
            <span style={{ fontSize: 18, color: editReason === r ? colors.primary : colors.textMuted }}>
              {editReason === r ? '⦿' : '○'}
            </span>
            <span style={{ fontSize: 15, color: editReason === r ? colors.primary : colors.textLight, fontWeight: editReason === r ? 600 : 400 }}>
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
          value={editNote}
          onChange={e => setEditNote(e.target.value)}
          maxLength={120}
        />
        {editNote.length > 80 && <p style={{ textAlign: 'right', fontSize: 12, color: colors.textMuted, marginTop: 4 }}>{editNote.length}/120</p>}

        {editError && <p style={s.errorMsg}>{editError}</p>}

        <button type="submit" style={{ ...s.btn, width: '100%', marginTop: 24 }} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );

  return (
    <div>
      <button onClick={() => navigate('/home')} style={{ ...s.linkBtn, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
        ← Back
      </button>

      {/* Header */}
      <div style={{ ...s.card, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.text, flex: 1, marginRight: 8 }}>{campaign.name}</h1>
          {isCreator && !isExpired && (
            <button
              onClick={openEdit}
              style={{
                fontSize: 13, fontWeight: 600, color: colors.primary, background: 'none',
                border: `1.5px solid ${colors.primary}`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Edit
            </button>
          )}
        </div>
        {campaign.note && <p style={{ fontSize: 14, color: colors.textMuted, marginBottom: 12 }}>{campaign.note}</p>}
        <span style={{ ...s.reasonBadge, background: reasonColors[campaign.reason] ?? colors.border }}>{campaign.reason}</span>
      </div>

      {/* Progress */}
      <div style={{ ...s.card, marginBottom: 16 }}>
        <p style={{ ...s.sectionHeader, marginBottom: 12 }}>Progress</p>
        <div style={{ height: 10, background: colors.border, borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: colors.accent, borderRadius: 5 }} />
        </div>
        <p style={{ fontSize: 14, color: colors.textLight }}>
          <strong style={{ color: colors.primary }}>{signupCount}</strong> of 40 women have signed up to bake
          {spotsLeft > 0 ? ` · ${spotsLeft} spots remaining` : ' · The group is full!'}
        </p>
      </div>

      {/* Cities */}
      {cityList.length > 0 && (
        <div style={{ ...s.card, marginBottom: 16 }}>
          <p style={{ ...s.sectionHeader, marginBottom: 12 }}>Baking from around the world</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {cityList.map(([city, count]) => (
              <span key={city} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: colors.background, border: `1.5px solid ${colors.border}`,
                borderRadius: 20, padding: '5px 10px', fontSize: 13, color: colors.text,
              }}>
                📍 {city}
                {count > 1 && (
                  <span style={{ background: colors.primary, color: colors.white, borderRadius: 10, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>{count}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sign up */}
      <div style={s.card}>
        {error && <p style={{ ...s.errorMsg, marginBottom: 12 }}>{error}</p>}
        {hasSignedUp ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F0FFF4', borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <span style={{ color: colors.success, fontSize: 20 }}>✓</span>
              <p style={{ fontSize: 14, color: colors.success, fontWeight: 600, flex: 1 }}>You're signed up to bake challah for this person!</p>
            </div>
            <button
              onClick={() => setConfirmUnsign(true)}
              style={{ display: 'block', margin: '0 auto', fontSize: 14, color: colors.textMuted, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Remove my signup
            </button>
          </>
        ) : (
          <button
            style={{
              ...s.btn, width: '100%',
              ...(spotsLeft === 0 ? { background: colors.textMuted, cursor: 'default' } : {}),
            }}
            onClick={handleSignUp}
            disabled={signingUp || spotsLeft === 0}
          >
            {signingUp ? 'Signing up…' : spotsLeft === 0 ? 'Campaign is full' : 'I want to bake challah for this person'}
          </button>
        )}
      </div>

      {confirmUnsign && (
        <div style={s.modalOverlay} onClick={() => setConfirmUnsign(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <p style={{ fontWeight: 700, fontSize: 17, color: colors.text, marginBottom: 8 }}>Remove signup?</p>
            <p style={{ color: colors.textLight, fontSize: 14, marginBottom: 20 }}>Are you sure you want to remove yourself from this campaign?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ ...s.btnOutline, flex: 1 }} onClick={() => setConfirmUnsign(false)}>Cancel</button>
              <button style={{ ...s.btnDanger, flex: 1 }} onClick={handleUnsign}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
