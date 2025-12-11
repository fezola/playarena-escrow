import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Games from "./pages/Games";
import PlayGame from "./pages/PlayGame";
import CreateMatch from "./pages/CreateMatch";
import MatchPage from "./pages/MatchPage";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";
import Auth from "./pages/Auth";
import MatchHistory from "./pages/MatchHistory";
import Transactions from "./pages/Transactions";
import Install from "./pages/Install";
import SportsPrediction from "./pages/SportsPrediction";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/games" element={<Games />} />
            <Route path="/play/:gameType" element={<PlayGame />} />
            <Route path="/create" element={<CreateMatch />} />
            <Route path="/match/:id" element={<MatchPage />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/history" element={<MatchHistory />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/install" element={<Install />} />
            <Route path="/sports-prediction" element={<SportsPrediction />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
