import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { buildUrl, api } from '@shared/routes';
import { useToast } from '@/hooks/use-toast';

interface UseChatStreamProps {
  conversationId: number;
  onChunk?: (content: string) => void;
  onFinish?: () => void;
}

export interface ChatAttachmentPayload {
  id: string;
  name: string;
  mimeType: string;
  type: "image" | "pdf" | "text";
  dataUrl?: string;
  extractedText?: string;
}

export function useChatStream({ conversationId, onChunk, onFinish }: UseChatStreamProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const sendMessage = useCallback(async (content: string, attachments?: ChatAttachmentPayload[]) => {
    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const url = buildUrl(api.conversations.messages.create.path, { id: conversationId });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, attachments: attachments || [] }),
        signal: abortControllerRef.current.signal,
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('Payload too large. Please upload smaller files or fewer images.');
        }
        throw new Error('Failed to send message');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.content) {
                onChunk?.(data.content);
              }
              
              if (data.done) {
                // finished
              }
              
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              console.error('Error parsing SSE chunk', e);
            }
          }
        }
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Streaming error:', error);
        toast({
          title: "Error",
          description: error?.message || "Failed to send message. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
      onFinish?.();
      // Invalidate to ensure we have the persisted message with correct ID
      queryClient.invalidateQueries({ queryKey: [api.conversations.get.path, conversationId] });
      queryClient.invalidateQueries({ queryKey: [api.conversations.list.path] });
    }
  }, [conversationId, onChunk, onFinish, queryClient, toast]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  return { sendMessage, stop, isLoading };
}
