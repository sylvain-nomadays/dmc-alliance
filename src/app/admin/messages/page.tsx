'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface QuoteRequest {
  id: string;
  company_name: string | null;
  contact_name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  destination: string | null;
  travel_dates: string | null;
  group_size: number | null;
  budget_range: string | null;
  status: 'new' | 'pending' | 'replied' | 'converted' | 'closed';
  created_at: string;
  destination_info?: { name: string } | null;
  circuit_info?: { title: string } | null;
  partner_info?: { name: string } | null;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

const statusLabels: Record<string, { label: string; class: string }> = {
  new: { label: 'Nouveau', class: 'bg-terracotta-100 text-terracotta-700' },
  pending: { label: 'En attente', class: 'bg-amber-100 text-amber-700' },
  replied: { label: 'Répondu', class: 'bg-deep-blue-100 text-deep-blue-700' },
  converted: { label: 'Converti', class: 'bg-sage-100 text-sage-700' },
  closed: { label: 'Fermé', class: 'bg-gray-100 text-gray-600' },
};

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<'quotes' | 'contacts'>('quotes');
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactMessage | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    setIsLoading(true);
    const supabase = createClient();

    if (activeTab === 'quotes') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('quote_requests')
        .select(`
          *,
          destination_info:destinations(name),
          circuit_info:circuits(title),
          partner_info:partners(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quotes:', error);
      } else {
        setQuotes(data || []);
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contacts:', error);
      } else {
        setContacts(data || []);
      }
    }

    setIsLoading(false);
  }

  async function updateQuoteStatus(id: string, newStatus: string) {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('quote_requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setQuotes((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: newStatus as QuoteRequest['status'] } : q))
      );
      if (selectedQuote?.id === id) {
        setSelectedQuote({ ...selectedQuote, status: newStatus as QuoteRequest['status'] });
      }
    }
  }

  async function markContactAsRead(id: string) {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('contact_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_read: true } : c))
      );
    }
  }

  async function deleteQuote(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) return;

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('quote_requests').delete().eq('id', id);

    if (!error) {
      setQuotes((prev) => prev.filter((q) => q.id !== id));
      setSelectedQuote(null);
    }
  }

  async function deleteContact(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('contact_messages').delete().eq('id', id);

    if (!error) {
      setContacts((prev) => prev.filter((c) => c.id !== id));
      setSelectedContact(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const filteredQuotes = quotes.filter((q) =>
    filterStatus === 'all' || q.status === filterStatus
  );

  const unreadContacts = contacts.filter((c) => !c.is_read).length;
  const newQuotes = quotes.filter((q) => q.status === 'new').length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-heading text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-1">
          Gérez les demandes de devis et messages de contact
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => { setActiveTab('quotes'); setSelectedQuote(null); }}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
            activeTab === 'quotes'
              ? 'bg-terracotta-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Demandes de devis
          {newQuotes > 0 && (
            <span className="px-2 py-0.5 text-xs bg-white text-terracotta-600 rounded-full">
              {newQuotes}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('contacts'); setSelectedContact(null); }}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
            activeTab === 'contacts'
              ? 'bg-terracotta-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Messages de contact
          {unreadContacts > 0 && (
            <span className="px-2 py-0.5 text-xs bg-white text-terracotta-600 rounded-full">
              {unreadContacts}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Filter (for quotes) */}
          {activeTab === 'quotes' && (
            <div className="p-4 border-b border-gray-100">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 bg-white text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="new">Nouveau</option>
                <option value="pending">En attente</option>
                <option value="replied">Répondu</option>
                <option value="converted">Converti</option>
                <option value="closed">Fermé</option>
              </select>
            </div>
          )}

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : activeTab === 'quotes' ? (
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {filteredQuotes.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Aucune demande de devis
                </div>
              ) : (
                filteredQuotes.map((quote) => (
                  <button
                    key={quote.id}
                    onClick={() => setSelectedQuote(quote)}
                    className={cn(
                      'w-full p-4 text-left hover:bg-gray-50 transition-colors',
                      selectedQuote?.id === quote.id && 'bg-terracotta-50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-gray-900 truncate">
                        {quote.contact_name}
                      </p>
                      <span className={cn(
                        'px-2 py-0.5 text-xs rounded-full flex-shrink-0',
                        statusLabels[quote.status].class
                      )}>
                        {statusLabels[quote.status].label}
                      </span>
                    </div>
                    {quote.company_name && (
                      <p className="text-sm text-gray-600 truncate">{quote.company_name}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(quote.created_at)}
                    </p>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {contacts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Aucun message de contact
                </div>
              ) : (
                contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => {
                      setSelectedContact(contact);
                      if (!contact.is_read) markContactAsRead(contact.id);
                    }}
                    className={cn(
                      'w-full p-4 text-left hover:bg-gray-50 transition-colors',
                      selectedContact?.id === contact.id && 'bg-terracotta-50',
                      !contact.is_read && 'bg-deep-blue-50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className={cn(
                        'text-gray-900 truncate',
                        !contact.is_read && 'font-bold'
                      )}>
                        {contact.name}
                      </p>
                      {!contact.is_read && (
                        <span className="w-2 h-2 bg-terracotta-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    {contact.subject && (
                      <p className="text-sm text-gray-600 truncate">{contact.subject}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(contact.created_at)}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
          {activeTab === 'quotes' && selectedQuote ? (
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-heading text-gray-900">
                    {selectedQuote.contact_name}
                  </h2>
                  {selectedQuote.company_name && (
                    <p className="text-gray-600">{selectedQuote.company_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedQuote.status}
                    onChange={(e) => updateQuoteStatus(selectedQuote.id, e.target.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer',
                      statusLabels[selectedQuote.status].class
                    )}
                  >
                    <option value="new">Nouveau</option>
                    <option value="pending">En attente</option>
                    <option value="replied">Répondu</option>
                    <option value="converted">Converti</option>
                    <option value="closed">Fermé</option>
                  </select>
                  <button
                    onClick={() => deleteQuote(selectedQuote.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a href={`mailto:${selectedQuote.email}`} className="text-terracotta-600 hover:underline">
                    {selectedQuote.email}
                  </a>
                </div>
                {selectedQuote.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <a href={`tel:${selectedQuote.phone}`} className="text-terracotta-600 hover:underline">
                      {selectedQuote.phone}
                    </a>
                  </div>
                )}
                {selectedQuote.destination && (
                  <div>
                    <p className="text-sm text-gray-500">Destination souhaitée</p>
                    <p className="text-gray-900">{selectedQuote.destination}</p>
                  </div>
                )}
                {selectedQuote.destination_info && (
                  <div>
                    <p className="text-sm text-gray-500">Destination (lien)</p>
                    <p className="text-gray-900">{selectedQuote.destination_info.name}</p>
                  </div>
                )}
                {selectedQuote.circuit_info && (
                  <div>
                    <p className="text-sm text-gray-500">Circuit demandé</p>
                    <p className="text-gray-900">{selectedQuote.circuit_info.title}</p>
                  </div>
                )}
                {selectedQuote.travel_dates && (
                  <div>
                    <p className="text-sm text-gray-500">Dates de voyage</p>
                    <p className="text-gray-900">{selectedQuote.travel_dates}</p>
                  </div>
                )}
                {selectedQuote.group_size && (
                  <div>
                    <p className="text-sm text-gray-500">Taille du groupe</p>
                    <p className="text-gray-900">{selectedQuote.group_size} personne(s)</p>
                  </div>
                )}
                {selectedQuote.budget_range && (
                  <div>
                    <p className="text-sm text-gray-500">Budget</p>
                    <p className="text-gray-900">{selectedQuote.budget_range}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-500 mb-2">Message</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedQuote.message}</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <a
                  href={`mailto:${selectedQuote.email}?subject=Re: Votre demande de devis - DMC Alliance`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Répondre par email
                </a>
                {selectedQuote.phone && (
                  <a
                    href={`tel:${selectedQuote.phone}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Appeler
                  </a>
                )}
              </div>
            </div>
          ) : activeTab === 'contacts' && selectedContact ? (
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-heading text-gray-900">
                    {selectedContact.name}
                  </h2>
                  {selectedContact.company && (
                    <p className="text-gray-600">{selectedContact.company}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteContact(selectedContact.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a href={`mailto:${selectedContact.email}`} className="text-terracotta-600 hover:underline">
                    {selectedContact.email}
                  </a>
                </div>
                {selectedContact.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <a href={`tel:${selectedContact.phone}`} className="text-terracotta-600 hover:underline">
                      {selectedContact.phone}
                    </a>
                  </div>
                )}
                {selectedContact.subject && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Sujet</p>
                    <p className="text-gray-900">{selectedContact.subject}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-500 mb-2">Message</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <a
                  href={`mailto:${selectedContact.email}?subject=Re: ${selectedContact.subject || 'Votre message'}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Répondre par email
                </a>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p>Sélectionnez un message pour voir les détails</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
