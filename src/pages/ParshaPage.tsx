import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { colors } from '../colors';
import { s } from '../styles';

interface ParshaEntry {
  name: string;
  passuk: string | null;
  dvar_torah: string | null;
}

export default function ParshaPage() {
  const [parsha, setParsha] = useState<ParshaEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    supabase
      .from('parsha')
      .select('name, passuk, dvar_torah')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        setParsha(data ?? null);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: 60, color: colors.textMuted }}>Loading…</div>;

  if (!parsha) return (
    <div style={{ textAlign: 'center', marginTop: 60 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📖</div>
      <p style={{ color: colors.textMuted, fontSize: 15 }}>No parsha content yet.{'\n'}Check back soon!</p>
    </div>
  );

  return (
    <div>
      {/* Parsha name banner */}
      <div style={{ background: colors.primary, borderRadius: 16, padding: 28, textAlign: 'center', marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
          This Week's Parsha
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: colors.white }}>{parsha.name}</h1>
      </div>

      {/* Passuk */}
      {parsha.passuk && (
        <div style={{ ...s.card, display: 'flex', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 4, borderRadius: 2, background: colors.accent, flexShrink: 0 }} />
          <p style={{ fontSize: 16, color: colors.text, lineHeight: '26px', fontStyle: 'italic' }}>{parsha.passuk}</p>
        </div>
      )}

      {/* Dvar Torah */}
      {parsha.dvar_torah && (
        <div style={{ ...s.card, marginBottom: 24 }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, cursor: 'pointer' }}
            onClick={() => setExpanded(e => !e)}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>Dvar Torah</span>
            <span style={{ color: colors.primary, fontSize: 18 }}>{expanded ? '▲' : '▼'}</span>
          </div>
          <p style={{
            fontSize: 15, color: colors.text, lineHeight: '26px', marginBottom: 12,
            overflow: expanded ? 'visible' : 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: expanded ? 'unset' : 3,
            WebkitBoxOrient: 'vertical' as any,
          }}>
            {parsha.dvar_torah}
          </p>
          <button onClick={() => setExpanded(e => !e)} style={{ ...s.linkBtn, fontSize: 14, fontWeight: 700 }}>
            {expanded ? 'Show less' : 'Read more'}
          </button>
        </div>
      )}

      <p style={{ fontSize: 15, color: colors.textLight, textAlign: 'center', fontStyle: 'italic', lineHeight: '24px' }}>
        Shabbat Shalom! 🕯️<br />May your challah baking bring brachos to all of Klal Yisrael.
      </p>
    </div>
  );
}
