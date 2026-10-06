// ============ 地圖 ============
const FarmMap = {
  ground: [],          // 0 草地 / 1 步道 / 2 水池
  solid: new Set(),    // 不可通行的格子 "x,y"
  trees: [],           // 邊界樹林（繪圖用）
  HOUSE: { x: 2,  y: 1,  w: 5, h: 4, door: { x: 4, y: 4 } },
  BIN:   { x: 8,  y: 2,  w: 2, h: 2 },
  SHOP:  { x: 17, y: 1,  w: 6, h: 4 },
  COOP:  { x: 2,  y: 12, w: 3, h: 2 },
  POND:  { x: 18, y: 12, w: 5, h: 5, cx: 20, cy: 14, r: 2.2 },

  build() {
    this.ground = [];
    this.solid = new Set();
    this.trees = [];
    for (let y = 0; y < MAP_H; y++) {
      const row = [];
      for (let x = 0; x < MAP_W; x++) row.push(0);
      this.ground.push(row);
    }
    const solidRect = (rx, ry, rw, rh) => {
      for (let y = ry; y < ry + rh; y++)
        for (let x = rx; x < rx + rw; x++) this.solid.add(x + ',' + y);
    };
    // 邊界樹林
    for (let x = 0; x < MAP_W; x++) {
      this.solid.add(x + ',0'); this.solid.add(x + ',' + (MAP_H - 1));
      this.trees.push({ x, y: 0 }, { x, y: MAP_H - 1 });
    }
    for (let y = 1; y < MAP_H - 1; y++) {
      this.solid.add('0,' + y); this.solid.add((MAP_W - 1) + ',' + y);
      this.trees.push({ x: 0, y }, { x: MAP_W - 1, y });
    }
    // 建築物
    solidRect(this.HOUSE.x, this.HOUSE.y, this.HOUSE.w, this.HOUSE.h);
    solidRect(this.BIN.x, this.BIN.y, this.BIN.w, this.BIN.h);
    solidRect(this.SHOP.x, this.SHOP.y, this.SHOP.w, this.SHOP.h);
    solidRect(this.COOP.x, this.COOP.y, this.COOP.w, this.COOP.h);
    // 池塘（橢圓）
    for (let y = this.POND.y; y < this.POND.y + this.POND.h; y++)
      for (let x = this.POND.x; x < this.POND.x + this.POND.w; x++) {
        const dx = (x - this.POND.cx) / this.POND.r;
        const dy = (y - this.POND.cy) / this.POND.r;
        if (dx * dx + dy * dy <= 1) {
          this.ground[y][x] = 2;
          this.solid.add(x + ',' + y);
        }
      }
    // 步道
    for (let y = 5; y <= 7; y++) this.ground[y][4] = 1;
    for (let x = 4; x <= 19; x++) this.ground[7][x] = 1;
    for (let y = 5; y <= 7; y++) this.ground[y][19] = 1;
  },

  isSolid(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
    return this.solid.has(tx + ',' + ty);
  },
};

// ============ 遊戲狀態 ============
const Game = {
  state: 'title',        // 'title' | 'play'
  modalOpen: null,       // 'dialog' | 'shop' | 'ship' | 'help'
  money: 500,
  energy: 100, maxEnergy: 100,
  year: 1, seasonIdx: 0, day: 1,
  hour: GAME_START_HOUR, minF: 0,
  weather: 'sunny',      // 'sunny' | 'rain'
  player: { x: 144, y: 208, dir: 'down', moving: false, animT: 0 },
  farm: {},              // "x,y" -> { watered, crop: null | {id, stage, days, regrow, withered} }
  seeds: {},             // cropId -> 數量
  items: {},             // cropId / 'egg' -> 數量
  chickens: [],
  pets: [],              // 寵物狗／貓 {type, x, y, dir, mode, t, animT, vy, cryT}
  eggs: [],              // 地上的雞蛋 {x, y}（格子座標）
  flowers: [],
  hearts: [],            // 摸小動物愛心特效
  bubbles: [],           // 小動物對話泡泡 { target, text, t }
  selectedTool: 0,
  selectedSeed: 'turnip',
  milestones: {},
};

