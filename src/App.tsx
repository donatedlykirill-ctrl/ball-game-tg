import { useEffect, useRef, useState, useCallback, type MouseEvent } from "react";
import { api } from "./utils/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type Vec2 = { x: number; y: number };

type Ball = {
  id: number;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  hp: number;
  maxHp: number;
  color: string;
  label: string;
  flashTimer: number; // frames left to flash red/green
  flashColor: string;
  dead: boolean;
};

type ItemKind = "sword" | "apple" | "trap";

type SpawnedCoin = {
  id: number;
  pos: Vec2;
  radius: number;
};

type UpgradeId =
  | "turbo_start"
  | "guard_shell"
  | "extra_core"
  | "risky_gamble"
  | "magnet_boots";

type UpgradeDef = {
  id: UpgradeId;
  name: string;
  desc: string;
  cost: number;
};

type SpawnedItem = {
  id: number;
  kind: ItemKind;
  pos: Vec2;
  radius: number;
  lifetime: number; // frames remaining
};

type FloatingText = {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number; // frames
};

// ─── Constants ───────────────────────────────────────────────────────────────

const ARENA_RADIUS = 230;
const BALL_RADIUS = 22;
const DEFAULT_HP = 3;
const ITEM_SPAWN_INTERVAL_S = 9;
const ITEM_LIFETIME_FRAMES = 300; // 5 s at 60 fps
const ITEM_RADIUS = 16;
const COIN_SPAWN_INTERVAL_S = 15;
const COIN_RADIUS = 12;
const BALL_SPEED = 3.2;
const SHOP_POINTS_PER_ROUND = 2;

const UPGRADES: UpgradeDef[] = [
  {
    id: "turbo_start",
    name: "Turbo Start",
    desc: "+60% speed for first 5s, then -15% speed for next 5s",
    cost: 1,
  },
  {
    id: "guard_shell",
    name: "Guard Shell",
    desc: "Blocks first damage item hit",
    cost: 1,
  },
  {
    id: "extra_core",
    name: "Extra Core",
    desc: "+1 starting HP, but your ball is slightly larger",
    cost: 1,
  },
  {
    id: "risky_gamble",
    name: "Risky Gamble",
    desc: "Apple +2 HP, but Sword/Trap deal -2 HP",
    cost: 1,
  },
  {
    id: "magnet_boots",
    name: "Magnet Boots",
    desc: "Nearby items drift toward you, but permanent -8% speed",
    cost: 1,
  },
];

const ITEM_COLORS: Record<ItemKind, string> = {
  sword: "#ef4444",
  apple: "#22c55e",
  trap: "#a855f7",
};

const ITEM_EMOJI: Record<ItemKind, string> = {
  sword: "⚔️",
  apple: "🍎",
  trap: "🪤",
};

