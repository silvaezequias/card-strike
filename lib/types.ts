import React from "react";

export type CardCategory = "ARMA" | "BOMBA" | "DIVERSOS";

export interface Card {
  id: string | number;
  type: "item" | "utility";
  cardCategory: CardCategory;
  name: string;
  description: string;
  damage: number;
  healing: number;
  duration: number;
  isOffensive?: boolean;
  overlayText?: string;
  style?: React.CSSProperties;
  flyId?: number;
  team?: "police" | "faction" | "shared";
  teamOwner?: "police" | "faction";
}

export interface Rotation {
  x: number;
  y: number;
  z: number;
}

export interface GameTheme {
  bg: string;
  textGeneric: string;
  accent: string;
  accentGlow: string;
  border: string;
  frameGradient: string;
  innerSurface: string;
  slotBg: string;
  slotItem: string;
  slotHover: string;
  orbInner: string;
  footer: string;
}
