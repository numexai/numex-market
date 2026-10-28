
        /**
         * Numex Codex Resim Düzenleyici
         * Saf Canvas API — harici kütüphane yok.
         * Modüler yaklaşım: her davranış (durum, canvas, görüntü, filtre,
         * kırpma, döndürme, işlemler) kendi küçük nesnesinde toplanır.
         */
        (function () {
            'use strict';

            /* ==========================================================
             * 1. DURUM (State) — Uygulamanın tek gerçek kaynağı
             * ========================================================== */
            const State = {
                originalImage: null,      // Orijinal Image nesnesi (yüklenen)
                displayImage: null,       // Mevcut düzenlenmiş Image (kırp/döndür sonrası)
                brightness: 100,          // % (100 = nötr)
                contrast: 100,            // % (100 = nötr)
                saturation: 100,          // % (100 = nötr)
                grayscale: false,         // Gri tonlama aktif mi
                sepia: false,             // Sepia aktif mi
                cropMode: false,          // Kırpma modu açık mı

                // Orijinal değerlere dönmek için saklanan yedek
                backup() {
                    return {
                        displayImage: this.displayImage,
                        brightness: this.brightness,
                        contrast: this.contrast,
                        saturation: this.saturation,
                        grayscale: this.grayscale,
                        sepia: this.sepia
                    };
                },
                restore(snapshot) {
                    this.displayImage = snapshot.displayImage;
                    this.brightness = snapshot.brightness;
                    this.contrast = snapshot.contrast;
                    this.saturation = snapshot.saturation;
                    this.grayscale = snapshot.grayscale;
                    this.sepia = snapshot.sepia;
                }
            };

            /* ==========================================================
             * 2. DOM YARDIMCILARI — Element erişimini tek yerden yönet
             * ========================================================== */
            const Dom = {
                fileInput: document.getElementById('imageLoader'),
                canvas: document.getElementById('imageCanvas'),
                ctx: null,

                init() {
                    this.ctx = this.canvas.getContext('2d');
                }
            };

            /* ==========================================================
             * 3. GÖRÜNTÜ (Image) — Yükleme, ayarlama, sıfırlama
             * ========================================================== */
            const ImageManager = {
                load(file) {
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                            State.originalImage = img;
                            State.displayImage = img;
                            resetAdjustments();
                            CanvasD.setup(img.width, img.height);
                            Renderer.render();
                        };
                        img.onerror = () => alert('Resim yüklenemedi! Lütfen geçerli bir resim dosyası seçin.');
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            };

            /* ==========================================================
             * 4. CANVAS — Boyut ayarlama ve tuvale çizim
             * ========================================================== */
            const CanvasD = {
                setup(width, height) {
                    const maxW = 800, maxH = 600;
                    let w = width, h = height;
                    if (w > maxW || h > maxH) {
                        const ratio = Math.min(maxW / w, maxH / h);
                        w = Math.round(w * ratio);
                        h = Math.round(h * ratio);
                    }
                    Dom.canvas.width = w;
                    Dom.canvas.height = h;
                },
                get ctx() { return Dom.ctx; }
            };

            /* ==========================================================
             * 5. RENDER; — Tüm görsel ayarları uygulayıp tuvale çizer
             * ========================================================== */
            const Renderer = {
                render() {
                    const img = State.displayImage;
                    if (!img) return;
                    const ctx = CanvasD.ctx;

                    // Mevcut kanvas boyutuna resmi sığdır (boyut korunsun)
                    CanvasD.setup(img.width, img.height);
                    ctx.clearRect(0, 0, Dom.canvas.width, Dom.canvas.height);
                    ctx.drawImage(img, 0, 0, Dom.canvas.width, Dom.canvas.height);

                    // CSS filtreleri tek seferde birleştirip uygula
                    let filterString = 'none';
                    if (State.brightness !== 100 || State.contrast !== 100 || State.saturation !== 100
                        || State.grayscale || State.sepia) {
                        const parts = [];
                        parts.push('brightness(' + State.brightness + '%)');
                        parts.push('contrast(' + State.contrast + '%)');
                        parts.push('saturate(' + State.saturation + '%)');
                        if (State.grayscale) parts.push('grayscale(1)');
                        if (State.sepia) parts.push('sepia(1)');
                        filterString = parts.join(' ');
                    }
                    ctx.filter = filterString;
                    ctx.drawImage(img, 0, 0, Dom.canvas.width, Dom.canvas.height);
                    ctx.filter = 'none'; // Sonraki çizimleri etkilemesin
                }
            };

            /* ==========================================================
             * 6. AYARLAR (Filters) — Parlaklık/kontrast/doygunluk + renk filtreleri
             * ========================================================== */
            const Adjustments = {
                brightness() { State.brightness = +DomBrightness.value; Renderer.render(); },
                contrast() { State.contrast = +DomContrast.value; Renderer.render(); },
                saturation() { State.saturation = +DomSaturation.value; Renderer.render(); },
                toggleGrayscale() {
                    State.grayscale = !State.grayscale;
                    if (State.grayscale) State.sepia = false; // ikisi birden olmaz
                    updateFilterButtons();
                    Renderer.render();
                },
                toggleSepia() {
                    State.sepia = !State.sepia;
                    if (State.sepia) State.grayscale = false;
                    updateFilterButtons();
                    Renderer.render();
                },
                reset() {
                    State.brightness = 100;
                    State.contrast = 100;
                    State.saturation = 100;
                    State.grayscale = false;
                    State.sepia = false;
                    updateFilterButtons();
                    syncSliders();
                    Renderer.render();
                }
            };

            /* ==========================================================
             * 7. KIRPMA (Crop) — Sürükleme ile bölge seç, naklet
             * ========================================================== */
            const Crop = {
                startX: 0, startY: 0, endX: 0, endY: 0,
                active: false,

                enterMode() {
                    if (!State.displayImage) { alert('Önce bir resim yükleyin!'); return; }
                    State.cropMode = true;
                    this.capture();
                },

                capture() {
                    State.cropMode = true;
                    const rect = Dom.canvas.getBoundingClientRect();
                    const scaleX = Dom.canvas.width / rect.width;
                    const scaleY = Dom.canvas.height / rect.height;

                    Dom.canvas.style.cursor = 'crosshair';
                    const onMouseDown = (e) => {
                        this.active = true;
                        this.startX = (e.clientX - rect.left) * scaleX;
                        this.startY = (e.clientY - rect.top) * scaleY;
                        this.endX = this.startX;
                        this.endY = this.startY;
                    };
                    const onMouseMove = (e) => {
                        if (!this.active) return;
                        this.endX = (e.clientX - rect.left) * scaleX;
                        this.endY = (e.clientY - rect.top) * scaleY;
                        this.drawOverlay();
                    };
                    const onMouseUp = () => {
                        if (!this.active) return;
                        this.active = false;
                        Dom.canvas.style.cursor = 'default';
                        this.commit();
                        Dom.canvas.removeEventListener('mousedown', onMouseDown);
                        Dom.canvas.removeEventListener('mousemove', onMouseMove);
                        Dom.canvas.removeEventListener('mouseup', onMouseUp);
                    };

                    Dom.canvas.addEventListener('mousedown', onMouseDown);
                    Dom.canvas.addEventListener('mousemove', onMouseMove);
                    Dom.canvas.addEventListener('mouseup', onMouseUp);
                },

                drawOverlay() {
                    const ctx = CanvasD.ctx;
                    ctx.clearRect(0, 0, Dom.canvas.width, Dom.canvas.height);
                    // Orijinal görüntüyü çiz, sonra seçimi vurgula
                    ctx.drawImage(State.displayImage, 0, 0, Dom.canvas.width, Dom.canvas.height);
                    const x = Math.min(this.startX, this.endX);
                    const y = Math.min(this.startY, this.endY);
                    const w = Math.abs(this.endX - this.startX);
                    const h = Math.abs(this.endY - this.startY);

                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    // Dört kenar boyunca karart
                    ctx.fillRect(0, 0, Dom.canvas.width, y);
                    ctx.fillRect(0, y + h, Dom.canvas.width, Dom.canvas.height - (y + h));
                    ctx.fillRect(0, y, x, h);
                    ctx.fillRect(x + w, y, Dom.canvas.width - (x + w), h);

                    ctx.strokeStyle = 'rgba(0, 123, 255, 0.9)';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w, h);
                },

                commit() {
                    const x = Math.min(this.startX, this.endX);
                    const y = Math.min(this.startY, this.endY);
                    const w = Math.abs(this.endX - this.startX);
                    const h = Math.abs(this.endY - this.startY);

                    if (w < 5 || h < 5) {
                        Renderer.render(); // Çok küçük seçim → iptal
                        return;
                    }

                    // Yeni bir offscreen canvas'ta seçilen bölgeyi kırp
                    const cropCanvas = document.createElement('canvas');
                    cropCanvas.width = Math.round(w);
                    cropCanvas.height = Math.round(h);
                    const cropCtx = cropCanvas.getContext('2d');
                    cropCtx.drawImage(State.displayImage, Math.round(x), Math.round(y), Math.round(w), Math.round(h), 0, 0, Math.round(w), Math.round(h));

                    // Kırpılmış görüntüyü yeni bir Image olarak ayarla
                    const img = new Image();
                    img.onload = () => {
                        State.displayImage = img;
                        Renderer.render();
                    };
                    img.src = cropCanvas.toDataURL();
                    State.cropMode = false;
                }
            };

            /* ==========================================================
             * 8. DÖNDÜRME (Rotate) — 90° adımlarla, resim yeniden örneklenir
             * ========================================================== */
            const Rotator = {
                rotate(angle) {
                    if (!State.displayImage) { alert('Önce bir resim yükleyin!'); return; }
                    const img = State.displayImage;
                    const rotated = document.createElement('canvas');
                    if (angle === 90 || angle === -90) {
                        rotated.width = img.height;
                        rotated.height = img.width;
                    } else {
                        rotated.width = img.width;
                        rotated.height = img.height;
                    }
                    const rctx = rotated.getContext('2d');
                    rctx.translate(rotated.width / 2, rotated.height / 2);
                    rctx.rotate(angle * Math.PI / 180);
                    rctx.drawImage(img, -img.width / 2, -img.height / 2);
                    const result = new Image();
                    result.onload = () => {
                        State.displayImage = result;
                        Renderer.render();
                    };
                    result.src = rotated.toDataURL();
                },
                left() { this.rotate(90); },
                right() { this.rotate(-90); }
            };

            /* ==========================================================
             * 9. İNDİRME (Export) — Canvas'ı PNG olarak kaydet
             * ========================================================== */
            const Export = {
                download() {
                    if (!State.displayImage) { alert('Önce bir resim yükleyin!'); return; }
                    const link = document.createElement('a');
                    link.download = 'duzenlenmis-resim.png';
                    link.href = Dom.canvas.toDataURL('image/png');
                    link.click();
                },
                reset() {
                    if (!State.originalImage) { alert('Henüz resim yüklenmedi, sıfırlanacak bir şey yok.'); return; }
                    State.displayImage = State.originalImage;
                    resetAdjustments();
                    Renderer.render();
                }
            };

            /* ==========================================================
             * 10. SLAYT SENKRON VE SIFIRLAMA YARDIMCILARI
             * ========================================================== */
            const DomBrightness = document.getElementById('brightness');
            const DomContrast = document.getElementById('contrast');
            const DomSaturation = document.getElementById('saturation');

            function resetAdjustments() {
                State.brightness = 100;
                State.contrast = 100;
                State.saturation = 100;
                State.grayscale = false;
                State.sepia = false;
                updateFilterButtons();
                syncSliders();
            }
            function updateFilterButtons() {
                const gBtn = document.getElementById('grayscaleBtn');
                const sBtn = document.getElementById('sepiaBtn');
                gBtn.classList.toggle('active-filter', State.grayscale);
                sBtn.classList.toggle('active-filter', State.sepia);
            }
            function syncSliders() {
                DomBrightness.value = State.brightness;
                DomContrast.value = State.contrast;
                DomSaturation.value = State.saturation;
            }

            /* ==========================================================
             * 11. OLAY BAĞLANTILARI (Event Wiring)
             * ========================================================== */
            function wireEvents() {
                Dom.fileInput.addEventListener('change', (e) => ImageManager.load(e.target.files[0]));

                document.getElementById('brightness').addEventListener('input', Adjustments.brightness);
                document.getElementById('contrast').addEventListener('input', Adjustments.contrast);
                document.getElementById('saturation').addEventListener('input', Adjustments.saturation);

                document.getElementById('grayscaleBtn').addEventListener('click', Adjustments.toggleGrayscale);
                document.getElementById('sepiaBtn').addEventListener('click', Adjustments.toggleSepia);
                document.getElementById('resetFiltersBtn').addEventListener('click', Adjustments.reset);

                document.getElementById('rotateLeftBtn').addEventListener('click', () => Rotator.left());
                document.getElementById('rotateRightBtn').addEventListener('click', () => Rotator.right());
                document.getElementById('cropBtn').addEventListener('click', () => Crop.enterMode());

                document.getElementById('downloadBtn').addEventListener('click', Export.download);
                document.getElementById('resetBtn').addEventListener('click', Export.reset);
            }

            /* ==========================================================
             * 12. UYGULAMA BAŞLATMA
             * ========================================================== */
            function init() {
                Dom.init();
                wireEvents();
            }

            document.addEventListener('DOMContentLoaded', init);
        })();
    