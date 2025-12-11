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

// Stickers - using emoji combinations and unicode art as stickers
const STICKERS = {
  reactions: [
    { id: 'winner', emoji: '🏆✨', label: 'Winner' },
    { id: 'loser', emoji: '😭💔', label: 'Lost' },
    { id: 'gg', emoji: '🤝🎮', label: 'GG' },
    { id: 'fire', emoji: '🔥🔥🔥', label: 'Fire' },
    { id: 'clap', emoji: '👏👏👏', label: 'Clapping' },
    { id: 'mind-blown', emoji: '🤯💥', label: 'Mind Blown' },
    { id: 'flexing', emoji: '💪😤', label: 'Flexing' },
    { id: 'crying', emoji: '😢😢', label: 'Crying' },
    { id: 'laughing', emoji: '🤣😂🤣', label: 'LOL' },
    { id: 'shocked', emoji: '😱😱', label: 'Shocked' },
    { id: 'thinking', emoji: '🤔💭', label: 'Thinking' },
    { id: 'cool', emoji: '😎✌️', label: 'Cool' },
  ],
  taunts: [
    { id: 'easy', emoji: '😏💅', label: 'Easy' },
    { id: 'bye', emoji: '👋😜', label: 'Bye Bye' },
    { id: 'sleep', emoji: '😴💤', label: 'Sleepy' },
    { id: 'bored', emoji: '🥱😑', label: 'Bored' },
    { id: 'slow', emoji: '🐢💨', label: 'Slow' },
    { id: 'scared', emoji: '🏃💨', label: 'Running' },
    { id: 'trash', emoji: '🗑️😂', label: 'Trash' },
    { id: 'noob', emoji: '👶🎮', label: 'Noob' },
  ],
  celebration: [
    { id: 'party', emoji: '🎉🥳🎊', label: 'Party' },
    { id: 'confetti', emoji: '🎊✨🎊', label: 'Confetti' },
    { id: 'dancing', emoji: '💃🕺', label: 'Dancing' },
    { id: 'champagne', emoji: '🍾🥂', label: 'Champagne' },
    { id: 'money', emoji: '💰💵💰', label: 'Money' },
    { id: 'rocket', emoji: '🚀🌟', label: 'Rocket' },
    { id: 'crown', emoji: '👑✨', label: 'Crown' },
    { id: 'diamond', emoji: '💎💎', label: 'Diamond' },
  ],
  animated: [
    { id: 'spin', emoji: '🔄🌀🔄', label: 'Spinning', animated: true },
    { id: 'heartbeat', emoji: '💓💗💓', label: 'Heartbeat', animated: true },
    { id: 'explosion', emoji: '💥⭐💥', label: 'Explosion', animated: true },
    { id: 'wave', emoji: '🌊🏄🌊', label: 'Wave', animated: true },
    { id: 'sparkle', emoji: '✨⭐✨', label: 'Sparkle', animated: true },
    { id: 'lightning', emoji: '⚡🌩️⚡', label: 'Lightning', animated: true },
    { id: 'rainbow', emoji: '🌈✨🌈', label: 'Rainbow', animated: true },
    { id: 'disco', emoji: '🪩🎶🪩', label: 'Disco', animated: true },
  ],
};

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

  const handleSticker = (stickerEmoji: string) => {
    sendMessage(stickerEmoji);
  };

  const isSticker = (message: string) => {
    // Check if message is a sticker (multiple emojis, short length, no regular text)
    const emojiRegex = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FAFF}\u{200D}\u{FE0F}\s]+$/u;
    return emojiRegex.test(message) && message.length <= 15;
  };

  const getStickerAnimation = (message: string) => {
    const animatedSticker = STICKERS.animated.find(s => s.emoji === message);
    if (animatedSticker) {
      return 'animate-bounce';
    }
    return '';
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
                const animation = getStickerAnimation(msg.message);
                
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
                      <div className={cn("text-4xl", animation)}>
                        {msg.message}
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
                    <TabsList className="grid w-full grid-cols-4 h-8">
                      <TabsTrigger value="reactions" className="text-xs">React</TabsTrigger>
                      <TabsTrigger value="taunts" className="text-xs">Taunt</TabsTrigger>
                      <TabsTrigger value="celebration" className="text-xs">Party</TabsTrigger>
                      <TabsTrigger value="animated" className="text-xs">Animated</TabsTrigger>
                    </TabsList>
                    <TabsContent value="reactions" className="mt-2">
                      <div className="grid grid-cols-4 gap-1">
                        {STICKERS.reactions.map((sticker) => (
                          <Button
                            key={sticker.id}
                            variant="ghost"
                            size="sm"
                            className="h-12 p-0 text-xl hover:bg-muted flex flex-col"
                            onClick={() => handleSticker(sticker.emoji)}
                            title={sticker.label}
                          >
                            <span>{sticker.emoji}</span>
                          </Button>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="taunts" className="mt-2">
                      <div className="grid grid-cols-4 gap-1">
                        {STICKERS.taunts.map((sticker) => (
                          <Button
                            key={sticker.id}
                            variant="ghost"
                            size="sm"
                            className="h-12 p-0 text-xl hover:bg-muted flex flex-col"
                            onClick={() => handleSticker(sticker.emoji)}
                            title={sticker.label}
                          >
                            <span>{sticker.emoji}</span>
                          </Button>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="celebration" className="mt-2">
                      <div className="grid grid-cols-4 gap-1">
                        {STICKERS.celebration.map((sticker) => (
                          <Button
                            key={sticker.id}
                            variant="ghost"
                            size="sm"
                            className="h-12 p-0 text-xl hover:bg-muted flex flex-col"
                            onClick={() => handleSticker(sticker.emoji)}
                            title={sticker.label}
                          >
                            <span>{sticker.emoji}</span>
                          </Button>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="animated" className="mt-2">
                      <div className="grid grid-cols-4 gap-1">
                        {STICKERS.animated.map((sticker) => (
                          <Button
                            key={sticker.id}
                            variant="ghost"
                            size="sm"
                            className="h-12 p-0 text-xl hover:bg-muted flex flex-col animate-pulse"
                            onClick={() => handleSticker(sticker.emoji)}
                            title={sticker.label}
                          >
                            <span>{sticker.emoji}</span>
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