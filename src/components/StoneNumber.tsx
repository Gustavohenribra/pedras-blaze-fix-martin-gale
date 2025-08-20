import { cn } from "@/lib/utils";

interface StoneNumberProps {
  number: number;
  className?: string;
}

export function StoneNumber({ number, className }: StoneNumberProps) {
  const isRed = number >= 1 && number <= 7;
  const isBlack = number >= 8 && number <= 14;

  return (
    <div
      className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white transition-all duration-300 hover:scale-110 hover-glow cursor-pointer shadow-lg animate-scale-in",
        {
          "bg-stone-red hover:bg-stone-red-hover shadow-red-500/20": isRed,
          "bg-stone-black hover:bg-stone-black-hover border border-border shadow-slate-500/20": isBlack,
        },
        className
      )}
    >
      <span className="drop-shadow-sm">{number}</span>
    </div>
  );
}