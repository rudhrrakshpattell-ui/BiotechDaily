// MOCK DATA: fictional shows. Audio points to royalty-free sample tracks so the player works end to end.
// Replace with GET /podcasts, for example by parsing each show's RSS feed on your backend.
const audio = (n) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;

export const podcasts = [
  {
    id: 'helix-hour', title: 'The Helix Hour', host: 'Dr. Maya Chen', color: 'from-brand-500 to-helix-500',
    description: 'Weekly deep-dives with the scientists behind the week’s biggest discoveries.',
    episodes: [
      { id: 'hh-42', title: 'Base editing grows up: from bench to first patients', date: '2026-09-24', duration: '42 min', audioUrl: audio(1) },
      { id: 'hh-41', title: 'Why in-vivo CAR-T could change cell therapy economics', date: '2026-09-17', duration: '38 min', audioUrl: audio(2) },
      { id: 'hh-40', title: 'Protein design after AlphaFold', date: '2026-09-10', duration: '51 min', audioUrl: audio(3) },
    ],
  },
  {
    id: 'pipeline-pulse', title: 'Pipeline Pulse', host: 'Jordan Reyes & Priya Nair', color: 'from-helix-500 to-teal-700',
    description: 'Deals, data readouts and funding rounds: the business of biotech in 25 minutes.',
    episodes: [
      { id: 'pp-88', title: 'Q3 venture recap: where the money went', date: '2026-09-23', duration: '26 min', audioUrl: audio(4) },
      { id: 'pp-87', title: 'Obesity 2.0: oral incretins and muscle preservation', date: '2026-09-16', duration: '24 min', audioUrl: audio(5) },
      { id: 'pp-86', title: 'Licensing from China: the new pipeline playbook', date: '2026-09-09', duration: '28 min', audioUrl: audio(6) },
    ],
  },
  {
    id: 'bench-to-bedside', title: 'Bench to Bedside', host: 'Dr. Samuel Okafor', color: 'from-indigo-500 to-brand-700',
    description: 'Conversations with clinicians and patients about what new therapies mean in practice.',
    episodes: [
      { id: 'bb-19', title: 'Living with sickle cell after gene therapy', date: '2026-09-20', duration: '34 min', audioUrl: audio(7) },
      { id: 'bb-18', title: 'Alzheimer’s blood tests in the clinic', date: '2026-09-06', duration: '31 min', audioUrl: audio(8) },
    ],
  },
];
