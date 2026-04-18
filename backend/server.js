import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT || 3306,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
});

// ─── Helper Functions ───────────────────────────────────────────────────────

async function getPlayer(playerId) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      'SELECT * FROM players WHERE player_id = ?',
      [playerId]
    );
    return rows[0] || null;
  } finally {
    conn.release();
  }
}

async function getPlayerUpgrades(playerId) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      'SELECT upgrade_id, purchase_count FROM player_upgrades WHERE player_id = ?',
      [playerId]
    );
    return rows;
  } finally {
    conn.release();
  }
}

async function getPlayerStats(playerId) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      'SELECT * FROM round_history WHERE player_id = ? ORDER BY played_at DESC LIMIT 10',
      [playerId]
    );
    return rows;
  } finally {
    conn.release();
  }
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Load player data
app.get('/api/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    
    const player = await getPlayer(playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const upgrades = await getPlayerUpgrades(playerId);
    const stats = await getPlayerStats(playerId);

    res.json({
      player,
      upgrades,
      stats,
    });
  } catch (error) {
    console.error('Error loading player:', error);
    res.status(500).json({ error: 'Failed to load player data' });
  }
});

// Create or update player
app.post('/api/player', async (req, res) => {
  try {
    const { playerId, username } = req.body;

    if (!playerId || !username) {
      return res.status(400).json({ error: 'playerId and username required' });
    }

    const conn = await pool.getConnection();
    try {
      const existing = await getPlayer(playerId);

      if (existing) {
        await conn.execute(
          'UPDATE players SET last_played_at = NOW() WHERE player_id = ?',
          [playerId]
        );
      } else {
        await conn.execute(
          'INSERT INTO players (player_id, username) VALUES (?, ?)',
          [playerId, username]
        );
      }

      const player = await getPlayer(playerId);
      res.json({ success: true, player });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error creating/updating player:', error);
    res.status(500).json({ error: 'Failed to create/update player' });
  }
});

// Save game progress
app.post('/api/save-progress', async (req, res) => {
  try {
    const {
      playerId,
      coins,
      roundsPlayed,
      wins,
      highestScore,
      itemsCollected,
      itemsTaken,
      selectedUpgrades,
    } = req.body;

    if (!playerId) {
      return res.status(400).json({ error: 'playerId required' });
    }

    const conn = await pool.getConnection();
    try {
      // Update main player stats
      await conn.execute(
        `UPDATE players SET 
          total_coins = ?,
          total_rounds = ?,
          total_wins = ?,
          highest_score = ?,
          items_collected = ?,
          items_taken = ?
        WHERE player_id = ?`,
        [coins, roundsPlayed, wins, highestScore, itemsCollected, itemsTaken, playerId]
      );

      // Update upgrades
      if (selectedUpgrades && Array.isArray(selectedUpgrades)) {
        for (const upgrade of selectedUpgrades) {
          await conn.execute(
            `INSERT INTO player_upgrades (player_id, upgrade_id, purchase_count)
             VALUES (?, ?, 1)
             ON DUPLICATE KEY UPDATE purchase_count = purchase_count + 1`,
            [playerId, upgrade]
          );
        }
      }

      res.json({ success: true });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error saving progress:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// Save round history
app.post('/api/save-round', async (req, res) => {
  try {
    const {
      playerId,
      roundNumber,
      coinsEarned,
      itemsCollected,
      itemsTaken,
      upgradesUsed,
      durationSeconds,
      won,
    } = req.body;

    if (!playerId) {
      return res.status(400).json({ error: 'playerId required' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.execute(
        `INSERT INTO round_history 
         (player_id, round_number, coins_earned, items_collected, items_taken, upgrades_used, duration_seconds, won)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          playerId,
          roundNumber,
          coinsEarned,
          itemsCollected,
          itemsTaken,
          JSON.stringify(upgradesUsed || []),
          durationSeconds,
          won ? 1 : 0,
        ]
      );

      res.json({ success: true });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error saving round:', error);
    res.status(500).json({ error: 'Failed to save round' });
  }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = req.query.limit || 10;

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        `SELECT id, username, total_coins, highest_score, total_wins, total_rounds
         FROM players
         ORDER BY highest_score DESC, total_coins DESC
         LIMIT ?`,
        [parseInt(limit)]
      );

      res.json(rows);
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get player stats
app.get('/api/player-stats/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;

    const player = await getPlayer(playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const stats = await getPlayerStats(playerId);

    res.json({
      player,
      recentRounds: stats,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Ball Game Backend running on PORT ${PORT}`);
});
