import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, X, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ChatMessage {
  id: string;
  match_id: string;
  player_id: string;
  message: string;
  created_at: string;
  player?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface MatchChatProps {
  matchId: string;
  currentPlayerId: string;
}

const QUICK_EMOJIS = ['😀', '😂', '🎉', '👍', '👎', '🔥', '💪', '🤔', '😱', '🎮', '🏆', '💀'];
const QUICK_PHRASES = [
  "Good game!",
  "Nice move!",
  "You got lucky!",
  "Rematch?",
  "GG WP",
  "Let's go!",
];

export function MatchChat({ matchId, currentPlayerId }: MatchChatProps) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('match_chat')
        .select(`
          *,
          player:profiles!match_chat_player_id_fkey(display_name, avatar_url)
        `)
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data as unknown as ChatMessage[]);
      }
    };

    fetchMessages();
  }, [matchId]);

  // Subscribe to real-time messages
  useEffect(() => {
    const channel = supabase
      .channel(`match-chat-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_chat',
          filter: `match_id=eq.${matchId}`,
        },
        async (payload) => {
          // Fetch the player info for the new message
          const { data: playerData } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', payload.new.player_id)
            .single();

          const newMsg: ChatMessage = {
            ...(payload.new as ChatMessage),
            player: playerData || undefined,
          };

          setMessages((prev) => [...prev, newMsg]);
          
          // Increment unread if chat is closed and not from current user
          if (!isOpen && payload.new.player_id !== currentPlayerId) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, isOpen, currentPlayerId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Clear unread when opening chat
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !profile) return;

    const { error } = await supabase.from('match_chat').insert({
      match_id: matchId,
      player_id: currentPlayerId,
      message: text.trim(),
    });

    if (!error) {
      setNewMessage('');
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(newMessage);
  };

  const handleQuickPhrase = (phrase: string) => {
    sendMessage(phrase);
  };

  const handleEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "fixed bottom-24 right-4 z-50 h-12 w-12 rounded-full shadow-lg",
          "bg-primary/20 border-primary/50 hover:bg-primary/30",
          isOpen && "hidden"
        )}
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 max-h-[60vh] bg-card border border-border rounded-lg shadow-xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
            <span className="font-medium text-sm">Match Chat</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3" ref={scrollRef as any}>
            <div className="space-y-3">
              {messages.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No messages yet. Say hello! 👋
                </p>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.player_id === currentPlayerId;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col gap-1",
                        isOwn ? "items-end" : "items-start"
                      )}
                    >
                      <span className="text-xs text-muted-foreground">
                        {isOwn ? 'You' : msg.player?.display_name || 'Player'}
                      </span>
                      <div
                        className={cn(
                          "rounded-lg px-3 py-2 max-w-[85%] break-words text-sm",
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Quick Phrases */}
          <div className="px-3 py-2 border-t border-border">
            <div className="flex gap-1 flex-wrap">
              {QUICK_PHRASES.slice(0, 3).map((phrase) => (
                <Button
                  key={phrase}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => handleQuickPhrase(phrase)}
                >
                  {phrase}
                </Button>
              ))}
            </div>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-border">
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="grid grid-cols-6 gap-1">
                    {QUICK_EMOJIS.map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-lg"
                        onClick={() => handleEmoji(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">Quick phrases</p>
                    <div className="flex flex-wrap gap-1">
                      {QUICK_PHRASES.map((phrase) => (
                        <Button
                          key={phrase}
                          variant="outline"
                          size="sm"
                          className="text-xs h-6 px-2"
                          onClick={() => handleQuickPhrase(phrase)}
                        >
                          {phrase}
                        </Button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 h-9"
                maxLength={200}
              />
              <Button type="submit" size="icon" className="h-9 w-9 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
