import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MobileLayout } from '@/components/MobileLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, ArrowDownLeft, ArrowUpRight, 
  CreditCard, Clock, CheckCircle, XCircle 
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Transaction = Database['public']['Tables']['transactions']['Row'];

export default function Transactions() {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setTransactions(data);
      }
      setLoading(false);
    };

    fetchTransactions();
  }, [profile]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const txTypeConfig: Record<string, { icon: typeof ArrowDownLeft; color: string; label: string }> = {
    deposit: { icon: ArrowDownLeft, color: 'text-success', label: 'Deposit' },
    withdrawal: { icon: ArrowUpRight, color: 'text-warning', label: 'Withdrawal' },
    stake: { icon: ArrowUpRight, color: 'text-destructive', label: 'Stake' },
    winnings: { icon: ArrowDownLeft, color: 'text-success', label: 'Winnings' },
    refund: { icon: ArrowDownLeft, color: 'text-primary', label: 'Refund' },
  };

  const statusConfig: Record<string, { icon: typeof CheckCircle; color: string }> = {
    confirmed: { icon: CheckCircle, color: 'text-success' },
    pending: { icon: Clock, color: 'text-warning' },
    failed: { icon: XCircle, color: 'text-destructive' },
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to="/profile">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-display text-xl font-bold">Transactions</h1>
        </div>
      </header>

      <main className="px-4 py-4 space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))
        ) : transactions.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-display font-bold text-lg mb-2">No transactions yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Deposit funds to start playing
              </p>
              <Link to="/profile">
                <Button variant="neon">Add Funds</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          transactions.map((tx, index) => {
            const typeConfig = txTypeConfig[tx.tx_type] || txTypeConfig.deposit;
            const status = statusConfig[tx.status] || statusConfig.pending;
            const isIncoming = ['deposit', 'winnings', 'refund'].includes(tx.tx_type);

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-border/50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${isIncoming ? 'bg-success/10' : 'bg-destructive/10'} flex items-center justify-center`}>
                        <typeConfig.icon className={`h-5 w-5 ${typeConfig.color}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {typeConfig.label}
                          </span>
                          <status.icon className={`h-3 w-3 ${status.color}`} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(tx.created_at)}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`font-display font-bold ${isIncoming ? 'text-success' : 'text-foreground'}`}>
                          {isIncoming ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">{tx.currency}</p>
                      </div>
                    </div>
                    
                    {tx.tx_hash && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-[10px] font-mono text-muted-foreground truncate">
                          TX: {tx.tx_hash}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </main>
    </MobileLayout>
  );
}
