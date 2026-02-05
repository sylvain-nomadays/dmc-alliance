'use client';

import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  locale: string;
  label: string;
}

export function LogoutButton({ locale, label }: LogoutButtonProps) {
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}`;
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-3 py-2 text-sm text-deep-blue-200 hover:text-white hover:bg-deep-blue-800/50 rounded-lg transition-colors"
      title={label}
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
