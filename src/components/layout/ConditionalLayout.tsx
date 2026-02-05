'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface ConditionalLayoutProps {
  children: ReactNode;
  publicContent: ReactNode;
}

/**
 * Composant qui affiche le contenu public (header/footer) uniquement
 * sur les pages publiques, pas sur les pages protégées (admin, agency, etc.)
 */
export function ConditionalLayout({ children, publicContent }: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Déterminer si on est sur une route protégée
  const isProtectedRoute =
    pathname?.includes('/admin') ||
    pathname?.includes('/partner') ||
    pathname?.includes('/agency') ||
    pathname?.includes('/espace-pro');

  if (isProtectedRoute) {
    // Sur les routes protégées, ne pas afficher le contenu public (header/footer)
    return <>{children}</>;
  }

  // Sur les routes publiques, afficher le contenu avec header/footer
  return <>{publicContent}</>;
}
