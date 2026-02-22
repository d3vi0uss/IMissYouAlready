const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const rarities = [["Consumer",0.45],["Industrial",0.24],["Mil-Spec",0.16],["Restricted",0.09],["Classified",0.04],["Covert",0.018],["Knife",0.002]];
const weapons = [
  ["AK-47","🔫"],["M4A1-S","🔫"],["AWP","🎯"],["Glock-18","🔫"],["USP-S","🔫"],["Desert Eagle","🦅"],["FAMAS","🔫"],["P90","🔫"],["MP9","🔫"],
  ["Karambit","🔪"],["Butterfly Knife","🗡️"],["Bayonet","🗡️"],["Skeleton Knife","🗡️"],["Talon Knife","🗡️"]
];
const patterns = ["Case Hardened 'Blue Gem'","Fade","Doppler","Crimson Web","Tiger Tooth","Slaughter","Lore","Night"];
const stickerSet = ["💖","💋","⭐","🔥","❄️","👑"];
const cases = [
  {name:"CS20",price:60,icon:"📦",high:false},{name:"Dreams & Nightmares",price:60,icon:"💭",high:false},{name:"Prisma 2",price:65,icon:"✨",high:false},
  {name:"Sticker Capsule",price:30,icon:"🎟️",high:false,stickerOnly:true},{name:"Event Sticker Capsule",price:80,icon:"🎉",high:false,stickerOnly:true},
  {name:"High Roller Sapphire",price:300,icon:"💎",high:true},{name:"Dragon Vault",price:450,icon:"🐉",high:true}
];
const ranks = ["Silver I","Silver Elite","Gold Nova","Master Guardian","DMG","Legendary Eagle","Supreme","Global Elite"];

const base = {
  user:null, avatar:"😎", money:1000, bank:0, perClick:1, auto:0, xp:0, level:1, rank:"Silver I", luck:1,
  inventory:[], favorites:[], missions:[], streak:0, loyalty:0, bpXP:0, event:"None", market:[80,81,83,79,84],
  history:[], loan:0, crash:null, stats:{opened:0, profit:0, highest:0, games:0, wins:0, losses:0}
};
const state = Object.assign({}, base, JSON.parse(localStorage.getItem("neoncase")||"{}"));

function save(){ localStorage.setItem("neoncase", JSON.stringify(state)); render(); }
function money(v){ return `$${Math.floor(v).toLocaleString()}`; }
const rand=(a,b)=>Math.random()*(b-a)+a;
const isWeekend=()=>[0,6].includes(new Date().getDay());

function pushHistory(msg){ state.history.unshift(`${new Date().toLocaleTimeString()} • ${msg}`); state.history = state.history.slice(0,120); }
function rarityRoll(highCase=false){
  const bonus = (isWeekend()?2:1) * state.luck * (highCase?1.35:1);
  let r=Math.random(),sum=0;
  for(const [name,ch] of rarities){ sum += ch * (name==="Knife"?bonus:1+(bonus-1)*0.15); if(r<=sum) return name; }
  return "Consumer";
}
function randomStickers(){ return Math.random()>0.65 ? Array.from({length:Math.floor(rand(1,4))},()=>stickerSet[Math.floor(rand(0,stickerSet.length))]) : []; }
function generateSkin(fromCase){
  const [weapon,icon] = weapons[Math.floor(rand(0,weapons.length))];
  const rarity = rarityRoll(fromCase?.high);
  const pattern = patterns[Math.floor(rand(0,patterns.length))];
  const float = rand(0.0001,0.99).toFixed(4);
  const seed = Math.floor(rand(1,1000));
  const baseValue={Consumer:2,Industrial:5,"Mil-Spec":10,Restricted:24,Classified:56,Covert:140,Knife:950}[rarity];
  const value = Math.floor(baseValue*(fromCase?.high?2.8:1)*(state.market.at(-1)/80)*rand(.8,1.45));
  const eventLimited = state.event !== "None" && Math.random() > 0.8;
  return {id:crypto.randomUUID(),case:fromCase?.name||"Unknown",weapon,icon,rarity,pattern,float,seed,value,stickers:randomStickers(),eventLimited};
}

