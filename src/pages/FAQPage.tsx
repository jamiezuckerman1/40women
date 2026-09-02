import { useState } from 'react';
import { colors } from '../colors';
import { s } from '../styles';

interface FAQEntry {
  question: string;
  answer: string;
}

const FAQS: FAQEntry[] = [
  {
    question: 'Can I sign up for multiple campaigns?',
    answer: "You can pray for as many individuals as you like! Feel free to join as many campaigns as you wish to pray for those in need.",
  },
  {
    question: 'Where does the mitzvah of Hafrashat Challah come from?',
    answer: "In Bamidbar 15:18-21, Hashem instructs Moshe to tell Bnei Yisrael that once they entered Eretz Yisrael, they must set aside a portion of dough from their baking as a gift to Hashem. Historically, this meant giving a piece of dough to the Kohanim, who relied on it as part of their compensation for their avodah (service) in the Beit HaMikdash. Since the Beit HaMikdash no longer stands, the practice has changed: instead of giving the dough to a Kohen, a k'zayit (olive-sized) piece is separated and either burned or otherwise disposed of respectfully, fulfilling the mitzvah.",
  },
  {
    question: 'How can I spread the word about someone in need of prayers?',
    answer: "The 'share' button on each campaign allows you to share the campaign via text or Instagram. You're welcome to share any campaign with friends and family via WhatsApp, Instagram story, or any group chat that you feel may lead to signups!",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.text, marginBottom: 20 }}>Frequently Asked Questions</h2>

      {FAQS.map((faq, i) => {
        const expanded = openIndex === i;
        return (
          <div key={i} style={s.card}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, cursor: 'pointer' }}
              onClick={() => setOpenIndex(expanded ? null : i)}
            >
              <span style={{ fontSize: 15, fontWeight: 700, color: colors.text, flex: 1 }}>{faq.question}</span>
              <span style={{ color: colors.primary, fontSize: 18, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
            </div>
            {expanded && (
              <p style={{ fontSize: 14, color: colors.textLight, lineHeight: '24px', marginTop: 12 }}>
                {faq.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