function resetGameState() {
  Game.money = 500;
  Game.energy = Game.maxEnergy;
  Game.year = 1; Game.seasonIdx = 0; Game.day = 1;
  Game.hour = GAME_START_HOUR; Game.minF = 0;
  Game.weather = 'sunny';
  Game.player = { x: 4.5 * TILE, y: 6.5 * TILE, dir: 'down', moving: false, animT: 0, useT: 0 };
  Game.farm = {};
  Game.seeds = { turnip: 4 };
  Game.items = {};
  Game.eggs = [];
  Game.pets = [];
  Game.hearts = [];
  Game.bubbles = [];
  Game.milestones = {};
  Game.selectedTool = 0;
  Game.selectedSeed = 'turnip';
  Game.chickens = [
    { x: 3.5 * TILE, y: 15 * TILE, dir: 'right', mode: 'idle', t: 1, animT: 0, vy: 0, cluckT: 3 },
    { x: 6.5 * TILE, y: 14.5 * TILE, dir: 'left', mode: 'idle', t: 2, animT: 0, vy: 0, cluckT: 7 },
  ];
  genFlowers();
}

function genFlowers() {
  Game.flowers = [];
  const colors = ['red', 'yellow', 'white'];
  let tries = 0;
  while (Game.flowers.length < 14 && tries < 300) {
    tries++;
    const x = 1 + Math.floor(Math.random() * (MAP_W - 2));
    const y = 1 + Math.floor(Math.random() * (MAP_H - 2));
    if (FarmMap.ground[y][x] !== 0 || FarmMap.solid.has(x + ',' + y)) continue;
    if (Game.flowers.some(f => f.x === x && f.y === y)) continue;
    Game.flowers.push({ x, y, color: colors[Math.floor(Math.random() * 3)] });
  }
}

// ============ 工具與互動 ============
function facingTile() {
  const p = Game.player;
  let dx = 0, dy = 0;
  if (p.dir === 'up') dy = -1;
  else if (p.dir === 'down') dy = 1;
  else if (p.dir === 'left') dx = -1;
  else dx = 1;
  return {
    tx: Math.floor((p.x + dx * 22) / TILE),
    ty: Math.floor((p.y + dy * 22) / TILE),
  };
}

function fail(msg) { toast(msg); Sfx.error(); }

function useEnergy(n) {
  if (Game.energy < n) { fail('😫 體力不足！回家睡覺吧'); return false; }
  Game.energy -= n;
  Game.player.useT = 0.25;   // 揮動工具的動畫
  return true;
}

function addItem(id, n) {
  Game.items[id] = (Game.items[id] || 0) + n;
}

