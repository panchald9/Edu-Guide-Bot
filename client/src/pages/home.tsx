import { useEffect, useMemo, useRef, useState } from "react";
import { useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useConversation } from "@/hooks/use-conversations";
import { ChatAttachmentPayload, useChatStream } from "@/hooks/use-chat-stream";
import { ChatSidebar } from "@/components/chat/sidebar";
import { MessageBubble } from "@/components/chat/message-bubble";
import { LoadingDots } from "@/components/chat/loading-dots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Send, Sparkles, AlertCircle, Plus, FileText, Image as ImageIcon, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { type Message } from "@shared/models/chat";

type PendingAttachment = ChatAttachmentPayload & {
  size: number;
};

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_EXTRACTED_TEXT_CHARS = 12000;
const MAX_IMAGE_DATAURL_CHARS = 1_500_000;
const MAX_REQUEST_CHARS = 8_000_000;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

async function optimizeImageDataUrl(file: File): Promise<string> {
  const original = await readAsDataUrl(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("image decode failed"));
      el.src = original;
    });

    const maxDim = 1280;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;

    ctx.drawImage(img, 0, 0, width, height);
    const compressed = canvas.toDataURL("image/jpeg", 0.72);
    if (compressed.length <= MAX_IMAGE_DATAURL_CHARS) {
      return compressed;
    }
    // fallback second pass
    return canvas.toDataURL("image/jpeg", 0.58);
  } catch {
    return original;
  }
}

