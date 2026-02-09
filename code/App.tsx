import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import AdminDashboard from './components/AdminDashboard';
import FarmerHome from './components/FarmerHome';
import ProviderHome from './components/ProviderHome';
import AuthScreen from './components/AuthScreen';
import NewHeader from './components/NewHeader';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
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
import MyDemands from './components/MyDemands';
import MyOffers from './components/MyOffers';
import { UserRole, AppView } from './types';
import * as api from './services/apiService';


const AppContent: React.FC = () => {
    const { currentUser } = useAuth();
    const [view, setView] = useState<AppView>('dashboard');
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

    // Fetch unread messages count
    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (!currentUser) return;
            
            try {
                const conversations = await api.getConversationsForUser(currentUser._id);
                const total = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
                setUnreadMessagesCount(total);
            } catch (error) {
                console.error('Error fetching unread messages:', error);
            }
        };

        fetchUnreadCount();
        
        // Refresh every 10 seconds
        const interval = setInterval(fetchUnreadCount, 10000);
        return () => clearInterval(interval);
    }, [currentUser, view]); // Refresh when view changes too

    // Render logic directly in return
    if (!currentUser) {
        return (
            <div className="min-h-screen w-full bg-linear-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
                <AuthScreen />
            </div>
        );
    }

    if (currentUser.approvalStatus !== 'approved' && currentUser.role !== UserRole.Admin) {
        return <PendingApproval />;
    }

    // Check if user is Admin
    const isAdmin = currentUser.role === UserRole.Admin;

    return (
        <div className="min-h-screen bg-gray-50">
            {isAdmin ? (
                <>
                    {/* Admin keeps the old sidebar layout */}
                    <Sidebar currentView={view} setView={setView} unreadMessages={unreadMessagesCount} />
                    <main className="lg:ml-64 min-h-screen">
                        {view === 'profile' && <Profile setView={setView} />}
                        {view === 'userSearch' && <UserSearch currentUser={currentUser} onBack={() => setView('dashboard')} setView={setView} />}
                        {view === 'messages' && <Messages setView={setView} />}
                        {view === 'dashboard' && <AdminDashboard key="admin" setView={setView} />}
                    </main>
                </>
            ) : (
                <>
                    {/* Modern layout for Farmer/Provider/Both */}
                    <NewHeader setView={setView} currentView={view} />
                    
                    <main className="min-h-screen">
                        {/* Sub-pages get padding for fixed header + bottom nav */}
                        {view !== 'dashboard' && (
                            <div className="pt-16 pb-24">
                                {view === 'profile' && <Profile setView={setView} />}
                                {view === 'postDemand' && <PostDemand setView={setView} />}
                                {view === 'postOffer' && <PostOffer setView={setView} />}
                                {view === 'demandsFeed' && <DemandsFeed setView={setView} />}
                                {view === 'myDemands' && <MyDemands setView={setView} />}
                                {view === 'myOffers' && <MyOffers setView={setView} />}
                                {view === 'offersFeed' && <OffersFeed setView={setView} />}
                                {view === 'userSearch' && <UserSearch currentUser={currentUser} onBack={() => setView('dashboard')} setView={setView} />}
                                {view === 'myReservations' && <MyReservations setView={setView} />}
                                {view === 'messages' && <Messages setView={setView} />}
                                {view === 'demandDetails' && <DemandDetails demandId={window.location.hash.split('-')[1] || ''} onBack={() => setView('dashboard')} />}
                            </div>
                        )}
                        
                        {/* Dashboard views handle their own padding (immersive heroes) */}
                        {view === 'dashboard' && currentUser.role === UserRole.Farmer && <FarmerHome key="farmer" setView={setView} />}
                        {view === 'dashboard' && currentUser.role === UserRole.Provider && <ProviderHome key="provider" setView={setView} />}
                        {view === 'dashboard' && currentUser.role === UserRole.Both && (
                            currentUser.activeMode === 'Provider' 
                                ? <ProviderHome key={`both-provider-${currentUser.activeMode}`} setView={setView} />
                                : <FarmerHome key={`both-farmer-${currentUser.activeMode}`} setView={setView} />
                        )}
                    </main>

                    <BottomNav currentView={view} setView={setView} />
                </>
            )}
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
