/* ---------- Réglages ---------- */
var NUM="2250718878848";
var FIREBASE={
 apiKey:"AIzaSyBB1EGrTvDpkt89QgmYpE1WGsp8XqrrAmI",
 authDomain:"maison-des-pros.firebaseapp.com",
 projectId:"maison-des-pros",
 storageBucket:"maison-des-pros.firebasestorage.app",
 messagingSenderId:"45668146176",
 appId:"1:45668146176:web:14200d75fe51b33b4fcce5"
};
var CATS=["Crampons","Maillots","Chaussettes","Protège-tibias","Ballons","Gants","Accessoires"];
var SUB={"Crampons":"Terrain sec ou synthétique","Maillots":"Clubs et sélections","Chaussettes":"Match et entraînement","Protège-tibias":"Légers et résistants","Ballons":"Match et entraînement","Gants":"Gardien et joueur","Accessoires":"Sacs, brassards, bouteilles"};

/* Articles affichés tant que la base Firebase est vide */
var PRODUITS=[
{id:"d1",cat:"Crampons",nom:"Crampons de football",prix:"",d:"Pour terrain sec ou synthétique.",tailles:["39","40","41","42","43","44"]},
{id:"d2",cat:"Maillots",nom:"Maillot de club",prix:"",d:"Domicile et extérieur.",tailles:["S","M","L","XL"]},
{id:"d3",cat:"Protège-tibias",nom:"Protège-tibias",prix:"",d:"Légers et résistants."},
{id:"d4",cat:"Chaussettes",nom:"Chaussettes de match",prix:"",d:"Montantes, confortables."},
{id:"d5",cat:"Ballons",nom:"Ballon de match",prix:"",d:"Taille 5."},
{id:"d6",cat:"Gants",nom:"Gants de gardien",prix:"",d:"Bonne prise, toutes tailles.",tailles:["7","8","9","10"]}
];

var $=function(i){return document.getElementById(i)};
var cur="Tous";

/* ---------- Photo de profil : rond « MP » si logo.png est absent ---------- */
function avatar(img){
 var d=document.createElement("div");
 d.className="avatar";d.textContent="MP";d.setAttribute("role","img");
 d.setAttribute("aria-label",img.alt||"La Maison Des Pros");
 img.replaceWith(d);
}
document.querySelectorAll("img.lg").forEach(function(img){
 if(img.complete&&img.naturalWidth===0)avatar(img);
 else img.addEventListener("error",function(){avatar(img)},{once:true});
});

/* ---------- Entrée secrète : toucher 5 fois le logo ---------- */
var taps=0,tapTimer=null;
document.addEventListener("click",function(e){
 if(!e.target.closest(".logo"))return;
 taps++;
 clearTimeout(tapTimer);
 tapTimer=setTimeout(function(){taps=0},2000);
 if(taps>=5){
  taps=0;clearTimeout(tapTimer);
  e.preventDefault();
  location.href="admin.html";
 }
});

/* ---------- Menu mobile ---------- */
var mopen=$("mopen"),mnav=$("mnav"),mov=$("mov");
function openMenu(){
 mov.hidden=false;mnav.hidden=false;
 mopen.setAttribute("aria-expanded","true");
 document.body.style.overflow="hidden";
 var f=mnav.querySelector(".ml a");if(f)f.focus();
}
function closeMenu(){
 mov.hidden=true;mnav.hidden=true;
 mopen.setAttribute("aria-expanded","false");
 document.body.style.overflow="";
}
mopen.onclick=openMenu;
$("mclose").onclick=closeMenu;
mov.onclick=closeMenu;
mnav.querySelectorAll("a").forEach(function(a){a.addEventListener("click",closeMenu)});