function decodePdfString(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .replace(/\\t/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

function extractPdfText(buffer: ArrayBuffer): string {
  const raw = new TextDecoder("latin1").decode(new Uint8Array(buffer));
  const lines: string[] = [];

  const simpleRegex = /\(([^()]*)\)\s*Tj/g;
  let simpleMatch: RegExpExecArray | null = null;
  while ((simpleMatch = simpleRegex.exec(raw)) !== null) {
    const text = decodePdfString(simpleMatch[1] || "").trim();
    if (text) lines.push(text);
  }

  const arrayRegex = /\[([\s\S]*?)\]\s*TJ/g;
  let arrayMatch: RegExpExecArray | null = null;
  while ((arrayMatch = arrayRegex.exec(raw)) !== null) {
    const section = arrayMatch[1] || "";
    const partRegex = /\(([^()]*)\)/g;
    let part: RegExpExecArray | null = null;
    let merged = "";
    while ((part = partRegex.exec(section)) !== null) {
      merged += decodePdfString(part[1] || "");
    }
    merged = merged.trim();
    if (merged) lines.push(merged);
  }

  return lines.join("\n").slice(0, MAX_EXTRACTED_TEXT_CHARS);
}

function isTextFile(file: File): boolean {
  if (file.type.startsWith("text/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return ["md", "txt", "csv", "json", "ts", "tsx", "js", "jsx", "py", "java", "cpp", "c", "html", "css"].includes(ext);
}

async function toAttachment(file: File): Promise<PendingAttachment | null> {
  const id = `${file.name}-${file.size}-${file.lastModified}`;

  if (file.type.startsWith("image/")) {
    const dataUrl = await optimizeImageDataUrl(file);
    return {
      id,
      name: file.name,
      mimeType: file.type,
      type: "image",
      dataUrl,
      size: file.size,
    };
  }

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const buffer = await file.arrayBuffer();
    const extractedText = extractPdfText(buffer);
    return {
      id,
      name: file.name,
      mimeType: file.type || "application/pdf",
      type: "pdf",
      extractedText,
      size: file.size,
    };
  }

  if (isTextFile(file)) {
    const extractedText = (await readAsText(file)).slice(0, MAX_EXTRACTED_TEXT_CHARS);
    return {
      id,
      name: file.name,
      mimeType: file.type || "text/plain",
      type: "text",
      extractedText,
      size: file.size,
    };
  }

  return null;
}

export default function HomePage() {
  const [match, params] = useRoute("/chat/:id");
  const conversationId = match && params?.id ? parseInt(params.id) : null;

  const { user } = useAuth();
  const { data: conversation, isLoading: isConvLoading, error: convError } = useConversation(conversationId);
  const { toast } = useToast();

  const [inputValue, setInputValue] = useState("");
  const [streamedContent, setStreamedContent] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const examplePrompts = useMemo(
    () => [
      "What's the difference between C and C++?",
      "Explain quantum physics in simple terms",
      "Compare Python vs JavaScript",
      "How does photosynthesis work?",
    ],
    [],
  );

  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (conversation?.messages) {
      setLocalMessages(conversation.messages);
    } else {
      setLocalMessages([]);
    }
    setStreamedContent("");
  }, [conversation?.messages, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, streamedContent]);

  const { sendMessage, isLoading: isStreaming } = useChatStream({
    conversationId: conversationId || 0,
    onChunk: (chunk) => {
      setStreamedContent((prev) => prev + chunk);
    },
  });

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList) return;

    const files = Array.from(fileList);
    const availableSlots = MAX_FILES - pendingAttachments.length;
    if (availableSlots <= 0) {
      toast({
        title: "Upload limit reached",
        description: `You can attach up to ${MAX_FILES} files per message.`,
        variant: "destructive",
      });
      return;
    }

    const accepted = files.slice(0, availableSlots);
    const nextAttachments: PendingAttachment[] = [];

    for (const file of accepted) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB.`,
          variant: "destructive",
        });
        continue;
      }

      try {
        const converted = await toAttachment(file);
        if (!converted) {
          toast({
            title: "Unsupported file",
            description: `${file.name} is not supported. Use image, PDF, or text/code files.`,
            variant: "destructive",
          });
          continue;
        }
        if (converted.type === "image" && (converted.dataUrl?.length || 0) > MAX_IMAGE_DATAURL_CHARS) {
          toast({
            title: "Image too large",
            description: `${file.name} is still too large after compression. Use a smaller image.`,
            variant: "destructive",
          });
          continue;
        }
        nextAttachments.push(converted);
      } catch {
        toast({
          title: "Upload failed",
          description: `Could not read ${file.name}.`,
          variant: "destructive",
        });
      }
    }

    if (nextAttachments.length > 0) {
      setPendingAttachments((prev) => {
        const seen = new Set(prev.map((a) => a.id));
        const merged = [...prev];
        for (const att of nextAttachments) {
          if (!seen.has(att.id)) merged.push(att);
        }
        return merged.slice(0, MAX_FILES);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId || isStreaming || isConvLoading) return;

    const content = inputValue.trim();
    if (!content && pendingAttachments.length === 0) return;

    const hasReadableAttachment = pendingAttachments.some(
      (att) =>
        (att.type === "image" && Boolean(att.dataUrl)) ||
        ((att.type === "pdf" || att.type === "text") && Boolean(att.extractedText?.trim())),
    );

    if (!content && pendingAttachments.length > 0 && !hasReadableAttachment) {
      toast({
        title: "File could not be read",
        description: "Could not extract usable text from the file. Try a text PDF, image screenshot, or paste the key text.",
        variant: "destructive",
      });
      return;
    }

    setInputValue("");

    const attachmentLabel =
      pendingAttachments.length > 0
        ? `\n\nAttached: ${pendingAttachments.map((a) => a.name).join(", ")}`
        : "";

    const tempMessage: any = {
      id: Date.now(),
      role: "user",
      content: `${content}${attachmentLabel}`.trim(),
      createdAt: new Date().toISOString(),
      conversationId,
    };

    setLocalMessages((prev) => [...prev, tempMessage]);

    const payload: ChatAttachmentPayload[] = pendingAttachments.map(({ size, ...rest }) => rest);
    const estimatedRequestChars = JSON.stringify({ content, attachments: payload }).length;
    if (estimatedRequestChars > MAX_REQUEST_CHARS) {
      toast({
        title: "Request too large",
        description: "Attached files are too large. Remove some files or use smaller images.",
        variant: "destructive",
      });
      return;
    }
    setPendingAttachments([]);

    const promptWithAttachmentContext =
      payload.length > 0
        ? `${content}\n\nPlease answer based on attached files first.`.trim()
        : content;

    await sendMessage(promptWithAttachmentContext, payload);
  };

  const removeAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    await addFiles(e.dataTransfer.files);
  };

  if (!conversationId) {
    return (
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        <ChatSidebar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-50/50 via-primary/5 to-purple-50/50 dark:from-slate-900/50 dark:via-primary/5 dark:to-purple-900/50">
          <div className="max-w-md space-y-6 animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-4xl font-bold font-serif bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Hello, {user?.firstName || "Learner"}!
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Select a conversation from the sidebar or start a new chat to begin your learning journey.
            </p>
            <div className="pt-4 flex flex-col gap-2 text-sm text-muted-foreground">
              <p className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Ask questions on any topic
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Get detailed explanations
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                Compare concepts with tables
              </p>
            </div>
            <div className="pt-6">
              <p className="text-sm font-semibold mb-3 text-foreground">Try asking:</p>
              <div className="grid gap-2">
                {examplePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInputValue(prompt)}
                    className="text-left px-4 py-3 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-sm text-muted-foreground hover:text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <ChatSidebar />

      <div className="flex-1 flex flex-col h-full relative bg-gradient-to-b from-background to-slate-50/30 dark:to-slate-900/30">
        <header className="h-16 border-b border-border/50 flex items-center px-6 bg-background/95 backdrop-blur-md z-10 sticky top-0 shadow-sm">
          <div className="ml-10 md:ml-0">
            <h1 className="font-semibold truncate max-w-[200px] sm:max-w-md text-lg">{conversation?.title || "Chat"}</h1>
            <p className="text-xs text-muted-foreground">AI-Powered Learning Assistant</p>
          </div>
        </header>

        <ScrollArea className="flex-1 p-4 md:p-6">
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {isConvLoading ? (
              <div className="flex flex-col gap-4 mt-8">
                <div className="h-12 w-3/4 bg-muted rounded-xl animate-pulse" />
                <div className="h-24 w-full bg-muted rounded-xl animate-pulse" />
                <div className="h-16 w-1/2 bg-muted rounded-xl animate-pulse self-end" />
              </div>
            ) : convError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Failed to load conversation.</AlertDescription>
              </Alert>
            ) : (
              <>
                {localMessages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    role={msg.role as "user" | "assistant"}
                    content={msg.content}
                    createdAt={msg.createdAt}
                  />
                ))}
                {streamedContent && <MessageBubble role="assistant" content={streamedContent} isStreaming={true} />}
                {isStreaming && !streamedContent && (
                  <div className="bg-card border border-border/50 shadow-sm mr-auto rounded-2xl p-4 w-fit">
                    <LoadingDots />
                  </div>
                )}
                <div ref={bottomRef} className="h-4" />
              </>
            )}
          </div>
        </ScrollArea>

        <div
          className={`p-4 border-t border-border/50 bg-background/95 backdrop-blur-md shadow-lg transition-colors ${isDragOver ? "bg-primary/5" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragOver(false);
          }}
          onDrop={handleDrop}
        >
          <div className="max-w-3xl mx-auto">
            {pendingAttachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {pendingAttachments.map((att) => (
                  <div key={att.id} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs">
                    {att.type === "image" ? <ImageIcon size={14} /> : <FileText size={14} />}
                    <span className="max-w-[180px] truncate">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${att.name}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept="image/*,.pdf,.txt,.md,.csv,.json,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.html,.css"
                onChange={async (e) => {
                  await addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming || isConvLoading}
                className="h-10 w-10 rounded-lg"
                aria-label="Upload files"
              >
                <Plus size={18} />
              </Button>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onPaste={async (e) => {
                  const files = e.clipboardData?.files;
                  if (files && files.length > 0) {
                    e.preventDefault();
                    await addFiles(files);
                  }
                }}
                placeholder="Ask anything... Add image/PDF/text with +, paste, or drag and drop"
                className="pr-12 py-6 rounded-xl shadow-md border-border/50 focus-visible:ring-primary/30 focus-visible:ring-2 text-base transition-all"
                disabled={isStreaming || isConvLoading}
                autoFocus
              />
              <Button
                type="submit"
                size="icon"
                disabled={(!inputValue.trim() && pendingAttachments.length === 0) || isStreaming || isConvLoading}
                className="absolute right-2 h-10 w-10 rounded-lg shadow-md hover:scale-110 hover:shadow-lg transition-all duration-200"
              >
                <Send size={18} />
              </Button>
            </form>
            <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
              <Sparkles size={12} className="text-primary" />
              Supports upload, paste, and drag-drop for image/PDF/text files.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
