export interface SectionGuide {
  label: string;
  navDescription: string;
  icon: 'today' | 'book' | 'practice' | 'review' | 'lab' | 'progress' | 'notes' | 'settings';
  purpose: string;
  action: string;
  evidence: string;
  helperRo: string;
}

export const sectionGuideByRoute = {
  '/': {
    label: 'Today', navDescription: 'Choose your next step', icon: 'today',
    purpose: 'Pick a manageable learning session for today.',
    action: 'Open the suggested lesson or resume your saved place.',
    evidence: 'Answers are saved as evidence; pausing a lesson saves your place.',
    helperRo: 'Alege următorul pas: începe lecția recomandată sau continuă de unde ai rămas.',
  },
  '/curriculum': {
    label: 'Curriculum', navDescription: 'Explore the book', icon: 'book',
    purpose: 'Find chapters, topics, and exercises from Dive into Deep Learning.',
    action: 'Choose a topic, then open an available lesson.',
    evidence: 'Lesson answers build evidence; browsing the map does not.',
    helperRo: 'Explorează cartea și alege un subiect. Răspunsurile tale arată ce ai înțeles.',
  },
  '/practice': {
    label: 'Practice', navDescription: 'Answer questions', icon: 'practice',
    purpose: 'Check what you can solve and find gaps in understanding.',
    action: 'Try an answer, check it, and use a hint if needed.',
    evidence: 'Answers, confidence, and help used are saved locally.',
    helperRo: 'Încearcă să răspunzi singur, apoi verifică. Ajutorul folosit este păstrat în progres.',
  },
  '/review': {
    label: 'Review', navDescription: 'Revisit what you learned', icon: 'review',
    purpose: 'See which concepts are due for another attempt.',
    action: 'Check what is due, then open practice to try again.',
    evidence: 'Practice answers update your evidence and review schedule.',
    helperRo: 'Vezi ce trebuie repetat, apoi deschide Practice pentru o nouă încercare.',
  },
  '/lab': {
    label: 'Lab', navDescription: 'Experiment with math', icon: 'lab',
    purpose: 'Explore shapes, gradients, and regression by changing values.',
    action: 'Change one value and compare the diagram with its table.',
    evidence: 'Lab experiments are exploratory and do not save mastery evidence.',
    helperRo: 'Schimbă o valoare și observă efectul. Experimentele din Lab nu înregistrează progres.',
  },
  '/progress': {
    label: 'Progress', navDescription: 'Inspect your evidence', icon: 'progress',
    purpose: 'See what your saved answers demonstrate for each concept.',
    action: 'Inspect the evidence count and learning state for a concept.',
    evidence: 'Independent answers support mastery; assisted attempts remain recorded.',
    helperRo: 'Verifică dovezile pentru fiecare concept. Progresul se bazează pe răspunsuri independente.',
  },
  '/notes': {
    label: 'Notes', navDescription: 'Save your explanations', icon: 'notes',
    purpose: 'Keep explanations, questions, and corrections in your own words.',
    action: 'Write a title and note, then choose Save note.',
    evidence: 'Notes stay in this browser and are included in progress backups.',
    helperRo: 'Scrie explicațiile și întrebările tale, apoi salvează nota în acest browser.',
  },
  '/settings': {
    label: 'Settings', navDescription: 'Preferences and backups', icon: 'settings',
    purpose: 'Choose learning preferences and manage your local data.',
    action: 'Adjust a preference or download a backup before changing data.',
    evidence: 'Backups include answers, reviews, saved sessions, notes, and preferences.',
    helperRo: 'Alege preferințele și descarcă o copie de siguranță înainte de a înlocui datele.',
  },
} as const satisfies Record<string, SectionGuide>;

export type SectionRoute = keyof typeof sectionGuideByRoute;
