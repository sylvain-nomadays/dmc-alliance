'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CommissionTier {
  id?: string;
  min_participants: number;
  max_participants: number | null;
  commission_rate: number;
}

interface CommissionTemplate {
  name: string;
  tiers: Omit<CommissionTier, 'id'>[];
  createdAt?: string;
}

// Presets prédéfinis
const COMMISSION_PRESETS: Record<string, CommissionTemplate> = {
  standard: {
    name: 'Standard (10-20%)',
    tiers: [
      { min_participants: 4, max_participants: 4, commission_rate: 10 },
      { min_participants: 5, max_participants: 5, commission_rate: 12 },
      { min_participants: 6, max_participants: 6, commission_rate: 14 },
      { min_participants: 7, max_participants: 7, commission_rate: 16 },
      { min_participants: 8, max_participants: 8, commission_rate: 18 },
      { min_participants: 9, max_participants: null, commission_rate: 20 },
    ],
  },
  progressive: {
    name: 'Progressif (8-25%)',
    tiers: [
      { min_participants: 2, max_participants: 3, commission_rate: 8 },
      { min_participants: 4, max_participants: 5, commission_rate: 12 },
      { min_participants: 6, max_participants: 7, commission_rate: 18 },
      { min_participants: 8, max_participants: null, commission_rate: 25 },
    ],
  },
  aggressive: {
    name: 'Agressif (12-30%)',
    tiers: [
      { min_participants: 2, max_participants: 2, commission_rate: 12 },
      { min_participants: 3, max_participants: 4, commission_rate: 15 },
      { min_participants: 5, max_participants: 6, commission_rate: 20 },
      { min_participants: 7, max_participants: 8, commission_rate: 25 },
      { min_participants: 9, max_participants: null, commission_rate: 30 },
    ],
  },
  flat15: {
    name: 'Fixe 15%',
    tiers: [
      { min_participants: 1, max_participants: null, commission_rate: 15 },
    ],
  },
};

const TEMPLATES_STORAGE_KEY = 'dmc_commission_templates';

interface CommissionTiersEditorProps {
  circuitId: string;
  baseCommissionRate: number;
  useTieredCommission: boolean;
  onBaseRateChange: (rate: number) => void;
  onUseTieredChange: (use: boolean) => void;
}

