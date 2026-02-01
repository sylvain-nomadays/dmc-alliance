import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The DMC Alliance - Local Experts in B2B Travel',
  description:
    'Collective of local receptive agencies. Tailor-made, groups and shared departure tours for tour operators and travel agencies in Europe.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
