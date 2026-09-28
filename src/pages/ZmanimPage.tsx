import { useState } from 'react';
import { colors } from '../colors';
import { s } from '../styles';

interface ZmanimTime {
  time: string;
  weekday: string;
  memo?: string;
}

interface ZmanimResult {
  location: string;
  date: string;
  candleLighting: ZmanimTime | null;
  additionalCandleLightings: ZmanimTime[];
  havdalah: ZmanimTime | null;
}

function formatTime(iso: string): string {
  const timePart = iso.substring(11, 16);
  const [hourStr, minute] = timePart.split(':');
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${ampm}`;
}

// hebcal's item.date is an ISO string with the *local* (location tzid) offset baked in,
// so the date portion is already the location's local calendar date.
function weekdayFromIso(iso: string): string {
  const datePart = iso.substring(0, 10);
  return new Date(`${datePart}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
}

function toZmanimTime(item: { date: string; memo?: string }): ZmanimTime {
  return { time: formatTime(item.date), weekday: weekdayFromIso(item.date), memo: item.memo };
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
      const [gy, gm, gd] = friday.split('-');
      // Pin the query to the target Friday: hebcal's default (dateless) window is anchored
      // to today and can end before a holiday-shifted havdalah (e.g. a Sunday Simchat Torah
      // havdalah), silently dropping it.
      const dateParams = `&gy=${gy}&gm=${gm}&gd=${gd}`;
      let apiUrl: string;
      let locationLabel: string;

      if (isZipCode(trimmed)) {
        apiUrl = `https://www.hebcal.com/shabbat?cfg=json&zip=${trimmed}&m=50&b=18${dateParams}`;
        locationLabel = trimmed;
      } else {
        const geo = await resolveToGeocode(trimmed);
        if (!geo) { setError('Location not found. Try a different city or zip code.'); setLoading(false); return; }
        apiUrl = `https://www.hebcal.com/shabbat?cfg=json&latitude=${geo.lat}&longitude=${geo.lon}&m=50&b=18${dateParams}`;
        locationLabel = geo.label;
      }

      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();

      const location = json.location?.title ?? locationLabel;
      const items: { date: string; category: string; memo?: string }[] = json.items ?? [];

      const candleItems = items
        .filter(item => item.category === 'candles')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const havdalahItem = items.find(item => item.category === 'havdalah') ?? null;

      const [firstCandles, ...restCandles] = candleItems;
      const candleLighting = firstCandles ? toZmanimTime(firstCandles) : null;
      const additionalCandleLightings = restCandles.map(toZmanimTime);
      const havdalah = havdalahItem ? toZmanimTime(havdalahItem) : null;

      setResult({ location, date: friday, candleLighting, additionalCandleLightings, havdalah });
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
                {result.candleLighting ? result.candleLighting.time : '—'}
              </span>
              <span style={{ fontSize: 13, color: colors.textLight }}>
                {result.candleLighting ? result.candleLighting.weekday : ''}
              </span>
            </div>

            <div style={{ width: 1, background: colors.border, margin: '0 16px' }} />

            {/* Havdalah */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, background: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 4 }}>
                🌙
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Havdalah</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: colors.primary }}>
                {result.havdalah ? result.havdalah.time : '—'}
              </span>
              <span style={{ fontSize: 13, color: colors.textLight }}>
                {result.havdalah ? result.havdalah.weekday : ''}
              </span>
            </div>
          </div>

          {result.additionalCandleLightings.length > 0 && (
            <>
              <div style={{ height: 1, background: colors.border }} />
              <div style={{ padding: '12px 20px' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Additional Candle Lighting
                </span>
                {result.additionalCandleLightings.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
                    <span style={{ fontSize: 14, color: colors.text }}>
                      {item.weekday}{item.memo ? ` · ${item.memo}` : ''}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: colors.primary }}>{item.time}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ height: 1, background: colors.border }} />
          <p style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', padding: 12 }}>
            Times for the week of {new Date(result.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      )}
    </div>
  );
}
