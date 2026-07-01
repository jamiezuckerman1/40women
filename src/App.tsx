import { Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './AuthContext';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import HomePage from './pages/HomePage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import LaunchPage from './pages/LaunchPage';
import MinePage from './pages/MinePage';
import AccountPage from './pages/AccountPage';
import ParshaPage from './pages/ParshaPage';
import ZmanimPage from './pages/ZmanimPage';
import HowItWorksPage from './pages/HowItWorksPage';
import Layout from './components/Layout';

export default function App() {
  const session = useSession();

  if (!session) {
    return (
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="*" element={<Navigate to="/sign-in" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/campaign/:id" element={<CampaignDetailPage />} />
        <Route path="/launch" element={<LaunchPage />} />
        <Route path="/mine" element={<MinePage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/parsha" element={<ParshaPage />} />
        <Route path="/zmanim" element={<ZmanimPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Layout>
  );
}
