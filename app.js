const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const rarities=[["Consumer",.45],["Industrial",.24],["Mil-Spec",.16],["Restricted",.09],["Classified",.04],["Covert",.018],["Knife",.002]];
const weaponPool=["AK-47","M4A1-S","AWP","Glock-18","USP-S","Desert Eagle","FAMAS","P90","MP9","AUG","SG553","Galil AR","MAC-10","MP7","UMP-45","Nova","XM1014","M249","Negev","Five-SeveN","P250","Dual Berettas","CZ75-Auto","Karambit","Butterfly Knife","Bayonet","Talon Knife","Skeleton Knife","Nomad Knife","Flip Knife"];
const patterns=["Blue Gem","Doppler","Fade","Tiger Tooth","Crimson Web","Lore","Slaughter","Night","Case Hardened","Emerald","Ruby","Sapphire"];
const stickers=["💖","💋","⭐","🔥","❄️","👑","🎃","🌴"];
const casePool=[
 {name:"CS20",price:60,high:false},{name:"Prisma 2",price:65,high:false},{name:"Recoil",price:70,high:false},{name:"Clutch",price:75,high:false},
 {name:"Gamma 2",price:80,high:false},{name:"Fracture",price:85,high:false},{name:"Dreams & Nightmares",price:90,high:false},
 {name:"Sticker Capsule",price:30,stickerOnly:true,high:false},{name:"Event Sticker Capsule",price:85,stickerOnly:true,high:false},
 {name:"Dragon Vault",price:450,high:true},{name:"Sapphire Ultra",price:600,high:true}
];
const dbSkins=weaponPool.flatMap(w=>patterns.map(p=>`${w} | ${p}`));
const ranks=["Silver I","Silver Elite","Gold Nova","Master Guardian","DMG","Legendary Eagle","Supreme","Global Elite"];

const base={user:null,money:1000,bank:0,perClick:1,auto:0,luck:1,xp:0,level:1,rank:"Silver I",inventory:[],favorites:[],history:[],market:[80,82,81,84],event:"None",eventTicks:0,lastDaily:null,lastWheel:null,loan:0,bpXP:0,streak:0,loyalty:0,sortByValue:false,
stats:{opened:0,profit:0,highest:0,games:0,wins:0,losses:0},
casino:{blackjack:null,crash:null,mines:null,jackpot:null,roulette:null,coinflip:null,slots:null,plinko:null},listings:[]};
const state=Object.assign({},base,JSON.parse(localStorage.getItem("neoncase")||"{}"));
const rand=(a,b)=>Math.random()*(b-a)+a, money=v=>`$${Math.floor(v).toLocaleString()}`;
function save(){localStorage.setItem("neoncase",JSON.stringify(state));render();}
function pushHistory(t){state.history.unshift(`${new Date().toLocaleTimeString()} • ${t}`);state.history=state.history.slice(0,150)}
function today(){return new Date().toISOString().slice(0,10)}
function isWeekend(){return [0,6].includes(new Date().getDay())}

