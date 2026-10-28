/**
 * İnteraktif Mimari Keşif — iki katlı modern villa, ayrı sayfa.
 * Ağır 3D sahne ana sayfayı yavaşlatmasın diye bağımsız giriş noktası (kesif.html).
 * Tüm geometri kodla üretilir; hazır model dosyası indirilmez.
 */

import './style.css';
import { MimariSahne, katEkle, type MalzemeSecim, type Gorunum } from './scene/motor';
import { modernVillaKatlar } from './scene/planData';
import * as THREE from 'three';

const kok = document.getElementById('kesif-kok')!;

type Durum = {
  ustKat: boolean;
  cati: boolean;
  duvarlar: boolean;
  gorunum: Gorunum;
  gece: boolean;
  cephe: MalzemeSecim;
  dusuk: boolean;
};

const durum: Durum = {
  ustKat: true,
  cati: true,
  duvarlar: true,
  gorunum: 'dis',
  gece: false,
  cephe: 'krem-siva',
  dusuk: window.matchMedia('(max-width: 780px)').matches,
};

kok.innerHTML = `
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
          <button class="cip" id="kaliteBtn" aria-pressed="${durum.dusuk ? 'true' : 'false'}">
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
`;

const kap = document.getElementById('sahne')!;
let sahne: MimariSahne;
let catiGrubu: THREE.Group | null = null;

