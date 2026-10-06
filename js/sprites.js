// ============ 像素圖生成（全部用程式碼畫出，無需圖檔） ============
function makeSprite(rows, palette) {
  const h = rows.length, w = rows[0].length;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  for (let y = 0; y < h; y++) {
    if (rows[y].length !== w) console.error('sprite 寬度不一致:', rows);
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === '.') continue;
      const col = palette[ch];
      if (!col) continue;
      c.fillStyle = col;
      c.fillRect(x, y, 1, 1);
    }
  }
  return cv;
}

function flipH(cv) {
  const c = document.createElement('canvas');
  c.width = cv.width; c.height = cv.height;
  const g = c.getContext('2d');
  g.translate(cv.width, 0); g.scale(-1, 1);
  g.drawImage(cv, 0, 0);
  return c;
}

const SPR = {};

function initSprites() {
  // ---------- 地面 ----------
  SPR.grass = makeSprite([
    'gggggggggggggggg',
    'gggggggggggggggg',
    'gggdgggggggglggg',
    'gggggggggggggggg',
    'ggggggggdggggggg',
    'gglggggggggggggg',
    'ggggggggggggdggg',
    'ggggggdggggggggg',
    'gggggggggggggggg',
    'ggdgggggglgggggg',
    'gggggggggggggggg',
    'gggglggggggggdgg',
    'gggggggggggggggg',
    'ggggggggdggggggg',
    'glgggggggggggggg',
    'gggggggggggggggg',
  ], { g: '#63a848', d: '#4f8c3a', l: '#7cc25e' });
  SPR.grassF = flipH(SPR.grass);

  SPR.path = makeSprite([
    'pppppppppppppppp',
    'pppdppppppdppppp',
    'pppppppppppppppp',
    'ppppppdppppppppp',
    'pdppppppppppdppp',
    'pppppppppppppppp',
    'ppppdppppdpppppp',
    'pppppppppppppppd',
    'pppppppppppppppp',
    'ppdpppdppppppppp',
    'pppppppppppdpppp',
    'ppppdppppppppppp',
    'pppppppppppppppp',
    'dppppppdpppppdpp',
    'pppppppppppppppp',
    'pppdppppppdppppp',
  ], { p: '#c9b077', d: '#b39a5e' });

  const waterRows0 = [
    'wwwwwwwwwwwwwwww',
    'wwLLwwwwwwwwwwww',
    'wwwwwwwwwLLwwwww',
    'wwwwwwwwwwwwwwww',
    'wwwLLwwwwwwwwLww',
    'wwwwwwwwwwwwwwww',
    'wwwwwwLLwwwwwwww',
    'wwwwwwwwwwwwwwww',
    'wLLwwwwwwwLLwwww',
    'wwwwwwwwwwwwwwww',
    'wwwwLLwwwwwwwwww',
    'wwwwwwwwwwwLLwww',
    'wwwwwwwwwwwwwwww',
    'wwLLwwwwwwwwwwww',
    'wwwwwwwwLLwwwwww',
    'wwwwwwwwwwwwwwww',
  ];
  const waterRows1 = [
    'wwwwwwwwwwwwwwww',
    'wwwwwwLLwwwwwwww',
    'wwwwwwwwwwwwwwww',
    'wwLLwwwwwwwwLLww',
    'wwwwwwwwwwwwwwww',
    'wwwwwwwwLLwwwwww',
    'wwwwwwwwwwwwwwww',
    'wLLwwwwwwwwwLLww',
    'wwwwwwwwwwwwwwww',
    'wwwwLLwwwwwwwwww',
    'wwwwwwwwwwwLLwww',
    'wwwwwwwwwwwwwwww',
    'wwLLwwwwwwwwwwww',
    'wwwwwwwwLLwwwwww',
    'wwwwwwwwwwwwwwww',
    'wwwwLLwwwwwwLLww',
  ];
  const waterPal = { w: '#3a6fc8', L: '#5f9fe0' };
  SPR.water0 = makeSprite(waterRows0, waterPal);
  SPR.water1 = makeSprite(waterRows1, waterPal);

  // ---------- 農地 ----------
  const soilRows = [
    'llllllllllllllll',
    'lBBllBBllBBllBBl',
    'llllllllllllllll',
    'llllllllllllllll',
    'BBBBBBBBBBBBBBBB',
    'llllllllllllllll',
    'lBBllBBllBBllBBl',
    'llllllllllllllll',
    'llllllllllllllll',
    'BBBBBBBBBBBBBBBB',
    'llllllllllllllll',
    'lBBllBBllBBllBBl',
    'llllllllllllllll',
    'llllllllllllllll',
    'BBBBBBBBBBBBBBBB',
    'llllllllllllllll',
  ];
  SPR.soilDry = makeSprite(soilRows, { l: '#9c6b3f', B: '#7a4f2c' });
  SPR.soilWet = makeSprite(soilRows, { l: '#6e4a2c', B: '#54371e' });

  // ---------- 作物階段 ----------
  SPR.stageSeed = makeSprite([
    '................',
    '................',
    '................',
    '................',
    '....n...n.......',
    '................',
    '.......n........',
    '................',
    '.....n...n......',
    '................',
  ], { n: '#3a2a1a' });

  SPR.sprout = makeSprite([
    '................',
    '................',
    '................',
    '....l.....l.....',
    '....ll...ll.....',
    '.....ll.ll......',
    '......lll.......',
    '.......l........',
    '.......l........',
    '......lll.......',
    '................',
  ], { l: '#3f9c3f' });

  SPR.bush = makeSprite([
    '................',
    '................',
    '.....lllll......',
    '....lLLLLLLl....',
    '...lLLLLLLLLl...',
    '...lLLlLLlLLl...',
    '...lLLLLLLLLl...',
    '....lLLLLLLl....',
    '.....lllll......',
    '.......l........',
    '......lll.......',
    '................',
  ], { l: '#2f7c2f', L: '#4fae4f' });

  SPR.withered = makeSprite([
    '................',
    '................',
    '....w.....w.....',
    '.....w...w......',
    '......w.w.......',
    '.......w........',
    '......w.w.......',
    '.....w...w......',
    '....w.....w.....',
    '................',
  ], { w: '#8a6a3a' });

  // 成熟作物：通用模板（灌木 + 果實顏色）
  const MATURE_TMPL = [
    '................',
    '.....lllll......',
    '....lLLLLLLl....',
    '...lLLFLLFLLl...',
    '...lLLLLLLFLl...',
    '...lFLLFLLLLl...',
    '....lLLLLLLl....',
    '.....lllll......',
    '.......l........',
    '......lll.......',
    '................',
    '................',
  ];
  const cornSpr = makeSprite([
    '................',
    '.......l........',
    '......lCl.......',
    '......lCl.......',
    '.....llCll......',
    '....l.lCl.l.....',
    '....lllClll.....',
    '.....lllll......',
    '......lll.......',
    '.......l........',
    '......lll.......',
    '................',
  ], { l: '#3f9c3f', C: '#f0c030' });
  const pumpkinSpr = makeSprite([
    '................',
    '................',
    '.......l........',
    '......lll.......',
    '....OOOOOOO.....',
    '...OOOOOOOOO....',
    '..OOOOOOOOOOO...',
    '..OOoOOOOOoOO...',
    '..OOOOOOOOOOO...',
    '...OOOOOOOOO....',
    '....OOOOOOO.....',
    '................',
  ], { l: '#3f7c3f', O: '#e88020', o: '#c86a10' });
  const turnipSpr = makeSprite([
    '................',
    '.......l........',
    '......lll.......',
    '.....lllll......',
    '....PPPPPPP.....',
    '...PPWWWWWPP....',
    '...WWWWWWWWW....',
    '....WWWWWWW.....',
    '.....WWWWW......',
    '......WWW.......',
    '................',
    '................',
  ], { l: '#3f9c3f', P: '#b070c8', W: '#f4f0e6' });

  SPR.mature = {};
  Object.keys(CROPS).forEach(id => {
    if (id === 'corn') SPR.mature[id] = cornSpr;
    else if (id === 'pumpkin') SPR.mature[id] = pumpkinSpr;
    else if (id === 'turnip') SPR.mature[id] = turnipSpr;
    else SPR.mature[id] = makeSprite(MATURE_TMPL, { l: '#2f7c2f', L: '#4fae4f', F: CROPS[id].fruit });
  });

  // ---------- 樹與花 ----------
  SPR.tree = makeSprite([
    '.....ggggg......',
    '...ggggggggg....',
    '..ggGGGGGGGgg...',
    '..gGGGGGGGGGg...',
    '..gGGGgGGgGGg...',
    '..gGGGGGGGGGg...',
    '...ggGGGGGgg....',
    '....ggggggg.....',
    '......ttt.......',
    '......ttt.......',
    '......ttt.......',
    '.....ttttt......',
  ], { g: '#2f6b2f', G: '#4f9c4f', t: '#6a4a2a' });
  SPR.treeF = flipH(SPR.tree);

  const flowerRows = [
    '................',
    '................',
    '......ppp.......',
    '.....ppcpp......',
    '......ppp.......',
    '.......g........',
    '......gg........',
    '......g.........',
    '................',
  ];
  SPR.flower = {
    red:    makeSprite(flowerRows, { p: '#e05050', c: '#f8c820', g: '#3f7c3f' }),
    yellow: makeSprite(flowerRows, { p: '#f0d040', c: '#f08020', g: '#3f7c3f' }),
    white:  makeSprite(flowerRows, { p: '#f0f0f0', c: '#f8c820', g: '#3f7c3f' }),
  };

  // ---------- 實色心心（摸雞用） ----------
  SPR.heart = makeSprite([
    '.rr..rr.',
    'rwrrrrrr',
    'rrrrrrrr',
    'rrrrrrrr',
    '.rrrrrr.',
    '..rrrr..',
    '...rrr..',
    '....r...',
  ], { r: '#e02838', w: '#ff98a8' });

  // ---------- 雞蛋 ----------
  SPR.egg = makeSprite([
    '................',
    '................',
    '................',
    '................',
    '......wwww......',
    '.....wwwwww.....',
    '.....wwwwww.....',
    '.....wwwwww.....',
    '......wwww......',
    '................',
  ], { w: '#f5f2e8' });

  // ---------- 小雞 ----------
  const chickenPal = { r: '#d04030', w: '#f2f0e4', e: '#203040', b: '#f0a020', l: '#e09020' };
  const c0 = makeSprite([
    '................',
    '................',
    '.......rr.......',
    '......wwww......',
    '......weww......',
    '......wwwwwbb...',
    '....wwwwwwww....',
    '...wwwwwwwwww...',
    '...wwwwwwwwww...',
    '....wwwwwwww....',
    '.....wwwwww.....',
    '......l..l......',
    '......l..l......',
    '................',
    '................',
    '................',
  ], chickenPal);
  const c1 = makeSprite([
    '................',
    '................',
    '................',
    '.......rr.......',
    '......wwww......',
    '......weww......',
    '......wwwwwbb...',
    '....wwwwwwww....',
    '...wwwwwwwwww...',
    '...wwwwwwwwww...',
    '....wwwwwwww....',
    '.....wwwwww.....',
    '.....l....l.....',
    '.....l....l.....',
    '................',
    '................',
  ], chickenPal);
  SPR.chicken = [c0, c1];
  SPR.chickenL = [flipH(c0), flipH(c1)];

  // ---------- 寵物狗（向右，兩幀） ----------
  const dogPal = { d: '#d8a058', D: '#8a5a30', e: '#203040', n: '#3a2418', l: '#8a5a30', t: '#d8a058' };
  const d0 = makeSprite([
    '................',
    '................',
    '....DD..........',
    '....DDddddd.....',
    '....ddddddd.....',
    '....deddddn.....',
    '....ddddddd.....',
    '.t..dddddddd....',
    '.ttddddddddd....',
    '..dddddddddd....',
    '..dddddddddd....',
    '...l......l.....',
    '...l......l.....',
    '................',
    '................',
    '................',
  ], dogPal);
  const d1 = makeSprite([
    '................',
    '................',
    '....DD..........',
    '....DDddddd.....',
    '....ddddddd.....',
    '....deddddn.....',
    '....ddddddd.....',
    '..t.dddddddd....',
    '.tttddddddddd...',
    '..dddddddddd....',
    '..dddddddddd....',
    '....l......l....',
    '...l........l...',
    '................',
    '................',
    '................',
  ], dogPal);
  SPR.dog = [d0, d1];
  SPR.dogL = [flipH(d0), flipH(d1)];

  // ---------- 寵物貓（向右，兩幀） ----------
  const catPal = { c: '#e8a048', C: '#c87a28', e: '#203040', n: '#e07070', w: '#f8f0e0', l: '#c87a28', t: '#e8a048' };
  const cat0 = makeSprite([
    '................',
    '................',
    '....c..c........',
    '....cccccc......',
    '....ceccwn.......',
    '....cccccc......',
    '...ccccccc......',
    '.t..cccccccc....',
    '.ttccCcccCcc....',
    '..ccccccccccc...',
    '..ccccccccccc...',
    '...l......l.....',
    '...l......l.....',
    '................',
    '................',
    '................',
  ], catPal);
  const cat1 = makeSprite([
    '................',
    '................',
    '....c..c........',
    '....cccccc......',
    '....ceccwn.......',
    '....cccccc......',
    '...ccccccc......',
    '..t.cccccccc....',
    '.tttccCcccCc....',
    '..ccccccccccc...',
    '..ccccccccccc...',
    '....l......l....',
    '...l........l...',
    '................',
    '................',
    '................',
  ], catPal);
  SPR.cat = [cat0, cat1];
  SPR.catL = [flipH(cat0), flipH(cat1)];

  // ---------- 玩家 ----------
  const P = {
    h: '#e8c860', H: '#c8a038',           // 草帽
    s: '#f0c8a0', e: '#203040', a: '#6a4a2a', // 皮膚/眼睛/頭髮
    b: '#f0f0f0', o: '#3f6fb0', L: '#5a3a26', // 襯衫/吊帶褲/靴子
  };
  const headDown = [
    '....hhhhhhhh....',
    '...hhhhhhhhhh...',
    '..HHhhhhhhhhHH..',
    '...ssssssssss...',
    '...ssessssess...',
    '...ssssssssss...',
    '....ssssssss....',
  ];
  const headUp = [
    '....hhhhhhhh....',
    '...hhhhhhhhhh...',
    '..HHhhhhhhhhHH..',
    '...aaaaaaaaaa...',
    '...aaaaaaaaaa...',
    '...aaaaaaaaaa...',
    '....aaaaaaaa....',
  ];
  const bodyDown = [
    '....bbbbbbbb....',
    '...bboooooobb...',
    '...sboooooobs...',
    '...ssooooooss...',
    '....oooooooo....',
  ];
  const legsA = [
    '....ooo..ooo....',
    '....ooo..ooo....',
    '...LLL....LLL...',
    '...LLL....LLL...',
  ];
  const legsB = [
    '....oooooooo....',
    '.....ooo.ooo....',
    '.....LLL.LLL....',
    '.....LLL.LLL....',
  ];
  const down0 = makeSprite(headDown.concat(bodyDown, legsA), P);
  const down1 = makeSprite(headDown.concat(bodyDown, legsB), P);
  const up0 = makeSprite(headUp.concat(bodyDown, legsA), P);
  const up1 = makeSprite(headUp.concat(bodyDown, legsB), P);
  const side0 = makeSprite([
    '....hhhhhhhh....',
    '...hhhhhhhhhh...',
    '..HHhhhhhhhhh...',
    '..ssssssssss....',
    '..ssssssssse....',
    '..ssssssssss....',
    '...ssssssss.....',
    '....bbbbbb......',
    '...bboooooob....',
    '...sboooooob....',
    '...ssoooooob....',
    '....oooooooo....',
    '....ooo.ooo.....',
    '....ooo.ooo.....',
    '....LLL..LL.....',
    '....LLL..LL.....',
  ], P);
  const side1 = makeSprite([
    '....hhhhhhhh....',
    '...hhhhhhhhhh...',
    '..HHhhhhhhhhh...',
    '..ssssssssss....',
    '..ssssssssse....',
    '..ssssssssss....',
    '...ssssssss.....',
    '....bbbbbb......',
    '...bboooooob....',
    '...sboooooob....',
    '...ssoooooob....',
    '....oooooooo....',
    '.....ooooo......',
    '.....LLL.LL.....',
    '.....LLL.LL.....',
    '................',
  ], P);
  SPR.player = {
    down:  [down0, down1],
    up:    [up0, up1],
    right: [side0, side1],
    left:  [flipH(side0), flipH(side1)],
  };

  // ---------- 手上工具（16x16，握把點對準角色的手） ----------
  const hoeSpr = makeSprite([
    '....MMMMM.....',
    '....MMMMM.....',
    '....MM........',
    '....hh........',
    '.....hh.......',
    '.....hh.......',
    '.....hh.......',
    '......hh......',
    '......hh......',
    '......hh......',
    '......hh......',
    '.......hh.....',
    '.......hh.....',
    '.......hh.....',
    '.......hh.....',
    '.......hh.....',
  ], { M: '#c8c8d0', h: '#7a4f2c' });

  const waterSpr = makeSprite([
    '......dddddd....',
    '.....d......d...',
    '.....d......d...',
    '....dddddddddd..',
    '...dLLGGGGGGd...',
    '..ssdLLGGGGGGd..',
    '.ss.dLLGGGGGGd..',
    '.RR..dLLGGGGGGd.',
    '.RR..dLLGGGGGGd.',
    '.....dLLGGGGGGd.',
    '....ddddddddddd.',
  ], { d: '#1f5c35', G: '#4fae6f', L: '#7fd09f', s: '#4fae6f', R: '#c8c8d0' });

  const seedSpr = makeSprite([
    '....ee..ee......',
    '.....eeee.......',
    '.....ssss.......',
    '....pppppp......',
    '...pppppppp.....',
    '..ppp.gg.ppp....',
    '..pp.gggg.pp....',
    '..ppp.gg.ppp....',
    '..ppp.g..ppp....',
    '...pppppppp.....',
    '....pppppp......',
  ], { e: '#b08a4f', s: '#5a3a1e', p: '#c8a060', g: '#3f9c3f' });

  const scytheSpr = makeSprite([
    '.MMMMMMMM......',
    '.MM....hh......',
    '......hh.......',
    '......hh.......',
    '......hh.......',
    '.......hh......',
    '.......hh......',
    '.......hh......',
    '.......hh......',
    '........hh.....',
    '........hh.....',
    '........hh.....',
    '........hh.....',
  ], { M: '#d8d8e0', h: '#7a4f2c' });

  const basketSpr = makeSprite([
    '.....hhhhh......',
    '....h.....h.....',
    '....h.....h.....',
    '..bbbbbbbbbbbb..',
    '..bLLLLLLLLLLb..',
    '...bWWWWWWWWb...',
    '...bLLLLLLLLb...',
    '....bWWWWWWb....',
    '....bbbbbbbb....',
  ], { h: '#6b4222', b: '#8a5a32', W: '#a06b3f', L: '#c89050' });

  SPR.tools = {
    hoe: hoeSpr,
    water: waterSpr,
    seed: seedSpr,
    scythe: scytheSpr,
    hand: basketSpr,
  };
  SPR.toolsL = {};
  for (const id in SPR.tools) SPR.toolsL[id] = flipH(SPR.tools[id]);
}