function weaponImage(name){
  const color=name.includes("Knife")?"%23a8d5ff":"%23d29cff";
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 120'><defs><linearGradient id='g' x1='0' x2='1'><stop stop-color='${color}'/><stop offset='1' stop-color='%236742c2'/></linearGradient></defs><rect width='300' height='120' fill='%23140e23'/><path d='M20 70 L230 70 L280 55 L230 45 L20 45 Z' fill='url(%23g)'/><rect x='210' y='40' width='18' height='35' fill='%23272445'/><text x='10' y='20' fill='%23fff' font-size='14'>${name}</text></svg>`;
}
function caseImage(name){return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 100'><rect width='180' height='100' rx='10' fill='%23231a3d'/><rect x='8' y='8' width='164' height='84' rx='8' fill='%23392666'/><text x='14' y='56' fill='white' font-size='14'>${name}</text></svg>`}

function rarityRoll(high){
 const bonus=(isWeekend()?2:1)*state.luck*(high?1.4:1); let r=Math.random(),s=0;
 for(const [n,c] of rarities){s+=c*(n==="Knife"?bonus:1+(bonus-1)*.2); if(r<=s)return n}
 return "Consumer";
}
function genSkin(c){
 const w=weaponPool[Math.floor(rand(0,weaponPool.length))], rarity=rarityRoll(c?.high), pattern=patterns[Math.floor(rand(0,patterns.length))];
 const float=rand(.0001,.99).toFixed(4), seed=Math.floor(rand(1,1000));
 const baseV={Consumer:2,Industrial:5,"Mil-Spec":12,Restricted:25,Classified:58,Covert:160,Knife:990}[rarity];
 const val=Math.floor(baseV*(c?.high?3.2:1)*(state.market.at(-1)/80)*rand(.8,1.5));
 const eventLimited=state.event!=="None"&&Math.random()>.8;
 const s={id:crypto.randomUUID(),weapon:w,rarity,pattern,float,seed,value:val,stickers:Math.random()>.7?Array.from({length:Math.floor(rand(1,4))},()=>stickers[Math.floor(rand(0,stickers.length))]):[],eventLimited,img:weaponImage(w)};
 return s;
}

function skinCard(s){return `<div class='skin-card rarity-${s.rarity} ${s.eventLimited?"event-border":""}'><div class='weapon-img'><img src='${s.img}' alt='${s.weapon}'/></div><b>${s.weapon}</b><small>${s.pattern}</small><div>${money(s.value)}</div><small>Float ${s.float} • Seed ${s.seed}</small><div class='stickers'>${(s.stickers||[]).map(x=>`<span>${x}</span>`).join("")}</div><button onclick="toggleFav('${s.id}')">${state.favorites.includes(s.id)?"★":"☆"}</button></div>`}
window.toggleFav=(id)=>{state.favorites.includes(id)?state.favorites=state.favorites.filter(x=>x!==id):state.favorites.push(id);save()}

function levelUp(){while(state.xp>=state.level*100){state.xp-=state.level*100;state.level++;state.luck+=.03;state.money+=300}state.rank=ranks[Math.min(ranks.length-1,Math.floor(state.level/6))]}
function upgradeCost(type){if(type==="click")return Math.floor(50+state.perClick*28);if(type==="auto")return Math.floor(160+state.auto*120);return Math.floor(380+state.luck*160)}

function openCase(name,count=1){const c=casePool.find(x=>x.name===name); if(!c)return; const cost=c.price*count; if(state.money<cost)return; state.money-=cost;
 $("#caseAnimation").innerHTML=`<div class='roll-track'>${Array.from({length:18},()=>`<div class='skin-card'><div class='weapon-img'><img src='${weaponImage(weaponPool[Math.floor(rand(0,weaponPool.length))])}'/></div></div>`).join("")}</div>`;
 setTimeout(()=>{const pulls=[]; for(let i=0;i<count;i++){const s=genSkin(c); if(c.stickerOnly){s.weapon="Sticker Pack";s.pattern="Event Stickers";s.img=caseImage("Stickers")} pulls.push(s);} state.inventory.push(...pulls); state.stats.opened+=count; state.stats.highest=Math.max(state.stats.highest,...pulls.map(p=>p.value)); state.money+=pulls.reduce((a,b)=>a+b.value*0.05,0); state.xp+=15*count; state.bpXP+=10*count; levelUp(); pushHistory(`Opened ${count}x ${name}`); $("#openResults").innerHTML=pulls.map(skinCard).join(""); save();},900)
}
window.openCase=openCase;

function drawGraph(){const c=$("#marketGraph"),x=c.getContext("2d");x.clearRect(0,0,c.width,c.height);x.strokeStyle="#4f397a";x.strokeRect(0,0,c.width,c.height);x.strokeStyle="#cb6bff";x.beginPath();state.market.forEach((v,i)=>{const px=20+i*(c.width-40)/(state.market.length-1),py=c.height-(v-50)*3;i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke();x.fillStyle="#c9b3ff";x.fillText("Market trend",20,16)}

function randomEvent(){const ev=["None","Christmas","Halloween","Summer Heat"];state.event=ev[Math.floor(rand(0,ev.length))];pushHistory(`Random event: ${state.event}`)}
function applySeasonFx(){const fx=$("#seasonFx");fx.className="season-fx";if(state.event==="Christmas")fx.classList.add("christmas");if(state.event==="Halloween")fx.classList.add("halloween");if(state.event==="Summer Heat")fx.classList.add("summer")}

function buildCasinoUI(){
 const g=$("#gameSelect").value, ui=$("#casinoUI");
 if(g==="Blackjack") ui.innerHTML=`<div class='cards'>Dealer: <span id='dealerCards'></span></div><div class='cards'>You: <span id='playerCards'></span></div><div class='row-wrap'><button id='bjHit'>Hit</button><button id='bjStand'>Stand</button></div>`;
 if(g==="Crash") ui.innerHTML=`<div class='crash-view'><div id='crashLine' class='crash-line'></div></div><div class='row-wrap'><strong id='crashMult'>1.00x</strong><button id='crashCash'>Cash Out</button></div>`;
 if(g==="Roulette") ui.innerHTML=`<div class='roulette-wheel' id='rouletteWheel'>🎡</div><div class='row-wrap'><select id='rouletteType'><option value='red'>Red</option><option value='black'>Black</option><option value='even'>Even</option><option value='odd'>Odd</option><option value='number'>Number</option></select><input id='rouletteNumber' type='number' min='0' max='36' value='7'/></div>`;
 if(g==="Coinflip") ui.innerHTML=`<div class='coin' id='coin'>🪙</div><div class='row-wrap'><button data-side='heads' class='coinSide'>Heads</button><button data-side='tails' class='coinSide'>Tails</button></div>`;
 if(g==="Jackpot") ui.innerHTML=`<div class='jackpot-wheel' id='jackpotWheel'>🎯 Winner Wheel</div><div class='row-wrap'><button id='addJackpotSkin'>Add random inventory skin</button><button id='spinJackpot'>Spin Jackpot</button></div><div id='jackpotPool'></div>`;
 if(g==="Mines") ui.innerHTML=`<div class='row-wrap'><label>Bombs:</label><input id='mineBombs' type='number' min='1' max='20' value='3'/><button id='startMines'>Start</button><button id='cashoutMines'>Cashout</button></div><div id='minesGrid' class='mines-grid'></div><div id='minesMult'>1.00x</div>`;
 if(g==="Slots") ui.innerHTML=`<div class='slot-reel'><div class='slot-reels'><div id='s1'>🍒</div><div id='s2'>🍋</div><div id='s3'>7️⃣</div></div><small>3 same = 5x, 2 same = 2x</small></div>`;
 if(g==="Plinko") ui.innerHTML=`<div class='plinko-board' id='plinkoBoard'></div><button id='dropPlinko'>Drop Ball</button>`;
 wireCasinoUI(g);
}
function wireCasinoUI(g){
 if(g==="Blackjack"){ $("#bjHit").onclick=bjHit; $("#bjStand").onclick=bjStand; }
 if(g==="Crash"){ $("#crashCash").onclick=crashCashout; }
 if(g==="Coinflip"){ $$(".coinSide").forEach(b=>b.onclick=()=>state.casino.coinflip={pick:b.dataset.side}); }
 if(g==="Jackpot"){ $("#addJackpotSkin").onclick=jackpotAdd; $("#spinJackpot").onclick=jackpotSpin; }
 if(g==="Mines"){ $("#startMines").onclick=minesStart; $("#cashoutMines").onclick=minesCashout; }
 if(g==="Plinko"){ setupPlinko(); $("#dropPlinko").onclick=plinkoDrop; }
}

function playGame(){const g=$("#gameSelect").value,bet=Number($("#betAmount").value||0);if(bet<=0)return;
 if(g==="Blackjack")return blackjackStart(bet); if(g==="Crash")return crashStart(bet); if(g==="Roulette")return roulettePlay(bet); if(g==="Coinflip")return coinflipPlay(bet); if(g==="Jackpot")return jackpotStart(bet); if(g==="Mines")return minesBet(bet); if(g==="Slots")return slotsPlay(bet); if(g==="Plinko")return plinkoStart(bet);
}

// Blackjack
const cardVals=[2,3,4,5,6,7,8,9,10,10,10,11];
function drawCard(){return cardVals[Math.floor(rand(0,cardVals.length))]}
function handStr(h){return h.join(" ")+` (${h.reduce((a,b)=>a+b,0)})`}
function fixAce(h){while(h.reduce((a,b)=>a+b,0)>21&&h.includes(11)){h[h.indexOf(11)]=1}}
function blackjackStart(b){if(state.money<b)return;state.money-=b;state.casino.blackjack={bet:b,player:[drawCard(),drawCard()],dealer:[drawCard(),drawCard()],done:false};fixAce(state.casino.blackjack.player);fixAce(state.casino.blackjack.dealer);renderBJ();}
function renderBJ(){const bj=state.casino.blackjack;if(!bj||!$("#dealerCards"))return;$("#dealerCards").textContent=handStr(bj.dealer);$("#playerCards").textContent=handStr(bj.player)}
function bjHit(){const bj=state.casino.blackjack;if(!bj||bj.done)return;bj.player.push(drawCard());fixAce(bj.player);renderBJ();if(bj.player.reduce((a,b)=>a+b,0)>21){bj.done=true;state.stats.games++;state.stats.losses++;state.stats.profit-=bj.bet;$("#casinoOutput").textContent="Bust!";save();}}
function bjStand(){const bj=state.casino.blackjack;if(!bj||bj.done)return;while(bj.dealer.reduce((a,b)=>a+b,0)<17){bj.dealer.push(drawCard());fixAce(bj.dealer)} bj.done=true;const p=bj.player.reduce((a,b)=>a+b,0), d=bj.dealer.reduce((a,b)=>a+b,0);let payout=0;if(d>21||p>d)payout=bj.bet*2;else if(p===d)payout=bj.bet;state.money+=payout;state.stats.games++;if(payout>bj.bet){state.stats.wins++;state.stats.profit+=payout-bj.bet}else{state.stats.losses++;state.stats.profit-=bj.bet-payout}renderBJ();$("#casinoOutput").textContent=`Blackjack result: ${money(payout)}`;save();}

// Crash
function crashStart(b){if(state.money<b)return;state.money-=b;state.casino.crash={bet:b,m:1,active:true,t:0};$("#casinoOutput").textContent="Crash running";}
function crashTick(){const c=state.casino.crash;if(!c?.active||!$("#crashMult"))return;c.m+=rand(.03,.14);c.t++;$("#crashMult").textContent=`${c.m.toFixed(2)}x`;$("#crashLine").style.transform=`scale(${Math.min(6,c.m)},${Math.min(12,c.m*1.2)})`;if(Math.random()>.95||c.t>80){c.active=false;$("#casinoOutput").textContent=`Crashed at ${c.m.toFixed(2)}x`;state.stats.games++;state.stats.losses++;state.stats.profit-=c.bet;save();}}
function crashCashout(){const c=state.casino.crash;if(!c?.active)return;c.active=false;const payout=Math.floor(c.bet*c.m);state.money+=payout;state.stats.games++;state.stats.wins++;state.stats.profit+=payout-c.bet;$("#casinoOutput").textContent=`Cashed out at ${c.m.toFixed(2)}x => ${money(payout)}`;save();}

function roulettePlay(b){if(state.money<b)return;state.money-=b;const t=$("#rouletteType")?.value||"red",n=Number($("#rouletteNumber")?.value||0);let landed=Math.floor(rand(0,37));let color=landed===0?"green":landed%2?"red":"black";let win=false,p=0;if(t==="red"||t==="black") {win=color===t;p=2}else if(t==="even"||t==="odd"){win=landed!==0&&(landed%2===0?"even":"odd")===t;p=2}else {win=landed===n;p=36} $("#rouletteWheel").style.transform=`rotate(${Math.floor(rand(720,1600))}deg)`;const payout=win?b*p:0;state.money+=payout;state.stats.games++;if(win){state.stats.wins++;state.stats.profit+=payout-b}else{state.stats.losses++;state.stats.profit-=b}$("#casinoOutput").textContent=`Roulette landed ${landed} ${color}. ${win?"Win":"Lose"}`;save();}
function coinflipPlay(b){if(state.money<b)return;state.money-=b;const pick=state.casino.coinflip?.pick||"heads";const r=Math.random()>.5?"heads":"tails";$("#coin")?.classList.add("flip");setTimeout(()=>$("#coin")?.classList.remove("flip"),600);const win=pick===r,payout=win?Math.floor(b*1.95):0;state.money+=payout;state.stats.games++;if(win){state.stats.wins++;state.stats.profit+=payout-b}else{state.stats.losses++;state.stats.profit-=b}$("#casinoOutput").textContent=`Coin: ${r}. ${win?"Win":"Lose"}`;save();}

function jackpotStart(b){if(state.money<b)return;state.money-=b;state.casino.jackpot={bet:b,your:[],bot:[],ready:true};$("#casinoOutput").textContent="Add skins then spin";save();}
function jackpotAdd(){const j=state.casino.jackpot;if(!j?.ready||!state.inventory.length)return;const s=state.inventory.pop();j.your.push(s);j.bot.push(genSkin({high:true}));$("#jackpotPool").textContent=`You: ${j.your.reduce((a,x)=>a+x.value,0)} | Bot: ${j.bot.reduce((a,x)=>a+x.value,0)}`;save();}
function jackpotSpin(){const j=state.casino.jackpot;if(!j?.ready)return;const y=j.your.reduce((a,x)=>a+x.value,0), b=j.bot.reduce((a,x)=>a+x.value,0);const chance=y/(y+b||1);$("#jackpotWheel").style.transform=`rotate(${Math.floor(rand(900,2000))}deg)`;const win=Math.random()<chance; if(win){state.inventory.push(...j.bot,...j.your);state.stats.wins++;$("#casinoOutput").textContent="Jackpot won all skins"} else {state.stats.losses++;$("#casinoOutput").textContent="Jackpot lost"} state.stats.games++;save();}

function minesBet(b){if(state.money<b)return;state.money-=b;state.casino.mines={bet:b};minesStart();}
function minesStart(){const m=state.casino.mines;if(!m)return;const bombs=Math.max(1,Math.min(20,Number($("#mineBombs")?.value||3)));m.bombs=bombs;m.mult=1;m.opened=0;m.alive=true;m.board=Array.from({length:25},()=>false);for(let i=0;i<bombs;i++) m.board[Math.floor(rand(0,25))]=true;const g=$("#minesGrid");g.innerHTML="";Array.from({length:25},(_,i)=>{const b=document.createElement("button");b.className="mine-cell";b.onclick=()=>minesPick(i,b);g.appendChild(b)});$("#minesMult").textContent="1.00x";}
function minesPick(i,btn){const m=state.casino.mines;if(!m?.alive)return;if(m.board[i]){btn.classList.add("bomb");m.alive=false;state.stats.games++;state.stats.losses++;state.stats.profit-=m.bet;$("#casinoOutput").textContent="Boom!";save();return} btn.classList.add("open");m.opened++;m.mult+=.18+(m.bombs/100);$("#minesMult").textContent=`${m.mult.toFixed(2)}x`;}
function minesCashout(){const m=state.casino.mines;if(!m?.alive)return;const payout=Math.floor(m.bet*m.mult);state.money+=payout;m.alive=false;state.stats.games++;state.stats.wins++;state.stats.profit+=payout-m.bet;$("#casinoOutput").textContent=`Mines cashout ${money(payout)}`;save();}

function slotsPlay(b){if(state.money<b)return;state.money-=b;const items=["🍒","🍋","7️⃣","💎","⭐"];const r=[0,1,2].map(()=>items[Math.floor(rand(0,items.length))]);["#s1","#s2","#s3"].forEach((id,i)=>{const el=$(id);if(el)el.textContent=r[i]});let mult=0;if(r[0]===r[1]&&r[1]===r[2])mult=5;else if(r[0]===r[1]||r[1]===r[2]||r[0]===r[2])mult=2;const payout=Math.floor(b*mult);state.money+=payout;state.stats.games++;if(mult){state.stats.wins++;state.stats.profit+=payout-b}else{state.stats.losses++;state.stats.profit-=b}$("#casinoOutput").textContent=`Slots: ${r.join(" ")} -> ${money(payout)}`;save();}

function setupPlinko(){const p=$("#plinkoBoard");if(!p)return;p.innerHTML="";for(let r=0;r<7;r++)for(let c=0;c<=r;c++){const d=document.createElement("div");d.className="peg";d.style.left=`${20+c*20+r*8}px`;d.style.top=`${18+r*20}px`;p.appendChild(d)}}
function plinkoStart(b){if(state.money<b)return;state.money-=b;state.casino.plinko={bet:b};$("#casinoOutput").textContent="Drop a ball"}
function plinkoDrop(){const p=state.casino.plinko;if(!p)return;const board=$("#plinkoBoard");if(!board)return;const ball=document.createElement("div");ball.className="plinko-ball";board.appendChild(ball);let x=50,y=0;const id=setInterval(()=>{y+=8;x+=(Math.random()>.5?6:-6);ball.style.left=`${Math.max(5,Math.min(95,x))}%`;ball.style.top=`${y}px`;if(y>150){clearInterval(id);const mult=[0,.5,1,2,5][Math.floor(rand(0,5))],pay=Math.floor(p.bet*mult);state.money+=pay;state.stats.games++;if(mult>=1){state.stats.wins++;state.stats.profit+=pay-p.bet}else{state.stats.losses++;state.stats.profit-=p.bet-pay}$("#casinoOutput").textContent=`Plinko ${mult}x => ${money(pay)}`;save();}},60)}

function renderListings(){const el=$("#marketListings");el.innerHTML=state.listings.map((l,i)=>`<div class='skin-card'><b>${l.name}</b><div>${money(l.price)}</div><small>${l.type}</small><div class='row-wrap'><button onclick='buyListing(${i})'>Buy</button><button onclick='bidListing(${i})'>Bid</button></div></div>`).join("")}
window.buyListing=(i)=>{const l=state.listings[i];if(!l||state.money<l.price)return;state.money-=l.price;state.inventory.push(genSkin({high:l.price>300}));state.listings.splice(i,1);pushHistory(`Bought listing ${l.name}`);save();}
window.bidListing=(i)=>{const l=state.listings[i];if(!l||state.money<l.price*.2)return;state.money-=Math.floor(l.price*.2);const win=Math.random()>.5;$("#marketLog").innerHTML=`<div>Auction wheel spun: ${win?"you won":"bot won"} ${l.name}</div>`+$("#marketLog").innerHTML;if(win){state.inventory.push(genSkin({high:true}));state.listings.splice(i,1)}save();}

function render(){
 $("#money").textContent=money(state.money);$("#bankMoney").textContent=money(state.bank);$("#xpLevel").textContent=`${state.xp}/Lv ${state.level}`;$("#rank").textContent=state.rank;$("#luck").textContent=`${state.luck.toFixed(2)}x`;
 $("#perClick").textContent=money(state.perClick);$("#streak").textContent=state.streak;$("#loyalty").textContent=state.loyalty;
 $("#upgClick").textContent=`Upgrade Click (${money(upgradeCost("click"))})`;$("#upgAuto").textContent=`Auto Click (${money(upgradeCost("auto"))})`;$("#upgLuck").textContent=`Luck Stat (${money(upgradeCost("luck"))})`;
 $("#seasonEvent").textContent=`${state.event} • Event cases appear randomly`;applySeasonFx();
 $("#liveFeed").innerHTML=Array.from({length:8},()=>`<div>🤖 Bot${Math.floor(rand(1,999))} pulled ${weaponPool[Math.floor(rand(0,weaponPool.length))]}</div>`).join("");
 $("#history").innerHTML=state.history.map(h=>`<div>${h}</div>`).join("");
 const rf=$("#rarityFilter").value,q=$("#searchSkin").value.toLowerCase(); let inv=state.inventory.filter(s=>(rf==="all"||s.rarity===rf)&&(`${s.weapon} ${s.pattern}`.toLowerCase().includes(q))); if(state.sortByValue)inv=inv.sort((a,b)=>b.value-a.value); $("#inventoryGrid").innerHTML=inv.map(skinCard).join("");
 $("#databaseGrid").innerHTML=dbSkins.slice(0,280).map(n=>`<div class='skin-card'><div class='weapon-img'><img src='${weaponImage(n.split(" | ")[0])}'/></div><b>${n}</b></div>`).join("");
 $("#statsList").innerHTML=`<li>Opened: ${state.stats.opened}</li><li>Profit/Loss: ${money(state.stats.profit)}</li><li>Best item: ${money(state.stats.highest)}</li><li>Games: ${state.stats.games} (W ${state.stats.wins} / L ${state.stats.losses})</li><li>Net worth: ${money(state.money+state.bank+state.inventory.reduce((a,b)=>a+b.value,0))}</li>`;
 $("#caseList").innerHTML=casePool.map(c=>`<div class='skin-card ${c.high?"event-border":""}'><div class='case-thumb'><img src='${caseImage(c.name)}' alt='${c.name}'/></div><b>${c.name}</b><div>${money(c.price)}</div><button onclick="openCase('${c.name}', Number(document.getElementById('openCount').value||1))">Open</button></div>`).join("");
 $("#battleCase").innerHTML=casePool.map(c=>`<option>${c.name}</option>`).join("");
 renderListings(); drawGraph(); updateAdminVisibility(); renderBJ();
}

function updateAdminVisibility(){const ok=state.user==="d3vi0us";$("#adminTabBtn").classList.toggle("hidden",!ok);$("#admin").classList.toggle("hidden",!ok)}
function exportData(){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}));a.download="neoncase-save.json";a.click()}
function importData(f){const r=new FileReader();r.onload=()=>{try{Object.assign(state,JSON.parse(r.result));pushHistory("Save imported");save()}catch{alert("Invalid save")}};r.readAsText(f)}

