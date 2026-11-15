(function(){
"use strict";
var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
var $=function(i){return document.getElementById(i)};

/* ---------- 5) Barre de progression ---------- */
var bar=document.createElement("div");
bar.id="prog";bar.setAttribute("aria-hidden","true");
document.body.appendChild(bar);
var tick=false;
function prog(){
 tick=false;
 var h=document.documentElement.scrollHeight-window.innerHeight;
 var r=h>0?Math.min(1,Math.max(0,window.scrollY/h)):0;
 bar.style.transform="scaleX("+r+")";
}
window.addEventListener("scroll",function(){
 if(!tick){tick=true;requestAnimationFrame(prog)}
},{passive:true});
window.addEventListener("resize",prog);
prog();

/* ---------- 3) Bandeau défilant (modifiez les mots ici) ---------- */
var hero=document.querySelector(".hero");
if(hero&&hero.parentNode){
 var words=["Crampons","Maillots","Chaussettes","Protège-tibias","Ballons","Gants","Accessoires"];
 var unit=words.map(function(w){return "<span>"+w+"</span><i>★</i>"}).join("");
 var m=document.createElement("div");
 m.className="marq";m.setAttribute("aria-hidden","true");
 m.innerHTML='<div class="mt"><div class="mg">'+unit+unit+'</div><div class="mg">'+unit+unit+'</div></div>';
 hero.parentNode.insertBefore(m,hero.nextSibling);
}

/* ---------- 1) Apparition au défilement ---------- */
if(!reduce&&"IntersectionObserver"in window){
 var io=new IntersectionObserver(function(es){
  es.forEach(function(e){
   if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}
  });
 },{threshold:.1,rootMargin:"0px 0px -5% 0px"});
 var watch=function(el){
  if(el.dataset.rv)return;
  el.dataset.rv="1";
  var i=Array.prototype.indexOf.call(el.parentNode.children,el);
  el.style.setProperty("--d",(i%6*70)+"ms");
  el.classList.add("rv");
  io.observe(el);
 };
 var scan=function(){
  document.querySelectorAll(".sh,.t,.band-in>*,.box,.search,#cats .cat,#grid .card").forEach(watch);
 };
 scan();
 ["cats","grid"].forEach(function(id){
  var n=$(id);
  if(n)new MutationObserver(scan).observe(n,{childList:true});
 });
}

/* ---------- 4) Panier vivant : la pastille vole vers le panier ---------- */
function fly(btn){
 var cart=$("copen");
 if(!cart||reduce||!btn.animate)return;
 var a=btn.getBoundingClientRect(),b=cart.getBoundingClientRect();
 var x0=a.left+a.width/2,y0=a.top+a.height/2,x1=b.left+b.width/2,y1=b.top+b.height/2;
 var d=document.createElement("div");
 d.className="fly";document.body.appendChild(d);
 var an=d.animate([
  {transform:"translate("+x0+"px,"+y0+"px) scale(1)",opacity:1},
  {transform:"translate("+(x0+(x1-x0)*.5)+"px,"+(y0-70)+"px) scale(1.1)",opacity:1,offset:.4},
  {transform:"translate("+x1+"px,"+y1+"px) scale(.35)",opacity:.9}
 ],{duration:720,easing:"cubic-bezier(.45,.05,.55,.95)"});
 an.onfinish=function(){
  d.remove();
  cart.classList.remove("bump");void cart.offsetWidth;cart.classList.add("bump");
 };
 an.oncancel=function(){d.remove()};
}
document.addEventListener("click",function(e){
 var btn=e.target.closest&&e.target.closest(".card .cd .btn,.vbar .btn");
 if(btn&&btn.textContent.trim()==="Ajouté")fly(btn);
});

var cc=$("ccount");
if(cc&&"MutationObserver"in window){
 new MutationObserver(function(){
  cc.classList.remove("pop");void cc.offsetWidth;cc.classList.add("pop");
 }).observe(cc,{childList:true,characterData:true,subtree:true});
}
})();