import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import RecruiterRoute from './components/Auth/RecruiterRoute'
import CandidateRoute from './components/Auth/CandidateRoute'
import ErrorBoundary from './components/Common/ErrorBoundary'
import Footer from './components/Navigation/Footer'
import Navbar from './components/Navigation/Navbar'
import ApplicationsPage from './pages/ApplicationsPage'
import BookmarksPage from './pages/BookmarksPage'
import CompanyPage from './pages/CompanyPage'
import CompanyJobsPage from './pages/CompanyJobsPage'
import CVSearchPage from './pages/CVSearchPage'
import CVsPage from './pages/CVsPage'
import JobDetailPage from './pages/JobDetailPage'
import JobsPage from './pages/JobsPage'
import LoginPage from './pages/LoginPage'
import ManageJobsPage from './pages/ManageJobsPage'
import NotFoundPage from './pages/NotFoundPage'
import PostJobPage from './pages/PostJobPage'
import ProfilePage from './pages/ProfilePage'
import RecruiterApplicationsPage from './pages/RecruiterApplicationsPage'
import SignupPage from './pages/SignupPage'

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/jobs" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/jobs"
              element={
                <ProtectedRoute>
                  <JobsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/:id"
              element={
                <ProtectedRoute>
                  <JobDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications"
              element={
                <ProtectedRoute>
                  <CandidateRoute>
                    <ApplicationsPage />
                  </CandidateRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cvs"
              element={
                <ProtectedRoute>
                  <CandidateRoute>
                    <CVsPage />
                  </CandidateRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookmarks"
              element={
                <ProtectedRoute>
                  <CandidateRoute>
                    <BookmarksPage />
                  </CandidateRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/new"
              element={
                <ProtectedRoute>
                  <RecruiterRoute>
                    <PostJobPage />
                  </RecruiterRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/:id/edit"
              element={
                <ProtectedRoute>
                  <RecruiterRoute>
                    <PostJobPage />
                  </RecruiterRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-jobs"
              element={
                <ProtectedRoute>
                  <RecruiterRoute>
                    <ManageJobsPage />
                  </RecruiterRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/applications"
              element={
                <ProtectedRoute>
                  <RecruiterRoute>
                    <RecruiterApplicationsPage />
                  </RecruiterRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/companies"
              element={
                <ProtectedRoute>
                  <CompanyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/companies/:id"
              element={
                <ProtectedRoute>
                  <CompanyJobsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/company" element={<Navigate to="/companies" replace />} />
            <Route
              path="/cv-search"
              element={
                <ProtectedRoute>
                  <RecruiterRoute>
                    <CVSearchPage />
                  </RecruiterRoute>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppLayout>
      </ErrorBoundary>
      <Toaster richColors position="bottom-right" />
    </BrowserRouter>
  )
}

export default App