function skinCard(s){
  const fav = state.favorites.includes(s.id) ? "★" : "☆";
  const borderClass = s.eventLimited ? "event-border" : "";
  const stickers = s.stickers?.length ? `<div class="stickers">${s.stickers.map(x=>`<span>${x}</span>`).join("")}</div>` : "";
  return `<div class="skin-card rarity-${s.rarity} ${borderClass}">
    <div class="weapon-thumb">${s.icon}</div><strong>${s.weapon}</strong><small>${s.pattern}</small>
    <div>${money(s.value)}</div><small>Float ${s.float} • Seed ${s.seed}</small>${stickers}
    <button onclick="toggleFav('${s.id}')">${fav}</button></div>`;
}
window.toggleFav=(id)=>{ state.favorites.includes(id)?state.favorites=state.favorites.filter(x=>x!==id):state.favorites.push(id); save(); };

function openCase(caseName,count=1){
  const c = cases.find(x=>x.name===caseName); if(!c) return;
  const price = c.price*count; if(state.money<price) return alert("Not enough money");
  state.money -= price;
  const reels = Array.from({length:14},()=>`<div class='skin-card'><div class='weapon-thumb'>${weapons[Math.floor(rand(0,weapons.length))][1]}</div></div>`).join("");
  $("#caseAnimation").innerHTML = `<div class='roll-track'>${reels}</div>`;
  setTimeout(()=>{
    const pulls=[];
    for(let i=0;i<count;i++){
      if(c.stickerOnly){
        const stickerSkin = generateSkin(c); stickerSkin.weapon="Sticker Pack"; stickerSkin.icon="🎟️"; stickerSkin.pattern="Event Stickers"; pulls.push(stickerSkin);
      } else {
        const s=generateSkin(c); pulls.push(s); if(["Covert","Knife"].includes(s.rarity)) tickMissions("rare");
      }
    }
    state.inventory.push(...pulls); state.stats.opened += count;
    state.stats.highest = Math.max(state.stats.highest, ...pulls.map(p=>p.value));
    state.money += pulls.reduce((a,b)=>a+b.value*0.05,0);
    state.xp += count*15; state.bpXP += count*10; levelUp(); tickMissions("open",count);
    $("#caseAnimation").innerHTML = `<div class='row-wrap'>${pulls.map(p=>`<span>${p.icon} ${p.rarity}</span>`).join(" ")}</div>`;
    $("#openResults").innerHTML = pulls.map(skinCard).join("");
    pushHistory(`Opened ${count}x ${c.name}`); save();
  },900);
}
window.openCase=openCase;

function levelUp(){
  while(state.xp >= state.level*100){ state.xp -= state.level*100; state.level++; state.luck += 0.03; state.money += 300; pushHistory(`Level up: ${state.level}`); }
  state.rank = ranks[Math.min(ranks.length-1, Math.floor(state.level/6))];
}

function startCrash(bet){
  if(state.money<bet) return "Not enough balance";
  state.money -= bet; state.crash = {bet,mult:1,active:true}; $("#crashCashout").disabled=false;
  pushHistory(`Crash started with ${money(bet)}`); return "Crash started";
}
function tickCrash(){
  if(!state.crash?.active) return;
  state.crash.mult += rand(.04,.2); $("#crashMeter").textContent = `${state.crash.mult.toFixed(2)}x`;
  if(Math.random()>0.93){
    pushHistory(`Crash busted at ${state.crash.mult.toFixed(2)}x`);
    state.stats.losses++; state.stats.games++; state.stats.profit -= state.crash.bet;
    state.crash.active=false; $("#crashCashout").disabled=true; $("#crashMeter").textContent="BUST"; save();
  }
}
function cashoutCrash(){
  if(!state.crash?.active) return;
  const payout = Math.floor(state.crash.bet * state.crash.mult);
  state.money += payout; state.stats.games++; state.stats.wins++; state.stats.profit += (payout-state.crash.bet); state.xp += 20;
  tickMissions("win",1); levelUp();
  pushHistory(`Crash cashout ${state.crash.mult.toFixed(2)}x for ${money(payout)}`);
  state.crash.active=false; $("#crashCashout").disabled=true; $("#crashMeter").textContent="1.00x"; save();
}

