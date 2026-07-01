import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { colors, reasonColors } from '../colors';
import { s } from '../styles';
import type { Reason } from '../types';

interface CampaignRow {
  id: string; name: string; reason: Reason; expires_at: string; signup_count: number; note?: string;
}

function shabbatWeekKey(date: Date): string {
  const day = date.getDay();
  const daysBack = (day - 5 + 7) % 7;
  const friday = new Date(date);
  friday.setDate(date.getDate() - daysBack);
  return friday.toISOString().split('T')[0];
}

function computeStreak(signupDates: Date[]) {
  if (!signupDates.length) return { current: 0, longest: 0, signedUpThisWeek: false };
  const weekSet = new Set(signupDates.map(shabbatWeekKey));
  const weeks = Array.from(weekSet).sort();
  let longest = 1, run = 1;
  for (let i = 1; i < weeks.length; i++) {
    const diff = (new Date(weeks[i]).getTime() - new Date(weeks[i - 1]).getTime()) / (7 * 24 * 60 * 60 * 1000);
    if (Math.round(diff) === 1) { run++; longest = Math.max(longest, run); } else { run = 1; }
  }
  const thisWeek = shabbatWeekKey(new Date());
  const lastWeek = shabbatWeekKey(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const signedUpThisWeek = weekSet.has(thisWeek);
  let cursor: string | null = signedUpThisWeek ? thisWeek : weekSet.has(lastWeek) ? lastWeek : null;
  if (!cursor) return { current: 0, longest, signedUpThisWeek };
  let current = 0;
  while (cursor && weekSet.has(cursor)) {
    current++;
    const prev = new Date(cursor);
    prev.setDate(prev.getDate() - 7);
    cursor = prev.toISOString().split('T')[0];
  }
  return { current, longest, signedUpThisWeek };
}

export default function MinePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'signedup' | 'launched'>('signedup');
  const [signedUp, setSignedUp] = useState<CampaignRow[]>([]);
  const [launched, setLaunched] = useState<CampaignRow[]>([]);
  const [streak, setStreak] = useState({ current: 0, longest: 0, signedUpThisWeek: false });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [signedUpRes, launchedRes, allSignupsRes] = await Promise.all([
      supabase.from('signups').select('campaign_id, campaigns(id, name, reason, note, expires_at, signups(count))').eq('user_id', user.id),
      supabase.from('campaigns').select('id, name, reason, expires_at, signups(count)').eq('created_by', user.id).order('created_at', { ascending: false }),
      supabase.from('signups').select('created_at').eq('user_id', user.id),
    ]);

    if (signedUpRes.data) {
      setSignedUp((signedUpRes.data as any[]).filter(r => r.campaigns).map((r: any) => ({
        id: r.campaigns.id, name: r.campaigns.name, reason: r.campaigns.reason,
        note: r.campaigns.note ?? undefined, expires_at: r.campaigns.expires_at,
        signup_count: r.campaigns.signups?.[0]?.count ?? 0,
      })));
    }
    if (launchedRes.data) {
      setLaunched((launchedRes.data as any[]).map(c => ({
        id: c.id, name: c.name, reason: c.reason, expires_at: c.expires_at,
        signup_count: c.signups?.[0]?.count ?? 0,
      })));
    }
    if (allSignupsRes.data) {
      setStreak(computeStreak((allSignupsRes.data as any[]).map(s => new Date(s.created_at))));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isExpired = (expires_at: string) => new Date(expires_at) < new Date();
  const data = (tab === 'signedup' ? signedUp : launched).filter(c => !isExpired(c.expires_at));

  return (
    <div>
      {/* Tab switcher */}
      <div style={{ display: 'flex', background: colors.white, border: `1.5px solid ${colors.border}`, borderRadius: 12, padding: 4, marginBottom: 16 }}>
        {(['signedup', 'launched'] as const).map(t => (
          <button
            key={t}
            style={{
              flex: 1, padding: '10px', borderRadius: 9, fontSize: 14, fontWeight: 600,
              background: tab === t ? colors.primary : 'transparent',
              color: tab === t ? colors.white : colors.textLight,
              border: 'none', cursor: 'pointer',
            }}
            onClick={() => setTab(t)}
          >
            {t === 'signedup' ? 'Signed Up' : 'Launched'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: 60, color: colors.textMuted }}>Loading…</div>
      ) : (
        <>
          {tab === 'signedup' && streak.current > 0 && (
            <p style={{ fontSize: 16, fontWeight: 700, color: colors.text, textAlign: 'center', marginBottom: 12 }}>
              {streak.signedUpThisWeek
                ? streak.current === 1 ? '🔥 1st week baking!' : `🔥 ${streak.current} weeks in a row — balabusta!`
                : `🔥 ${streak.current} weeks in a row — sign up for ${streak.current + 1}!`}
            </p>
          )}

          {data.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 60 }}>
              <div style={{ fontSize: 40, color: colors.border, marginBottom: 12 }}>♡</div>
              <p style={{ color: colors.textMuted, fontSize: 15, maxWidth: 260, margin: '0 auto 16px' }}>
                {tab === 'signedup' ? "You haven't signed up for any campaigns yet." : "You haven't launched any campaigns yet."}
              </p>
              {tab === 'signedup' && (
                <button style={s.btn} onClick={() => navigate('/home')}>Find a campaign</button>
              )}
            </div>
          ) : (
            data.map(item => {
              const progress = Math.min(item.signup_count / 40, 1);
              return (
                <div
                  key={item.id}
                  style={{ ...s.card, cursor: 'pointer' }}
                  onClick={() => navigate(`/campaign/${item.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: colors.text, flex: 1, marginRight: 8 }}>{item.name}</span>
                    <span style={{ ...s.reasonBadge, background: reasonColors[item.reason] ?? colors.border }}>{item.reason}</span>
                  </div>
                  {item.note && <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>{item.note}</p>}
                  <div style={{ height: 8, background: colors.border, borderRadius: 4, overflow: 'hidden', marginTop: 8, marginBottom: 8 }}>
                    <div style={{ height: '100%', width: `${progress * 100}%`, background: colors.accent, borderRadius: 4 }} />
                  </div>
                  <p style={{ fontSize: 13, color: colors.textLight }}>{item.signup_count} of 40 bakers</p>
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
}
