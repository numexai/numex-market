; NUMEX KASE
; Uretici: Numex Kaşe Stüdyo v1.0.0
; Tarih: 2026-09-12T20:42:07.422Z
; Malzeme: Genel | Mod: markalama
; Metin: KASE
; Islem alani: 40 x 60 mm
G21 ; mm
G90 ; mutlak konum
$32=1 ; GRBL lazer modu
G0 X0 Y0
M5 ; lazer kapali (guvenli baslangic)
; --- isleme baslangic ---
; gecis 1/1
G0 X180 Y170
M4 S500 ; lazer ac
G1 X184.84 Y170 F1000
G1 X184.84 Y180
G1 X180 Y180
G1 X180 Y170
M5 ; lazer kapat
G0 X186.2 Y170
M4 S500 ; lazer ac
G1 X191.04 Y170 F1000
G1 X191.04 Y180
G1 X186.2 Y180
G1 X186.2 Y170
M5 ; lazer kapat
G0 X192.4 Y170
M4 S500 ; lazer ac
G1 X197.24 Y170 F1000
G1 X197.24 Y180
G1 X192.4 Y180
G1 X192.4 Y170
M5 ; lazer kapat
G0 X198.6 Y170
M4 S500 ; lazer ac
G1 X203.44 Y170 F1000
G1 X203.44 Y180
G1 X198.6 Y180
G1 X198.6 Y170
M5 ; lazer kapat
M5 ; lazer kapali
G0 X0 Y0
M2 ; program sonu
