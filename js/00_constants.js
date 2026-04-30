// 00_constants.js — Constantes globais do game
// Carregado primeiro (before do 01_scene). Centraliza magic numbers
// que estavam espalhados em vários files.

// ── MUNDO ─────────────────────────────────────────────────────────
const WORLD_W = 8000;
const WORLD_H = 6000;

// ── BEAM / ufo ───────────────────────────────────────────────────
const BEAM_RADIUS_BASE   = 40 * 5.55 / 2;   // raio cone do beam
const BEAM_CAP_VACAS     = 5;               // max cows/oxen abduzidos
const BEAM_CAP_FARMERS   = 1;               // max farmers abduzidos (mutex with cows)
const NAVE_CARGA_DECAY   = 0.10;            // -10% speed by animal
const NAVE_CARGA_MIN     = 0.5;             // floor 50% same full

// ── DISTANCIAS (all em px, alguns squared to comparações without sqrt) ──
const FLEE_DIST          = 240;
const FLEE_DIST_SQ       = FLEE_DIST * FLEE_DIST;
const CURSOR_REACH       = 220;             // raio do cursor virtual (joystick/wasd)
const CURRAL_DROP_DIST   = 110;             // distance to dropar cows no corral
const CURRAL_DROP_DIST_SQ = CURRAL_DROP_DIST * CURRAL_DROP_DIST;

// ── HP / COLISÃO ──────────────────────────────────────────────────
const HIGH_SPEED         = 4.0;             // threshold de impacto to dano
const HIT_DEBOUNCE_MS    = 120;             // ignora hits seguidos
const FAZENDEIRO_BOUNCE  = 0.45;

// ── corral / BURGER ───────────────────────────────────────────────
const CURRAL_SLOTS       = 3;
const SLOT_VALOR         = [100, 150, 220];   // points by tipo (classic/cheese/double)
const SLOT_FUEL          = [22,  28,  36 ];   // fuel restaurado by tipo
const BURGER_TEXTURES    = ['burger_classic', 'burger_cheese', 'burger_double'];
const PROCESS_TIME_MS    = 3000;              // cow → burger

// ── SPEEDS ────────────────────────────────────────────────────────
// Threshold de "is se movendo" to anim picker
const SPEED_THRESHOLD_MOVING  = 0.5;
const SPEED_THRESHOLD_STATIC  = 0.05;

// ── HUD DEPTHS ────────────────────────────────────────────────────
// above do atmosphere overlay (195) e storm flash (196)
const HUD_DEPTH_BG       = 200;
const HUD_DEPTH_FG       = 201;
const HUD_DEPTH_HINT_BG  = 205;
const HUD_DEPTH_HINT_FG  = 206;

// ── ATMOSPHERE / FX DEPTHS ────────────────────────────────────────
const FX_DEPTH_RAIN      = 180;
const FX_DEPTH_SNOW      = 181;
const FX_DEPTH_ATMO_GRAD = 195;
const FX_DEPTH_ATMO_FLASH = 196;

// ── HELPER: testa se cow/ox pode ser abduzida now ─────────────
// Substitui o filter !v.isBurger && !v.isEnemy && !v._inCurral repetido em 4+ lugares
function isAbducibleCow(v) {
    return v && v.scene && !v.isBurger && !v.isEnemy &&
           !v._inCurral && !v._dying && !v._destroyed;
}

// Helper de distance squared (evita Math.sqrt em comparações)
function distSq(ax, ay, bx, by) {
    const dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy;
}
