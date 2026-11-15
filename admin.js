import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth,signInWithEmailAndPassword,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore,collection,addDoc,updateDoc,getDocs,deleteDoc,doc,query,orderBy,limit,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

var FIREBASE={
 apiKey:"AIzaSyBB1EGrTvDpkt89QgmYpE1WGsp8XqrrAmI",
 authDomain:"maison-des-pros.firebaseapp.com",
 projectId:"maison-des-pros",
 storageBucket:"maison-des-pros.firebasestorage.app",
 messagingSenderId:"45668146176",
 appId:"1:45668146176:web:14200d75fe51b33b4fcce5"
};
var CATS=["Crampons","Maillots","Chaussettes","Protège-tibias","Ballons","Gants","Accessoires"];
var MAX=3;

var $=function(i){return document.getElementById(i)};
var app=initializeApp(FIREBASE),auth=getAuth(app),db=getFirestore(app);
var col=collection(db,"produits"),ocol=collection(db,"commandes");
var slots=["","",""],editId=null,items=[],orders=[];

function fcfa(n){return Number(n).toLocaleString("fr-FR").replace(/\u202f|\u00a0/g," ")+" FCFA"}
function say(t,type){var m=$("msg");m.textContent=t||"";m.hidden=!t;m.className="msg "+(type||"")}
function pst(t,type){var m=$("pst");m.textContent=t||"";m.hidden=!t;m.className="msg "+(type||"")}
function omsg(t,type){var m=$("omsg");m.textContent=t||"";m.hidden=!t;m.className="msg "+(type||"")}
function picsOf(p){return p.imgs&&p.imgs.length?p.imgs:(p.img?[p.img]:[])}
function hasP(p){return p.prix!==""&&p.prix!=null}

/* ---------- Connexion ---------- */
onAuthStateChanged(auth,function(u){
 $("lock").hidden=!!u;$("app").hidden=!u;
 if(u){load();loadOrders()}
});
function login(){
 var err=$("lerr");err.hidden=true;
 $("login").disabled=true;
 signInWithEmailAndPassword(auth,$("em").value.trim(),$("pw").value)
  .catch(function(){err.textContent="E-mail ou mot de passe incorrect.";err.hidden=false})
  .finally(function(){$("login").disabled=false});
}
$("login").onclick=login;
$("pw").addEventListener("keydown",function(e){if(e.key==="Enter")login()});
$("out").onclick=function(){signOut(auth)};

/* ---------- Onglets ---------- */
function tab(n){
 $("sec-o").hidden=n!=="o";$("sec-a").hidden=n!=="a";
 $("tabo").classList.toggle("on",n==="o");$("taba").classList.toggle("on",n==="a");
}
$("tabo").onclick=function(){tab("o")};
$("taba").onclick=function(){tab("a")};

/* ---------- Commandes ---------- */
function waNum(t){
 var d=String(t||"").replace(/\D/g,"");
 if(d.indexOf("00")===0)d=d.slice(2);
 if(d.length===10&&d.charAt(0)==="0")d="225"+d;
 return d;
}
function line(label,value){
 var p=document.createElement("p"),b=document.createElement("b");
 b.textContent=label+" : ";p.appendChild(b);
 p.appendChild(document.createTextNode(value));
 return p;
}
function fmtDate(o){
 try{
  if(o.createdAt&&o.createdAt.toDate)return o.createdAt.toDate().toLocaleString("fr-FR",{dateStyle:"short",timeStyle:"short"});
 }catch(e){}
 return "Date inconnue";
}

async function loadOrders(){
 try{
  var s=await getDocs(query(ocol,orderBy("createdAt","desc"),limit(50)));
  orders=s.docs.map(function(d){return Object.assign({id:d.id},d.data())});
  omsg("");
 }catch(e){
  console.error(e);orders=[];
  omsg("Impossible de charger les commandes. Vérifiez que les règles Firestore sont publiées.","bad");
 }
 drawOrders();
}
$("orefresh").onclick=function(){loadOrders()};

