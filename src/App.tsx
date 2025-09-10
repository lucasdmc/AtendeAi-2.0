import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import Auth from './pages/Auth';
import { Layout } from './components/Layout';
import Index from './pages/Index';
import Agenda from './pages/Agenda';
import ContextPage from './pages/ContextPage';
import Conversations from './pages/Conversations';
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <Layout>
              <Index />
            </Layout>
          } />
          <Route path="/calendar" element={
            <Layout>
              <Agenda />
            </Layout>
          } />
          <Route path="/agenda" element={
            <Layout>
              <Agenda />
            </Layout>
          } />
          <Route path="/context" element={
            <Layout>
              <ContextPage />
            </Layout>
          } />
          <Route path="/conversations" element={
            <Layout>
              <Conversations />
            </Layout>
          } />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;