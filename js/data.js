// ============ 遊戲資料定義 ============
const TILE = 32;
const MAP_W = 25;
const MAP_H = 18;

const SEASONS = ['春', '夏', '秋', '冬'];
const SEASON_ICONS = ['🌸', '🌻', '🍁', '❄️'];
const DAYS_PER_SEASON = 5;              // 每季 5 天（輕快版）
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

const DAY_LENGTH_SEC = 60;              // 現實 60 秒 = 遊戲一天
const GAME_START_HOUR = 6;              // 早上 6 點起床
const GAME_END_HOUR = 26;               // 凌晨 2 點強制累倒
const MIN_PER_SEC = (GAME_END_HOUR - GAME_START_HOUR) * 60 / DAY_LENGTH_SEC;

const EGG_PRICE = 60;

// 寵物：商店購買，每種限養一隻，會在牧場四處散步
const PETS = {
  dog: { name: '狗狗', icon: '🐶', price: 800, cry: '汪汪', cryLove: '汪汪♪' },
  cat: { name: '貓貓', icon: '🐱', price: 700, cry: '喵喵', cryLove: '喵喵♪' },
};

// 作物：stages = 每階段所需「澆水天數」，最後一階為成熟
// regrowDays > 0 表示採收後會再長出來（連續收成）
const CROPS = {
  turnip:     { name: '蘿蔔',   seedPrice: 40,  sellPrice: 90,  stages: [1,1,1],     seasons: ['春'], regrowDays: 0, fruit: '#f4f0e6' },
  potato:     { name: '馬鈴薯', seedPrice: 70,  sellPrice: 150, stages: [1,1,1,1],   seasons: ['春'], regrowDays: 0, fruit: '#f0e8c0' },
  strawberry: { name: '草莓',   seedPrice: 120, sellPrice: 220, stages: [1,1,1,1],   seasons: ['春'], regrowDays: 0, fruit: '#e04038' },
  tomato:     { name: '番茄',   seedPrice: 90,  sellPrice: 120, stages: [1,1,1],     seasons: ['夏'], regrowDays: 1, fruit: '#e03c28' },
  corn:       { name: '玉米',   seedPrice: 120, sellPrice: 190, stages: [1,1,1,1],   seasons: ['夏'], regrowDays: 2, fruit: '#f0c030' },
  pumpkin:    { name: '南瓜',   seedPrice: 160, sellPrice: 330, stages: [1,1,1,1,1], seasons: ['秋'], regrowDays: 0, fruit: '#e88020' },
  eggplant:   { name: '茄子',   seedPrice: 100, sellPrice: 170, stages: [1,1,1],     seasons: ['秋'], regrowDays: 1, fruit: '#8a3fa8' },
  spinach:    { name: '菠菜',   seedPrice: 60,  sellPrice: 130, stages: [1,1,1],     seasons: ['冬'], regrowDays: 0, fruit: '#a8e060' },
};

const TOOLS = [
  { id: 'hoe',    name: '鋤頭', icon: '⛏️', energy: 4, hint: '對著草地按【空白鍵】翻土' },
  { id: 'water',  name: '水壺', icon: '💧', energy: 2, hint: '對著田地按【空白鍵】澆水' },
  { id: 'seed',   name: '種子', icon: '🌱', energy: 2, hint: '對著翻好的土按【空白鍵】播種，按【Q】換種子' },
  { id: 'scythe', name: '鐮刀', icon: '🔪', energy: 3, hint: '對著作物按【空白鍵】清除（枯萎或種錯的）' },
  { id: 'hand',   name: '手',   icon: '✋', energy: 1, hint: '對著成熟的作物按【空白鍵】採收' },
];
