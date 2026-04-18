import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
const MONGODB_URI = process.env.aruva_MONGODB_URI;
let db = null;

if (!MONGODB_URI) {
  console.error('ERROR: aruva_MONGODB_URI environment variable is not set');
  process.exit(1);
}

const client = new MongoClient(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Connect to MongoDB on startup
async function connectDB() {
  try {
    await client.connect();
    db = client.db('ball-game');
    
    // Ensure indexes
    await db.collection('players').createIndex({ player_id: 1 });
    await db.collection('round_history').createIndex({ player_id: 1 });
    
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// ─── Helper Functions ───────────────────────────────────────────────────────

async function getPlayer(playerId) {
  const players = db.collection('players');
  return await players.findOne({ player_id: playerId });
}

async function getPlayerUpgrades(playerId) {
  const upgrades = db.collection('player_upgrades');
  return await upgrades.find({ player_id: playerId }).toArray();
}

async function getPlayerStats(playerId) {
  const history = db.collection('round_history');
  return await history
    .find({ player_id: playerId })
    .sort({ played_at: -1 })
    .limit(10)
    .toArray();
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mongodb: db ? 'connected' : 'disconnected' });
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

    const players = db.collection('players');
    const existing = await getPlayer(playerId);

    if (existing) {
      await players.updateOne(
        { player_id: playerId },
        {
          $set: { last_played_at: new Date() }
        }
      );
    } else {
      await players.insertOne({
        player_id: playerId,
        username,
        total_coins: 0,
        total_rounds: 0,
        total_wins: 0,
        highest_score: 0,
        items_collected: 0,
        items_taken: 0,
        created_at: new Date(),
        last_played_at: new Date(),
      });
    }

    const player = await getPlayer(playerId);
    res.json({ success: true, player });
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

    const players = db.collection('players');
    const upgrades = db.collection('player_upgrades');

    // Update main player stats
    await players.updateOne(
      { player_id: playerId },
      {
        $set: {
          total_coins: coins,
          total_rounds: roundsPlayed,
          total_wins: wins,
          highest_score: highestScore,
          items_collected: itemsCollected,
          items_taken: itemsTaken,
          last_updated_at: new Date(),
        }
      },
      { upsert: true }
    );

    // Update upgrades
    if (selectedUpgrades && Array.isArray(selectedUpgrades)) {
      for (const upgrade of selectedUpgrades) {
        await upgrades.updateOne(
          { player_id: playerId, upgrade_id: upgrade },
          {
            $inc: { purchase_count: 1 },
            $setOnInsert: { created_at: new Date() }
          },
          { upsert: true }
        );
      }
    }

    res.json({ success: true });
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

    const history = db.collection('round_history');

    await history.insertOne({
      player_id: playerId,
      round_number: roundNumber,
      coins_earned: coinsEarned,
      items_collected: itemsCollected,
      items_taken: itemsTaken,
      upgrades_used: upgradesUsed || [],
      duration_seconds: durationSeconds,
      won,
      played_at: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving round:', error);
    res.status(500).json({ error: 'Failed to save round' });
  }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || 10);

    const players = db.collection('players');

    const leaderboard = await players
      .find({})
      .sort({ highest_score: -1, total_coins: -1 })
      .limit(limit)
      .toArray();

    res.json(leaderboard);
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

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await client.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Ball Game Backend running on PORT ${PORT}`);
});
