'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

function ContactForm({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const isFr = locale === 'fr';

  // Pre-fill based on URL params
  const serviceParam = searchParams.get('service');
  const partnerParam = searchParams.get('partner');
  const destinationParam = searchParams.get('destination');
  const circuitParam = searchParams.get('circuit');
  const typeParam = searchParams.get('type');
  const subjectParam = searchParams.get('subject');

  const [formData, setFormData] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
    subject: 'quote',
    destination: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Set initial subject based on URL params
  useEffect(() => {
    let initialSubject = 'quote';
    let initialMessage = '';

    if (subjectParam === 'partnership') {
      initialSubject = 'partnership';
    } else if (typeParam === 'commission' || typeParam === 'gir') {
      initialSubject = 'gir';
    } else if (serviceParam) {
      initialSubject = 'quote';
      initialMessage = isFr
        ? `Je souhaite des informations sur vos services ${serviceParam === 'tailor-made' ? 'sur-mesure' : serviceParam === 'groups' ? 'groupes' : 'GIR'}.`
        : `I would like information about your ${serviceParam === 'tailor-made' ? 'tailor-made' : serviceParam === 'groups' ? 'groups' : 'GIR'} services.`;
    }

    if (partnerParam) {
      initialMessage = isFr
        ? `Je souhaite contacter l'agence ${partnerParam}.`
        : `I would like to contact the ${partnerParam} agency.`;
    }

    if (destinationParam) {
      initialMessage = isFr
        ? `Je suis intéressé(e) par la destination : ${destinationParam}.`
        : `I am interested in the destination: ${destinationParam}.`;
    }

    if (circuitParam) {
      initialSubject = 'gir';
      initialMessage = isFr
        ? `Je souhaite des informations sur le circuit : ${circuitParam}.`
        : `I would like information about the tour: ${circuitParam}.`;
    }

    setFormData(prev => ({
      ...prev,
      subject: initialSubject,
      destination: destinationParam || '',
      message: initialMessage,
    }));
  }, [serviceParam, partnerParam, destinationParam, circuitParam, typeParam, subjectParam, isFr]);

  const translations = {
    company: isFr ? 'Société' : 'Company',
    companyPlaceholder: isFr ? 'Nom de votre société' : 'Your company name',
    name: isFr ? 'Nom complet' : 'Full name',
    namePlaceholder: isFr ? 'Prénom et nom' : 'First and last name',
    email: isFr ? 'Email professionnel' : 'Professional email',
    emailPlaceholder: isFr ? 'votre@email.com' : 'your@email.com',
    phone: isFr ? 'Téléphone' : 'Phone',
    phonePlaceholder: isFr ? '+33 1 23 45 67 89' : '+1 234 567 8900',
    subject: isFr ? 'Sujet' : 'Subject',
    subjects: {
      quote: isFr ? 'Demande de devis' : 'Quote request',
      gir: isFr ? 'Information GIR' : 'GIR information',
      partnership: isFr ? 'Devenir partenaire' : 'Become a partner',
      other: isFr ? 'Autre' : 'Other',
    },
    destination: isFr ? 'Destination souhaitée' : 'Desired destination',
    destinationPlaceholder: isFr ? 'Ex: Mongolie, Kenya...' : 'Ex: Mongolia, Kenya...',
    message: isFr ? 'Votre message' : 'Your message',
    messagePlaceholder: isFr
      ? 'Décrivez votre projet ou votre demande...'
      : 'Describe your project or request...',
    required: isFr ? 'Requis' : 'Required',
    optional: isFr ? 'Optionnel' : 'Optional',
    submit: isFr ? 'Envoyer le message' : 'Send message',
    sending: isFr ? 'Envoi en cours...' : 'Sending...',
    success: isFr
      ? 'Message envoyé ! Nous vous répondons sous 24h.'
      : 'Message sent! We will respond within 24 hours.',
    error: isFr
      ? 'Erreur lors de l\'envoi. Veuillez réessayer.'
      : 'Error sending. Please try again.',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSubmitStatus('success');
      setFormData({
        company: '',
        name: '',
        email: '',
        phone: '',
        subject: 'quote',
        destination: '',
        message: '',
      });
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company & Name Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
            {translations.company} <span className="text-gray-400">({translations.optional})</span>
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder={translations.companyPlaceholder}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            {translations.name} <span className="text-terracotta-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={translations.namePlaceholder}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Email & Phone Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            {translations.email} <span className="text-terracotta-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={translations.emailPlaceholder}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            {translations.phone} <span className="text-gray-400">({translations.optional})</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder={translations.phonePlaceholder}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Subject & Destination Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
            {translations.subject} <span className="text-terracotta-500">*</span>
          </label>
          <select
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent transition-all bg-white"
          >
            {Object.entries(translations.subjects).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
            {translations.destination} <span className="text-gray-400">({translations.optional})</span>
          </label>
          <input
            type="text"
            id="destination"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            placeholder={translations.destinationPlaceholder}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
          {translations.message} <span className="text-terracotta-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder={translations.messagePlaceholder}
          required
          rows={6}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent transition-all resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? translations.sending : translations.submit}
        </Button>

        {submitStatus === 'success' && (
          <p className="text-sage-600 font-medium flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {translations.success}
          </p>
        )}

        {submitStatus === 'error' && (
          <p className="text-red-600 font-medium flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {translations.error}
          </p>
        )}
      </div>
    </form>
  );
}

export default function ContactPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';
  const isFr = locale === 'fr';

  const translations = {
    title: isFr ? 'Contactez-nous' : 'Contact us',
    subtitle: isFr
      ? 'Une question, un projet, une demande de partenariat ? Notre équipe vous répond sous 24h.'
      : 'A question, a project, a partnership request? Our team responds within 24 hours.',
    infoTitle: isFr ? 'Nos coordonnées' : 'Our contact details',
    email: 'contact@dmc-alliance.com',
    phone: '+33 1 23 45 67 89',
    address: isFr ? '123 Rue du Voyage, 75001 Paris, France' : '123 Travel Street, 75001 Paris, France',
    hoursTitle: isFr ? 'Horaires' : 'Hours',
    hours: isFr
      ? 'Du lundi au vendredi, 9h - 18h (CET)'
      : 'Monday to Friday, 9am - 6pm (CET)',
    responseTime: isFr
      ? 'Temps de réponse moyen : 4h'
      : 'Average response time: 4h',
    faq: {
      title: isFr ? 'Questions fréquentes' : 'FAQ',
      items: [
        {
          q: isFr ? 'Qu\'est-ce qu\'un GIR ?' : 'What is a GIR?',
          a: isFr
            ? 'Un GIR (Groupe Inter-Réceptif) est un circuit à dates fixes dont les places sont mutualisées entre plusieurs agences de voyage. Vous pouvez y inscrire vos clients sans minimum de participants.'
            : 'A GIR (Inter-Receptive Group) is a fixed-date tour where seats are pooled between several travel agencies. You can register your clients without a minimum number of participants.',
        },
        {
          q: isFr ? 'Comment obtenir mes conditions tarifaires ?' : 'How do I get my pricing conditions?',
          a: isFr
            ? 'Contactez-nous via ce formulaire en indiquant votre société. Nous vous enverrons vos conditions professionnelles sous 24h.'
            : 'Contact us via this form indicating your company. We will send you your professional conditions within 24 hours.',
        },
        {
          q: isFr ? 'Comment devenir partenaire ?' : 'How to become a partner?',
          a: isFr
            ? 'Si vous êtes une agence réceptive locale et souhaitez rejoindre notre réseau, sélectionnez "Devenir partenaire" dans le formulaire ci-contre.'
            : 'If you are a local DMC and want to join our network, select "Become a partner" in the form.',
        },
      ],
    },
  };

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative py-20 bg-deep-blue-900">
        <div className="absolute inset-0">
          <Image
            src="/images/contact/hero-contact.jpg"
            alt=""
            fill
            className="object-cover opacity-20"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-heading text-white mb-4">
              {translations.title}
            </h1>
            <p className="text-xl text-white/80">
              {translations.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-sand-50 rounded-2xl p-8 md:p-10">
                <Suspense fallback={<div className="animate-pulse h-96 bg-gray-200 rounded-lg" />}>
                  <ContactForm locale={locale} />
                </Suspense>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Contact Info */}
              <div className="bg-sand-50 rounded-2xl p-8">
                <h2 className="text-xl font-heading text-gray-900 mb-6">
                  {translations.infoTitle}
                </h2>
                <div className="space-y-4">
                  {/* Email */}
                  <a
                    href={`mailto:${translations.email}`}
                    className="flex items-start gap-4 group"
                  >
                    <div className="w-10 h-10 bg-terracotta-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-terracotta-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-900 group-hover:text-terracotta-500 transition-colors">
                        {translations.email}
                      </p>
                    </div>
                  </a>

                  {/* Phone */}
                  <a
                    href={`tel:${translations.phone.replace(/\s/g, '')}`}
                    className="flex items-start gap-4 group"
                  >
                    <div className="w-10 h-10 bg-deep-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-deep-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{isFr ? 'Téléphone' : 'Phone'}</p>
                      <p className="text-gray-900 group-hover:text-terracotta-500 transition-colors">
                        {translations.phone}
                      </p>
                    </div>
                  </a>

                  {/* Address */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-sage-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{isFr ? 'Adresse' : 'Address'}</p>
                      <p className="text-gray-900">{translations.address}</p>
                    </div>
                  </div>
                </div>

                {/* Hours */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    {translations.hoursTitle}
                  </h3>
                  <p className="text-gray-600 text-sm">{translations.hours}</p>
                  <p className="text-sage-600 text-sm mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    {translations.responseTime}
                  </p>
                </div>
              </div>

              {/* FAQ */}
              <div className="bg-deep-blue-900 rounded-2xl p-8 text-white">
                <h2 className="text-xl font-heading mb-6">
                  {translations.faq.title}
                </h2>
                <div className="space-y-4">
                  {translations.faq.items.map((item, index) => (
                    <div key={index}>
                      <h3 className="font-medium text-white mb-1">{item.q}</h3>
                      <p className="text-deep-blue-200 text-sm">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map placeholder */}
      <section className="h-80 bg-gray-200 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-500">
              {isFr ? 'Carte interactive' : 'Interactive map'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
