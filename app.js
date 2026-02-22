const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const rarities = [
  ["Consumer", 0.45], ["Industrial", 0.24], ["Mil-Spec", 0.16], ["Restricted", 0.09], ["Classified", 0.04], ["Covert", 0.018], ["Knife", 0.002]
];
const weapons = ["AK-47", "M4A1-S", "AWP", "Glock-18", "USP-S", "Desert Eagle", "FAMAS", "P90", "MP9", "Karambit", "Butterfly Knife", "Bayonet"];
const cases = ["CS20", "Dreams & Nightmares", "Prisma 2", "Fracture", "Snakebite", "Recoil", "Clutch", "Gamma 2", "Operation Breakout"];

const state = JSON.parse(localStorage.getItem("neoncase") || "null") || {
  user: null, avatar: "😎", money: 1000, bank: 0, perClick: 1, auto: 0, xp: 0, level: 1,
  rank: "Silver I", luck: 1, inventory: [], favorites: [], stats: {opened:0, profit:0, highest:0, networth:1000, games:0, wins:0, losses:0},
  missions: [], streak:0, loyalty:0, bpXP:0, market:[80,81,82,79,84], history:[], event:"2x Luck Weekend", loan:0
};

function save(){ localStorage.setItem("neoncase", JSON.stringify(state)); render(); }
function money(v){ return `$${Math.floor(v).toLocaleString()}`; }
function rand(min,max){ return Math.random()*(max-min)+min; }

function rarityRoll(){
  const bonus = (new Date().getDay()===0 || new Date().getDay()===6) ? 2 : 1;
  let r = Math.random(), cum = 0;
  for(const [name, chance] of rarities){ cum += chance * (name === "Knife" ? state.luck * bonus : 1); if(r <= cum) return name; }
  return "Consumer";
}
function generateSkin(){
  const rarity = rarityRoll();
  const weapon = weapons[Math.floor(Math.random()*weapons.length)];
  const float = rand(0.01, 0.99).toFixed(4);
  const pattern = Math.floor(rand(1, 1000));
  const valueBase = {Consumer:1,Industrial:3,"Mil-Spec":8,Restricted:18,Classified:45,Covert:120,Knife:900}[rarity];
  const marketFactor = state.market.at(-1) / 80;
  const value = Math.max(1, Math.floor(valueBase * marketFactor * rand(.8, 1.4)));
  return { id: crypto.randomUUID(), case: cases[Math.floor(Math.random()*cases.length)], name:`${weapon} | ${rarity} Fade`, weapon, rarity, float, pattern, value };
}

function pushHistory(msg){ state.history.unshift(`${new Date().toLocaleTimeString()} • ${msg}`); state.history = state.history.slice(0,100); }

function openCase(caseName, count=1){
  const price = 60 * count;
  if(state.money < price) return alert("Not enough money");
  state.money -= price;
  $("#caseAnimation").textContent = "🎰 Rolling...";
  const pulls=[];
  for(let i=0;i<count;i++){
    const skin = generateSkin(); skin.case = caseName; pulls.push(skin); state.inventory.push(skin); state.stats.opened++;
    state.stats.highest = Math.max(state.stats.highest, skin.value);
    if(skin.rarity==="Knife") pushHistory(`✨ GOLD KNIFE ANIMATION: ${skin.name}`);
  }
  setTimeout(()=> {
    $("#caseAnimation").textContent = pulls.map(p=>`${p.weapon}(${p.rarity})`).join("  |  ");
    state.money += pulls.reduce((a,b)=>a + b.value * 0.05, 0);
    state.xp += 15 * count; state.bpXP += 10 * count; levelUpCheck();
    pushHistory(`Opened ${count}x ${caseName}`); save(); renderOpenResults(pulls);
  }, 400);
}

function renderOpenResults(pulls){
  $("#openResults").innerHTML = pulls.map(skinCard).join("");
}
function skinCard(s){
  const fav = state.favorites.includes(s.id) ? "★" : "☆";
  return `<div class="skin-card rarity-${s.rarity}"><strong>${s.weapon}</strong><small>${s.rarity}</small><div>${money(s.value)}</div><small>Float ${s.float} • Seed ${s.pattern}</small><button onclick="toggleFav('${s.id}')">${fav}</button></div>`;
}
window.toggleFav = (id)=>{ state.favorites.includes(id) ? state.favorites = state.favorites.filter(f=>f!==id) : state.favorites.push(id); save(); }

