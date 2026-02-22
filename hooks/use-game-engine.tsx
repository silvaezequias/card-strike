"use client";

import { useState, useEffect, useCallback } from "react";
import type { Card, Rotation, PlayerSetup } from "@/lib/types";
import {
  generateRandomCard,
  getD6Rotation,
  getSpinnerRotation,
} from "@/lib/game-helpers";
import { TabItem } from "@/components/game/board-tabs";
import { BombData } from "@/game/game-types";

export type GameEngine = {
  d6Result: number | null;
  spinnerResult: string | null;
  showWarZone: boolean;
  isBottomPanelDisabled: boolean;
  disabledTabs: { battlefieldTab: boolean; actionTab: boolean };
  boardActiveTab: TabItem["id"];
  policeName: string;
  factionName: string;
  isWarTheme: boolean;
  isBottomPanelOpen: boolean;
  turnPhase: "COUNTDOWN" | "BUYING" | "CHOOSING" | "ACTING";
  selectedTool: "d6" | "spinner";
  isRolling: boolean;
  rotation: Rotation;
  gameTime: number;
  countdown: number;
  roundCount: number;
  policeHP: number;
  factionHP: number;
  policePos: string | null;
  showCountdown: boolean;
  currentInventory: Card[];
  currentTeamPos: string | null;
  currentUtilitySlots: Card[];
  hasCollision: boolean | "" | null;
  gameOver: boolean;
  factionPos: string | null;
  bombData: BombData;
  currentBoardSlots: (Card | null)[];
  hasDrawnThisRound: boolean;
  isFlashed: boolean;
  techUtilitySlots: Card[];
  warUtilitySlots: Card[];
  targetSlot: number | null;
  playedCards: Card[];
  isSlotModalOpen: boolean;
  slotModalMode: "DECIDE" | "SELECT" | "DRAW";
  showActionModal: boolean;
  drawingDeck: "tech" | "war" | null;
  flyingCards: Card[];
  burnedCard: Card | null;
  setIsBottomPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsBottomPanelDisabled: React.Dispatch<React.SetStateAction<boolean>>;
  setDisabledTabs: (tabs: {
    battlefieldTab?: boolean;
    actionTab?: boolean;
  }) => void;
  setBoardActiveTab: (tabId: TabItem["id"]) => void;
  handleCountdownComplete: () => void;
  handleBuyCard: () => void;
  handleSkipBuy: () => void;
  handleTurnEnd: (
    newPolicePos?: string | null,
    newFactionPos?: string | null,
  ) => void;
  handlePlantBomb: () => void;
  setSelectedTool: React.Dispatch<React.SetStateAction<"d6" | "spinner">>;
  handleInventorySelect: (item: Card, index: number) => void;
  activateCard: () => void;
  proceedToReplace: () => void;
  handleKeepInHand: () => void;

  toggleBottomPanel: () => void;

  handleActionChoice: (tool: "d6" | "spinner") => void;
  rollTool: () => void;
  setShowWarZone: React.Dispatch<React.SetStateAction<boolean>>;
};

