import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '@/components/ui/button'

const AuthScreen: React.FC<{ initialTab?: 'login' | 'register' }> = ({ initialTab }) => {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab ?? 'login');
    const { t } = useLanguage();

    // Update active tab when initialTab changes after mount (allows header to switch tabs)
    useEffect(() => {
        if (initialTab) setActiveTab(initialTab)
    }, [initialTab])

    const tabClasses = (tabName: 'login' | 'register') =>
        `w-full py-3 text-center font-semibold rounded-t-lg cursor-pointer transition-colors duration-300 ${
            activeTab === tabName
                ? 'bg-white text-emerald-600 border-b-2 border-emerald-500'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`;

    return (
        <div className="max-w-md mx-auto mt-10">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="flex border-b">
                    <Button onClick={() => setActiveTab('login')} className={tabClasses('login')}>
                        {t('auth.loginTab')}
                    </Button>
                    <Button onClick={() => setActiveTab('register')} className={tabClasses('register')}>
                        {t('auth.registerTab')}
                    </Button>
                </div>
                <div className="p-8">
                    {activeTab === 'login' ? <Login /> : <Register />}
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;
