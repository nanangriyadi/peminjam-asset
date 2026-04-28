# 📦 AssetTrack — Admin Dashboard Peminjaman Barang

<img width="1911" height="908" alt="image" src="https://github.com/user-attachments/assets/4af23610-f918-4029-b921-0f14329a1147" />

<img width="1905" height="911" alt="image" src="https://github.com/user-attachments/assets/4c6ce679-a2b3-4316-a7b5-fe3ed56defe3" />



Dashboard admin berbasis HTML murni untuk manajemen peminjaman aset/barang, terintegrasi dengan **Google Sheets** via **Google Apps Script** sebagai backend, dan mendukung preview foto dari **Google Drive**.

---

## ✨ Fitur Utama

- **Dashboard statistik** — total peminjaman, sedang dipinjam, terlambat, dikembalikan
- **Tabel data peminjaman** dengan pencarian real-time dan filter status/barang
- **Detail peminjaman** — modal popup lengkap dengan preview foto barang
- **Update status** — ubah status langsung dari dashboard (Dipinjam / Dikembalikan / Terlambat)
- **Hapus data** — dengan konfirmasi sebelum eksekusi
- **Export CSV** — unduh seluruh data ke format spreadsheet
- **Preview foto Google Drive** — dengan sistem fallback 3 lapis agar gambar selalu bisa dilihat
- **Pengaturan API** — konfigurasi URL Apps Script langsung dari UI
- **Responsif** — tampilan optimal di desktop maupun mobile

---

## 🛠️ Teknologi

| Komponen | Teknologi |
|---|---|
| Frontend | HTML5, Tailwind CSS v3 (CDN), Vanilla JavaScript |
| Tipografi | Plus Jakarta Sans, JetBrains Mono (Google Fonts) |
| Chart | Chart.js v4.4 |
| Backend | Google Apps Script (Web App) |
| Database | Google Sheets |
| Storage Foto | Google Drive |

---

## 🚀 Cara Penggunaan

### 1. Siapkan Google Sheets & Apps Script

1. Buat Google Spreadsheet baru
2. Buka **Extensions → Apps Script**
3. Buat Web App yang menangani `action` berikut:
   - `getStats` — mengembalikan statistik ringkasan
   - `getData` — mengembalikan data peminjaman (support: `search`, `status`, `barang`, `page`, `limit`)
   - `updateStatus` — mengubah status baris tertentu
   - `deleteRow` — menghapus baris tertentu
4. Deploy sebagai **Web App** dengan akses: *Anyone*
5. Salin URL deployment

### 2. Jalankan Dashboard

1. Buka file `index2.html` di browser (tidak perlu server)
2. Klik menu **Pengaturan API** di sidebar kiri
3. Tempel URL Apps Script, klik **Simpan & Uji Koneksi**
4. Jika berhasil, dashboard akan langsung memuat data

> URL API tersimpan di `localStorage` — tidak perlu diisi ulang setiap kali membuka halaman.

---

## 📁 Struktur Kolom Google Sheets yang Didukung

| Nama Kolom | Keterangan |
|---|---|
| `Timestamp` | Waktu pengisian form |
| `Nama Peminjam Barang` | Nama lengkap peminjam |
| `Barang Yang Di pinjam` | Nama aset/barang |
| `Di Peruntukan` | Keperluan peminjaman |
| `Tanggal Peminjaman Asset` | Tanggal mulai pinjam |
| `Tanggal Kembali` | Tanggal rencana pengembalian |
| `Status` | `Dipinjam` / `Dikembalikan` / `Terlambat` |
| `Foto Barang` / `Foto Sebelum` / `Bukti` | URL foto dari Google Drive _(opsional)_ |

> Nama kolom bersifat fleksibel. Kolom yang mengandung kata `foto`, `gambar`, `bukti`, atau `dokumen` akan otomatis dirender sebagai gambar.

---

## 🖼️ Cara Kerja Preview Foto Google Drive

Dashboard mendukung semua format URL Google Drive:

```
https://drive.google.com/open?id=FILE_ID
https://drive.google.com/file/d/FILE_ID/view
https://drive.google.com/uc?id=FILE_ID
https://drive.google.com/file/d/FILE_ID/view?usp=sharing
```

**Sistem fallback otomatis (3 lapis):**

```
1. thumbnail?id=FILE_ID&sz=w640   ← utama (bebas CORS)
        ↓ gagal
2. uc?export=view&id=FILE_ID      ← fallback 1
        ↓ gagal
3. thumbnail?id=FILE_ID&sz=w320   ← fallback 2
        ↓ gagal
4. Tampilkan link "Buka di tab baru" ← fallback akhir
```

> **Catatan:** Pastikan file di Google Drive sudah diatur sharing ke **"Anyone with the link can view"** agar gambar bisa dimuat.

---

## 📱 Tampilan

- **Sidebar** — navigasi tetap di desktop, drawer geser di mobile
- **Kartu statistik** — ringkasan 4 metrik utama dengan ikon
- **Tabel** — pagination, pencarian, filter multi-kolom
- **Modal Detail** — informasi lengkap + preview foto per item

---

## ⚙️ Konfigurasi Lokal

Tidak ada build step atau dependency yang perlu diinstal. Cukup:

```bash
# Buka langsung di browser
open index2.html

# Atau jalankan dengan live server lokal
npx serve .
```

---

## 🐛 Troubleshooting

| Masalah | Solusi |
|---|---|
| Data tidak muncul | Pastikan URL Apps Script sudah disimpan di Pengaturan API |
| Foto gagal dimuat | Pastikan file Google Drive sharing-nya *Anyone with the link* |
| CORS error di console | Gunakan Google Drive `thumbnail` endpoint (sudah otomatis ditangani) |
| Tombol refresh tidak bekerja | Periksa koneksi internet dan URL Apps Script |
| Export CSV kosong | Pastikan data sudah berhasil dimuat terlebih dahulu |

---

## 📄 Lisensi

Bebas digunakan dan dimodifikasi untuk keperluan internal organisasi.

---

> Dibuat dengan ❤️ menggunakan HTML, Tailwind CSS, dan Google Apps Script.
