import { GameEngine } from "@/game/useGameEngine";
import { useGameTheme } from "@/game/useGameTheme";

export const HUDPanel = ({
  icon,
  title,
  children,
  game,
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
  const theme = useGameTheme(game.state.currentTeam);

  return (
    <div
      className={`relative w-full max-w-[250px] h-auto ${danger ? "border-red-600 bg-red-950/50 border-2 animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.4)]" : theme.overlayScrimNoHover} rounded-xl p-4 flex flex-col items-center gap-4 shadow-2xl overflow-hidden group ${className}`}
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
  const textColor = danger ? "text-red-500" : "text-zinc-500";

  return (
    <div
      className={`w-full flex justify-between items-center text-[10px] tracking-widest ${textColor} border-b border-zinc-800 pb-2`}
    >
      <span>{title}</span>
      {icon}
    </div>
  );
};
