/* Industry Structure — map animation and the Learn / Baseline / Test controls. Content lives in icf-data.js. */
(function(){
var D=window.MTU_DATA,stage=document.getElementById('stage'),cv=document.getElementById('canvas'),ctx=cv.getContext('2d'),tip=document.getElementById('tip'),map=document.getElementById('map');
var W=0,H=0,CX=0,CY=0,S=1,DPR=Math.min(window.devicePixelRatio||1,2),TILT=.42,RM=1,mobile=false;
var F={},target={};D.forces.forEach(function(f){F[f.id]=f.level;target[f.id]=f.level});
var SUP=[['CLT Producers','Glulam Producers','MPP Producers','Fabricators'],['Forestry','Mills','Fiber / Lumber'],['Adhesives','Tooling / Equip.','R.Estate / Infra','Energy']],DEM=['Investors','Occupants','Political'],objs=[];
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
var coreR=mobile?(28+at*.35)*S:94*S;halo(CX,CY,coreR*(mobile?3.2:1.9),'#ffd166',.08+at/400);halo(CX,CY,coreR*(mobile?1.8:1.35),'#ffd166',.18+at/300);ctx.beginPath();ctx.arc(CX,CY,coreR,0,Math.PI*2);ctx.fillStyle='#000c1f';ctx.fill();ctx.strokeStyle='rgba(255,209,102,'+(.35+at/200)+')';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(CX,CY,coreR,0,Math.PI*2);ctx.stroke();
if(mobile){text('COMMON,',CX,CY-11*S,Math.max(7.5,9*S),'#ffd166','center','middle','600');text('CENTRAL',CX,CY,Math.max(7.5,9*S),'#ffd166','center','middle','600');text('FORCES',CX,CY+11*S,Math.max(7.5,9*S),'#ffd166','center','middle','600')}
else{var ts=Math.max(9.5,12*S),ls=Math.max(8.5,10.5*S);text('COMMON, CENTRAL',CX,CY-42*S,ts,'#ffd166','center','middle','700');text('FORCES',CX,CY-27*S,ts,'#ffd166','center','middle','700');['Rivalries / Collaborations','Concentrations / Econ. Trends','Regulator / Policy'].forEach(function(l,i){text(l,CX,CY-3*S+i*17*S,ls,'#e6f6ff')})}
[['sub','Substitutes','Traditional means · concrete & steel',-1],['ent','Future entrants','Novel building means',1]].forEach(function(b){var a=A[b[0]],pw=F[b[0]]/100,R=(14+pw*22)*S;halo(a.x,a.y,R*2.6,cols[b[0]],.12+pw*.25);ctx.beginPath();ctx.arc(a.x,a.y,R*.55,0,Math.PI*2);ctx.fillStyle=cols[b[0]];ctx.shadowColor=cols[b[0]];ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0;var ty=b[3]<0?a.y-R*.55-(mobile?26:30)*S:a.y+R*.55+(mobile?18:22)*S;text(b[1].toUpperCase(),a.x,ty,Math.max(11,(mobile?15:20)*S),'#fff','center','middle','600');text((mobile?'':b[2]+' · ')+lvl(F[b[0]]).toUpperCase(),a.x,ty+(mobile?15:20)*S,Math.max(9,(mobile?10:12)*S),'#cfe6ff')});
var byC={producers:[],fiber:[],inputs:[],demand:[]};objs.forEach(function(o){o.a+=0.0002*(o.side===-1?-1:1);var p=pos(o.a,o.r,o.side);o.x=p.x;o.y=p.y;byC[o.cid].push(p)});
function bubble(pts,col,pw){if(!pts.length)return null;var mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9;pts.forEach(function(p){mnx=Math.min(mnx,p.x);mxx=Math.max(mxx,p.x);mny=Math.min(mny,p.y);mxy=Math.max(mxy,p.y)});var cx=(mnx+mxx)/2,cy=(mny+mxy)/2,rx=Math.max((mxx-mnx)/2+26*S,24*S),ry=Math.max((mxy-mny)/2+20*S,18*S);ctx.save();ctx.globalAlpha=.1+pw*.12;ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.restore();return{cx:cx,cy:cy,rx:rx,ry:ry}}
var ps=F.sup/100,pd=F.dem/100;bubble(byC.producers,cols.sup,ps);bubble(byC.fiber,cols.sup,ps);bubble(byC.inputs,cols.sup,ps);var bd=bubble(byC.demand,cols.dem,pd);
var supAll=byC.producers.concat(byC.fiber,byC.inputs),mnx=1e9,mxx=-1e9,mny=1e9;supAll.forEach(function(p){mnx=Math.min(mnx,p.x);mxx=Math.max(mxx,p.x);mny=Math.min(mny,p.y)});
A.sup={x:(mnx+mxx)/2,y:(mny+CY)/2};
text('SUPPLY',(mnx+mxx)/2,mny-(mobile?36:24)*S,Math.max(12,(mobile?17:28)*S),'#90D5FF','center','bottom','600');text(lvl(F.sup).toUpperCase()+(mobile?'':' · suppliers\' power'),(mnx+mxx)/2,mny-(mobile?22:6)*S,Math.max(9,(mobile?10:12)*S),'#cfe6ff','center','bottom');
if(bd){A.dem={x:bd.cx,y:bd.cy};if(mobile){text('DEMAND',bd.cx,bd.cy-bd.ry-18*S,Math.max(12,17*S),'#88E788','center','bottom','600');text(lvl(F.dem).toUpperCase(),bd.cx,bd.cy-bd.ry-4*S,Math.max(9,10*S),'#cfe6ff','center','bottom')}else{text('DEMAND',bd.cx+bd.rx+16*S,bd.cy-10*S,Math.max(12,28*S),'#88E788','left','middle','600');text(lvl(F.dem).toUpperCase()+' · buyers\' power',bd.cx+bd.rx+16*S,bd.cy+12*S,Math.max(9,12*S),'#cfe6ff','left','middle')}text(mobile?'All end users':'The constellation of all end users (TAM)',bd.cx,bd.cy+bd.ry+8*S,Math.max(9.5,12.5*S),'#e6f6ff','center','top','600')}
objs.forEach(function(o){var c=o.side===1?cols.dem:cols.sup;ctx.beginPath();ctx.arc(o.x,o.y,(hover===o?7:5)*S+1,0,Math.PI*2);ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=8;ctx.fill();ctx.shadowBlur=0;text(o.label,o.x,o.y-8*S-4,Math.max(9,(mobile?9:12)*S),'#e6f6ff','center','bottom')});
requestAnimationFrame(frame)}
requestAnimationFrame(frame);
function near(x,y){var best=null,bd=18*S+6;objs.forEach(function(o){var d=Math.hypot(o.x-x,o.y-y);if(d<bd){bd=d;best=o}});return best}
function showTip(o,x,y){if(!o){tip.style.display='none';return}tip.innerHTML='<b>'+o.label+'</b>'+(D.nodes[o.label]||'');tip.style.display='block';var r=stage.getBoundingClientRect(),tx=Math.min(Math.max(x+14,8),r.width-270),ty=Math.min(Math.max(y+14,8),r.height-90);tip.style.left=tx+'px';tip.style.top=ty+'px'}
stage.addEventListener('mousemove',function(e){var r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;hover=near(x,y);stage.style.cursor=hover?'pointer':'default';showTip(hover,x,y)});
stage.addEventListener('mouseleave',function(){hover=null;tip.style.display='none'});
stage.addEventListener('click',function(e){var r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;showTip(near(x,y),x,y)});

/* ---------- parts (A/B/C) ---------- */
var PARTS=['learn','baseline','test'],slots={baseline:document.getElementById('slot-b')};
function show(part){PARTS.forEach(function(p){document.getElementById('part-'+p).classList.toggle('on',p===part)});document.querySelectorAll('.seg button').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-part')===part)});
 if(slots[part]){map.hidden=false;slots[part].appendChild(map)}else{map.hidden=true}
 resize();if(part==='test'&&window.MTU_RADAR)window.MTU_RADAR();if(location.hash.replace('#','')!==part){try{history.replaceState(null,'',location.pathname+location.search+'#'+part)}catch(e){}}
 var seg=document.querySelector('.seg');if(seg&&window.scrollY>segTop())window.scrollTo({top:segTop(),behavior:'auto'})}
function segTop(){var seg=document.querySelector('.seg'),nav=document.querySelector('.site-nav');return seg.getBoundingClientRect().top+window.scrollY-(nav?nav.offsetHeight:0)-4}
document.querySelectorAll('.seg button').forEach(function(b){b.addEventListener('click',function(){show(b.getAttribute('data-part'))})});
document.querySelectorAll('[data-go]').forEach(function(b){b.addEventListener('click',function(){show(b.getAttribute('data-go'));window.scrollTo({top:segTop(),behavior:'auto'})})});
window.addEventListener('hashchange',function(){var h=location.hash.replace('#','');if(PARTS.indexOf(h)>=0)show(h)});

/* ---------- B: baseline cards ---------- */
var bForces=document.getElementById('b-forces'),bl=document.getElementById('b-plbl'),bt=document.getElementById('b-ptitle'),bb=document.getElementById('b-pbody'),cards={};
D.forces.forEach(function(f){var b=document.createElement('button');b.className='fcard';b.type='button';b.innerHTML='<small>'+f.sub+'</small><strong>'+f.name+'</strong><div class="bar"><i style="width:'+f.level+'%"></i></div><em>Power: <b>'+lvl(f.level)+'</b> ('+f.level+')</em>';b.onclick=function(){D.forces.forEach(function(x){cards[x.id].classList.toggle('on',x.id===f.id)});bl.textContent=f.sub;bt.textContent=f.name+' — baseline assessment';bb.innerHTML=f.desc};bForces.appendChild(b);cards[f.id]=b});

/* ---------- C: scenarios ----------
   Choosing a scenario applies its proposed shifts; the reader can then tune each shift.
   The radar shows the scenario's shape over the shaded baseline. Part B's map stays at the baseline. */
var groups=document.getElementById('c-groups'),read=document.getElementById('c-read'),slEl=document.getElementById('c-sliders'),presetBtn=document.getElementById('c-preset'),resetBtn=document.getElementById('c-reset'),radarBox=document.getElementById('slot-c'),sliders={},chips=[],sel=[],shift={},now={},goal={};
var base=Math.round(100-D.forces.reduce(function(s,f){return s+f.level},0)/5);
(function(){var m=document.getElementById('meter');if(m){m.style.width=base+'%';document.getElementById('attr').textContent=base+' · '+(base<40?'Moderate–low':base<55?'Moderate':'High')}})();
var COL={dem:'#3f8f5a',sup:'#3a7ca5',sub:'#c9772e',ent:'#8a63b8',core:'#a67c3d'},ORD=['sub','dem','ent','core','sup'],byId={};
D.forces.forEach(function(f){byId[f.id]=f;shift[f.id]=0;now[f.id]=f.level;goal[f.id]=f.level});
function sign(v){return (v>0?'+':v<0?'−':'')+Math.abs(v)}
function tcase(s){return s.charAt(0)+s.slice(1).toLowerCase()}
/* radar */
var NS='http://www.w3.org/2000/svg',rd=null;
function svgEl(p,t,a,txt){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);if(txt!=null)e.textContent=txt;p.appendChild(e);return e}
function buildRadar(){var w=radarBox.getBoundingClientRect().width;if(!w)return;var small=w<560;if(rd&&rd.small===small)return;radarBox.innerHTML='';
 var VW=small?470:760,VH=small?410:430,cx=VW/2,cy=small?218:226,R=small?104:158,fs=small?15:15,ss=small?12.5:12.5;
 var svg=svgEl(radarBox,'svg',{viewBox:'0 0 '+VW+' '+VH,role:'img','aria-label':'Radar chart: the scenario shape of the five forces over the shaded baseline'});
 function pt(i,v,rr){var a=-Math.PI/2+i*2*Math.PI/5,r=(rr||R)*v/100;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r]}
 [25,50,75,100].forEach(function(g){svgEl(svg,'polygon',{points:ORD.map(function(_,i){return pt(i,g).join(',')}).join(' '),fill:'none',stroke:'#e2ded6','stroke-width':g===100?1.5:1})});
 ORD.forEach(function(_,i){var p=pt(i,100);svgEl(svg,'line',{x1:cx,y1:cy,x2:p[0],y2:p[1],stroke:'#e2ded6'})});
 svgEl(svg,'polygon',{points:ORD.map(function(id,i){return pt(i,byId[id].level).join(',')}).join(' '),fill:'#1a1a18','fill-opacity':.10,stroke:'#8a8578','stroke-width':1.2,'stroke-dasharray':'5 4'});
 var poly=svgEl(svg,'polygon',{fill:'#a67c3d','fill-opacity':.2,stroke:'#a67c3d','stroke-width':2.5,'stroke-linejoin':'round'}),o={};
 ORD.forEach(function(id,i){var p=pt(i,100,R+(small?16:22)),anc=Math.abs(p[0]-cx)<8?'middle':p[0]>cx?'start':'end',up=p[1]<cy-R*.5,ly=up?p[1]-18:p[1]+(Math.abs(p[1]-cy)<R*.5?-6:8);
  var nm=byId[id].name;svgEl(svg,'text',{x:p[0],y:ly,'text-anchor':anc,'font-size':fs,'font-weight':600,fill:'#1a1a18'},nm);
  o[id]={dot:svgEl(svg,'circle',{r:small?5:6,fill:COL[id],stroke:'#fff','stroke-width':2}),lab:svgEl(svg,'text',{x:p[0],y:ly+ss+5,'text-anchor':anc,'font-size':ss,'font-weight':600,fill:COL[id]})}});
 svgEl(svg,'text',{x:small?10:16,y:small?18:26,'font-size':small?10:11,'letter-spacing':1.5,'font-weight':600,fill:'#666460'},'ATTRACTIVENESS');
 var an=svgEl(svg,'text',{x:small?10:16,y:small?44:56,'font-size':small?24:28,'font-weight':700,fill:'#1a1a18'}),ad=svgEl(svg,'text',{x:small?10:16,y:small?62:76,'font-size':small?11:12,fill:'#666460'});
 svgEl(svg,'rect',{x:VW-(small?150:176),y:VH-(small?20:24),width:14,height:10,fill:'#1a1a18','fill-opacity':.10,stroke:'#8a8578','stroke-dasharray':'3 2'});
 svgEl(svg,'text',{x:VW-(small?130:156),y:VH-(small?11:15),'font-size':small?10.5:11.5,fill:'#666460'},'shaded shape = baseline');
 rd={small:small,poly:poly,o:o,pt:pt,an:an,ad:ad};drawRadar()}
