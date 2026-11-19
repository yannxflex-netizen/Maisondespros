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
var FIELDS=["cnom","ctel","ctel2","cloc","cville","cpays","cvautre"];
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

/* ---------- Ville : liste de 8 villes + « Autre » (pays et ville libres) ---------- */
function applyVille(){
 $("cautre").hidden=$("cville").value!=="autre";
}
$("cville").addEventListener("change",function(){
 applyVille();
 $("cville").classList.remove("bad");$("cerr").hidden=true;
 try{
  var o={};FIELDS.forEach(function(k){o[k]=$(k).value});
  localStorage.setItem(INFOKEY,JSON.stringify(o));
 }catch(e){}
});
applyVille();

function villeInfo(){
 var v=$("cville").value;
 if(!v)return {ok:false,msg:"Choisissez votre ville.",field:$("cville")};
 if(v!=="autre")return {ok:true,texte:v};
 var pays=$("cpays").value.trim(),ville=$("cvautre").value.trim();
 if(!pays)return {ok:false,msg:"Écrivez votre pays.",field:$("cpays")};
 if(!ville)return {ok:false,msg:"Écrivez votre ville.",field:$("cvautre")};
 return {ok:true,texte:ville+" ("+pays+")"};
}

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

/* ---------- Ouverture / fermeture du panier ---------- */
function openCart(){
 $("ov").hidden=false;$("drawer").hidden=false;
 document.body.style.overflow="hidden";
}
function closeCart(){
 $("ov").hidden=true;$("drawer").hidden=true;
 document.body.style.overflow="";
}
$("copen").onclick=openCart;
$("cclose").onclick=closeCart;
$("ov").onclick=closeCart;

/* ---------- Écran de confirmation ---------- */
function showConfirm(){
 var c=document.createElement("div");
 c.setAttribute("role","dialog");c.setAttribute("aria-modal","true");
 c.style.cssText="position:fixed;inset:0;z-index:70;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.6)";
 c.innerHTML='<div style="background:#fff;border-radius:18px;padding:26px 22px;max-width:360px;width:100%;text-align:center;font-family:Inter,Arial,sans-serif">'+
  '<h2 style="margin:0 0 8px;font:800 22px Montserrat,Arial,sans-serif;color:#101010">Commande prête</h2>'+
  '<p style="margin:0 0 18px;color:#555">WhatsApp s’est ouvert avec votre commande. Appuyez sur « Envoyer » pour la valider.</p>'+
  '<button type="button" class="btn yel full" id="cfok">Fermer</button>'+
  '<button type="button" class="lnk" id="cfclear">Vider le panier</button></div>';
 document.body.appendChild(c);
 c.querySelector("#cfok").onclick=function(){c.remove()};
 c.querySelector("#cfclear").onclick=function(){cart=[];saveCart();drawCart();c.remove()};
}

/* ---------- Commander sur WhatsApp ---------- */
$("corder").onclick=function(){
 if(!cart.length)return;
 var mode=getMode();
 if(!mode){showErr("Choisissez livraison ou retrait au magasin.");return}

 var nom="",tel="",tel2="",ville="",loc="",adr2="";
 if(mode==="livraison"){
  nom=$("cnom").value.trim();tel=$("ctel").value.trim();tel2=$("ctel2").value.trim();
  loc=$("cloc").value.trim();adr2=$("cadr2").value.trim();
  if(!nom){showErr("Écrivez le nom de la personne qui reçoit.",$("cnom"));return}
  if(!telOK(tel)){showErr("Écrivez un numéro de téléphone valide.",$("ctel"));return}
  if(tel2&&!telOK(tel2)){showErr("Le deuxième numéro n’est pas valide.",$("ctel2"));return}
  var vi=villeInfo();
  if(!vi.ok){showErr(vi.msg,vi.field);return}
  ville=vi.texte;
  if(!loc&&!gpsLink){showErr("Écrivez votre quartier ou utilisez votre position.",$("cloc"));return}
 }
 showErr("");

 var t=totals();
 var lines=["Bonjour, je souhaite commander :",""];
 cart.forEach(function(x){
  var s="• "+x.nom+(x.taille?" (taille "+x.taille+")":"")+" × "+x.qty;
  s+=hasPrice(x)?" : "+fcfa(Number(x.prix)*x.qty):" : prix sur demande";
  lines.push(s);
 });
 lines.push("");
 lines.push("Total : "+fcfa(t.total)+(t.devis?" + articles sur demande":""));
 lines.push("");
 if(mode==="livraison"){
  lines.push("*Mode : Livraison*");
  lines.push("Nom : "+nom);
  lines.push("Téléphone : "+tel);
  if(tel2)lines.push("Autre numéro : "+tel2);
  lines.push("Ville : "+ville);
  if(loc)lines.push("Quartier / repère : "+loc);
  if(adr2)lines.push("Autre adresse de livraison : "+adr2);
  if(gpsLink)lines.push("Position GPS : "+gpsLink);
 }else{
  lines.push("*Mode : Retrait au magasin*");
 }

 saveOrder({
  mode:mode,nom:nom,tel:tel,tel2:tel2,ville:ville,localisation:loc,autreAdresse:adr2,gps:gpsLink,
  articles:cart.map(function(x){return {nom:x.nom,taille:x.taille||"",qty:x.qty,prix:hasPrice(x)?x.prix:""}}),
  total:t.total,devis:t.devis
 });

 var url="https://wa.me/"+NUM+"?text="+encodeURIComponent(lines.join("\n"));
 var w=window.open(url,"_blank");
 if(!w)location.href=url;
 closeCart();
 showConfirm();
};

$("cclear").onclick=function(){
 if(confirm("Vider le panier ?")){cart=[];saveCart();drawCart()}
};

/* ---------- Démarrage ---------- */
drawCats();
drawCatalogue();
drawCart();
