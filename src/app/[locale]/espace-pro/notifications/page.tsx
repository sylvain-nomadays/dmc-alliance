'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Bell, CheckCircle, AlertCircle, Loader2, Mail, BellOff,
  BookOpen, TrendingUp, Calendar, Settings, Check, CheckCheck,
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationPreferences {
  email_new_gir: boolean;
  email_booking_confirmation: boolean;
  email_price_changes: boolean;
  email_availability_alerts: boolean;
  email_commission_updates: boolean;
  email_newsletter: boolean;
  email_marketing: boolean;
  in_app_notifications: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email_new_gir: true,
  email_booking_confirmation: true,
  email_price_changes: true,
  email_availability_alerts: true,
  email_commission_updates: true,
  email_newsletter: true,
  email_marketing: false,
  in_app_notifications: true,
};

export default function NotificationsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const isFr = locale === 'fr';

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tab, setTab] = useState<'notifications' | 'preferences'>('notifications');

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/agency/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
          if (data.preferences) {
            setPreferences(data.preferences);
          }
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/agency/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', notificationId }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/agency/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const savePreferences = async () => {
    setSavingPrefs(true);
    setMessage(null);

    try {
      const response = await fetch('/api/agency/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_preferences', preferences }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: isFr ? 'Préférences mises à jour' : 'Preferences updated' });
      } else {
        setMessage({ type: 'error', text: isFr ? 'Erreur lors de la sauvegarde' : 'Error saving preferences' });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: isFr ? 'Erreur serveur' : 'Server error' });
    } finally {
      setSavingPrefs(false);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking': return <BookOpen className="w-5 h-5 text-sage-600" />;
      case 'price_change': return <TrendingUp className="w-5 h-5 text-terracotta-600" />;
      case 'availability': return <Calendar className="w-5 h-5 text-deep-blue-600" />;
      case 'commission': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'system': return <Settings className="w-5 h-5 text-gray-600" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return isFr ? 'À l\'instant' : 'Just now';
    if (minutes < 60) return isFr ? `Il y a ${minutes} min` : `${minutes}m ago`;
    if (hours < 24) return isFr ? `Il y a ${hours}h` : `${hours}h ago`;
    if (days < 7) return isFr ? `Il y a ${days}j` : `${days}d ago`;
    return date.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta-500" />
      </div>
    );
  }

  const PREFERENCE_ITEMS: { key: keyof NotificationPreferences; label_fr: string; label_en: string; desc_fr: string; desc_en: string }[] = [
    { key: 'in_app_notifications', label_fr: 'Notifications in-app', label_en: 'In-app notifications', desc_fr: 'Recevoir les notifications dans l\'application', desc_en: 'Receive notifications in the app' },
    { key: 'email_new_gir', label_fr: 'Nouveaux circuits GIR', label_en: 'New GIR circuits', desc_fr: 'Être notifié des nouveaux circuits ajoutés', desc_en: 'Get notified about new circuits added' },
    { key: 'email_booking_confirmation', label_fr: 'Confirmations de réservation', label_en: 'Booking confirmations', desc_fr: 'Recevoir un email de confirmation pour chaque réservation', desc_en: 'Receive a confirmation email for each booking' },
    { key: 'email_price_changes', label_fr: 'Changements de prix', label_en: 'Price changes', desc_fr: 'Être alerté quand un prix change sur un circuit suivi', desc_en: 'Get alerted when a price changes on a watched circuit' },
    { key: 'email_availability_alerts', label_fr: 'Alertes disponibilité', label_en: 'Availability alerts', desc_fr: 'Notification quand les places se raréfient', desc_en: 'Notification when seats are running low' },
    { key: 'email_commission_updates', label_fr: 'Mises à jour commission', label_en: 'Commission updates', desc_fr: 'Notification lors de changements de taux de commission', desc_en: 'Notification when commission rates change' },
    { key: 'email_newsletter', label_fr: 'Newsletter', label_en: 'Newsletter', desc_fr: 'Recevoir notre newsletter avec les dernières actualités', desc_en: 'Receive our newsletter with the latest news' },
    { key: 'email_marketing', label_fr: 'Offres promotionnelles', label_en: 'Promotional offers', desc_fr: 'Recevoir des offres spéciales et promotions', desc_en: 'Receive special offers and promotions' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading text-gray-900">
            {isFr ? 'Notifications' : 'Notifications'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isFr ? 'Gérez vos notifications et préférences' : 'Manage your notifications and preferences'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setTab('notifications')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'notifications'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          {isFr ? 'Notifications' : 'Notifications'}
          {unreadCount > 0 && (
            <span className="bg-terracotta-500 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('preferences')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'preferences'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          {isFr ? 'Préférences' : 'Preferences'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <div className="space-y-4">
          {/* Actions */}
          {unreadCount > 0 && (
            <div className="flex justify-end">
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 text-sm text-terracotta-600 hover:text-terracotta-700 font-medium"
              >
                <CheckCheck className="w-4 h-4" />
                {isFr ? 'Tout marquer comme lu' : 'Mark all as read'}
              </button>
            </div>
          )}

          {/* List */}
          {notifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <BellOff className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                {isFr ? 'Aucune notification' : 'No notifications'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {isFr
                  ? 'Vous recevrez des notifications quand il y aura de l\'activité sur vos circuits suivis.'
                  : 'You\'ll receive notifications when there\'s activity on your watched circuits.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 transition-colors ${
                    notification.is_read ? 'bg-white' : 'bg-blue-50/50'
                  }`}
                >
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${notification.is_read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
                  </div>
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="mt-0.5 p-1 text-gray-400 hover:text-terracotta-500 transition-colors"
                      title={isFr ? 'Marquer comme lu' : 'Mark as read'}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preferences Tab */}
      {tab === 'preferences' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
            {PREFERENCE_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {isFr ? item.label_fr : item.label_en}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isFr ? item.desc_fr : item.desc_en}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => togglePreference(item.key)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    preferences[item.key] ? 'bg-terracotta-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      preferences[item.key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={savePreferences}
              disabled={savingPrefs}
              className="flex items-center gap-2 px-6 py-2.5 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {savingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {isFr ? 'Enregistrer les préférences' : 'Save Preferences'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
