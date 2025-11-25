"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface Message {
  _id: string;
  content: string;
  senderName: string;
  read: boolean;
  createdAt: Date;
  relatedDemandId?: string;
  relatedOfferId?: string;
}

const NotificationBell: React.FC = () => {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Message[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/messages?userId=${currentUser._id}&unreadOnly=true`);
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.messages.slice(0, 5)); // Latest 5
          setUnreadCount(data.messages.length);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, [currentUser]);

  const markAsRead = async (messageIds: string[]) => {
    try {
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds })
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleNotificationClick = (notif: Message) => {
    markAsRead([notif._id]);
    setShowDropdown(false);
    
    if (notif.relatedDemandId) {
      window.location.href = '/?view=demands';
    } else if (notif.relatedOfferId) {
      window.location.href = '/?view=offers';
    }
  };

  if (!currentUser) return null;

  return (
    <div className="relative">
      <Button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-emerald-100 rounded-full transition-colors"
        variant="ghost"
      >
        <svg
          className="w-6 h-6 text-slate-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                Aucune notification
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => handleNotificationClick(notif)}
                >
                  <p className="text-sm text-slate-700 mb-1">{notif.content}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
          {unreadCount > 0 && (
            <div className="p-3 border-t border-slate-200">
              <Button
                onClick={() => {
                  const allIds = notifications.map(n => n._id);
                  markAsRead(allIds);
                  setShowDropdown(false);
                }}
                className="w-full text-sm text-emerald-600 hover:text-emerald-700"
                variant="ghost"
              >
                Marquer tout comme lu
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