function levelUpCheck(){
  while(state.xp >= state.level*100){ state.xp -= state.level*100; state.level++; state.luck += 0.03; state.money += 300; pushHistory(`Level up! Now Lv ${state.level}`); }
  const ranks = ["Silver I","Silver Elite","Gold Nova","Master Guardian","DMG","Legendary Eagle","Supreme","Global Elite"];
  state.rank = ranks[Math.min(ranks.length-1, Math.floor(state.level/6))];
}

function playCasino(game, bet){
  if(state.money < bet) return "Not enough balance";
  state.money -= bet; state.stats.games++;
  const hit = Math.random();
  let mult = 0;
  if(game==="Blackjack") mult = hit>.47?2:0;
  if(game==="Roulette") mult = hit>.53?1.9:0;
  if(game==="Coinflip") mult = hit>.5?1.95:0;
  if(game==="Crash") mult = hit>.6?rand(1.2,4):0;
  if(game==="Jackpot") mult = hit>.82?7:0;
  if(game==="Mines") mult = hit>.58?2.3:0;
  if(game==="Slots") mult = hit>.9?10:hit>.65?2:0;
  if(game==="Plinko") mult = [0, .5, 1, 2, 5][Math.floor(rand(0,5))];
  const payout = Math.floor(bet * mult);
  state.money += payout;
  const won = payout > bet;
  state.stats[won?"wins":"losses"]++;
  state.stats.profit += (payout - bet);
  state.xp += won ? 20 : 6; levelUpCheck();
  pushHistory(`${game}: ${won?"win":"loss"} ${money(payout-bet)}`);
  return `${game} -> ${won?"✅ Win":"❌ Loss"} (${money(payout)})`;
}

function createMissions(){
  state.missions = [
    {id:1,text:"Open 5 cases",goal:5,prog:0,reward:250},
    {id:2,text:"Win 3 casino games",goal:3,prog:0,reward:300},
    {id:3,text:"Make 100 clicks",goal:100,prog:0,reward:400},
    {id:4,text:"Get a Covert or better",goal:1,prog:0,reward:500}
  ];
}
if(!state.missions.length) createMissions();

function renderMissions(){
  $("#missionList").innerHTML = state.missions.map(m=>`<div class="skin-card"><b>${m.text}</b><div>${m.prog}/${m.goal}</div><button onclick="claimMission(${m.id})">Claim ${money(m.reward)}</button></div>`).join("");
}
window.claimMission = (id)=>{
  const m = state.missions.find(x=>x.id===id); if(!m || m.prog < m.goal) return;
  state.money += m.reward; state.xp += 40; m.prog = 0; pushHistory(`Mission claimed: ${m.text}`); save();
}

function tickMissions(type){
  if(type==="open") state.missions[0].prog = Math.min(state.missions[0].goal, state.missions[0].prog+1);
  if(type==="win") state.missions[1].prog = Math.min(state.missions[1].goal, state.missions[1].prog+1);
  if(type==="click") state.missions[2].prog = Math.min(state.missions[2].goal, state.missions[2].prog+1);
  if(type==="rare") state.missions[3].prog = 1;
}