function drawOrders(){
 var L=$("olist");L.innerHTML="";
 $("on").textContent=orders.length;
 $("oempty").hidden=orders.length>0||!$("omsg").hidden;
 var nNew=orders.filter(function(o){return o.statut!=="traitee"}).length;
 $("nb").textContent=nNew;$("nb").hidden=nNew===0;

 orders.forEach(function(o){
  var done=o.statut==="traitee";
  var det=document.createElement("details");det.className="ord"+(done?" done":"");
  var sum=document.createElement("summary");
  var s1=document.createElement("div");s1.className="s1";
  var b=document.createElement("b");
  b.textContent=o.mode==="livraison"?(o.nom||"Livraison"):"Retrait au magasin";
  var sm=document.createElement("small");
  sm.textContent=fmtDate(o)+" · "+(o.mode==="livraison"?"Livraison":"Retrait")+" · "+fcfa(o.total||0)+(o.devis?" + sur demande":"");
  s1.appendChild(b);s1.appendChild(sm);
  var pill=document.createElement("span");pill.className="pill";pill.textContent=done?"Traitée":"Nouvelle";
  sum.appendChild(s1);sum.appendChild(pill);
  det.appendChild(sum);

  var body=document.createElement("div");body.className="body";
  var ul=document.createElement("ul");
  (o.items||[]).forEach(function(it){
   var li=document.createElement("li");
   var hp=it.prix!==""&&it.prix!=null;
   li.textContent=it.qty+" × "+it.nom+(it.taille?" (taille "+it.taille+")":"")+(hp?" – "+fcfa(Number(it.prix)*it.qty):" – prix à confirmer");
   ul.appendChild(li);
  });
  body.appendChild(ul);
  body.appendChild(line("Total",fcfa(o.total||0)+(o.devis?" + articles sur demande":"")));

  if(o.mode==="livraison"){
   if(o.nom)body.appendChild(line("Nom",o.nom));
   if(o.tel){
    var pt=document.createElement("p"),bt=document.createElement("b");
    bt.textContent="Numéro joignable : ";pt.appendChild(bt);
    var at=document.createElement("a");at.textContent=o.tel;at.href="tel:"+String(o.tel).replace(/[^\d+]/g,"");
    pt.appendChild(at);body.appendChild(pt);
   }
   if(o.tel2)body.appendChild(line("Autre numéro",o.tel2));
   if(o.loc)body.appendChild(line("Localisation",o.loc));
   if(o.gps&&/^https:\/\/maps\.google\.com\/\?q=-?[0-9.]+,-?[0-9.]+$/.test(o.gps)){
    var pg=document.createElement("p"),bg=document.createElement("b");
    bg.textContent="Position GPS : ";pg.appendChild(bg);
    var ag=document.createElement("a");ag.textContent="Ouvrir sur la carte";ag.href=o.gps;ag.target="_blank";ag.rel="noopener";
    pg.appendChild(ag);body.appendChild(pg);
   }
   if(o.adr2)body.appendChild(line("Autre adresse",o.adr2));
  }else{
   body.appendChild(line("Mode","Retrait au magasin, paiement sur place"));
  }

  var acts=document.createElement("div");acts.className="oacts";
  if(o.mode==="livraison"&&waNum(o.tel).length>=8){
   var wa=document.createElement("a");wa.className="bl";wa.textContent="Contacter le client";
   wa.href="https://wa.me/"+waNum(o.tel);wa.target="_blank";wa.rel="noopener";
   acts.appendChild(wa);
  }
  var bs=document.createElement("button");bs.type="button";bs.className="sm lt";
  bs.textContent=done?"Remettre en nouvelle":"Marquer traitée";
  bs.onclick=async function(){
   bs.disabled=true;
   try{
    await updateDoc(doc(db,"commandes",o.id),{statut:done?"nouvelle":"traitee"});
    loadOrders();
   }catch(e){console.error(e);omsg("Modification refusée ou impossible.","bad");bs.disabled=false}
  };
  var bd=document.createElement("button");bd.type="button";bd.className="sm dl";bd.textContent="Supprimer";
  bd.onclick=async function(){
   if(!confirm("Supprimer cette commande ?"))return;
   try{await deleteDoc(doc(db,"commandes",o.id));loadOrders()}
   catch(e){console.error(e);omsg("Suppression refusée ou impossible.","bad")}
  };
  acts.appendChild(bs);acts.appendChild(bd);
  body.appendChild(acts);
  det.appendChild(body);
  L.appendChild(det);
 });
}

/* ---------- Photos : 3 cases, chacune est son propre sélecteur ---------- */
CATS.forEach(function(c){var o=document.createElement("option");o.textContent=c;$("cat").appendChild(o)});

