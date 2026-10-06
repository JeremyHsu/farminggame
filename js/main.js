// ============ 主程式：初始化、輸入、遊戲迴圈、繪圖、UI ============
const $ = id => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const Keys = {};
let lastT = 0;
let animClock = 0;

// 雨滴特效
const rainDrops = [];
for (let i = 0; i < 90; i++) {
  rainDrops.push({ x: Math.random() * 850, y: Math.random() * 576, s: 300 + Math.random() * 200 });
}

// ============ 初始化 ============
function init() {
  initSprites();
  FarmMap.build();
  resetGameState();
  buildToolbelt();
  wireUI();

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', e => { Keys[e.key.toLowerCase()] = false; });
  window.addEventListener('beforeunload', () => saveGame());
  // 按鈕點完取消焦點，避免空白鍵誤觸
  document.addEventListener('click', e => {
    const b = e.target.closest('.btn');
    if (b) b.blur();
  });

  requestAnimationFrame(loop);
}

function wireUI() {
  if (hasSave()) $('btn-continue').classList.remove('hidden');

  $('btn-new').onclick = () => {
    Sfx.ensure();
    if (hasSave()) {
      $('modal-title').classList.add('hidden');
      showDialog('已有舊存檔，重新開始會覆蓋它。<br>確定要開始新遊戲嗎？', [
        { label: '開始新遊戲', primary: true, cb: startNewGame },
        { label: '取消', cb: () => $('modal-title').classList.remove('hidden') },
      ]);
    } else startNewGame();
  };

  $('btn-continue').onclick = () => {
    Sfx.ensure();
    if (loadGame()) {
      Game.state = 'play';
      $('modal-title').classList.add('hidden');
      $('hud-top').classList.remove('hidden');
      $('toolbelt').classList.remove('hidden');
      $('tool-hint').classList.remove('hidden');
      toast('📂 讀取存檔成功！');
    }
  };

  $('btn-help').onclick = () => { Sfx.ensure(); openModal('help'); };
  $('btn-help-hud').onclick = () => { if (Game.state === 'play' && !Game.modalOpen) openModal('help'); };
  $('btn-help-close').onclick = () => closeModal();
  $('btn-shop-close').onclick = () => closeModal();
  $('btn-ship-close').onclick = () => closeModal();
}

function startNewGame() {
  resetGameState();
  Game.state = 'play';
  $('modal-title').classList.add('hidden');
  $('hud-top').classList.remove('hidden');
  $('toolbelt').classList.remove('hidden');
  $('tool-hint').classList.remove('hidden');
  saveGame();
  toast('🌱 歡迎來到悠閒牧場！');
  setTimeout(() => toast('按 H 查看操作說明'), 900);
  setTimeout(() => toast('鋤頭翻土 → 播種 → 澆水，開始種田吧！'), 1800);
}

// ============ 輸入 ============
function onKeyDown(e) {
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  Keys[k] = true;
  Sfx.ensure();
  if (Game.state !== 'play') return;
  if (Game.modalOpen) {
    if (k === 'escape') closeModal();
    return;
  }
  if (k >= '1' && k <= '5') selectTool(Number(k) - 1);
  else if (k === 'q') cycleSeed();
  else if (k === ' ') useTool();
  else if (k === 'e') interact();
  else if (k === 'h') openModal('help');
  else if (k === 'm') { Sfx.enabled = !Sfx.enabled; toast(Sfx.enabled ? '🔊 音效開啟' : '🔇 音效關閉'); }
}

function selectTool(i) {
  Game.selectedTool = i;
  Sfx.pop();
}

