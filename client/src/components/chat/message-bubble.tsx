import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Bot, User, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string | Date;
  isStreaming?: boolean;
}

export function MessageBubble({ role, content, createdAt, isStreaming }: MessageBubbleProps) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group flex w-full gap-4 p-5 md:p-6 mb-4 rounded-2xl transition-all relative",
        isUser 
          ? "bg-gradient-to-br from-primary/8 to-purple-500/8 ml-auto md:max-w-[85%] border border-primary/20 shadow-sm" 
          : "bg-white dark:bg-slate-900 border border-border/50 shadow-md hover:shadow-lg mr-auto md:max-w-[95%]"
      )}
    >
      <div className={cn(
        "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-md",
        isUser ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground" : "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
      )}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {isUser ? "You" : "AI Tutor"}
            </span>
            {createdAt && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(createdAt), 'h:mm a')}
              </span>
            )}
          </div>
          {!isUser && !isStreaming && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </Button>
          )}
        </div>
        
        <div className={cn(
          "prose prose-sm md:prose-base max-w-none dark:prose-invert break-words",
          "prose-headings:font-semibold prose-headings:text-foreground prose-headings:mb-3 prose-headings:mt-4",
          "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
          "prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:my-2",
          "prose-strong:text-foreground prose-strong:font-semibold",
          "prose-ul:my-3 prose-ol:my-3 prose-li:my-1.5 prose-li:text-foreground/90",
          "prose-table:border-separate prose-table:border-spacing-0 prose-table:w-full prose-table:my-6 prose-table:shadow-lg prose-table:rounded-xl prose-table:overflow-hidden prose-table:border prose-table:border-border/50",
          "prose-thead:bg-gradient-to-r prose-thead:from-primary/15 prose-thead:via-purple-500/15 prose-thead:to-primary/15",
          "prose-th:bg-transparent prose-th:p-4 prose-th:text-left prose-th:font-bold prose-th:border-b-2 prose-th:border-border prose-th:text-foreground prose-th:first:rounded-tl-xl prose-th:last:rounded-tr-xl",
          "prose-td:p-4 prose-td:border-b prose-td:border-border/30 prose-td:bg-background/50 prose-td:text-foreground/90",
          "prose-tr:transition-colors hover:prose-tr:bg-muted/20",
          "prose-tbody:prose-tr:last:prose-td:border-b-0",
          "prose-code:bg-muted/80 prose-code:px-2 prose-code:py-1 prose-code:rounded-md prose-code:text-sm prose-code:font-mono prose-code:text-primary prose-code:border prose-code:border-border/30",
          "prose-pre:bg-slate-950 prose-pre:text-slate-100 prose-pre:p-5 prose-pre:rounded-xl prose-pre:overflow-x-auto prose-pre:shadow-inner prose-pre:border prose-pre:border-slate-800 prose-pre:my-4",
          "prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:my-4",
          "prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium",
          "prose-img:rounded-lg prose-img:shadow-md",
          isUser ? "text-foreground/90" : "text-foreground"
        )}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({node, ...props}) => (
                <img 
                  {...props} 
                  className="rounded-lg shadow-md max-w-full h-auto my-4" 
                  loading="lazy"
                  alt={props.alt || 'Generated image'}
                />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 align-middle bg-primary animate-pulse" />
          )}
        </div>
      </div>
    </motion.div>
  );
}
