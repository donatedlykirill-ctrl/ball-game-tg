// API Client for Ball Game Backend
// Configure your API URL here

const API_BASE_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:3000';

// Generate unique player ID if not exists
function getOrCreatePlayerId(): string {
  let playerId = localStorage.getItem('ballGamePlayerId');
  if (!playerId) {
    playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('ballGamePlayerId', playerId);
  }
  return playerId;
}

export const api = {
  // Initialize player
  async initPlayer(username: string) {
    const playerId = getOrCreatePlayerId();
    const response = await fetch(`${API_BASE_URL}/api/player`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, username }),
    });
    if (!response.ok) throw new Error('Failed to init player');
    return response.json();
  },

  // Load player data
  async loadPlayer() {
    const playerId = getOrCreatePlayerId();
    const response = await fetch(`${API_BASE_URL}/api/player/${playerId}`);
    if (!response.ok) throw new Error('Failed to load player');
    return response.json();
  },

  // Save game progress
  async saveProgress(data: {
    coins: number;
    roundsPlayed: number;
    wins: number;
    highestScore: number;
    itemsCollected: number;
    itemsTaken: number;
    selectedUpgrades: string[];
  }) {
    const playerId = getOrCreatePlayerId();
    const response = await fetch(`${API_BASE_URL}/api/save-progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, ...data }),
    });
    if (!response.ok) throw new Error('Failed to save progress');
    return response.json();
  },

  // Save round history
  async saveRound(data: {
    roundNumber: number;
    coinsEarned: number;
    itemsCollected: number;
    itemsTaken: number;
    upgradesUsed: string[];
    durationSeconds: number;
    won: boolean;
  }) {
    const playerId = getOrCreatePlayerId();
    const response = await fetch(`${API_BASE_URL}/api/save-round`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, ...data }),
    });
    if (!response.ok) throw new Error('Failed to save round');
    return response.json();
  },

  // Get leaderboard
  async getLeaderboard(limit: number = 10) {
    const response = await fetch(`${API_BASE_URL}/api/leaderboard?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    return response.json();
  },

  // Get player stats
  async getPlayerStats() {
    const playerId = getOrCreatePlayerId();
    const response = await fetch(`${API_BASE_URL}/api/player-stats/${playerId}`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  getPlayerId() {
    return getOrCreatePlayerId();
  },

  getApiUrl() {
    return API_BASE_URL;
  },
};