/* ---------- Chargement : cartes grises animées ---------- */
function skeleton(){
 var g=$("grid");if(!g)return;
 var h="";
 for(var i=0;i<4;i++){
  h+='<div class="skel" aria-hidden="true"><div class="sk-img"></div><div class="sk-b"><i class="sk-l w40"></i><i class="sk-l w80"></i><i class="sk-l w60"></i><i class="sk-btn"></i></div></div>';
 }
 g.innerHTML=h;
 g.setAttribute("aria-busy","true");
}
skeleton();

/* ---------- Firebase (facultatif : le site marche sans, et ne reste jamais bloqué) ---------- */
var A,F,db;
try{
 var snap=await Promise.race([
  (async function(){
   A=await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
   F=await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
   db=F.getFirestore(A.initializeApp(FIREBASE));
   return F.getDocs(F.query(F.collection(db,"produits"),F.orderBy("createdAt","desc")));
  })(),
  new Promise(function(_,rej){setTimeout(function(){rej(new Error("délai dépassé"))},10000)})
 ]);
 if(snap.size>0){
  PRODUITS=snap.docs.map(function(d){return Object.assign({id:d.id},d.data())});
 }
}catch(e){console.warn("Firebase indisponible, articles par défaut affichés.",e)}

/* Tous les prix sont en francs CFA */
function fcfa(n){return Number(n).toLocaleString("fr-FR").replace(/\u202f|\u00a0/g," ")+" FCFA"}
function count(c){return PRODUITS.filter(function(p){return p.cat===c}).length}
function picsOf(p){return p.imgs&&p.imgs.length?p.imgs:(p.img?[p.img]:[])}
function hasP(p){return p.prix!==""&&p.prix!=null}
function priceText(p){return hasP(p)?fcfa(p.prix):"Prix sur demande"}
function isPromo(p){return hasP(p)&&Number(p.ancienPrix)>Number(p.prix)}
function promoPct(p){return Math.round((1-Number(p.prix)/Number(p.ancienPrix))*100)}

/* Une taille par bouton : l'espace, la virgule ou le point-virgule séparent les tailles */
function sizesOf(p){
 var out=[];
 (Array.isArray(p.tailles)?p.tailles:[]).forEach(function(t){
  String(t).split(/[\s,;]+/).forEach(function(s){
   if(s&&out.indexOf(s)<0)out.push(s);
  });
 });
 return out;
}

function fillPrice(el,p){
 el.textContent="";
 el.className=hasP(p)?"px":"px dem";
 if(isPromo(p)){
  el.appendChild(document.createTextNode(fcfa(p.prix)+" "));
  var s=document.createElement("s");s.textContent=fcfa(p.ancienPrix);el.appendChild(s);
 }else{el.textContent=priceText(p)}
}

/* ---------- Choix de la taille ---------- */
var sel={};
function paintSizes(pid){
 document.querySelectorAll(".sizes").forEach(function(box){
  if(box.dataset.pid!==String(pid))return;
  box.querySelectorAll("button").forEach(function(b){
   b.setAttribute("aria-pressed",String(sel[pid]===b.textContent));
  });
 });
}
function fillSizes(box,p,err){
 var list=sizesOf(p);
 box.innerHTML="";
 if(!list.length){box.hidden=true;return}
 box.hidden=false;box.dataset.pid=String(p.id);
 box.setAttribute("role","group");box.setAttribute("aria-label","Choisir une taille");
 list.forEach(function(t){
  var b=document.createElement("button");
  b.type="button";b.textContent=t;
  b.setAttribute("aria-pressed",String(sel[p.id]===t));
  b.onclick=function(){
   sel[p.id]=(sel[p.id]===t?"":t);
   paintSizes(p.id);
   if(err)err.hidden=true;
  };
  box.appendChild(b);
 });
}
function tryAdd(p,err){
 if(p.epuise)return false;
 if(sizesOf(p).length&&!sel[p.id]){
  if(err){err.textContent="Choisissez une taille avant d’ajouter.";err.hidden=false}
  return false;
 }
 addToCart(p,sel[p.id]||"");
 return true;
}
function flash(btn){
 btn.textContent="Ajouté";
 setTimeout(function(){btn.textContent="Ajouter au panier"},1200);
}

