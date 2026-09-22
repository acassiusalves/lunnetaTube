import { Bot } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2 p-2 min-w-0">
      <Bot className="h-7 w-7 text-primary shrink-0" />
      <h1 className="text-xl font-bold text-foreground truncate">Analisador de Mercado</h1>
    </div>
  );
}