export const useGameEngine = (playerSetup?: PlayerSetup): GameEngine => {
  const policeName = playerSetup
    ? playerSetup.player1Team === "police"
      ? playerSetup.player1Name
      : playerSetup.player2Name
    : "POLICIA";
  const factionName = playerSetup
    ? playerSetup.player1Team === "faction"
      ? playerSetup.player1Name
      : playerSetup.player2Name
    : "FACCAO";

  const [showWarZone, setShowWarZone] = useState(true);
  const [isWarTheme, setIsWarTheme] = useState(false);
  const [disabledTabs, setDisabledTabs] = useState<{
    battlefieldTab: boolean;
    actionTab: boolean;
  }>({ battlefieldTab: false, actionTab: false });

  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(false);
  const [isBottomPanelDisabled, setIsBottomPanelDisabled] = useState(false);

  // PHASES: COUNTDOWN -> BUYING -> CHOOSING -> ACTING
  const [turnPhase, setTurnPhase] = useState<
    "COUNTDOWN" | "BUYING" | "CHOOSING" | "ACTING"
  >("COUNTDOWN");

  // Round countdown (3, 2, 1, GO)
  const [showCountdown, setShowCountdown] = useState(true);

  // Dice/Spinner
  const [selectedTool, setSelectedTool] = useState<"d6" | "spinner">("d6");
  const [d6Result, setD6Result] = useState<number | null>(null);
  const [spinnerResult, setSpinnerResult] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [rotation, setRotation] = useState<Rotation>({ x: 0, y: 0, z: 0 });

  // Timer & Rounds
  const [gameTime, setGameTime] = useState(0);
  const [countdown, setCountdown] = useState(60);
  const [roundCount, setRoundCount] = useState(1);

  // HP (Max 10)
  const [policeHP, setPoliceHP] = useState(10);
  const [factionHP, setFactionHP] = useState(10);

  // Positions & Bomb
  const [policePos, setPolicePos] = useState<string | null>(null);
  const [factionPos, setFactionPos] = useState<string | null>(null);
  const [bombData, setBombData] = useState<BombData>({
    planted: false,
    site: null,
    timer: 5,
    exploded: false,
  });

  // Card draw: 1 per round per team
  const [hasDrawnThisRound, setHasDrawnThisRound] = useState(false);

  // Gameplay Data
  const [techBoardSlots, setTechBoardSlots] = useState<(Card | null)[]>(
    Array(6).fill(null),
  );
  const [warBoardSlots, setWarBoardSlots] = useState<(Card | null)[]>(
    Array(6).fill(null),
  );
  const [techUtilitySlots, setTechUtilitySlots] = useState<Card[]>([]);
  const [warUtilitySlots, setWarUtilitySlots] = useState<Card[]>([]);

  const [techInventory, setTechInventory] = useState<Card[]>([]);
  const [warInventory, setWarInventory] = useState<Card[]>([]);

  // Modals & Selection
  const [targetSlot, setTargetSlot] = useState<number | null>(null);
  const [playedCards, setPlayedCards] = useState<Card[]>([]);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [slotModalMode, setSlotModalMode] = useState<
    "DECIDE" | "SELECT" | "DRAW"
  >("DECIDE");
  const [boardActiveTab, setBoardActiveTab] =
    useState<TabItem["id"]>("actionTab");

  // Action modal (dice/spinner)
  const [showActionModal, setShowActionModal] = useState(false);

  // Animation
  const [drawingDeck, setDrawingDeck] = useState<"tech" | "war" | null>(null);
  const [flyingCards, setFlyingCards] = useState<Card[]>([]);
  const [burnedCard, setBurnedCard] = useState<Card | null>(null);

  // --- DERIVED STATE ---
  const currentBoardSlots = isWarTheme ? warBoardSlots : techBoardSlots;
  const currentInventory = isWarTheme ? warInventory : techInventory;
  const currentTeamPos = isWarTheme ? factionPos : policePos;
  const currentUtilitySlots = isWarTheme ? warUtilitySlots : techUtilitySlots;
  const isFlashed = currentUtilitySlots.some((u) => u.name === "Flashbang");
  const hasCollision = policePos && factionPos && policePos === factionPos;
  const gameOver = bombData.exploded || policeHP <= 0 || factionHP <= 0;

  // Check if opponent has smoke active
  const opponentUtilitySlots = isWarTheme ? techUtilitySlots : warUtilitySlots;
  const selfUtilitySlots = isWarTheme ? warUtilitySlots : techUtilitySlots;
  const opponentHasSmoke = opponentUtilitySlots.some((u) => u.name === "Smoke");

  // --- LOGIC HELPERS ---
  const updateCurrentBoard = (newSlots: (Card | null)[]) => {
    if (isWarTheme) setWarBoardSlots(newSlots);
    else setTechBoardSlots(newSlots);
  };

  const updateCurrentInventory = (newInv: Card[]) => {
    if (isWarTheme) setWarInventory(newInv);
    else setTechInventory(newInv);
  };

  // --- EFFECTS ---

  // Game Timer
  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setGameTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver]);

  // --- ROUND COUNTDOWN ---
  const handleCountdownComplete = useCallback(() => {
    setShowCountdown(false);
    setTurnPhase("BUYING");
  }, []);

  // --- ACTION FUNCTIONS ---

  // Draw 1 card to inventory (buy phase)
  const handleBuyCard = () => {
    const inventory = isWarTheme ? warInventory : techInventory;

    if (hasDrawnThisRound || gameOver || inventory.length >= 3) return;

    const team = isWarTheme ? "war" : "tech";
    const setInventory = isWarTheme ? setWarInventory : setTechInventory;
    const newCard = generateRandomCard(isWarTheme, bombData.planted);
    const flyId = Date.now();

    setDrawingDeck(team);
    setFlyingCards((prev) => [...prev, { ...newCard, flyId }]);
    setHasDrawnThisRound(true);

    setTimeout(() => {
      setDrawingDeck(null);
      setFlyingCards((prev) => prev.filter((c) => c.flyId !== flyId));
      setInventory((prev) => [...prev, newCard]);
      // Automatically move to choosing after buying
      setTurnPhase("CHOOSING");
    }, 1000);
  };

  const handleSkipBuy = () => {
    setTurnPhase("CHOOSING");
  };

  const handleTurnEnd = (
    newPolicePos = policePos,
    newFactionPos = factionPos,
  ) => {
    setRoundCount((c) => c + 1);
    setCountdown(60);
    setHasDrawnThisRound(false);
    setShowActionModal(false);

    // Process utility effects per team
    const proc = (
      slots: Card[],
      setSlots: React.Dispatch<React.SetStateAction<Card[]>>,
      setHP: React.Dispatch<React.SetStateAction<number>>,
    ) => {
      const newSlots = slots
        .map((u) => ({ ...u, duration: (u.duration || 0) - 1 }))
        .filter((u) => (u.duration || 0) > 0);

      const hasSmoke = newSlots.some((u) => u.name === "Smoke");

      if (!hasSmoke) {
        const molotovCount = newSlots.filter(
          (u) => u.name === "Molotov",
        ).length;
        if (molotovCount > 0)
          setHP((prev) => Math.max(0, prev - 1 * molotovCount));
      }
      setSlots(newSlots);
    };
    proc(techUtilitySlots, setTechUtilitySlots, setPoliceHP);
    proc(warUtilitySlots, setWarUtilitySlots, setFactionHP);

    // Bomb timer
    if (bombData.planted && bombData.timer > 0 && !isWarTheme) {
      const newTimer = bombData.timer - 1;
      const isExploded = newTimer === 0;
      if (isExploded) {
        setPoliceHP((prev) => Math.max(0, prev - 10));
      }
      setBombData((prev) => ({
        ...prev,
        timer: newTimer,
        exploded: isExploded,
      }));
    }

    // Switch turns
    setIsWarTheme((prev) => !prev);
    setBoardActiveTab("actionTab");
    setDisabledTabs({ battlefieldTab: false, actionTab: false });
    setIsBottomPanelOpen(false);
    setD6Result(null);
    setSpinnerResult(null);

    // Start new round with countdown
    setShowCountdown(true);
    setTurnPhase("COUNTDOWN");
  };

  const handlePlantBomb = () => {
    if (isWarTheme && factionPos && !bombData.planted && !isFlashed) {
      setBombData((prev) => ({ ...prev, planted: true, site: factionPos }));
      handleTurnEnd();
    }
  };

  const throwToCenter = (card: Card) => {
    const randomRot = Math.floor(Math.random() * 40) - 20;
    const randomX = Math.floor(Math.random() * 20) - 10;
    const randomY = Math.floor(Math.random() * 20) - 10;
    setPlayedCards((prev) => [
      ...prev,
      {
        ...card,
        style: {
          transform: `translate(${randomX}px, ${randomY}px) rotate(${randomRot}deg)`,
          zIndex: prev.length,
        },
      },
    ]);
  };

  const handleUtilityCard = (card: Card) => {
    const targetIsWar = !isWarTheme;
    const setTargetSlots = targetIsWar
      ? setWarUtilitySlots
      : setTechUtilitySlots;
    const setTargetHP = targetIsWar ? setFactionHP : setPoliceHP;
    const setSelfHP = isWarTheme ? setFactionHP : setPoliceHP;
    const selfSlots = isWarTheme ? warUtilitySlots : techUtilitySlots;
    const setSelfSlots = isWarTheme ? setWarUtilitySlots : setTechUtilitySlots;
    const targetSlots = targetIsWar ? warUtilitySlots : techUtilitySlots;
    const targetHasSmoke = targetSlots.some((u) => u.name === "Smoke");

    if (card.name === "Molotov") {
      if (targetHasSmoke) {
        throwToCenter({ ...card, overlayText: "BLOQUEADO POR SMOKE" });
      } else {
        setTargetSlots((prev) => [...prev.slice(-5), { ...card, duration: 3 }]);
        throwToCenter(card);
      }
    } else if (card.name === "Granada") {
      if (targetHasSmoke) {
        setTargetHP((prev) => Math.max(0, prev - 2));
        setTargetSlots((prev) => prev.filter((u) => u.name !== "Smoke"));
        throwToCenter({ ...card, overlayText: "2 DANO + SMOKE DESTRUIDA" });
      } else {
        setTargetHP((prev) => Math.max(0, prev - 4));
        throwToCenter(card);
      }
    } else if (card.name === "Flashbang") {
      setTargetSlots((prev) => [...prev.slice(-5), { ...card, duration: 1 }]);
      throwToCenter(card);
    } else if (card.name === "Smoke") {
      const hasMolotov = selfSlots.some((u) => u.name === "Molotov");
      if (hasMolotov) {
        setSelfSlots((prev) => prev.filter((u) => u.name !== "Molotov"));
        throwToCenter({ ...card, overlayText: "MOLOTOV APAGADA" });
      } else {
        setSelfSlots((prev) => [...prev.slice(-5), { ...card, duration: 3 }]);
        throwToCenter(card);
      }
    } else if (card.name === "Capacete") {
      setSelfHP((prev) => Math.min(10, prev + 2));
      throwToCenter(card);
    } else if (card.name === "Colete") {
      setSelfHP((prev) => Math.min(10, prev + 4));
      throwToCenter(card);
    }
  };

  const playCardEffect = (card: Card) => {
    if (card.type === "utility") {
      handleUtilityCard(card);
      return;
    }

    if (card.cardCategory === "ARMA" && card.isOffensive) {
      const setTargetHP = isWarTheme ? setPoliceHP : setFactionHP;
      const targetUtility = isWarTheme ? techUtilitySlots : warUtilitySlots;
      const targetSmoke = targetUtility.some((u) => u.name === "Smoke");

      if (targetSmoke) {
        throwToCenter({ ...card, overlayText: "BLOQUEADO POR SMOKE" });
      } else {
        setTargetHP((prev) => Math.max(0, prev - card.damage));
        throwToCenter(card);
      }
      return;
    }

    if (card.name === "KIT DEFUSE") {
      if (bombData.planted && !bombData.exploded) {
        setBombData({ planted: false, site: null, timer: 5, exploded: false });
        throwToCenter({ ...card, overlayText: "BOMBA DESARMADA!" });
      } else {
        throwToCenter({ ...card, overlayText: "SEM BOMBA PARA DESARMAR" });
      }
      return;
    }

    if (card.name === "BOMBA") {
      if (factionPos && !bombData.planted) {
        setBombData((prev) => ({
          ...prev,
          planted: true,
          site: factionPos,
          timer: 5,
        }));
        throwToCenter({ ...card, overlayText: "BOMBA PLANTADA!" });
      } else {
        throwToCenter({ ...card, overlayText: "NAO FOI POSSIVEL PLANTAR" });
      }
      return;
    }

    throwToCenter(card);
  };

  const activateCard = () => {
    if (!currentTeamPos || isFlashed || targetSlot === null) return;
    const card = currentBoardSlots[targetSlot];
    if (!card) return;

    if (card.isOffensive && !hasCollision) {
      const missedCard = { ...card, overlayText: "ALVO FORA DE ALCANCE" };
      throwToCenter(missedCard);
    } else {
      playCardEffect(card);
    }

    const newSlots = [...currentBoardSlots];
    newSlots[targetSlot] = null;
    updateCurrentBoard(newSlots);
    setIsSlotModalOpen(false);
    setTargetSlot(null);
    setShowActionModal(false);
    handleTurnEnd();
  };

  const handleInventorySelect = (item: Card, index: number) => {
    if (!isSlotModalOpen && slotModalMode === "SELECT" && targetSlot !== null) {
      const newSlots = [...currentBoardSlots];
      newSlots[targetSlot] = item;
      updateCurrentBoard(newSlots);

      const newInventory = [...currentInventory];
      newInventory.splice(index, 1);
      updateCurrentInventory(newInventory);

      setIsSlotModalOpen(false);
      setTargetSlot(null);
      setShowActionModal(false);
      handleTurnEnd();

      setIsBottomPanelDisabled(false);
      setIsBottomPanelOpen(false);
      setShowWarZone(true);
    }
  };

  const handleKeepInHand = () => {
    setIsSlotModalOpen(false);
    setTargetSlot(null);
    setShowActionModal(false);
    handleTurnEnd();
  };

  const handleActionChoice = (tool: "d6" | "spinner") => {
    setSelectedTool(tool);
    setTurnPhase("ACTING");
    setShowActionModal(true);
  };

  const proceedToReplace = () => {
    if (currentInventory.length === 0) {
      // Draw 1 card and place it
      const team = isWarTheme ? "war" : "tech";
      const setInventory = isWarTheme ? setWarInventory : setTechInventory;
      const newCard = generateRandomCard(isWarTheme, bombData.planted);
      const flyId = Date.now();

      setDrawingDeck(team);
      setFlyingCards((prev) => [...prev, { ...newCard, flyId }]);

      setTimeout(() => {
        setDrawingDeck(null);
        setFlyingCards((prev) => prev.filter((c) => c.flyId !== flyId));
        setInventory((prev) => [...prev, newCard]);
        setSlotModalMode("SELECT");
        setIsBottomPanelOpen(true);
      }, 1000);
    } else {
      setSlotModalMode("SELECT");
      setIsBottomPanelOpen(true);
    }
  };

  const rollTool = () => {
    if (isRolling || gameOver || isFlashed || turnPhase !== "ACTING") return;
    setIsRolling(true);

    if (selectedTool === "d6") {
      const val = Math.floor(Math.random() * 6) + 1;
      setD6Result(val);
      const targetRot = getD6Rotation(val);
      const spins = 5;

      setRotation((prev) => {
        const currentXMod = prev.x % 360;
        const currentYMod = prev.y % 360;
        return {
          x: prev.x + spins * 360 + (targetRot.x - currentXMod),
          y: prev.y + spins * 360 + (targetRot.y - currentYMod),
          z: targetRot.z + (Math.random() * 20 - 10),
        };
      });

      setTimeout(() => {
        setIsRolling(false);
        setShowActionModal(false);
        const slotIndex = val - 1;
        setTargetSlot(slotIndex);

        if (currentBoardSlots[slotIndex]) {
          setSlotModalMode("DECIDE");
          setIsSlotModalOpen(true);
        } else {
          if (currentInventory.length > 0) {
            setSlotModalMode("SELECT");
            setIsBottomPanelOpen(true);
            setIsSlotModalOpen(true);
          } else {
            proceedToReplace();
          }
        }
      }, 3000);
    } else {
      const options = ["A", "B", "C"];
      const val = options[Math.floor(Math.random() * options.length)];
      setSpinnerResult(val);
      const targetRot = getSpinnerRotation(val);
      const spins = 8;
      const randomOffset = Math.floor(Math.random() * 40) - 20;

      setRotation((prev) => {
        const currentZ = prev.z;
        const currentZMod = currentZ % 360;
        let diff = targetRot.z - currentZMod;
        if (diff > 0) diff -= 360;
        return {
          x: 0,
          y: 0,
          z: currentZ - spins * 360 + diff + randomOffset,
        };
      });

      setTimeout(() => {
        setIsRolling(false);
        setShowActionModal(false);
        if (isWarTheme) {
          setFactionPos(val as string);
          handleTurnEnd(policePos, val as string);
        } else {
          setPolicePos(val as string);
          handleTurnEnd(val as string, factionPos);
        }
      }, 3000);
    }
  };

  return {
    d6Result,
    spinnerResult,
    showWarZone,
    isBottomPanelDisabled,
    disabledTabs,
    boardActiveTab,
    policeName,
    factionName,
    isWarTheme,
    isBottomPanelOpen,
    turnPhase,
    selectedTool,
    isRolling,
    rotation,
    gameTime,
    countdown,
    roundCount,
    policeHP,
    factionHP,
    policePos,
    factionPos,
    bombData,
    hasDrawnThisRound,
    showCountdown,
    showActionModal,
    currentBoardSlots,
    currentInventory,
    currentTeamPos,
    currentUtilitySlots,
    techUtilitySlots,
    warUtilitySlots,
    isFlashed,
    hasCollision,
    gameOver,
    targetSlot,
    playedCards,
    isSlotModalOpen,
    slotModalMode,
    drawingDeck,
    flyingCards,
    burnedCard,
    setIsBottomPanelDisabled,
    setDisabledTabs: (tabs) =>
      setDisabledTabs((prev) => ({ ...prev, ...tabs })),
    toggleBottomPanel: () =>
      setIsBottomPanelOpen((prev) => (isBottomPanelDisabled ? prev : !prev)),
    setIsBottomPanelOpen,
    setSelectedTool,
    handleActionChoice,
    handlePlantBomb,
    handleBuyCard,
    handleSkipBuy,
    handleInventorySelect,
    activateCard,
    proceedToReplace,
    handleKeepInHand,
    handleCountdownComplete,
    setBoardActiveTab,
    handleTurnEnd,
    rollTool,
    setShowWarZone,
  };
};