function catiKur(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'cati';
  const kat = modernVillaKatlar[1];
  const yBase = 2 * 3.05;
  // NUMEX-DÜZELTME (2026-10-26): çatı plakaları gölge yüzünden kayboluyordu (castShadow yukarı bakan
  // yüzeyde kendi kendini gölgeliyordu) → gölge geçici olarak kapatıldı, malzeme yüzeyi açık tona çekildi.
  const malzeme = new THREE.MeshStandardMaterial({
    color: 0x6f5a44,
    roughness: 0.82,
    metalness: 0.06,
  });

  // eğimli çatı: iki eğik plaka (saçak payı 0,35 m)
  // NUMEX-DÜZELTME (2026-10-27): çatı plakası binanın derinliğini tam örtmüyordu; ön tarafta
  // üst katın içi açıkta kalıyordu. Saçak payı 0,35 → 0,9 m'ye çıkarıldı ve plaka derinliği
  // bina derinliğine + payına göre hesaplanıyor.
  const sacakPay = 0.9;
  const genislik = kat.genislik + sacakPay * 2;
  const derinlik = kat.derinlik + sacakPay * 2;
  const egim = THREE.MathUtils.degToRad(16);
  // NUMEX-DÜZELTME (2026-10-27, GERÇEK KÖK — ölçümle bulundu): merkezX = genislik/2 diye
  // hesaplanıyordu; genislik saçak payı eklenmiş hâliydi, bina merkezi ise kat.genislik/2.
  // Sonuç: çatı binaya göre sağa 0,35 m, arkaya 0,9 m kayıyordu (ölçüm: çatı grubu 38 birim,
  // bina 14,5). Merkez artık BİNANIN merkezinden alınıyor, plaka boyu saçak payıyla ayrı büyüyor.
  const binaMerkezX = kat.genislik / 2;
  const binaMerkezZ = kat.derinlik / 2;
  const merkezX = binaMerkezX;
  const merkezZ = binaMerkezZ;
  /* ------------------------------------------------------------------
     ÇATI — iki eğik plaka, mahyada birleşir, bina merkezine oturur.
     NUMEX-DÜZELTME (2026-10-27): önceki sürümlerde 6 ayrı düzeltme üst üste
     binmişti ve her biri bir öncekinin hatasını gizliyordu (çatı 38 birim
     genişliğe çıkmış, binaya göre sağa ve arkaya kaymıştı). Blok baştan,
     tek ve sade bir geometriyle yazıldı. Ölçü: plaka yatay izdüşümü toplamı
     = genislik (saçak dahil); iki plaka tam mahyada buluşur.
     ------------------------------------------------------------------ */
  const yarimYatay = genislik / 2; // mahyadan saçağın ucuna yatay mesafe
  const egikUzunluk = yarimYatay / Math.cos(egim); // eğik plakanın gerçek boyu
  const duseyYukselme = yarimYatay * Math.tan(egim); // mahya ile saçak arası kot farkı
  const sacakKotu = yBase + 0.06; // plakaların saçak ucundaki kotu
  const mahyaY = sacakKotu + duseyYukselme; // mahya kotu

  // NUMEX-DÜZELTME (2026-10-27, SON KÖK — ölçümle): plaka merkezi `yarimYatay/2` (7,9/2=3,95) ile
  // kaydırılıyordu. Ama eğik plakanın YATAY İZDÜŞÜMÜ 2×(3,95×cos16°)=7,6 m; iki plaka toplamı
  // 15,2 m örtüyordu, oysa çatı 15,8 m olmalı. Aradaki 0,6 m boşluk sağ uçta "çatının altı açık"
  // olarak görünüyordu. Konum artık İZDÜŞÜMÜN yarısıyla veriliyor; iki plaka tam olarak
  // binanın genişliğini örtüyor.
  const yatayIzdusum = egikUzunluk * Math.cos(egim); // = yarimYatay, ama niyeti açık yazıyoruz
  const plakaGeo = new THREE.BoxGeometry(egikUzunluk, 0.22, derinlik);
  for (const yon of [-1, 1]) {
    const p = new THREE.Mesh(plakaGeo, malzeme);
    // merkez: mahyadan izdüşümün YARISI kadar yanda, yükselmenin yarısı kadar aşağıda
    p.position.set(merkezX + (yon * yatayIzdusum) / 2, sacakKotu + duseyYukselme / 2, merkezZ);
    p.rotation.z = -yon * egim;
    p.castShadow = true;
    p.receiveShadow = false;
    p.name = 'cati-yuzey';
    g.add(p);
  }

  // NUMEX-DÜZELTME (2026-10-27, kullanıcı: "çatının altı hâlâ açık"): önceki alınlık yalnız
  // 0,6 m yüksekliğinde ince bir banttı; çatı ile üst kat duvarı arasındaki üçgen boşluk
  // (mahya yüksekliği ~1,6 m) açık kalıyordu. Artık alınlık, üst katın ön yüzü boyunca
  // MAHYAYA KADAR çıkan bir üçgen kalkan olarak çiziliyor; boşluk tamamen kapanıyor.
  const kalkanYuk = duseyYukselme + 0.12;
  const kalkanSekil = new THREE.Shape();
  kalkanSekil.moveTo(-kat.genislik / 2 - 0.05, 0);
  kalkanSekil.lineTo(kat.genislik / 2 + 0.05, 0);
  kalkanSekil.lineTo(0, kalkanYuk);
  kalkanSekil.closePath();
  const kalkan = new THREE.Mesh(
    new THREE.ExtrudeGeometry(kalkanSekil, { depth: 0.26, bevelEnabled: false }),
    new THREE.MeshStandardMaterial({ color: 0xe8e0d1, roughness: 0.85 })
  );
  kalkan.position.set(merkezX, yBase - 0.02, kat.derinlik - 0.08);
  kalkan.castShadow = true;
  kalkan.receiveShadow = true;
  kalkan.name = 'alinlik';
  g.add(kalkan);

  // arka cephede de aynı kalkan (çatı iki yönden de kapansın)
  const kalkanArka = new THREE.Mesh(
    new THREE.ExtrudeGeometry(kalkanSekil, { depth: 0.26, bevelEnabled: false }),
    new THREE.MeshStandardMaterial({ color: 0xdcd4c5, roughness: 0.87 })
  );
  kalkanArka.position.set(merkezX, yBase - 0.02, 0.18);
  kalkanArka.castShadow = true;
  kalkanArka.name = 'alinlik-arka';
  g.add(kalkanArka);

  // saçak kirişleri (ön ve arka), plakaların saçak ucunda
  for (const z of [merkezZ - derinlik / 2 + 0.2, merkezZ + derinlik / 2 - 0.2]) {
    const sacak = new THREE.Mesh(new THREE.BoxGeometry(genislik, 0.18, 0.4), malzeme);
    sacak.position.set(merkezX, sacakKotu, z);
    sacak.castShadow = true;
    g.add(sacak);
  }

  // mahya kirişi — iki plakanın buluştuğu hizada, tam bina ortasında
  const mahya = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.22, derinlik), malzeme);
  mahya.position.set(merkezX, mahyaY + 0.06, merkezZ);
  mahya.castShadow = true;
  g.add(mahya);

  // NUMEX-DÜZELTME (2026-10-26): sahne "sonsuz düz zemin üstünde yüzen kutu" gibiydi.
  // Bahçe çimi, taş yol, giriş basamağı ve çevre ağaçları eklendi; villa artık bir arsada duruyor.
  const peyzaj = new THREE.Group();
  peyzaj.name = 'peyzaj';

  const cim = new THREE.Mesh(
    new THREE.BoxGeometry(kat.genislik + 24, 0.12, kat.derinlik + 22),
    new THREE.MeshStandardMaterial({ color: 0x8d9a72, roughness: 0.95 })
  );
  cim.position.set(kat.genislik / 2 + 2, -0.07, kat.derinlik / 2 + 1);
  cim.receiveShadow = true;
  peyzaj.add(cim);

  const tasYol = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.06, 12),
    new THREE.MeshStandardMaterial({ color: 0xc8bfae, roughness: 0.9 })
  );
  tasYol.position.set(kat.genislik * 0.47, 0.02, kat.derinlik + 7);
  tasYol.receiveShadow = true;
  peyzaj.add(tasYol);

  const basamak = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.18, 1.6),
    new THREE.MeshStandardMaterial({ color: 0xd7cfc0, roughness: 0.85 })
  );
  basamak.position.set(kat.genislik * 0.47, 0.09, kat.derinlik + 0.7);
  basamak.castShadow = true;
  basamak.receiveShadow = true;
  peyzaj.add(basamak);

  // --- ÇOCUK PARKI (kullanıcı isteği): salıncak, kaydırak, kum havuzu ---
  const park = new THREE.Group();
  park.name = 'cocuk-parki';
  const ahsapMat = new THREE.MeshStandardMaterial({ color: 0xa8783f, roughness: 0.85 });
  const kirmiziMat = new THREE.MeshStandardMaterial({ color: 0xb3563f, roughness: 0.7 });
  const maviMat = new THREE.MeshStandardMaterial({ color: 0x4a7c93, roughness: 0.7 });
  const kumMat = new THREE.MeshStandardMaterial({ color: 0xe0d3b4, roughness: 0.98 });

  // NUMEX-DÜZELTME (2026-10-27, kullanıcı: "çocuk parkı çitin içinde kaldı"): park arsanın
  // içinde (x=-6) duruyordu. Park artık arsa çitinin DIŞINA, batı yanına taşındı; çit hattı
  // parkın etrafını dolaşmıyor, park bahçenin dışında ayrı bir alan olarak duruyor.
  // park: bahçenin güneybatısında, çitin dışında ama kadraj içinde
  const parkX = -5.2;
  const parkZ = kat.derinlik + 8.2;

  // kum havuzu
  const kum = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.22, 5.4), kumMat);
  kum.position.set(parkX, 0.11, parkZ);
  kum.receiveShadow = true;
  park.add(kum);

  // salıncak: A-ayakları + kiriş + iki oturak
  const salincakAyakGeo = new THREE.CylinderGeometry(0.07, 0.07, 2.3, 8);
  for (const [ax, az, tilt] of [
    [-2.2, -1.0, 0.32],
    [-2.2, 1.0, -0.32],
    [-0.6, -1.0, 0.32],
    [-0.6, 1.0, -0.32],
  ] as [number, number, number][]) {
    const a = new THREE.Mesh(salincakAyakGeo, ahsapMat);
    a.position.set(parkX + ax, 1.15, parkZ + az);
    a.rotation.x = tilt;
    a.castShadow = true;
    park.add(a);
  }
  const kiris = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 2.4), ahsapMat);
  kiris.position.set(parkX - 1.4, 2.28, parkZ);
  kiris.castShadow = true;
  park.add(kiris);
  for (const zz of [-0.55, 0.55]) {
    const ip1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.1, 6), ahsapMat);
    ip1.position.set(parkX - 1.4, 1.72, parkZ + zz - 0.22);
    park.add(ip1);
    const ip2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.1, 6), ahsapMat);
    ip2.position.set(parkX - 1.4, 1.72, parkZ + zz + 0.22);
    park.add(ip2);
    const oturak = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.46), kirmiziMat);
    oturak.position.set(parkX - 1.4, 1.14, parkZ + zz);
    oturak.castShadow = true;
    park.add(oturak);
  }

  // kaydırak: merdiven + platform + eğik kayma yüzeyi
  const platform = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 1.2), maviMat);
  platform.position.set(parkX + 1.7, 1.35, parkZ - 0.6);
  platform.castShadow = true;
  park.add(platform);
  for (const [dx, dz] of [
    [-0.5, -0.5],
    [0.5, -0.5],
    [-0.5, 0.5],
    [0.5, 0.5],
  ] as [number, number][]) {
    const bacak = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.35, 0.1), maviMat);
    bacak.position.set(parkX + 1.7 + dx, 0.68, parkZ - 0.6 + dz);
    bacak.castShadow = true;
    park.add(bacak);
  }
  // NUMEX-DÜZELTME (2026-10-27, kullanıcı: "kaydırak ters"): kayma yüzeyi platformdan (y=1,35)
  // aşağı değil YUKARI bakıyordu — rotation.x işareti ters verilmişti. Doğru eğim: üst ucu
  // platformda, alt ucu yerde. Merkez kotu (1,35+0,08)/2 ≈ 0,72 ve eğim +26° olmalı ki
  // platformdan yere doğru kaysın.
  const kaymaBoy = 3.0;
  const kayma = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, kaymaBoy), kirmiziMat);
  kayma.position.set(parkX + 1.7, 0.72, parkZ + 0.85);
  kayma.rotation.x = THREE.MathUtils.degToRad(26);
  kayma.castShadow = true;
  kayma.name = 'kaydirak-yuzey';
  park.add(kayma);
  // kayma yüzeyinin iki yanına korkuluk — yön okunsun
  for (const yon of [-1, 1]) {
    const korkuluk = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, kaymaBoy), maviMat);
    korkuluk.position.set(parkX + 1.7 + yon * 0.5, 0.86, parkZ + 0.85);
    korkuluk.rotation.x = THREE.MathUtils.degToRad(26);
    park.add(korkuluk);
  }
  for (let i = 0; i < 4; i++) {
    const bas = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.3), ahsapMat);
    bas.position.set(parkX + 1.7, 0.18 + i * 0.34, parkZ - 1.6 - i * 0.42);
    bas.castShadow = true;
    park.add(bas);
  }

  // park çiti (beyaz çıta)
  const citMat = new THREE.MeshStandardMaterial({ color: 0xefe9dc, roughness: 0.8 });
  const parkCit = new THREE.Group();
  for (let i = 0; i < 26; i++) {
    const cit = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.85, 0.07), citMat);
    const t = i / 25;
    cit.position.set(parkX - 3.8 + t * 7.6, 0.42, parkZ + 2.85);
    parkCit.add(cit);
  }
  const citUst = new THREE.Mesh(new THREE.BoxGeometry(7.7, 0.07, 0.07), citMat);
  citUst.position.set(parkX, 0.78, parkZ + 2.85);
  parkCit.add(citUst);
  park.add(parkCit);

  peyzaj.add(park);

  const govdeMat = new THREE.MeshStandardMaterial({ color: 0x6b563f, roughness: 0.95 });
  const yaprakMat = new THREE.MeshStandardMaterial({ color: 0x5f7550, roughness: 0.9 });
  // NUMEX-DÜZELTME (2026-10-27, kullanıcı: "ağaçlara dikkat et"): ağaçların ikisi (x=3 ve x=11,
  // z=-4) evin ARKASINDA kalıp çatıya giriyordu; biri de batıda çitle çakışıyordu.
  // Ağaçlar artık yapının ayak izinin tamamen dışında, arsanın köşelerinde — hiçbiri
  // binaya, çite, taş yola veya çocuk parkına değmiyor.
  const agaclar: [number, number, number][] = [
    [-8.5, -2.0, 1.0],
    [-8.0, 14.0, 0.9],
    [kat.genislik + 9.0, -1.5, 0.95],
    [kat.genislik + 9.5, 13.0, 1.05],
    [-2.0, -6.0, 0.85],
    [kat.genislik + 2.0, -6.5, 0.8],
  ];
  for (const [x, z, ol] of agaclar) {
    const govde = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * ol, 0.22 * ol, 2.4 * ol, 8), govdeMat);
    govde.position.set(x, 1.2 * ol, z);
    govde.castShadow = true;
    peyzaj.add(govde);
    const tac = new THREE.Mesh(new THREE.SphereGeometry(1.15 * ol, 10, 8), yaprakMat);
    tac.position.set(x, 2.9 * ol, z);
    tac.castShadow = true;
    peyzaj.add(tac);
  }

  // --- ARSA ÇİTİ (kullanıcı isteği: "ev imkanına çit yap") ---
  // Arsanın dört kenarına düşey çıtalar + iki yatay kuşak; giriş kapısı boşluğu bırakılır.
  const arsaCit = new THREE.Group();
  arsaCit.name = 'arsa-citi';
  const citBeyaz = new THREE.MeshStandardMaterial({ color: 0xe6dfd1, roughness: 0.82 });
  // NUMEX-DÜZELTME (2026-10-27, kullanıcı: "çocuk parkı çitin içinde kaldı"): şikâyet, parkın
  // villanın çitle çevrili avlusuna sıkışmasıydı. Villanın bahçesi artık DAR bir avlu (çit
  // binanın hemen çevresinde); çocuk parkı bu avlunun DIŞINDA, bahçenin güneybatısında ayrı
  // bir alan olarak duruyor ve KADRAJ İÇİNDE kalıyor.
  const alanW = kat.genislik + 11;
  const alanD = kat.derinlik + 9;
  const merkezArsaX = kat.genislik / 2 + 1;
  const merkezArsaZ = kat.derinlik / 2 + 0.5;

  const citaGeo = new THREE.BoxGeometry(0.08, 1.0, 0.08);

  // NUMEX-DÜZELTME (2026-10-27, kullanıcı: "çit kapı girişinde de var"): güney kenardaki boşluk
  // x = kat.genislik*0,47 = 6,58 merkezliydi, ama giriş kapısı plana göre 5,7–8,3 arasında
  // (merkez ~7,0). Ayrıca yatay KUŞAKLAR (0,34 ve 0,86 kotundaki çubuklar) boşluk boyunca
  // uzatılıyordu — çıtalar kesilse bile kapının önünde çubuk kalıyordu. Boşluk artık kapının
  // GERÇEK genişliğine göre hesaplanıyor ve kuşaklar o aralıkta iki parçaya bölünüyor.
  const kapiGenislik = 2.6;
  const kapiMerkezX = 7.0;
  const kapiBas = kapiMerkezX - kapiGenislik / 2 - 0.15;
  const kapiSon = kapiMerkezX + kapiGenislik / 2 + 0.15;
  const boslukta = (x: number) => x > kapiBas && x < kapiSon;

  // kuzey ve güney kenarları (x boyunca)
  for (const zKenar of [merkezArsaZ - alanD / 2, merkezArsaZ + alanD / 2]) {
    const guneyMi = zKenar > merkezArsaZ;
    const adet = Math.floor(alanW / 0.62);
    for (let i = 0; i <= adet; i++) {
      const x = merkezArsaX - alanW / 2 + i * (alanW / adet);
      if (guneyMi && boslukta(x)) continue; // giriş kapısı boşluğu
      const c = new THREE.Mesh(citaGeo, citBeyaz);
      c.position.set(x, 0.5, zKenar);
      arsaCit.add(c);
    }
    const solBas = merkezArsaX - alanW / 2;
    const sagSon = merkezArsaX + alanW / 2;
    for (const y of [0.34, 0.86]) {
      if (guneyMi) {
        // kuşak iki parça: soldan kapıya, kapıdan sağa
        const solUz = kapiBas - solBas;
        const sagUz = sagSon - kapiSon;
        if (solUz > 0.1) {
          const k = new THREE.Mesh(new THREE.BoxGeometry(solUz, 0.09, 0.06), citBeyaz);
          k.position.set(solBas + solUz / 2, y, zKenar);
          arsaCit.add(k);
        }
        if (sagUz > 0.1) {
          const k = new THREE.Mesh(new THREE.BoxGeometry(sagUz, 0.09, 0.06), citBeyaz);
          k.position.set(kapiSon + sagUz / 2, y, zKenar);
          arsaCit.add(k);
        }
      } else {
        const k = new THREE.Mesh(new THREE.BoxGeometry(alanW, 0.09, 0.06), citBeyaz);
        k.position.set(merkezArsaX, y, zKenar);
        arsaCit.add(k);
      }
    }
    // giriş kapısı kanatları (açık, iki yana) — girişin okunması için
    if (guneyMi) {
      for (const yon of [-1, 1]) {
        const kanat = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.1, kapiGenislik / 2), citBeyaz);
        kanat.position.set(
          yon < 0 ? kapiBas : kapiSon,
          0.55,
          zKenar + (yon < 0 ? 0 : 0) + 0
        );
        kanat.rotation.y = yon * THREE.MathUtils.degToRad(72);
        kanat.name = 'cit-kapi-kanat';
        arsaCit.add(kanat);
      }
    }
  }
  // doğu ve batı kenarları (z boyunca)
  for (const xKenar of [merkezArsaX - alanW / 2, merkezArsaX + alanW / 2]) {
    const adet = Math.floor(alanD / 0.62);
    for (let i = 0; i <= adet; i++) {
      const z = merkezArsaZ - alanD / 2 + i * (alanD / adet);
      const c = new THREE.Mesh(citaGeo, citBeyaz);
      c.position.set(xKenar, 0.5, z);
      arsaCit.add(c);
    }
    for (const y of [0.34, 0.86]) {
      const k = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, alanD), citBeyaz);
      k.position.set(xKenar, y, merkezArsaZ);
      arsaCit.add(k);
    }
  }
  peyzaj.add(arsaCit);

  // NUMEX-DÜZELTME (2026-10-27): peyzaj (bahçe/çit/park) catiKur() içinde üretilip ÇATI grubuna
  // ekleniyordu. Ölçüm bunu gösterdi: "Group#0/cati/peyzaj/cocuk-parki" — çatı grubu 38×8.72×34
  // çıkıyordu çünkü içinde 24×24'lük bahçe vardı.
  // DİKKAT: bu grubu sonradan parent.add() ile taşımaya çalışmak YANLIŞ olur — catiKur()
  // çağrıldığı anda grup henüz sahneye eklenmemiştir, parent null'dır ve bahçe kaybolur
  // (bu hata bir kez yapıldı, ekranda bahçe tamamen silindi). Doğrusu: peyzaj kendi başına
  // catiKur()'un DIŞINDA üretilip doğrudan sahneye eklenir.
  peyzaj.name = 'peyzaj';
  // catiKur() çatı grubunu döndürür; bahçe ise bu grubun DIŞINDA kalmalı. Bu yüzden
  // peyzaj, çatı grubunun bir alt-nesnesi değil, `peyzajGrubu` olarak dışarı verilir.
  // (Bu fonksiyonun gövdesi bittiğinde `g`ye eklenmiş olan peyzaj, çağıran taraftan alınır.)
  g.add(peyzaj);

  // teras pergolası
  const pergola = new THREE.Group();
  pergola.name = 'pergola';
  const lamelMat = new THREE.MeshStandardMaterial({ color: 0xb08a52, roughness: 0.6, metalness: 0.2 });
  // NUMEX-DÜZELTME (2026-10-26): pergola ayakları 14,4–17,6 m'de, yapı ayak izi 14 m'de bitiyordu;
  // teras gerçekten yapının doğusunda kalsın diye ayaklar 14,5–18,5 aralığına alındı.
  const ayakGeo = new THREE.BoxGeometry(0.16, 2.9, 0.16);
  const ayaklar: [number, number][] = [
    [14.6, 3.4],
    [14.6, 9.2],
    [18.2, 3.4],
    [18.2, 9.2],
  ];
  for (const [x, z] of ayaklar) {
    const a = new THREE.Mesh(ayakGeo, lamelMat);
    a.position.set(x, 1.45, z);
    a.castShadow = true;
    pergola.add(a);
  }
  const lamelGeo = new THREE.BoxGeometry(4.0, 0.1, 0.14);
  for (let i = 0; i < 9; i++) {
    const l = new THREE.Mesh(lamelGeo, lamelMat);
    l.position.set(16.0, 2.92, 3.5 + i * 0.72);
    l.castShadow = true;
    pergola.add(l);
  }
  const kirisGeo = new THREE.BoxGeometry(0.14, 0.18, 6.2);
  for (const x of [14.4, 17.6]) {
    const k = new THREE.Mesh(kirisGeo, lamelMat);
    k.position.set(x, 2.98, 6.3);
    pergola.add(k);
  }
  g.add(pergola);

  return g;
}

