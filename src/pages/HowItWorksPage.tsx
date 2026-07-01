import { colors } from '../colors';

const steps: { number: string; en: string; he?: string; showTranslit?: boolean }[] = [
  { number: '1', en: 'Browse the campaign feed and find someone you want to daven for.' },
  { number: '2', en: 'Click "I want to bake challah for this person" to commit.' },
  {
    number: '3',
    en: "While kneading, have in mind that you are baking l'iluy nishmat / l'refuat / l'zivug / l'parnassat [person's name].",
  },
  {
    number: '4',
    en: 'If your dough is large enough (over 5 lbs of flour), separate challah with a bracha:',
    he: 'בָּרוּךְ אַתָּה ה\' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ לְהַפְרִישׁ חַלָּה מִן הָעִיסָּה',
    showTranslit: true,
  },
  {
    number: '5',
    en: 'Then say: הֲרֵי זוֹ חַלָּה — "Harei zo challah."\n\nSay a tefillah for this person when you separate the challah.',
  },
  {
    number: '6',
    en: 'Yehi Ratzon — say this prayer after separating challah:',
    he: 'יְהִי רָצֹון מִלְּפָנֶיךָ ה׳ אֱלֹקֵינוּ וֵאלֹקֵי אֲבֹותֵינוּ שֶׁהַמִּצְוָה שֶׁל הַפְרָשַׁת חַלָּה תֵּחָשֵׁב כְּאִלּוּ קִיַּמְתִּיהָ בְּכָל פְּרָטֶיהָ וְדִקְדּוּקֶיהָ',
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      <p style={{ fontSize: 15, color: colors.textLight, lineHeight: '24px', marginBottom: 24, fontStyle: 'italic' }}>
        The segulah of 40 women baking challah together is a powerful tefillah for Klal Yisrael. Here's how it works:
      </p>

      {steps.map(step => (
        <div key={step.number} style={{
          display: 'flex', gap: 14, marginBottom: 16,
          background: '#FFFDF9', borderRadius: 12,
          border: `1.5px solid ${colors.border}`, padding: 16,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 16,
            background: colors.primary, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 15, flexShrink: 0, marginTop: 2,
          }}>
            {step.number}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, color: colors.text, lineHeight: '22px', whiteSpace: 'pre-line' }}>{step.en}</p>
            {step.he && (
              <p style={{ fontSize: 16, color: colors.primary, lineHeight: '28px', textAlign: 'right', marginTop: 8, fontWeight: 600, direction: 'rtl' }}>
                {step.he}
              </p>
            )}
            {step.showTranslit && (
              <p style={{ fontSize: 13, color: colors.textMuted, lineHeight: '20px', marginTop: 6, fontStyle: 'italic' }}>
                Baruch Atah Hashem, Elokeinu Melech ha'olam, asher kidshanu b'mitzvotav v'tzivanu l'hafrish challah min ha'isah.
              </p>
            )}
          </div>
        </div>
      ))}

      <div style={{ background: colors.primary, borderRadius: 14, padding: 20, marginTop: 8, textAlign: 'center' }}>
        <p style={{ fontSize: 16, color: '#fff', lineHeight: '26px', fontWeight: 600, marginBottom: 8 }}>
          יהי רצון שתעלה תפילתנו לפני הקב"ה ויושע כל מי שצריך ישועה.
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: '20px', fontStyle: 'italic' }}>
          May our tefillos rise before Hashem and may all who need a yeshuah be saved.
        </p>
      </div>
    </div>
  );
}
