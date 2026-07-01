import { useState } from 'react';
import { colors } from '../colors';
import { s } from '../styles';

interface ZmanimResult {
  location: string;
  date: string;
  candleLighting: string | null;
  havdalah: string | null;
}

function formatTime(iso: string): string {
  const timePart = iso.substring(11, 16);
  const [hourStr, minute] = timePart.split(':');
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${ampm}`;
}

function getUpcomingFriday(): string {
  const now = new Date();
  const day = now.getDay();
  const daysUntilFri = day <= 5 ? 5 - day : 6;
  const friday = new Date(now);
  friday.setDate(now.getDate() + daysUntilFri);
  return friday.toISOString().split('T')[0];
}

function isZipCode(input: string): boolean {
  return /^\d{5}$/.test(input.trim());
}

async function resolveToGeocode(input: string): Promise<{ lat: number; lon: number; label: string } | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input.trim())}&format=json&limit=1&addressdetails=1`,
    { headers: { 'User-Agent': '40women-app' } }
  );
  const json = await res.json();
  if (!json[0]) return null;
  const place = json[0];
  const label = place.display_name?.split(',').slice(0, 2).join(',').trim() ?? input.trim();
  return { lat: parseFloat(place.lat), lon: parseFloat(place.lon), label };
}

export default function ZmanimPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ZmanimResult | null>(null);
  const [error, setError] = useState('');

  async function fetchZmanim(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) { setError('Please enter a city or zip code'); return; }
    setLoading(true); setResult(null); setError('');

    try {
      const friday = getUpcomingFriday();
      let apiUrl: string;
      let locationLabel: string;

      if (isZipCode(trimmed)) {
        apiUrl = `https://www.hebcal.com/shabbat?cfg=json&zip=${trimmed}&m=50&b=18`;
        locationLabel = trimmed;
      } else {
        const geo = await resolveToGeocode(trimmed);
        if (!geo) { setError('Location not found. Try a different city or zip code.'); setLoading(false); return; }
        apiUrl = `https://www.hebcal.com/shabbat?cfg=json&latitude=${geo.lat}&longitude=${geo.lon}&m=50&b=18`;
        locationLabel = geo.label;
      }

      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();

      const location = json.location?.name ?? locationLabel;
      let candleLighting: string | null = null;
      let havdalah: string | null = null;

      for (const item of json.items ?? []) {
        if (item.category === 'candles') candleLighting = item.date;
        if (item.category === 'havdalah') havdalah = item.date;
      }

      setResult({ location, date: friday, candleLighting, havdalah });
    } catch {
      setError('Could not fetch zmanim. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p style={{ fontSize: 15, color: colors.textLight, lineHeight: '22px', marginBottom: 20 }}>
        Enter your city or zip code to get candle lighting and havdalah times for the upcoming Shabbat.
      </p>

      <form onSubmit={fetchZmanim} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <input
          style={{ ...s.input, flex: 1 }}
          placeholder="City or zip code"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button
          type="submit"
          style={{ ...s.btn, padding: '12px 20px', flexShrink: 0 }}
          disabled={loading}
        >
          {loading ? '…' : '🔍'}
        </button>
      </form>

      {error && <p style={s.errorMsg}>{error}</p>}

      {result && (
        <div style={{ background: colors.white, borderRadius: 16, border: `1.5px solid ${colors.border}`, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 16 }}>
            <span style={{ color: colors.primary }}>📍</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>{result.location}</span>
          </div>

          <div style={{ height: 1, background: colors.border }} />

          <div style={{ display: 'flex', padding: 24 }}>
            {/* Candle Lighting */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, background: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 4 }}>
                🕯️
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Candle Lighting</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: colors.primary }}>
                {result.candleLighting ? formatTime(result.candleLighting) : '—'}
              </span>
              <span style={{ fontSize: 13, color: colors.textLight }}>Friday</span>
            </div>

            <div style={{ width: 1, background: colors.border, margin: '0 16px' }} />

            {/* Havdalah */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, background: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 4 }}>
                🌙
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Havdalah</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: colors.primary }}>
                {result.havdalah ? formatTime(result.havdalah) : '—'}
              </span>
              <span style={{ fontSize: 13, color: colors.textLight }}>Saturday</span>
            </div>
          </div>

          <div style={{ height: 1, background: colors.border }} />
          <p style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', padding: 12 }}>
            Times for the week of {new Date(result.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      )}
    </div>
  );
}
