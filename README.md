# Circuit Quest - Petualangan Rangkai IoT

Game platformer 2D pixel art di GDevelop 5: Hutan Sensor, Pabrik Mikrokontroler, dan Menara Cloud. Kumpulkan komponen, bantu NPC, pulihkan Bug-Zero, lalu rakit Smart Greenhouse.

## Membuka dan memainkan proyek

1. Buka GDevelop 5, pilih **Open / Your computer**, lalu pilih `Project TA PPLG.json` di folder ini.
2. Bila proyek sudah terbuka sebelum perubahan berkas, tutup proyek lalu buka kembali agar editor memuat versi terbaru. Hindari menyimpan tab lama di atas berkas baru.
3. Pilih `MainGame Scene`, jalankan **Preview**, lalu klik **Mulai**. Scene pertama proyek sudah diatur ke stage tersebut.
4. Simpan folder `assets/` bersama JSON proyek. `Circuit Quest - NPC Animasi.json` juga berisi fitur yang sama.

| Kontrol | Aksi |
| --- | --- |
| A / D atau panah kiri / kanan | Bergerak |
| Space | Lompat; tahan untuk melompat lebih tinggi |
| W / S atau panah atas / bawah | Naik / turun tangga |
| E | Interaksi, lanjut dialog, masuk portal |
| J | Pulse Wave; membutuhkan 5 energi |
| I | Inventory |
| B atau tombol SHOP | Toko bekal Volt |
| Esc | Jeda / kembali dari menu |
| SFX ON / OFF | Matikan atau aktifkan efek suara |

Pada perangkat sentuh, gunakan tombol gerak, lompat, Pulse, E, dan SHOP di layar. Toko tersedia selama eksplorasi; dialog, puzzle, gempa, dan pertarungan tidak dapat berjalan bersamaan dengan menu belanja. Membuka shop saat pertarungan berlangsung menjeda pertarungan seperti menu jeda.

## Koin dan toko piksel

Koin langsung masuk dompet ketika musuh dikalahkan dengan Pulse. Bug dan Glitch memberi 8 koin, Glitch Fragment 3, Drone Malware 10, dan Bug-Zero 50. Musuh yang sudah dikalahkan tidak memberi hadiah berulang ketika scene dimuat kembali. Drop baterai lama tetap tersedia.

Gerai Volt berada dekat area awal/mentor di setiap peta. Tekan **B** atau **SHOP** untuk membuka katalog dari area eksplorasi. Shop memakai sprite PNG piksel asli, panel sudut kotak, dan skala nearest-neighbor.

| Barang | Harga | Efek |
| --- | ---: | --- |
| Hati Kapasitor | 12 koin | +2 HP, maksimal 5 |
| Sel Energi | 10 koin | Isi energi sampai 100 |
| Perisai Volt | 25 koin | Menahan satu hit; maksimal 3 muatan |

Barang langsung digunakan. Pembelian ditolak jika saldo kurang atau kapasitas penuh. Perisai mengikuti masa kebal Nova, sehingga satu benturan tidak menghabiskan semua muatan. Perisai melindungi damage biasa; penalti timer evakuasi tetap mengikuti aturan puzzle pabrik. Komponen misi diperoleh dari peti dan quest, tanpa pembelian.

## Gempa dan portal antarstage

- Setelah puzzle Stage 1 atau 2 berhasil, terjadi gempa selama **2,2 detik**. Kamera visual bergetar, terdengar gemuruh, dan gameplay berhenti sebentar. Gempa tidak mengurangi HP.
- Setelah gempa mereda, pilih **Menuju portal**, dekati gerbang bercahaya di kanan workbench, lalu tekan **E**. Gerbang sudah terlihat sejak awal tetapi terkunci sampai puzzle selesai.
- Portal di kiri Stage 2 kembali ke Hutan Sensor. Portal di kiri Stage 3 kembali ke Pabrik. Portal balik menempatkan Nova dekat pintu keluar stage sebelumnya.
- HP, energi, koin, muatan perisai, komponen yang terkumpul, daya, dan status evakuasi yang sudah selesai dibawa antarportal selama sesi game. Gempa hanya diputar sekali per stage dalam sesi itu.
- Jika kalah di Hutan Sensor atau Pabrik, **Coba Lagi** melanjutkan dari checkpoint dengan HP dan energi penuh. Bila evakuasi sedang berlangsung, hitung mundur Pabrik kembali ke 65 detik.
- Tombol **Kembali ke menara** pada puzzle akhir mengembalikan Nova ke Workbench dengan HP dan energi yang sama. Membuka puzzle lagi memulai percobaan baru.
- Portal keluar Menara terkunci selama boss encounter. Setelah integrasi Smart Greenhouse selesai, layar kemenangan akhir juga memainkan gempa penutup.
- **Pengaturan > Kurangi gerakan** atau preferensi pengurangan gerakan browser mematikan guncangan visual. Notifikasi, durasi, dan suara tetap tersedia.

