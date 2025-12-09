import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { DollarSign, Minus, Plus } from 'lucide-react';

interface StakeInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  currency?: string;
}

const presetAmounts = [5, 10, 25, 50, 100, 250];

export function StakeInput({
  value,
  onChange,
  min = 1,
  max = 10000,
  currency = 'USDC',
}: StakeInputProps) {
  const [customMode, setCustomMode] = useState(false);

  const handlePresetClick = (amount: number) => {
    onChange(amount);
    setCustomMode(false);
  };

  const handleIncrement = () => {
    const newValue = Math.min(value + 5, max);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - 5, min);
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      {/* Preset amounts */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {presetAmounts.map((amount) => (
          <motion.button
            key={amount}
            onClick={() => handlePresetClick(amount)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'p-3 rounded-lg border transition-all font-display font-bold',
              value === amount && !customMode
                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25'
                : 'bg-secondary/50 border-border hover:border-primary/50 hover:bg-secondary'
            )}
          >
            ${amount}
          </motion.button>
        ))}
      </div>

      {/* Custom amount */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={value <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="relative flex-1">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="number"
            value={value}
            onChange={(e) => {
              const newValue = Number(e.target.value);
              if (newValue >= min && newValue <= max) {
                onChange(newValue);
                setCustomMode(true);
              }
            }}
            className="pl-10 text-center text-lg font-display font-bold h-12"
            min={min}
            max={max}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {currency}
          </span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={value >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Prize pool preview */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 rounded-xl bg-success/10 border border-success/30 text-center"
      >
        <p className="text-sm text-muted-foreground mb-1">Winner takes</p>
        <p className="font-display text-2xl font-bold text-success">
          ${value * 2} {currency}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          (2.5% platform fee deducted)
        </p>
      </motion.div>
    </div>
  );
}
