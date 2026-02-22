const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const users=["shadowAce","novaSpark","vortexK","lunaCore","axiomX","driftWolf","ionBlade","pixelRex","zeroPulse","mistValen"];
const rarities=[["Mil-Spec",0.7992],["Restricted",0.1598],["Classified",0.032],["Covert",0.0064],["Knife",0.0026]];
const guns=["AK-47","M4A1-S","AWP","Glock-18","USP-S","Desert Eagle","FAMAS","P90","MP9","AUG","SG553","Galil AR","MAC-10","MP7","UMP-45","Nova","XM1014","M249","Negev","Five-SeveN","P250","Dual Berettas","CZ75-Auto","Karambit","Butterfly Knife","Bayonet","Talon Knife","Skeleton Knife","Nomad Knife","Flip Knife"];
const patterns=["Blue Gem","Doppler","Fade","Tiger Tooth","Crimson Web","Lore","Slaughter","Night","Case Hardened","Emerald","Ruby","Sapphire"];
const cases=[{name:"Revolution",price:2.1,high:false},{name:"Dreams & Nightmares",price:2.2,high:false},{name:"Fracture",price:2.4,high:false},{name:"Clutch",price:2.5,high:false},{name:"Prisma 2",price:2.6,high:false},{name:"Gamma 2",price:2.7,high:false},{name:"Operation High Tier",price:8.5,high:true},{name:"Dragon Vault",price:12,high:true},{name:"Sticker Capsule",price:.9,stickerOnly:true,high:false},{name:"Event Sticker Capsule",price:2.8,stickerOnly:true,high:false}];
const ranks=["Silver I","Silver Elite","Gold Nova","Master Guardian","DMG","Legendary Eagle","Supreme","Global Elite"];
const updates=[
  "2026-02-22 Added full casino game UIs (blackjack/roulette/coinflip/crash/jackpot/mines/slots/plinko).",
  "2026-02-22 Added random seasonal events with custom visual overlays.",
  "2026-02-22 Added case battles with case-price entry and combined-value payouts.",
  "2026-02-22 Added market listings, bids, confirmations, and auction wheel resolution.",
  "2026-02-22 Added data export/import, database tab, inventory sell/send-to-bank, and daily wheel lockout."
];
const base={user:null,money:300,bank:0,xp:0,level:1,rank:"Silver I",luck:1,perClick:1,auto:0,loyalty:0,streak:0,lastDaily:null,lastWheel:null,event:"None",eventTick:0,inventory:[],favorites:[],history:[],stats:{opened:0,profit:0,highest:0,games:0,wins:0,losses:0},market:[100,101,98,103],listings:[],pending:null,sortByValue:false,
casino:{blackjack:null,crash:null,mines:null,jackpot:{bet:[],bot:[]},coinPick:"heads"}};
const state=Object.assign({},base,JSON.parse(localStorage.getItem("neoncase")||"{}"));
const rnd=(a,b)=>Math.random()*(b-a)+a,m=v=>`$${v.toFixed(2)}`;

