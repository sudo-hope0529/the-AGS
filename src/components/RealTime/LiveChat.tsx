import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
}

interface LiveChatProps {
  channelId: string;
  currentUser: {
    id: string;
    name: string;
    avatar: string;
  };
}

export const LiveChat: React.FC<LiveChatProps> = ({ channelId, currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load initial messages
    loadMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`chat:${channelId}`)
      .on('INSERT', { event: 'message' }, ({ new: message }) => {
        setMessages(prev => [...prev, message]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channelId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      channel_id: channelId,
      user_id: currentUser.id,
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    const { error } = await supabase.from('messages').insert([message]);

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-lg shadow">
      {/* Chat Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Live Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.user.id === currentUser.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] ${
                message.user.id === currentUser.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100'
              } rounded-lg p-3`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <img
                  src={message.user.avatar}
                  alt={message.user.name}
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-medium">{message.user.name}</span>
              </div>
              <p>{message.content}</p>
              <span className="text-xs opacity-75">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default LiveChat;
