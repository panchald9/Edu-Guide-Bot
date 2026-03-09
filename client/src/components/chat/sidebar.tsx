import { Link, useLocation } from 'wouter';
import { useConversations, useCreateConversation, useDeleteConversation } from '@/hooks/use-conversations';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Plus, MessageSquare, Trash2, LogOut, Menu, X, GraduationCap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

export function ChatSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: conversations, isLoading } = useConversations();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const { logout, user } = useAuth();
  const [location, setLocation] = useLocation();

  const handleCreate = async () => {
    createConversation.mutate(undefined, {
      onSuccess: (newConv) => {
        setLocation(`/chat/${newConv.id}`);
        setIsOpen(false);
      }
    });
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chat?')) {
      deleteConversation.mutate(id);
      if (location.includes(String(id))) {
        setLocation('/');
      }
    }
  };

  const Content = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50/80 to-slate-100/50 dark:from-slate-950/80 dark:to-slate-900/50">
      <div className="p-4 border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-6 text-primary">
          <div className="p-2 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold font-serif text-foreground">EduBot</span>
        </div>
        
        <Button 
          onClick={handleCreate} 
          disabled={createConversation.isPending}
          className="w-full justify-start gap-2 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
          size="lg"
        >
          <Plus size={18} />
          {createConversation.isPending ? 'Creating...' : 'New Chat'}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {isLoading ? (
            <div className="text-sm text-muted-foreground p-4 text-center">Loading chats...</div>
          ) : conversations?.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 text-center">No chats yet. Start learning!</div>
          ) : (
            conversations?.map((conv) => (
              <Link 
                key={conv.id} 
                href={`/chat/${conv.id}`}
                className={cn(
                  "group flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all hover:bg-white/80 dark:hover:bg-slate-800/80 relative hover:scale-[1.02] hover:shadow-sm",
                  location === `/chat/${conv.id}` 
                    ? "bg-white dark:bg-slate-800 text-primary shadow-md border border-primary/20" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setIsOpen(false)}
              >
                <MessageSquare size={16} />
                <span className="truncate flex-1">{conv.title || 'New Chat'}</span>
                
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 hover:text-red-600 rounded-md transition-all absolute right-2"
                >
                  <Trash2 size={14} />
                </button>
              </Link>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3 mb-3 px-2 py-2 rounded-lg hover:bg-muted/50 transition-all">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {user?.firstName?.[0] || user?.email?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.firstName || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        {(user as any)?.isAdmin === "true" && (
          <Link href="/admin">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 mb-2 hover:bg-primary/10 hover:border-primary transition-all" 
              onClick={() => setIsOpen(false)}
            >
              <Shield size={16} />
              Admin Panel
            </Button>
          </Link>
        )}
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-all" 
          onClick={() => logout()}
        >
          <LogOut size={16} />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Trigger */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shadow-md">
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[300px]">
            <Content />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-[280px] h-screen border-r border-border/50 bg-slate-50/50 dark:bg-slate-950/50 flex-col shrink-0 shadow-xl">
        <Content />
      </div>
    </>
  );
}