function shrink(f){
 return new Promise(function(res){
  var u=URL.createObjectURL(f),im=new Image();
  im.onload=function(){
   try{
    var s=Math.min(1,600/Math.max(im.width,im.height)),c=document.createElement("canvas");
    c.width=Math.max(1,Math.round(im.width*s));c.height=Math.max(1,Math.round(im.height*s));
    c.getContext("2d").drawImage(im,0,0,c.width,c.height);
    res(c.toDataURL("image/jpeg",.7));
   }catch(e){console.error(e);res("")}
   URL.revokeObjectURL(u);
  };
  im.onerror=function(){URL.revokeObjectURL(u);res("")};
  im.src=u;
 });
}

async function pick(i,inp){
 var f=inp.files&&inp.files[0];
 if(!f)return;
 pst("Traitement de la photo "+(i+1)+"…");
 var s=await shrink(f);
 if(s){slots[i]=s;pst("Photo "+(i+1)+" ajoutée.","ok")}
 else{pst("Photo illisible. Choisissez une image JPG ou PNG.","bad")}
 drawSlots();
}

function drawSlots(){
 var g=$("slots");g.innerHTML="";
 for(let i=0;i<MAX;i++){
  var d=document.createElement("div");
  d.className="slot"+(slots[i]?" on":"");
  if(slots[i]){
   var im=new Image();im.src=slots[i];im.alt="Photo "+(i+1);d.appendChild(im);
  }else{
   var p=document.createElement("span");p.className="plus";
   p.innerHTML="+<small></small>";
   p.querySelector("small").textContent="Photo "+(i+1);
   d.appendChild(p);
  }
  let inp=document.createElement("input");
  inp.type="file";inp.accept="image/*";
  inp.setAttribute("aria-label","Choisir la photo "+(i+1));
  inp.onchange=function(){pick(i,inp)};
  d.appendChild(inp);
  if(slots[i]){
   var x=document.createElement("button");
   x.type="button";x.className="x";x.textContent="×";
   x.setAttribute("aria-label","Retirer la photo "+(i+1));
   x.onclick=function(e){e.preventDefault();e.stopPropagation();slots[i]="";pst("");drawSlots()};
   d.appendChild(x);
  }
  if(i===0&&slots[0]){
   var t=document.createElement("span");t.className="tag";t.textContent="Principale";d.appendChild(t);
  }
  g.appendChild(d);
 }
 var n=slots.filter(Boolean).length;
 $("cnt").textContent=n+" / "+MAX+" photos. Touchez une case pour choisir ou remplacer une photo.";
}
drawSlots();

/* ---------- Formulaire article ---------- */
/* Une taille par bouton : l'espace, la virgule ou le point-virgule séparent les tailles */
function parseTailles(txt){
 var out=[];
 txt.split(/[\s,;]+/).forEach(function(s){
  s=s.trim();
  if(s&&out.indexOf(s)<0&&out.length<12)out.push(s.slice(0,12));
 });
 return out;
}
function resetForm(){
 editId=null;
 $("nom").value=$("prix").value=$("ancien").value=$("tailles").value=$("d").value="";
 $("epuise").checked=false;
 $("cat").selectedIndex=0;slots=["","",""];drawSlots();pst("");
 $("ftitle").textContent="Nouvel article";
 $("save").textContent="Ajouter l’article";
 $("cancel").hidden=true;
}
$("cancel").onclick=function(){resetForm();say("")};

$("save").onclick=async function(){
 var nom=$("nom").value.trim();
 if(!nom){say("Entrez le nom de l’article.","bad");$("nom").focus();return}
 var prixTxt=$("prix").value.trim(),prix="";
 if(prixTxt!==""){
  prix=Number(prixTxt);
  if(!isFinite(prix)||prix<0){say("Le prix doit être un nombre en FCFA.","bad");return}
 }
 var ancTxt=$("ancien").value.trim(),ancien="";
 if(ancTxt!==""){
  ancien=Number(ancTxt);
  if(prix===""){say("Indiquez d’abord le prix, puis l’ancien prix.","bad");$("prix").focus();return}
  if(!isFinite(ancien)||ancien<=prix){say("L’ancien prix doit être plus grand que le prix actuel.","bad");$("ancien").focus();return}
 }
 var imgs=slots.filter(Boolean);
 var total=imgs.reduce(function(a,s){return a+s.length},0);
 if(total>850000){say("Les photos sont trop lourdes. Retirez-en une ou choisissez des images plus simples.","bad");return}
 var data={cat:$("cat").value,nom:nom,prix:prix,ancienPrix:ancien,tailles:parseTailles($("tailles").value),epuise:$("epuise").checked,d:$("d").value.trim(),imgs:imgs,img:imgs[0]||""};
 $("save").disabled=true;
 try{
  if(editId){
   await updateDoc(doc(db,"produits",editId),data);
   say("Article modifié.","ok");
  }else{
   data.createdAt=serverTimestamp();
   await addDoc(col,data);
   say("Article ajouté. Il est visible sur le site.","ok");
  }
  resetForm();
  await load();
 }catch(e){
  console.error(e);
  say(e&&e.code==="permission-denied"
   ?"Refusé : ce compte n’a pas le droit de modifier les articles (vérifiez les règles Firestore)."
   :"Échec de l’enregistrement. Vérifiez votre connexion et réessayez.","bad");
 }
 $("save").disabled=false;
};

