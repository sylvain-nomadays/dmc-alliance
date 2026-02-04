'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface NewsletterFormProps {
  locale?: string;
  variant?: 'default' | 'compact' | 'magazine';
  className?: string;
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

const translations = {
  fr: {
    placeholder: 'Votre email professionnel',
    button: 'S\'inscrire',
    buttonLoading: 'Inscription...',
    success: 'Merci ! Vérifiez votre boîte mail pour confirmer votre inscription.',
    errorInvalid: 'Adresse email invalide',
    errorServer: 'Une erreur est survenue. Veuillez réessayer.',
    errorAlreadySubscribed: 'Cette adresse est déjà inscrite',
  },
  en: {
    placeholder: 'Your professional email',
    button: 'Subscribe',
    buttonLoading: 'Subscribing...',
    success: 'Thank you! Check your inbox to confirm your subscription.',
    errorInvalid: 'Invalid email address',
    errorServer: 'An error occurred. Please try again.',
    errorAlreadySubscribed: 'This email is already subscribed',
  },
};

export function NewsletterForm({ locale = 'fr', variant = 'default', className }: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState('');

  const t = translations[locale as keyof typeof translations] || translations.fr;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setMessage(t.errorInvalid);
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          locale,
          interests: ['gir', 'destinations', 'offers', 'magazine'],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        if (response.status === 409) {
          setMessage(t.errorAlreadySubscribed);
        } else {
          setMessage(data.error || t.errorServer);
        }
        return;
      }

      setStatus('success');
      setMessage(data.message || t.success);
      setEmail('');

      // Reset after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);

    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setStatus('error');
      setMessage(t.errorServer);
    }
  };

  // Success state
  if (status === 'success') {
    return (
      <div className={cn(
        'flex items-center gap-3 p-4 rounded-lg',
        variant === 'magazine' ? 'bg-white/20 text-white' : 'bg-green-50 text-green-700',
        className
      )}>
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <p className="text-sm">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-2', className)}>
      <div className={cn(
        'flex gap-2',
        variant === 'compact' ? 'flex-row' : 'flex-col sm:flex-row'
      )}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.placeholder}
          disabled={status === 'loading'}
          className={cn(
            'flex-1 px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2',
            variant === 'magazine'
              ? 'bg-white/10 border-white/30 text-white placeholder-white/60 focus:ring-white/50'
              : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-terracotta-500 focus:border-terracotta-500',
            status === 'loading' && 'opacity-50 cursor-not-allowed'
          )}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className={cn(
            'px-6 py-3 rounded-lg font-medium transition-all',
            variant === 'magazine'
              ? 'bg-white text-terracotta-600 hover:bg-white/90'
              : 'bg-terracotta-600 text-white hover:bg-terracotta-700',
            status === 'loading' && 'opacity-50 cursor-not-allowed',
            'flex items-center justify-center gap-2 whitespace-nowrap'
          )}
        >
          {status === 'loading' ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t.buttonLoading}
            </>
          ) : (
            t.button
          )}
        </button>
      </div>

      {/* Error message */}
      {status === 'error' && message && (
        <p className={cn(
          'text-sm',
          variant === 'magazine' ? 'text-white/80' : 'text-red-600'
        )}>
          {message}
        </p>
      )}
    </form>
  );
}