function useTool() {
  if (Game.state !== 'play' || Game.modalOpen) return;
  const tool = TOOLS[Game.selectedTool];
  const { tx, ty } = facingTile();
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return;
  const k = tx + ',' + ty;
  const t = Game.farm[k];

  switch (tool.id) {
    case 'hoe': {
      if (t || FarmMap.isSolid(tx, ty) || FarmMap.ground[ty][tx] !== 0) { fail('不能在這裡翻土'); return; }
      if (!useEnergy(tool.energy)) return;
      Game.farm[k] = { watered: false, crop: null };
      Game.flowers = Game.flowers.filter(f => !(f.x === tx && f.y === ty));
      Sfx.hoe();
      break;
    }
    case 'water': {
      if (!t) { fail('這裡沒有田地'); return; }
      if (t.watered) { fail('已經澆過水了'); return; }
      if (!useEnergy(tool.energy)) return;
      t.watered = true;
      Sfx.water();
      break;
    }
    case 'seed': {
      const id = Game.selectedSeed;
      const def = CROPS[id];
      if (!t || t.crop) { fail('要在翻好的空地上播種'); return; }
      if ((Game.seeds[id] || 0) <= 0) { fail(`沒有${def.name}種子了，去商店買吧`); return; }
      if (!def.seasons.includes(SEASONS[Game.seasonIdx])) { fail(`${def.name}不適合在${SEASONS[Game.seasonIdx]}天種植`); return; }
      if (!useEnergy(tool.energy)) return;
      Game.seeds[id]--;
      t.crop = { id, stage: 0, days: 0, regrow: 0, withered: false };
      Sfx.plant();
      toast(`🌱 種下了${def.name}種子`);
      break;
    }
    case 'scythe': {
      if (!t || !t.crop) { fail('這裡沒有作物'); return; }
      if (!useEnergy(tool.energy)) return;
      t.crop = null;
      Sfx.scythe();
      toast('清除了作物');
      break;
    }
    case 'hand': {
      if (!t || !t.crop) { fail('沒有可採收的作物'); return; }
      const c = t.crop, def = CROPS[c.id];
      if (c.withered) { fail('作物枯萎了，用鐮刀清除吧'); return; }
      const last = def.stages.length - 1;
      if (c.stage !== last || c.regrow > 0) { fail('還沒成熟，記得天天澆水'); return; }
      if (!useEnergy(1)) return;
      addItem(c.id, 1);
      Sfx.harvest();
      toast(`🧺 採收了${def.name}！`);
      if (!Game.milestones.firstHarvest) {
        Game.milestones.firstHarvest = true;
        setTimeout(() => toast('🎉 第一次收成！拿到家旁的出貨箱賣掉吧'), 600);
      }
      if (def.regrowDays > 0) c.regrow = def.regrowDays;
      else t.crop = null;
      break;
    }
  }
}

// 玩家接近可互動物件時，回傳 { type, hint, target }，否則 null
function getNearbyInteraction() {
  const p = Game.player;
  // 家門（睡覺）
  const doorCx = (FarmMap.HOUSE.door.x + 0.5) * TILE;
  const doorCy = (FarmMap.HOUSE.door.y + 0.5) * TILE;
  if (Math.hypot(p.x - doorCx, p.y - doorCy) < 52) {
    return { type: 'sleep', hint: '🛏 按【E】睡覺（進入下一天・體力全滿・自動存檔）' };
  }
  // 出貨箱
  if (nearRect(p, FarmMap.BIN, 44)) {
    return { type: 'ship', hint: '📦 按【E】打開出貨箱（賣出作物換錢）' };
  }
  // 商店
  if (nearRect(p, FarmMap.SHOP, 44)) {
    return { type: 'shop', hint: '🏪 按【E】打開商店（購買種子・寵物）' };
  }
  // 小雞
  const ch = Game.chickens.find(c => Math.hypot(c.x - p.x, c.y - p.y) < 52);
  if (ch) return { type: 'pet', hint: '🐔 按【E】摸摸小雞', target: ch };
  // 寵物狗／貓
  const pt = Game.pets.find(q => Math.hypot(q.x - p.x, q.y - p.y) < 52);
  if (pt) {
    const def = PETS[pt.type];
    return { type: 'pet', hint: `${def.icon} 按【E】摸摸${def.name}`, target: pt };
  }
  return null;
}

function nearRect(p, r, dist) {
  const nx = Math.max(r.x * TILE, Math.min(p.x, (r.x + r.w) * TILE));
  const ny = Math.max(r.y * TILE, Math.min(p.y, (r.y + r.h) * TILE));
  return Math.hypot(p.x - nx, p.y - ny) < dist;
}

function interact() {
  if (Game.state !== 'play' || Game.modalOpen) return;
  const it = getNearbyInteraction();
  if (!it) return;

  if (it.type === 'sleep') {
    showDialog('🛏 要睡到明天早上嗎？<br><small>（體力全滿・自動存檔）</small>', [
      { label: '睡覺', primary: true, cb: doSleep },
      { label: '取消', cb: null },
    ]);
  } else if (it.type === 'ship') {
    openShip();
  } else if (it.type === 'shop') {
    openShop();
  } else if (it.type === 'pet') {
    Game.hearts.push({ x: it.target.x + 20, y: it.target.y - 26, t: 1 }); // 偏右上方，唔會同泡泡重疊
    const isChicken = !it.target.type;
    const text = isChicken ? '咕咕♪' : PETS[it.target.type].cryLove;
    Game.bubbles.push({ target: it.target, text, t: 1.6 });
    if (isChicken) Sfx.pet();
    else if (it.target.type === 'dog') Sfx.bark();
    else Sfx.meow();
  }
}

