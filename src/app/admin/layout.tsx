import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { getAuthContext } from '@/lib/auth/getAuthContext';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authContext = await getAuthContext();

  if (!authContext) {
    redirect('/auth/login?redirect=/admin');
  }

  // Check if user can access admin
  if (!authContext.canAccessAdmin) {
    redirect('/');
  }

  // Get display info
  const displayName = authContext.isPartner && authContext.partner
    ? authContext.partner.name
    : authContext.profile.full_name || authContext.user.email;

  const roleLabel = authContext.isAdmin ? 'Administrateur' : 'Partenaire';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar - pass role info */}
      <AdminSidebar
        isAdmin={authContext.isAdmin}
        isPartner={authContext.isPartner}
        partnerName={authContext.partner?.name}
      />

      {/* Main content */}
      <div className="lg:pl-64">
        <AdminHeader
          user={{
            name: displayName,
            avatar: authContext.profile.avatar_url,
            role: roleLabel,
          }}
        />

        <main className="py-6 px-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