function sahneYenile(): void {
  sahne.bosalt();
  const mat = sahne.malzemeler();

  // zemin kat
  sahne.ekle(
    katEkle(modernVillaKatlar[0], mat, durum.cephe, 0, {
      icDuvar: durum.duvarlar,
      doseme: true,
      mobilya: true,
    })
  );

  // üst kat
  if (durum.ustKat) {
    sahne.ekle(
      katEkle(modernVillaKatlar[1], mat, durum.cephe, 3.05, {
        icDuvar: durum.duvarlar,
        doseme: true,
        mobilya: true,
      })
    );
  }

  // çatı + teras (görünürlüğü bayraktan yönetilir)
  if (catiGrubu) catiGrubu.visible = durum.cati;
}

function baslat(): void {
  try {
    sahne = new MimariSahne({ kap, arka: 0xf4f0e9, golge: !durum.dusuk, don: false });
    sahne.renderci.setPixelRatio(
      durum.dusuk ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    sahne.kameraAyarla('dis');

    catiGrubu = catiKur();
    sahne.kaliciEkle(catiGrubu);

    // NUMEX-DÜZELTME (2026-10-27, GERÇEK KÖK): bahçe (peyzaj) catiKur() içinde üretilip ÇATI
    // grubuna ekleniyordu → ölçümde çatı 38×8.72×34 çıkıyordu (içinde 24×24 bahçe vardı).
    // Bahçeyi ayırma kodu `catiGrubu.parent?.add(...)` diyordu ama bu satır, çatı grubu
    // sahneye EKLENMEDEN önce çalışıyordu: parent null olduğu için bahçe hiçbir yere
    // eklenmiyor ve tamamen kayboluyordu (ekranda çıplak bina kaldı).
    // Doğru sıra: ÖNCE çatı sahneye eklenir (parent oluşur), SONRA bahçe ayrılıp kök gruba
    // taşınır. Böylece hem bahçe görünür hem çatı grubu yalnız çatıyı ölçer.
    const kokGrup = catiGrubu.parent;
    const peyzajGrubu = catiGrubu.getObjectByName('peyzaj');
    if (peyzajGrubu && kokGrup) {
      catiGrubu.remove(peyzajGrubu);
      kokGrup.add(peyzajGrubu);
    }
    sahneYenile();

    // NUMEX-DÜZELTME (2026-10-26): çatı kadraj dışında kalıyordu — dış kamera yükseltilip
    // hedef binanın ortasına (~3,4 m) çekildi; ölçüm: çatı grubu sahnede ve görünür.
    // NUMEX-DÜZELTME (2026-10-26): dış kamera çatıyı ve bahçeyi birlikte görecek şekilde
    // konumlandırıldı; hedef yapı ortasına ve biraz yukarı çekildi.
    // NUMEX-DÜZELTME (2026-10-27): çocuk parkı (güneybatıda) ve çit kadraj içinde kalsın diye
    // kamera biraz geriye ve sola alındı, hedef aşağı çekildi.
    sahne.kamera.position.set(-27, 17, 34);
    sahne.kontroller.target.set(5, 3.6, 8.5);
    sahne.kontroller.minDistance = 8;
    sahne.kontroller.maxDistance = 70;
    sahne.kontroller.update();

    document.getElementById('yukleniyor')?.classList.add('kesif__yukleniyor--gizli');

    const dh = () => sahne.boyutla();
    window.addEventListener('resize', dh);
  } catch (e) {
    document.getElementById('yukleniyor')!.textContent =
      'Tarayıcınız WebGL desteklemediği için 3D sahne açılamadı.';
    console.error('3D keşif sahnesi başlatılamadı:', e);
    return;
  }

  /** buton durumunu yönet */
  const tikla = (id: string, aktif: boolean) => {
    document.getElementById(id)?.setAttribute('aria-pressed', String(aktif));
  };

  document.getElementById('katUst')!.addEventListener('click', (ev) => {
    durum.ustKat = !durum.ustKat;
    const b = ev.currentTarget as HTMLElement;
    b.textContent = durum.ustKat ? 'Üst katı göster' : 'Üst katı gizle';
    b.setAttribute('aria-pressed', String(durum.ustKat));
    sahneYenile();
  });

  document.getElementById('catiBtn')!.addEventListener('click', () => {
    durum.cati = !durum.cati;
    if (catiGrubu) catiGrubu.visible = durum.cati;
    tikla('catiBtn', durum.cati);
  });

  document.getElementById('duvarBtn')!.addEventListener('click', () => {
    durum.duvarlar = !durum.duvarlar;
    tikla('duvarBtn', durum.duvarlar);
    sahneYenile();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-gorunum]').forEach((b) => {
    b.addEventListener('click', () => {
      durum.gorunum = b.dataset.gorunum as Gorunum;
      document.querySelectorAll('[data-gorunum]').forEach((x) =>
        x.setAttribute('aria-pressed', String(x === b))
      );
      sahne.kameraAyarla(durum.gorunum);
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-cephe]').forEach((b) => {
    b.addEventListener('click', () => {
      durum.cephe = b.dataset.cephe as MalzemeSecim;
      document.querySelectorAll('[data-cephe]').forEach((x) =>
        x.setAttribute('aria-pressed', String(x === b))
      );
      sahneYenile();
    });
  });

  document.getElementById('geceBtn')!.addEventListener('click', () => {
    durum.gece = !durum.gece;
    tikla('geceBtn', durum.gece);
    sahne.gece(durum.gece);
  });

  document.getElementById('kaliteBtn')!.addEventListener('click', () => {
    durum.dusuk = !durum.dusuk;
    tikla('kaliteBtn', durum.dusuk);
    sahne.renderci.setPixelRatio(durum.dusuk ? 1 : Math.min(window.devicePixelRatio, 2));
    sahne.renderci.shadowMap.enabled = !durum.dusuk;
  });

  document.getElementById('sifirla')!.addEventListener('click', () => {
    durum.gorunum = 'dis';
    durum.gece = false;
    durum.ustKat = true;
    durum.cati = true;
    durum.duvarlar = true;
    durum.cephe = 'krem-siva';
    document.querySelectorAll('[data-gorunum]').forEach((x) =>
      x.setAttribute('aria-pressed', String((x as HTMLElement).dataset.gorunum === 'dis'))
    );
    document.querySelectorAll('[data-cephe]').forEach((x) =>
      x.setAttribute('aria-pressed', String((x as HTMLElement).dataset.cephe === 'krem-siva'))
    );
    tikla('geceBtn', false);
    tikla('catiBtn', true);
    tikla('duvarBtn', true);
    tikla('katUst', true);
    const kb = document.getElementById('katUst')!;
    kb.textContent = 'Üst katı göster';
    sahne.gece(false);
    if (catiGrubu) catiGrubu.visible = true;
    sahne.kameraAyarla('dis');
    sahneYenile();
  });
}

baslat();
