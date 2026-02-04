'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/hooks/useAuthContext';

interface Circuit {
  id: string;
  slug: string;
  title: string;
  partner_id: string;
  destination: {
    name: string;
  } | null;
  partner: {
    name: string;
  } | null;
  duration_days: number;
  price_from: number;
  status: 'draft' | 'published' | 'archived';
  image_url: string | null;
  departures_count?: number;
}

const statusLabels: Record<string, { label: string; class: string }> = {
  draft: { label: 'Brouillon', class: 'bg-gray-100 text-gray-600' },
  published: { label: 'Publié', class: 'bg-sage-100 text-sage-700' },
  archived: { label: 'Archivé', class: 'bg-red-100 text-red-700' },
};

export default function CircuitsListPage() {
  const auth = useAuthContext();
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!auth.isLoading) {
      fetchCircuits();
    }
  }, [auth.isLoading, auth.partnerId]);

  async function fetchCircuits() {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('circuits')
      .select(`
        id,
        slug,
        title,
        partner_id,
        duration_days,
        price_from,
        status,
        image_url,
        destination:destinations(name),
        partner:partners(name)
      `)
      .order('created_at', { ascending: false });

    // If user is a partner (not admin), only show their circuits
    if (auth.isPartner && auth.partnerId) {
      query = query.eq('partner_id', auth.partnerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching circuits:', error);
    } else {
      setCircuits(data || []);
    }
    setIsLoading(false);
  }

  const filteredCircuits = circuits.filter((circuit) => {
    const matchesSearch =
      circuit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      circuit.destination?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || circuit.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('circuits')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setCircuits((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: status as Circuit['status'] } : c))
      );
    }
  }

  async function deleteCircuit(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce circuit ?')) return;

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('circuits').delete().eq('id', id);

    if (!error) {
      setCircuits((prev) => prev.filter((c) => c.id !== id));
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(price);
  }

  // Show loading while auth context is loading
  if (auth.isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-10 h-10 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-heading text-gray-900">
            {auth.isPartner ? 'Mes Circuits GIR' : 'Circuits GIR'}
          </h1>
          <p className="text-gray-600 mt-1">
            {auth.isPartner
              ? 'Créez et gérez vos circuits à dates de départ fixes'
              : 'Gérez vos circuits à dates de départ fixes'
            }
          </p>
        </div>
        <Link
          href="/admin/circuits/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau circuit
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un circuit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
            />
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 bg-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="published">Publiés</option>
            <option value="draft">Brouillons</option>
            <option value="archived">Archivés</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="w-10 h-10 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Chargement...</p>
        </div>
      ) : filteredCircuits.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun circuit</h3>
          <p className="text-gray-500 mb-4">Créez votre premier circuit GIR</p>
          <Link
            href="/admin/circuits/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Créer un circuit
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCircuits.map((circuit) => (
            <div key={circuit.id} className="bg-white rounded-xl shadow-sm overflow-hidden group">
              {/* Image */}
              <div className="relative aspect-video bg-gray-100">
                {circuit.image_url ? (
                  <Image
                    src={circuit.image_url}
                    alt={circuit.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Status badge */}
                <div className="absolute top-3 left-3">
                  <span className={cn(
                    'px-2 py-1 text-xs font-medium rounded-full',
                    statusLabels[circuit.status].class
                  )}>
                    {statusLabels[circuit.status].label}
                  </span>
                </div>

                {/* Quick actions on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Link
                    href={`/admin/circuits/${circuit.id}`}
                    className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    title="Modifier"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                  <Link
                    href={`/admin/circuits/${circuit.id}/departures`}
                    className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    title="Gérer les départs"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => deleteCircuit(circuit.id)}
                    className="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    title="Supprimer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-heading text-gray-900 mb-1 line-clamp-1">{circuit.title}</h3>
                <p className="text-sm text-gray-500 mb-3">
                  {circuit.destination?.name || 'Non assigné'} • {circuit.duration_days} jours
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-heading text-terracotta-500">
                    {formatPrice(circuit.price_from)}
                  </span>

                  {/* Status dropdown */}
                  <select
                    value={circuit.status}
                    onChange={(e) => updateStatus(circuit.id, e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="published">Publier</option>
                    <option value="archived">Archiver</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
