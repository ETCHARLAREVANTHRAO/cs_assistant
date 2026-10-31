import { Suspense, lazy } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

const Login = lazy(() => import('./pages/Login'));
const Chat = lazy(() => import('./pages/Chat'));
const Documents = lazy(() => import('./pages/Documents'));
const Learning = lazy(() => import('./pages/Learning'));
const Doubts = lazy(() => import('./pages/Doubts'));
const RevisionPlanner = lazy(() => import('./pages/RevisionPlanner'));
const Resources = lazy(() => import('./pages/Resources'));
const AIFeatures = lazy(() => import('./pages/AIFeatures'));
const Community = lazy(() => import('./pages/Community'));
const ExamInfo = lazy(() => import('./pages/ExamInfo'));
const Motivation = lazy(() => import('./pages/Motivation'));
const Revision = lazy(() => import('./pages/Revision'));
const QuizSetup = lazy(() => import('./pages/QuizSetup'));
const QuizResults = lazy(() => import('./pages/QuizResults'));
const MockTestSession = lazy(() => import('./pages/MockTestSession'));
const MockTestResults = lazy(() => import('./pages/MockTestResults'));
const PYQHome = lazy(() => import('./pages/PYQHome'));
const PYQInstructions = lazy(() => import('./pages/PYQInstructions'));
const PYQSession = lazy(() => import('./pages/PYQSession'));
const PYQResult = lazy(() => import('./pages/PYQResult'));
const PYQReview = lazy(() => import('./pages/PYQReview'));
const Progress = lazy(() => import('./pages/Progress'));
const Downloads = lazy(() => import('./pages/Downloads'));
const Settings = lazy(() => import('./pages/Settings'));
const Account = lazy(() => import('./pages/Account'));
const UsageDashboard = lazy(() => import('./pages/UsageDashboard'));
const AdminDriveSync = lazy(() => import('./pages/AdminDriveSync'));
const AdminContent = lazy(() => import('./pages/AdminContent'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function RootRedirect() {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={currentUser ? '/chat' : '/login'} replace />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-text-muted flex items-center justify-center">Loading...</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />

      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
      <Route path="/learning" element={<ProtectedRoute><Learning /></ProtectedRoute>} />
      <Route path="/doubts" element={<ProtectedRoute><Doubts /></ProtectedRoute>} />
      <Route path="/revision-planner" element={<ProtectedRoute><RevisionPlanner /></ProtectedRoute>} />
      <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
      <Route path="/ai" element={<ProtectedRoute><AIFeatures /></ProtectedRoute>} />
      <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
      <Route path="/exam-info" element={<ProtectedRoute><ExamInfo /></ProtectedRoute>} />
      <Route path="/motivation" element={<ProtectedRoute><Motivation /></ProtectedRoute>} />
      <Route path="/revision" element={<ProtectedRoute><Revision /></ProtectedRoute>} />
      <Route path="/quiz" element={<ProtectedRoute><QuizSetup /></ProtectedRoute>} />
      <Route path="/quiz/results" element={<ProtectedRoute><QuizResults /></ProtectedRoute>} />
      <Route path="/mock-test" element={<ProtectedRoute><MockTestSession /></ProtectedRoute>} />
      <Route path="/mock-test/results" element={<ProtectedRoute><MockTestResults /></ProtectedRoute>} />
      <Route path="/pyq" element={<ProtectedRoute><PYQHome /></ProtectedRoute>} />
      <Route path="/pyq/:paperId/instructions" element={<ProtectedRoute><PYQInstructions /></ProtectedRoute>} />
      <Route path="/pyq/attempt/:attemptId" element={<ProtectedRoute><PYQSession /></ProtectedRoute>} />
      <Route path="/pyq/result/:attemptId" element={<ProtectedRoute><PYQResult /></ProtectedRoute>} />
      <Route path="/pyq/review/:attemptId" element={<ProtectedRoute><PYQReview /></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
      <Route path="/downloads" element={<ProtectedRoute><Downloads /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
      <Route path="/usage" element={<ProtectedRoute><UsageDashboard /></ProtectedRoute>} />
      <Route path="/admin/drive-sync" element={<ProtectedRoute><AdminDriveSync /></ProtectedRoute>} />
      <Route path="/admin/content" element={<ProtectedRoute><AdminContent /></ProtectedRoute>} />
      <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  const Router = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;

  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;









