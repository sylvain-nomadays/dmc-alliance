'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Plus, Pencil, Trash2, Users, PlusCircle } from 'lucide-react';

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

interface DeparturesEditorProps {
  circuitId: string;
  durationDays: number;
  priceFrom: number;
  groupSizeMax: number;
}

export function DeparturesEditor({ circuitId, durationDays, priceFrom, groupSizeMax }: DeparturesEditorProps) {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingDeparture, setEditingDeparture] = useState<Departure | null>(null);
  const [lastEndDate, setLastEndDate] = useState<string | null>(null);
  const [form, setForm] = useState({
    start_date: '',
    end_date: '',
    total_seats: groupSizeMax || 16,
    booked_seats: 0,
    price: '',
    status: 'open' as 'open' | 'closed' | 'full' | 'cancelled',
    notes: '',
  });

  const fetchDepartures = useCallback(async () => {
    if (!circuitId || circuitId === 'new') {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: fetchError } = await (supabase as any)
      .from('circuit_departures')
      .select('*')
      .eq('circuit_id', circuitId)
      .order('start_date', { ascending: true });

    if (fetchError) {
      console.error('Error fetching departures:', fetchError);
    }

    setDepartures(data || []);
    setIsLoading(false);
  }, [circuitId]);

  useEffect(() => {
    fetchDepartures();
  }, [fetchDepartures]);

  // Calculate end date based on duration
  useEffect(() => {
    if (form.start_date && durationDays && !editingDeparture) {
      const startDate = new Date(form.start_date);
      startDate.setDate(startDate.getDate() + durationDays - 1);
      setForm(prev => ({
        ...prev,
        end_date: startDate.toISOString().split('T')[0],
      }));
    }
  }, [form.start_date, durationDays, editingDeparture]);

  const resetForm = (useLastEndDate: boolean = false) => {
    setForm({
      start_date: useLastEndDate && lastEndDate ? lastEndDate : '',
      end_date: '',
      total_seats: groupSizeMax || 16,
      booked_seats: 0,
      price: priceFrom?.toString() || '',
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

  const saveDeparture = async (): Promise<boolean> => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('circuit_departures')
        .update(departureData)
        .eq('id', editingDeparture.id);

      if (updateError) {
        setError('Erreur lors de la mise à jour: ' + updateError.message);
        setIsSaving(false);
        return false;
      }
      setSuccess('Départ mis à jour');
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from('circuit_departures')
        .insert(departureData);

      if (insertError) {
        setError('Erreur lors de la création: ' + insertError.message);
        setIsSaving(false);
        return false;
      }
      setSuccess('Départ créé');
      // Store the end date for next departure
      setLastEndDate(form.end_date || form.start_date);
    }

    setIsSaving(false);
    await fetchDepartures();
    setTimeout(() => setSuccess(null), 3000);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await saveDeparture();
    if (success) {
      setShowForm(false);
      resetForm(false);
    }
  };

  const handleSaveAndNew = async () => {
    const endDateToUse = form.end_date || form.start_date;
    const success = await saveDeparture();
    if (success) {
      // Reset form but pre-fill with the end date of the just-created departure
      setForm({
        start_date: endDateToUse,
        end_date: '',
        total_seats: groupSizeMax || 16,
        booked_seats: 0,
        price: priceFrom?.toString() || '',
        status: 'open',
        notes: '',
      });
      setEditingDeparture(null);
      // Keep modal open
    }
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
    fetchDepartures();
    setTimeout(() => setSuccess(null), 3000);
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (circuitId === 'new') {
    return (
      <div className="text-center py-12 bg-amber-50 border border-amber-200 rounded-lg">
        <Calendar className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-amber-800 mb-2">
          Sauvegardez d&apos;abord le circuit
        </h3>
        <p className="text-amber-600">
          Les dates de départ pourront être ajoutées une fois le circuit créé.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Dates de départ</h3>
          <p className="text-sm text-gray-500">
            Gérez les dates de départ et le remplissage pour ce circuit GIR
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm(true);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter un départ
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
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
                  type="button"
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
                  <p className="text-xs text-gray-500 mt-1">Basé sur la taille max du groupe ({groupSizeMax || 16})</p>
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
                  placeholder={priceFrom?.toString() || 'Prix du circuit'}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                />
                <p className="text-xs text-gray-500 mt-1">Laisser vide pour utiliser le prix de base</p>
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
                  {isSaving ? 'Enregistrement...' : editingDeparture ? 'Mettre à jour' : 'Créer'}
                </button>
                {!editingDeparture && (
                  <button
                    type="button"
                    onClick={handleSaveAndNew}
                    disabled={isSaving || !form.start_date}
                    className="flex-1 px-4 py-2 border-2 border-terracotta-600 text-terracotta-600 rounded-lg hover:bg-terracotta-50 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
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
        <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-lg">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun départ programmé</h3>
          <p className="text-gray-500 mb-4">Ajoutez des dates de départ pour ce circuit GIR.</p>
          <button
            type="button"
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
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{departures.length}</div>
              <div className="text-sm text-gray-500">Départs</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {departures.filter(d => d.status === 'open').length}
              </div>
              <div className="text-sm text-gray-500">Ouverts</div>
            </div>
            <div className="bg-terracotta-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-terracotta-600">
                {departures.reduce((acc, d) => acc + d.booked_seats, 0)}
              </div>
              <div className="text-sm text-gray-500">Réservés</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {departures.reduce((acc, d) => acc + (d.total_seats - d.booked_seats), 0)}
              </div>
              <div className="text-sm text-gray-500">Disponibles</div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Dates</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Places</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Prix</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {departures.map((departure) => (
                  <tr key={departure.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(departure.start_date)}
                      </div>
                      {departure.end_date && (
                        <div className="text-xs text-gray-500">
                          → {formatDate(departure.end_date)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          <span className="font-medium">{departure.total_seats - departure.booked_seats}</span>
                          <span className="text-gray-500"> / {departure.total_seats}</span>
                        </span>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-terracotta-500 rounded-full"
                            style={{ width: `${(departure.booked_seats / departure.total_seats) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {departure.price ? `${departure.price.toLocaleString()} €` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(departure.status)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(departure)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(departure.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
