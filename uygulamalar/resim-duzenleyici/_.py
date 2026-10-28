import struct, zlib

def make_png(path, width=400, height=300):
    """Basit PNG oluştur: mavi zemin + sarı elips + kırmızı dikdörtgen."""
    rows = []
    for y in range(height):
        row = b'\x00'  # filter: None
        for x in range(width):
            # Elips (merkez 200,150; yarıçap dikey 100, yatay 150)
            dx = (x - 200) / 150.0
            dy = (y - 150) / 100.0
            if dx*dx + dy*dy <= 1.0:
                color = (255, 255, 0)  # sarı
            elif 80 <= x < 200 and 60 <= y < 140:
                color = (255, 0, 0)    # kırmızı kare
            else:
                color = (30, 144, 255) # dodgerblue
            row += bytes(color)
        rows.append(row)

    raw = b''.join(rows)

    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        c += struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
        return c

    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', ihdr)
    png += chunk(b'IDAT', zlib.compress(raw))
    png += chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)
    print(f'Olusturuldu: {path} ({width}x{height})')

make_png('test-resmi.png')

# --- JS syntax doğrulama yardımcısı ---
import re
def js_syntax_check():
    html = open('index.html', encoding='utf-8').read()
    m = re.search(r'<script>(.*?)</script>', html, re.S)
    if not m:
        print('SCRIPT etiketi bulunamadi!')
        return
    js = m.group(1)
    open('_js_check.js', 'w', encoding='utf-8').write(js)
    print(f'JS ayiklandi: {len(js)} karakter')
    # Node ile syntax kontrolü yapmak için
    import subprocess
    r = subprocess.run(['node', '--check', '_js_check.js'], capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode == 0:
        print('JS SYNTAX: GECERLI')
    else:
        print('JS SYNTAX HATASI:')
        print(r.stderr)
    return r.returncode

js_syntax_check()
