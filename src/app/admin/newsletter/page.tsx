'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string;
  title: string;
  subject_fr: string;
  subject_en: string | null;
  content_fr: string;
  content_en: string | null;
  target_audience: 'all' | 'agencies' | 'partners' | 'custom';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  scheduled_at: string | null;
  sent_at: string | null;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
  };
  created_at: string;
}

const audienceLabels: Record<string, string> = {
  all: 'Tous les utilisateurs',
  agencies: 'Agences uniquement',
  partners: 'Partenaires uniquement',
  custom: 'Personnalisé',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
  scheduled: { label: 'Programmé', color: 'bg-blue-100 text-blue-700' },
  sending: { label: 'Envoi en cours', color: 'bg-yellow-100 text-yellow-700' },
  sent: { label: 'Envoyé', color: 'bg-sage-100 text-sage-700' },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-700' },
};

export default function NewsletterPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Partial<Campaign> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('newsletter_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
    } else {
      setCampaigns(data || []);
    }
    setIsLoading(false);
  }

  async function saveCampaign() {
    if (!editingCampaign?.title || !editingCampaign?.subject_fr || !editingCampaign?.content_fr) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSaving(true);
    const supabase = createClient();

    const campaignData = {
      title: editingCampaign.title,
      subject_fr: editingCampaign.subject_fr,
      subject_en: editingCampaign.subject_en || null,
      content_fr: editingCampaign.content_fr,
      content_en: editingCampaign.content_en || null,
      target_audience: editingCampaign.target_audience || 'all',
      status: editingCampaign.status || 'draft',
    };

    if (editingCampaign.id) {
      // Update
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('newsletter_campaigns')
        .update(campaignData)
        .eq('id', editingCampaign.id);

      if (error) {
        console.error('Error updating campaign:', error);
        alert('Erreur lors de la mise à jour');
      }
    } else {
      // Create
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('newsletter_campaigns')
        .insert(campaignData);

      if (error) {
        console.error('Error creating campaign:', error);
        alert('Erreur lors de la création');
      }
    }

    setIsSaving(false);
    setShowEditor(false);
    setEditingCampaign(null);
    fetchCampaigns();
  }

  async function sendCampaign(campaignId: string) {
    if (!confirm('Êtes-vous sûr de vouloir envoyer cette newsletter maintenant ?')) return;

    setSendingId(campaignId);

    try {
      const response = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Newsletter envoyée avec succès à ${data.sent} destinataires !`);
        fetchCampaigns();
      } else {
        alert(`Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      alert('Erreur lors de l\'envoi');
    }

    setSendingId(null);
  }

  async function deleteCampaign(campaignId: string) {
    if (!confirm('Supprimer cette campagne ?')) return;

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('newsletter_campaigns')
      .delete()
      .eq('id', campaignId);

    if (!error) {
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-heading text-gray-900">Newsletter</h1>
          <p className="text-gray-600 mt-1">
            Créez et envoyez des newsletters à vos utilisateurs
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCampaign({ target_audience: 'all', status: 'draft' });
            setShowEditor(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle campagne
        </button>
      </div>

      {/* Editor Modal */}
      {showEditor && editingCampaign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-heading text-gray-900">
                {editingCampaign.id ? 'Modifier la campagne' : 'Nouvelle campagne'}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre interne *
                </label>
                <input
                  type="text"
                  value={editingCampaign.title || ''}
                  onChange={(e) => setEditingCampaign({ ...editingCampaign, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  placeholder="Ex: Newsletter Janvier 2024"
                />
              </div>

              {/* Subject FR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Objet de l&apos;email (FR) *
                </label>
                <input
                  type="text"
                  value={editingCampaign.subject_fr || ''}
                  onChange={(e) => setEditingCampaign({ ...editingCampaign, subject_fr: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  placeholder="Ex: Découvrez nos nouveaux circuits !"
                />
              </div>

              {/* Subject EN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Objet de l&apos;email (EN) <span className="text-gray-400 font-normal">optionnel</span>
                </label>
                <input
                  type="text"
                  value={editingCampaign.subject_en || ''}
                  onChange={(e) => setEditingCampaign({ ...editingCampaign, subject_en: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  placeholder="Ex: Discover our new circuits!"
                />
              </div>

              {/* Content FR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenu (FR) *
                </label>
                <textarea
                  value={editingCampaign.content_fr || ''}
                  onChange={(e) => setEditingCampaign({ ...editingCampaign, content_fr: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  placeholder="Rédigez le contenu de votre newsletter..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Utilisez des sauts de ligne pour séparer les paragraphes
                </p>
              </div>

              {/* Content EN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenu (EN) <span className="text-gray-400 font-normal">optionnel</span>
                </label>
                <textarea
                  value={editingCampaign.content_en || ''}
                  onChange={(e) => setEditingCampaign({ ...editingCampaign, content_en: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  placeholder="Write the English content of your newsletter..."
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Audience cible
                </label>
                <select
                  value={editingCampaign.target_audience || 'all'}
                  onChange={(e) => setEditingCampaign({ ...editingCampaign, target_audience: e.target.value as Campaign['target_audience'] })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 bg-white"
                >
                  <option value="all">Tous les utilisateurs</option>
                  <option value="agencies">Agences uniquement</option>
                  <option value="partners">Partenaires uniquement</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditor(false);
                  setEditingCampaign(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={saveCampaign}
                disabled={isSaving}
                className="px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-gray-500">Chargement...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune campagne</h3>
            <p className="text-gray-500 mb-4">Créez votre première newsletter</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campagne
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Audience
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statistiques
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{campaign.title}</p>
                    <p className="text-sm text-gray-500">{campaign.subject_fr}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(campaign.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {audienceLabels[campaign.target_audience]}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                      statusLabels[campaign.status]?.color
                    )}>
                      {statusLabels[campaign.status]?.label}
                    </span>
                    {campaign.sent_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        Envoyé le {new Date(campaign.sent_at).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {campaign.status === 'sent' ? (
                      <div className="text-sm">
                        <p className="text-gray-600">{campaign.stats.sent} envoyés</p>
                        <p className="text-gray-400">
                          {campaign.stats.opened} ouverts ({campaign.stats.sent > 0 ? Math.round(campaign.stats.opened / campaign.stats.sent * 100) : 0}%)
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                        <>
                          <button
                            onClick={() => {
                              setEditingCampaign(campaign);
                              setShowEditor(true);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => sendCampaign(campaign.id)}
                            disabled={sendingId === campaign.id}
                            className="p-2 text-sage-600 hover:text-sage-700 hover:bg-sage-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Envoyer maintenant"
                          >
                            {sendingId === campaign.id ? (
                              <div className="w-5 h-5 border-2 border-sage-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => deleteCampaign(campaign.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Help text */}
      <div className="mt-6 bg-deep-blue-50 border border-deep-blue-100 rounded-xl p-4">
        <h3 className="font-medium text-deep-blue-900 mb-2">Configuration requise</h3>
        <p className="text-sm text-deep-blue-700">
          Pour envoyer des emails, assurez-vous que la variable d&apos;environnement <code className="bg-deep-blue-100 px-1 rounded">RESEND_API_KEY</code> est configurée dans votre fichier <code className="bg-deep-blue-100 px-1 rounded">.env.local</code>.
          Créez un compte sur <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-terracotta-600 hover:underline">resend.com</a> pour obtenir une clé API.
        </p>
      </div>
    </div>
  );
}