function cycleSeed() {
  const owned = Object.keys(CROPS).filter(id => (Game.seeds[id] || 0) > 0);
  if (!owned.length) { fail('沒有種子了，去商店買吧'); return; }
  const i = owned.indexOf(Game.selectedSeed);
  Game.selectedSeed = owned[(i + 1) % owned.length];
  Sfx.pop();
}

// ============ 商店與出貨 ============
function buySeed(id, n) {
  const def = CROPS[id];
  const cost = def.seedPrice * n;
  if (Game.money < cost) { fail('錢不夠！'); return; }
  Game.money -= cost;
  Game.seeds[id] = (Game.seeds[id] || 0) + n;
  Sfx.coin();
  renderShop();
}

// 購買寵物（每種限養一隻），買完會在商店門口出現
function buyPet(type) {
  const def = PETS[type];
  if (Game.pets.some(p => p.type === type)) { fail(`已經養了${def.name}了！`); return; }
  if (Game.money < def.price) { fail('錢不夠！'); return; }
  Game.money -= def.price;
  const px = (FarmMap.SHOP.x + 3) * TILE;
  const py = (FarmMap.SHOP.y + FarmMap.SHOP.h + 1.5) * TILE;
  Game.pets.push({ type, x: px, y: py, dir: 'left', mode: 'idle', t: 1, animT: 0, vy: 0, cryT: 4 + Math.random() * 6 });
  Sfx.coin();
  setTimeout(() => (type === 'dog' ? Sfx.bark() : Sfx.meow()), 300);
  toast(`${def.icon} ${def.name}加入了你的牧場！`);
  renderShop();
  saveGame();
}

function sellItem(id, n) {
  const have = Game.items[id] || 0;
  if (have <= 0) return;
  n = Math.min(n, have);
  const price = id === 'egg' ? EGG_PRICE : CROPS[id].sellPrice;
  Game.items[id] -= n;
  Game.money += price * n;
  Sfx.coin();
  toast(`💰 賣出獲得 ${price * n}G`);
  checkMilestones();
  renderShip();
}

function checkMilestones() {
  if (Game.money >= 1500 && !Game.milestones.m1) {
    Game.milestones.m1 = true;
    setTimeout(() => toast('🎉 存款突破 1500G！真是經營有方！'), 700);
  }
  if (Game.money >= 4000 && !Game.milestones.m2) {
    Game.milestones.m2 = true;
    setTimeout(() => toast('👑 存款突破 4000G！牧場大亨就是你！'), 700);
  }
}

// ============ 日期推進 ============
function advanceDay(passOut) {
  Game.day++;
  let seasonChanged = false;
  if (Game.day > DAYS_PER_SEASON) {
    Game.day = 1;
    Game.seasonIdx++;
    seasonChanged = true;
    if (Game.seasonIdx >= SEASONS.length) { Game.seasonIdx = 0; Game.year++; }
  }
  const season = SEASONS[Game.seasonIdx];

  // 作物成長（依「昨天」的澆水狀態）
  for (const k of Object.keys(Game.farm)) {
    const t = Game.farm[k];
    if (t.crop) {
      const def = CROPS[t.crop.id];
      if (!def.seasons.includes(season)) {
        t.crop.withered = true;
      } else if (!t.crop.withered && t.watered) {
        if (t.crop.regrow > 0) t.crop.regrow--;
        else if (t.crop.stage < def.stages.length - 1) {
          t.crop.days++;
          if (t.crop.days >= def.stages[t.crop.stage]) { t.crop.stage++; t.crop.days = 0; }
        }
      }
    } else if (Math.random() < 0.4) {
      delete Game.farm[k];   // 空地慢慢變回草地
      continue;
    }
    t.watered = false;
  }

  // 新天氣（25% 下雨，自動澆水）
  Game.weather = Math.random() < 0.25 ? 'rain' : 'sunny';
  if (Game.weather === 'rain') {
    for (const k of Object.keys(Game.farm)) Game.farm[k].watered = true;
  }

  Game.hour = GAME_START_HOUR;
  Game.minF = 0;
  Game.energy = passOut ? Math.floor(Game.maxEnergy / 2) : Game.maxEnergy;
  layEggs();
  saveGame();
  return seasonChanged;
}