const ITEM_LABEL: Record<ItemKind, string> = {
  sword: "Sword (-1 HP)",
  apple: "Apple (+1 HP)",
  trap: "Trap (-1 HP)",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomAngle() {
  return Math.random() * Math.PI * 2;
}

function randomInsideCircle(arenaR: number, margin: number): Vec2 {
  const maxR = arenaR - margin;
  const angle = randomAngle();
  const r = Math.sqrt(Math.random()) * maxR;
  return { x: r * Math.cos(angle), y: r * Math.sin(angle) };
}

function randomOnArenaEdge(distanceFromCenter: number): Vec2 {
  const angle = randomAngle();
  return {
    x: Math.cos(angle) * distanceFromCenter,
    y: Math.sin(angle) * distanceFromCenter,
  };
}

function dist(a: Vec2, b: Vec2) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ─── Ball creation ───────────────────────────────────────────────────────────

function makeBall(id: number, color: string, label: string, cx: number, cy: number): Ball {
  const angle = randomAngle();
  const startAngle = (id === 0 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.4;
  const startR = ARENA_RADIUS * 0.35;
  return {
    id,
    pos: {
      x: cx + Math.cos(startAngle) * startR,
      y: cy + Math.sin(startAngle) * startR,
    },
    vel: {
      x: Math.cos(angle) * BALL_SPEED,
      y: Math.sin(angle) * BALL_SPEED,
    },
    radius: BALL_RADIUS,
    hp: DEFAULT_HP,
    maxHp: DEFAULT_HP,
    color,
    label,
    flashTimer: 0,
    flashColor: "#ffffff",
    dead: false,
  };
}

// ─── Game state (mutable ref, NOT react state) ────────────────────────────────

type GameState = {
  balls: Ball[];
  items: SpawnedItem[];
  coins: SpawnedCoin[];
  floatingTexts: FloatingText[];
  itemSpawnTimer: number;
  coinSpawnTimer: number;
  nextItemId: number;
  nextCoinId: number;
  nextTextId: number;
  running: boolean;
  aiming: boolean;
  blueAim: Vec2;
  winner: string | null;
  frameCount: number;
  selectedUpgrades: UpgradeId[];
  playerShieldCharges: number;
  playerCoins: number;
};

function makeInitialState(): GameState {
  return {
    balls: [],
    items: [],
    coins: [],
    floatingTexts: [],
    itemSpawnTimer: ITEM_SPAWN_INTERVAL_S * 60,
    coinSpawnTimer: COIN_SPAWN_INTERVAL_S * 60,
    nextItemId: 0,
    nextCoinId: 0,
    nextTextId: 0,
    running: false,
    aiming: false,
    blueAim: { x: 1, y: 0 },
    winner: null,
    frameCount: 0,
    selectedUpgrades: [],
    playerShieldCharges: 0,
    playerCoins: 0,
  };
}

function hasUpgrade(g: GameState, id: UpgradeId) {
  return g.selectedUpgrades.includes(id);
}

function getTargetSpeed(ball: Ball, g: GameState) {
  if (ball.id !== 1) return BALL_SPEED;

  let speed = BALL_SPEED;
  if (hasUpgrade(g, "turbo_start")) {
    if (g.frameCount < 5 * 60) speed *= 1.6;
    else if (g.frameCount < 10 * 60) speed *= 0.85;
  }
  if (hasUpgrade(g, "magnet_boots")) speed *= 0.92;
  return speed;
}

function normalizeVelocity(vel: Vec2, targetSpeed: number) {
  const cur = Math.hypot(vel.x, vel.y);
  if (cur < 0.0001) {
    return { x: targetSpeed, y: 0 };
  }
  return {
    x: (vel.x / cur) * targetSpeed,
    y: (vel.y / cur) * targetSpeed,
  };
}

// ─── Legend Panel ─────────────────────────────────────────────────────────────

function LegendPanel() {
  return (
    <div className="flex flex-col gap-2 text-sm">
      {(["sword", "apple", "trap"] as ItemKind[]).map((k) => (
        <div key={k} className="flex items-center gap-2">
          <span className="text-xl leading-none">{ITEM_EMOJI[k]}</span>
          <span
            className="font-semibold"
            style={{ color: ITEM_COLORS[k] }}
          >
            {ITEM_LABEL[k]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── HP Bar ──────────────────────────────────────────────────────────────────

function HpCompact({ ball }: { ball: { hp: number; maxHp: number; color: string; label: string } }) {
  const pct = Math.max(0, ball.hp / ball.maxHp);
  return (
    <div
      className="w-24 h-24 rounded-xl p-2 flex flex-col items-center justify-between"
      style={{ border: "1px solid rgba(255,255,255,0.18)", background: "rgba(15,23,42,0.72)" }}
    >
      <div className="text-[11px] font-bold tracking-wide" style={{ color: ball.color }}>
        {ball.label}
      </div>
      <div className="w-8 h-8 rounded-full border-2" style={{ borderColor: ball.color, background: `${ball.color}33` }} />
      <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
        <div
          className="h-full"
          style={{
            width: `${pct * 100}%`,
            backgroundColor: ball.color,
          }}
        />
      </div>
      <div className="text-sm font-black text-white">
        {ball.hp}/{ball.maxHp}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState>(makeInitialState());
  const rafRef = useRef<number>(0);
  const [screen, setScreen] = useState<"home" | "shop" | "game">("home");
  const [selectedUpgrades, setSelectedUpgrades] = useState<UpgradeId[]>([]);
  const [uiState, setUiState] = useState<{
    running: boolean;
    aiming: boolean;
    winner: string | null;
    balls: { id: number; hp: number; maxHp: number; color: string; label: string }[];
    nextSpawnIn: number;
    nextCoinIn: number;
    playerShieldCharges: number;
    activeUpgrades: UpgradeId[];
    playerCoins: number;
  }>({
    running: false,
    aiming: false,
    winner: null,
    balls: [],
    nextSpawnIn: ITEM_SPAWN_INTERVAL_S,
    nextCoinIn: COIN_SPAWN_INTERVAL_S,
    playerShieldCharges: 0,
    activeUpgrades: [],
    playerCoins: 0,
  });

  // Player data state
  const [playerData, setPlayerData] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const roundCountRef = useRef(0);

  // Canvas center (in canvas coords)
  const CX = 300;
  const CY = 300;
  const CANVAS_SIZE = 600;
  const spentShopPoints = selectedUpgrades.reduce((sum, id) => {
    const found = UPGRADES.find((up) => up.id === id);
    return sum + (found?.cost ?? 0);
  }, 0);
  const shopPointsLeft = SHOP_POINTS_PER_ROUND - spentShopPoints;

  const toggleUpgrade = useCallback((id: UpgradeId) => {
    if (uiState.running || uiState.aiming) return;
    setSelectedUpgrades((prev) => {
      if (prev.includes(id)) {
        return prev.filter((up) => up !== id);
      }
      const upgrade = UPGRADES.find((up) => up.id === id);
      if (!upgrade) return prev;
      const used = prev.reduce((sum, upId) => {
        const found = UPGRADES.find((up) => up.id === upId);
        return sum + (found?.cost ?? 0);
      }, 0);
      if (used + upgrade.cost > SHOP_POINTS_PER_ROUND) return prev;
      return [...prev, id];
    });
  }, [uiState.aiming, uiState.running]);

  // ── Physics step ──────────────────────────────────────────────────────────

  const step = useCallback(() => {
    const g = gameRef.current;
    if (!g.running) return;
    g.frameCount += 1;

    const newTexts: FloatingText[] = [];

    // ── Item spawn timer ──
    g.itemSpawnTimer -= 1;
    if (g.itemSpawnTimer <= 0) {
      g.itemSpawnTimer = ITEM_SPAWN_INTERVAL_S * 60;
      const kinds: ItemKind[] = ["sword", "apple", "trap"];
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const pos = randomInsideCircle(ARENA_RADIUS - ITEM_RADIUS - 4, ITEM_RADIUS);
      pos.x += CX;
      pos.y += CY;
      g.items.push({
        id: g.nextItemId++,
        kind,
        pos,
        radius: ITEM_RADIUS,
        lifetime: ITEM_LIFETIME_FRAMES,
      });
    }

    // ── Player coin spawn timer ──
    g.coinSpawnTimer -= 1;
    if (g.coinSpawnTimer <= 0) {
      g.coinSpawnTimer = COIN_SPAWN_INTERVAL_S * 60;
      const edge = randomOnArenaEdge(ARENA_RADIUS - COIN_RADIUS - 2);
      g.coins.push({
        id: g.nextCoinId++,
        pos: { x: CX + edge.x, y: CY + edge.y },
        radius: COIN_RADIUS,
      });
    }

    // ── Decrement item lifetimes ──
    g.items = g.items.filter((it) => {
      it.lifetime -= 1;
      return it.lifetime > 0;
    });

    // ── Magnet Boots: pull nearby items toward the player ball ──
    if (hasUpgrade(g, "magnet_boots")) {
      const player = g.balls.find((b) => b.id === 1 && !b.dead);
      if (player) {
        for (const item of g.items) {
          const dx = player.pos.x - item.pos.x;
          const dy = player.pos.y - item.pos.y;
          const d = Math.hypot(dx, dy);
          if (d > 1 && d < 120) {
            item.pos.x += (dx / d) * 0.9;
            item.pos.y += (dy / d) * 0.9;
          }
        }
      }
    }

    // ── Move balls ──
    for (const ball of g.balls) {
      if (ball.dead) continue;
      ball.pos.x += ball.vel.x;
      ball.pos.y += ball.vel.y;

      // Flash timer
      if (ball.flashTimer > 0) ball.flashTimer -= 1;

      // ── Arena boundary collision ──
      const dx = ball.pos.x - CX;
      const dy = ball.pos.y - CY;
      const dFromCenter = Math.sqrt(dx * dx + dy * dy);
      const maxDist = ARENA_RADIUS - ball.radius;

      if (dFromCenter > maxDist) {
        // Push ball back inside
        const nx = dx / dFromCenter;
        const ny = dy / dFromCenter;
        ball.pos.x = CX + nx * maxDist;
        ball.pos.y = CY + ny * maxDist;

        // Reflect velocity (only if moving outward)
        const vDotN = ball.vel.x * nx + ball.vel.y * ny;
        if (vDotN > 0) {
          ball.vel.x -= 2 * vDotN * nx;
          ball.vel.y -= 2 * vDotN * ny;
        }
      }

      // Keep stable speed profile for each ball.
      const targetSpeed = getTargetSpeed(ball, g);
      ball.vel = normalizeVelocity(ball.vel, targetSpeed);
    }

    // ── Ball-ball collision ──
    const liveBalls = g.balls.filter((b) => !b.dead);
    for (let i = 0; i < liveBalls.length; i++) {
      for (let j = i + 1; j < liveBalls.length; j++) {
        const a = liveBalls[i];
        const b = liveBalls[j];
        const dx = b.pos.x - a.pos.x;
        const dy = b.pos.y - a.pos.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.radius + b.radius;
        if (d < minDist && d > 0) {
          // Separate
          const overlap = (minDist - d) / 2;
          const nx = dx / d;
          const ny = dy / d;
          a.pos.x -= nx * overlap;
          a.pos.y -= ny * overlap;
          b.pos.x += nx * overlap;
          b.pos.y += ny * overlap;

          // Elastic collision — swap velocity components along the normal
          const aDotN = a.vel.x * nx + a.vel.y * ny;
          const bDotN = b.vel.x * nx + b.vel.y * ny;
          // Only resolve if balls are moving toward each other
          if (aDotN - bDotN > 0) {
            a.vel.x += (bDotN - aDotN) * nx;
            a.vel.y += (bDotN - aDotN) * ny;
            b.vel.x += (aDotN - bDotN) * nx;
            b.vel.y += (aDotN - bDotN) * ny;
          }
        }
      }
    }

    // Keep speeds normalized after elastic collision math.
    for (const ball of liveBalls) {
      const targetSpeed = getTargetSpeed(ball, g);
      ball.vel = normalizeVelocity(ball.vel, targetSpeed);
    }

    // ── Ball-item collision ──
    const toRemove = new Set<number>();
    for (const ball of liveBalls) {
      for (const item of g.items) {
        if (toRemove.has(item.id)) continue;
        const d = dist(ball.pos, item.pos);
        if (d < ball.radius + item.radius) {
          toRemove.add(item.id);

          let delta = 0;
          let color = "#ffffff";
          const riskyDelta = ball.id === 1 && hasUpgrade(g, "risky_gamble");
          if (item.kind === "apple") {
            delta = riskyDelta ? +2 : +1;
            color = "#22c55e";
            ball.flashColor = "#22c55e";
          } else if (item.kind === "sword") {
            delta = riskyDelta ? -2 : -1;
            color = "#ef4444";
            ball.flashColor = "#ef4444";
          } else if (item.kind === "trap") {
            delta = riskyDelta ? -2 : -1;
            color = "#a855f7";
            ball.flashColor = "#a855f7";
          }

          if (delta < 0 && ball.id === 1 && g.playerShieldCharges > 0) {
            g.playerShieldCharges -= 1;
            ball.flashColor = "#93c5fd";
            ball.flashTimer = 18;
            newTexts.push({
              id: g.nextTextId++,
              text: "BLOCK",
              x: ball.pos.x,
              y: ball.pos.y - ball.radius - 10,
              color: "#93c5fd",
              life: 70,
            });
            continue;
          }

          ball.hp = Math.max(0, ball.hp + delta);
          ball.maxHp = Math.max(ball.maxHp, ball.hp);
          ball.flashTimer = 18;

          const sign = delta > 0 ? "+" : "";
          newTexts.push({
            id: g.nextTextId++,
            text: `${sign}${delta} HP`,
            x: ball.pos.x,
            y: ball.pos.y - ball.radius - 10,
            color,
            life: 70,
          });

          if (ball.hp <= 0) {
            ball.dead = true;
          }
        }
      }
    }

    g.items = g.items.filter((it) => !toRemove.has(it.id));

    // ── Player-only coin pickup (bot cannot collect) ──
    const playerBall = g.balls.find((b) => b.id === 1 && !b.dead);
    if (playerBall) {
      g.coins = g.coins.filter((coin) => {
        const d = dist(playerBall.pos, coin.pos);
        if (d < playerBall.radius + coin.radius) {
          g.playerCoins += 1;
          playerBall.flashColor = "#facc15";
          playerBall.flashTimer = 14;
          newTexts.push({
            id: g.nextTextId++,
            text: "+1 COIN",
            x: playerBall.pos.x,
            y: playerBall.pos.y - playerBall.radius - 10,
            color: "#facc15",
            life: 70,
          });
          return false;
        }
        return true;
      });
    }

    // ── Floating texts ──
    g.floatingTexts = g.floatingTexts.filter((t) => t.life > 0);
    for (const t of g.floatingTexts) {
      t.y -= 0.8;
      t.life -= 1;
    }
    for (const t of newTexts) g.floatingTexts.push(t);

    // ── Check win condition ──
    const alive = g.balls.filter((b) => !b.dead);
    if (alive.length <= 1 && g.balls.length > 0) {
      g.running = false;
      g.winner = alive.length === 1 ? alive[0].label : "Draw!";
    }
  }, []);

  // ── Draw ──────────────────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const g = gameRef.current;

    // Clear
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // ── Arena background ──
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, ARENA_RADIUS, 0, Math.PI * 2);
    const bg = ctx.createRadialGradient(CX, CY - 60, 10, CX, CY, ARENA_RADIUS);
    bg.addColorStop(0, "#1e293b");
    bg.addColorStop(1, "#0f172a");
    ctx.fillStyle = bg;
    ctx.fill();

    // ── Arena border ──
    ctx.lineWidth = 5;
    const borderGrad = ctx.createLinearGradient(CX - ARENA_RADIUS, CY, CX + ARENA_RADIUS, CY);
    borderGrad.addColorStop(0, "#6366f1");
    borderGrad.addColorStop(0.5, "#818cf8");
    borderGrad.addColorStop(1, "#6366f1");
    ctx.strokeStyle = borderGrad;
    ctx.shadowColor = "#818cf8";
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── Grid lines inside arena (subtle) ──
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, ARENA_RADIUS, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = "rgba(99,102,241,0.07)";
    ctx.lineWidth = 1;
    for (let x = CX - ARENA_RADIUS; x <= CX + ARENA_RADIUS; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, CY - ARENA_RADIUS); ctx.lineTo(x, CY + ARENA_RADIUS); ctx.stroke();
    }
    for (let y = CY - ARENA_RADIUS; y <= CY + ARENA_RADIUS; y += 40) {
      ctx.beginPath(); ctx.moveTo(CX - ARENA_RADIUS, y); ctx.lineTo(CX + ARENA_RADIUS, y); ctx.stroke();
    }
    ctx.restore();

    // ── Items ──
    for (const item of g.items) {
      const lifePct = item.lifetime / ITEM_LIFETIME_FRAMES;
      const pulse = 0.85 + 0.15 * Math.sin(Date.now() * 0.008);
      const alpha = lifePct < 0.3 ? lifePct / 0.3 : 1;

      ctx.save();
      ctx.globalAlpha = alpha * pulse;

      // Glow
      ctx.shadowColor = ITEM_COLORS[item.kind];
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(item.pos.x, item.pos.y, item.radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fill();
      ctx.strokeStyle = ITEM_COLORS[item.kind];
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Emoji
      ctx.font = `${item.radius * 1.3}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.globalAlpha = alpha;
      ctx.fillText(ITEM_EMOJI[item.kind], item.pos.x, item.pos.y + 1);

      ctx.restore();
    }

    // ── Coins (player-only pickups) ──
    for (const coin of g.coins) {
      const pulse = 0.9 + 0.1 * Math.sin(Date.now() * 0.01 + coin.id);
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 14;

      ctx.beginPath();
      ctx.arc(coin.pos.x, coin.pos.y, coin.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#f59e0b";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#fde68a";
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff7d6";
      ctx.fillText("C", coin.pos.x, coin.pos.y + 0.5);
      ctx.restore();
    }

    if (g.aiming) {
      const blueBall = g.balls.find((b) => b.id === 1 && !b.dead);
      if (blueBall) {
        const arrowLen = 76;
        const tipX = blueBall.pos.x + g.blueAim.x * arrowLen;
        const tipY = blueBall.pos.y + g.blueAim.y * arrowLen;
        const sideX = -g.blueAim.y;
        const sideY = g.blueAim.x;

        ctx.save();
        ctx.strokeStyle = "rgba(56,189,248,0.95)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(blueBall.pos.x, blueBall.pos.y);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        ctx.fillStyle = "rgba(56,189,248,0.95)";
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - g.blueAim.x * 14 + sideX * 8, tipY - g.blueAim.y * 14 + sideY * 8);
        ctx.lineTo(tipX - g.blueAim.x * 14 - sideX * 8, tipY - g.blueAim.y * 14 - sideY * 8);
        ctx.closePath();
        ctx.fill();

        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(186,230,253,0.95)";
        ctx.fillText("Aim blue ball and click arena", CX, CY - ARENA_RADIUS + 24);
        ctx.restore();
      }
    }

    // ── Balls ──
    for (const ball of g.balls) {
      if (ball.dead) continue;

      const flashing = ball.flashTimer > 0;
      const displayColor = flashing ? ball.flashColor : ball.color;

      ctx.save();

      // Body
      const grad = ctx.createRadialGradient(
        ball.pos.x - ball.radius * 0.3,
        ball.pos.y - ball.radius * 0.3,
        ball.radius * 0.1,
        ball.pos.x,
        ball.pos.y,
        ball.radius
      );
      grad.addColorStop(0, flashing ? "#ffffff" : lighten(ball.color));
      grad.addColorStop(1, displayColor);
      ctx.beginPath();
      ctx.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Border
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // HP inside ball — big bold text with black outline for readability
      ctx.font = `bold 18px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(0,0,0,0.85)";
      ctx.lineJoin = "round";
      ctx.strokeText(`${ball.hp}`, ball.pos.x, ball.pos.y);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${ball.hp}`, ball.pos.x, ball.pos.y);

      ctx.restore();
    }

    // ── Floating texts ──
    for (const t of g.floatingTexts) {
      const alpha = Math.min(1, t.life / 25);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = t.color;
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 8;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }

    // ── Next spawn countdown (inside arena) ──
    if (g.running) {
      const secLeft = Math.ceil(g.itemSpawnTimer / 60);
      ctx.save();
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(165,180,252,0.7)";
      ctx.fillText(`Next item: ${secLeft}s`, CX, CY + ARENA_RADIUS - 18);
      ctx.restore();
    }

    // ── Winner overlay ──
    if (g.winner) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(CX, CY, ARENA_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fill();

      ctx.font = "bold 36px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fbbf24";
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 24;
      ctx.fillText("🏆 " + g.winner, CX, CY - 18);
      ctx.shadowBlur = 0;
      ctx.font = "18px sans-serif";
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText("wins the arena!", CX, CY + 22);
      ctx.restore();
    }
  }, []);

  // ── Game loop ────────────────────────────────────────────────────────────

  const loop = useCallback(() => {
    step();
    draw();

    // Update React UI every ~10 frames
    const g = gameRef.current;
    setUiState({
      running: g.running,
      aiming: g.aiming,
      winner: g.winner,
      balls: g.balls.map((b) => ({ id: b.id, hp: b.hp, maxHp: b.maxHp, color: b.color, label: b.label })),
      nextSpawnIn: Math.ceil(g.itemSpawnTimer / 60),
      nextCoinIn: Math.ceil(g.coinSpawnTimer / 60),
      playerShieldCharges: g.playerShieldCharges,
      activeUpgrades: g.selectedUpgrades,
      playerCoins: g.playerCoins,
    });

    rafRef.current = requestAnimationFrame(loop);
  }, [step, draw]);

  const startLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  // ── Start game ────────────────────────────────────────────────────────────

  const handleStart = useCallback(() => {
    const g = gameRef.current;
    g.balls = [
      makeBall(0, "#f97316", "Orange Bot", CX, CY),
      makeBall(1, "#38bdf8", "Player Blue", CX, CY),
    ];
    g.selectedUpgrades = [...selectedUpgrades];
    g.frameCount = 0;
    g.playerShieldCharges = hasUpgrade(g, "guard_shell") ? 1 : 0;
    const blueBall = g.balls.find((b) => b.id === 1);
    if (blueBall) {
      if (hasUpgrade(g, "extra_core")) {
        blueBall.hp += 1;
        blueBall.maxHp += 1;
        blueBall.radius += 3;
      }
      blueBall.vel = { x: 0, y: 0 };
    }
    g.items = [];
    g.coins = [];
    g.floatingTexts = [];
    g.itemSpawnTimer = ITEM_SPAWN_INTERVAL_S * 60;
    g.coinSpawnTimer = COIN_SPAWN_INTERVAL_S * 60;
    g.nextItemId = 0;
    g.nextCoinId = 0;
    g.nextTextId = 0;
    g.running = false;
    g.aiming = true;
    g.blueAim = { x: 1, y: 0 };
    g.winner = null;
    g.playerCoins = 0;
    startLoop();
  }, [selectedUpgrades, startLoop]);

  // ── Restart ───────────────────────────────────────────────────────────────

  const handleRestart = useCallback(() => {
    gameRef.current = makeInitialState();
    setSelectedUpgrades([]);
    setUiState({
      running: false,
      aiming: false,
      winner: null,
      balls: [],
      nextSpawnIn: ITEM_SPAWN_INTERVAL_S,
      nextCoinIn: COIN_SPAWN_INTERVAL_S,
      playerShieldCharges: 0,
      activeUpgrades: [],
      playerCoins: 0,
    });
    draw();
  }, [draw]);

  const launchFromAim = useCallback(() => {
    const g = gameRef.current;
    if (!g.aiming || g.winner) return;
    const blueBall = g.balls.find((b) => b.id === 1 && !b.dead);
    if (!blueBall) return;
    blueBall.vel.x = g.blueAim.x * BALL_SPEED;
    blueBall.vel.y = g.blueAim.y * BALL_SPEED;
    g.aiming = false;
    g.running = true;
  }, []);

  const handleCanvasMouseMove = useCallback((event: MouseEvent<HTMLCanvasElement>) => {
    const g = gameRef.current;
    if (!g.aiming) return;
    const blueBall = g.balls.find((b) => b.id === 1 && !b.dead);
    if (!blueBall) return;

    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const dx = x - blueBall.pos.x;
    const dy = y - blueBall.pos.y;
    const len = Math.hypot(dx, dy);
    if (len < 2) return;

    g.blueAim = { x: dx / len, y: dy / len };
  }, []);

  const handleCanvasClick = useCallback(() => {
    launchFromAim();
  }, [launchFromAim]);

  // ── Mount: start draw loop (idle) ────────────────────────────────────────

  useEffect(() => {
    draw();
    rafRef.current = requestAnimationFrame(function idle() {
      draw();
      if (!gameRef.current.running && !gameRef.current.winner) {
        rafRef.current = requestAnimationFrame(idle);
      }
    });
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  // ── Load player data from API ────────────────────────────────────────────

  useEffect(() => {
    const loadPlayerData = async () => {
      try {
        setIsLoading(true);
        const playerId = api.getPlayerId();
        const data = await api.loadPlayer();
        setPlayerData(data.player);
        setUsername(data.player?.username || `Player_${playerId.slice(-6)}`);
      } catch (error) {
        console.log("First time player or offline mode - starting fresh", error);
        setUsername(`Player_${Math.random().toString(36).substr(2, 6)}`);
      } finally {
        setIsLoading(false);
      }
    };
    loadPlayerData();
  }, []);

  // ── Save progress after round ends ───────────────────────────────────────

  useEffect(() => {
    if (!uiState.winner) return;

    const saveRound = async () => {
      try {
        const g = gameRef.current;
        const player = g.balls.find((b) => b.id === 1);
        const bot = g.balls.find((b) => b.id === 0);
        const won = player && !player.dead && bot && bot.dead;

        roundCountRef.current += 1;

        // Save round history
        await api.saveRound({
          roundNumber: roundCountRef.current,
          coinsEarned: g.playerCoins,
          itemsCollected: 0, // TODO: track this during game
          itemsTaken: 0, // TODO: track this during game
          upgradesUsed: selectedUpgrades,
          durationSeconds: Math.round(g.frameCount / 60),
          won: won || false,
        });

        // Save overall progress
        await api.saveProgress({
          coins: (playerData?.total_coins || 0) + g.playerCoins,
          roundsPlayed: roundCountRef.current,
          wins: (playerData?.total_wins || 0) + (won ? 1 : 0),
          highestScore: Math.max(playerData?.highest_score || 0, g.playerCoins),
          itemsCollected: playerData?.items_collected || 0,
          itemsTaken: playerData?.items_taken || 0,
          selectedUpgrades: selectedUpgrades,
        });

        // Reload player data
        const updated = await api.loadPlayer();
        setPlayerData(updated.player);

        console.log("✅ Game progress saved to database");
      } catch (error) {
        console.error("Failed to save game:", error);
      }
    };

    // Save after a short delay to ensure game state is finalized
    const timer = setTimeout(saveRound, 500);
    return () => clearTimeout(timer);
  }, [uiState.winner, selectedUpgrades, playerData?.total_coins, playerData?.total_wins, playerData?.highest_score, playerData?.items_collected, playerData?.items_taken]);

  const goHome = () => {
    handleRestart();
    setScreen("home");
  };

  const openShop = () => {
    if (screen === "game") handleRestart();
    setScreen("shop");
  };

  const playGame = () => {
    setScreen("game");
    handleStart();
  };

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}
    >
      <div className="mx-auto w-full max-w-6xl flex flex-col gap-6">
        <header className="text-center">
          <h1 className="text-4xl font-black text-white tracking-tight">
            <span className="text-indigo-400">Ball</span> <span className="text-sky-400">Arena</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Blue ball is your character. Start HP: 3.</p>
          {!isLoading && playerData && (
            <p className="text-amber-300 text-xs mt-2">
              Welcome, <span className="font-bold">{playerData.username}</span>! Stats: {playerData.total_coins} coins • {playerData.total_wins} wins • Best: {playerData.highest_score}
            </p>
          )}
        </header>

        {screen === "home" && (
          <section className="grid lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-3 text-slate-200 text-sm leading-6">
              <h2 className="text-xl font-bold text-white">Rules</h2>
              <p>Two balls bounce inside the arena. Wall and ball collisions repel both sides.</p>
              <p>Items spawn every 9 seconds and affect HP. Last alive wins the round.</p>
              <p>Every 15 seconds, a coin appears on the arena edge. Only blue player can take it.</p>
              <p>You can aim the blue ball before launch.</p>
              <div className="pt-2">
                <LegendPanel />
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={playGame}
                className="w-full py-3 rounded-xl font-bold text-white text-lg"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                Play
              </button>
              <button
                onClick={openShop}
                className="w-full py-3 rounded-xl font-bold text-white text-lg"
                style={{ background: "linear-gradient(135deg, #0369a1, #0ea5e9)" }}
              >
                Shop
              </button>
              <p className="text-xs text-slate-400">Selected upgrades: {selectedUpgrades.length}</p>
            </div>
          </section>
        )}

        {screen === "shop" && (
          <section className="max-w-3xl mx-auto w-full space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Shop</h2>
              <p className="text-indigo-300 text-sm">Points left: {shopPointsLeft}/{SHOP_POINTS_PER_ROUND}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {UPGRADES.map((upgrade) => {
                const selected = selectedUpgrades.includes(upgrade.id);
                const cannotBuy = !selected && shopPointsLeft < upgrade.cost;
                return (
                  <button
                    key={upgrade.id}
                    onClick={() => toggleUpgrade(upgrade.id)}
                    className="text-left rounded-xl px-4 py-3"
                    style={{
                      background: selected ? "rgba(14,165,233,0.2)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${selected ? "rgba(56,189,248,0.55)" : "rgba(255,255,255,0.12)"}`,
                      opacity: cannotBuy ? 0.55 : 1,
                    }}
                  >
                    <div className="flex items-center justify-between text-white text-sm font-bold">
                      <span>{upgrade.name}</span>
                      <span>{selected ? "Added" : `Cost ${upgrade.cost}`}</span>
                    </div>
                    <p className="text-slate-300 text-xs mt-1">{upgrade.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={goHome}
                className="flex-1 py-2 rounded-xl font-semibold text-white"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                Back
              </button>
              <button
                onClick={playGame}
                className="flex-1 py-2 rounded-xl font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                Play
              </button>
            </div>
          </section>
        )}

        {screen === "game" && (
          <section className="flex flex-col lg:flex-row gap-5 items-start justify-center">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                onMouseMove={handleCanvasMouseMove}
                onClick={handleCanvasClick}
                className="rounded-2xl"
                style={{
                  maxWidth: "min(95vw, 600px)",
                  maxHeight: "min(95vw, 600px)",
                  display: "block",
                  cursor: uiState.aiming ? "crosshair" : "default",
                  boxShadow: "0 0 60px rgba(99,102,241,0.3)",
                }}
              />
            </div>

            <div className="flex flex-col gap-3 min-w-[230px]">
              <div className="flex gap-2">
                {uiState.balls.map((b) => (
                  <HpCompact key={b.id} ball={b} />
                ))}
              </div>

              {uiState.playerShieldCharges > 0 && (
                <p className="text-xs text-sky-300 font-semibold">Guard Shell blocks left: {uiState.playerShieldCharges}</p>
              )}

              <p className="text-sm text-indigo-300">Next item: {uiState.nextSpawnIn}s</p>
              <p className="text-sm text-amber-300">Player coin in: {uiState.nextCoinIn}s</p>
              <p className="text-sm text-amber-200 font-bold">Coins: {uiState.playerCoins}</p>
              {uiState.activeUpgrades.length > 0 && (
                <p className="text-xs text-sky-200">
                  Active: {uiState.activeUpgrades.map((id) => UPGRADES.find((u) => u.id === id)?.name).filter(Boolean).join(", ")}
                </p>
              )}

              {uiState.aiming && !uiState.winner && (
                <button
                  onClick={launchFromAim}
                  className="w-full py-2 rounded-xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #0284c7, #0ea5e9)" }}
                >
                  Launch Blue Ball
                </button>
              )}

              {uiState.winner && (
                <div className="text-sm font-bold text-amber-300">Winner: {uiState.winner}</div>
              )}

              <button
                onClick={goHome}
                className="w-full py-2 rounded-xl font-semibold text-white"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                Main Menu
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ─── Utility: lighten hex color ───────────────────────────────────────────────

function lighten(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.min(255, r + 80);
  const lg = Math.min(255, g + 80);
  const lb = Math.min(255, b + 80);
  return `rgb(${lr},${lg},${lb})`;
}
