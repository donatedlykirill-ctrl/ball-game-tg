-- Create database
CREATE DATABASE IF NOT EXISTS ball_game_db;
USE ball_game_db;

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  total_coins INT DEFAULT 0,
  total_rounds INT DEFAULT 0,
  total_wins INT DEFAULT 0,
  highest_score INT DEFAULT 0,
  items_collected INT DEFAULT 0,
  items_taken INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Upgrades table
CREATE TABLE IF NOT EXISTS player_upgrades (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id VARCHAR(255) NOT NULL,
  upgrade_id VARCHAR(255) NOT NULL,
  purchase_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE,
  UNIQUE KEY unique_player_upgrade (player_id, upgrade_id)
);

-- Round history table
CREATE TABLE IF NOT EXISTS round_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id VARCHAR(255) NOT NULL,
  round_number INT NOT NULL,
  coins_earned INT DEFAULT 0,
  items_collected INT DEFAULT 0,
  items_taken INT DEFAULT 0,
  upgrades_used TEXT,
  duration_seconds INT DEFAULT 0,
  won BOOLEAN DEFAULT FALSE,
  played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE,
  INDEX idx_player_id (player_id),
  INDEX idx_played_at (played_at)
);

-- Create indexes for faster queries
CREATE INDEX idx_players_player_id ON players(player_id);
CREATE INDEX idx_players_highest_score ON players(highest_score);
CREATE INDEX idx_upgrades_player_id ON player_upgrades(player_id);