function render(){
  $("#money").textContent = money(state.money);
  $("#bankMoney").textContent = money(state.bank);
  $("#xpLevel").textContent = `${state.xp} / Lv ${state.level}`;
  $("#rank").textContent = state.rank;
  $("#luck").textContent = `${state.luck.toFixed(2)}x`;
  $("#perClick").textContent = money(state.perClick);
  $("#streak").textContent = state.streak;
  $("#loyalty").textContent = state.loyalty;
  $("#bpXP").textContent = state.bpXP;
  $("#seasonEvent").textContent = `${state.event} active • rarity boosts + market volatility`;
  $("#history").innerHTML = state.history.map(h=>`<div>${h}</div>`).join("");
  $("#liveFeed").innerHTML = Array.from({length:8},()=>`<div>🤖 Bot${Math.floor(rand(1,999))} pulled ${["AK","M4","AWP","Knife"][Math.floor(rand(0,4))]}</div>`).join("");

  const rarity = $("#rarityFilter")?.value || "all";
  const q = ($("#searchSkin")?.value || "").toLowerCase();
  let inv = state.inventory.filter(i => (rarity==="all" || i.rarity===rarity) && (`${i.name} ${i.weapon}`.toLowerCase().includes(q)));
  if(window.sortByValue) inv = inv.sort((a,b)=>b.value-a.value);
  $("#inventoryGrid").innerHTML = inv.map(skinCard).join("");

  $("#statsList").innerHTML = `
    <li>Total cases opened: ${state.stats.opened}</li>
    <li>Profit/Loss: ${money(state.stats.profit)}</li>
    <li>Most valuable item: ${money(state.stats.highest)}</li>
    <li>Games: ${state.stats.games} (W ${state.stats.wins} / L ${state.stats.losses})</li>
    <li>Net worth: ${money(state.money + state.bank + state.inventory.reduce((a,b)=>a+b.value,0))}</li>
    <li>Favorites in bank vault: ${state.favorites.length}</li>`;

  renderMissions();
  drawGraph();
}

function drawGraph(){
  const c = $("#marketGraph"); if(!c) return; const x = c.getContext("2d");
  x.clearRect(0,0,c.width,c.height); x.strokeStyle="#2d3455"; x.strokeRect(0,0,c.width,c.height);
  x.strokeStyle="#6bd0ff"; x.lineWidth=2; x.beginPath();
  state.market.forEach((v,i)=>{ const px = 20 + i*(c.width-40)/(state.market.length-1); const py = c.height - (v-60)*6; i?x.lineTo(px,py):x.moveTo(px,py); });
  x.stroke(); x.fillStyle="#9ca7d3"; x.fillText("Market Trends / Supply-Demand Simulation", 20, 16);
}

function bootstrapCases(){
  $("#caseList").innerHTML = cases.map(c=>`<div class="skin-card"><b>${c}</b><div>${money(60)}</div><button onclick="openCase('${c}', Number(document.getElementById('openCount').value || 1))">Open</button></div>`).join("");
}
window.openCase = (c,n)=>{ openCase(c,n); tickMissions("open"); };

setInterval(()=>{
  state.money += state.auto * state.perClick;
  state.bank += state.bank * 0.0008;
  if(state.loan > 0) { state.loan *= 1.0015; state.money -= state.loan * 0.0007; }
  const trend = state.market.at(-1) + rand(-2.4, 2.8);
  state.market.push(Math.max(60, Math.min(120, trend))); state.market = state.market.slice(-40);
  if(Math.random()>.93) pushHistory("Global event: market shock triggered by bot demand");
  save();
}, 3000);

$("#tabs").addEventListener("click", (e)=>{
  if(e.target.tagName !== "BUTTON") return;
  $$("#tabs button").forEach(b=>b.classList.remove("active")); e.target.classList.add("active");
  $$(".tab-panel").forEach(t=>t.classList.remove("active")); $(`#${e.target.dataset.tab}`).classList.add("active");
});

$("#moneyClick").onclick = ()=>{ state.money += state.perClick; state.xp += 2; state.streak++; state.loyalty++; tickMissions("click"); levelUpCheck(); save(); };
$$(".upgrade").forEach(btn=>btn.onclick=()=>{
  const k = btn.dataset.upg;
  const cost = {click:50 + state.perClick*20, auto:150 + state.auto*80, luck:350 + state.luck*100}[k];
  if(state.money < cost) return; state.money -= cost;
  if(k==="click") state.perClick += 1;
  if(k==="auto") state.auto += .4;
  if(k==="luck") state.luck += .08;
  save();
});
$("#claimDaily").onclick = ()=>{ state.money += 500; state.xp += 40; pushHistory("Daily reward claimed"); save(); };
$("#claimStreak").onclick = ()=>{ const b = state.streak * 2; state.money += b; state.streak = 0; save(); };
$("#rebirthBtn").onclick = ()=>{ if(state.level<15) return alert("Reach lvl 15 for rebirth"); state.level=1; state.xp=0; state.perClick=2; state.luck += .5; state.money += 10000; pushHistory("Rebirth completed"); save(); };

