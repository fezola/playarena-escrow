import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MobileLayout } from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Smartphone, Share, Plus, CheckCircle2, Apple, Chrome } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <MobileLayout>
      <main className="px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Smartphone className="h-10 w-10 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Install PlayArena</h1>
          <p className="text-muted-foreground text-sm">
            Add PlayArena to your home screen for the best experience
          </p>
        </motion.div>

        {isInstalled ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-success/30 bg-success/10">
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                <h2 className="font-display font-bold text-lg mb-2">Already Installed!</h2>
                <p className="text-sm text-muted-foreground">
                  PlayArena is installed on your device. Open it from your home screen for the best experience.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : deferredPrompt ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Button onClick={handleInstall} variant="neon" size="lg" className="w-full">
              <Download className="h-5 w-5 mr-2" />
              Install App
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {isIOS && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Apple className="h-6 w-6 text-primary" />
                      <h3 className="font-display font-bold">iPhone / iPad</h3>
                    </div>
                    <ol className="space-y-3 text-sm">
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                        <span>Tap the <Share className="inline h-4 w-4" /> Share button in Safari</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                        <span>Scroll down and tap "Add to Home Screen"</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                        <span>Tap "Add" to confirm</span>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {isAndroid && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Chrome className="h-6 w-6 text-primary" />
                      <h3 className="font-display font-bold">Android</h3>
                    </div>
                    <ol className="space-y-3 text-sm">
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                        <span>Tap the menu (⋮) in Chrome</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                        <span>Tap "Add to Home screen"</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                        <span>Tap "Add" to confirm</span>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {!isIOS && !isAndroid && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-border/50">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Open this page on your mobile device to install PlayArena as an app.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        )}

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="font-display font-bold text-center text-sm text-muted-foreground">WHY INSTALL?</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '⚡', title: 'Faster', desc: 'Instant load times' },
              { icon: '📱', title: 'Native Feel', desc: 'Full screen experience' },
              { icon: '🔔', title: 'Notifications', desc: 'Never miss a game' },
              { icon: '🌐', title: 'Offline', desc: 'Works without internet' },
            ].map((benefit, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-3 text-center">
                  <span className="text-2xl mb-1 block">{benefit.icon}</span>
                  <p className="font-semibold text-sm">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground">{benefit.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </main>
    </MobileLayout>
  );
};

export default Install;