function playCasino(game, bet){
  if(game==="Crash") return startCrash(bet);
  if(state.money<bet) return "Not enough balance";
  state.money -= bet; state.stats.games++;
  let hit=Math.random(),mult=0;
  if(game==="Blackjack") mult=hit>.47?2:0;
  if(game==="Roulette") mult=hit>.53?1.9:0;
  if(game==="Coinflip") mult=hit>.5?1.95:0;
  if(game==="Jackpot") mult=hit>.82?7:0;
  if(game==="Mines") mult=hit>.58?2.3:0;
  if(game==="Slots") mult=hit>.9?10:hit>.65?2:0;
  if(game==="Plinko") mult=[0,.5,1,2,5][Math.floor(rand(0,5))];
  const payout=Math.floor(bet*mult); state.money+=payout;
  const won=payout>bet; state.stats[won?"wins":"losses"]++; state.stats.profit += payout-bet;
  state.xp += won?20:6; if(won) tickMissions("win",1); levelUp();
  pushHistory(`${game}: ${won?"win":"loss"} ${money(payout-bet)}`);
  return `${game} -> ${won?"✅ Win":"❌ Loss"} (${money(payout)})`;
}

function createMissions(){ state.missions=[{id:1,text:"Open 5 cases",goal:5,prog:0,reward:250},{id:2,text:"Win 3 games",goal:3,prog:0,reward:300},{id:3,text:"Make 100 clicks",goal:100,prog:0,reward:400},{id:4,text:"Get Covert/Knife",goal:1,prog:0,reward:500}]; }
if(!state.missions.length) createMissions();
function tickMissions(type,count=1){
  if(type==="open") state.missions[0].prog=Math.min(state.missions[0].goal,state.missions[0].prog+count);
  if(type==="win") state.missions[1].prog=Math.min(state.missions[1].goal,state.missions[1].prog+count);
  if(type==="click") state.missions[2].prog=Math.min(state.missions[2].goal,state.missions[2].prog+count);
  if(type==="rare") state.missions[3].prog=1;
}
window.claimMission=(id)=>{ const m=state.missions.find(x=>x.id===id); if(!m||m.prog<m.goal) return; state.money+=m.reward; state.xp+=40; m.prog=0; pushHistory(`Mission claimed: ${m.text}`); save(); };

function drawGraph(){
  const c=$("#marketGraph"),x=c.getContext("2d"); x.clearRect(0,0,c.width,c.height); x.strokeStyle="#4f397a"; x.strokeRect(0,0,c.width,c.height);
  x.strokeStyle="#c968ff"; x.lineWidth=2; x.beginPath();
  state.market.forEach((v,i)=>{ const px=20+i*(c.width-40)/(state.market.length-1), py=c.height-(v-55)*5; i?x.lineTo(px,py):x.moveTo(px,py); });
  x.stroke(); x.fillStyle="#c7b3ff"; x.fillText("Market trends / supply-demand",20,16);
}

