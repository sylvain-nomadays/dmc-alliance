'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Building2, User, Mail, Phone, Globe, MapPin, Camera, Save,
  Linkedin, Instagram, Facebook, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';

interface AgencyProfile {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  specialties: string[] | null;
  looking_for: string[] | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  registration_number: string | null;
  social_linkedin: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  profile_completed: boolean;
  commission_rate: number;
  is_verified: boolean;
}

const SPECIALTIES_OPTIONS = [
  { value: 'groupe', label_fr: 'Voyages de groupe', label_en: 'Group travel' },
  { value: 'luxe', label_fr: 'Voyages de luxe', label_en: 'Luxury travel' },
  { value: 'aventure', label_fr: 'Aventure', label_en: 'Adventure' },
  { value: 'culturel', label_fr: 'Culturel', label_en: 'Cultural' },
  { value: 'nature', label_fr: 'Nature & Écotourisme', label_en: 'Nature & Ecotourism' },
  { value: 'affaires', label_fr: 'Voyages d\'affaires', label_en: 'Business travel' },
  { value: 'incentive', label_fr: 'Incentive & Séminaires', label_en: 'Incentive & Seminars' },
  { value: 'croisiere', label_fr: 'Croisières', label_en: 'Cruises' },
  { value: 'bien_etre', label_fr: 'Bien-être & Spa', label_en: 'Wellness & Spa' },
  { value: 'sportif', label_fr: 'Voyages sportifs', label_en: 'Sports travel' },
];

const LOOKING_FOR_OPTIONS = [
  { value: 'gir_asie', label_fr: 'Circuits GIR en Asie', label_en: 'GIR tours in Asia' },
  { value: 'gir_afrique', label_fr: 'Circuits GIR en Afrique', label_en: 'GIR tours in Africa' },
  { value: 'gir_amerique', label_fr: 'Circuits GIR en Amérique', label_en: 'GIR tours in Americas' },
  { value: 'gir_europe', label_fr: 'Circuits GIR en Europe', label_en: 'GIR tours in Europe' },
  { value: 'gir_oceanie', label_fr: 'Circuits GIR en Océanie', label_en: 'GIR tours in Oceania' },
  { value: 'sur_mesure', label_fr: 'Voyages sur mesure', label_en: 'Custom trips' },
  { value: 'partenariats', label_fr: 'Partenariats DMC', label_en: 'DMC partnerships' },
  { value: 'formation', label_fr: 'Formations produit', label_en: 'Product training' },
];

