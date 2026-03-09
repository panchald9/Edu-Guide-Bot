export function LoadingDots() {
  return (
    <div className="flex space-x-1.5 p-2">
      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
    </div>
  );
}
