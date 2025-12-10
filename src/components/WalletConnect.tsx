import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function WalletConnect() {
  const navigate = useNavigate();
  
  // This component is not used since we use email/social auth
  // Keeping it as a redirect to profile for wallet management
  return (
    <Button onClick={() => navigate('/profile')} variant="outline" size="sm">
      <Wallet className="h-4 w-4 mr-2" />
      Wallet
    </Button>
  );
}