export default function AgencySettingsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const isFr = locale === 'fr';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profile, setProfile] = useState<AgencyProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger le profil
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/agency/profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(data.agency);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Mettre à jour un champ
  const updateField = (field: keyof AgencyProfile, value: unknown) => {
    if (profile) {
      setProfile({ ...profile, [field]: value });
    }
  };

  // Toggle spécialité
  const toggleSpecialty = (value: string) => {
    const current = profile?.specialties || [];
    const updated = current.includes(value)
      ? current.filter(s => s !== value)
      : [...current, value];
    updateField('specialties', updated);
  };

  // Toggle recherche
  const toggleLookingFor = (value: string) => {
    const current = profile?.looking_for || [];
    const updated = current.includes(value)
      ? current.filter(s => s !== value)
      : [...current, value];
    updateField('looking_for', updated);
  };

  // Upload du logo
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    // Valider le fichier
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: isFr ? 'Le fichier doit être une image' : 'File must be an image' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB max
      setMessage({ type: 'error', text: isFr ? 'L\'image ne doit pas dépasser 2Mo' : 'Image must be under 2MB' });
      return;
    }

    setUploadingLogo(true);
    setMessage(null);

    try {
      const supabase = createClient();

      // Générer un nom de fichier unique
      const ext = file.name.split('.').pop();
      const fileName = `agency-${profile.id}-${Date.now()}.${ext}`;
      const filePath = `agencies/${fileName}`;

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      // Mettre à jour le profil
      updateField('logo_url', publicUrl);
      setMessage({ type: 'success', text: isFr ? 'Logo mis à jour' : 'Logo updated' });
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: isFr ? 'Erreur lors de l\'upload' : 'Upload error' });
    } finally {
      setUploadingLogo(false);
    }
  };

  // Sauvegarder le profil
  const saveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/agency/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          logo_url: profile.logo_url,
          description: profile.description,
          specialties: profile.specialties,
          looking_for: profile.looking_for,
          contact_name: profile.contact_name,
          email: profile.email,
          phone: profile.phone,
          website: profile.website,
          address: profile.address,
          city: profile.city,
          country: profile.country,
          registration_number: profile.registration_number,
          social_linkedin: profile.social_linkedin,
          social_instagram: profile.social_instagram,
          social_facebook: profile.social_facebook,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.agency);
        setMessage({ type: 'success', text: isFr ? 'Profil mis à jour avec succès' : 'Profile updated successfully' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || (isFr ? 'Erreur lors de la sauvegarde' : 'Error saving profile') });
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: isFr ? 'Erreur serveur' : 'Server error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">{isFr ? 'Profil non trouvé' : 'Profile not found'}</p>
      </div>
    );
  }

  const profileCompleteness = [
    !!profile.name,
    !!profile.description,
    !!profile.contact_name,
    !!profile.email,
    !!profile.phone,
    !!profile.logo_url,
    (profile.specialties?.length || 0) > 0,
  ].filter(Boolean).length;

  const profilePercentage = Math.round((profileCompleteness / 7) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading text-gray-900">
          {isFr ? 'Paramètres de l\'agence' : 'Agency Settings'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isFr
            ? 'Complétez votre profil pour améliorer votre visibilité'
            : 'Complete your profile to improve your visibility'}
        </p>
      </div>

      {/* Progression du profil */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">
            {isFr ? 'Complétion du profil' : 'Profile Completion'}
          </h2>
          <span className={`text-lg font-bold ${profilePercentage === 100 ? 'text-green-600' : 'text-terracotta-600'}`}>
            {profilePercentage}%
          </span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${profilePercentage === 100 ? 'bg-green-500' : 'bg-terracotta-500'}`}
            style={{ width: `${profilePercentage}%` }}
          />
        </div>
        {profilePercentage < 100 && (
          <p className="text-sm text-gray-500 mt-2">
            {isFr
              ? 'Un profil complet augmente vos chances d\'être contacté par nos partenaires DMC.'
              : 'A complete profile increases your chances of being contacted by our DMC partners.'}
          </p>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Logo et infos principales */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-terracotta-500" />
          {isFr ? 'Informations générales' : 'General Information'}
        </h2>

        <div className="grid md:grid-cols-[200px_1fr] gap-8">
          {/* Logo */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                {profile.logo_url ? (
                  <img
                    src={profile.logo_url}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="absolute -bottom-2 -right-2 p-2 bg-terracotta-500 text-white rounded-full shadow-lg hover:bg-terracotta-600 transition-colors disabled:opacity-50"
              >
                {uploadingLogo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              {isFr ? 'PNG ou JPG, max 2Mo' : 'PNG or JPG, max 2MB'}
            </p>
          </div>

          {/* Formulaire */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isFr ? 'Nom de l\'agence' : 'Agency Name'} *
              </label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isFr ? 'Description' : 'Description'}
              </label>
              <textarea
                value={profile.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                placeholder={isFr ? 'Décrivez votre agence, votre expertise, vos valeurs...' : 'Describe your agency, expertise, values...'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'N° d\'immatriculation' : 'Registration Number'}
                </label>
                <input
                  type="text"
                  value={profile.registration_number || ''}
                  onChange={(e) => updateField('registration_number', e.target.value)}
                  placeholder="IM075100XXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isFr ? 'Site web' : 'Website'}
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={profile.website || ''}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder="https://"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-terracotta-500" />
          {isFr ? 'Contact principal' : 'Main Contact'}
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isFr ? 'Nom du contact' : 'Contact Name'} *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={profile.contact_name || ''}
                onChange={(e) => updateField('contact_name', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={profile.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isFr ? 'Téléphone' : 'Phone'} *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Adresse */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-terracotta-500" />
          {isFr ? 'Adresse' : 'Address'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isFr ? 'Adresse' : 'Address'}
            </label>
            <input
              type="text"
              value={profile.address || ''}
              onChange={(e) => updateField('address', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isFr ? 'Ville' : 'City'}
              </label>
              <input
                type="text"
                value={profile.city || ''}
                onChange={(e) => updateField('city', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isFr ? 'Pays' : 'Country'}
              </label>
              <input
                type="text"
                value={profile.country || ''}
                onChange={(e) => updateField('country', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Spécialités */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          {isFr ? 'Vos spécialités' : 'Your Specialties'}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          {isFr
            ? 'Sélectionnez les domaines dans lesquels vous êtes expert'
            : 'Select the areas in which you are an expert'}
        </p>
        <div className="flex flex-wrap gap-2">
          {SPECIALTIES_OPTIONS.map((option) => {
            const isSelected = profile.specialties?.includes(option.value);
            return (
              <button
                key={option.value}
                onClick={() => toggleSpecialty(option.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-terracotta-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isFr ? option.label_fr : option.label_en}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ce que vous recherchez */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          {isFr ? 'Ce que vous recherchez' : 'What You\'re Looking For'}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          {isFr
            ? 'Aidez-nous à mieux cibler les offres qui vous intéressent'
            : 'Help us better target the offers that interest you'}
        </p>
        <div className="flex flex-wrap gap-2">
          {LOOKING_FOR_OPTIONS.map((option) => {
            const isSelected = profile.looking_for?.includes(option.value);
            return (
              <button
                key={option.value}
                onClick={() => toggleLookingFor(option.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-deep-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isFr ? option.label_fr : option.label_en}
              </button>
            );
          })}
        </div>
      </div>

      {/* Réseaux sociaux */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-6">
          {isFr ? 'Réseaux sociaux' : 'Social Networks'}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={profile.social_linkedin || ''}
                onChange={(e) => updateField('social_linkedin', e.target.value)}
                placeholder="https://linkedin.com/company/..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={profile.social_instagram || ''}
                onChange={(e) => updateField('social_instagram', e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
            <div className="relative">
              <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={profile.social_facebook || ''}
                onChange={(e) => updateField('social_facebook', e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bouton sauvegarder */}
      <div className="flex justify-end">
        <button
          onClick={saveProfile}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {isFr ? 'Enregistrer les modifications' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
