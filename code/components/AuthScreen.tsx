import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import { useLanguage } from '../hooks/useLanguage';

const AuthScreen: React.FC<{ initialTab?: 'login' | 'register' }> = ({ initialTab }) => {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab ?? 'login');
    const { t } = useLanguage();

    // Update active tab when initialTab changes after mount (allows header to switch tabs)
    useEffect(() => {
        if (initialTab) setActiveTab(initialTab)
    }, [initialTab])

    return (
        <>
            {activeTab === 'login' ? (
                <Login onSwitchToRegister={() => setActiveTab('register')} />
            ) : (
                <Register onSwitchToLogin={() => setActiveTab('login')} />
            )}
        </>
    );
};

export default AuthScreen;
