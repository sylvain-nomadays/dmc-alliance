'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/hooks/useAuthContext';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: 'admin' | 'partner' | 'agency' | 'member';
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  partner?: {
    id: string;
    name: string;
  } | null;
}

interface Partner {
  id: string;
  name: string;
}

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrateur', color: 'bg-purple-100 text-purple-700' },
  partner: { label: 'Partenaire', color: 'bg-terracotta-100 text-terracotta-700' },
  agency: { label: 'Agence', color: 'bg-sage-100 text-sage-700' },
  member: { label: 'Membre', color: 'bg-gray-100 text-gray-700' },
};

export default function UsersListPage() {
  const auth = useAuthContext();
  const [users, setUsers] = useState<User[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!auth.isLoading && auth.isAdmin) {
      fetchData();
    }
  }, [auth.isLoading, auth.isAdmin]);

  async function fetchData() {
    const supabase = createClient();

    // Fetch users (profiles)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: usersData, error: usersError } = await (supabase as any)
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
    } else {
      // For each user with role 'partner', try to find their partner record
      const usersWithPartners = await Promise.all(
        (usersData || []).map(async (user: User) => {
          if (user.role === 'partner') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: partner } = await (supabase as any)
              .from('partners')
              .select('id, name')
              .eq('user_id', user.id)
              .single();
            return { ...user, partner };
          }
          return user;
        })
      );
      setUsers(usersWithPartners);
    }

    // Fetch partners for assignment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: partnersData } = await (supabase as any)
      .from('partners')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    setPartners(partnersData || []);
    setIsLoading(false);
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.company_name?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  async function updateUserRole(userId: string, newRole: string) {
    setIsSaving(true);
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      alert('Erreur lors de la mise à jour du rôle');
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole as User['role'] } : u))
      );
    }
    setIsSaving(false);
  }

  async function linkUserToPartner(userId: string, partnerId: string) {
    setIsSaving(true);
    const supabase = createClient();

    // Update the partner record to link to this user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('partners')
      .update({ user_id: userId })
      .eq('id', partnerId);

    if (error) {
      console.error('Error linking user to partner:', error);
      alert('Erreur lors de la liaison avec le partenaire');
    } else {
      // Get the partner name
      const partner = partners.find((p) => p.id === partnerId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, partner: partner ? { id: partnerId, name: partner.name } : null }
            : u
        )
      );
    }
    setIsSaving(false);
  }

  async function toggleActive(userId: string, currentStatus: boolean) {
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ is_active: !currentStatus })
      .eq('id', userId);

    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u))
      );
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  // Only admins can access this page
  if (auth.isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-10 h-10 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (!auth.isAdmin) {
    return (
      <div className="p-12 text-center">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Accès refusé</h3>
        <p className="text-gray-500">Seuls les administrateurs peuvent accéder à cette page.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-heading text-gray-900">Utilisateurs</h1>
          <p className="text-gray-600 mt-1">
            Gérez les comptes utilisateurs et leurs rôles
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {users.length} utilisateur{users.length > 1 ? 's' : ''} inscrit{users.length > 1 ? 's' : ''}
        </div>
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
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
            />
          </div>

          {/* Role filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 bg-white"
          >
            <option value="all">Tous les rôles</option>
            <option value="admin">Administrateurs</option>
            <option value="partner">Partenaires</option>
            <option value="agency">Agences</option>
            <option value="member">Membres</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-gray-500">Chargement...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun utilisateur</h3>
            <p className="text-gray-500">Aucun utilisateur ne correspond à vos critères.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partenaire lié
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inscrit le
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.full_name || user.email}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-500 font-medium">
                            {(user.full_name || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.full_name || 'Sans nom'}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.company_name && (
                          <p className="text-xs text-gray-400">{user.company_name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingUser?.id === user.id ? (
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        disabled={isSaving}
                        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 bg-white"
                      >
                        <option value="admin">Administrateur</option>
                        <option value="partner">Partenaire</option>
                        <option value="agency">Agence</option>
                        <option value="member">Membre</option>
                      </select>
                    ) : (
                      <span
                        className={cn(
                          'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                          roleLabels[user.role]?.color || 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {roleLabels[user.role]?.label || user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.role === 'partner' ? (
                      editingUser?.id === user.id ? (
                        <select
                          value={user.partner?.id || ''}
                          onChange={(e) => e.target.value && linkUserToPartner(user.id, e.target.value)}
                          disabled={isSaving}
                          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 bg-white"
                        >
                          <option value="">-- Sélectionner --</option>
                          {partners.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-600">
                          {user.partner?.name || (
                            <span className="text-gray-400 italic">Non lié</span>
                          )}
                        </span>
                      )
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(user.id, user.is_active)}
                      className={cn(
                        'inline-flex px-2 py-1 text-xs font-medium rounded-full transition-colors',
                        user.is_active
                          ? 'bg-sage-100 text-sage-700 hover:bg-sage-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      )}
                    >
                      {user.is_active ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {editingUser?.id === user.id ? (
                        <button
                          onClick={() => setEditingUser(null)}
                          className="px-3 py-1.5 text-sm bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors"
                        >
                          Terminer
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Modifier le rôle"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Légende des rôles</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className={cn('inline-flex px-2 py-1 text-xs font-medium rounded-full mb-1', roleLabels.admin.color)}>
              Administrateur
            </span>
            <p className="text-xs text-gray-500">Accès complet à l&apos;administration</p>
          </div>
          <div>
            <span className={cn('inline-flex px-2 py-1 text-xs font-medium rounded-full mb-1', roleLabels.partner.color)}>
              Partenaire
            </span>
            <p className="text-xs text-gray-500">Gère ses destinations et circuits</p>
          </div>
          <div>
            <span className={cn('inline-flex px-2 py-1 text-xs font-medium rounded-full mb-1', roleLabels.agency.color)}>
              Agence
            </span>
            <p className="text-xs text-gray-500">Peut réserver des circuits GIR</p>
          </div>
          <div>
            <span className={cn('inline-flex px-2 py-1 text-xs font-medium rounded-full mb-1', roleLabels.member.color)}>
              Membre
            </span>
            <p className="text-xs text-gray-500">Accès basique au site</p>
          </div>
        </div>
      </div>
    </div>
  );
}
