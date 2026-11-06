import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { configure } from '@testing-library/dom';

// Full-suite source verification runs the real PDF extractor in parallel;
// allow IndexedDB-backed route loaders enough time under that deliberate load.
configure({ asyncUtilTimeout: 3_000 });