/* ---------- Visionneuse : toucher une photo pour l'agrandir ---------- */
var vw=document.createElement("div");
vw.id="viewer";vw.hidden=true;
vw.setAttribute("role","dialog");vw.setAttribute("aria-modal","true");vw.setAttribute("aria-label","Photos de l’article");
vw.innerHTML='<button class="vx" type="button" aria-label="Fermer"><svg width="22" height="22"><use href="#i-x"/></svg></button>'+
 '<div class="vcount"></div>'+
 '<div class="vtrack"></div>'+
 '<button class="vp" type="button" aria-label="Photo précédente">‹</button>'+
 '<button class="vn" type="button" aria-label="Photo suivante">›</button>'+
 '<div class="vopts" hidden><div class="sizes"></div><p class="serr" hidden></p></div>'+
 '<div class="vbar"><div><b></b><span></span></div><button class="btn yel" type="button">Ajouter au panier</button></div>';
document.body.appendChild(vw);

var vtrack=vw.querySelector(".vtrack"),vcount=vw.querySelector(".vcount"),vpics=0;
function vIndex(){return vtrack.clientWidth?Math.round(vtrack.scrollLeft/vtrack.clientWidth):0}
function vUpdate(){vcount.textContent=(vIndex()+1)+" / "+vpics}
function vGo(d){
 var k=Math.max(0,Math.min(vpics-1,vIndex()+d));
 vtrack.scrollTo({left:k*vtrack.clientWidth,behavior:"smooth"});
}
function openViewer(p,pics,start){
 vpics=pics.length;
 vtrack.innerHTML="";
 pics.forEach(function(src,i){
  var s=document.createElement("div");s.className="vs";
  var im=new Image();im.src=src;im.alt=p.nom+(pics.length>1?" – photo "+(i+1):"");
  s.appendChild(im);vtrack.appendChild(s);
 });
 var multi=pics.length>1;
 vcount.hidden=!multi;
 vw.querySelector(".vp").hidden=!multi;
 vw.querySelector(".vn").hidden=!multi;
 vw.querySelector(".vbar b").textContent=p.nom;
 vw.querySelector(".vbar span").textContent=p.epuise?"Épuisé":priceText(p);
 var opts=vw.querySelector(".vopts"),verr=vw.querySelector(".serr");
 verr.hidden=true;
 if(sizesOf(p).length&&!p.epuise){opts.hidden=false;fillSizes(opts.querySelector(".sizes"),p,verr)}
 else{opts.hidden=true}
 var add=vw.querySelector(".vbar .btn");
 if(p.epuise){add.disabled=true;add.textContent="Épuisé"}
 else{
  add.disabled=false;add.textContent="Ajouter au panier";
  add.onclick=function(){if(tryAdd(p,verr))flash(add)};
 }
 vw.hidden=false;
 document.body.style.overflow="hidden";
 vtrack.scrollLeft=(start||0)*vtrack.clientWidth;
 vUpdate();
}
function closeViewer(){
 vw.hidden=true;vtrack.innerHTML="";
 document.body.style.overflow="";
}
vtrack.addEventListener("scroll",vUpdate,{passive:true});
vw.querySelector(".vx").onclick=closeViewer;
vw.querySelector(".vp").onclick=function(){vGo(-1)};
vw.querySelector(".vn").onclick=function(){vGo(1)};
vtrack.addEventListener("click",function(e){if(e.target.tagName!=="IMG")closeViewer()});

/* ---------- Recherche ---------- */
var q="";
var sbox=document.createElement("div");
sbox.className="search";
sbox.innerHTML='<svg class="si" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'+
 '<input id="qin" type="search" placeholder="Rechercher un article (ex : Nike, gants, maillot)" aria-label="Rechercher un article" autocomplete="off" enterkeyhint="search">'+
 '<button type="button" class="qx" aria-label="Effacer la recherche" hidden><svg width="18" height="18"><use href="#i-x"/></svg></button>';
