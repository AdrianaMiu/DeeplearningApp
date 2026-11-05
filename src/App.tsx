import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import type { LearningRepository } from './data/repository';
import { AppProvider } from './app/context';
import { Layout } from './components/Layout';

const Today = lazy(() => import('./routes/Today'));
const Curriculum = lazy(() => import('./routes/Curriculum'));
const Lesson = lazy(() => import('./routes/Lesson'));
const Practice = lazy(() => import('./routes/Practice'));
const Review = lazy(() => import('./routes/Review'));
const Lab = lazy(() => import('./routes/Lab'));
const Progress = lazy(() => import('./routes/Progress'));
const Notes = lazy(() => import('./routes/Notes'));
const Settings = lazy(() => import('./routes/Settings'));
const SectionActivity = lazy(() => import('./routes/SectionActivity'));
const ExerciseActivity = lazy(() => import('./routes/ExerciseActivity'));

export function AppShell({ repository }: { repository?: LearningRepository }) {
  return (
    <AppProvider repository={repository}>
      <Layout>
        <Suspense fallback={<div className="page"><p role="status">Opening notebook…</p></div>}>
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/curriculum/:chapterId?" element={<Curriculum />} />
            <Route path="/lesson/:lessonId" element={<Lesson />} />
            <Route path="/section/:sectionId" element={<SectionActivity />} />
            <Route path="/exercise/:exerciseId" element={<ExerciseActivity />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/review" element={<Review />} />
            <Route path="/lab" element={<Lab />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </AppProvider>
  );
}
