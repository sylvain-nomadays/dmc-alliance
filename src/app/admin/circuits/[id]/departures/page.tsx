'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Departure {
  id: string;
  circuit_id: string;
  start_date: string;
  end_date: string | null;
  total_seats: number;
  booked_seats: number;
  price: number | null;
  status: 'open' | 'closed' | 'full' | 'cancelled';
  notes: string | null;
  created_at: string;
}

interface Circuit {
  id: string;
  title: string;
  slug: string;
  duration_days: number;
  price_from: number | null;
  group_size_max: number | null;
}

export default function CircuitDeparturesPage() {
  const router = useRouter();
  const params = useParams();
  const circuitId = params.id as string;

  const [circuit, setCircuit] = useState<Circuit | null>(null);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for new departure
  const [showForm, setShowForm] = useState(false);
  const [editingDeparture, setEditingDeparture] = useState<Departure | null>(null);
  const [lastEndDate, setLastEndDate] = useState<string | null>(null);
  const [form, setForm] = useState({
    start_date: '',
    end_date: '',
    total_seats: 16,
    booked_seats: 0,
    price: '',
    status: 'open' as 'open' | 'closed' | 'full' | 'cancelled',
    notes: '',
  });

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    // Fetch circuit info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: circuitData, error: circuitError } = await (supabase as any)
      .from('circuits')
      .select('id, title, slug, duration_days, price_from, group_size_max')
      .eq('id', circuitId)
      .single();

    if (circuitError || !circuitData) {
      setError('Circuit non trouvé');
      setIsLoading(false);
      return;
    }

    setCircuit(circuitData);

    // Fetch departures
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: departuresData, error: departuresError } = await (supabase as any)
      .from('circuit_departures')
      .select('*')
      .eq('circuit_id', circuitId)
      .order('start_date', { ascending: true });

    if (departuresError) {
      console.error('Error fetching departures:', departuresError);
    }

    setDepartures(departuresData || []);
    setIsLoading(false);
  }, [circuitId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = (useLastEndDate: boolean = false) => {
    setForm({
      start_date: useLastEndDate && lastEndDate ? lastEndDate : '',
      end_date: '',
      total_seats: circuit?.group_size_max || 16,
      booked_seats: 0,
      price: circuit?.price_from?.toString() || '',
      status: 'open',
      notes: '',
    });
    setEditingDeparture(null);
  };

  const handleEdit = (departure: Departure) => {
    setEditingDeparture(departure);
    setForm({
      start_date: departure.start_date,
      end_date: departure.end_date || '',
      total_seats: departure.total_seats,
      booked_seats: departure.booked_seats,
      price: departure.price?.toString() || '',
      status: departure.status,
      notes: departure.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const supabase = createClient();

    const departureData = {
      circuit_id: circuitId,
      start_date: form.start_date,
      end_date: form.end_date || null,
      total_seats: form.total_seats,
      booked_seats: form.booked_seats,
      price: form.price ? parseFloat(form.price) : null,
      status: form.status,
      notes: form.notes || null,
    };

    if (editingDeparture) {
      // Update existing departure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('circuit_departures')
        .update(departureData)
        .eq('id', editingDeparture.id);

      if (updateError) {
        setError('Erreur lors de la mise à jour: ' + updateError.message);
        setIsSaving(false);
        return;
      }

      setSuccess('Départ mis à jour avec succès');
    } else {
      // Create new departure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from('circuit_departures')
        .insert(departureData);

      if (insertError) {
        setError('Erreur lors de la création: ' + insertError.message);
        setIsSaving(false);
        return;
      }

      setSuccess('Départ créé avec succès');
      // Store the end date for next departure
      setLastEndDate(form.end_date || form.start_date);
    }

    setIsSaving(false);
    setShowForm(false);
    resetForm();
    fetchData();

    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSaveAndNew = async () => {
    setIsSaving(true);
    setError(null);

    const supabase = createClient();
    const endDateToUse = form.end_date || form.start_date;

    const departureData = {
      circuit_id: circuitId,
      start_date: form.start_date,
      end_date: form.end_date || null,
      total_seats: form.total_seats,
      booked_seats: form.booked_seats,
      price: form.price ? parseFloat(form.price) : null,
      status: form.status,
      notes: form.notes || null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from('circuit_departures')
      .insert(departureData);

    if (insertError) {
      setError('Erreur lors de la création: ' + insertError.message);
      setIsSaving(false);
      return;
    }

    setSuccess('Départ créé avec succès');
    setLastEndDate(endDateToUse);

    // Reset form but pre-fill with the end date of the just-created departure
    setForm({
      start_date: endDateToUse,
      end_date: '',
      total_seats: circuit?.group_size_max || 16,
      booked_seats: 0,
      price: circuit?.price_from?.toString() || '',
      status: 'open',
      notes: '',
    });
    setEditingDeparture(null);

    setIsSaving(false);
    fetchData();
    setTimeout(() => setSuccess(null), 3000);
    // Keep modal open
  };

  const handleDelete = async (departureId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce départ ?')) {
      return;
    }

    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('circuit_departures')
      .delete()
      .eq('id', departureId);

    if (deleteError) {
      setError('Erreur lors de la suppression: ' + deleteError.message);
      return;
    }

    setSuccess('Départ supprimé');
    fetchData();
    setTimeout(() => setSuccess(null), 3000);
  };

  // Calculate end date based on duration
  useEffect(() => {
    if (form.start_date && circuit?.duration_days && !editingDeparture) {
      const startDate = new Date(form.start_date);
      startDate.setDate(startDate.getDate() + circuit.duration_days - 1);
      setForm(prev => ({
        ...prev,
        end_date: startDate.toISOString().split('T')[0],
      }));
    }
  }, [form.start_date, circuit?.duration_days, editingDeparture]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Ouvert</span>;
      case 'closed':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Fermé</span>;
      case 'full':
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">Complet</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Annulé</span>;
      default:
        return null;
    }
  };

  const getAvailableSeats = (departure: Departure) => {
    return departure.total_seats - departure.booked_seats;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!circuit) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700">Circuit non trouvé</p>
            <Link href="/admin/circuits" className="text-red-600 underline mt-2 inline-block">
              Retour à la liste
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/admin/circuits" className="hover:text-gray-700">
              Circuits
            </Link>
            <span>/</span>
            <Link href={`/admin/circuits/${circuitId}`} className="hover:text-gray-700">
              {circuit.title}
            </Link>
            <span>/</span>
            <span className="text-gray-900">Départs</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des départs</h1>
              <p className="text-gray-500 mt-1">{circuit.title} • {circuit.duration_days} jours</p>
            </div>
            <button
              onClick={() => {
                resetForm(true);
                setShowForm(true);
              }}
              className="px-4 py-2 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un départ
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editingDeparture ? 'Modifier le départ' : 'Nouveau départ'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      resetForm(false);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de départ *
                    </label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Calculée automatiquement si vide</p>
                  </div>
                </div>

                {/* Seats */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Places totales *
                    </label>
                    <input
                      type="number"
                      value={form.total_seats}
                      onChange={(e) => setForm({ ...form, total_seats: parseInt(e.target.value) || 0 })}
                      min={1}
                      required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Basé sur la taille max du groupe ({circuit?.group_size_max || 16})</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Places réservées
                    </label>
                    <input
                      type="number"
                      value={form.booked_seats}
                      onChange={(e) => setForm({ ...form, booked_seats: parseInt(e.target.value) || 0 })}
                      min={0}
                      max={form.total_seats}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                    />
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix (€)
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder={circuit.price_from?.toString() || 'Prix du circuit'}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Laisser vide pour utiliser le prix de base du circuit</p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Departure['status'] })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  >
                    <option value="open">Ouvert aux réservations</option>
                    <option value="closed">Fermé</option>
                    <option value="full">Complet</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (interne)
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                    placeholder="Notes internes sur ce départ..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm(false);
                    }}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Enregistrement...
                      </>
                    ) : editingDeparture ? (
                      'Mettre à jour'
                    ) : (
                      'Créer'
                    )}
                  </button>
                  {!editingDeparture && (
                    <button
                      type="button"
                      onClick={handleSaveAndNew}
                      disabled={isSaving || !form.start_date}
                      className="flex-1 px-4 py-2 border-2 border-terracotta-600 text-terracotta-600 rounded-lg hover:bg-terracotta-50 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Sauver et Nouveau
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Departures List */}
        {departures.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun départ programmé</h3>
            <p className="text-gray-500 mb-4">Commencez par ajouter des dates de départ pour ce circuit.</p>
            <button
              onClick={() => {
                resetForm(true);
                setShowForm(true);
              }}
              className="px-4 py-2 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700"
            >
              Ajouter un premier départ
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Places
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {departures.map((departure) => (
                  <tr key={departure.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(departure.start_date)}
                      </div>
                      {departure.end_date && (
                        <div className="text-xs text-gray-500">
                          → {formatDate(departure.end_date)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">{getAvailableSeats(departure)}</span>
                          <span className="text-gray-500"> / {departure.total_seats}</span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-terracotta-500 rounded-full"
                            style={{ width: `${(departure.booked_seats / departure.total_seats) * 100}%` }}
                          />
                        </div>
                      </div>
                      {departure.booked_seats > 0 && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {departure.booked_seats} réservée{departure.booked_seats > 1 ? 's' : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {departure.price ? `${departure.price.toLocaleString()} €` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(departure.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(departure)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Modifier"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(departure.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Quick Stats */}
        {departures.length > 0 && (
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="text-2xl font-bold text-gray-900">{departures.length}</div>
              <div className="text-sm text-gray-500">Départs programmés</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="text-2xl font-bold text-green-600">
                {departures.filter(d => d.status === 'open').length}
              </div>
              <div className="text-sm text-gray-500">Ouverts</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="text-2xl font-bold text-terracotta-600">
                {departures.reduce((acc, d) => acc + d.booked_seats, 0)}
              </div>
              <div className="text-sm text-gray-500">Places réservées</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="text-2xl font-bold text-gray-900">
                {departures.reduce((acc, d) => acc + (d.total_seats - d.booked_seats), 0)}
              </div>
              <div className="text-sm text-gray-500">Places disponibles</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