function b64svg(svg){return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`}
function weaponImg(name){const knife=name.includes("Knife")||name.includes("Karambit")||name.includes("Bayonet")||name.includes("Talon")||name.includes("Butterfly");const svg=`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 120'><defs><linearGradient id='g' x1='0' x2='1'><stop stop-color='${knife?'#8dd4ff':'#d39cff'}'/><stop offset='1' stop-color='#6a42cb'/></linearGradient></defs><rect width='320' height='120' fill='#140e23'/><path d='M24 74 L242 74 L292 58 L242 44 L24 44 Z' fill='url(#g)'/><rect x='220' y='40' width='16' height='38' fill='#252040'/><text x='12' y='20' fill='#fff' font-size='14'>${name}</text></svg>`;return b64svg(svg)}
function caseImg(name){const svg=`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 120'><rect width='220' height='120' rx='12' fill='#241a3f'/><rect x='10' y='12' width='200' height='96' rx='10' fill='#3d2a6f'/><rect x='14' y='16' width='192' height='88' rx='8' fill='none' stroke='#8d6fe6'/><text x='18' y='66' fill='white' font-size='16'>${name}</text></svg>`;return b64svg(svg)}

function save(){localStorage.setItem("neoncase",JSON.stringify(state));render()}
function today(){return new Date().toISOString().slice(0,10)}
function pushHistory(x){state.history.unshift(`${new Date().toLocaleTimeString()} • ${x}`);state.history=state.history.slice(0,120)}

function rollRarity(high=false){let r=Math.random(),s=0,boost=(high?1.2:1)*(state.luck*( [0,6].includes(new Date().getDay())?1.2:1));for(const [n,c] of rarities){s+=n==="Knife"?c*boost:c;if(r<=s)return n}return"Mil-Spec"}
function priceFor(r){return {"Mil-Spec":1.5,"Restricted":8,"Classified":28,"Covert":120,"Knife":700}[r]}
function makeSkin(c){const weapon=guns[Math.floor(rnd(0,guns.length))],rarity=rollRarity(c?.high),pattern=patterns[Math.floor(rnd(0,patterns.length))],float=rnd(.0001,.99).toFixed(4),seed=Math.floor(rnd(1,1000));let value=priceFor(rarity)*rnd(.85,1.25)*(c?.high?1.4:1);if(c?.stickerOnly)value=rnd(.2,3.5);const eventLimited=state.event!=="None"&&Math.random()>.82;return{id:crypto.randomUUID(),weapon:c?.stickerOnly?"Sticker Pack":weapon,rarity:c?.stickerOnly?"Restricted":rarity,pattern:c?.stickerOnly?"Event Stickers":pattern,float,seed,value:+value.toFixed(2),img:weaponImg(weapon),eventLimited}}
function card(s){return `<div class='skin-card rarity-${s.rarity} ${s.eventLimited?'event-border':''}'><div class='weapon-img'><img src='${s.img}'/></div><b>${s.weapon}</b><small>${s.pattern}</small><div>${m(s.value)}</div><small>Float ${s.float} • Seed ${s.seed}</small><div class='row-wrap'><button onclick='sellSkin("${s.id}")'>Sell</button><button onclick='bankSkin("${s.id}")'>Send to bank</button></div></div>`}
window.sellSkin=id=>{const i=state.inventory.findIndex(x=>x.id===id);if(i<0)return;state.money+=state.inventory[i].value;state.inventory.splice(i,1);save()}
window.bankSkin=id=>{const i=state.inventory.findIndex(x=>x.id===id);if(i<0)return;state.bank+=state.inventory[i].value;state.inventory.splice(i,1);save()}

function openCase(name,count){const c=cases.find(x=>x.name===name);if(!c)return;const cost=c.price*count;if(state.money<cost)return alert('Not enough');state.money-=cost;$('#caseAnimation').innerHTML=`<div class='roll-track'>${Array.from({length:14},()=>`<div class='skin-card'><div class='weapon-img'><img src='${weaponImg(guns[Math.floor(rnd(0,guns.length))])}'/></div></div>`).join('')}</div>`;setTimeout(()=>{const pulls=[];for(let i=0;i<count;i++)pulls.push(makeSkin(c));state.inventory.push(...pulls);state.stats.opened+=count;state.stats.highest=Math.max(state.stats.highest,...pulls.map(p=>p.value));state.money+=pulls.reduce((a,b)=>a+b.value*.03,0);state.xp+=count*8;levelUp();$('#openResults').innerHTML=pulls.map(card).join('');pushHistory(`Opened ${count}x ${name}`);save()},900)}
window.openCase=openCase;
function levelUp(){while(state.xp>=state.level*100){state.xp-=state.level*100;state.level++;state.perClick+=.08;state.luck+=.02}state.rank=ranks[Math.min(ranks.length-1,Math.floor(state.level/6))]}
function upgradeCost(k){if(k==='click')return +(8+state.perClick*6).toFixed(2);if(k==='auto')return +(20+state.auto*14).toFixed(2);return +(40+state.luck*24).toFixed(2)}

function liveLine(){const u=users[Math.floor(rnd(0,users.length))],w=guns[Math.floor(rnd(0,guns.length))],rv=['Mil-Spec','Restricted','Classified','Covert','Knife'][Math.floor(rnd(0,5))];return `${u} pulled ${w} (${rv})`}
function randomEvent(){const ev=['None','Christmas','Halloween','Summer Heat'];state.event=ev[Math.floor(rnd(0,ev.length))];pushHistory(`Event: ${state.event}`)}
function eventFx(){const fx=$('#seasonFx');fx.className='season-fx';if(state.event==='Christmas')fx.classList.add('christmas');if(state.event==='Halloween')fx.classList.add('halloween');if(state.event==='Summer Heat')fx.classList.add('summer')}

// casino ui
function gameUI(){const g=$('#gameSelect').value,ui=$('#casinoUI');
 if(g==='Blackjack')ui.innerHTML=`<div class='cards'>Dealer: <span id='dCards'></span></div><div class='cards'>You: <span id='pCards'></span></div><div class='row-wrap'><button id='hit'>Hit</button><button id='stand'>Stand</button></div>`;
 if(g==='Roulette')ui.innerHTML=`<div class='roulette-wrap'><div id='rWheel' class='roulette-wheel'></div><div><select id='rType'><option value='red'>Red</option><option value='black'>Black</option><option value='even'>Even</option><option value='odd'>Odd</option><option value='number'>Number</option></select><input id='rNum' type='number' min='0' max='36' value='7'/></div></div>`;
 if(g==='Coinflip')ui.innerHTML=`<div class='row-wrap'><button class='pick ${state.casino.coinPick==='heads'?'active':''}' data-p='heads'>Heads</button><button class='pick ${state.casino.coinPick==='tails'?'active':''}' data-p='tails'>Tails</button></div><div id='coin' class='coin'></div>`;
 if(g==='Crash')ui.innerHTML=`<canvas id='crashCanvas' class='crash-chart' width='900' height='160'></canvas><div class='row-wrap'><strong id='crashMult'>1.00x</strong><button id='cashCrash'>Cash Out</button></div>`;
 if(g==='Jackpot')ui.innerHTML=`<div class='row-wrap'><select id='jackSel'></select><button id='addJack'>Select skin</button><button id='spinJack'>Spin wheel</button></div><div id='jackWheel' class='jackpot-wheel'></div><div id='jackInfo'></div>`;
 if(g==='Mines')ui.innerHTML=`<div class='row-wrap'><label>Bombs</label><input id='bombs' type='number' min='1' max='20' value='3'/><button id='startMines'>Start</button><button id='cashMines'>Cashout</button></div><div id='mGrid' class='mines-grid'></div><div id='mMult'>1.00x</div>`;
 if(g==='Slots')ui.innerHTML=`<div class='slot-machine'><div class='slot-reels'><div id='s1'>7</div><div id='s2'>7</div><div id='s3'>7</div></div><small>3x same = 5x, 2x same = 2x</small></div>`;
 if(g==='Plinko')ui.innerHTML=`<div id='pBoard' class='plinko-board'></div><button id='dropBall'>Drop Ball</button>`;
 wireGame(g);
}
function wireGame(g){
 if(g==='Blackjack'){ $('#hit').onclick=bjHit; $('#stand').onclick=bjStand; }
 if(g==='Coinflip'){ $$('.pick').forEach(b=>b.onclick=()=>{state.casino.coinPick=b.dataset.p;gameUI();}); }
 if(g==='Crash'){ $('#cashCrash').onclick=crashCash; drawCrash(); }
 if(g==='Jackpot'){populateJackSel(); $('#addJack').onclick=jackAdd; $('#spinJack').onclick=jackSpin; }
 if(g==='Mines'){ $('#startMines').onclick=minesStart; $('#cashMines').onclick=minesCash; }
 if(g==='Plinko'){plinkoSetup(); $('#dropBall').onclick=()=>plinkoDrop(); $('#playGame').style.display='none'; } else $('#playGame').style.display='inline-block';
}

function playGame(){const g=$('#gameSelect').value,b=+$('#betAmount').value;if(g==='Plinko')return;if(g==='Blackjack')return bjStart(b);if(g==='Roulette')return roulette(b);if(g==='Coinflip')return coinflip(b);if(g==='Crash')return crashStart(b);if(g==='Jackpot')return jackStart(b);if(g==='Mines')return minesBet(b);if(g==='Slots')return slots(b)}
const cardDeck=['A♠','A♥','A♦','A♣','K♠','Q♥','J♦','10♣','9♠','8♥','7♦','6♣','5♠','4♥','3♦','2♣'];
const cardVal=c=>c.startsWith('A')?11:['K','Q','J','10'].some(x=>c.startsWith(x))?10:+c[0];
function bjFix(h){while(h.reduce((a,b)=>a+cardVal(b),0)>21&&h.some(c=>c.startsWith('A')))h[h.findIndex(c=>c.startsWith('A'))]='1♠'}
function bjScore(h){return h.reduce((a,b)=>a+(b.startsWith('1')?1:cardVal(b)),0)}
function bjStart(b){if(state.money<b)return;state.money-=b;state.casino.blackjack={bet:b,p:[pickCard(),pickCard()],d:[pickCard(),pickCard()],done:false};bjFix(state.casino.blackjack.p);bjFix(state.casino.blackjack.d);renderBj()}
function pickCard(){return cardDeck[Math.floor(rnd(0,cardDeck.length))]}
function renderBj(){const bj=state.casino.blackjack;if(!bj||!$('#dCards'))return;$('#dCards').innerHTML=bj.d.map(c=>`<span class='card'>${c}</span>`).join('');$('#pCards').innerHTML=bj.p.map(c=>`<span class='card'>${c}</span>`).join('')}
function bjHit(){const bj=state.casino.blackjack;if(!bj||bj.done)return;bj.p.push(pickCard());bjFix(bj.p);renderBj();if(bjScore(bj.p)>21){bj.done=true;state.stats.games++;state.stats.losses++;state.stats.profit-=bj.bet;$('#casinoOutput').textContent='Bust';save()}}
function bjStand(){const bj=state.casino.blackjack;if(!bj||bj.done)return;while(bjScore(bj.d)<17){bj.d.push(pickCard());bjFix(bj.d)}bj.done=true;const p=bjScore(bj.p),d=bjScore(bj.d);let pay=0;if(d>21||p>d)pay=bj.bet*2;else if(p===d)pay=bj.bet;state.money+=pay;state.stats.games++;pay>bj.bet?(state.stats.wins++,state.stats.profit+=pay-bj.bet):(state.stats.losses++,state.stats.profit-=bj.bet-pay);$('#casinoOutput').textContent=`Blackjack ${m(pay)}`;renderBj();save()}

function roulette(b){if(state.money<b)return;state.money-=b;const t=$('#rType').value,n=+$('#rNum').value,land=Math.floor(rnd(0,37)),color=land===0?'green':land%2?'red':'black';$('#rWheel').style.transform=`rotate(${Math.floor(rnd(900,1900))}deg)`;let win=false,mult=0;if(['red','black'].includes(t)){win=color===t;mult=2}else if(['even','odd'].includes(t)){win=land!==0&&((land%2?'odd':'even')===t);mult=2}else{win=land===n;mult=36}const pay=win?b*mult:0;state.money+=pay;state.stats.games++;win?(state.stats.wins++,state.stats.profit+=pay-b):(state.stats.losses++,state.stats.profit-=b);$('#casinoOutput').textContent=`Roulette landed ${land} ${color}`;save()}
function coinflip(b){if(state.money<b)return;state.money-=b;const r=Math.random()>.5?'heads':'tails';$('#coin').classList.add('flip');setTimeout(()=>$('#coin').classList.remove('flip'),800);const win=r===state.casino.coinPick,pay=win?b*1.95:0;state.money+=pay;state.stats.games++;win?(state.stats.wins++,state.stats.profit+=pay-b):(state.stats.losses++,state.stats.profit-=b);$('#casinoOutput').textContent=`Coin ${r}`;save()}
function drawCrash(){const c=$('#crashCanvas');if(!c)return;const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.strokeStyle='#24344f';x.strokeRect(0,0,c.width,c.height);x.strokeStyle='#6eff95';x.beginPath();(state.casino.crash?.pts||[{x:0,y:160}]).forEach((p,i)=>i?x.lineTo(p.x,p.y):x.moveTo(p.x,p.y));x.stroke()}
function crashStart(b){if(state.money<b)return;state.money-=b;state.casino.crash={bet:b,m:1,active:true,pts:[{x:0,y:160}]};$('#casinoOutput').textContent='Crash running';gameUI()}
function crashTick(){const c=state.casino.crash;if(!c?.active)return;c.m+=rnd(.03,.14);c.pts.push({x:Math.min(900,c.pts.at(-1).x+14),y:Math.max(4,160-c.m*18)});if(c.pts.length>70)c.pts.shift();if($('#crashMult'))$('#crashMult').textContent=`${c.m.toFixed(2)}x`;drawCrash();if(Math.random()>.95||c.m>8){c.active=false;state.stats.games++;state.stats.losses++;state.stats.profit-=c.bet;$('#casinoOutput').textContent=`Crashed at ${c.m.toFixed(2)}x`;save()}}
function crashCash(){const c=state.casino.crash;if(!c?.active)return;c.active=false;const pay=c.bet*c.m;state.money+=pay;state.stats.games++;state.stats.wins++;state.stats.profit+=pay-c.bet;$('#casinoOutput').textContent=`Cashout ${c.m.toFixed(2)}x`;save()}

function populateJackSel(){const sel=$('#jackSel');if(!sel)return;sel.innerHTML=state.inventory.map(s=>`<option value='${s.id}'>${s.weapon} ${m(s.value)}</option>`).join('')}
function jackStart(b){if(state.money<b)return;state.money-=b;state.casino.jackpot={bet:[],bot:[]};$('#casinoOutput').textContent='Select skins';gameUI()}
function jackAdd(){const id=$('#jackSel').value,i=state.inventory.findIndex(x=>x.id===id);if(i<0)return;state.casino.jackpot.bet.push(state.inventory[i]);state.inventory.splice(i,1);state.casino.jackpot.bot.push(makeSkin({high:true}));$('#jackInfo').textContent=`You ${m(state.casino.jackpot.bet.reduce((a,b)=>a+b.value,0))} vs Rival ${m(state.casino.jackpot.bot.reduce((a,b)=>a+b.value,0))}`;populateJackSel();save()}
function jackSpin(){const j=state.casino.jackpot;if(!j)return;const y=j.bet.reduce((a,b)=>a+b.value,0),b=j.bot.reduce((a,b)=>a+b.value,0);const chance=y/Math.max(.01,y+b);$('#jackWheel').style.transform=`rotate(${Math.floor(rnd(900,2200))}deg)`;const win=Math.random()<chance;state.stats.games++;if(win){state.inventory.push(...j.bet,...j.bot);state.stats.wins++;$('#casinoOutput').textContent='Jackpot won'}else{state.stats.losses++;$('#casinoOutput').textContent='Jackpot lost'}save()}

function minesBet(b){if(state.money<b)return;state.money-=b;state.casino.mines={bet:b};minesStart()}
function minesStart(){const m=state.casino.mines;if(!m)return;const bombs=Math.max(1,Math.min(20,+$('#bombs').value));m.bombs=bombs;m.mult=1;m.live=true;m.board=Array.from({length:25},()=>false);for(let i=0;i<bombs;i++)m.board[Math.floor(rnd(0,25))]=true;const g=$('#mGrid');g.innerHTML='';for(let i=0;i<25;i++){const b=document.createElement('button');b.className='mine-cell';b.onclick=()=>minePick(i,b);g.appendChild(b)}$('#mMult').textContent='1.00x'}
function minePick(i,btn){const m=state.casino.mines;if(!m?.live)return;if(m.board[i]){btn.classList.add('bomb');btn.textContent='X';m.live=false;state.stats.games++;state.stats.losses++;state.stats.profit-=m.bet;$('#casinoOutput').textContent='Bomb hit';save()}else{btn.classList.add('open');btn.textContent='SAFE';m.mult+=.18+(m.bombs/100);$('#mMult').textContent=`${m.mult.toFixed(2)}x`}}
function minesCash(){const mine=state.casino.mines;if(!mine?.live)return;mine.live=false;const pay=mine.bet*mine.mult;state.money+=pay;state.stats.games++;state.stats.wins++;state.stats.profit+=pay-mine.bet;$('#casinoOutput').textContent=`Mines cashout ${m(pay)}`;save()}

function slots(b){if(state.money<b)return;state.money-=b;const r=['A','K','7','B','C'];let t=0;const spin=setInterval(()=>{['s1','s2','s3'].forEach(id=>{const el=$('#'+id);if(el)el.textContent=r[Math.floor(rnd(0,r.length))]});if(++t>12){clearInterval(spin);const out=['s1','s2','s3'].map(id=>$('#'+id).textContent);let mult=0;if(out[0]===out[1]&&out[1]===out[2])mult=5;else if(out[0]===out[1]||out[1]===out[2]||out[0]===out[2])mult=2;const pay=b*mult;state.money+=pay;state.stats.games++;mult?(state.stats.wins++,state.stats.profit+=pay-b):(state.stats.losses++,state.stats.profit-=b);$('#casinoOutput').textContent=`Slots ${out.join(' ')} -> ${m(pay)}`;save()}},80)}
function plinkoSetup(){const p=$('#pBoard');if(!p)return;p.innerHTML='';for(let r=0;r<7;r++)for(let c=0;c<=r;c++){const d=document.createElement('div');d.className='peg';d.style.left=`${20+c*22+r*8}px`;d.style.top=`${16+r*22}px`;p.appendChild(d)}}
function plinkoDrop(){const b=+$('#betAmount').value;if(state.money<b)return;state.money-=b;const p=$('#pBoard');if(!p)return;const ball=document.createElement('div');ball.className='plinko-ball';p.appendChild(ball);let x=50,y=0;const id=setInterval(()=>{y+=8;x+=Math.random()>.5?6:-6;ball.style.left=`${Math.max(4,Math.min(96,x))}%`;ball.style.top=`${y}px`;if(y>160){clearInterval(id);const mult=[0,.5,1,2,5][Math.floor(rnd(0,5))],pay=b*mult;state.money+=pay;state.stats.games++;mult>=1?(state.stats.wins++,state.stats.profit+=pay-b):(state.stats.losses++,state.stats.profit-=b-pay);$('#casinoOutput').textContent=`Plinko ${mult}x`;save()}},60)}

function drawGraph(){const c=$('#marketGraph');if(!c)return;const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.strokeStyle='#2a3651';x.strokeRect(0,0,c.width,c.height);x.strokeStyle='#cf72ff';x.lineWidth=2;x.beginPath();state.market.forEach((v,i)=>{const px=20+i*(c.width-40)/(state.market.length-1),py=c.height-(v-90)*2;i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke();x.fillStyle='#d2c1ff';x.fillText('Market trend',20,16)}
function renderListings(){const el=$('#marketListings');el.innerHTML=state.listings.map((l,i)=>`<div class='skin-card'><b>${l.name}</b><div>${m(l.price)}</div><small>${l.type}</small><div class='row-wrap'><button onclick='queueAction("buy",${i})'>Buy</button><button onclick='queueAction("bid",${i})'>Bid</button></div></div>`).join('')}
window.queueAction=(t,i)=>{state.pending={t,i};$('#marketLog').innerHTML=`<div>Pending ${t} on ${state.listings[i]?.name||''}</div>`+$('#marketLog').innerHTML}
function confirmMarket(){const p=state.pending;if(!p)return;const l=state.listings[p.i];if(!l)return;const amt=+$('#bidAmount').value||0;if(p.t==='buy'){if(state.money<l.price)return;state.money-=l.price;state.inventory.push(makeSkin({high:l.price>6}));$('#marketLog').innerHTML=`<div>Buy confirmed with animation ✓</div>`+$('#marketLog').innerHTML;state.listings.splice(p.i,1)}else{if(state.money<amt)return;state.money-=amt;const chance=Math.min(.9,Math.max(.1,amt/(l.price+amt)));const spin=Math.floor(rnd(700,1800));$('#marketLog').innerHTML=`<div>Auction wheel spun ${spin}deg...</div>`+$('#marketLog').innerHTML;setTimeout(()=>{if(Math.random()<chance){state.inventory.push(makeSkin({high:true}));state.listings.splice(p.i,1);$('#marketLog').innerHTML=`<div>You won the bid.</div>`+$('#marketLog').innerHTML}else $('#marketLog').innerHTML=`<div>You lost the bid.</div>`+$('#marketLog').innerHTML;save()},800)}state.pending=null;save()}

function render(){
 $('#money').textContent=m(state.money);$('#bankMoney').textContent=m(state.bank);$('#xpLevel').textContent=`${state.xp}/Lv ${state.level}`;$('#rank').textContent=state.rank;$('#loyalty').textContent=String(state.loyalty);
 $('#perClick').textContent=m(state.perClick);$('#streak').textContent=String(state.streak);$('#loyaltyPoints').textContent=String(state.loyalty);
 $('#upgClick').textContent=`Upgrade Click (${m(upgradeCost('click'))})`;$('#upgAuto').textContent=`Auto Click (${m(upgradeCost('auto'))})`;$('#upgLuck').textContent=`Luck (${m(upgradeCost('luck'))})`;
 $('#seasonEvent').textContent=`${state.event} active`;eventFx();
 $('#liveFeed').innerHTML=Array.from({length:10},()=>`<div>${liveLine()}</div>`).join('');
 $('#updateLog').innerHTML=updates.map(x=>`<div>${x}</div>`).join('');
 $('#history').innerHTML=state.history.map(h=>`<div>${h}</div>`).join('');
 const rf=$('#rarityFilter').value,q=$('#searchSkin').value.toLowerCase();let inv=state.inventory.filter(s=>(rf==='all'||s.rarity===rf)&&(`${s.weapon} ${s.pattern}`.toLowerCase().includes(q)));if(state.sortByValue)inv=inv.sort((a,b)=>b.value-a.value);$('#inventoryGrid').innerHTML=inv.map(card).join('');
 $('#databaseGrid').innerHTML=guns.slice(0,120).flatMap(g=>patterns.slice(0,4).map(p=>`<div class='skin-card'><div class='weapon-img'><img src='${weaponImg(g)}'/></div><b>${g} | ${p}</b></div>`)).join('');
 $('#statsList').innerHTML=`<li>Cases opened: ${state.stats.opened}</li><li>Profit/Loss: ${m(state.stats.profit)}</li><li>Best item: ${m(state.stats.highest)}</li><li>Games: ${state.stats.games} (W ${state.stats.wins}/L ${state.stats.losses})</li>`;
 $('#caseList').innerHTML=cases.map(c=>`<div class='skin-card ${c.high?'event-border':''}'><div class='case-thumb'><img src='${caseImg(c.name)}'/></div><b>${c.name}</b><div>${m(c.price)}</div><small>CS-style odds</small><button onclick='openCase("${c.name}",+document.getElementById("openCount").value||1)'>Open</button></div>`).join('');
 $('#battleCase').innerHTML=cases.map(c=>`<option>${c.name}</option>`).join('');
 renderListings();drawGraph();updateAdmin();renderBj();if($('#gameSelect'))gameUI();
}
function updateAdmin(){const ok=state.user==='d3vi0us';$('#adminTabBtn').classList.toggle('hidden',!ok);$('#admin').classList.toggle('hidden',!ok)}

setInterval(()=>{state.money+=state.auto*state.perClick;const t=state.market.at(-1)+rnd(-1.8,2.2);state.market.push(Math.max(90,Math.min(130,t)));state.market=state.market.slice(-45);if(Math.random()>.83)state.listings.unshift({name:`${guns[Math.floor(rnd(0,guns.length))]} | ${patterns[Math.floor(rnd(0,patterns.length))]}`,price:+rnd(1.5,22).toFixed(2),type:Math.random()>.5?'listing':'auction'});state.listings=state.listings.slice(0,18);state.eventTick++;if(state.eventTick>35){state.eventTick=0;randomEvent()}crashTick();save()},3000);

$('#tabs').addEventListener('click',e=>{if(e.target.tagName!=='BUTTON'||e.target.classList.contains('hidden'))return;$$('#tabs button').forEach(b=>b.classList.remove('active'));e.target.classList.add('active');$$('.tab-panel').forEach(t=>t.classList.remove('active'));$(`#${e.target.dataset.tab}`).classList.add('active')});
$('#gameSelect').onchange=gameUI;$('#playGame').onclick=playGame;
$('#moneyClick').onclick=()=>{state.money+=state.perClick;state.xp+=1.5;state.streak++;state.loyalty++;levelUp();save()}
$$('.upgrade').forEach(b=>b.onclick=()=>{const k=b.dataset.upg,c=upgradeCost(k);if(state.money<c)return;state.money-=c;if(k==='click')state.perClick+=.2;if(k==='auto')state.auto+=.1;if(k==='luck')state.luck+=.04;save()})
$('#claimDaily').onclick=()=>{if(state.lastDaily===today())return alert('Daily already claimed');state.lastDaily=today();state.money+=5;state.xp+=8;pushHistory('Daily reward claimed');save()}
$('#dailyWheel').onclick=()=>{if(state.lastWheel===today())return alert('Wheel used today');state.lastWheel=today();const p=[2,5,8,12,20][Math.floor(rnd(0,5))];state.money+=p;pushHistory(`Daily wheel: ${m(p)}`);save()}
$('#rebirthBtn').onclick=()=>{if(state.level<15)return alert('Need level 15');state.level=1;state.xp=0;state.perClick=1.2;state.luck+=.2;state.money+=50;save()}
$('#claimStreak').onclick=()=>{const b=state.streak*.15;state.money+=b;state.streak=0;save()}
$('#redeemLoyalty').onclick=()=>{if(state.loyalty<100)return;state.loyalty-=100;state.money+=8;save()}
$('#sortValue').onclick=()=>{state.sortByValue=!state.sortByValue;save()};$('#rarityFilter').onchange=render;$('#searchSkin').oninput=render;
$('#startBattle').onclick=()=>{const c=cases.find(x=>x.name===$('#battleCase').value);if(!c||state.money<c.price)return;state.money-=c.price;$('#battleAnimation').innerHTML=`<div class='roll-track'>${Array.from({length:8},()=>`<div class='skin-card'><div class='weapon-img'><img src='${weaponImg(guns[Math.floor(rnd(0,guns.length))])}'/></div></div>`).join('')}</div>`;setTimeout(()=>{const y=makeSkin(c),o=makeSkin(c),win=y.value>=o.value;if(win)state.money+=y.value+o.value;state.inventory.push(y);$('#battleOutput').textContent=`${$('#battleMode').value}: ${win?'Win':'Loss'} ${m(y.value)} vs ${m(o.value)}`;save()},900)}
$('#confirmMarket').onclick=confirmMarket;
$('#exportData').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));a.download='neoncase-save.json';a.click()};$('#importData').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{Object.assign(state,JSON.parse(r.result));save()}catch{alert('invalid save')}};r.readAsText(f)};$('.import-label').onclick=()=>$('#importData').click();
$('#openAuth').onclick=()=>$('#authModal').showModal();$('#closeAuth').onclick=()=>$('#authModal').close();$('#signup').onclick=()=>{state.user=$('#username').value.trim();$('#authStatus').textContent=`Signed up as ${state.user}`;save()};$('#login').onclick=()=>{const u=$('#username').value.trim();if(!u)return;state.user=u;$('#authStatus').textContent=`Logged in as ${u}`;save()};$('#logout').onclick=()=>{state.user=null;$('#authStatus').textContent='Logged out';save()};
$('#spawnItem').onclick=()=>{if(state.user!=='d3vi0us')return;state.inventory.push(makeSkin({high:true}));save()};$('#boostEconomy').onclick=()=>{if(state.user!=='d3vi0us')return;state.market=state.market.map(v=>v*1.05);save()};$('#grantCash').onclick=()=>{if(state.user!=='d3vi0us')return;state.money+=100;save()};
$('#themeToggle').onclick=()=>document.documentElement.classList.toggle('light');

render();
