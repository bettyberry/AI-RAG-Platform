'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{
    document: string;
    page: number;
  }>;
}

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Hello! I\'m ready to help you understand your documents. Upload some PDFs on the Documents page, and then ask me anything about them. I\'ll provide answers based strictly on the content of your uploaded files.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasDocuments, setHasDocuments] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
const handleSendMessage = async () => {
  if (!input.trim() || isLoading) return;

  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: input,
  };

  const assistantMessageId = (Date.now() + 1).toString();

  const newMessages: Message[] = [
    ...messages,
    userMessage,
  ];

  setMessages([
    ...newMessages,
    {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    },
  ]);

  setInput('');
  setIsLoading(true);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // FIX: Send the array of messages wrapped in an object
      body: JSON.stringify({ messages: newMessages }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to get response');
    }

    if (!res.body) throw new Error('No response body');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let done = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value || new Uint8Array());

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: msg.content + chunkValue }
            : msg
        )
      );
    }
  } catch (err: any) {
    console.error('Chat Error:', err);
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === assistantMessageId
          ? { ...msg, content: `Error: ${err.message}. Please try again.` }
          : msg
      )
    );
  } finally {
    setIsLoading(false);
  }
};
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-auto p-8 space-y-6">
        <div className="max-w-3xl">
          {messages.length === 0 && !hasDocuments ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">No documents uploaded</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload documents on the Documents page to start asking questions
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className="flex gap-4 animate-in fade-in duration-300">
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user'
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="text-xs font-semibold">
                      {message.role === 'user' ? 'You' : 'AI'}
                    </span>
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 max-w-2xl">
                    <div
                      className={`rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-secondary text-foreground'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>

                      {/* Citations */}
                      {message.citations && message.citations.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                          <p className="text-xs font-medium opacity-75">Sources:</p>
                          {message.citations.map((citation, idx) => (
                            <a
                              key={idx}
                              href="#"
                              className="block text-xs hover:underline opacity-75 hover:opacity-100 transition-opacity"
                            >
                              📄 {citation.document} • Page {citation.page}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading State */}
              {isLoading && (
                <div className="flex gap-4 animate-in fade-in duration-300">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-muted">
                    <span className="text-xs font-semibold text-muted-foreground">AI</span>
                  </div>
                  <div className="flex-1 max-w-2xl space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/5" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background p-4 sm:p-8">
        <div className="max-w-3xl">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Ask a question about your documents..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent disabled:opacity-50"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="lg"
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            The AI will only answer based on the content of your uploaded documents
          </p>
        </div>
      </div>
    </div>
  );
}
