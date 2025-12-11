import { Link, useLocation } from 'react-router-dom';
import { WalletConnect } from './WalletConnect';
import { NotificationBell } from './NotificationBell';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Gamepad2, Plus, Trophy, Home } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Lobby', icon: Home },
  { href: '/create', label: 'Create', icon: Plus },
  { href: '/leaderboard', label: 'Ranks', icon: Trophy },
];

export function Header() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent"
          >
            <Gamepad2 className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          <span className="font-display font-bold text-xl tracking-wider hidden sm:block">
            <span className="text-gradient">PLAY</span>
            <span className="text-foreground">ARENA</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "relative px-4 py-2 rounded-lg font-display text-sm uppercase tracking-wider transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/30"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Notifications & Wallet */}
        <div className="flex items-center gap-2">
          <NotificationBell />
          <WalletConnect />
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-t border-border/50">
        <div className="container flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