var filEl=$("fil");
filEl.parentNode.insertBefore(sbox,filEl);
var qres=document.createElement("p");
qres.className="qres";qres.hidden=true;
filEl.parentNode.insertBefore(qres,filEl);
var qin=$("qin"),qx=sbox.querySelector(".qx");

function norm(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
function matches(p){
 if(!q)return true;
 var hay=norm([p.nom,p.d,p.cat,sizesOf(p).join(" ")].join(" "));
 return norm(q).split(/\s+/).filter(Boolean).every(function(w){return hay.indexOf(w)>=0});
}
qin.addEventListener("input",function(){
 q=qin.value.trim();
 qx.hidden=!q;
 if(q&&cur!=="Tous")cur="Tous";
 drawCatalogue();
});
qx.onclick=function(){qin.value="";q="";qx.hidden=true;drawCatalogue();qin.focus()};
function setCat(c){
 cur=c;q="";qin.value="";qx.hidden=true;
 drawCatalogue();
}

/* ---------- Catégories ---------- */
function drawCats(){
 var box=$("cats");box.innerHTML="";
 CATS.forEach(function(c){
  var a=document.createElement("a");a.className="cat";a.href="#catalogue";
  var n=count(c);
  a.innerHTML='<div><h3></h3><small></small></div><svg width="20" height="20"><use href="#i-arrow"/></svg>';
  a.querySelector("h3").textContent=c;
  a.querySelector("small").textContent=n>0?n+(n>1?" articles":" article"):SUB[c];
  a.onclick=function(){setCat(c)};
  box.appendChild(a);
 });
}

/* ---------- Catalogue ---------- */
function drawCatalogue(){
 var fil=$("fil");fil.innerHTML="";
 ["Tous"].concat(CATS).forEach(function(c){
  var b=document.createElement("button");
  b.textContent=c;b.setAttribute("aria-pressed",c===cur);
  b.onclick=function(){setCat(c)};
  fil.appendChild(b);
 });
 var grid=$("grid");grid.innerHTML="";
 grid.removeAttribute("aria-busy");
 var L=PRODUITS.filter(function(p){return (cur==="Tous"||p.cat===cur)&&matches(p)});
 var vide=$("vide");
 vide.hidden=L.length>0;
 vide.textContent=q
  ?"Aucun article ne correspond à « "+q+" ». Écrivez-nous sur WhatsApp, nous le cherchons pour vous."
  :"Aucun article dans cette catégorie pour le moment. Écrivez-nous sur WhatsApp.";
 qres.hidden=!q||L.length===0;
 qres.textContent=L.length+(L.length>1?" résultats":" résultat")+" pour « "+q+" »";
 L.forEach(function(p){
  var a=document.createElement("article");a.className="card"+(p.epuise?" out":"");
  a.innerHTML='<div class="phw"><div class="ph"></div></div><div class="cd"><small></small><h3></h3><p></p><div class="px"></div><div class="sizes" hidden></div><p class="serr" hidden></p><button class="btn dark">Ajouter au panier</button></div>';
  var phw=a.querySelector(".phw"),ph=a.querySelector(".ph"),pics=picsOf(p);
  if(pics.length){
   pics.forEach(function(src,i){var im=new Image();im.src=src;im.alt=p.nom+(pics.length>1?" – photo "+(i+1):"");if(i>0)im.loading="lazy";ph.appendChild(im)});
   ph.classList.add("zoom");
   ph.setAttribute("role","button");ph.setAttribute("tabindex","0");
   ph.setAttribute("aria-label","Agrandir les photos de "+p.nom);
   var idx=function(){return ph.clientWidth?Math.round(ph.scrollLeft/ph.clientWidth):0};
   if(pics.length>1){
    ph.classList.add("gal");
    var dots=document.createElement("div");dots.className="dots";
    pics.forEach(function(_,i){var d=document.createElement("i");if(i===0)d.className="on";dots.appendChild(d)});
    phw.appendChild(dots);
    ph.addEventListener("scroll",function(){
     var k=idx();
     Array.prototype.forEach.call(dots.children,function(d,i){d.className=i===k?"on":""});
    },{passive:true});
   }
   ph.addEventListener("click",function(){openViewer(p,pics,idx())});
   ph.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();openViewer(p,pics,idx())}});
  }else{var s=document.createElement("span");s.className="nophoto";s.textContent="Photo à venir";ph.appendChild(s)}

  if(p.epuise){var t1=document.createElement("span");t1.className="tg out";t1.textContent="Épuisé";phw.appendChild(t1)}
  else if(isPromo(p)){var t2=document.createElement("span");t2.className="tg promo";t2.textContent="−"+promoPct(p)+" %";phw.appendChild(t2)}

  a.querySelector("small").textContent=p.cat;
  a.querySelector("h3").textContent=p.nom;
  a.querySelector("p").textContent=p.d||"";
  fillPrice(a.querySelector(".px"),p);

  var err=a.querySelector(".serr"),btn=a.querySelector(".cd .btn");
  if(p.epuise){btn.disabled=true;btn.textContent="Épuisé"}
  else{
   fillSizes(a.querySelector(".sizes"),p,err);
   btn.onclick=function(){if(tryAdd(p,err))flash(btn)};
  }
  grid.appendChild(a);
 });
}

