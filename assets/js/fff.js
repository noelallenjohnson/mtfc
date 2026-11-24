(function(){
var C=window.FFF_RUBRIC||{rows:[]};var R=C.rows.map(function(r){return [r.name,r.about,r.not_yet,r.developing,r.fit]});
var L=C.level_names||["Not yet","Developing","Fit"],box=document.getElementById('rub'),out=document.getElementById('rub-out');if(!box)return;
var sc=R.map(function(){return 0});
R.forEach(function(r,i){var row=document.createElement('div');row.className='rub-row';
 var hd=document.createElement('div');hd.className='rub-head';hd.innerHTML='<b>'+(i+1)+'. '+r[0]+'</b><span>'+r[1]+'</span>';row.appendChild(hd);
 var op=document.createElement('div');op.className='rub-opts';op.setAttribute('role','group');op.setAttribute('aria-label',r[0]);
 [0,1,2].forEach(function(k){var b=document.createElement('button');b.type='button';b.setAttribute('aria-pressed','false');b.innerHTML='<i>'+(k+1)+' · '+L[k]+'</i>'+r[2+k];
  b.addEventListener('click',function(){sc[i]=(sc[i]===k+1)?0:k+1;op.querySelectorAll('button').forEach(function(x,n){x.setAttribute('aria-pressed',String(sc[i]===n+1))});draw()});op.appendChild(b)});
 row.appendChild(op);box.appendChild(row)});
function draw(){var done=sc.filter(function(v){return v>0}).length,tot=sc.reduce(function(a,b){return a+b},0);
 if(!done){out.innerHTML='<b>Your result appears here.</b> '+(C.empty_message||'');return}
 var low=[];sc.forEach(function(v,i){if(v===1)low.push(R[i][0])});var mid=[];sc.forEach(function(v,i){if(v===2)mid.push(R[i][0])});
 var s='<span class="big">'+tot+'</span><b>of '+(done*3)+'</b> across '+done+' of 10 fundamentals scored.';
 if(done===R.length){s+=' '+(tot>=26?C.verdict_fit:tot>=18?C.verdict_developing:C.verdict_start)}
 if(low.length)s+='<ul><li><b>Start here:</b> '+low.join(', ')+'.</li>'+(mid.length?'<li><b>Then strengthen:</b> '+mid.join(', ')+'.</li>':'')+'</ul>';
 else if(mid.length)s+='<ul><li><b>Strengthen:</b> '+mid.join(', ')+'.</li></ul>';
 s+='<br><button type="button" id="rub-reset">Clear</button>';out.innerHTML=s;
 document.getElementById('rub-reset').addEventListener('click',function(){sc=sc.map(function(){return 0});box.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed','false')});draw()})}
draw();
})();
