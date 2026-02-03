'use client';

import { useState, Suspense, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Building2, Globe, Users, ChevronLeft, Check, AlertCircle, UserPlus } from 'lucide-react';

// Types pour le formulaire
type AccountType = 'agency' | 'dmc' | null;

interface ExistingAgency {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
}

interface AgencyFormData {
  email: string;
  password: string;
  confirmPassword: string;
  agencyName: string;
  registrationNumber: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  contactName: string;
}

interface DMCFormData {
  email: string;
  password: string;
  confirmPassword: string;
  partnerName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  description: string;
  destinations: string[];
  specialties: string[];
  hasGir: boolean;
}

// Liste des destinations disponibles
const AVAILABLE_DESTINATIONS = [
  { value: 'vietnam', label: 'Vietnam' },
  { value: 'cambodge', label: 'Cambodge' },
  { value: 'laos', label: 'Laos' },
  { value: 'thailande', label: 'Thaïlande' },
  { value: 'myanmar', label: 'Myanmar' },
  { value: 'indonesie', label: 'Indonésie' },
  { value: 'malaisie', label: 'Malaisie' },
  { value: 'philippines', label: 'Philippines' },
  { value: 'japon', label: 'Japon' },
  { value: 'coree', label: 'Corée du Sud' },
  { value: 'chine', label: 'Chine' },
  { value: 'inde', label: 'Inde' },
  { value: 'nepal', label: 'Népal' },
  { value: 'sri-lanka', label: 'Sri Lanka' },
  { value: 'maldives', label: 'Maldives' },
  { value: 'maroc', label: 'Maroc' },
  { value: 'tunisie', label: 'Tunisie' },
  { value: 'egypte', label: 'Égypte' },
  { value: 'afrique-sud', label: 'Afrique du Sud' },
  { value: 'kenya', label: 'Kenya' },
  { value: 'tanzanie', label: 'Tanzanie' },
  { value: 'madagascar', label: 'Madagascar' },
  { value: 'maurice', label: 'Île Maurice' },
  { value: 'seychelles', label: 'Seychelles' },
  { value: 'costa-rica', label: 'Costa Rica' },
  { value: 'mexique', label: 'Mexique' },
  { value: 'perou', label: 'Pérou' },
  { value: 'bresil', label: 'Brésil' },
  { value: 'argentine', label: 'Argentine' },
  { value: 'chili', label: 'Chili' },
];

// Liste des spécialités
const AVAILABLE_SPECIALTIES = [
  { value: 'culture', label: 'Culture & Patrimoine' },
  { value: 'aventure', label: 'Aventure' },
  { value: 'nature', label: 'Nature & Écotourisme' },
  { value: 'gastronomie', label: 'Gastronomie' },
  { value: 'bien-etre', label: 'Bien-être & Spa' },
  { value: 'plage', label: 'Séjour balnéaire' },
  { value: 'trekking', label: 'Trekking & Randonnée' },
  { value: 'croisiere', label: 'Croisière' },
  { value: 'famille', label: 'Famille' },
  { value: 'luxe', label: 'Luxe' },
  { value: 'groupe', label: 'Groupes' },
  { value: 'mice', label: 'MICE / Incentive' },
];