// ============ 遊戲迴圈 ============
function loop(t) {
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0);
  lastT = t;
  animClock += dt;

  if (Game.state === 'play' && !Game.modalOpen) {
    // 遊戲時鐘
    Game.minF += dt * MIN_PER_SEC;
    while (Game.minF >= 60) { Game.minF -= 60; Game.hour++; }
    if (Game.hour >= GAME_END_HOUR) passOut();

    updatePlayer(dt);
    updateChickens(dt);
    updatePets(dt);
    checkEggs();
    for (let i = Game.hearts.length - 1; i >= 0; i--) {
      Game.hearts[i].t -= dt;
      if (Game.hearts[i].t <= 0) Game.hearts.splice(i, 1);
    }
    for (let i = Game.bubbles.length - 1; i >= 0; i--) {
      Game.bubbles[i].t -= dt;
      if (Game.bubbles[i].t <= 0) Game.bubbles.splice(i, 1);
    }
  }
  if (Game.weather === 'rain') updateRain(dt);

  render();
  requestAnimationFrame(loop);
}

function updatePlayer(dt) {
  const p = Game.player;
  if (p.useT > 0) p.useT -= dt;
  let mx = 0, my = 0;
  if (Keys['arrowup'] || Keys['w']) my -= 1;
  if (Keys['arrowdown'] || Keys['s']) my += 1;
  if (Keys['arrowleft'] || Keys['a']) mx -= 1;
  if (Keys['arrowright'] || Keys['d']) mx += 1;
  p.moving = !!(mx || my);
  if (!p.moving) { p.animT = 0; return; }
  const len = Math.hypot(mx, my);
  mx /= len; my /= len;
  if (Math.abs(mx) > Math.abs(my)) p.dir = mx > 0 ? 'right' : 'left';
  else p.dir = my > 0 ? 'down' : 'up';
  const sp = 130;
  tryMove(p, mx * sp * dt, 0);
  tryMove(p, 0, my * sp * dt);
  p.animT += dt;
}

function tryMove(p, dx, dy) {
  const nx = p.x + dx, ny = p.y + dy;
  const l = nx - 9, r = nx + 9, t = ny + 2, b = ny + 13;
  const pts = [[l, t], [r, t], [l, b], [r, b]];
  for (const [px, py] of pts) {
    if (FarmMap.isSolid(Math.floor(px / TILE), Math.floor(py / TILE))) return;
  }
  p.x = nx; p.y = ny;
}

function updateChickens(dt) {
  for (const c of Game.chickens) {
    c.t -= dt;
    // 間唔中自己咕咕叫（泡泡）
    c.cluckT -= dt;
    if (c.cluckT <= 0) {
      c.cluckT = 6 + Math.random() * 10;
      if (Game.bubbles.length < 4) Game.bubbles.push({ target: c, text: '咕咕', t: 1.4 });
    }
    if (c.t <= 0) {
      if (c.mode === 'idle' || Math.random() < 0.5) {
        c.mode = 'move';
        c.dir = Math.random() < 0.5 ? 'left' : 'right';
        c.vy = (Math.random() - 0.5) * 30;
        c.t = 0.8 + Math.random() * 1.2;
      } else {
        c.mode = 'idle';
        c.t = 1 + Math.random() * 2;
      }
    }
    if (c.mode === 'move') {
      const sp = 36;
      const nx = c.x + (c.dir === 'right' ? sp : -sp) * dt;
      const ny = c.y + c.vy * dt;
      if (!pointSolid(nx, c.y)) c.x = nx;
      if (!pointSolid(c.x, ny)) c.y = ny;
      c.animT += dt;
    } else c.animT = 0;
  }
}

// 寵物散步邏輯（同小雞一樣，但行得快少少，仲會間唔中叫）
function updatePets(dt) {
  for (const c of Game.pets) {
    c.t -= dt;
    c.cryT -= dt;
    if (c.cryT <= 0) {
      c.cryT = 8 + Math.random() * 12;
      if (Game.bubbles.length < 4) Game.bubbles.push({ target: c, text: PETS[c.type].cry, t: 1.4 });
    }
    if (c.t <= 0) {
      if (c.mode === 'idle' || Math.random() < 0.5) {
        c.mode = 'move';
        c.dir = Math.random() < 0.5 ? 'left' : 'right';
        c.vy = (Math.random() - 0.5) * 40;
        c.t = 0.8 + Math.random() * 1.4;
      } else {
        c.mode = 'idle';
        c.t = 0.8 + Math.random() * 1.8;
      }
    }
    if (c.mode === 'move') {
      const sp = 52;
      const nx = c.x + (c.dir === 'right' ? sp : -sp) * dt;
      const ny = c.y + c.vy * dt;
      if (!pointSolid(nx, c.y)) c.x = nx;
      if (!pointSolid(c.x, ny)) c.y = ny;
      c.animT += dt;
    } else c.animT = 0;
  }
}

