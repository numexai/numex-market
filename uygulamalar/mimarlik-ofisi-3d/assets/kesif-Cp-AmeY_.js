import{M as De,G as M,m as ne,b as u,B as i,e as n,S as Le,E as we,C as X,f as Z,g as Te,k as ge}from"./motor-DZcp5Afu.js";const Ue=document.getElementById("kesif-kok"),s={ustKat:!0,cati:!0,duvarlar:!0,gorunum:"dis",gece:!1,cephe:"krem-siva",dusuk:window.matchMedia("(max-width: 780px)").matches};Ue.innerHTML=`
<div class="kesif">
  <header class="kesif__ust">
    <a class="marka" href="index.html" style="color:var(--krem)" aria-label="Ana sayfaya dön">
      <strong style="color:var(--krem);font-size:1.1rem">Atelier</strong>
      <span style="color:rgba(244,240,233,0.5)">İnteraktif Mimari Keşif</span>
    </a>
    <div style="display:flex;gap:0.6rem;flex-wrap:wrap">
      <a class="btn btn--acik btn--kucuk" href="index.html">← Siteye dön</a>
      <button class="btn btn--acik btn--kucuk" id="sifirla">Görünümü sıfırla</button>
    </div>
  </header>

  <div class="kesif__sahne" id="sahne">
    <div class="kesif__yukleniyor" id="yukleniyor">3D sahne hazırlanıyor…</div>

    <aside class="kesif__panel" aria-label="3D sahne kontrolleri">
      <div class="kesif__grup">
        <span>Katmanlar</span>
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
          <button class="cip" id="katUst" aria-pressed="true">Üst katı göster</button>
          <button class="cip" id="catiBtn" aria-pressed="true">Çatıyı göster</button>
          <button class="cip" id="duvarBtn" aria-pressed="true">Duvarları göster</button>
        </div>
      </div>

      <div class="kesif__grup">
        <span>Kamera</span>
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
          <button class="cip" data-gorunum="dis" aria-pressed="true">Dış</button>
          <button class="cip" data-gorunum="ic" aria-pressed="false">İç</button>
          <button class="cip" data-gorunum="ust" aria-pressed="false">Üstten</button>
        </div>
      </div>

      <div class="kesif__grup">
        <span>Cephe malzemesi</span>
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
          <button class="cip" data-cephe="krem-siva" aria-pressed="true">Krem sıva</button>
          <button class="cip" data-cephe="antrasit-tas" aria-pressed="false">Antrasit taş</button>
          <button class="cip" data-cephe="meşe-panel" aria-pressed="false">Meşe panel</button>
        </div>
      </div>

      <div class="kesif__grup">
        <span>Işık</span>
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
          <button class="cip" id="geceBtn" aria-pressed="false">Gece modu</button>
        </div>
      </div>

      <div class="kesif__grup">
        <span>Performans</span>
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
          <button class="cip" id="kaliteBtn" aria-pressed="${s.dusuk?"true":"false"}">
            Düşük grafik kalitesi
          </button>
        </div>
      </div>
    </aside>

    <p class="kesif__ipucu">
      Sürükleyerek döndürün · tekerlek/pinç ile yakınlaştırın · sağ tuş ile kaydırın.
      Villa temsilî bir örnektir; hazır model kullanılmamış, geometri kodla üretilmiştir.
    </p>
  </div>
</div>
`;const Ce=document.getElementById("sahne");let l,f=null;function Re(){const c=new M;c.name="cati";const a=ne[1],r=2*3.05,A=new u({color:7297604,roughness:.82,metalness:.06}),oe=.9,ie=a.genislik+oe*2,C=a.derinlik+oe*2,R=Z.degToRad(16),fe=a.genislik/2,he=a.derinlik/2,_=fe,P=he,re=ie/2,ce=re/Math.cos(R),V=re*Math.tan(R),W=r+.06,ye=W+V,ve=ce*Math.cos(R),be=new i(ce,.22,C);for(const e of[-1,1]){const t=new n(be,A);t.position.set(_+e*ve/2,W+V/2,P),t.rotation.z=-e*R,t.castShadow=!0,t.receiveShadow=!1,t.name="cati-yuzey",c.add(t)}const Se=V+.12,z=new Le;z.moveTo(-a.genislik/2-.05,0),z.lineTo(a.genislik/2+.05,0),z.lineTo(0,Se),z.closePath();const G=new n(new we(z,{depth:.26,bevelEnabled:!1}),new u({color:15261905,roughness:.85}));G.position.set(_,r-.02,a.derinlik-.08),G.castShadow=!0,G.receiveShadow=!0,G.name="alinlik",c.add(G);const j=new n(new we(z,{depth:.26,bevelEnabled:!1}),new u({color:14472389,roughness:.87}));j.position.set(_,r-.02,.18),j.castShadow=!0,j.name="alinlik-arka",c.add(j);for(const e of[P-C/2+.2,P+C/2-.2]){const t=new n(new i(ie,.18,.4),A);t.position.set(_,W,e),t.castShadow=!0,c.add(t)}const H=new n(new i(.36,.22,C),A);H.position.set(_,ye+.06,P),H.castShadow=!0,c.add(H);const h=new M;h.name="peyzaj";const N=new n(new i(a.genislik+24,.12,a.derinlik+22),new u({color:9280114,roughness:.95}));N.position.set(a.genislik/2+2,-.07,a.derinlik/2+1),N.receiveShadow=!0,h.add(N);const O=new n(new i(3.2,.06,12),new u({color:13156270,roughness:.9}));O.position.set(a.genislik*.47,.02,a.derinlik+7),O.receiveShadow=!0,h.add(O);const q=new n(new i(3.6,.18,1.6),new u({color:14143424,roughness:.85}));q.position.set(a.genislik*.47,.09,a.derinlik+.7),q.castShadow=!0,q.receiveShadow=!0,h.add(q);const k=new M;k.name="cocuk-parki";const K=new u({color:11040831,roughness:.85}),de=new u({color:11753023,roughness:.7}),$=new u({color:4881555,roughness:.7}),ze=new u({color:14734260,roughness:.98}),m=-5.2,w=a.derinlik+8.2,F=new n(new i(7.2,.22,5.4),ze);F.position.set(m,.11,w),F.receiveShadow=!0,k.add(F);const Be=new X(.07,.07,2.3,8);for(const[e,t,o]of[[-2.2,-1,.32],[-2.2,1,-.32],[-.6,-1,.32],[-.6,1,-.32]]){const d=new n(Be,K);d.position.set(m+e,1.15,w+t),d.rotation.x=o,d.castShadow=!0,k.add(d)}const J=new n(new i(.14,.14,2.4),K);J.position.set(m-1.4,2.28,w),J.castShadow=!0,k.add(J);for(const e of[-.55,.55]){const t=new n(new X(.02,.02,1.1,6),K);t.position.set(m-1.4,1.72,w+e-.22),k.add(t);const o=new n(new X(.02,.02,1.1,6),K);o.position.set(m-1.4,1.72,w+e+.22),k.add(o);const d=new n(new i(.5,.1,.46),de);d.position.set(m-1.4,1.14,w+e),d.castShadow=!0,k.add(d)}const Q=new n(new i(1.2,.12,1.2),$);Q.position.set(m+1.7,1.35,w-.6),Q.castShadow=!0,k.add(Q);for(const[e,t]of[[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]]){const o=new n(new i(.1,1.35,.1),$);o.position.set(m+1.7+e,.68,w-.6+t),o.castShadow=!0,k.add(o)}const le=3,I=new n(new i(1,.1,le),de);I.position.set(m+1.7,.72,w+.85),I.rotation.x=Z.degToRad(26),I.castShadow=!0,I.name="kaydirak-yuzey",k.add(I);for(const e of[-1,1]){const t=new n(new i(.06,.22,le),$);t.position.set(m+1.7+e*.5,.86,w+.85),t.rotation.x=Z.degToRad(26),k.add(t)}for(let e=0;e<4;e++){const t=new n(new i(.9,.08,.3),K);t.position.set(m+1.7,.18+e*.34,w-1.6-e*.42),t.castShadow=!0,k.add(t)}const ue=new u({color:15722972,roughness:.8}),ee=new M;for(let e=0;e<26;e++){const t=new n(new i(.07,.85,.07),ue),o=e/25;t.position.set(m-3.8+o*7.6,.42,w+2.85),ee.add(t)}const ke=new n(new i(7.7,.07,.07),ue);ke.position.set(m,.78,w+2.85),ee.add(ke),k.add(ee),h.add(k);const Ee=new u({color:7034431,roughness:.95}),xe=new u({color:6255952,roughness:.9}),Me=[[-8.5,-2,1],[-8,14,.9],[a.genislik+9,-1.5,.95],[a.genislik+9.5,13,1.05],[-2,-6,.85],[a.genislik+2,-6.5,.8]];for(const[e,t,o]of Me){const d=new n(new X(.16*o,.22*o,2.4*o,8),Ee);d.position.set(e,1.2*o,t),d.castShadow=!0,h.add(d);const b=new n(new Te(1.15*o,10,8),xe);b.position.set(e,2.9*o,t),b.castShadow=!0,h.add(b)}const y=new M;y.name="arsa-citi";const S=new u({color:15130577,roughness:.82}),v=a.genislik+11,B=a.derinlik+9,E=a.genislik/2+1,D=a.derinlik/2+.5,pe=new i(.08,1,.08),te=2.6,me=7,ae=me-te/2-.15,Y=me+te/2+.15,Ae=e=>e>ae&&e<Y;for(const e of[D-B/2,D+B/2]){const t=e>D,o=Math.floor(v/.62);for(let g=0;g<=o;g++){const p=E-v/2+g*(v/o);if(t&&Ae(p))continue;const x=new n(pe,S);x.position.set(p,.5,e),y.add(x)}const d=E-v/2,b=E+v/2;for(const g of[.34,.86])if(t){const p=ae-d,x=b-Y;if(p>.1){const T=new n(new i(p,.09,.06),S);T.position.set(d+p/2,g,e),y.add(T)}if(x>.1){const T=new n(new i(x,.09,.06),S);T.position.set(Y+x/2,g,e),y.add(T)}}else{const p=new n(new i(v,.09,.06),S);p.position.set(E,g,e),y.add(p)}if(t)for(const g of[-1,1]){const p=new n(new i(.07,1.1,te/2),S);p.position.set(g<0?ae:Y,.55,e+(g<0,0)+0),p.rotation.y=g*Z.degToRad(72),p.name="cit-kapi-kanat",y.add(p)}}for(const e of[E-v/2,E+v/2]){const t=Math.floor(B/.62);for(let o=0;o<=t;o++){const d=D-B/2+o*(B/t),b=new n(pe,S);b.position.set(e,.5,d),y.add(b)}for(const o of[.34,.86]){const d=new n(new i(.06,.09,B),S);d.position.set(e,o,D),y.add(d)}}h.add(y),h.name="peyzaj",c.add(h);const L=new M;L.name="pergola";const se=new u({color:11569746,roughness:.6,metalness:.2}),_e=new i(.16,2.9,.16),Ge=[[14.6,3.4],[14.6,9.2],[18.2,3.4],[18.2,9.2]];for(const[e,t]of Ge){const o=new n(_e,se);o.position.set(e,1.45,t),o.castShadow=!0,L.add(o)}const Ke=new i(4,.1,.14);for(let e=0;e<9;e++){const t=new n(Ke,se);t.position.set(16,2.92,3.5+e*.72),t.castShadow=!0,L.add(t)}const Ie=new i(.14,.18,6.2);for(const e of[14.4,17.6]){const t=new n(Ie,se);t.position.set(e,2.98,6.3),L.add(t)}return c.add(L),c}function U(){l.bosalt();const c=l.malzemeler();l.ekle(ge(ne[0],c,s.cephe,0,{icDuvar:s.duvarlar,doseme:!0,mobilya:!0})),s.ustKat&&l.ekle(ge(ne[1],c,s.cephe,3.05,{icDuvar:s.duvarlar,doseme:!0,mobilya:!0})),f&&(f.visible=s.cati)}function Pe(){try{l=new De({kap:Ce,arka:16052457,golge:!s.dusuk,don:!1}),l.renderci.setPixelRatio(s.dusuk?1:Math.min(window.devicePixelRatio,2)),l.kameraAyarla("dis"),f=Re(),l.kaliciEkle(f);const a=f.parent,r=f.getObjectByName("peyzaj");r&&a&&(f.remove(r),a.add(r)),U(),l.kamera.position.set(-27,17,34),l.kontroller.target.set(5,3.6,8.5),l.kontroller.minDistance=8,l.kontroller.maxDistance=70,l.kontroller.update(),document.getElementById("yukleniyor")?.classList.add("kesif__yukleniyor--gizli");const A=()=>l.boyutla();window.addEventListener("resize",A)}catch(a){document.getElementById("yukleniyor").textContent="Tarayıcınız WebGL desteklemediği için 3D sahne açılamadı.",console.error("3D keşif sahnesi başlatılamadı:",a);return}const c=(a,r)=>{document.getElementById(a)?.setAttribute("aria-pressed",String(r))};document.getElementById("katUst").addEventListener("click",a=>{s.ustKat=!s.ustKat;const r=a.currentTarget;r.textContent=s.ustKat?"Üst katı göster":"Üst katı gizle",r.setAttribute("aria-pressed",String(s.ustKat)),U()}),document.getElementById("catiBtn").addEventListener("click",()=>{s.cati=!s.cati,f&&(f.visible=s.cati),c("catiBtn",s.cati)}),document.getElementById("duvarBtn").addEventListener("click",()=>{s.duvarlar=!s.duvarlar,c("duvarBtn",s.duvarlar),U()}),document.querySelectorAll("[data-gorunum]").forEach(a=>{a.addEventListener("click",()=>{s.gorunum=a.dataset.gorunum,document.querySelectorAll("[data-gorunum]").forEach(r=>r.setAttribute("aria-pressed",String(r===a))),l.kameraAyarla(s.gorunum)})}),document.querySelectorAll("[data-cephe]").forEach(a=>{a.addEventListener("click",()=>{s.cephe=a.dataset.cephe,document.querySelectorAll("[data-cephe]").forEach(r=>r.setAttribute("aria-pressed",String(r===a))),U()})}),document.getElementById("geceBtn").addEventListener("click",()=>{s.gece=!s.gece,c("geceBtn",s.gece),l.gece(s.gece)}),document.getElementById("kaliteBtn").addEventListener("click",()=>{s.dusuk=!s.dusuk,c("kaliteBtn",s.dusuk),l.renderci.setPixelRatio(s.dusuk?1:Math.min(window.devicePixelRatio,2)),l.renderci.shadowMap.enabled=!s.dusuk}),document.getElementById("sifirla").addEventListener("click",()=>{s.gorunum="dis",s.gece=!1,s.ustKat=!0,s.cati=!0,s.duvarlar=!0,s.cephe="krem-siva",document.querySelectorAll("[data-gorunum]").forEach(r=>r.setAttribute("aria-pressed",String(r.dataset.gorunum==="dis"))),document.querySelectorAll("[data-cephe]").forEach(r=>r.setAttribute("aria-pressed",String(r.dataset.cephe==="krem-siva"))),c("geceBtn",!1),c("catiBtn",!0),c("duvarBtn",!0),c("katUst",!0);const a=document.getElementById("katUst");a.textContent="Üst katı göster",l.gece(!1),f&&(f.visible=!0),l.kameraAyarla("dis"),U()})}Pe();