Progres ini disimpan di memori sesi game. Memuat ulang halaman, menutup game, atau memulai Preview baru mereset progres dan dompet; belum ada penyimpanan permanen/akun/cloud save. Mengulang scene dalam sesi yang sama mempertahankan dompet dan komponen. Gunakan Preview baru untuk pengujian dari kondisi bersih.

## Efek suara

SFX chiptune dibuat dengan Web Audio API, tanpa unduhan audio atau koneksi CDN: langkah jalan/lari, lompatan, pendaratan, memanjat, setiap tembakan Pulse, interaksi, damage, koin, pembelian, perisai, portal, dan gempa. NPC memiliki suara bicara/gestur; Volt memiliki bunyi hover dan musuh memiliki bunyi gerak.

Browser memerlukan klik atau tombol pertama untuk membuka audio. Klik Mulai, lalu gerakkan Nova. Atur volume 0-100% melalui shop; tombol SFX pada HUD menyediakan mute cepat. Suara NPC dibatasi jarak dan frekuensinya supaya tidak bertumpuk. Audio berhenti dipicu saat tab tersembunyi. Kegagalan audio tidak menghentikan gameplay.

## Ekspor HTML5 untuk website publik

**JSON proyek bukan file game web.** Ekspor dahulu lewat GDevelop untuk menghasilkan `index.html`, JavaScript runtime, dan asetnya.