function exportData(){
  const blob = new Blob([JSON.stringify(state,null,2)], {type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="neoncase-save.json"; a.click();
}
function importData(file){
  const reader = new FileReader();
  reader.onload = ()=>{ try { const data=JSON.parse(reader.result); Object.assign(state,data); pushHistory("Save imported"); save(); } catch { alert("Invalid save file"); } };
  reader.readAsText(file);
}

function adminGuard(){ return state.user==="d3vi0us"; }
function updateAdminVisibility(){
  $("#adminTabBtn").classList.toggle("hidden", !adminGuard());
  $("#admin").classList.toggle("hidden", !adminGuard());
  if(!adminGuard() && $("#admin").classList.contains("active")) { $$(".tab-panel").forEach(t=>t.classList.remove("active")); $("#dashboard").classList.add("active"); }
}

function render(){
  $("#money").textContent=money(state.money); $("#bankMoney").textContent=money(state.bank); $("#xpLevel").textContent=`${state.xp} / Lv ${state.level}`;
  $("#rank").textContent=state.rank; $("#luck").textContent=`${state.luck.toFixed(2)}x`; $("#perClick").textContent=money(state.perClick);
  $("#streak").textContent=state.streak; $("#loyalty").textContent=state.loyalty; $("#bpXP").textContent=state.bpXP;
  $("#seasonEvent").textContent=`${state.event} event • ${isWeekend()?"2x luck weekend active":"normal luck"}`;
  $("#eventPicker").value=state.event;
  $("#snowOverlay").classList.toggle("hidden", state.event!=="Christmas");
  $("#history").innerHTML=state.history.map(h=>`<div>${h}</div>`).join("");
  $("#liveFeed").innerHTML=Array.from({length:8},()=>`<div>🤖 Bot${Math.floor(rand(1,999))} pulled ${["AK","M4","AWP","Knife"][Math.floor(rand(0,4))]}</div>`).join("");

  const q=( $("#searchSkin").value||"" ).toLowerCase(); const rf=$("#rarityFilter").value;
  let inv=state.inventory.filter(i=>(rf==="all"||i.rarity===rf)&&(`${i.weapon} ${i.pattern}`.toLowerCase().includes(q)));
  if(window.sortByValue) inv=inv.sort((a,b)=>b.value-a.value);
  $("#inventoryGrid").innerHTML=inv.map(skinCard).join("");
  $("#statsList").innerHTML=`<li>Total cases opened: ${state.stats.opened}</li><li>Profit/Loss: ${money(state.stats.profit)}</li><li>Most valuable item: ${money(state.stats.highest)}</li><li>Games: ${state.stats.games} (W ${state.stats.wins} / L ${state.stats.losses})</li><li>Net worth: ${money(state.money+state.bank+state.inventory.reduce((a,b)=>a+b.value,0))}</li><li>Rank ladder: ${ranks.join(" → ")}</li>`;
  $("#missionList").innerHTML=state.missions.map(m=>`<div class='skin-card'><b>${m.text}</b><div>${m.prog}/${m.goal}</div><button onclick='claimMission(${m.id})'>Claim ${money(m.reward)}</button></div>`).join("");

  $("#caseList").innerHTML=cases.map(c=>`<div class='skin-card ${c.high?"event-border":""}'><div class='case-thumb'>${c.icon}</div><b>${c.name}</b><div>${money(c.price)}</div><button onclick="openCase('${c.name}', Number(document.getElementById('openCount').value||1))">Open</button></div>`).join("");
  drawGraph(); updateAdminVisibility();
}

setInterval(()=>{
  state.money += state.auto * state.perClick;
  state.bank += state.bank * 0.0008;
  if(state.loan>0){ state.loan*=1.0015; state.money -= state.loan*0.0007; }
  const trend=state.market.at(-1)+rand(-2.4,2.8); state.market.push(Math.max(60,Math.min(130,trend))); state.market=state.market.slice(-40);
  if(Math.random()>.9){
    const listing = `${["AK","M4","AWP","Knife"][Math.floor(rand(0,4))]} listed by Bot${Math.floor(rand(1,600))} at ${money(rand(30,600))}`;
    $("#marketLog").innerHTML=`<div>${listing}</div>`+$("#marketLog").innerHTML;
  }
  if(Math.random()>.94){ $("#marketLog").innerHTML=`<div>🤖 Bot auction bid war: +${Math.floor(rand(3,18))}% in last 10s</div>`+$("#marketLog").innerHTML; }
  tickCrash(); save();
},3000);

$("#tabs").addEventListener("click",e=>{
  if(e.target.tagName!=="BUTTON" || e.target.classList.contains("hidden")) return;
  $$("#tabs button").forEach(b=>b.classList.remove("active")); e.target.classList.add("active");
  $$(".tab-panel").forEach(t=>t.classList.remove("active")); $(`#${e.target.dataset.tab}`).classList.add("active");
});
$("#moneyClick").onclick=()=>{ state.money+=state.perClick; state.xp+=2; state.streak++; state.loyalty++; tickMissions("click",1); levelUp(); save(); };
$$(".upgrade").forEach(btn=>btn.onclick=()=>{ const k=btn.dataset.upg; const cost={click:50+state.perClick*20,auto:150+state.auto*80,luck:350+state.luck*120}[k]; if(state.money<cost) return; state.money-=cost; if(k==="click")state.perClick++; if(k==="auto")state.auto+=.4; if(k==="luck")state.luck+=.08; save(); });
$("#claimDaily").onclick=()=>{ state.money+=500; state.xp+=40; pushHistory("Daily reward claimed"); save(); };
$("#claimStreak").onclick=()=>{ const b=state.streak*2; state.money+=b; state.streak=0; save(); };
$("#rebirthBtn").onclick=()=>{ if(state.level<15) return alert("Reach lvl 15"); state.level=1; state.xp=0; state.perClick=2; state.luck+=.5; state.money+=10000; pushHistory("Rebirth complete"); save(); };

$("#playGame").onclick=()=>{ const out=playCasino($("#gameSelect").value,Number($("#betAmount").value)); $("#casinoOutput").textContent=out; save(); };
$("#autoBet").onclick=()=>{ for(let i=0;i<5;i++) playCasino($("#gameSelect").value,Number($("#betAmount").value)); save(); };
$("#betSlider").oninput=(e)=>$("#betAmount").value=e.target.value;
$("#crashCashout").onclick=cashoutCrash;

$("#startBattle").onclick=()=>{
  const bet=Number($("#battleBet").value); if(state.money<bet) return; state.money-=bet;
  $("#battleAnimation").innerHTML="<div class='roll-track'><div class='skin-card'>🎲</div><div class='skin-card'>⚔️</div><div class='skin-card'>🎯</div></div>";
  setTimeout(()=>{
    const your=generateSkin({high:false}), bot=generateSkin({high:false});
    const win=your.value>=bot.value; const gain=win?bet+bot.value*0.4:0; state.money+=gain; state.inventory.push(your);
    if(win) tickMissions("win",1); pushHistory(`Case battle ${win?"W":"L"}`);
    $("#battleOutput").textContent=`${$("#battleMode").value}: You ${win?"won":"lost"} with ${your.weapon} ${money(your.value)} vs bot ${bot.weapon} ${money(bot.value)}`;
    $("#battleAnimation").innerHTML = `${your.icon} ${your.rarity} vs ${bot.icon} ${bot.rarity}`;
    save();
  },800);
};

$("#listItem").onclick=()=>{ const s=generateSkin({high:false}); state.inventory.push(s); $("#marketLog").innerHTML=`<div>Listed ${s.weapon} ${s.pattern} for ${money(s.value*1.2)}</div>`+$("#marketLog").innerHTML; save(); };
$("#runAuction").onclick=()=>{ $("#marketLog").innerHTML=`<div>Auction round: bots placed ${Math.floor(rand(2,8))} bids in 15s</div>`+$("#marketLog").innerHTML; state.money += 200; save(); };
$("#tradeOffer").onclick=()=>{ $("#marketLog").innerHTML=`<div>Trade offer sent. Cooldown 30s. Reputation +1</div>`+$("#marketLog").innerHTML; save(); };

$("#rarityFilter").onchange=render; $("#searchSkin").oninput=render; $("#sortValue").onclick=()=>{ window.sortByValue=!window.sortByValue; render(); };
$("#depositBtn").onclick=()=>{ const v=Number($("#bankAmount").value); if(state.money<v)return; state.money-=v; state.bank+=v; save(); };
$("#withdrawBtn").onclick=()=>{ const v=Number($("#bankAmount").value); if(state.bank<v)return; state.bank-=v; state.money+=v; save(); };
$("#loanBtn").onclick=()=>{ state.loan+=2000; state.money+=2000; pushHistory("Loan taken"); save(); };

$("#openAuth").onclick=()=>$("#authModal").showModal();
$("#closeAuth").onclick=()=>$("#authModal").close();
$("#signup").onclick=()=>{ state.user=$("#username").value.trim(); state.avatar=$("#avatar").value.trim()||"😎"; $("#authStatus").textContent=`Signed up as ${state.user}`; updateAdminVisibility(); save(); };
$("#login").onclick=()=>{ const u=$("#username").value.trim(); if(!u)return; state.user=u; $("#authStatus").textContent=`Logged in as ${u}`; updateAdminVisibility(); save(); };
$("#logout").onclick=()=>{ state.user=null; $("#authStatus").textContent="Logged out"; updateAdminVisibility(); save(); };

$("#spawnItem").onclick=()=>{ if(!adminGuard()) return; const s=generateSkin({high:true}); state.inventory.push(s); $("#adminOutput").textContent=`Spawned ${s.weapon}`; save(); };
$("#boostEconomy").onclick=()=>{ if(!adminGuard()) return; state.market=state.market.map(v=>v*1.1); save(); };
$("#grantCash").onclick=()=>{ if(!adminGuard()) return; state.money+=10000; save(); };

$("#eventPicker").onchange=(e)=>{ state.event=e.target.value; pushHistory(`Event changed to ${state.event}`); save(); };
$("#exportData").onclick=exportData;
$("#importData").onchange=(e)=>{ if(e.target.files[0]) importData(e.target.files[0]); };
$(".import-label").onclick=()=>$("#importData").click();
$("#themeToggle").onclick=()=>document.documentElement.classList.toggle("light");

render();
