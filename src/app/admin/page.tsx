import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthContext } from '@/lib/auth/getAuthContext';

// Stats card component
function StatCard({
  title,
  value,
  change,
  icon,
  href,
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-heading text-gray-900 mt-1">{value}</p>
            {change && (
              <p className="text-sm text-sage-600 mt-1">{change}</p>
            )}
          </div>
          <div className="w-12 h-12 bg-terracotta-100 rounded-xl flex items-center justify-center text-terracotta-600">
            {icon}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  // Check if user is partner - redirect to circuits page
  const authContext = await getAuthContext();
  if (authContext?.isPartner && !authContext?.isAdmin) {
    redirect('/admin/circuits');
  }

  const supabase = await createClient();

  // Fetch stats (with fallback for empty tables)
  const [
    { count: partnersCount },
    { count: destinationsCount },
    { count: circuitsCount },
    { count: quotesCount },
    { count: messagesCount },
  ] = await Promise.all([
    supabase.from('partners').select('*', { count: 'exact', head: true }),
    supabase.from('destinations').select('*', { count: 'exact', head: true }),
    supabase.from('circuits').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('quote_requests').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('is_read', false),
  ]);

  const stats = [
    {
      title: 'Partenaires actifs',
      value: partnersCount || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      href: '/admin/partners',
    },
    {
      title: 'Destinations',
      value: destinationsCount || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: '/admin/destinations',
    },
    {
      title: 'Circuits GIR publiés',
      value: circuitsCount || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: '/admin/circuits',
    },
    {
      title: 'Nouvelles demandes',
      value: quotesCount || 0,
      change: quotesCount && quotesCount > 0 ? 'À traiter' : undefined,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: '/admin/quotes',
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-heading text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Bienvenue sur l'administration de The DMC Alliance
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h2 className="text-lg font-heading text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/circuits/new"
            className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-terracotta-300 hover:bg-terracotta-50 transition-colors group"
          >
            <div className="w-10 h-10 bg-terracotta-100 rounded-lg flex items-center justify-center text-terracotta-600 group-hover:bg-terracotta-200 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700">Nouveau GIR</span>
          </Link>

          <Link
            href="/admin/partners/new"
            className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-terracotta-300 hover:bg-terracotta-50 transition-colors group"
          >
            <div className="w-10 h-10 bg-sage-100 rounded-lg flex items-center justify-center text-sage-600 group-hover:bg-sage-200 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700">Ajouter partenaire</span>
          </Link>

          <Link
            href="/admin/articles/new"
            className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-terracotta-300 hover:bg-terracotta-50 transition-colors group"
          >
            <div className="w-10 h-10 bg-deep-blue-100 rounded-lg flex items-center justify-center text-deep-blue-600 group-hover:bg-deep-blue-200 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700">Nouvel article</span>
          </Link>

          <Link
            href="/admin/messages"
            className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-terracotta-300 hover:bg-terracotta-50 transition-colors group"
          >
            <div className="w-10 h-10 bg-sand-100 rounded-lg flex items-center justify-center text-sand-700 group-hover:bg-sand-200 transition-colors relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {messagesCount && messagesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {messagesCount}
                </span>
              )}
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700">Messages</span>
          </Link>
        </div>
      </div>

      {/* Getting started guide */}
      <div className="bg-gradient-to-r from-deep-blue-900 to-deep-blue-800 rounded-xl p-6 text-white">
        <h2 className="text-lg font-heading mb-2">🚀 Guide de démarrage</h2>
        <p className="text-deep-blue-200 mb-4">
          Pour commencer à utiliser The DMC Alliance, suivez ces étapes :
        </p>
        <ol className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-terracotta-500 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
            <span>Ajoutez vos partenaires (agences réceptives) dans la section Partenaires</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-terracotta-500 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
            <span>Créez les destinations associées à chaque partenaire</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-terracotta-500 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
            <span>Publiez vos premiers circuits GIR avec dates et tarifs</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-terracotta-500 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
            <span>Rédigez des articles pour le magazine afin d'attirer les agences</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
