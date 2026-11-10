(() => {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const distanceEl = $('distance'), coinEl = $('coinCount'), bestEl = $('bestScore');
  const overlay = $('overlay'), playButton = $('playButton'), laneHint = $('laneHint'), toast = $('toast');
  const state = { running:false, over:false, lane:0, visualLane:0, distance:0, coins:0, speed:0.31, time:0, spawn:0, objects:[], jump:0, slide:0, shake:0, sound:true, best:Number(localStorage.getItem('neonRunBest')||0), last:0 };
  let W=0,H=0,dpr=1, toastTimer, audioCtx;
  const rand=(a,b)=>a+Math.random()*(b-a), clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const resize=()=>{ const r=canvas.getBoundingClientRect(); dpr=Math.min(devicePixelRatio||1,2); W=r.width; H=r.height; canvas.width=Math.round(W*dpr); canvas.height=Math.round(H*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); };
  new ResizeObserver(resize).observe(canvas); resize();
  bestEl.innerHTML=String(state.best).padStart(4,'0')+' <small>M</small>';
  function beep(freq=520,dur=.07,type='sine'){ if(!state.sound)return; try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)(); const o=audioCtx.createOscillator(),g=audioCtx.createGain(); o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.035,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur)}catch(e){} }
  function notify(text){toast.textContent=text;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),900)}
  $('soundButton').addEventListener('click',()=>{state.sound=!state.sound;$('soundIcon').textContent=state.sound?'♫':'×';if(state.sound)beep()});
  function start(){ state.running=true;state.over=false;state.lane=0;state.visualLane=0;state.distance=0;state.coins=0;state.speed=.31;state.time=0;state.spawn=.5;state.objects=[];state.jump=state.slide=0;state.shake=0; overlay.classList.add('hidden');laneHint.style.opacity='.76';distanceEl.textContent='0000';coinEl.textContent='00'; beep(660,.1); }
  playButton.addEventListener('click',start);
  function gameOver(){state.running=false;state.over=true;state.shake=.4;beep(120,.25,'sawtooth');laneHint.style.opacity='0';if(state.distance>state.best){state.best=Math.floor(state.distance);localStorage.setItem('neonRunBest',state.best);bestEl.innerHTML=String(state.best).padStart(4,'0')+' <small>M</small>'}setTimeout(()=>{overlay.classList.remove('hidden');$('overlayCard').innerHTML=`<div class="card-kicker"><span class="kicker-line"></span> RUN ENDED <span class="kicker-line"></span></div><h1>SO CLOSE.<br><em>AGAIN?</em></h1><p class="intro-copy">You made it <b style="color:#d5fd62">${Math.floor(state.distance)}m</b> and collected <b style="color:#d5fd62">${state.coins}</b> glow chips.</p><button class="play-button" id="playButton"><span>RUN IT BACK</span><span class="play-arrow">↗</span></button><div class="controls-row"><span><kbd>←</kbd><kbd>→</kbd> MOVE</span><i></i><span><kbd>↑</kbd> JUMP</span><i></i><span><kbd>↓</kbd> SLIDE</span></div>`; $('playButton').addEventListener('click',start);},330); }
  function move(dir){if(!state.running)return;state.lane=clamp(state.lane+dir,-1,1);beep(270+state.lane*75,.04);laneHint.style.opacity='0'}
  function action(key){if(key==='ArrowLeft'||key==='a'||key==='A')move(-1);else if(key==='ArrowRight'||key==='d'||key==='D')move(1);else if((key==='ArrowUp'||key==='w'||key==='W'||key===' ')&&state.running){if(state.jump<=0.03){state.jump=.78;state.slide=0;beep(450,.08)}}else if((key==='ArrowDown'||key==='s'||key==='S')&&state.running){state.slide=.65;state.jump=0;beep(190,.06)}}
  window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();if(e.key==='Enter'&&!state.running){start();return}action(e.key)});
  let touch=null;canvas.addEventListener('touchstart',e=>{const t=e.changedTouches[0];touch=[t.clientX,t.clientY]}, {passive:true});canvas.addEventListener('touchend',e=>{if(!touch)return;const t=e.changedTouches[0],dx=t.clientX-touch[0],dy=t.clientY-touch[1];if(Math.max(Math.abs(dx),Math.abs(dy))<18){action('ArrowUp')}else if(Math.abs(dx)>Math.abs(dy))move(dx>0?1:-1);else action(dy<0?'ArrowUp':'ArrowDown');touch=null},{passive:true});
  function project(z){const p=1-clamp(z/100,0,1);return {y:H*.35+p*p*H*.62, scale:.12+p*1.08, center:W*.5+(p-.5)*W*.018, laneW:(W*.22)*(.25+p*.95)}}
  function poly(points,fill,stroke=null,lw=1){ctx.beginPath();points.forEach((v,i)=>i?ctx.lineTo(v[0],v[1]):ctx.moveTo(v[0],v[1]));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}}
  function drawBackground(){
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#10182b');sky.addColorStop(.52,'#39415a');sky.addColorStop(1,'#e28b73');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    // distant moon and city silhouette
    ctx.fillStyle='rgba(255,218,165,.88)';ctx.beginPath();ctx.arc(W*.76,H*.19,Math.min(W,H)*.055,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(245,179,128,.2)';ctx.beginPath();ctx.arc(W*.76,H*.19,Math.min(W,H)*.074,0,Math.PI*2);ctx.fill();
    for(let i=0;i<18;i++){const x=i*W/17, bh=H*(.07+((i*37)%9)/100), y=H*.49-bh;ctx.fillStyle=i%2?'#20283d':'#242c42';ctx.fillRect(x,y,W/22,bh);for(let wy=y+10;wy<H*.47;wy+=13)for(let wx=x+7;wx<x+W/22-4;wx+=10){ctx.fillStyle=((i*3+Math.floor(wy))%4===0)?'rgba(255,196,126,.38)':'rgba(107,158,183,.22)';ctx.fillRect(wx,wy,3,4)}}
    const horizon=H*.48;ctx.fillStyle='#242737';ctx.fillRect(0,horizon,W,H-horizon);
    // track shoulders
    const p0=project(100), p1=project(0), c=p1.center, far=p0.center;
    poly([[far-p0.laneW*1.5,p0.y],[far+p0.laneW*1.5,p0.y],[c+p1.laneW*1.52,H],[c-p1.laneW*1.52,H]],'#343847');
    poly([[far-p0.laneW*1.25,p0.y],[far+p0.laneW*1.25,p0.y],[c+p1.laneW*1.25,H],[c-p1.laneW*1.25,H]],'#191d29');
    // rail ties scrolling into perspective
    for(let i=0;i<24;i++){let z=((i*4.4-state.distance*.75)%100+100)%100;let p=project(z), x=p.center, w=p.laneW*1.33;ctx.fillStyle=`rgba(166,127,111,${.17+p.scale*.24})`;ctx.fillRect(x-w,p.y,w*2,Math.max(1,p.scale*5))}
    for(let lane=-1;lane<=1;lane++){let x0=p0.center+lane*p0.laneW*.72,x1=p1.center+lane*p1.laneW*.72;ctx.strokeStyle=lane===0?'#99a5b4':'#99a5b4';ctx.lineWidth=lane===0?2.2:3;ctx.globalAlpha=.72;ctx.beginPath();ctx.moveTo(x0,p0.y);ctx.lineTo(x1,H+10);ctx.stroke();ctx.globalAlpha=1;ctx.strokeStyle='rgba(235,240,242,.23)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0+(lane===0?4:3),p0.y);ctx.lineTo(x1+(lane===0?8:6),H+10);ctx.stroke()}
    // colored edge lights
    for(let i=0;i<12;i++){let z=((i*9-state.distance*1.7)%100+100)%100,p=project(z);for(const s of [-1,1]){const x=p.center+s*p.laneW*1.43;ctx.fillStyle=i%3?'#ed796f':'#a8e7d3';ctx.globalAlpha=.35+p.scale*.5;ctx.beginPath();ctx.ellipse(x,p.y,Math.max(1,p.scale*2),Math.max(1,p.scale*4),0,0,Math.PI*2);ctx.fill()} }ctx.globalAlpha=1;
  }
  function drawCoin(obj,p){const x=p.center+obj.lane*p.laneW*.72,y=p.y, r=Math.max(2,p.scale*7);ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(state.time*7+obj.z)*.25);ctx.fillStyle='#d5fd62';ctx.shadowColor='#d5fd62';ctx.shadowBlur=12*p.scale;ctx.beginPath();ctx.ellipse(0,0,r*.72,r,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#fff4a8';ctx.lineWidth=Math.max(.7,p.scale);ctx.stroke();ctx.restore()}
  function drawObstacle(o,p){const x=p.center+o.lane*p.laneW*.72,s=p.scale,w=p.laneW*.54*s,h=(o.type==='barrier'?24:o.type==='slide'?39:37)*s,y=p.y-h*.55;
    if(o.type==='barrier'){
      ctx.fillStyle='#202835';ctx.fillRect(x-w*.48,y+h*.45,w*.16,h*.55);ctx.fillRect(x+w*.32,y+h*.45,w*.16,h*.55);ctx.fillStyle='#ff765e';ctx.shadowColor='#ff694f';ctx.shadowBlur=12*s;ctx.beginPath();ctx.roundRect(x-w*.62,y,w*1.24,h*.5,4*s);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#f8d1a2';for(let i=-1;i<=1;i++)ctx.fillRect(x+i*w*.34-w*.07,y+h*.07,w*.14,h*.12);
    }else if(o.type==='slide'){
      ctx.fillStyle='#222b3b';ctx.fillRect(x-w*.57,y,w*1.14,h);ctx.fillStyle='#f56d70';ctx.fillRect(x-w*.57,y,w*1.14,h*.17);ctx.fillStyle='#f4bf83';ctx.fillRect(x-w*.45,y+h*.3,w*.9,h*.1);ctx.fillStyle='#141a27';ctx.fillRect(x-w*.7,y+h*.83,w*1.4,h*.17);
    }else{
      ctx.fillStyle='#152a3a';ctx.fillRect(x-w*.64,y,w*1.28,h);ctx.fillStyle='#28536a';ctx.fillRect(x-w*.54,y+h*.09,w*1.08,h*.51);ctx.fillStyle='#9ee0d2';ctx.globalAlpha=.38;ctx.fillRect(x-w*.45,y+h*.16,w*.9,h*.32);ctx.globalAlpha=1;ctx.fillStyle='#ed8f78';ctx.fillRect(x-w*.64,y+h*.68,w*1.28,h*.12);ctx.fillStyle='#111827';ctx.fillRect(x-w*.6,y+h*.89,w*.24,h*.13);ctx.fillRect(x+w*.36,y+h*.89,w*.24,h*.13);
    }
  }
  function drawPlayer(){
    const x=W*.5+(state.visualLane*.19*W), ground=H*.83, jumpY=state.jump>0?Math.sin((.78-state.jump)/.78*Math.PI)*H*.19:0;const slide=state.slide>0;const s=clamp(Math.min(W/750,H/570),.65,1.18);ctx.save();ctx.translate(x,ground-jumpY);ctx.scale(s,s);
    // soft shadow
    ctx.fillStyle='rgba(3,8,16,.3)';ctx.beginPath();ctx.ellipse(0,2,25,7,0,0,Math.PI*2);ctx.fill();
    if(slide){ctx.rotate(-.16);ctx.fillStyle='#f0bd9b';ctx.beginPath();ctx.arc(7,-26,11,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c970a2';ctx.beginPath();ctx.ellipse(-4,-13,22,10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#20283a';ctx.fillRect(-18,-5,18,6);ctx.fillRect(3,-5,20,6);ctx.restore();return}
    const run=Math.sin(state.time*13)*4;
    // ears, upright and expressive
    ctx.save();ctx.translate(3,-89);ctx.rotate(-.08+Math.sin(state.time*8)*.04);ctx.fillStyle='#f4d0bf';ctx.beginPath();ctx.ellipse(-8,-16,7,23,-.2,0,Math.PI*2);ctx.ellipse(8,-17,7,24,.12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e987a8';ctx.beginPath();ctx.ellipse(-8,-17,3.2,15,-.2,0,Math.PI*2);ctx.ellipse(8,-18,3.2,16,.12,0,Math.PI*2);ctx.fill();ctx.restore();
    // legs and stylish trainers
    ctx.strokeStyle='#f0bd9b';ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-5,-28);ctx.lineTo(-8+run,-8);ctx.lineTo(-14+run,-3);ctx.moveTo(5,-28);ctx.lineTo(9-run,-9);ctx.lineTo(16-run,-3);ctx.stroke();ctx.fillStyle='#c9f45d';ctx.beginPath();ctx.ellipse(-15+run,-2,9,4,-.08,0,Math.PI*2);ctx.ellipse(16-run,-2,9,4,.08,0,Math.PI*2);ctx.fill();
    // cropped athletic jacket / overalls silhouette
    ctx.fillStyle='#252e49';ctx.beginPath();ctx.moveTo(-17,-72);ctx.quadraticCurveTo(-22,-64,-16,-43);ctx.lineTo(-12,-27);ctx.quadraticCurveTo(0,-21,14,-28);ctx.lineTo(17,-48);ctx.quadraticCurveTo(23,-65,15,-73);ctx.closePath();ctx.fill();ctx.fillStyle='#cc6e9a';ctx.beginPath();ctx.moveTo(-15,-68);ctx.quadraticCurveTo(0,-77,15,-68);ctx.lineTo(12,-45);ctx.quadraticCurveTo(0,-39,-12,-45);ctx.closePath();ctx.fill();ctx.strokeStyle='#efb1c7';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-69);ctx.lineTo(0,-44);ctx.stroke();
    // arms and baton held at her side (not between legs)
    ctx.strokeStyle='#f0bd9b';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-14,-66);ctx.lineTo(-23,-53+run);ctx.lineTo(-18,-44+run);ctx.moveTo(14,-66);ctx.lineTo(22,-55-run);ctx.lineTo(19,-45-run);ctx.stroke();ctx.strokeStyle='#d5fd62';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(20,-51-run);ctx.lineTo(29,-35-run);ctx.stroke();ctx.fillStyle='#fff2dd';ctx.beginPath();ctx.arc(0,-84,15,0,Math.PI*2);ctx.fill();
    // face
    ctx.fillStyle='#283047';ctx.beginPath();ctx.arc(-5,-85,1.5,0,Math.PI*2);ctx.arc(5,-85,1.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#bc617e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-2,-79);ctx.quadraticCurveTo(0,-77,2,-79);ctx.stroke();ctx.fillStyle='#ef91a7';ctx.beginPath();ctx.arc(-10,-81,2.4,0,Math.PI*2);ctx.arc(10,-81,2.4,0,Math.PI*2);ctx.fill();
    // small jacket collar and zipper
    ctx.fillStyle='#f2d5a4';ctx.beginPath();ctx.moveTo(-5,-72);ctx.lineTo(0,-66);ctx.lineTo(5,-72);ctx.lineTo(1,-61);ctx.closePath();ctx.fill();ctx.restore();
  }
  function spawnGroup(){const lane=Math.floor(rand(0,3))-1,pattern=Math.random();if(pattern<.22){for(let i=0;i<5;i++)state.objects.push({type:'coin',lane,z:78+i*6,hit:false})}else{const type=['barrier','slide','train'][Math.floor(Math.random()*3)];state.objects.push({type,lane,z:88,hit:false});if(Math.random()<.42){let other=lane===0?(Math.random()<.5?-1:1):0;for(let i=0;i<4;i++)state.objects.push({type:'coin',lane:other,z:74+i*6,hit:false})}}}
  function update(dt){state.time+=dt;state.visualLane+=(state.lane-state.visualLane)*Math.min(1,dt*11);if(state.jump>0)state.jump=Math.max(0,state.jump-dt);if(state.slide>0)state.slide=Math.max(0,state.slide-dt);if(state.shake>0)state.shake=Math.max(0,state.shake-dt);if(!state.running)return;state.distance+=dt*(22+state.speed*7);state.speed=Math.min(.59,state.speed+dt*.0014);distanceEl.textContent=String(Math.floor(state.distance)).padStart(4,'0');state.spawn-=dt;if(state.spawn<=0){spawnGroup();state.spawn=rand(.82,1.18)*(1-state.speed*.42)}
    for(const o of state.objects){o.z-=dt*(27+state.speed*35);if(o.z<12&&!o.hit){o.hit=true;if(o.lane===state.lane){if(o.type==='coin'){state.coins++;coinEl.textContent=String(state.coins).padStart(2,'0');beep(770,.07);if(state.coins%5===0)notify('GLOW CHIPS +5')}else if(o.type==='barrier'&&state.jump>.14){/* clean jump */}else if(o.type==='slide'&&state.slide>.08){/* clean slide */}else{gameOver();break}}}}
    state.objects=state.objects.filter(o=>o.z>-8); }
  function render(){ctx.save();if(state.shake>0){ctx.translate(rand(-4,4)*state.shake*4,rand(-3,3)*state.shake*4)}drawBackground();for(const o of state.objects.filter(o=>o.z>0).sort((a,b)=>b.z-a.z)){const p=project(o.z);if(o.type==='coin')drawCoin(o,p);else drawObstacle(o,p)}drawPlayer();ctx.restore();}
  function frame(now){const dt=Math.min(.04,(now-state.last)/1000||0);state.last=now;update(dt);render();requestAnimationFrame(frame)}requestAnimationFrame(frame);
})();