1. Buka proyek terbaru, pastikan scene awal `MainGame Scene`.
2. Klik **Share** atau **File > Export (web, iOS, Android)**.
3. Pilih ekspor **Web / HTML5** ke folder lokal. Nama pilihan dapat berbeda antarversi; pilih ekspor manual untuk website eksternal.
4. Pilih folder `dist/web/` di dalam proyek ini. Jangan memilih folder akar proyek.
5. Tunggu sampai ekspor selesai. Pastikan `dist/web/index.html` ada beserta JS dan seluruh aset hasil ekspor.
6. Uji melalui HTTP lokal sebelum mengunggah. Panduan resmi: [publikasi GDevelop](https://wiki.gdevelop.io/gdevelop5/publishing/).

### Menjalankan hasil ekspor secara lokal

Pasang Node.js bila belum tersedia. Dari folder proyek:

```powershell
node serve_web.cjs dist/web 8080
```

Buka `http://127.0.0.1:8080`. Server ini hanya mendengarkan komputer lokal; tutup dengan **Ctrl+C**. Tidak membutuhkan `npm install`. Menggunakan server HTTP menghindari pembatasan pemuatan aset pada alamat `file://`.

### Opsi A: itch.io

1. Setelah ekspor, jalankan dari PowerShell:

   ```powershell
   .\package_web.ps1
   ```

2. ZIP tersimpan di `release/CircuitQuest-HTML5.zip`. Di dalam ZIP, **index.html harus berada pada akar ZIP**, bersama JS dan folder aset, bukan di dalam satu folder pembungkus.
3. Masuk ke itch.io, buat project baru dengan jenis **HTML** dan unggah ZIP hasil ekspor tersebut.
4. Aktifkan **This file will be played in the browser**. Gunakan viewport 1280 x 720 dan dukungan fullscreen. Tambahkan dukungan mobile jika sudah selesai diuji di perangkat target.
5. Isi judul, deskripsi, kontrol, cover, dan kredit. Uji draft lalu atur visibilitas **Public** ketika siap dibagikan.
6. Buka URL halaman game dalam jendela privat untuk memeriksa akses publik dan audio setelah tombol Mulai diklik.

Panduan resmi: [Uploading HTML5 games di itch.io](https://itch.io/docs/creators/html5).

### Opsi B: GitHub Pages

1. Buat repository untuk hasil build web, misalnya `circuit-quest-web`.
2. Unggah **isi** `dist/web/` ke akar branch `main`: `index.html`, JavaScript, dan aset. Gunakan path relatif hasil ekspor; pertahankan huruf besar/kecil pada nama berkas.
3. Tambahkan berkas kosong `.nojekyll` pada akar repository build.
4. Di **Settings > Pages**, pilih **Deploy from a branch**, branch `main`, folder `/(root)`, lalu simpan.
5. Tunggu deployment selesai. Gunakan URL Pages yang ditampilkan GitHub; untuk project site biasanya `https://USERNAME.github.io/circuit-quest-web/`.
6. Uji akses publik dan semua perpindahan scene. Untuk update, ekspor ulang lalu unggah seluruh hasil build terbaru.

Panduan resmi: [membuat situs GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

Yang diperlukan pengunjung hanya browser. Jangan mengunggah `.git`, snapshot backup, `source-assets`, GDD, atau seluruh folder kerja sebagai build game. Isi `assets` yang diperlukan akan dibawa oleh ekspor GDevelop. Pastikan kredit dan hak publikasi aset yang dipakai sudah dilengkapi sebelum rilis umum.

## Pengembangan dan validasi

Fitur tambahan sudah tertanam di event JavaScript kedua pada setiap scene yang relevan. Membuka proyek di GDevelop tidak memerlukan menjalankan installer.

- `journey-runtime.js`: logika bersama shop, ekonomi, audio, gempa, dan portal.
- `install_journey.cjs`: menggambar aset PNG kecil dan memasang ulang fitur pada kedua JSON tanpa mengganti peta lama. Installer dapat dijalankan berulang tanpa menambah event/portal duplikat.
- `gameplay-audit.cjs`: memasang perbaikan interaksi, tembakan, checkpoint, dan retry pada event yang sudah ada.
- `readability-art.cjs`: membuat garis tepi pada permukaan berpijak, penanda celah/tangga, dan outline musuh serta hazard. Satu pijakan gua diturunkan 16 px agar dapat dijangkau; sprite dan collider dipindahkan bersama.
- `assets/journey/`: Coin, Shield, Shop, dan Portal, digambar secara programatis di grid piksel.
- `tmp/before-journey/`: snapshot kedua proyek sebelum fitur baru dipasang.
- `LEVEL1-README.md` dan `LEVEL2-README.md`: rute dan solusi puzzle terdahulu. Untuk perilaku portal dan progres terbaru, ikuti README ini.

Jika mengubah `journey-runtime.js`, jalankan:

```powershell
node install_journey.cjs
node validate_journey.cjs
node validate_level2.cjs
node stage3/validate_level3.cjs
node validate_nova_assets.cjs
node check_animation_states.cjs
node validate_web_tools.cjs
```

Tutup dan buka ulang proyek di editor sesudah installer. Jika meregenerasi stage dengan builder lama, jalankan `install_journey.cjs` **terakhir**, kemudian ulangi validasi dan ekspor. Builder stage memang dapat mengganti peta scene; cadangkan perubahan peta manual sebelum memakainya.

Validasi otomatis memakai runtime double untuk menjalankan event yang terpasang: collision Pulse dan hadiah, transaksi, batas item, pause, perisai, gempa, portal bolak-balik, kit antarstage, puzzle pabrik, boss lock, hadiah boss tunggal, cleanup listener audio, dan gempa akhir. Suite lama memeriksa puzzle/evakuasi pabrik, seluruh fase boss, recovery, 11 slot final, timeout, retry, aset, serta animasi.

`node validate_platform_physics.cjs "<folder GDJS/Runtime pada instalasi GDevelop>"` menjalankan kode platformer dari instalasi GDevelop tanpa renderer, menggunakan ukuran dan mask dari proyek. Cakupannya meliputi tinggi lompatan singkat/penuh, jembatan, rak komponen, tangga gua/pabrik, rute ke Dashboard dan WiFi, serta Nova yang ikut bergerak di platform menara.

Pratinjau desktop versi baru belum dapat diverifikasi secara andal di sesi audit. Lakukan satu playthrough dari **Mulai** sampai layar Smart Greenhouse, lalu uji kembali pada hasil ekspor HTML5:

1. Hutan: ambil empat sensor, lewati gua, aktifkan pos daya, lalu uji puzzle dan portal dengan keyboard serta tap E.
2. Pabrik: jatuh ke limbah, ulangi dari checkpoint, selesaikan urutan A → C → B dan evakuasi. Coba kembali melalui portal lalu lanjutkan.
3. Menara: lewati platform bergerak dan tangga, mulai boss dengan energi rendah, selesaikan tiga fase, pulihkan Bug-Zero, lalu uji keluar dari Workbench, timeout, retry, dan kemenangan.
4. Periksa keterbacaan hazard aktif/siaga, terutama di gua dan arena boss. Coba pada layar kecil untuk memeriksa tombol sentuh, HUD, dialog, dan suara.

## Perubahan terhadap GDD

Permintaan terbaru menambahkan kembali ekonomi koin dan satu konsep shop, yang sebelumnya dihapus dalam GDD revisi 4 November 2026. Shop Volt menjual bekal; Prof. Ohm tetap mentor teknis. Tiga stage, puzzle pendidikan IoT, serta alur menghadapi lalu memulihkan Bug-Zero tetap menjadi struktur utama game.
