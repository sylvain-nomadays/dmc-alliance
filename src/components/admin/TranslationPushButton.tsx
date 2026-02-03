'use client';

/**
 * Button component to push translations from French to all other languages
 * Uses the Claude API via /api/translations endpoint
 */

import { useState } from 'react';
import type { TranslatableContentType, TargetLocale } from '@/lib/translation/types';

interface TranslationPushButtonProps {
  contentType: TranslatableContentType;
  contentId: string;
  targetLocales?: TargetLocale[];
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export default function TranslationPushButton({
  contentType,
  contentId,
  targetLocales,
  onSuccess,
  onError,
  className = '',
  disabled = false,
}: TranslationPushButtonProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleTranslate = async () => {
    if (isTranslating || disabled) return;

    setIsTranslating(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/translations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType,
          contentId,
          targetLocales: targetLocales || ['en', 'de', 'nl', 'es', 'it'],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Translation failed');
      }

      setStatus('success');
      setMessage(data.message || 'Traductions effectuées avec succès');
      onSuccess?.();

      // Reset status after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de traduction';
      setStatus('error');
      setMessage(errorMessage);
      onError?.(errorMessage);

      // Reset status after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } finally {
      setIsTranslating(false);
    }
  };

  const getButtonStyles = () => {
    const baseStyles = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200';

    if (isTranslating) {
      return `${baseStyles} bg-deep-blue-100 text-deep-blue-600 cursor-wait`;
    }

    if (status === 'success') {
      return `${baseStyles} bg-sage-100 text-sage-700`;
    }

    if (status === 'error') {
      return `${baseStyles} bg-red-100 text-red-700`;
    }

    if (disabled) {
      return `${baseStyles} bg-gray-100 text-gray-400 cursor-not-allowed`;
    }

    return `${baseStyles} bg-deep-blue-600 text-white hover:bg-deep-blue-700 active:bg-deep-blue-800`;
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <button
        type="button"
        onClick={handleTranslate}
        disabled={isTranslating || disabled}
        className={getButtonStyles()}
      >
        {isTranslating ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Traduction en cours...</span>
          </>
        ) : status === 'success' ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Traduit !</span>
          </>
        ) : status === 'error' ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Erreur</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span>Push Traductions</span>
          </>
        )}
      </button>

      {message && (
        <p className={`text-xs ${status === 'error' ? 'text-red-600' : 'text-sage-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