function drawRadar(){if(!rd)return;rd.poly.setAttribute('points',ORD.map(function(id,i){return rd.pt(i,now[id]).join(',')}).join(' '));
 var s=0;ORD.forEach(function(id,i){var p=rd.pt(i,now[id]),v=Math.round(now[id]),d=Math.round(goal[id])-byId[id].level;s+=now[id];rd.o[id].dot.setAttribute('cx',p[0]);rd.o[id].dot.setAttribute('cy',p[1]);rd.o[id].lab.textContent=tcase(lvl(v))+' · '+v+(d?' ('+sign(d)+')':'')});
 var at=Math.round(100-s/5),gd=Math.round(100-ORD.reduce(function(t,id){return t+goal[id]},0)/5)-base;rd.an.textContent=at;rd.ad.textContent=gd?sign(gd)+' vs. baseline of '+base:'baseline'}
var anim=0;function tick(){var moving=false;ORD.forEach(function(id){var d=goal[id]-now[id];if(Math.abs(d)>.3){now[id]+=d*.14;moving=true}else now[id]=goal[id]});drawRadar();anim=moving?requestAnimationFrame(tick):0}
window.MTU_RADAR=buildRadar;window.addEventListener('resize',function(){if(radarBox.offsetParent)buildRadar()},{passive:true});
/* controls */
D.forces.forEach(function(f){
 var g=document.createElement('div');g.className='sgroup';g.innerHTML='<div class="name">'+f.name+'<small>'+f.sub+'</small></div><div class="chips"></div>';var ch=g.querySelector('.chips');
 D.scenarios.filter(function(s){return s.f===f.id}).forEach(function(s){var c=document.createElement('button');c.type='button';c.className='chip';c.textContent=s.t;c.setAttribute('aria-pressed','false');c.onclick=function(){toggle(s,c)};ch.appendChild(c);chips.push(c)});groups.appendChild(g);
 var row=document.createElement('div');row.className='sl';row.innerHTML='<label for="s-'+f.id+'">'+f.name+'</label><input id="s-'+f.id+'" type="range" min="-100" max="100" step="5" value="0"><span></span>';slEl.appendChild(row);
 var inp=row.querySelector('input');sliders[f.id]={inp:inp,out:row.querySelector('span')};
 inp.oninput=function(){shift[f.id]=+inp.value;refresh()}});