/* ---------- Panier ---------- */
var KEY="mdp_panier",MODEKEY="mdp_mode",INFOKEY="mdp_infos",cart=[],gpsLink="";
try{cart=JSON.parse(localStorage.getItem(KEY))||[]}catch(e){cart=[]}
function saveCart(){try{localStorage.setItem(KEY,JSON.stringify(cart))}catch(e){}}
function ckey(x){return String(x.id)+"|"+(x.taille||"")}

function addToCart(p,taille){
 taille=taille||"";
 var it=cart.find(function(x){return String(x.id)===String(p.id)&&(x.taille||"")===taille});
 if(it){it.qty++}else{cart.push({id:p.id,nom:p.nom,prix:hasP(p)?p.prix:"",taille:taille,qty:1})}
 saveCart();drawCart();
}
function setQty(key,d){
 var it=cart.find(function(x){return ckey(x)===key});
 if(!it)return;
 it.qty+=d;
 if(it.qty<=0)cart=cart.filter(function(x){return x!==it});
 saveCart();drawCart();
}
function removeItem(key){
 cart=cart.filter(function(x){return ckey(x)!==key});
 saveCart();drawCart();
}

function hasPrice(x){return x.prix!==""&&x.prix!=null}
function totals(){
 var total=0,devis=false;
 cart.forEach(function(x){if(hasPrice(x)){total+=Number(x.prix)*x.qty}else{devis=true}});
 return {total:total,devis:devis};
}