function pointSolid(x, y) {
  const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
  if (tx < 1 || ty < 1 || tx >= MAP_W - 1 || ty >= MAP_H - 1) return true;
  return FarmMap.solid.has(tx + ',' + ty);
}

function checkEggs() {
  const p = Game.player;
  for (let i = Game.eggs.length - 1; i >= 0; i--) {
    const e = Game.eggs[i];
    const ex = e.x * TILE + 16, ey = e.y * TILE + 16;
    if (Math.abs(ex - p.x) < 20 && Math.abs(ey - p.y) < 20) {
      Game.eggs.splice(i, 1);
      addItem('egg', 1);
      Sfx.pop();
      toast('🥚 撿到了雞蛋！');
    }
  }
}

function updateRain(dt) {
  for (const d of rainDrops) {
    d.y += d.s * dt;
    d.x -= d.s * dt * 0.15;
    if (d.y > 576) { d.y = -10; d.x = Math.random() * 850; }
  }
}

// ============ 繪圖 ============
function cropSprite(c) {
  if (c.withered) return SPR.withered;
  const def = CROPS[c.id];
  const last = def.stages.length - 1;
  if (c.regrow > 0) return SPR.bush;
  if (c.stage === 0) return SPR.stageSeed;
  if (c.stage === last) return SPR.mature[c.id];
  if (c.stage === 1) return SPR.sprout;
  return SPR.bush;
}

