import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Trophy, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Users, label: 'Friends', path: '/friends' },
  { icon: Plus, label: 'Play', path: '/create', isMain: true },
  { icon: Trophy, label: 'Ranks', path: '/leaderboard' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function MobileNavigation() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          if (item.isMain) {
            return (
              <Link key={item.path} to={item.path} className="relative -mt-6">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
                  style={{ boxShadow: '0 0 20px hsl(var(--primary) / 0.5)' }}
                >
                  <item.icon className="h-6 w-6 text-primary-foreground" />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-1 py-2 px-3"
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
                  'text-[10px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
