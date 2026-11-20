/* Industry Structure — map animation and the Learn / Baseline / Test controls. Content lives in icf-data.js. */
(function(){
var D=window.MTU_DATA,stage=document.getElementById('stage'),cv=document.getElementById('canvas'),ctx=cv.getContext('2d'),tip=document.getElementById('tip'),map=document.getElementById('map');
var W=0,H=0,CX=0,CY=0,S=1,DPR=Math.min(window.devicePixelRatio||1,2),TILT=.42,RM=1,mobile=false;
var F={},target={};D.forces.forEach(function(f){F[f.id]=f.level;target[f.id]=f.level});
var SUP=[['CLT Producers','Glulam Producers','MPP Producers','Fabricators'],['Forestry','Mills','Fiber / Lumber'],['Adhesives','Tooling / Equip.','R.Estate / Infra','Energy']],DEM=['Investors','End Users','Political'],objs=[];
function add(labels,side,baseR,rStep,a0,aStep,cid){labels.forEach(function(l,i){objs.push({label:l,side:side,r:baseR+i*rStep,a:a0+i*aStep,cid:cid})})}
add(SUP[0],-1,175,14,-Math.PI/8,Math.PI/10,'producers');add(SUP[1],-1,320,18,Math.PI/10,Math.PI/7.5,'fiber');add(SUP[2],-1,455,10,Math.PI/6,Math.PI/16,'inputs');add(DEM,1,215,0,-Math.PI/10,Math.PI/5,'demand');
function resize(){var r=stage.getBoundingClientRect();if(!r.width)return;W=r.width;H=r.height;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);mobile=W<620;CX=W/2+(mobile?24:0);CY=H/2;S=Math.min(W/1100,H/690);RM=1;TILT=.42;if(mobile){S=Math.min(W/420,H/560);RM=.46;TILT=.6}}
window.addEventListener('resize',resize,{passive:true});
var parts=[];for(var i=0;i<140;i++)parts.push({t:Math.random(),k:i%5,j:Math.random()});
function pos(a,r,side){return{x:CX+Math.cos(a)*r*S*RM*side,y:CY+Math.sin(a)*r*S*RM*TILT}}
function lvl(v){return v>=67?'High':v>=40?'Medium':'Low'}
function attract(){var s=0;for(var k in F)s+=F[k];return Math.round(100-s/5)}
function anchors(){var ry=mobile?H*.34:250*S;return{sub:{x:CX,y:CY-ry},ent:{x:CX,y:CY+ry},core:{x:CX,y:CY},sup:{x:CX-(mobile?110:420)*S,y:CY-(mobile?20:30)*S},dem:{x:CX+(mobile?120:330)*S,y:CY-10*S}}}
function halo(x,y,r,col,alpha){var g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col+Math.round(alpha*255).toString(16).padStart(2,'0'));g.addColorStop(1,col+'00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
function text(t,x,y,size,col,align,base,weight){ctx.font=(weight||'500')+' '+size+'px Inter, system-ui, Arial, sans-serif';ctx.textAlign=align||'center';ctx.textBaseline=base||'middle';ctx.fillStyle=col;ctx.fillText(t,x,y)}
var tt=0,hover=null,cols={sub:'#ff9f5a',ent:'#c58cff',sup:'#4cc9ff',dem:'#4cff88'},ids=['sub','ent','sup','dem'];
function frame(){tt+=1;for(var k in F)F[k]+=(target[k]-F[k])*.04;
if(!W){requestAnimationFrame(frame);return}
ctx.clearRect(0,0,W,H);var A=anchors(),at=attract();
var seen={};objs.forEach(function(o){if(seen[o.r])return;seen[o.r]=1;ctx.beginPath();ctx.ellipse(CX,CY,o.r*S*RM,o.r*S*RM*TILT,0,0,Math.PI*2);ctx.strokeStyle='rgba(17,138,178,.18)';ctx.lineWidth=1;ctx.stroke()});
parts.forEach(function(p){var id=ids[p.k%4],a=A[id],pw=F[id]/100;p.t+=(0.0025+pw*0.009)*(0.7+p.j*.6);if(p.t>1)p.t-=1;var x=a.x+(CX-a.x)*p.t,y=a.y+(CY-a.y)*p.t,sp=(1-p.t)*8*S;x+=Math.sin(p.j*20+tt*.02)*sp;y+=Math.cos(p.j*17+tt*.02)*sp*.6;if(p.j>pw+.15)return;ctx.globalAlpha=.75*(1-p.t)*(.3+pw);ctx.fillStyle=cols[id];ctx.beginPath();ctx.arc(x,y,1.6*S+1,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1});
var coreR=(28+at*.35)*S;halo(CX,CY,coreR*3.2,'#ffd166',.08+at/400);halo(CX,CY,coreR*1.8,'#ffd166',.18+at/300);ctx.beginPath();ctx.arc(CX,CY,coreR,0,Math.PI*2);ctx.fillStyle='#001d3d';ctx.fill();ctx.beginPath();ctx.arc(CX,CY,coreR*.62,0,Math.PI*2);ctx.fillStyle='#000814';ctx.fill();ctx.strokeStyle='rgba(255,209,102,'+(.35+at/200)+')';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(CX,CY,coreR,0,Math.PI*2);ctx.stroke();
text('MASS TIMBER',CX,CY-6*S,Math.max(9,10*S),'#ffd166','center','middle','600');text('industry core',CX,CY+7*S,Math.max(8,9*S),'#cfe6ff');
[['sub','Substitutes','Traditional means · concrete & steel',-1],['ent','Future entrants','Novel building means',1]].forEach(function(b){var a=A[b[0]],pw=F[b[0]]/100,R=(14+pw*22)*S;halo(a.x,a.y,R*2.6,cols[b[0]],.12+pw*.25);ctx.beginPath();ctx.arc(a.x,a.y,R*.55,0,Math.PI*2);ctx.fillStyle=cols[b[0]];ctx.shadowColor=cols[b[0]];ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0;var ty=b[3]<0?a.y-R*.55-(mobile?26:30)*S:a.y+R*.55+(mobile?18:22)*S;text(b[1].toUpperCase(),a.x,ty,Math.max(11,(mobile?15:20)*S),'#fff','center','middle','600');text((mobile?'':b[2]+' · ')+lvl(F[b[0]]).toUpperCase(),a.x,ty+(mobile?15:20)*S,Math.max(9,(mobile?10:12)*S),'#cfe6ff')});
var byC={producers:[],fiber:[],inputs:[],demand:[]};objs.forEach(function(o){o.a+=0.0005*(o.side===-1?-1:1);var p=pos(o.a,o.r,o.side);o.x=p.x;o.y=p.y;byC[o.cid].push(p)});
function bubble(pts,col,pw){if(!pts.length)return null;var mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9;pts.forEach(function(p){mnx=Math.min(mnx,p.x);mxx=Math.max(mxx,p.x);mny=Math.min(mny,p.y);mxy=Math.max(mxy,p.y)});var cx=(mnx+mxx)/2,cy=(mny+mxy)/2,rx=Math.max((mxx-mnx)/2+26*S,24*S),ry=Math.max((mxy-mny)/2+20*S,18*S);ctx.save();ctx.globalAlpha=.1+pw*.12;ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.restore();return{cx:cx,cy:cy,rx:rx,ry:ry}}
var ps=F.sup/100,pd=F.dem/100;bubble(byC.producers,cols.sup,ps);bubble(byC.fiber,cols.sup,ps);bubble(byC.inputs,cols.sup,ps);var bd=bubble(byC.demand,cols.dem,pd);
var supAll=byC.producers.concat(byC.fiber,byC.inputs),mnx=1e9,mxx=-1e9,mny=1e9;supAll.forEach(function(p){mnx=Math.min(mnx,p.x);mxx=Math.max(mxx,p.x);mny=Math.min(mny,p.y)});
A.sup={x:(mnx+mxx)/2,y:(mny+CY)/2};
text('SUPPLY',(mnx+mxx)/2,mny-(mobile?36:24)*S,Math.max(12,(mobile?17:28)*S),'#90D5FF','center','bottom','600');text(lvl(F.sup).toUpperCase()+(mobile?'':' · suppliers\' power'),(mnx+mxx)/2,mny-(mobile?22:6)*S,Math.max(9,(mobile?10:12)*S),'#cfe6ff','center','bottom');
if(bd){A.dem={x:bd.cx,y:bd.cy};if(mobile){text('DEMAND',bd.cx,bd.cy-bd.ry-18*S,Math.max(12,17*S),'#88E788','center','bottom','600');text(lvl(F.dem).toUpperCase(),bd.cx,bd.cy-bd.ry-4*S,Math.max(9,10*S),'#cfe6ff','center','bottom')}else{text('DEMAND',bd.cx+bd.rx+16*S,bd.cy-10*S,Math.max(12,28*S),'#88E788','left','middle','600');text(lvl(F.dem).toUpperCase()+' · buyers\' power',bd.cx+bd.rx+16*S,bd.cy+12*S,Math.max(9,12*S),'#cfe6ff','left','middle')}text('TAM',bd.cx,bd.cy+bd.ry+8*S,Math.max(10,14*S),'#e6f6ff','center','top','600')}
objs.forEach(function(o){var c=o.side===1?cols.dem:cols.sup;ctx.beginPath();ctx.arc(o.x,o.y,(hover===o?7:5)*S+1,0,Math.PI*2);ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=8;ctx.fill();ctx.shadowBlur=0;text(o.label,o.x,o.y-8*S-4,Math.max(9,(mobile?9:12)*S),'#e6f6ff','center','bottom')});
requestAnimationFrame(frame)}
requestAnimationFrame(frame);
function near(x,y){var best=null,bd=18*S+6;objs.forEach(function(o){var d=Math.hypot(o.x-x,o.y-y);if(d<bd){bd=d;best=o}});return best}
function showTip(o,x,y){if(!o){tip.style.display='none';return}tip.innerHTML='<b>'+o.label+'</b>'+(D.nodes[o.label]||'');tip.style.display='block';var r=stage.getBoundingClientRect(),tx=Math.min(Math.max(x+14,8),r.width-270),ty=Math.min(Math.max(y+14,8),r.height-90);tip.style.left=tx+'px';tip.style.top=ty+'px'}
stage.addEventListener('mousemove',function(e){var r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;hover=near(x,y);stage.style.cursor=hover?'pointer':'default';showTip(hover,x,y)});
stage.addEventListener('mouseleave',function(){hover=null;tip.style.display='none'});
stage.addEventListener('click',function(e){var r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;showTip(near(x,y),x,y)});

/* ---------- parts (A/B/C) ---------- */
var PARTS=['learn','baseline','test'],slots={baseline:document.getElementById('slot-b'),test:document.getElementById('slot-c')};
function show(part){PARTS.forEach(function(p){document.getElementById('part-'+p).classList.toggle('on',p===part)});document.querySelectorAll('.seg button').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-part')===part)});
 if(slots[part]){map.hidden=false;slots[part].appendChild(map)}else{map.hidden=true}
 resize();if(location.hash.replace('#','')!==part){try{history.replaceState(null,'',location.pathname+location.search+'#'+part)}catch(e){}}
 var seg=document.querySelector('.seg');if(seg&&window.scrollY>segTop())window.scrollTo({top:segTop(),behavior:'auto'})}
function segTop(){var seg=document.querySelector('.seg'),nav=document.querySelector('.site-nav');return seg.getBoundingClientRect().top+window.scrollY-(nav?nav.offsetHeight:0)-4}
document.querySelectorAll('.seg button').forEach(function(b){b.addEventListener('click',function(){show(b.getAttribute('data-part'))})});
document.querySelectorAll('[data-go]').forEach(function(b){b.addEventListener('click',function(){show(b.getAttribute('data-go'));window.scrollTo({top:segTop(),behavior:'auto'})})});
window.addEventListener('hashchange',function(){var h=location.hash.replace('#','');if(PARTS.indexOf(h)>=0)show(h)});

/* ---------- B: baseline cards ---------- */
var bForces=document.getElementById('b-forces'),bl=document.getElementById('b-plbl'),bt=document.getElementById('b-ptitle'),bb=document.getElementById('b-pbody'),cards={};
D.forces.forEach(function(f){var b=document.createElement('button');b.className='fcard';b.type='button';b.innerHTML='<small>'+f.sub+'</small><strong>'+f.name+'</strong><div class="bar"><i style="width:'+f.level+'%"></i></div><em>Power: <b>'+lvl(f.level)+'</b> ('+f.level+')</em>';b.onclick=function(){D.forces.forEach(function(x){cards[x.id].classList.toggle('on',x.id===f.id)});bl.textContent=f.sub;bt.textContent=f.name+' — Phase 1 characterization';bb.innerHTML=f.desc};bForces.appendChild(b);cards[f.id]=b});

/* ---------- C: scenarios ---------- */
var groups=document.getElementById('c-groups'),read=document.getElementById('c-read'),empty=document.getElementById('c-empty'),meter=document.getElementById('meter'),attrEl=document.getElementById('attr'),dEl=document.getElementById('attr-delta'),slEl=document.getElementById('c-sliders'),sliders={},chips=[];
var base=Math.round(100-D.forces.reduce(function(s,f){return s+f.level},0)/5);
D.forces.forEach(function(f){var g=document.createElement('div');g.className='sgroup';g.innerHTML='<div class="name">'+f.name+'<small>'+f.sub+'</small></div><div class="chips"></div>';var ch=g.querySelector('.chips');D.scenarios.filter(function(s){return s.f===f.id}).forEach(function(s){var c=document.createElement('button');c.type='button';c.className='chip';c.textContent=s.t;c.onclick=function(){apply(s,c)};ch.appendChild(c);chips.push(c)});groups.appendChild(g);
 var row=document.createElement('div');row.className='sl';row.innerHTML='<label for="s-'+f.id+'">'+f.name+'</label><input id="s-'+f.id+'" type="range" min="0" max="100" value="'+f.level+'"><span></span>';slEl.appendChild(row);var inp=row.querySelector('input');sliders[f.id]={inp:inp,out:row.querySelector('span')};inp.oninput=function(){target[f.id]=+inp.value;chips.forEach(function(c){c.classList.remove('on')});read.className='read';empty.hidden=false;refresh()}});
function refresh(){var at=Math.round(100-Object.keys(target).reduce(function(s,k){return s+target[k]},0)/5);meter.style.width=at+'%';attrEl.textContent=at+' · '+(at<40?'Moderate–low':at<55?'Moderate':'High');var d=at-base;dEl.textContent=d?('('+(d>0?'+':'')+d+' vs. baseline)'):'(baseline)';D.forces.forEach(function(f){var v=Math.round(target[f.id]);sliders[f.id].inp.value=v;sliders[f.id].out.textContent=v;cards[f.id].querySelector('.bar i').style.width=v+'%';cards[f.id].querySelector('em').innerHTML='Power: <b>'+lvl(v)+'</b> ('+v+')'})}
var names={sub:'Substitutes',dem:'Buyers',core:'Shared forces',sup:'Suppliers',ent:'Future entrants'},tagNames={pull:'Demand pull',push:'Supply push',ctl:'Controllable risk',unc:'Uncontrollable risk'};
function apply(s,chip){chips.forEach(function(c){c.classList.remove('on')});chip.classList.add('on');D.forces.forEach(function(f){target[f.id]=f.level});Object.keys(s.d).forEach(function(k){target[k]=Math.max(0,Math.min(100,target[k]+s.d[k]))});
 var delta=Object.keys(s.d).map(function(k){return '<b>'+names[k]+'</b> '+(s.d[k]>0?'+':'')+s.d[k]}).join(' · ');
 read.innerHTML='<div class="tags">'+s.tags.map(function(t){return '<span class="tag '+t+'">'+tagNames[t]+'</span>'}).join('')+'</div><h4>What if '+s.t.charAt(0).toLowerCase()+s.t.slice(1)+'?</h4><p class="delta">Force shifts from baseline: '+delta+'</p><p class="lbl">What changes</p><p>'+s.m+'</p><p class="lbl">Who gains power</p><p>'+s.w+'</p><p class="lbl">What it means for capital flows</p><p>'+s.c+'</p>';
 read.className='read show';empty.hidden=true;refresh()}
document.getElementById('c-reset').onclick=function(){D.forces.forEach(function(f){target[f.id]=f.level});chips.forEach(function(c){c.classList.remove('on')});read.className='read';empty.hidden=false;refresh()};
refresh();
var h=location.hash.replace('#','');show(PARTS.indexOf(h)>=0?h:'learn');
})();