function render() {
  // 地面
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const g = FarmMap.ground[y][x];
      let spr;
      if (g === 2) spr = (Math.floor(animClock * 1.5) % 2) ? SPR.water1 : SPR.water0;
      else if (g === 1) spr = SPR.path;
      else spr = ((x * 7 + y * 13) % 3 === 0) ? SPR.grassF : SPR.grass;
      ctx.drawImage(spr, x * TILE, y * TILE, TILE, TILE);
    }
  }

  // 農地與作物
  for (const k in Game.farm) {
    const [x, y] = k.split(',').map(Number);
    const t = Game.farm[k];
    ctx.drawImage(t.watered ? SPR.soilWet : SPR.soilDry, x * TILE, y * TILE, TILE, TILE);
    if (t.crop) {
      const spr = cropSprite(t.crop);
      if (spr) ctx.drawImage(spr, x * TILE, y * TILE, TILE, TILE);
    }
  }

  // 花與雞蛋
  for (const f of Game.flowers) ctx.drawImage(SPR.flower[f.color], f.x * TILE, f.y * TILE, TILE, TILE);
  for (const e of Game.eggs) ctx.drawImage(SPR.egg, e.x * TILE, e.y * TILE, TILE, TILE);

  // 建築物
  drawHouse();
  drawBin();
  drawShop();
  drawCoop();

  // 邊界樹林
  for (const t of FarmMap.trees) {
    const spr = ((t.x * 5 + t.y * 3) % 2) ? SPR.treeF : SPR.tree;
    ctx.drawImage(spr, t.x * TILE, t.y * TILE, TILE, TILE);
  }

  // 角色與動物（依 y 排序）
  const ents = [];
  for (const c of Game.chickens) ents.push({ y: c.y, draw: () => drawChicken(c) });
  for (const c of Game.pets) ents.push({ y: c.y, draw: () => drawPet(c) });
  ents.push({ y: Game.player.y, draw: drawPlayer });
  ents.sort((a, b) => a.y - b.y);
  for (const e of ents) e.draw();

  // 小雞對話泡泡
  for (const b of Game.bubbles) drawBubble(b);

  // 愛心特效（實色像素心心，彈出後上升，最後先淡出）
  // 注意：心心要畫喺泡泡之後，保證唔會被泡泡遮擋
  for (const h of Game.hearts) {
    const age = 1 - h.t;                    // 0 → 1
    const pop = Math.min(1, age * 6);       // 開頭快速彈出
    const size = 30 * (0.5 + 0.5 * pop);    // 15px → 30px
    ctx.globalAlpha = h.t > 0.25 ? 1 : h.t / 0.25;
    ctx.drawImage(SPR.heart, Math.round(h.x - size / 2), Math.round(h.y - age * 26 - size / 2), size, size);
    ctx.globalAlpha = 1;
  }

  // 目標格子提示框
  if (Game.state === 'play' && !Game.modalOpen) {
    const { tx, ty } = facingTile();
    if (tx >= 0 && ty >= 0 && tx < MAP_W && ty < MAP_H) {
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 2;
      ctx.strokeRect(tx * TILE + 1, ty * TILE + 1, TILE - 2, TILE - 2);
    }
  }

  // 雨天效果
  if (Game.weather === 'rain') {
    ctx.fillStyle = 'rgba(60,80,140,0.10)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(180,205,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const d of rainDrops) { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 2, d.y + 9); }
    ctx.stroke();
  }

  // 夜晚暗化
  const na = nightAlpha();
  if (na > 0) {
    ctx.fillStyle = `rgba(12,14,48,${na})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (Game.state === 'play') updateHUD();
}

function nightAlpha() {
  const t = Game.hour + Game.minF / 60;
  if (t < 17) return 0;
  if (t < 19) return (t - 17) / 2 * 0.22;
  if (t < 21) return 0.22 + (t - 19) / 2 * 0.18;
  return Math.min(0.48, 0.4 + (t - 21) * 0.02);
}

function drawPlayer() {
  const p = Game.player;
  const frames = SPR.player[p.dir];
  const f = p.moving ? frames[Math.floor(p.animT * 7) % 2] : frames[0];
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 12, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (p.dir === 'up') drawToolInHand(p);   // 面向上時工具在身後
  ctx.drawImage(f, Math.round(p.x - 16), Math.round(p.y - 22), 32, 32);
  if (p.dir !== 'up') drawToolInHand(p);
}

// 每種工具的「握把點」（在 16x16 圖中的位置），對準角色的手
const TOOL_GRIP = {
  hoe:    { gx: 7,  gy: 13 },
  water:  { gx: 8,  gy: 0  },
  seed:   { gx: 7,  gy: 0  },
  scythe: { gx: 8,  gy: 11 },
  hand:   { gx: 7,  gy: 0  },
};

// 角色手的螢幕位置（對齊 sprite 手臂）
function handPos(p) {
  if (p.dir === 'up') return { x: p.x - 8, y: p.y - 4 };
  if (p.dir === 'left') return { x: p.x - 8, y: p.y - 4 };
  return { x: p.x + 8, y: p.y - 4 };   // down / right
}

// 手上拿著目前選擇的工具，使用時以手為軸心揮動
function drawToolInHand(p) {
  if (Game.state !== 'play') return;
  const toolId = TOOLS[Game.selectedTool].id;
  const left = p.dir === 'left';
  const spr = left ? SPR.toolsL[toolId] : SPR.tools[toolId];
  const grip = TOOL_GRIP[toolId];
  if (!spr || !grip) return;
  const gx = left ? (16 - grip.gx) : grip.gx;   // 鏡像圖握把 x 要翻轉
  const hand = handPos(p);
  const bob = p.moving ? Math.sin(p.animT * 14) * 1.5 : 0;
  // 揮動進度 0→1→0
  const swing = p.useT > 0 ? Math.sin((0.25 - p.useT) / 0.25 * Math.PI) : 0;
  // 平時輕微傾斜，揮動時大幅旋轉
  const idleTilt = (toolId === 'hoe' || toolId === 'scythe') ? 0.15 : 0;
  const ang = (left ? -1 : 1) * (idleTilt + swing * 1.3);
  // 揮動時往面前伸出一點
  let fx = 0, fy = 0;
  if (p.dir === 'down') fy = 6;
  else if (p.dir === 'up') fy = -6;
  else if (p.dir === 'right') fx = 6;
  else fx = -6;
  ctx.save();
  ctx.translate(Math.round(hand.x + fx * swing), Math.round(hand.y + bob + fy * swing));
  ctx.rotate(ang);
  ctx.drawImage(spr, -gx * 2, -grip.gy * 2, 32, 32);
  ctx.restore();
}

function drawChicken(c) {
  const frames = c.dir === 'left' ? SPR.chickenL : SPR.chicken;
  const f = c.mode === 'move' ? frames[Math.floor(c.animT * 8) % 2] : frames[0];
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(c.x, c.y + 9, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(f, Math.round(c.x - 16), Math.round(c.y - 20), 32, 32);
}

function drawPet(c) {
  const set = c.type === 'dog' ? SPR.dog : SPR.cat;
  const setL = c.type === 'dog' ? SPR.dogL : SPR.catL;
  const frames = c.dir === 'left' ? setL : set;
  const f = c.mode === 'move' ? frames[Math.floor(c.animT * 8) % 2] : frames[0];
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(c.x, c.y + 9, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(f, Math.round(c.x - 16), Math.round(c.y - 20), 32, 32);
}

// 圓角矩形（相容舊瀏覽器）
function roundRectPath(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 小動物頭頂的對話泡泡
function drawBubble(b) {
  const bx = b.target.x;
  const by = b.target.y - 34;
  ctx.font = 'bold 12px sans-serif';
  const w = ctx.measureText(b.text).width + 16;
  const h = 20;
  const x = Math.round(bx - w / 2);
  const y = Math.round(by - h);
  ctx.globalAlpha = Math.min(1, b.t / 0.4);
  // 泡泡身
  ctx.fillStyle = '#fffdf5';
  ctx.strokeStyle = '#5a4a3a';
  ctx.lineWidth = 2;
  roundRectPath(x, y, w, h, 7);
  ctx.fill();
  ctx.stroke();
  // 泡泡尾巴（指向雞頭）
  ctx.beginPath();
  ctx.moveTo(bx - 4, y + h - 1);
  ctx.lineTo(bx + 4, y + h - 1);
  ctx.lineTo(bx, y + h + 6);
  ctx.closePath();
  ctx.fillStyle = '#fffdf5';
  ctx.fill();
  ctx.strokeStyle = '#5a4a3a';
  ctx.beginPath();
  ctx.moveTo(bx - 4, y + h - 1);
  ctx.lineTo(bx, y + h + 6);
  ctx.lineTo(bx + 4, y + h - 1);
  ctx.stroke();
  // 文字
  ctx.fillStyle = '#3a2a1a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(b.text, bx, y + h / 2 + 1);
  ctx.globalAlpha = 1;
}

// ---------- 建築物（用向量繪製） ----------
function drawHouse() {
  const x = FarmMap.HOUSE.x * TILE, y = FarmMap.HOUSE.y * TILE;
  const w = FarmMap.HOUSE.w * TILE, h = FarmMap.HOUSE.h * TILE;
  // 牆壁
  ctx.fillStyle = '#e8d8b0';
  ctx.fillRect(x + 8, y + 42, w - 16, h - 42);
  // 屋頂
  ctx.fillStyle = '#b04838';
  ctx.beginPath();
  ctx.moveTo(x - 4, y + 46);
  ctx.lineTo(x + w / 2, y + 2);
  ctx.lineTo(x + w + 4, y + 46);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8a3028';
  ctx.fillRect(x - 4, y + 42, w + 8, 6);
  // 煙囪
  ctx.fillStyle = '#9a9a9a';
  ctx.fillRect(x + w - 40, y + 8, 14, 20);
  ctx.fillStyle = '#7a7a7a';
  ctx.fillRect(x + w - 42, y + 6, 18, 5);
  // 門
  const dx = (FarmMap.HOUSE.door.x - FarmMap.HOUSE.x) * TILE;
  ctx.fillStyle = '#7a4f2c';
  ctx.fillRect(x + dx + 7, y + h - 34, 18, 34);
  ctx.fillStyle = '#f0d060';
  ctx.fillRect(x + dx + 20, y + h - 18, 3, 3);
  // 窗戶
  ctx.fillStyle = '#9fd0e8';
  ctx.fillRect(x + 18, y + 62, 20, 16);
  ctx.fillRect(x + w - 38, y + 62, 20, 16);
  ctx.strokeStyle = '#7a4f2c';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 18, y + 62, 20, 16);
  ctx.strokeRect(x + w - 38, y + 62, 20, 16);
}

function drawBin() {
  const x = FarmMap.BIN.x * TILE, y = FarmMap.BIN.y * TILE;
  ctx.fillStyle = '#8a5a32';
  ctx.fillRect(x + 6, y + 18, 52, 40);
  ctx.fillStyle = '#a06b3f';
  ctx.fillRect(x + 6, y + 18, 52, 8);
  ctx.fillStyle = '#6b4222';
  ctx.fillRect(x + 6, y + 54, 52, 4);
  // 牌子
  ctx.fillStyle = '#e8d8b0';
  ctx.fillRect(x + 12, y + 2, 40, 18);
  ctx.strokeStyle = '#7a4f2c';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 12, y + 2, 40, 18);
  ctx.fillStyle = '#5a3a1e';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('出貨', x + 32, y + 12);
}

function drawShop() {
  const x = FarmMap.SHOP.x * TILE, y = FarmMap.SHOP.y * TILE;
  const w = FarmMap.SHOP.w * TILE, h = FarmMap.SHOP.h * TILE;
  // 柱子
  ctx.fillStyle = '#6b4222';
  ctx.fillRect(x + 12, y + 30, 6, h - 64);
  ctx.fillRect(x + w - 18, y + 30, 6, h - 64);
  // 紅白條紋遮陽棚
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i % 2 ? '#f0e8d8' : '#d05040';
    ctx.fillRect(x + 6 + i * 15, y + 10, 15, 22);
  }
  ctx.fillStyle = '#b04030';
  ctx.fillRect(x + 6, y + 28, 180, 4);
  // 檯面
  ctx.fillStyle = '#8a5a32';
  ctx.fillRect(x + 10, y + h - 34, w - 20, 26);
  ctx.fillStyle = '#a06b3f';
  ctx.fillRect(x + 10, y + h - 34, w - 20, 6);
  // 商品
  ctx.fillStyle = '#e03c28'; ctx.fillRect(x + 30, y + h - 46, 10, 10);
  ctx.fillStyle = '#f0c030'; ctx.fillRect(x + 50, y + h - 46, 10, 10);
  ctx.fillStyle = '#4fae4f'; ctx.fillRect(x + 70, y + h - 46, 10, 10);
  // 招牌
  ctx.fillStyle = '#e8d8b0';
  ctx.fillRect(x + w / 2 - 26, y + h - 66, 52, 20);
  ctx.strokeStyle = '#7a4f2c';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + w / 2 - 26, y + h - 66, 52, 20);
  ctx.fillStyle = '#5a3a1e';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('商店', x + w / 2, y + h - 56);
}

function drawCoop() {
  const x = FarmMap.COOP.x * TILE, y = FarmMap.COOP.y * TILE;
  const w = FarmMap.COOP.w * TILE, h = FarmMap.COOP.h * TILE;
  ctx.fillStyle = '#c8a060';
  ctx.fillRect(x + 6, y + 20, w - 12, h - 20);
  ctx.fillStyle = '#a04838';
  ctx.beginPath();
  ctx.moveTo(x, y + 24);
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x + w, y + 24);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4a3020';
  ctx.fillRect(x + w / 2 - 10, y + h - 24, 20, 24);
}

// ============ HUD 與 UI ============
function weekday() {
  const total = (Game.year - 1) * SEASONS.length * DAYS_PER_SEASON + Game.seasonIdx * DAYS_PER_SEASON + (Game.day - 1);
  return total % 7;
}

function fmtTime() {
  return String(Game.hour).padStart(2, '0') + ':' + String(Math.floor(Game.minF)).padStart(2, '0');
}

function updateHUD() {
  $('hud-date').textContent = `第${Game.year}年 ${SEASON_ICONS[Game.seasonIdx]}${SEASONS[Game.seasonIdx]} ${Game.day}日（${WEEKDAYS[weekday()]}）`;
  $('hud-time').textContent = fmtTime();
  $('hud-weather').textContent = Game.weather === 'rain' ? '🌧' : '☀';
  $('hud-money').textContent = Game.money + 'G';
  const pct = Math.max(0, Game.energy / Game.maxEnergy * 100);
  const bar = $('energy-bar');
  bar.style.width = pct + '%';
  bar.style.background = pct > 50 ? '#6fd05f' : pct > 25 ? '#f0b040' : '#e05040';
  updateToolbelt();
  updateInteractHint();
}

// 接近可互動物件時顯示操作提示
function updateInteractHint() {
  const el = $('interact-hint');
  const it = (Game.state === 'play' && !Game.modalOpen) ? getNearbyInteraction() : null;
  const text = it ? it.hint : '';
  if (el.textContent !== text) {
    el.textContent = text;
    el.classList.toggle('hidden', !text);
    if (text) {
      el.classList.remove('pop');
      void el.offsetWidth;   // 重新觸發動畫
      el.classList.add('pop');
    }
  }
}

function buildToolbelt() {
  const belt = $('toolbelt');
  belt.innerHTML = '';
  TOOLS.forEach((t, i) => {
    const d = document.createElement('div');
    d.className = 'slot';
    d.id = 'slot-' + t.id;
    d.innerHTML = `<span class="slot-key">${i + 1}</span>` +
      `<span class="slot-icon">${t.icon}</span>` +
      `<span class="slot-name">${t.name}</span>` +
      `<span class="slot-sub" id="slot-sub-${t.id}"></span>`;
    d.onclick = () => selectTool(i);
    belt.appendChild(d);
  });
}

function updateToolbelt() {
  TOOLS.forEach((t, i) => {
    $('slot-' + t.id).classList.toggle('sel', i === Game.selectedTool);
  });
  const id = Game.selectedSeed;
  $('slot-sub-seed').textContent = `${CROPS[id].name} ×${Game.seeds[id] || 0}`;
  // 工具操作提示（切換時閃爍提醒）
  const t = TOOLS[Game.selectedTool];
  const hintEl = $('tool-hint');
  const text = `${t.icon} ${t.name}：${t.hint}`;
  if (hintEl.textContent !== text) {
    hintEl.textContent = text;
    hintEl.classList.remove('flash');
    void hintEl.offsetWidth;   // 重新觸發動畫
    hintEl.classList.add('flash');
  }
}

function toast(msg) {
  const wrap = $('toasts');
  const d = document.createElement('div');
  d.className = 'toast';
  d.textContent = msg;
  wrap.appendChild(d);
  setTimeout(() => d.classList.add('show'), 10);
  setTimeout(() => { d.classList.remove('show'); setTimeout(() => d.remove(), 400); }, 2600);
  while (wrap.children.length > 5) wrap.firstChild.remove();
}

// ---------- 視窗 ----------
function openModal(name) {
  Game.modalOpen = name;
  $('modal-' + name).classList.remove('hidden');
}

function closeModal() {
  if (!Game.modalOpen) return;
  $('modal-' + Game.modalOpen).classList.add('hidden');
  Game.modalOpen = null;
}

function showDialog(msg, buttons) {
  $('dialog-msg').innerHTML = msg;
  const wrap = $('dialog-btns');
  wrap.innerHTML = '';
  buttons.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'btn' + (b.primary ? ' primary' : '');
    btn.textContent = b.label;
    btn.onclick = () => { closeModal(); if (b.cb) b.cb(); };
    wrap.appendChild(btn);
  });
  openModal('dialog');
}

function openShop() { renderShop(); openModal('shop'); }

function renderShop() {
  $('shop-money').textContent = `持有金錢：${Game.money}G`;
  // 寵物區（每種限養一隻）
  const petList = $('shop-pets');
  petList.innerHTML = '';
  Object.keys(PETS).forEach(id => {
    const def = PETS[id];
    const owned = Game.pets.some(p => p.type === id);
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `<span class="item-name">${def.icon} ${def.name}</span>` +
      `<span class="item-info">${owned ? '已在牧場散步中' : def.price + 'G'}</span>`;
    const btns = document.createElement('span');
    btns.className = 'item-btns';
    const b = document.createElement('button');
    b.className = 'btn small';
    b.textContent = owned ? '已擁有' : '購買';
    b.disabled = owned || Game.money < def.price;
    b.onclick = () => buyPet(id);
    btns.appendChild(b);
    row.appendChild(btns);
    petList.appendChild(row);
  });
  // 種子區
  const list = $('shop-list');
  list.innerHTML = '';
  Object.keys(CROPS).forEach(id => {
    const c = CROPS[id];
    const row = document.createElement('div');
    row.className = 'item-row';
    const badges = c.seasons.map(s => SEASON_ICONS[SEASONS.indexOf(s)]).join('');
    row.innerHTML = `<span class="item-name">${c.name}種子 <span class="badge">${badges}</span></span>` +
      `<span class="item-info">${c.seedPrice}G／持有 ${Game.seeds[id] || 0}</span>`;
    const btns = document.createElement('span');
    btns.className = 'item-btns';
    [[1, '買1'], [5, '買5']].forEach(([n, label]) => {
      const b = document.createElement('button');
      b.className = 'btn small';
      b.textContent = label;
      b.disabled = Game.money < c.seedPrice * n;
      b.onclick = () => buySeed(id, n);
      btns.appendChild(b);
    });
    row.appendChild(btns);
    list.appendChild(row);
  });
}

function openShip() { renderShip(); openModal('ship'); }

function renderShip() {
  $('ship-money').textContent = `持有金錢：${Game.money}G`;
  const list = $('ship-list');
  list.innerHTML = '';
  const entries = Object.keys(Game.items).filter(id => Game.items[id] > 0);
  if (!entries.length) {
    list.innerHTML = '<p class="empty">（沒有可出貨的東西。去採收作物或撿雞蛋吧！）</p>';
    return;
  }
  entries.forEach(id => {
    const name = id === 'egg' ? '🥚 雞蛋' : CROPS[id].name;
    const price = id === 'egg' ? EGG_PRICE : CROPS[id].sellPrice;
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `<span class="item-name">${name}</span>` +
      `<span class="item-info">單價 ${price}G／數量 ${Game.items[id]}</span>`;
    const btns = document.createElement('span');
    btns.className = 'item-btns';
    const b1 = document.createElement('button');
    b1.className = 'btn small';
    b1.textContent = '賣1';
    b1.onclick = () => sellItem(id, 1);
    const b2 = document.createElement('button');
    b2.className = 'btn small primary';
    b2.textContent = '全賣';
    b2.onclick = () => sellItem(id, 999);
    btns.appendChild(b1);
    btns.appendChild(b2);
    row.appendChild(btns);
    list.appendChild(row);
  });
}

// ============ 啟動 ============
init();
