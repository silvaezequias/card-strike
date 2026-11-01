import { GameEngine } from "@/game/useGameEngine";

export const HUDPanel = ({
  icon,
  title,
  children,
  className,
  danger,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  game: GameEngine;
  className?: string;
  danger?: boolean;
}) => {
  return (
    <div
      className={`relative w-full max-w-[250px] h-auto ${danger ? "border-red-600 border-2 animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.4)]" : ""} rounded-xl p-4 flex flex-col items-center gap-4 overflow-hidden group [text-shadow:0_1px_3px_rgba(0,0,0,0.9)] ${className}`}
    >
      <Header title={title} icon={icon} />
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 py-4">
        {children}
      </div>
    </div>
  );
};

export const Header = ({
  title,
  icon,
  danger,
}: {
  title: string;
  icon: React.ReactNode;
  danger?: boolean;
}) => {
  const textColor = danger ? "text-red-500" : "text-zinc-300";

  return (
    <div
      className={`w-full flex justify-between items-center text-[10px] tracking-widest ${textColor} border-b border-white/20 pb-2`}
    >
      <span>{title}</span>
      {icon}
    </div>
  );
};
