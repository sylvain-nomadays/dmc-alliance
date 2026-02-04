'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ImageUpload } from '@/components/admin/ImageUpload';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Linkedin, GripVertical, X, Save, Mail, Phone } from 'lucide-react';

// =====================================================
// INTERFACES
// =====================================================
interface AboutSettings {
  id?: string;
  hero_title_fr: string;
  hero_title_en: string;
  hero_subtitle_fr: string;
  hero_subtitle_en: string;
  hero_image_url: string | null;
  history_title_fr: string;
  history_title_en: string;
  history_content_fr: string;
  history_content_en: string;
  mission_title_fr: string;
  mission_title_en: string;
  mission_content_fr: string;
  mission_content_en: string;
  values_title_fr: string;
  values_title_en: string;
  timeline_title_fr: string;
  timeline_title_en: string;
  team_title_fr: string;
  team_title_en: string;
  team_subtitle_fr: string;
  team_subtitle_en: string;
  representatives_title_fr: string;
  representatives_title_en: string;
  representatives_subtitle_fr: string;
  representatives_subtitle_en: string;
  cta_title_fr: string;
  cta_title_en: string;
  cta_subtitle_fr: string;
  cta_subtitle_en: string;
  cta_button_fr: string;
  cta_button_en: string;
}

interface Stat {
  id: string;
  stat_key: string;
  stat_value: string;
  label_fr: string;
  label_en: string;
  display_order: number;
  is_active: boolean;
}

interface Value {
  id: string;
  value_key: string;
  title_fr: string;
  title_en: string;
  description_fr: string;
  description_en: string;
  icon_name: string;
  icon_color: string;
  display_order: number;
  is_active: boolean;
}

interface Milestone {
  id: string;
  year: string;
  title_fr: string;
  title_en: string;
  description_fr: string;
  description_en: string;
  display_order: number;
  is_active: boolean;
}

interface Representative {
  id: string;
  name: string;
  photo_url: string | null;
  linkedin_url: string | null;
  email: string | null;
  phone: string | null;
  bio_fr: string | null;
  bio_en: string | null;
  region: string;
  display_order: number;
  is_active: boolean;
}

// =====================================================
// DEFAULT VALUES
// =====================================================
const defaultSettings: AboutSettings = {
  hero_title_fr: 'Qui sommes-nous',
  hero_title_en: 'About us',
  hero_subtitle_fr: '',
  hero_subtitle_en: '',
  hero_image_url: null,
  history_title_fr: 'Notre histoire',
  history_title_en: 'Our story',
  history_content_fr: '',
  history_content_en: '',
  mission_title_fr: 'Notre mission',
  mission_title_en: 'Our mission',
  mission_content_fr: '',
  mission_content_en: '',
  values_title_fr: 'Nos valeurs',
  values_title_en: 'Our values',
  timeline_title_fr: 'Notre parcours',
  timeline_title_en: 'Our journey',
  team_title_fr: 'Notre réseau de partenaires',
  team_title_en: 'Our partner network',
  team_subtitle_fr: '',
  team_subtitle_en: '',
  representatives_title_fr: 'Nos représentants commerciaux en Europe',
  representatives_title_en: 'Our commercial representatives in Europe',
  representatives_subtitle_fr: '',
  representatives_subtitle_en: '',
  cta_title_fr: 'Rejoignez notre aventure',
  cta_title_en: 'Join our adventure',
  cta_subtitle_fr: '',
  cta_subtitle_en: '',
  cta_button_fr: 'Devenir partenaire',
  cta_button_en: 'Become a partner',
};

const defaultRepresentative: Omit<Representative, 'id'> = {
  name: '',
  photo_url: null,
  linkedin_url: null,
  email: null,
  phone: null,
  bio_fr: null,
  bio_en: null,
  region: 'Europe',
  display_order: 0,
  is_active: true,
};

// =====================================================
// TABS DEFINITION
// =====================================================
const tabs = [
  { id: 'general', label: 'Général', icon: '📝' },
  { id: 'stats', label: 'Statistiques', icon: '📊' },
  { id: 'values', label: 'Valeurs', icon: '💎' },
  { id: 'timeline', label: 'Timeline', icon: '📅' },
  { id: 'representatives', label: 'Représentants', icon: '👥' },
];