$("#playGame").onclick = ()=>{ const out = playCasino($("#gameSelect").value, Number($("#betAmount").value)); $("#casinoOutput").textContent = out; if(out.includes("Win")) tickMissions("win"); save(); };
$("#autoBet").onclick = ()=>{ for(let i=0;i<5;i++) playCasino($("#gameSelect").value, Number($("#betAmount").value)); save(); };
$("#betSlider").oninput = (e)=> { $("#betAmount").value = e.target.value; };

$("#startBattle").onclick = ()=>{
  const bet = Number($("#battleBet").value); if(state.money<bet) return;
  state.money -= bet;
  const your = generateSkin(); const bot = generateSkin();
  const win = your.value >= bot.value; const gain = win ? bet + bot.value*0.4 : 0;
  state.money += gain; state.inventory.push(your); if(win) tickMissions("win");
  $("#battleOutput").textContent = `${$("#battleMode").value}: You ${win?"won":"lost"} with ${your.rarity} (${money(your.value)}) vs bot ${bot.rarity} (${money(bot.value)})`;
  pushHistory(`Case battle ${win?"W":"L"}`); save();
};

$("#listItem").onclick = ()=> { const s = generateSkin(); state.inventory.push(s); $("#marketLog").innerHTML = `<div>Listed ${s.name} for ${money(s.value*1.2)} (exp 24h, relist fee 2%)</div>` + $("#marketLog").innerHTML; save(); };
$("#runAuction").onclick = ()=> { $("#marketLog").innerHTML = `<div>Auction ended: bots overpaid +18%</div>` + $("#marketLog").innerHTML; state.money += 180; save(); };
$("#tradeOffer").onclick = ()=> { $("#marketLog").innerHTML = `<div>Trade sent. Cooldown active 30s. Reputation +1</div>` + $("#marketLog").innerHTML; save(); };

$("#rarityFilter").onchange = render; $("#searchSkin").oninput = render; $("#sortValue").onclick = ()=>{ window.sortByValue = !window.sortByValue; render(); };

$("#depositBtn").onclick = ()=>{ const v = Number($("#bankAmount").value); if(state.money < v) return; state.money -= v; state.bank += v; save(); };
$("#withdrawBtn").onclick = ()=>{ const v = Number($("#bankAmount").value); if(state.bank < v) return; state.bank -= v; state.money += v; save(); };
$("#loanBtn").onclick = ()=>{ state.loan += 2000; state.money += 2000; pushHistory("Loan taken: high interest applied"); save(); };

$("#openAuth").onclick = ()=> $("#authModal").showModal();
$("#signup").onclick = ()=>{ state.user = $("#username").value.trim(); state.avatar = $("#avatar").value.trim() || "😎"; $("#authStatus").textContent = `Signed up as ${state.user}`; save(); };
$("#login").onclick = ()=>{ const u = $("#username").value.trim(); if(!u) return; state.user = u; $("#authStatus").textContent = `Logged in as ${u}`; save(); };
$("#logout").onclick = ()=>{ state.user = null; $("#authStatus").textContent = "Logged out"; save(); };

function adminGuard(){ return state.user === "d3vi0us"; }
$("#spawnItem").onclick = ()=>{ if(!adminGuard()) return $("#adminOutput").textContent="Admin only"; const s=generateSkin(); state.inventory.push(s); $("#adminOutput").textContent=`Spawned ${s.name}`; save(); };
$("#boostEconomy").onclick = ()=>{ if(!adminGuard()) return $("#adminOutput").textContent="Admin only"; state.market = state.market.map(v=>v*1.1); save(); };
$("#grantCash").onclick = ()=>{ if(!adminGuard()) return $("#adminOutput").textContent="Admin only"; state.money += 10000; save(); };

$("#themeToggle").onclick = ()=>{ document.documentElement.classList.toggle("light"); };

bootstrapCases();
render();
