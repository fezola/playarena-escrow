import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle, X, Smile, Sticker } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import stickers
import trophySticker from '@/assets/stickers/trophy.png';
import lolSticker from '@/assets/stickers/lol.png';
import ggFireSticker from '@/assets/stickers/gg-fire.png';
import cryingSticker from '@/assets/stickers/crying.png';
import coolSticker from '@/assets/stickers/cool.png';
import rageSticker from '@/assets/stickers/rage.png';
import crownSticker from '@/assets/stickers/crown.png';
import partySticker from '@/assets/stickers/party.png';
import thinkingSticker from '@/assets/stickers/thinking.png';
import shockedSticker from '@/assets/stickers/shocked.png';
import sleepySticker from '@/assets/stickers/sleepy.png';
import flexSticker from '@/assets/stickers/flex.png';

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

const QUICK_EMOJIS = ['😀', '😂', '🎉', '👍', '👎', '🔥', '💪', '🤔', '😱', '🎮', '🏆', '💀', '😎', '🤣', '❤️', '💯', '🙌', '😤'];

// Real image stickers
const IMAGE_STICKERS = {
  reactions: [
    { id: 'trophy', src: trophySticker, label: 'Trophy' },
    { id: 'lol', src: lolSticker, label: 'LOL' },
    { id: 'cool', src: coolSticker, label: 'Cool' },
    { id: 'thinking', src: thinkingSticker, label: 'Thinking' },
    { id: 'shocked', src: shockedSticker, label: 'Shocked' },
    { id: 'crying', src: cryingSticker, label: 'Crying' },
  ],
  gaming: [
    { id: 'gg-fire', src: ggFireSticker, label: 'GG' },
    { id: 'rage', src: rageSticker, label: 'Rage' },
    { id: 'crown', src: crownSticker, label: 'Crown' },
    { id: 'flex', src: flexSticker, label: 'Flex' },
  ],
  celebration: [
    { id: 'party', src: partySticker, label: 'Party' },
    { id: 'sleepy', src: sleepySticker, label: 'Sleepy' },
  ],
};

// Prefix to identify sticker messages
const STICKER_PREFIX = '[STICKER]:';

export function MatchChat({ matchId, currentPlayerId }: MatchChatProps) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stickerTab, setStickerTab] = useState('reactions');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
        setTimeout(scrollToBottom, 100);
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
          setTimeout(scrollToBottom, 100);
          
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

  // Scroll to bottom when messages change or chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages.length]);

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

  const handleEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleSticker = (stickerId: string) => {
    sendMessage(`${STICKER_PREFIX}${stickerId}`);
  };

  // Find sticker by ID
  const getStickerById = (id: string) => {
    const allStickers = [
      ...IMAGE_STICKERS.reactions,
      ...IMAGE_STICKERS.gaming,
      ...IMAGE_STICKERS.celebration,
    ];
    return allStickers.find((s) => s.id === id);
  };

  // Check if message is a sticker
  const isSticker = (message: string) => {
    return message.startsWith(STICKER_PREFIX);
  };

  // Get sticker ID from message
  const getStickerId = (message: string) => {
    return message.replace(STICKER_PREFIX, '');
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
        <div className="fixed bottom-20 right-4 z-50 w-80 h-[60vh] max-h-[450px] bg-card border border-border rounded-lg shadow-xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50 shrink-0">
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

          {/* Messages - Scrollable */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-3 space-y-3"
          >
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                No messages yet. Say hello! 👋
              </p>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.player_id === currentPlayerId;
                const msgIsSticker = isSticker(msg.message);
                
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
                    {msgIsSticker ? (
                      <div className="w-24 h-24">
                        {(() => {
                          const sticker = getStickerById(getStickerId(msg.message));
                          if (sticker) {
                            return (
                              <img 
                                src={sticker.src} 
                                alt={sticker.label}
                                className="w-full h-full object-contain animate-scale-in"
                              />
                            );
                          }
                          return <span className="text-muted-foreground text-xs">Sticker</span>;
                        })()}
                      </div>
                    ) : (
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
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-border shrink-0">
            <div className="flex gap-2">
              {/* Emoji Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start" side="top">
                  <p className="text-xs text-muted-foreground mb-2">Emojis</p>
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
                </PopoverContent>
              </Popover>

              {/* Sticker Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                    <Sticker className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-2" align="start" side="top">
                  <Tabs value={stickerTab} onValueChange={setStickerTab}>
                    <TabsList className="grid w-full grid-cols-3 h-8">
                      <TabsTrigger value="reactions" className="text-xs">Reactions</TabsTrigger>
                      <TabsTrigger value="gaming" className="text-xs">Gaming</TabsTrigger>
                      <TabsTrigger value="celebration" className="text-xs">Party</TabsTrigger>
                    </TabsList>
                    <TabsContent value="reactions" className="mt-2">
                      <div className="grid grid-cols-3 gap-2">
                        {IMAGE_STICKERS.reactions.map((sticker) => (
                          <Button
                            key={sticker.id}
                            variant="ghost"
                            size="sm"
                            className="h-16 w-16 p-1 hover:bg-muted"
                            onClick={() => handleSticker(sticker.id)}
                            title={sticker.label}
                          >
                            <img 
                              src={sticker.src} 
                              alt={sticker.label}
                              className="w-full h-full object-contain"
                            />
                          </Button>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="gaming" className="mt-2">
                      <div className="grid grid-cols-3 gap-2">
                        {IMAGE_STICKERS.gaming.map((sticker) => (
                          <Button
                            key={sticker.id}
                            variant="ghost"
                            size="sm"
                            className="h-16 w-16 p-1 hover:bg-muted"
                            onClick={() => handleSticker(sticker.id)}
                            title={sticker.label}
                          >
                            <img 
                              src={sticker.src} 
                              alt={sticker.label}
                              className="w-full h-full object-contain"
                            />
                          </Button>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="celebration" className="mt-2">
                      <div className="grid grid-cols-3 gap-2">
                        {IMAGE_STICKERS.celebration.map((sticker) => (
                          <Button
                            key={sticker.id}
                            variant="ghost"
                            size="sm"
                            className="h-16 w-16 p-1 hover:bg-muted"
                            onClick={() => handleSticker(sticker.id)}
                            title={sticker.label}
                          >
                            <img 
                              src={sticker.src} 
                              alt={sticker.label}
                              className="w-full h-full object-contain"
                            />
                          </Button>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
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