// =====================================================
// MAIN COMPONENT
// =====================================================
export default function AboutAdminPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Data states
  const [settings, setSettings] = useState<AboutSettings>(defaultSettings);
  const [stats, setStats] = useState<Stat[]>([]);
  const [values, setValues] = useState<Value[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [representatives, setRepresentatives] = useState<Representative[]>([]);

  // Modal states
  const [showStatModal, setShowStatModal] = useState(false);
  const [editingStat, setEditingStat] = useState<Stat | null>(null);
  const [showValueModal, setShowValueModal] = useState(false);
  const [editingValue, setEditingValue] = useState<Value | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [showRepModal, setShowRepModal] = useState(false);
  const [editingRep, setEditingRep] = useState<Representative | null>(null);

  const supabase = createClient();

  // =====================================================
  // LOAD DATA
  // =====================================================
  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // Load settings
      const { data: settingsData } = await supabase
        .from('about_page_settings')
        .select('*')
        .eq('section', 'global')
        .single();
      if (settingsData) setSettings({ ...defaultSettings, ...settingsData });

      // Load stats
      const { data: statsData } = await supabase
        .from('about_page_stats')
        .select('*')
        .order('display_order');
      if (statsData) setStats(statsData);

      // Load values
      const { data: valuesData } = await supabase
        .from('about_page_values')
        .select('*')
        .order('display_order');
      if (valuesData) setValues(valuesData);

      // Load milestones
      const { data: milestonesData } = await supabase
        .from('about_page_milestones')
        .select('*')
        .order('display_order');
      if (milestonesData) setMilestones(milestonesData);

      // Load representatives
      const { data: repsData } = await supabase
        .from('commercial_representatives')
        .select('*')
        .order('display_order');
      if (repsData) setRepresentatives(repsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // SAVE SETTINGS
  // =====================================================
  const saveSettings = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      // First check if settings row exists
      const { data: existingData, error: selectError } = await supabase
        .from('about_page_settings')
        .select('id')
        .eq('section', 'global')
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        // PGRST116 is "no rows found" - that's OK, we'll insert
        throw selectError;
      }

      let error;
      // Prepare settings data without id for update/insert
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...settingsWithoutId } = settings;

      if (existingData?.id) {
        // Update existing row
        const result = await supabase
          .from('about_page_settings')
          .update({ ...settingsWithoutId, updated_at: new Date().toISOString() })
          .eq('id', existingData.id);
        error = result.error;
      } else {
        // Insert new row
        const result = await supabase
          .from('about_page_settings')
          .insert([{ ...settingsWithoutId, section: 'global' }]);
        error = result.error;
      }

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès !' });
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      console.error('Error saving settings:', err);
      setMessage({
        type: 'error',
        text: `Erreur lors de l'enregistrement: ${err.message || 'Erreur inconnue'}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  // =====================================================
  // STAT CRUD
  // =====================================================
  const saveStat = async (stat: Partial<Stat>) => {
    try {
      if (editingStat) {
        await supabase.from('about_page_stats').update(stat).eq('id', editingStat.id);
      } else {
        await supabase.from('about_page_stats').insert([{ ...stat, display_order: stats.length }]);
      }
      await loadAllData();
      setShowStatModal(false);
      setEditingStat(null);
      setMessage({ type: 'success', text: 'Statistique enregistrée !' });
    } catch (error) {
      console.error('Error saving stat:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    }
  };

  const deleteStat = async (id: string) => {
    if (!confirm('Supprimer cette statistique ?')) return;
    await supabase.from('about_page_stats').delete().eq('id', id);
    await loadAllData();
  };

  // =====================================================
  // VALUE CRUD
  // =====================================================
  const saveValue = async (value: Partial<Value>) => {
    try {
      if (editingValue) {
        await supabase.from('about_page_values').update(value).eq('id', editingValue.id);
      } else {
        await supabase.from('about_page_values').insert([{ ...value, display_order: values.length }]);
      }
      await loadAllData();
      setShowValueModal(false);
      setEditingValue(null);
      setMessage({ type: 'success', text: 'Valeur enregistrée !' });
    } catch (error) {
      console.error('Error saving value:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    }
  };

  const deleteValue = async (id: string) => {
    if (!confirm('Supprimer cette valeur ?')) return;
    await supabase.from('about_page_values').delete().eq('id', id);
    await loadAllData();
  };

  // =====================================================
  // MILESTONE CRUD
  // =====================================================
  const saveMilestone = async (milestone: Partial<Milestone>) => {
    try {
      if (editingMilestone) {
        await supabase.from('about_page_milestones').update(milestone).eq('id', editingMilestone.id);
      } else {
        await supabase.from('about_page_milestones').insert([{ ...milestone, display_order: milestones.length }]);
      }
      await loadAllData();
      setShowMilestoneModal(false);
      setEditingMilestone(null);
      setMessage({ type: 'success', text: 'Jalon enregistré !' });
    } catch (error) {
      console.error('Error saving milestone:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    }
  };

  const deleteMilestone = async (id: string) => {
    if (!confirm('Supprimer ce jalon ?')) return;
    await supabase.from('about_page_milestones').delete().eq('id', id);
    await loadAllData();
  };

  // =====================================================
  // REPRESENTATIVE CRUD
  // =====================================================
  const saveRepresentative = async (rep: Partial<Representative>) => {
    try {
      if (editingRep) {
        await supabase.from('commercial_representatives').update(rep).eq('id', editingRep.id);
      } else {
        await supabase.from('commercial_representatives').insert([{ ...rep, display_order: representatives.length }]);
      }
      await loadAllData();
      setShowRepModal(false);
      setEditingRep(null);
      setMessage({ type: 'success', text: 'Représentant enregistré !' });
    } catch (error) {
      console.error('Error saving representative:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    }
  };

  const deleteRepresentative = async (id: string) => {
    if (!confirm('Supprimer ce représentant ?')) return;
    await supabase.from('commercial_representatives').delete().eq('id', id);
    await loadAllData();
  };

  const toggleRepActive = async (rep: Representative) => {
    await supabase.from('commercial_representatives').update({ is_active: !rep.is_active }).eq('id', rep.id);
    await loadAllData();
  };

  // =====================================================
  // RENDER
  // =====================================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-terracotta-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading text-gray-900">Qui sommes-nous</h1>
          <p className="text-gray-600 mt-1">Gérez tous les contenus de la page About</p>
        </div>
        {activeTab === 'general' && (
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-terracotta-500 text-terracotta-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Section Hero</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre (FR)</label>
                  <input
                    type="text"
                    value={settings.hero_title_fr}
                    onChange={(e) => setSettings({ ...settings, hero_title_fr: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre (EN)</label>
                  <input
                    type="text"
                    value={settings.hero_title_en}
                    onChange={(e) => setSettings({ ...settings, hero_title_en: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sous-titre (FR)</label>
                  <textarea
                    value={settings.hero_subtitle_fr}
                    onChange={(e) => setSettings({ ...settings, hero_subtitle_fr: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sous-titre (EN)</label>
                  <textarea
                    value={settings.hero_subtitle_en}
                    onChange={(e) => setSettings({ ...settings, hero_subtitle_en: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
              </div>
            </div>

            {/* History Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Notre Histoire</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre (FR)</label>
                  <input
                    type="text"
                    value={settings.history_title_fr}
                    onChange={(e) => setSettings({ ...settings, history_title_fr: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre (EN)</label>
                  <input
                    type="text"
                    value={settings.history_title_en}
                    onChange={(e) => setSettings({ ...settings, history_title_en: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contenu (FR)</label>
                  <textarea
                    value={settings.history_content_fr}
                    onChange={(e) => setSettings({ ...settings, history_content_fr: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contenu (EN)</label>
                  <textarea
                    value={settings.history_content_en}
                    onChange={(e) => setSettings({ ...settings, history_content_en: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
              </div>
            </div>

            {/* Mission Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Notre Mission</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre (FR)</label>
                  <input
                    type="text"
                    value={settings.mission_title_fr}
                    onChange={(e) => setSettings({ ...settings, mission_title_fr: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre (EN)</label>
                  <input
                    type="text"
                    value={settings.mission_title_en}
                    onChange={(e) => setSettings({ ...settings, mission_title_en: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contenu (FR)</label>
                  <textarea
                    value={settings.mission_content_fr}
                    onChange={(e) => setSettings({ ...settings, mission_content_fr: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contenu (EN)</label>
                  <textarea
                    value={settings.mission_content_en}
                    onChange={(e) => setSettings({ ...settings, mission_content_en: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Section CTA</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre (FR)</label>
                  <input
                    type="text"
                    value={settings.cta_title_fr}
                    onChange={(e) => setSettings({ ...settings, cta_title_fr: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre (EN)</label>
                  <input
                    type="text"
                    value={settings.cta_title_en}
                    onChange={(e) => setSettings({ ...settings, cta_title_en: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sous-titre (FR)</label>
                  <textarea
                    value={settings.cta_subtitle_fr}
                    onChange={(e) => setSettings({ ...settings, cta_subtitle_fr: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sous-titre (EN)</label>
                  <textarea
                    value={settings.cta_subtitle_en}
                    onChange={(e) => setSettings({ ...settings, cta_subtitle_en: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bouton (FR)</label>
                  <input
                    type="text"
                    value={settings.cta_button_fr}
                    onChange={(e) => setSettings({ ...settings, cta_button_fr: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bouton (EN)</label>
                  <input
                    type="text"
                    value={settings.cta_button_en}
                    onChange={(e) => setSettings({ ...settings, cta_button_en: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Statistiques</h3>
              <button
                onClick={() => { setEditingStat(null); setShowStatModal(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-lg font-medium"
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>
            <div className="space-y-3">
              {stats.map((stat) => (
                <div key={stat.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-terracotta-500">{stat.stat_value}</div>
                    <div className="text-sm text-gray-600">{stat.label_fr}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingStat(stat); setShowStatModal(true); }} className="p-2 hover:bg-gray-200 rounded-lg">
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => deleteStat(stat.id)} className="p-2 hover:bg-red-100 rounded-lg">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VALUES TAB */}
        {activeTab === 'values' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Nos Valeurs</h3>
              <button
                onClick={() => { setEditingValue(null); setShowValueModal(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-lg font-medium"
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {values.map((value) => (
                <div key={value.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{value.title_fr}</h4>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingValue(value); setShowValueModal(true); }} className="p-1 hover:bg-gray-200 rounded">
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </button>
                      <button onClick={() => deleteValue(value.id)} className="p-1 hover:bg-red-100 rounded">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{value.description_fr}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Timeline / Jalons</h3>
              <button
                onClick={() => { setEditingMilestone(null); setShowMilestoneModal(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-lg font-medium"
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>
            <div className="space-y-3">
              {milestones.map((m) => (
                <div key={m.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-terracotta-500 w-16">{m.year}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{m.title_fr}</div>
                    <div className="text-sm text-gray-600">{m.description_fr}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingMilestone(m); setShowMilestoneModal(true); }} className="p-2 hover:bg-gray-200 rounded-lg">
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => deleteMilestone(m.id)} className="p-2 hover:bg-red-100 rounded-lg">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPRESENTATIVES TAB */}
        {activeTab === 'representatives' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Représentants commerciaux</h3>
              <button
                onClick={() => { setEditingRep(null); setShowRepModal(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-lg font-medium"
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>
            {representatives.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Aucun représentant. Cliquez sur &quot;Ajouter&quot; pour en créer un.
              </div>
            ) : (
              <div className="space-y-3">
                {representatives.map((rep) => (
                  <div key={rep.id} className={`flex items-center gap-4 p-4 bg-gray-50 rounded-lg ${!rep.is_active ? 'opacity-50' : ''}`}>
                    <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                    {rep.photo_url ? (
                      <Image src={rep.photo_url} alt={rep.name} width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-lg text-gray-600">
                        {rep.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{rep.name}</span>
                        {rep.linkedin_url && <Linkedin className="w-4 h-4 text-blue-600" />}
                        {rep.email && <Mail className="w-4 h-4 text-gray-400" />}
                        {rep.phone && <Phone className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div className="text-sm text-gray-500">{rep.region}</div>
                    </div>
                    <button
                      onClick={() => toggleRepActive(rep)}
                      className={`px-3 py-1 text-xs rounded-full ${rep.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
                    >
                      {rep.is_active ? 'Actif' : 'Inactif'}
                    </button>
                    <button onClick={() => { setEditingRep(rep); setShowRepModal(true); }} className="p-2 hover:bg-gray-200 rounded-lg">
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => deleteRepresentative(rep.id)} className="p-2 hover:bg-red-100 rounded-lg">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      {/* Stat Modal */}
      {showStatModal && (
        <StatModal
          stat={editingStat}
          onSave={saveStat}
          onClose={() => { setShowStatModal(false); setEditingStat(null); }}
        />
      )}

      {/* Value Modal */}
      {showValueModal && (
        <ValueModal
          value={editingValue}
          onSave={saveValue}
          onClose={() => { setShowValueModal(false); setEditingValue(null); }}
        />
      )}

      {/* Milestone Modal */}
      {showMilestoneModal && (
        <MilestoneModal
          milestone={editingMilestone}
          onSave={saveMilestone}
          onClose={() => { setShowMilestoneModal(false); setEditingMilestone(null); }}
        />
      )}

      {/* Representative Modal */}
      {showRepModal && (
        <RepresentativeModal
          rep={editingRep}
          onSave={saveRepresentative}
          onClose={() => { setShowRepModal(false); setEditingRep(null); }}
        />
      )}
    </div>
  );
}

