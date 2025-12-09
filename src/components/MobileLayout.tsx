import { ReactNode } from 'react';
import { MobileNavigation } from './MobileNavigation';

interface MobileLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function MobileLayout({ children, hideNav }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-20">
      {children}
      {!hideNav && <MobileNavigation />}
    </div>
  );
}