function drawCart(){
 var n=cart.reduce(function(a,x){return a+x.qty},0);
 var badge=$("ccount");badge.textContent=n;badge.hidden=n===0;
 var L=$("clist");L.innerHTML="";
 if(cart.length===0){
  L.innerHTML='<p class="vide">Votre panier est vide.</p>';
  $("ctotal").textContent="0 FCFA";$("cnote").textContent="";
  $("cform").hidden=true;
  return;
 }
 $("cform").hidden=false;
 cart.forEach(function(x){
  var key=ckey(x);
  var r=document.createElement("div");r.className="ci";
  r.innerHTML='<div><h3></h3><small class="u"></small></div><div class="pr"></div><div class="qt"><button aria-label="Retirer un">−</button><b></b><button aria-label="Ajouter un">+</button></div><button class="rm">Retirer</button>';
  r.querySelector("h3").textContent=x.nom;
  var u=r.querySelector(".u"),pr=r.querySelector(".pr");
  var pre=x.taille?"Taille "+x.taille+" · ":"";
  if(hasPrice(x)){u.textContent=pre+x.qty+" × "+fcfa(x.prix);pr.textContent=fcfa(Number(x.prix)*x.qty)}
  else{u.textContent=pre+"Quantité : "+x.qty;pr.textContent="Sur demande"}
  r.querySelector("b").textContent=x.qty;
  var bs=r.querySelectorAll(".qt button");
  bs[0].onclick=function(){setQty(key,-1)};
  bs[1].onclick=function(){setQty(key,1)};
  r.querySelector(".rm").onclick=function(){removeItem(key)};
  L.appendChild(r);
 });
 var t=totals();
 $("ctotal").textContent=fcfa(t.total)+(t.devis?" +":"");
 $("cnote").textContent=t.devis?"Le prix des articles « sur demande » vous sera confirmé sur WhatsApp.":"";
}

/* ---------- Erreurs de formulaire ---------- */
function clearBad(){document.querySelectorAll(".fld.bad").forEach(function(f){f.classList.remove("bad")})}
function showErr(m,field){
 var e=$("cerr");e.textContent=m||"";e.hidden=!m;
 clearBad();
 if(m&&field){field.classList.add("bad");field.focus()}
}

/* ---------- Mode : livraison ou retrait au magasin ---------- */
function getMode(){var r=document.querySelector('input[name="mode"]:checked');return r?r.value:""}
function applyMode(){
 var m=getMode();
 $("lbox").hidden=m!=="livraison";
 $("rnote").hidden=m!=="retrait";
 showErr("");
}
document.querySelectorAll('input[name="mode"]').forEach(function(r){
 r.addEventListener("change",function(){
  try{localStorage.setItem(MODEKEY,getMode())}catch(e){}
  applyMode();
 });
});
try{
 var sm=localStorage.getItem(MODEKEY);
 if(sm){var el=document.querySelector('input[name="mode"][value="'+sm+'"]');if(el)el.checked=true}
}catch(e){}

/* ---------- Formulaire de livraison (mémorisé pour la prochaine fois) ---------- */
var FIELDS=["cnom","ctel","ctel2","cloc"];
try{
 var saved=JSON.parse(localStorage.getItem(INFOKEY)||"{}");
 FIELDS.forEach(function(id){if(saved[id])$(id).value=saved[id]});
}catch(e){}
FIELDS.concat(["cadr2"]).forEach(function(id){
 $(id).addEventListener("input",function(){
  $(id).classList.remove("bad");$("cerr").hidden=true;
  if(id==="cadr2")return;
  try{
   var o={};FIELDS.forEach(function(k){o[k]=$(k).value});
   localStorage.setItem(INFOKEY,JSON.stringify(o));
  }catch(e){}
 });
});
applyMode();

function telOK(v){return v.replace(/\D/g,"").length>=8&&/^[0-9+\s().-]+$/.test(v)}

$("cgps").onclick=function(){
 var btn=$("cgps"),label=btn.querySelector("span");
 if(!navigator.geolocation){showErr("Votre téléphone ne permet pas de partager la position. Écrivez votre localisation.",$("cloc"));return}
 btn.disabled=true;label.textContent="Recherche de votre position…";showErr("");
 navigator.geolocation.getCurrentPosition(function(pos){
  gpsLink="https://maps.google.com/?q="+pos.coords.latitude.toFixed(6)+","+pos.coords.longitude.toFixed(6);
  btn.disabled=false;label.textContent="Utiliser ma position";
  var ok=$("cgpsok");ok.textContent="Position GPS ajoutée à votre commande.";ok.hidden=false;
 },function(){
  btn.disabled=false;label.textContent="Utiliser ma position";
  showErr("Position non autorisée. Écrivez votre localisation dans le champ.",$("cloc"));
 },{enableHighAccuracy:true,timeout:15000,maximumAge:60000});
};