setInterval(()=>{state.money+=state.auto*state.perClick;state.bank+=state.bank*.0008;if(state.loan>0){state.loan*=1.0015;state.money-=state.loan*.0007};
 const t=state.market.at(-1)+rand(-2.3,2.8);state.market.push(Math.max(60,Math.min(130,t)));state.market=state.market.slice(-50);
 if(Math.random()>.85)state.listings.unshift({name:`${weaponPool[Math.floor(rand(0,weaponPool.length))]} | ${patterns[Math.floor(rand(0,patterns.length))]}`,price:Math.floor(rand(20,900)),type:Math.random()>.5?"listing":"auction"});state.listings=state.listings.slice(0,20);
 if(Math.random()>.94){$("#marketLog").innerHTML=`<div>🤖 Bot auction wheel spun; price spike ${Math.floor(rand(3,15))}%</div>`+$("#marketLog").innerHTML}
 crashTick(); state.eventTicks++; if(state.eventTicks>35){state.eventTicks=0; randomEvent()} save();},2500);

// UI wires
$("#tabs").addEventListener("click",e=>{if(e.target.tagName!=="BUTTON"||e.target.classList.contains("hidden"))return; $$("#tabs button").forEach(b=>b.classList.remove("active"));e.target.classList.add("active"); $$(".tab-panel").forEach(t=>t.classList.remove("active")); $(`#${e.target.dataset.tab}`).classList.add("active")});
$("#gameSelect").onchange=()=>{buildCasinoUI();}; buildCasinoUI();
$("#playGame").onclick=playGame;
$("#moneyClick").onclick=()=>{state.money+=state.perClick;state.xp+=2;state.streak++;state.loyalty++;levelUp();save()}
$$(".upgrade").forEach(b=>b.onclick=()=>{const t=b.dataset.upg,c=upgradeCost(t);if(state.money<c)return;state.money-=c;if(t==="click")state.perClick+=1;if(t==="auto")state.auto+=.35;if(t==="luck")state.luck+=.08;save()})
$("#claimDaily").onclick=()=>{if(state.lastDaily===today())return alert("Daily already claimed");state.lastDaily=today();state.money+=500;state.xp+=40;pushHistory("Daily reward claimed");save()}
$("#dailyWheel").onclick=()=>{if(state.lastWheel===today())return alert("Wheel already used");state.lastWheel=today();const prizes=[100,250,500,1000,2000];const p=prizes[Math.floor(rand(0,prizes.length))];state.money+=p;pushHistory(`Daily wheel won ${money(p)}`);save()}
$("#rebirthBtn").onclick=()=>{if(state.level<15)return;state.level=1;state.xp=0;state.perClick=2;state.luck+=.5;state.money+=10000;pushHistory("Rebirth complete");save()}
$("#claimStreak").onclick=()=>{const b=state.streak*2;state.money+=b;state.streak=0;save()}
$("#sortValue").onclick=()=>{state.sortByValue=!state.sortByValue;save()}; $("#rarityFilter").onchange=render; $("#searchSkin").oninput=render;
$("#startBattle").onclick=()=>{const bet=Number($("#battleBet").value||0),cn=$("#battleCase").value,c=casePool.find(x=>x.name===cn);if(state.money<bet||!c)return;state.money-=bet;$("#battleAnimation").innerHTML=`<div class='roll-track'>${Array.from({length:9},()=>`<div class='skin-card'><div class='weapon-img'><img src='${weaponImage(weaponPool[Math.floor(rand(0,weaponPool.length))])}'/></div></div>`).join("")}</div>`;setTimeout(()=>{const y=genSkin(c),b=genSkin(c),w=y.value>=b.value;state.inventory.push(y);if(w)state.money+=bet+b.value*.4;$("#battleOutput").textContent=`${$("#battleMode").value}: ${w?"Win":"Loss"} ${y.weapon} ${money(y.value)} vs ${b.weapon} ${money(b.value)}`;$("#battleAnimation").innerHTML=`<div class='weapon-img'><img src='${y.img}'/></div><div class='weapon-img'><img src='${b.img}'/></div>`;save()},850)}
$("#exportData").onclick=exportData;$("#importData").onchange=e=>e.target.files[0]&&importData(e.target.files[0]);$(".import-label").onclick=()=>$("#importData").click();
$("#openAuth").onclick=()=>$("#authModal").showModal(); $("#closeAuth").onclick=()=>$("#authModal").close();
$("#signup").onclick=()=>{state.user=$("#username").value.trim();$("#authStatus").textContent=`Signed up as ${state.user}`;save()};
$("#login").onclick=()=>{const u=$("#username").value.trim();if(!u)return;state.user=u;$("#authStatus").textContent=`Logged in as ${u}`;save()};
$("#logout").onclick=()=>{state.user=null;$("#authStatus").textContent="Logged out";save()};
$("#spawnItem").onclick=()=>{if(state.user!=="d3vi0us")return;state.inventory.push(genSkin({high:true}));save()}; $("#boostEconomy").onclick=()=>{if(state.user!=="d3vi0us")return;state.market=state.market.map(v=>v*1.1);save()}; $("#grantCash").onclick=()=>{if(state.user!=="d3vi0us")return;state.money+=10000;save()};
$("#themeToggle").onclick=()=>document.documentElement.classList.toggle("light");

render();