function layEggs() {
  Game.eggs = [];
  for (const ch of Game.chickens) {
    if (Math.random() < 0.6 && Game.eggs.length < 8) {
      for (let i = 0; i < 12; i++) {
        const tx = 2 + Math.floor(Math.random() * 7);   // x 2-8
        const ty = 11 + Math.floor(Math.random() * 6);  // y 11-16
        if (FarmMap.isSolid(tx, ty) || FarmMap.ground[ty][tx] !== 0) continue;
        if (Game.eggs.some(e => e.x === tx && e.y === ty)) continue;
        Game.eggs.push({ x: tx, y: ty });
        break;
      }
    }
  }
}

function morningReport(seasonChanged) {
  toast(`☀ 第 ${Game.day} 天早上！`);
  if (seasonChanged) toast(`${SEASON_ICONS[Game.seasonIdx]} 季節變換了！現在是${SEASONS[Game.seasonIdx]}天`);
  if (Game.weather === 'rain') toast('🌧 今天下雨，作物自動澆水了！');
}

function doSleep() {
  closeModal();
  Sfx.sleep();
  const seasonChanged = advanceDay(false);
  toast('😴 一覺好眠，體力完全恢復了');
  morningReport(seasonChanged);
}

function passOut() {
  const seasonChanged = advanceDay(true);
  toast('😵 你累倒了……被人抬回了家（體力只恢復一半）');
  morningReport(seasonChanged);
}

// ============ 存檔 ============
const SAVE_KEY = 'bokujou_save_v1';

function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
}

function saveGame() {
  if (Game.state !== 'play') return;
  const d = {
    money: Game.money, energy: Game.energy,
    year: Game.year, seasonIdx: Game.seasonIdx, day: Game.day,
    hour: Game.hour, minF: Game.minF, weather: Game.weather,
    farm: Game.farm, seeds: Game.seeds, items: Game.items,
    eggs: Game.eggs, milestones: Game.milestones,
    pets: Game.pets.map(p => ({ type: p.type, x: p.x, y: p.y })),
    selectedSeed: Game.selectedSeed, selectedTool: Game.selectedTool,
    player: { x: Game.player.x, y: Game.player.y, dir: Game.player.dir },
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); } catch (e) {}
}

function loadGame() {
  let d;
  try { d = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return false; }
  if (!d) return false;
  resetGameState();
  Game.money = d.money; Game.energy = d.energy;
  Game.year = d.year; Game.seasonIdx = d.seasonIdx; Game.day = d.day;
  Game.hour = d.hour; Game.minF = d.minF || 0;
  Game.weather = d.weather || 'sunny';
  Game.farm = d.farm || {};
  Game.seeds = d.seeds || {};
  Game.items = d.items || {};
  Game.eggs = d.eggs || [];
  Game.pets = (d.pets || []).map(p => ({
    type: p.type, x: p.x, y: p.y,
    dir: 'right', mode: 'idle', t: 1, animT: 0, vy: 0, cryT: 4 + Math.random() * 6,
  }));
  Game.milestones = d.milestones || {};
  Game.selectedSeed = d.selectedSeed || 'turnip';
  Game.selectedTool = d.selectedTool || 0;
  if (d.player) { Game.player.x = d.player.x; Game.player.y = d.player.y; Game.player.dir = d.player.dir; }
  return true;
}