function combined(){var d={};sel.forEach(function(s){for(var k in s.d)d[k]=(d[k]||0)+s.d[k]});return d}
function refresh(){var tuned=false,pre=combined();
 D.forces.forEach(function(f){goal[f.id]=Math.max(0,Math.min(100,f.level+shift[f.id]));sliders[f.id].inp.value=shift[f.id];sliders[f.id].out.innerHTML='<b>'+sign(shift[f.id])+'</b> → '+goal[f.id];if(sel.length&&shift[f.id]!==(pre[f.id]||0))tuned=true});
 presetBtn.hidden=!(sel.length&&tuned);resetBtn.hidden=!sel.length;if(!anim)anim=requestAnimationFrame(tick)}
function setShifts(d){D.forces.forEach(function(f){shift[f.id]=Math.max(-100,Math.min(100,(d&&d[f.id])||0))})}
function shiftsText(d){return D.forces.filter(function(f){return d[f.id]}).map(function(f){return '<b>'+f.name+'</b> '+sign(d[f.id])}).join(' · ')||'none'}
function render(){if(!sel.length){read.className='read';read.innerHTML='';slEl.hidden=true;return}
 var h='';if(sel.length>1)h+='<p class="lbl">'+sel.length+' scenarios combined</p><p class="delta combined">Combined proposed shifts from baseline: '+shiftsText(combined())+'</p>';
 sel.forEach(function(s){h+='<div class="scn"><p class="lbl">Scenario</p><h4>'+s.t+'</h4><p class="inshort">'+s.s+'</p><p class="delta">Proposed shifts from baseline: '+shiftsText(s.d)+'</p><p>'+s.m+'</p></div>'});
 read.innerHTML=h;read.className='read show';slEl.hidden=false}
function toggle(s,chip){var i=sel.indexOf(s);if(i>=0){sel.splice(i,1);chip.classList.remove('on');chip.setAttribute('aria-pressed','false')}else{sel.push(s);chip.classList.add('on');chip.setAttribute('aria-pressed','true')}
 setShifts(combined());render();refresh()}
presetBtn.onclick=function(){setShifts(combined());refresh()};
resetBtn.onclick=function(){sel=[];setShifts(null);chips.forEach(function(c){c.classList.remove('on');c.setAttribute('aria-pressed','false')});render();refresh()};
refresh();
var h=location.hash.replace('#','');show(PARTS.indexOf(h)>=0?h:'learn');
})();
