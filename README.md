[![make.fun · best-household-budget-site-20261126-1457](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/krida268/best-household-budget-site-20261126-1457/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/krida268/best-household-budget-site-20261126-1457/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)

# DompetKeluarga — Anggaran Rumah Tangga Keluarga Indonesia

Situs anggaran rumah tangga yang bekerja penuh di peramban, tanpa jaringan dan tanpa build step.
Contoh keluarga: Keluarga Pratama (Jakarta, 4 anggota, penghasilan gabungan Rp14.000.000/bulan).

## Yang bisa dilakukan

- **Dashboard** — ringkasan pemasukan, pengeluaran, sisa uang, dan target tabungan bulan berjalan,
  grafik pengeluaran per kategori, arus kas 6 bulan, dan transaksi terbaru.
- **Transaksi** — tambah, ubah, dan hapus pemasukan & pengeluaran; saring menurut jenis dan kategori;
  total terfilter dihitung otomatis.
- **Anggaran** — anggaran bulanan per kategori (Belanja Dapur, Sewa & Rumah, Listrik & Air,
  Transportasi, Pendidikan, Kesehatan, Hiburan, Lainnya) dengan bilah progres dan status
  Aman / Hampir habis / Melebihi; anggaran bisa diubah.
- **Tabungan** — target Dana Darurat, DP Rumah, Pendidikan Anak, dan Liburan Keluarga dengan
  progres, tambah dana ke target, dan buat target baru.
- **Kalkulator** — aturan 50/30/20, dana darurat (3/6/12 bulan pengeluaran), dan cicilan barang
  berbunga flat — semuanya menghitung langsung dari angka yang dimasukkan.
- **Laporan** — rata-rata 6 bulan, grafik pemasukan vs pengeluaran, dan tabel bulanan.
- **Panduan** — lima kebiasaan mengatur anggaran keluarga, plus tombol mengembalikan data contoh.

Semua data tersimpan di `localStorage` peramban pengguna dan tidak dikirim ke mana pun.
Situs ini 100% statis: `app/index.html` + CSS + modul ES tanpa dependensi eksternal.

## Menjalankan

```sh
# layani app/ di http://localhost:8080
node serve.ts
# atau server statis apa saja dengan app/ sebagai root
```

## Entri make.fun

Entry untuk bounty [Make the best household budget site](https://make.fun/bounty/best-household-budget-site-20261126-1457).
`main.ts` menyalin `app/` dan `screenshots/` ke `/output` dan menulis `dossier.json`
dengan `buildDossier` dari `vendor/makefun-frontend.ts`.

Coba make.fun juga lewat tautan referral saya: https://make.fun/r/enzt809f
