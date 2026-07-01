import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { colors, reasonColors } from '../colors';
import { s } from '../styles';

interface Campaign {
  id: string; name: string; reason: string; created_by: string; expires_at: string; note?: string;
}
interface SignupRow { id: string; city: string; user_id: string; }

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

  if (loading) return <div style={{ textAlign: 'center', marginTop: 60, color: colors.textMuted }}>Loading…</div>;
  if (!campaign) return <div style={{ textAlign: 'center', marginTop: 60, color: colors.textMuted }}>Campaign not found.</div>;

  const hasSignedUp = myUserId ? signups.some(s => s.user_id === myUserId) : false;
  const signupCount = signups.length;
  const progress = Math.min(signupCount / 40, 1);
  const spotsLeft = Math.max(40 - signupCount, 0);

  const cityCounts = signups.reduce<Record<string, number>>((acc, s) => {
    if (s.city) acc[s.city] = (acc[s.city] ?? 0) + 1;
    return acc;
  }, {});
  const cityList = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <button onClick={() => navigate('/home')} style={{ ...s.linkBtn, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
        ← Back
      </button>

      {/* Header */}
      <div style={{ ...s.card, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 8 }}>{campaign.name}</h1>
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