/* ---------- Historique : enregistrement de la commande (sans jamais bloquer WhatsApp) ---------- */
var lastSave=0;
function saveOrder(o){
 try{
  if(!db||!F)return;
  if(Date.now()-lastSave<8000)return;
  lastSave=Date.now();
  F.addDoc(F.collection(db,"commandes"),Object.assign({createdAt:F.serverTimestamp(),statut:"nouvelle"},o))
   .catch(function(e){console.warn("Commande non enregistrée",e)});
 }catch(e){console.warn(e)}
}

/* ---------- Écran de confirmation ---------- */
var cf=document.createElement("div");
cf.id="confirm";cf.hidden=true;
cf.setAttribute("role","dialog");cf.setAttribute("aria-modal","true");cf.setAttribute("aria-labelledby","cft");
cf.innerHTML='<div class="cfbox" tabindex="-1">'+
 '<div class="cfstep" id="cf1">'+
  '<div class="cfic"><svg width="30" height="30"><use href="#i-check"/></svg></div>'+
  '<h2 id="cft">Votre commande est prête</h2>'+
  '<p class="cfs">Vérifiez le récapitulatif, puis envoyez-le sur WhatsApp pour finaliser.</p>'+
  '<ul class="cfl" id="cfl"></ul>'+
  '<div class="cftot"><span>Total</span><b id="cftot"></b></div>'+
  '<p class="cfm" id="cfm"></p>'+
  '<a class="btn wag full" id="cfgo" target="_blank" rel="noopener"><svg width="20" height="20"><use href="#i-wa"/></svg><span>Envoyer sur WhatsApp</span></a>'+
  '<button class="lnk" type="button" id="cfback">Modifier ma commande</button>'+
 '</div>'+
 '<div class="cfstep" id="cf2" hidden>'+
  '<div class="cfic"><svg width="30" height="30"><use href="#i-check"/></svg></div>'+
  '<h2>Merci !</h2>'+
  '<p class="cfs">Terminez l’envoi dans WhatsApp. Nous confirmons votre commande dès réception.</p>'+
  '<button class="btn yel full" type="button" id="cfclose">Fermer</button>'+
 '</div>'+
'</div>';
document.body.appendChild(cf);

var pending=null,cfDone=false;
function openConfirm(url,order,t,mode,loc,tel){
 pending=order;cfDone=false;
 $("cf1").hidden=false;$("cf2").hidden=true;
 var ul=$("cfl");ul.innerHTML="";
 cart.forEach(function(x){
  var li=document.createElement("li");
  var a=document.createElement("span"),b=document.createElement("span");
  a.textContent=x.qty+" × "+x.nom+(x.taille?" ("+x.taille+")":"");
  b.textContent=hasPrice(x)?fcfa(Number(x.prix)*x.qty):"Sur demande";
  li.appendChild(a);li.appendChild(b);ul.appendChild(li);
 });
 $("cftot").textContent=fcfa(t.total)+(t.devis?" +":"");
 $("cfm").textContent=mode==="livraison"
  ?"Livraison : "+(loc||"position GPS")+" · Contact : "+tel
  :"Retrait au magasin, paiement sur place.";
 $("cfgo").href=url;
 cf.hidden=false;
 cf.querySelector(".cfbox").focus();
}
function closeConfirm(){
 cf.hidden=true;
 if(cfDone){cfDone=false;closeCart()}
}
$("cfgo").addEventListener("click",function(){
 if(pending){saveOrder(pending);pending=null}
 cart=[];saveCart();drawCart();
 cfDone=true;
 $("cf1").hidden=true;$("cf2").hidden=false;
});
$("cfback").onclick=closeConfirm;
$("cfclose").onclick=closeConfirm;
cf.addEventListener("click",function(e){if(e.target===cf)closeConfirm()});