/* ---------- Liste des articles ---------- */
async function load(){
 try{
  var s=await getDocs(query(col,orderBy("createdAt","desc")));
  items=s.docs.map(function(d){return Object.assign({id:d.id},d.data())});
 }catch(e){
  console.error(e);items=[];
  say("Impossible de charger les articles.","bad");
 }
 draw();
}
function draw(){
 var L=$("list");L.innerHTML="";
 $("n").textContent=items.length;
 $("empty").hidden=items.length>0;
 items.forEach(function(p){
  var r=document.createElement("div");r.className="it";
  var pics=picsOf(p),th;
  if(pics.length){th=new Image();th.src=pics[0];th.alt="";th.className="th"}
  else{th=document.createElement("div");th.className="th";th.textContent="Pas de photo"}
  var info=document.createElement("div");info.className="info";
  info.innerHTML="<b></b><small></small>";
  info.querySelector("b").textContent=p.nom;
  var np=pics.length,small=info.querySelector("small");
  var txt=p.cat+" · "+(hasP(p)?fcfa(p.prix):"Prix sur demande")+" · "+np+(np>1?" photos":" photo");
  if(Array.isArray(p.tailles)&&p.tailles.length)txt+=" · "+parseTailles(p.tailles.join(" ")).length+" tailles";
  small.textContent=txt;
  if(p.epuise){var o=document.createElement("span");o.className="out";o.textContent=" · Épuisé";small.appendChild(o)}
  var acts=document.createElement("div");acts.className="acts";
  var be=document.createElement("button");be.className="sm lt";be.textContent="Modifier";
  var bs=document.createElement("button");bs.className="sm lt";bs.textContent=p.epuise?"Remettre en stock":"Marquer épuisé";
  var bd=document.createElement("button");bd.className="sm dl";bd.textContent="Supprimer";
  be.onclick=function(){edit(p)};
  bs.onclick=async function(){
   bs.disabled=true;
   try{
    await updateDoc(doc(db,"produits",p.id),{epuise:!p.epuise});
    say(p.epuise?"Article remis en stock.":"Article marqué épuisé.","ok");
    load();
   }catch(e){console.error(e);say("Modification refusée ou impossible.","bad");bs.disabled=false}
  };
  bd.onclick=async function(){
   if(!confirm("Supprimer « "+p.nom+" » ?"))return;
   try{await deleteDoc(doc(db,"produits",p.id));say("Article supprimé.","ok");load()}
   catch(e){console.error(e);say("Suppression refusée ou impossible.","bad")}
  };
  acts.appendChild(be);acts.appendChild(bs);acts.appendChild(bd);
  r.appendChild(th);r.appendChild(info);r.appendChild(acts);
  L.appendChild(r);
 });
}
function edit(p){
 editId=p.id;
 $("nom").value=p.nom||"";
 $("cat").value=p.cat||CATS[0];
 $("prix").value=hasP(p)?p.prix:"";
 $("ancien").value=(p.ancienPrix===""||p.ancienPrix==null)?"":p.ancienPrix;
 $("tailles").value=Array.isArray(p.tailles)?parseTailles(p.tailles.join(" ")).join(" "):"";
 $("epuise").checked=!!p.epuise;
 $("d").value=p.d||"";
 slots=["","",""];
 picsOf(p).slice(0,MAX).forEach(function(s,i){slots[i]=s});
 drawSlots();pst("");
 $("ftitle").textContent="Modifier l’article";
 $("save").textContent="Enregistrer les modifications";
 $("cancel").hidden=false;say("");
 window.scrollTo({top:0,behavior:"smooth"});
}