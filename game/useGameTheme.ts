import { TeamName } from "./game-types";

export type ThemeMap = Record<TeamName, Record<string, string>>;

export const policeTheme = {
  text: "text-blue-400",
  text20: "text-blue-400/20",
  textSecondary: "text-cyan-500",

  frameGradient: "from-zinc-950 to-slate-800",
  border: "border-blue-500",
  borderSecondary: "border-cyan-500",
  background: "bg-zinc-950",
  teamBackground: "bg-blue-500",
  slotBg: "bg-slate-800/50",
  slotItem: "from-slate-800 to-black",
  slotHover: "hover:border-blue-500/50",
  orbInner: "border-blue-600/30",

  innerSurface: "bg-zinc-950",
  underlay: "bg-slate-800/50 backdrop-blur-sm border-slate-600 text-blue-400",
  overlay: "from-black to-zinc-800 border-zinc-600",
  overlayScrim: "bg-blue-900/20 hover:bg-blue-900/40",
  overlayScrimNoHover: "bg-blue-900/20",
  overlayScrimSecondary: "bg-cyan-900/20 hover:bg-cyan-900/40",

  footer: "from-slate-700 to-slate-800",
};

const factionTheme: typeof policeTheme = {
  text: "text-red-400",
  text20: "text-red-400/20",
  textSecondary: "text-orange-400",
  frameGradient: "from-zinc-950 to-black",
  border: "border-red-500",
  borderSecondary: "border-orange-500",
  background: "bg-zinc-950",
  teamBackground: "bg-red-500",
  slotBg: "bg-red-950/30",
  slotItem: "from-red-950 to-black",
  slotHover: "hover:border-red-500/50",
  orbInner: "border-red-600/30",

  innerSurface: "bg-zinc-950",
  underlay: "bg-red-950/50 backdrop-blur-sm border-red-800 text-red-400",
  overlay: "from-black to-zinc-950 border-zinc-600",
  overlayScrim: "bg-red-900/20 hover:bg-red-900/40",
  overlayScrimNoHover: "bg-red-900/20",
  overlayScrimSecondary: "bg-orange-900/20 hover:bg-orange-900/40",

  footer: "from-zinc-800 to-red-950",
};

const themeMap = {
  police: policeTheme,
  faction: factionTheme,
};

export const useGameTheme = (team: TeamName) => {
  return themeMap[team];
};