/* ---------- Envoi de la commande ---------- */
$("corder").onclick=function(){
 var mode=getMode();
 if(!mode){showErr("Choisissez : livraison ou retrait au magasin.");return}

 var nom=$("cnom").value.trim(),tel=$("ctel").value.trim(),tel2=$("ctel2").value.trim();
 var loc=$("cloc").value.trim(),adr2=$("cadr2").value.trim();

 if(mode==="livraison"){
  if(!nom){showErr("Indiquez le nom de la personne qui reçoit la commande.",$("cnom"));return}
  if(!tel){showErr("Indiquez un numéro joignable.",$("ctel"));return}
  if(!telOK(tel)){showErr("Le numéro joignable n’est pas valide (8 chiffres minimum).",$("ctel"));return}
  if(tel2&&!telOK(tel2)){showErr("L’autre numéro n’est pas valide. Corrigez-le ou laissez le champ vide.",$("ctel2"));return}
  if(!loc&&!gpsLink){showErr("Indiquez votre localisation pour la livraison.",$("cloc"));return}
 }

 var t=totals();
 var msg="Bonjour, je souhaite commander :\n";
 cart.forEach(function(x){
  var label=x.nom+(x.taille?" (taille "+x.taille+")":"");
  msg+="- "+label+" : "+(hasPrice(x)?x.qty+" × "+fcfa(x.prix)+" = "+fcfa(Number(x.prix)*x.qty):x.qty+" (prix à confirmer)")+"\n";
 });
 msg+="\nTotal : "+fcfa(t.total)+(t.devis?" + articles sur demande":"");

 if(mode==="livraison"){
  msg+="\n\nMode : Livraison";
  msg+="\nNom : "+nom;
  msg+="\nNuméro joignable : "+tel;
  if(tel2)msg+="\nAutre numéro : "+tel2;
  msg+="\nLocalisation : "+(loc||"voir position GPS");
  if(gpsLink)msg+="\nPosition GPS : "+gpsLink;
  if(adr2)msg+="\nAutre adresse de livraison : "+adr2;
 }else{
  msg+="\n\nMode : Retrait au magasin (paiement sur place)";
 }

 var liv=mode==="livraison";
 var order={
  mode:mode,
  nom:liv?nom.slice(0,120):"",
  tel:liv?tel.slice(0,40):"",
  tel2:liv?tel2.slice(0,40):"",
  loc:liv?loc.slice(0,400):"",
  gps:liv?gpsLink:"",
  adr2:liv?adr2.slice(0,400):"",
  items:cart.map(function(x){return {nom:String(x.nom).slice(0,120),taille:x.taille||"",qty:x.qty,prix:hasPrice(x)?Number(x.prix):""}}),
  total:t.total,
  devis:t.devis
 };

 openConfirm("https://wa.me/"+NUM+"?text="+encodeURIComponent(msg),order,t,mode,loc,tel);
};

function openCart(){$("ov").hidden=false;$("drawer").hidden=false;document.body.style.overflow="hidden"}
function closeCart(){$("ov").hidden=true;$("drawer").hidden=true;document.body.style.overflow=""}
$("copen").onclick=openCart;
$("cclose").onclick=closeCart;
$("ov").onclick=closeCart;
$("cclear").onclick=function(){cart=[];saveCart();drawCart()};
document.addEventListener("keydown",function(e){
 if(e.key==="Escape"){
  if(!cf.hidden)closeConfirm();
  else if(!vw.hidden)closeViewer();
  else if(!mnav.hidden)closeMenu();
  else closeCart();
 }
 if(!vw.hidden&&vpics>1){
  if(e.key==="ArrowRight")vGo(1);
  if(e.key==="ArrowLeft")vGo(-1);
 }
});

drawCats();drawCatalogue();drawCart();