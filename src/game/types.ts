// São Tomé Island Farmers - Type Definitions

export interface Land {
  id: string;
  quality: number; // 1-5, affects cocoa production
  hasCocoa: boolean;
  cocoaGrowthStage: number; // 0-3, 3 = ready to harvest
  hasTree: boolean;
}

export interface Player {
  id: string;
  name: string;
  cocoa: number;
  wood: number;
  snails: number;
  population: number; // determines action points
  actionPoints: number;
  lands: Land[];
  // Night phase secret action
  secretAction?: NightAction;
  // Defense/traps set
  hasDefense: boolean;
}

export type DayActionType = 
  | 'plant_cocoa'      // Plant cocoa on a land
  | 'harvest_cocoa'    // Harvest ready cocoa
  | 'cut_tree'         // Legally cut tree (public)
  | 'improve_land'     // Improve land quality
  | 'rest';            // Rest to gain extra action points next round

export type NightActionType =
  | 'illegal_logging'  // Illegal tree cutting (risky but rewarding)
  | 'steal_cocoa'      // Steal from another player
  | 'hunt_snails'      // Hunt snails for cocoa
  | 'set_defense'      // Set traps/defense
  | 'sabotage_land'    // Sabotage another player's land
  | 'sleep';           // Do nothing (safe)

export interface DayAction {
  type: DayActionType;
  landId?: string;
  targetPlayerId?: string;
}

export interface NightAction {
  type: NightActionType;
  landId?: string;
  targetPlayerId?: string;
}

export interface GameEvent {
  round: number;
  phase: 'day' | 'night';
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
}

export type GamePhase = 'day' | 'night' | 'nightReveal' | 'gameEnd';

export interface GameState {
  players: Record<string, Player>;
  currentRound: number;
  phase: GamePhase;
  ecosystemPressure: number; // 0-100
  events: GameEvent[];
  dayActionsThisRound: Record<string, DayAction[]>;
  nightActionsRevealed: boolean;
  turnOrder: string[];
  winner?: string;
}

// Game constants
export const CONSTANTS = {
  INITIAL_COCOA: 10,
  INITIAL_WOOD: 5,
  INITIAL_SNAILS: 0,
  INITIAL_POPULATION: 3,
  INITIAL_LANDS: 3,
  
  ACTION_COST: 1,
  POPULATION_MAINTENANCE: 2, // cocoa per population per round
  
  COCOA_HARVEST_AMOUNT: 5,
  COCOA_GROWTH_ROUNDS: 2,
  
  TREE_CUT_WOOD: 3,
  TREE_CUT_PRESSURE: 5,
  ILLEGAL_LOGGING_WOOD: 5,
  ILLEGAL_LOGGING_PRESSURE: 10,
  ILLEGAL_LOGGING_CATCH_CHANCE: 0.3,
  
  SNAIL_HUNT_AMOUNT: 2,
  SNAIL_HUNT_PRESSURE: 3,
  SNAIL_TO_COCOA_RATE: 2,
  
  STEAL_AMOUNT: 3,
  STEAL_CATCH_CHANCE: 0.4,
  
  LAND_IMPROVE_COST: 3, // wood
  
  ECOSYSTEM_THRESHOLD: 50, // triggers negative events
  ECOSYSTEM_CRITICAL: 80, // severe effects
  
  WIN_COCOA_TARGET: 50,
  MAX_ROUNDS: 10,
};


