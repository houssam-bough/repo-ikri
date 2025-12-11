import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

const PendingApproval: React.FC = () => {
    const { t } = useLanguage();

    return (
        <div className="max-w-2xl mx-auto mt-10 pt-24 text-center">
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 rounded-lg shadow-md" role="alert">
                <p className="font-bold text-xl mb-2">{t('pending.title')}</p>
                <p>{t('pending.message')}</p>
            </div>
        </div>
    );
};

export default PendingApproval;
