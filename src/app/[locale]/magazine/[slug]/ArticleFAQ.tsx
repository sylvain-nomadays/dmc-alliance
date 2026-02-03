'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface FAQItem {
  id: string;
  question_fr: string;
  question_en: string | null;
  answer_fr: string;
  answer_en: string | null;
  order_index: number;
}

interface ArticleFAQProps {
  articleId: string;
  locale: string;
}

export function ArticleFAQ({ articleId, locale }: ArticleFAQProps) {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isFr = locale === 'fr';

  useEffect(() => {
    async function fetchFAQs() {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('article_faqs')
        .select('*')
        .eq('article_id', articleId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching FAQs:', error);
        setFaqs([]);
      } else {
        setFaqs(data || []);
      }

      setIsLoading(false);
    }

    fetchFAQs();
  }, [articleId]);

  // Don't render if no FAQs
  if (isLoading || faqs.length === 0) {
    return null;
  }

  const translations = {
    title: isFr ? 'Questions fréquentes' : 'Frequently Asked Questions',
  };

  return (
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-heading text-gray-900 mb-8 text-center">
            {translations.title}
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const question = isFr ? faq.question_fr : (faq.question_en || faq.question_fr);
              const answer = isFr ? faq.answer_fr : (faq.answer_en || faq.answer_fr);
              const isOpen = openIndex === index;

              return (
                <div
                  key={faq.id}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900 pr-4">{question}</span>
                    <svg
                      className={`w-5 h-5 text-terracotta-500 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-[800px]' : 'max-h-0'
                    }`}
                  >
                    <div
                      className="p-5 pt-0 text-gray-600 leading-relaxed prose prose-sm max-w-none prose-p:text-gray-600 prose-strong:text-gray-900 prose-ul:mt-2 prose-li:text-gray-600 prose-blockquote:border-l-4 prose-blockquote:border-terracotta-300 prose-blockquote:bg-terracotta-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic"
                      dangerouslySetInnerHTML={{ __html: answer }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
