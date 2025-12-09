import { Link, useLocation } from 'react-router-dom';
import { Home, Gamepad2, Users, Trophy, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Gamepad2, label: 'Games', path: '/games' },
  { icon: Plus, label: 'Play', path: '/create', isMain: true },
  { icon: Users, label: 'Friends', path: '/friends' },
  { icon: Trophy, label: 'Ranks', path: '/leaderboard' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function MobileNavigation() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          if (item.isMain) {
            return (
              <Link key={item.path} to={item.path} className="relative -mt-6">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
                  style={{ boxShadow: '0 0 20px hsl(var(--primary) / 0.5)' }}
                >
                  <item.icon className="h-5 w-5 text-primary-foreground" />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-0.5 py-2 px-2 relative"
            >
              <motion.div whileTap={{ scale: 0.9 }}>
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
              </motion.div>
              <span
                className={cn(
                  'text-[9px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
