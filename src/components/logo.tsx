import { Bot } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2 p-2">
      <Bot className="h-7 w-7 text-primary" />
      <h1 className="text-xl font-bold text-foreground">Market Miner</h1>
    </div>
  );
}
