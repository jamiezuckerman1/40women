export type Reason =
  | 'Refuah'
  | 'Zivug'
  | 'Parnassah'
  | 'Yeshuah'
  | 'Pru Urevu'
  | 'Shalom Bayit'
  | 'Chayal'
  | 'Aliya Neshama';

export const REASONS: Reason[] = [
  'Refuah', 'Zivug', 'Parnassah', 'Yeshuah',
  'Pru Urevu', 'Shalom Bayit', 'Chayal', 'Aliya Neshama',
];

export const REASON_LABELS: Record<Reason, string> = {
  Refuah: "Refuah — Recovery / Healing",
  Zivug: "Zivug — Finding a Spouse",
  Parnassah: "Parnassah — Livelihood",
  Yeshuah: "Yeshuah — General Salvation",
  'Pru Urevu': "Pru U'Revu — Having Children",
  'Shalom Bayit': "Shalom Bayit — Peace in the Home",
  Chayal: "Chayal — Safety of a Soldier",
  'Aliya Neshama': "Aliya Neshama — Elevation of a Soul",
};
