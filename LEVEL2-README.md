# Circuit Quest — Stage 2: Pabrik Mikrokontroler

Buka `Project TA PPLG.json` di GDevelop. Selesaikan Sensor Hub pada Level 1, lalu tekan **Lanjut Level 2 →** di layar kemenangan. Untuk menguji langsung, buka scene **Level2 Scene** dan jalankan preview scene tersebut. `Circuit Quest - NPC Animasi.json` juga memuat Level 2.

## Kontrol dan rute

- **A/D** atau panah: bergerak. **Space**: lompat; tahan untuk mencapai platform. **W/S**: tangga.
- **E**: interaksi. **J**: Pulse, 5 energi. **I**: inventory. **Esc**: jeda. Kontrol sentuh mengikuti Level 1.
- Temui Prof. Ohm untuk **ESP32** dan pemulihan energi/1 HP.
- Ambil **Relay** di platform produksi x=704, y=464.
- Ambil **Pompa Mini** di catwalk x=1856, y=480, di atas limbah hijau. Ilustrasi motor DC dari sheet dipakai sebagai ikon motor penggerak pompa.
- Jawab kuis Warga dekat x=2740 untuk **LED**. Jawaban benar: tanah di bawah 40% → pompa ON.
- Turun tangga x=3120 ke terowongan. Tekan sakelar **A → C → B**; susunan fisiknya dari kiri A, B, C. Urutan salah mereset panel.
- Laser padam dan evakuasi **65 detik** dimulai. Ambil **Servo** di kanan laser, naik tangga mesin bertingkat, lalu aktifkan panel hijau di x=5680.
- Jika waktu habis, Nova kembali ke sisi kanan panel sakelar dengan waktu baru, kehilangan 1 HP sampai minimum 1. Komponen tetap dibawa. Timer berhenti saat dialog/menu/puzzle terbuka.
- Pergi ke Workbench x=6256 dan rakit **Smart Controller**.

Bug Berbaju Besi membutuhkan dua Pulse. Glitch menembak setiap 2,2 detik saat Nova berada dalam jangkauan. Baterai memulihkan 20 energi. Conveyor mendorong Nova saat berdiri di atasnya; limbah mengembalikan Nova ke checkpoint. Laser memiliki collider terpisah yang dinonaktifkan setelah urutan benar.

## Puzzle

Kelima komponen harus diletakkan ke slotnya dengan drag/drop atau klik komponen lalu slot. Setiap sambungan mendapat umpan balik hijau/merah:

| Jalur | Port |
| --- | --- |
| SensorHub.DATA | GPIO34 |
| Relay.VCC | 5V |
| Relay.GND | GND |
| Relay.IN | GPIO26 |
| Pump.PLUS | RELAY_NO |
| Pump.MINUS | GND |
| Servo.VCC | 5V |
| Servo.GND | GND |
| Servo.SIGNAL | GPIO18 |
| LED.ANODE | GPIO2_R |
| LED.CATHODE | GND |

Logika yang benar: **tanah < 40% → pompa ON**. Papan ini simulasi pembelajaran: ESP32 diberi catu melalui VIN, relay memakai driver, pompa mengambil catu terpisah melalui kontak COM/NO, dan GPIO2_R mencakup resistor seri LED. Antarmuka Sensor Hub disederhanakan.

Keberhasilan mengatur `SmartController=1`, `AssemblyResult.SmartController=1`, dan `StageUnlocked` minimal 3. Setelah menang, tekan **Lanjut ke Menara Cloud →** untuk masuk Stage 3 dengan HP, energi, dan kit yang sudah diperoleh. Progres hanya bertahan selama sesi game. Sensor Hub dan inventori Level 1 tetap tersimpan saat pindah scene. HP dan energi dibawa dari Level 1; preview langsung/restart Level 2 dimulai dengan 5 HP dan 100 energi.

## Sumber dan pengeditan

Lima PNG asli dalam `assets/level2` tidak dimodifikasi. `prepare_level2.cjs` memotong 33 sprite/tekstur ke `assets/level2/generated`; sumber dan koordinat potongan dicatat di `manifest.json`. Tidak ada gambar baru yang digenerasikan. Karakter Nova, Volt, Prof. Ohm, dan Warga menggunakan animasi yang sudah ada. Grid dan tekstur metal 64×64; terrain dan collider berukuran sama. Panorama mempertahankan rasio sumber, berulang secara horizontal.

`level2-ui.js` memuat misi, menu, dialog, dan puzzle. `level2-world.js` memuat gameplay khusus pabrik. `build_level2.cjs` menyusunnya bersama UI/animasi Level 1 menjadi `level2-runtime.js` dan event JavaScript dengan gambar UI tertanam di kedua proyek. Native scene objects tetap dapat diedit di GDevelop.

Jalankan `node build_level2.cjs` untuk regenerasi. **Regenerasi mengganti seluruh Level2 Scene**, jadi simpan perubahan peta manual sebelum menjalankannya. Level 1 tetap dipertahankan, dengan tambahan tombol perpindahan scene dan perlindungan agar unlock tidak turun saat dirakit ulang. Snapshot awal tersedia pada kedua file `*.before-level2.json`.

Jalankan `node validate_level2.cjs` untuk memeriksa referensi aset, collider, komponen, animasi karakter yang dipertahankan, serta simulasi runtime dari menu sampai puzzle, kemenangan, restart, dan Game Over. `node validate_nova_assets.cjs` dan `node check_animation_states.cjs` juga lulus. Preview GDevelop berhasil membuka menu pabrik dan gameplay/HUD; playthrough penuh belum diverifikasi secara otomatis. Perbaikan terakhir mengganti label menjadi objek native `TextObject::Text`.

`Level2-Overview.png` memperlihatkan keseluruhan geometri peta; `Level2-Entrance.png` memperlihatkan skala aset pada 1280×720. Render komposisi ini tidak menyertakan teks native atau HTML HUD. Perubahan Level 1 yang belum tersimpan di editor dicadangkan di `Circuit Quest - Editor Backup Before Level 2.json`; tiga perubahan instance dan posisi viewport dibawa ke proyek utama. Jika editor masih memuat versi lama, buka ulang proyek sebelum menyimpan agar pembaruan dari berkas terbaca.
