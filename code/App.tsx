import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext'; // New Import
import AdminDashboard from './components/AdminDashboard';
import VIPDashboard from './components/VIPDashboard';
import AuthScreen from './components/AuthScreen';
import Header from './components/Header';
import PendingApproval from './components/PendingApproval';
import Profile from './components/Profile';
import PostDemand from './components/PostDemand';
import PostOffer from './components/PostOffer';
import UserSearch from './components/UserSearch';
import MyReservations from './components/MyReservations';
import Messages from './components/Messages';
import DemandDetails from './components/DemandDetails';
import DemandsFeed from './components/DemandsFeed';
import OffersFeed from './components/OffersFeed';
import { UserRole, AppView } from './types';


const AppContent: React.FC = () => {
    const { currentUser } = useAuth();
    const [view, setView] = useState<AppView>('dashboard');

    React.useEffect(() => {
        console.log('🔄 View state changed to:', view);
    }, [view]);

    console.log('=== App Render ===', 'view:', view, 'user:', currentUser?.name);

    // Render logic directly in return
    if (!currentUser) {
        return <AuthScreen />;
    }

    if (currentUser.approvalStatus !== 'approved' && currentUser.role !== UserRole.Admin) {
        return <PendingApproval />;
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 font-sans text-slate-800">
            <Header setView={setView} />
            {/* Debug indicator */}
            <div className="fixed top-20 right-4 bg-black text-white px-4 py-2 rounded shadow-lg z-50 text-xs">
                Current View: <strong>{view}</strong>
            </div>
            <main className="p-4 md:p-8">
                {view === 'profile' && <Profile setView={setView} />}
                {view === 'postDemand' && <PostDemand setView={setView} />}
                {view === 'postOffer' && <PostOffer setView={setView} />}
                {view === 'demandsFeed' && <DemandsFeed setView={setView} />}
                {view === 'offersFeed' && <OffersFeed setView={setView} />}
                {view === 'userSearch' && <UserSearch currentUser={currentUser} onBack={() => setView('dashboard')} setView={setView} />}
                {view === 'myReservations' && <MyReservations setView={setView} />}
                {view === 'messages' && <Messages setView={setView} />}
                {view === 'demandDetails' && <DemandDetails demandId={window.location.hash.split('-')[1] || ''} onBack={() => setView('dashboard')} />}
                {view === 'dashboard' && currentUser.role === UserRole.Admin && <AdminDashboard setView={setView} />}
                {view === 'dashboard' && currentUser.role !== UserRole.Admin && <VIPDashboard setView={setView} />}
            </main>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <LanguageProvider>
                <AppContent />
            </LanguageProvider>
        </AuthProvider>
    );
};

export default App;
