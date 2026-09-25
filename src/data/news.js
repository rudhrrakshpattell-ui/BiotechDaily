// MOCK DATA: fictional headlines for layout and filtering. Dates are generated relative to now
// so the feed always looks current. Replace with GET /news from your API.
const daysAgo = (d, h = 9) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(h, 0, 0, 0);
  return t.toISOString();
};

export const news = [
  {
    id: 'n1', category: 'gene-editing', featured: true, date: daysAgo(0, 7), readTime: 6,
    title: 'Base-editing therapy clears liver target in first-in-human cohort',
    summary: 'A single infusion of an in-vivo base editor lowered its target protein by a median of 78% across six patients, with no serious adverse events at the 90-day readout.',
    source: 'BiotechDaily Staff', tags: ['base editing', 'in vivo', 'cardiometabolic'],
  },
  {
    id: 'n2', category: 'ai-discovery', date: daysAgo(0, 8), readTime: 5,
    title: 'Generative protein model designs binders against 12 “undruggable” targets',
    summary: 'The open-weights model produced nanomolar binders for 9 of 12 targets in the first design round, cutting typical discovery timelines from months to weeks.',
    source: 'Helix Wire', tags: ['protein design', 'machine learning'],
  },
  {
    id: 'n3', category: 'mrna', date: daysAgo(0, 10), readTime: 4,
    title: 'Personalized cancer vaccine approach expands to three new tumor types',
    summary: 'Individualized neoantigen mRNA vaccines move into later-stage testing in bladder, renal and lung cancers after encouraging melanoma data.',
    source: 'BiotechDaily Staff', tags: ['neoantigen', 'immunotherapy'], companyIds: ['moderna', 'biontech'],
  },
  {
    id: 'n4', category: 'funding', date: daysAgo(0, 12), readTime: 3,
    title: 'Synthetic-biology startup Lumora Bio raises $140M Series B',
    summary: 'The round will fund two IND-enabling programs built on its programmable gene-circuit platform for autoimmune disease.',
    source: 'Pipeline Pulse', tags: ['series b', 'synthetic biology'], startupIds: ['lumora'],
  },
  {
    id: 'n5', category: 'cell-therapy', date: daysAgo(1, 9), readTime: 7,
    title: 'Allogeneic CAR-T shows durable remissions in lupus at 12 months',
    summary: 'Off-the-shelf CAR-T cells reset the immune system in patients with refractory lupus, with most remaining drug-free a year after treatment.',
    source: 'Clinical Frontiers', tags: ['car-t', 'autoimmune'],
  },
  {
    id: 'n6', category: 'neuro', date: daysAgo(1, 13), readTime: 5,
    title: 'Blood test for early Alzheimer’s pathology matches PET accuracy',
    summary: 'A p-tau217 immunoassay identified amyloid-positive patients with 94% accuracy in an 1,800-person validation cohort.',
    source: 'Helix Wire', tags: ['diagnostics', 'alzheimers'], companyIds: ['biogen'],
  },
  {
    id: 'n7', category: 'regulatory', date: daysAgo(1, 16), readTime: 4,
    title: 'Regulators publish draft guidance on platform designations for gene therapies',
    summary: 'The framework would let sponsors reuse manufacturing and safety data across products built on the same validated vector platform.',
    source: 'Policy Desk', tags: ['guidance', 'gene therapy'],
  },
  {
    id: 'n8', category: 'oncology', date: daysAgo(2, 9), readTime: 6,
    title: 'Bispecific antibody doubles progression-free survival in phase 3',
    summary: 'A PD-1 x VEGF bispecific beat standard of care head-to-head in first-line lung cancer, with a manageable safety profile.',
    source: 'Clinical Frontiers', tags: ['bispecific', 'lung cancer'],
  },
  {
    id: 'n9', category: 'gene-editing', date: daysAgo(2, 14), readTime: 5,
    title: 'Prime editing corrects sickle-cell mutation with fewer bystander edits',
    summary: 'Preclinical data show a next-generation prime editor restoring healthy hemoglobin in patient-derived stem cells at clinically relevant efficiency.',
    source: 'BiotechDaily Staff', tags: ['prime editing', 'sickle cell'],
  },
  {
    id: 'n10', category: 'funding', date: daysAgo(3, 10), readTime: 3,
    title: 'Quarterly biotech venture funding rebounds to $9.8B across 212 deals',
    summary: 'Mega-rounds for AI-native discovery companies and obesity programs drove the quarter, while seed activity stayed flat.',
    source: 'Pipeline Pulse', tags: ['venture', 'market report'],
  },
  {
    id: 'n11', category: 'mrna', date: daysAgo(3, 15), readTime: 4,
    title: 'Self-amplifying RNA flu vaccine hits immunogenicity goals at one-tenth dose',
    summary: 'The saRNA candidate generated antibody titers comparable to licensed vaccines while using a fraction of the RNA payload.',
    source: 'Helix Wire', tags: ['sarna', 'influenza'],
  },
  {
    id: 'n12', category: 'ai-discovery', date: daysAgo(4, 11), readTime: 6,
    title: 'Single-cell foundation model predicts drug response across 40 cell types',
    summary: 'Trained on 90 million single-cell profiles, the model forecast transcriptional responses to unseen compounds.',
    source: 'BiotechDaily Staff', tags: ['single-cell', 'foundation models'], startupIds: ['cellscope'],
  },
  {
    id: 'n13', category: 'oncology', date: daysAgo(5, 9), readTime: 5,
    title: 'Radioligand therapy cleared for earlier-line prostate cancer use',
    summary: 'The label expansion brings targeted radiopharmaceutical treatment to patients before chemotherapy.',
    source: 'Policy Desk', tags: ['radiopharmaceuticals', 'prostate cancer'],
  },
  {
    id: 'n14', category: 'cell-therapy', date: daysAgo(6, 12), readTime: 4,
    title: 'In-vivo CAR-T delivered by lipid nanoparticles enters the clinic',
    summary: 'Programming T cells inside the body could remove the need for cell harvesting, manufacturing and lymphodepletion.',
    source: 'Clinical Frontiers', tags: ['in vivo car-t', 'lnp'], startupIds: ['vectra'],
  },
  {
    id: 'n15', category: 'neuro', date: daysAgo(9, 10), readTime: 5,
    title: 'Antisense oligonucleotide slows decline in rare ALS subtype',
    summary: 'Long-term extension data show continued reduction in neurofilament light chain, a marker of nerve damage.',
    source: 'Helix Wire', tags: ['aso', 'als'],
  },
  {
    id: 'n16', category: 'regulatory', date: daysAgo(14, 9), readTime: 3,
    title: 'Accelerated approval pathway sees record use for rare diseases',
    summary: 'An annual review counts more rare-disease accelerated approvals than any prior year, with confirmatory trials under closer scrutiny.',
    source: 'Policy Desk', tags: ['rare disease', 'policy'],
  },
  {
    id: 'n17', category: 'gene-editing', date: daysAgo(21, 9), readTime: 4,
    title: 'Epigenetic editor silences hepatitis B genes for six months in primates',
    summary: 'Without cutting DNA, the editor durably switched off viral gene expression, a step toward a functional cure.',
    source: 'BiotechDaily Staff', tags: ['epigenetic editing', 'hepatitis b'], startupIds: ['epiloop'],
  },
  {
    id: 'n18', category: 'funding', date: daysAgo(35, 9), readTime: 3,
    title: 'Licensing deals for China-originated assets hit a new high',
    summary: 'Upfront payments for in-licensed molecules rose sharply as sponsors look to refill pipelines ahead of patent cliffs.',
    source: 'Pipeline Pulse', tags: ['licensing', 'deals'],
  },
];