export function CommissionTiersEditor({
  circuitId,
  baseCommissionRate,
  useTieredCommission,
  onBaseRateChange,
  onUseTieredChange,
}: CommissionTiersEditorProps) {
  const [tiers, setTiers] = useState<CommissionTier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPax, setCurrentPax] = useState(0);
  const [savedTemplates, setSavedTemplates] = useState<Record<string, CommissionTemplate>>({});
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load saved templates from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (stored) {
        setSavedTemplates(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading templates:', e);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTemplateDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Default tiers based on user's example
  const defaultTiers: CommissionTier[] = COMMISSION_PRESETS.standard.tiers;

  // Save template to localStorage
  function saveAsTemplate() {
    if (!newTemplateName.trim()) {
      alert('Veuillez entrer un nom pour le template');
      return;
    }

    const templateKey = `custom_${Date.now()}`;
    const newTemplate: CommissionTemplate = {
      name: newTemplateName.trim(),
      tiers: tiers.map(({ min_participants, max_participants, commission_rate }) => ({
        min_participants,
        max_participants,
        commission_rate,
      })),
      createdAt: new Date().toISOString(),
    };

    const updatedTemplates = { ...savedTemplates, [templateKey]: newTemplate };
    setSavedTemplates(updatedTemplates);

    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updatedTemplates));
      setShowSaveModal(false);
      setNewTemplateName('');
      alert('Template sauvegardé !');
    } catch (e) {
      console.error('Error saving template:', e);
      alert('Erreur lors de la sauvegarde');
    }
  }

  // Load a template (preset or custom)
  function loadTemplate(key: string) {
    const template = key.startsWith('custom_')
      ? savedTemplates[key]
      : COMMISSION_PRESETS[key];

    if (template) {
      setTiers(template.tiers.map(t => ({ ...t })));
      onUseTieredChange(true);
    }
    setShowTemplateDropdown(false);
  }

  // Delete a custom template
  function deleteTemplate(key: string) {
    if (!confirm('Supprimer ce template ?')) return;

    const { [key]: removed, ...rest } = savedTemplates;
    setSavedTemplates(rest);

    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(rest));
    } catch (e) {
      console.error('Error deleting template:', e);
    }
  }

  useEffect(() => {
    if (circuitId && circuitId !== 'new') {
      fetchTiers();
      fetchCurrentPax();
    }
  }, [circuitId]);

  async function fetchTiers() {
    if (!circuitId || circuitId === 'new') return;

    setIsLoading(true);
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('commission_tiers')
      .select('*')
      .eq('circuit_id', circuitId)
      .order('min_participants', { ascending: true });

    if (!error && data) {
      setTiers(data);
    }
    setIsLoading(false);
  }

  async function fetchCurrentPax() {
    if (!circuitId || circuitId === 'new') return;

    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('bookings')
      .select('places_booked')
      .eq('circuit_id', circuitId)
      .eq('status', 'confirmed');

    if (data && Array.isArray(data)) {
      const total = data.reduce((sum: number, b: { places_booked?: number }) => sum + (b.places_booked || 0), 0);
      setCurrentPax(total);
    }
  }

  function addTier() {
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier ? (lastTier.max_participants || lastTier.min_participants) + 1 : 4;

    setTiers([
      ...tiers,
      {
        min_participants: newMin,
        max_participants: newMin,
        commission_rate: lastTier ? lastTier.commission_rate + 2 : 10,
      },
    ]);
  }

  function updateTier(index: number, updates: Partial<CommissionTier>) {
    setTiers(
      tiers.map((tier, i) =>
        i === index
          ? { ...tier, ...updates }
          : tier
      )
    );
  }

  function removeTier(index: number) {
    setTiers(tiers.filter((_, i) => i !== index));
  }

  function applyDefaultTiers() {
    setTiers(defaultTiers);
    onUseTieredChange(true);
  }

  async function saveTiers() {
    if (!circuitId || circuitId === 'new') {
      alert('Veuillez d\'abord sauvegarder le circuit avant de configurer les paliers de commission.');
      return;
    }

    setIsSaving(true);
    const supabase = createClient();

    try {
      // Delete existing tiers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('commission_tiers')
        .delete()
        .eq('circuit_id', circuitId);

      // Insert new tiers
      if (tiers.length > 0) {
        const tiersToInsert = tiers.map((tier) => ({
          circuit_id: circuitId,
          min_participants: tier.min_participants,
          max_participants: tier.max_participants,
          commission_rate: tier.commission_rate,
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('commission_tiers')
          .insert(tiersToInsert);

        if (error) throw error;
      }

      // Update circuit flags
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('circuits')
        .update({
          use_tiered_commission: useTieredCommission,
          base_commission_rate: baseCommissionRate,
        })
        .eq('id', circuitId);

      alert('Paliers de commission enregistrés !');
    } catch (error) {
      console.error('Error saving tiers:', error);
      alert('Erreur lors de la sauvegarde');
    }

    setIsSaving(false);
  }

  // Calculate current commission based on pax
  function getCurrentCommission(): number {
    if (!useTieredCommission || tiers.length === 0) {
      return baseCommissionRate;
    }

    for (const tier of tiers) {
      if (
        currentPax >= tier.min_participants &&
        (tier.max_participants === null || currentPax <= tier.max_participants)
      ) {
        return tier.commission_rate;
      }
    }

    return baseCommissionRate;
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Chargement des paliers...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toggle tiered commission */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-900">Commission évolutive</h4>
          <p className="text-sm text-gray-500">
            La commission augmente avec le nombre de participants
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={useTieredCommission}
            onChange={(e) => onUseTieredChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-terracotta-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-terracotta-500"></div>
        </label>
      </div>

      {/* Base commission (always visible) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Commission de base (%)
        </label>
        <input
          type="number"
          value={baseCommissionRate}
          onChange={(e) => onBaseRateChange(parseFloat(e.target.value) || 10)}
          min="0"
          max="100"
          step="0.5"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          {useTieredCommission
            ? 'Appliquée si aucun palier ne correspond'
            : 'Taux fixe appliqué à toutes les réservations'}
        </p>
      </div>

      {/* Tiered commission section */}
      {useTieredCommission && (
        <>
          {/* Current status */}
          {circuitId && circuitId !== 'new' && (
            <div className="p-4 bg-terracotta-50 rounded-lg border border-terracotta-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-terracotta-700">
                    <strong>{currentPax}</strong> participant{currentPax > 1 ? 's' : ''} confirmé{currentPax > 1 ? 's' : ''}
                  </p>
                  <p className="text-lg font-bold text-terracotta-800">
                    Commission actuelle : {getCurrentCommission()}%
                  </p>
                </div>
                <div className="text-right">
                  {tiers.find(
                    (t) =>
                      t.min_participants > currentPax
                  ) && (
                    <p className="text-sm text-terracotta-600">
                      Prochain palier à{' '}
                      <strong>
                        {tiers.find((t) => t.min_participants > currentPax)?.min_participants}
                      </strong>{' '}
                      pax :{' '}
                      <strong>
                        {tiers.find((t) => t.min_participants > currentPax)?.commission_rate}%
                      </strong>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tiers list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Paliers de commission
              </label>
              <div className="flex items-center gap-2">
                {/* Template dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Templates
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showTemplateDropdown && (
                    <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      {/* Presets */}
                      <div className="p-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500 font-medium px-2 py-1">PRESETS</p>
                        {Object.entries(COMMISSION_PRESETS).map(([key, template]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => loadTemplate(key)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-terracotta-50 rounded"
                          >
                            {template.name}
                          </button>
                        ))}
                      </div>

                      {/* Custom templates */}
                      {Object.keys(savedTemplates).length > 0 && (
                        <div className="p-2 border-b border-gray-100">
                          <p className="text-xs text-gray-500 font-medium px-2 py-1">MES TEMPLATES</p>
                          {Object.entries(savedTemplates).map(([key, template]) => (
                            <div key={key} className="flex items-center justify-between hover:bg-terracotta-50 rounded">
                              <button
                                type="button"
                                onClick={() => loadTemplate(key)}
                                className="flex-1 text-left px-3 py-2 text-sm"
                              >
                                {template.name}
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteTemplate(key)}
                                className="p-2 text-gray-400 hover:text-red-500"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Save current as template */}
                      {tiers.length > 0 && (
                        <div className="p-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowTemplateDropdown(false);
                              setShowSaveModal(true);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-terracotta-600 hover:bg-terracotta-50 rounded"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Sauvegarder comme template
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Save template modal */}
            {showSaveModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Sauvegarder le template</h3>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Nom du template (ex: Template Mongolie)"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 mb-4"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSaveModal(false);
                        setNewTemplateName('');
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={saveAsTemplate}
                      className="flex-1 px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600"
                    >
                      Sauvegarder
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {tiers.map((tier, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Min. pax
                      </label>
                      <input
                        type="number"
                        value={tier.min_participants}
                        onChange={(e) =>
                          updateTier(index, {
                            min_participants: parseInt(e.target.value) || 1,
                          })
                        }
                        min="1"
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Max. pax
                      </label>
                      <input
                        type="number"
                        value={tier.max_participants || ''}
                        onChange={(e) =>
                          updateTier(index, {
                            max_participants: e.target.value
                              ? parseInt(e.target.value)
                              : null,
                          })
                        }
                        min="1"
                        placeholder="∞"
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Commission %
                      </label>
                      <input
                        type="number"
                        value={tier.commission_rate}
                        onChange={(e) =>
                          updateTier(index, {
                            commission_rate: parseFloat(e.target.value) || 0,
                          })
                        }
                        min="0"
                        max="100"
                        step="0.5"
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTier(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}

              {tiers.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-gray-500 text-sm mb-2">
                    Aucun palier défini
                  </p>
                  <button
                    type="button"
                    onClick={applyDefaultTiers}
                    className="text-terracotta-500 hover:text-terracotta-600 text-sm font-medium"
                  >
                    Utiliser les paliers par défaut
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={addTier}
                className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-terracotta-300 hover:text-terracotta-500 transition-colors text-sm"
              >
                + Ajouter un palier
              </button>
            </div>
          </div>

          {/* Preview table */}
          {tiers.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                Aperçu des commissions
              </h5>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-600">Participants</th>
                      <th className="px-3 py-2 text-right text-gray-600">Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tiers.map((tier, index) => (
                      <tr
                        key={index}
                        className={
                          currentPax >= tier.min_participants &&
                          (tier.max_participants === null ||
                            currentPax <= tier.max_participants)
                            ? 'bg-terracotta-50'
                            : ''
                        }
                      >
                        <td className="px-3 py-2">
                          {tier.max_participants === null
                            ? `${tier.min_participants}+`
                            : tier.min_participants === tier.max_participants
                            ? tier.min_participants
                            : `${tier.min_participants} - ${tier.max_participants}`}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {tier.commission_rate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Save button */}
          {circuitId && circuitId !== 'new' && (
            <div className="pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={saveTiers}
                disabled={isSaving}
                className="w-full px-4 py-2 bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer les paliers'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