function RegisterForm() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'fr';
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pendingJoin, setPendingJoin] = useState(false);

  // Pour la détection d'agence existante
  const [existingAgency, setExistingAgency] = useState<ExistingAgency | null>(null);
  const [checkingAgency, setCheckingAgency] = useState(false);
  const [joinMode, setJoinMode] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');

  // Formulaire Agence
  const [agencyForm, setAgencyForm] = useState<AgencyFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    agencyName: '',
    registrationNumber: '',
    address: '',
    city: '',
    country: 'France',
    phone: '',
    contactName: '',
  });

  // Formulaire DMC
  const [dmcForm, setDmcForm] = useState<DMCFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    partnerName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    description: '',
    destinations: [],
    specialties: [],
    hasGir: false,
  });

  const handleAccountTypeSelect = (type: AccountType) => {
    setAccountType(type);
    setStep(2);
    setExistingAgency(null);
    setJoinMode(false);
  };

  // Vérifier si une agence existe avec ce nom (debounced)
  const checkExistingAgency = useCallback(async (name: string) => {
    if (!name || name.length < 3) {
      setExistingAgency(null);
      return;
    }

    setCheckingAgency(true);
    try {
      const response = await fetch(`/api/auth/register?agencyName=${encodeURIComponent(name)}`);
      const data = await response.json();

      if (data.exists && data.agency) {
        setExistingAgency(data.agency);
      } else {
        setExistingAgency(null);
      }
    } catch (err) {
      console.error('Error checking agency:', err);
    } finally {
      setCheckingAgency(false);
    }
  }, []);

  // Debounce pour la vérification du nom d'agence
  useEffect(() => {
    if (accountType === 'agency' && agencyForm.agencyName) {
      const timer = setTimeout(() => {
        checkExistingAgency(agencyForm.agencyName);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [agencyForm.agencyName, accountType, checkExistingAgency]);

  const handleAgencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (agencyForm.password !== agencyForm.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (agencyForm.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);

    try {
      // Si on est en mode "rejoindre une agence"
      if (joinMode && existingAgency) {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'agency_join',
            email: agencyForm.email,
            password: agencyForm.password,
            agencyId: existingAgency.id,
            contactName: agencyForm.contactName,
            message: joinMessage,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors de la demande');
        }

        // Afficher la page de confirmation
        setPendingJoin(true);
        return;
      }

      // Sinon, création normale d'agence
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'agency',
          ...agencyForm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      // Connexion automatique après inscription
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: agencyForm.email,
        password: agencyForm.password,
      });

      if (signInError) {
        // Rediriger vers login si la connexion auto échoue
        router.push(`/${locale}/auth/login?registered=true`);
        return;
      }

      // Rediriger vers l'espace agence
      window.location.href = `/${locale}/agency/dashboard`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleDMCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (dmcForm.password !== dmcForm.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (dmcForm.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (dmcForm.destinations.length === 0) {
      setError('Veuillez sélectionner au moins une destination');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'dmc',
          ...dmcForm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const toggleDestination = (dest: string) => {
    setDmcForm((prev) => ({
      ...prev,
      destinations: prev.destinations.includes(dest)
        ? prev.destinations.filter((d) => d !== dest)
        : [...prev.destinations, dest],
    }));
  };

  const toggleSpecialty = (spec: string) => {
    setDmcForm((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(spec)
        ? prev.specialties.filter((s) => s !== spec)
        : [...prev.specialties, spec],
    }));
  };

  // Page de succès pour demande de rejoindre une agence
  if (pendingJoin) {
    return (
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-card p-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserPlus className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-heading text-gray-900 mb-4">
            Demande envoyée !
          </h2>
          <p className="text-gray-600 mb-6">
            Votre demande pour rejoindre <strong>{existingAgency?.name}</strong> a bien été envoyée.
            Le responsable de l&apos;agence recevra une notification et pourra accepter votre demande.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Vous recevrez un email de confirmation à <strong>{agencyForm.email}</strong> une fois votre demande acceptée.
          </p>
          <Link href="/">
            <Button fullWidth>Retour à l&apos;accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Page de succès pour DMC
  if (success) {
    return (
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-card p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-heading text-gray-900 mb-4">
            Demande envoyée avec succès !
          </h2>
          <p className="text-gray-600 mb-6">
            Votre demande d&apos;inscription en tant que membre DMC Alliance a bien été enregistrée.
            Notre équipe va examiner votre dossier et vous contactera sous 48h.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Un email de confirmation a été envoyé à <strong>{dmcForm.email}</strong>
          </p>
          <Link href="/">
            <Button fullWidth>Retour à l&apos;accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl w-full">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block">
          <h1 className="text-2xl font-heading text-terracotta-600">
            The DMC Alliance
          </h1>
        </Link>
        <h2 className="mt-4 text-xl font-heading text-gray-900">
          Créer votre compte
        </h2>
      </div>

      {/* Étape 1: Choix du type de compte */}
      {step === 1 && (
        <div className="bg-white rounded-2xl shadow-card p-8">
          <p className="text-center text-gray-600 mb-8">
            Choisissez votre profil pour commencer
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option Agence */}
            <button
              onClick={() => handleAccountTypeSelect('agency')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-terracotta-500 hover:bg-terracotta-50 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-terracotta-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-terracotta-200 transition-colors">
                <Building2 className="w-6 h-6 text-terracotta-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Je suis une agence de voyage
              </h3>
              <p className="text-sm text-gray-600">
                Accédez aux circuits GIR, suivez le remplissage en temps réel et faites des demandes de réservation.
              </p>
            </button>

            {/* Option DMC */}
            <button
              onClick={() => handleAccountTypeSelect('dmc')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-terracotta-500 hover:bg-terracotta-50 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-terracotta-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-terracotta-200 transition-colors">
                <Globe className="w-6 h-6 text-terracotta-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Je suis un DMC membre
              </h3>
              <p className="text-sm text-gray-600">
                Vous êtes déjà membre de DMC Alliance ? Créez votre compte pour gérer vos destinations et circuits.
              </p>
            </button>
          </div>

          <p className="mt-8 text-center text-gray-600">
            Déjà inscrit ?{' '}
            <Link href="/auth/login" className="text-terracotta-600 font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      )}

      {/* Étape 2: Formulaire Agence */}
      {step === 2 && accountType === 'agency' && (
        <div className="bg-white rounded-2xl shadow-card p-8">
          <button
            onClick={() => setStep(1)}
            className="flex items-center text-gray-500 hover:text-gray-700 mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Retour
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-terracotta-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-terracotta-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Inscription Agence de Voyage
              </h3>
              <p className="text-sm text-gray-500">Accès immédiat à l&apos;espace professionnel</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleAgencySubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l&apos;agence *
                </label>
                <input
                  type="text"
                  value={agencyForm.agencyName}
                  onChange={(e) => {
                    setAgencyForm({ ...agencyForm, agencyName: e.target.value });
                    setJoinMode(false);
                  }}
                  required
                  disabled={joinMode}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500 disabled:bg-gray-100"
                  placeholder="Ex: Voyages du Monde"
                />
                {checkingAgency && (
                  <p className="text-xs text-gray-500 mt-1">Vérification...</p>
                )}
              </div>

              {/* Alerte agence existante */}
              {existingAgency && !joinMode && (
                <div className="md:col-span-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800">
                        Une agence avec ce nom existe déjà
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        <strong>{existingAgency.name}</strong>
                        {existingAgency.city && ` - ${existingAgency.city}`}
                        {existingAgency.country && `, ${existingAgency.country}`}
                      </p>
                      <p className="text-sm text-amber-700 mt-2">
                        Si vous êtes un collaborateur de cette agence, vous pouvez demander à la rejoindre.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => setJoinMode(true)}
                          className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          Rejoindre cette agence
                        </button>
                        <button
                          type="button"
                          onClick={() => setExistingAgency(null)}
                          className="px-4 py-2 bg-white text-amber-700 text-sm font-medium rounded-lg border border-amber-300 hover:bg-amber-50 transition-colors"
                        >
                          C&apos;est une autre agence
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode rejoindre une agence */}
              {joinMode && existingAgency && (
                <div className="md:col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <UserPlus className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">
                        Demande pour rejoindre {existingAgency.name}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Vous allez demander à rejoindre cette agence en tant que collaborateur.
                        Le responsable de l&apos;agence devra approuver votre demande.
                      </p>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-blue-800 mb-1">
                          Message (optionnel)
                        </label>
                        <textarea
                          value={joinMessage}
                          onChange={(e) => setJoinMessage(e.target.value)}
                          rows={2}
                          placeholder="Présentez-vous brièvement au responsable de l'agence..."
                          className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setJoinMode(false);
                          setJoinMessage('');
                        }}
                        className="mt-2 text-sm text-blue-600 hover:underline"
                      >
                        Annuler et créer une nouvelle agence
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro d&apos;immatriculation
                </label>
                <input
                  type="text"
                  value={agencyForm.registrationNumber}
                  onChange={(e) => setAgencyForm({ ...agencyForm, registrationNumber: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
                  placeholder="Ex: IM075100XXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du contact *
                </label>
                <input
                  type="text"
                  value={agencyForm.contactName}
                  onChange={(e) => setAgencyForm({ ...agencyForm, contactName: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
                  placeholder="Prénom Nom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={agencyForm.email}
                  onChange={(e) => setAgencyForm({ ...agencyForm, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
                  placeholder="contact@votre-agence.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={agencyForm.phone}
                  onChange={(e) => setAgencyForm({ ...agencyForm, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
                  placeholder="+33 1 23 45 67 89"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={agencyForm.address}
                  onChange={(e) => setAgencyForm({ ...agencyForm, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
                  placeholder="123 rue du Commerce"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville
                </label>
                <input
                  type="text"
                  value={agencyForm.city}
                  onChange={(e) => setAgencyForm({ ...agencyForm, city: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
                  placeholder="Paris"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pays
                </label>
                <input
                  type="text"
                  value={agencyForm.country}
                  onChange={(e) => setAgencyForm({ ...agencyForm, country: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
                  placeholder="France"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe *
                </label>
                <input
                  type="password"
                  value={agencyForm.password}
                  onChange={(e) => setAgencyForm({ ...agencyForm, password: e.target.value })}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
                  placeholder="Minimum 8 caractères"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe *
                </label>
                <input
                  type="password"
                  value={agencyForm.confirmPassword}
                  onChange={(e) => setAgencyForm({ ...agencyForm, confirmPassword: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
                  placeholder="Répétez le mot de passe"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" fullWidth loading={loading}>
                {joinMode ? 'Envoyer ma demande' : 'Créer mon compte agence'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Étape 2: Formulaire DMC */}
      {step === 2 && accountType === 'dmc' && (
        <div className="bg-white rounded-2xl shadow-card p-8">
          <button
            onClick={() => setStep(1)}
            className="flex items-center text-gray-500 hover:text-gray-700 mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Retour
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-terracotta-100 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-terracotta-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Demande d&apos;inscription DMC
              </h3>
              <p className="text-sm text-gray-500">Votre demande sera examinée par notre équipe</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleDMCSubmit} className="space-y-5">
            {/* Informations entreprise */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Informations de votre DMC
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de votre DMC *
                  </label>
                  <input
                    type="text"
                    value={dmcForm.partnerName}
                    onChange={(e) => setDmcForm({ ...dmcForm, partnerName: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
                    placeholder="Ex: Asia Travel Expert"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du contact *
                  </label>
                  <input
                    type="text"
                    value={dmcForm.contactName}
                    onChange={(e) => setDmcForm({ ...dmcForm, contactName: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
                    placeholder="Prénom Nom"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email du contact *
                  </label>
                  <input
                    type="email"
                    value={dmcForm.contactEmail}
                    onChange={(e) => setDmcForm({ ...dmcForm, contactEmail: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
                    placeholder="contact@votre-dmc.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={dmcForm.contactPhone}
                    onChange={(e) => setDmcForm({ ...dmcForm, contactPhone: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
                    placeholder="+84 123 456 789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site web
                  </label>
                  <input
                    type="url"
                    value={dmcForm.website}
                    onChange={(e) => setDmcForm({ ...dmcForm, website: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
                    placeholder="https://votre-site.com"
                  />
                </div>
              </div>
            </div>

            {/* Destinations */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Destinations couvertes *
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_DESTINATIONS.map((dest) => (
                  <button
                    key={dest.value}
                    type="button"
                    onClick={() => toggleDestination(dest.value)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      dmcForm.destinations.includes(dest.value)
                        ? 'bg-terracotta-500 text-white border-terracotta-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-terracotta-300'
                    }`}
                  >
                    {dest.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Spécialités */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Spécialités
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SPECIALTIES.map((spec) => (
                  <button
                    key={spec.value}
                    type="button"
                    onClick={() => toggleSpecialty(spec.value)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      dmcForm.specialties.includes(spec.value)
                        ? 'bg-terracotta-500 text-white border-terracotta-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-terracotta-300'
                    }`}
                  >
                    {spec.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description de votre activité
              </label>
              <textarea
                value={dmcForm.description}
                onChange={(e) => setDmcForm({ ...dmcForm, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
                placeholder="Présentez brièvement votre agence réceptive..."
              />
            </div>

            {/* GIR */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hasGir"
                checked={dmcForm.hasGir}
                onChange={(e) => setDmcForm({ ...dmcForm, hasGir: e.target.checked })}
                className="w-4 h-4 text-terracotta-600 border-gray-300 rounded focus:ring-terracotta-500"
              />
              <label htmlFor="hasGir" className="text-sm text-gray-700">
                Je propose des circuits GIR (Groupes à Itinéraire Régulier)
              </label>
            </div>

            {/* Identifiants */}
            <div className="border-t pt-5 mt-5 space-y-4">
              <h4 className="font-medium text-gray-900">Identifiants de connexion</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email de connexion *
                  </label>
                  <input
                    type="email"
                    value={dmcForm.email}
                    onChange={(e) => setDmcForm({ ...dmcForm, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
                    placeholder="votre-email@domaine.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    value={dmcForm.password}
                    onChange={(e) => setDmcForm({ ...dmcForm, password: e.target.value })}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
                    placeholder="Minimum 8 caractères"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le mot de passe *
                  </label>
                  <input
                    type="password"
                    value={dmcForm.confirmPassword}
                    onChange={(e) => setDmcForm({ ...dmcForm, confirmPassword: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-terracotta-500"
                    placeholder="Répétez le mot de passe"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" fullWidth loading={loading}>
                Soumettre ma demande
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Liens */}
      {step > 1 && (
        <p className="mt-6 text-center text-gray-600">
          Déjà inscrit ?{' '}
          <Link href="/auth/login" className="text-terracotta-600 font-medium">
            Se connecter
          </Link>
        </p>
      )}

      <p className="mt-4 text-center">
        <Link href="/" className="text-sm text-gray-500">
          ← Retour au site
        </Link>
      </p>
    </div>
  );
}

function RegisterFormSkeleton() {
  return (
    <div className="max-w-2xl w-full animate-pulse">
      <div className="h-96 bg-gray-200 rounded-xl" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-50 px-4 py-12">
      <Suspense fallback={<RegisterFormSkeleton />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