// =====================================================
// MODAL COMPONENTS
// =====================================================

function StatModal({ stat, onSave, onClose }: { stat: Stat | null; onSave: (s: Partial<Stat>) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    stat_key: stat?.stat_key || '',
    stat_value: stat?.stat_value || '',
    label_fr: stat?.label_fr || '',
    label_en: stat?.label_en || '',
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-heading">{stat ? 'Modifier' : 'Ajouter'} une statistique</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clé (unique)</label>
            <input type="text" value={form.stat_key} onChange={(e) => setForm({ ...form, stat_key: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="destinations" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valeur</label>
            <input type="text" value={form.stat_value} onChange={(e) => setForm({ ...form, stat_value: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="30+" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label (FR)</label>
              <input type="text" value={form.label_fr} onChange={(e) => setForm({ ...form, label_fr: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label (EN)</label>
              <input type="text" value={form.label_en} onChange={(e) => setForm({ ...form, label_en: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">Annuler</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

function ValueModal({ value, onSave, onClose }: { value: Value | null; onSave: (v: Partial<Value>) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    value_key: value?.value_key || '',
    title_fr: value?.title_fr || '',
    title_en: value?.title_en || '',
    description_fr: value?.description_fr || '',
    description_en: value?.description_en || '',
    icon_color: value?.icon_color || 'terracotta',
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-heading">{value ? 'Modifier' : 'Ajouter'} une valeur</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clé (unique)</label>
            <input type="text" value={form.value_key} onChange={(e) => setForm({ ...form, value_key: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="expertise" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre (FR)</label>
              <input type="text" value={form.title_fr} onChange={(e) => setForm({ ...form, title_fr: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre (EN)</label>
              <input type="text" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (FR)</label>
            <textarea value={form.description_fr} onChange={(e) => setForm({ ...form, description_fr: e.target.value })} rows={3} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (EN)</label>
            <textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} rows={3} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
            <select value={form.icon_color} onChange={(e) => setForm({ ...form, icon_color: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
              <option value="terracotta">Terracotta</option>
              <option value="deep-blue">Bleu</option>
              <option value="sage">Vert</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">Annuler</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

function MilestoneModal({ milestone, onSave, onClose }: { milestone: Milestone | null; onSave: (m: Partial<Milestone>) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    year: milestone?.year || '',
    title_fr: milestone?.title_fr || '',
    title_en: milestone?.title_en || '',
    description_fr: milestone?.description_fr || '',
    description_en: milestone?.description_en || '',
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-heading">{milestone ? 'Modifier' : 'Ajouter'} un jalon</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
            <input type="text" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="2024" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre (FR)</label>
              <input type="text" value={form.title_fr} onChange={(e) => setForm({ ...form, title_fr: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre (EN)</label>
              <input type="text" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (FR)</label>
            <textarea value={form.description_fr} onChange={(e) => setForm({ ...form, description_fr: e.target.value })} rows={3} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (EN)</label>
            <textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} rows={3} className="w-full px-4 py-2 border rounded-lg" />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">Annuler</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

function RepresentativeModal({ rep, onSave, onClose }: { rep: Representative | null; onSave: (r: Partial<Representative>) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: rep?.name || '',
    photo_url: rep?.photo_url || null,
    email: rep?.email || null,
    phone: rep?.phone || null,
    linkedin_url: rep?.linkedin_url || null,
    region: rep?.region || 'Europe',
    bio_fr: rep?.bio_fr || null,
    bio_en: rep?.bio_en || null,
    is_active: rep?.is_active ?? true,
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-heading">{rep ? 'Modifier' : 'Ajouter'} un représentant</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
            <ImageUpload
              value={form.photo_url || undefined}
              onChange={(url) => setForm({ ...form, photo_url: url })}
              folder="representatives"
              aspect="square"
              className="w-32"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Jean Dupont" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value || null })} className="w-full px-4 py-2 border rounded-lg" placeholder="jean@dmc-alliance.org" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input type="tel" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value || null })} className="w-full px-4 py-2 border rounded-lg" placeholder="+33 6 12 34 56 78" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
              <input type="url" value={form.linkedin_url || ''} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value || null })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Région</label>
              <input type="text" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Europe" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio (FR)</label>
            <textarea value={form.bio_fr || ''} onChange={(e) => setForm({ ...form, bio_fr: e.target.value || null })} rows={3} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio (EN)</label>
            <textarea value={form.bio_en || ''} onChange={(e) => setForm({ ...form, bio_en: e.target.value || null })} rows={3} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 text-terracotta-500 rounded" />
            <label htmlFor="is_active" className="text-sm text-gray-700">Actif (visible sur le site)</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">Annuler</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
