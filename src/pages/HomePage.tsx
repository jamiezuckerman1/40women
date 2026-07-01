import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { colors, reasonColors } from '../colors';
import { s } from '../styles';
import { REASONS } from '../types';
import type { Reason } from '../types';

interface CampaignRow {
  id: string;
  name: string;
  reason: Reason;
  note?: string;
  signup_count: number;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [mySignups, setMySignups] = useState<Set<string>>(new Set());
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myCity, setMyCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [signingUp, setSigningUp] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<Reason | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setMyUserId(user.id);
      supabase.from('users').select('city').eq('id', user.id).single().then(({ data }) => {
        if (data) setMyCity(data.city ?? '');
      });
    });
  }, []);

  const fetchCampaigns = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const now = new Date().toISOString();

    const [campaignsRes, signupsRes] = await Promise.all([
      supabase.from('campaigns').select('id, name, reason, note, signups(count)').gt('expires_at', now),
      user ? supabase.from('signups').select('campaign_id').eq('user_id', user.id) : Promise.resolve({ data: [] }),
    ]);

    if (campaignsRes.data) {
      const mapped: CampaignRow[] = (campaignsRes.data as any[]).map(c => ({
        id: c.id, name: c.name, reason: c.reason, note: c.note ?? undefined,
        signup_count: c.signups?.[0]?.count ?? 0,
      }));
      mapped.sort((a, b) => a.signup_count - b.signup_count);
      setCampaigns(mapped);
    }
    if (signupsRes.data) {
      setMySignups(new Set((signupsRes.data as any[]).map(s => s.campaign_id)));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  async function handleSignUp(campaignId: string) {
    if (!myUserId) return;
    setSigningUp(campaignId);
    await supabase.from('signups').insert({ campaign_id: campaignId, user_id: myUserId, city: myCity });
    setMySignups(prev => new Set([...prev, campaignId]));
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, signup_count: c.signup_count + 1 } : c));
    setSigningUp(null);
  }

  async function handleUnsign(campaignId: string) {
    if (!myUserId) return;
    setSigningUp(campaignId);
    await supabase.from('signups').delete().eq('campaign_id', campaignId).eq('user_id', myUserId);
    setMySignups(prev => { const s = new Set(prev); s.delete(campaignId); return s; });
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, signup_count: Math.max(c.signup_count - 1, 0) } : c));
    setSigningUp(null);
  }

  const filtered = campaigns.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter ? c.reason === activeFilter : true;
    return matchSearch && matchFilter;
  });

  const mySignedUp = filtered.filter(c => mySignups.has(c.id));
  const others = filtered.filter(c => !mySignups.has(c.id));

  function renderCard(item: CampaignRow, isMine: boolean) {
    const progress = Math.min(item.signup_count / 40, 1);
    const spotsLeft = Math.max(40 - item.signup_count, 0);
    const busy = signingUp === item.id;

    return (
      <div
        key={item.id}
        style={{
          ...s.card,
          ...(isMine ? { borderColor: colors.accent, background: '#FFF5F8' } : {}),
          cursor: 'pointer',
        }}
        onClick={() => navigate(`/campaign/${item.id}`)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: colors.text, flex: 1, marginRight: 8 }}>{item.name}</span>
          <span style={{ ...s.reasonBadge, background: reasonColors[item.reason] ?? colors.border }}>{item.reason}</span>
        </div>
        {item.note && <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>{item.note}</p>}

        <div style={{ height: 8, background: colors.border, borderRadius: 4, overflow: 'hidden', marginTop: 8, marginBottom: 6 }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: colors.accent, borderRadius: 4 }} />
        </div>
        <p style={{ fontSize: 13, color: colors.textLight, marginBottom: 12 }}>
          {item.signup_count} of 40 bakers{spotsLeft > 0 ? ` · ${spotsLeft} spots left` : ' · Full!'}
        </p>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
          {isMine ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: '#F0FFF4', borderRadius: 8, padding: '10px 12px' }}>
              <span style={{ color: colors.success }}>✓</span>
              <span style={{ flex: 1, fontSize: 13, color: colors.success, fontWeight: 600 }}>You're signed up</span>
              <button
                onClick={() => handleUnsign(item.id)}
                disabled={busy}
                style={{ fontSize: 13, color: colors.textMuted, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {busy ? '…' : 'Remove'}
              </button>
            </div>
          ) : (
            <button
              style={{
                flex: 1, background: spotsLeft === 0 ? colors.textMuted : colors.primary,
                color: colors.white, borderRadius: 8, padding: '11px 12px', fontSize: 14, fontWeight: 700,
                border: 'none', cursor: spotsLeft === 0 ? 'default' : 'pointer',
              }}
              onClick={() => handleSignUp(item.id)}
              disabled={busy || spotsLeft === 0}
            >
              {busy ? '…' : spotsLeft === 0 ? 'Campaign is full' : 'I want to bake challah for this person'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.white, border: `1.5px solid ${colors.border}`, borderRadius: 10, padding: '8px 12px', marginBottom: 12 }}>
        <span style={{ color: colors.textMuted }}>🔍</span>
        <input
          style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 15, color: colors.text }}
          placeholder="Search campaigns…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button style={{ color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }} onClick={() => setSearch('')}>×</button>}
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
        <button style={!activeFilter ? s.chipActive : s.chip} onClick={() => setActiveFilter(null)}>All</button>
        {REASONS.map(r => (
          <button key={r} style={activeFilter === r ? s.chipActive : s.chip} onClick={() => setActiveFilter(activeFilter === r ? null : r)}>{r}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: 60, color: colors.textMuted }}>Loading…</div>
      ) : (
        <>
          {mySignedUp.length > 0 && (
            <>
              <p style={s.sectionHeader}>Signed up by you</p>
              {mySignedUp.map(c => renderCard(c, true))}
              <p style={s.sectionHeader}>All campaigns</p>
            </>
          )}
          {others.map(c => renderCard(c, false))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: 60 }}>
              <p style={{ color: colors.textMuted, fontSize: 15 }}>No active campaigns found.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
