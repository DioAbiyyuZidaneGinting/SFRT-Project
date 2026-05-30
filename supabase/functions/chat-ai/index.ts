// SFRT Resilient Hybrid AI Assistant — Edge Function
// Architecture: FAQ & Database First Architecture
// Core: Layer 1 (Local FAQ) + Layer 2 (Supabase Data Engine) + Layer 3 (Gemini AI)

import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================================
// INTENT DETECTION ENGINE
// Group inputs into specific categories to trigger database and FAQ matching.
// Uses prioritized intent scoring to eliminate collisions.
// ============================================================
type IntentCategory =
  | "VEHICLE"
  | "RFID"
  | "FUEL"
  | "TRANSACTION"
  | "DASHBOARD"
  | "STATION"
  | "QUEUE"
  | "NOTIFICATION"
  | "ACCOUNT"
  | "SECURITY"
  | "ANALYTICS"
  | "SPENDING"
  | "FLEET"
  | "PAYMENT"
  | "QRIS"
  | "HISTORY"
  | "ALERTS"
  | "REFUEL"
  | "MONITORING"
  | "STATISTICS"
  | "GENERAL";

interface IntentDefinition {
  id: string;
  category: IntentCategory;
  keywords: string[];
  variations: string[];
}

const ALL_INTENTS: IntentDefinition[] = [
  // 1. VEHICLE
  {
    id: "vehicle_list",
    category: "VEHICLE",
    keywords: ["tampilkan", "daftar", "lihat", "list", "show"],
    variations: [
      "Tampilkan kendaraan saya",
      "Daftar kendaraan saya",
      "Mobil yang saya daftarkan",
      "Armada saya apa saja",
      "Kendaraan terdaftar",
      "Kendaraan aktif saya",
      "Mobil saya apa saja",
      "Lihat kendaraan",
      "Data kendaraan saya",
      "Kendaraan yang ada di akun saya"
    ]
  },
  {
    id: "vehicle_add",
    category: "VEHICLE",
    keywords: ["tambah", "daftar baru", "registrasi", "masukkan", "input"],
    variations: [
      "Bagaimana cara menambah kendaraan",
      "Daftarkan mobil baru saya",
      "Registrasi kendaraan baru",
      "Masukkan mobil ke akun saya",
      "Input kendaraan baru",
      "Cara daftarin motor",
      "Tambahkan armada baru",
      "Daftarkan plat nomor baru",
      "Bagaimana input mobil baru",
      "Registrasi mobil baru"
    ]
  },
  {
    id: "vehicle_details",
    category: "VEHICLE",
    keywords: ["detail", "info", "spesifikasi", "kapasitas", "tangki"],
    variations: [
      "Lihat detail kendaraan saya",
      "Info spesifikasi mobil saya",
      "Kapasitas tangki mobil saya",
      "Berapa kapasitas tangki kendaraan saya",
      "Detail plat nomor saya",
      "Rincian armada saya",
      "Tampilkan spesifikasi kendaraan",
      "Info detail mobil terdaftar",
      "Lihat spesifikasi mobil",
      "Kapasitas tangki bensin mobil saya"
    ]
  },
  {
    id: "vehicle_status",
    category: "VEHICLE",
    keywords: ["status", "keaktifan", "kondisi", "aktif", "nonaktif"],
    variations: [
      "Status kendaraan saya",
      "Apakah mobil saya aktif",
      "Status keaktifan armada saya",
      "Cek status mobil terdaftar",
      "Apakah kendaraan saya terverifikasi",
      "Status armada saat ini",
      "Kendaraan aktif atau tidak",
      "Cek kendaraan aktif",
      "Status mobil aktif",
      "Bagaimana status kendaraan saya"
    ]
  },
  {
    id: "vehicle_count",
    category: "VEHICLE",
    keywords: ["jumlah", "berapa banyak", "total", "count"],
    variations: [
      "Berapa banyak kendaraan saya",
      "Total kendaraan terdaftar",
      "Jumlah mobil di akun saya",
      "Berapa armada yang saya miliki",
      "Total armada saya",
      "Berapa banyak mobil saya",
      "Jumlah kendaraan aktif",
      "Hitung total kendaraan saya",
      "Berapa unit kendaraan saya",
      "Total unit mobil saya"
    ]
  },

  // 2. RFID
  {
    id: "rfid_status",
    category: "RFID",
    keywords: ["status", "cek rfid", "aktif", "verifikasi"],
    variations: [
      "Status RFID saya",
      "Apakah RFID saya sudah aktif",
      "Cek status stiker RFID",
      "Status verifikasi RFID kendaraan",
      "RFID saya aktif atau belum",
      "Cek RFID terdaftar",
      "Status tag RFID",
      "Bagaimana status RFID mobil saya",
      "RFID kendaraan saya sudah diverifikasi",
      "Cek keaktifan stiker RFID"
    ]
  },
  {
    id: "rfid_register",
    category: "RFID",
    keywords: ["cara daftar", "registrasi rfid", "buat rfid", "link rfid"],
    variations: [
      "Cara daftar RFID baru",
      "Registrasi stiker RFID",
      "Bagaimana cara membuat RFID",
      "Hubungkan RFID ke kendaraan",
      "Cara link tag RFID",
      "Daftar RFID mobil saya",
      "Cara pasang RFID baru",
      "Mendaftarkan stiker RFID",
      "Bagaimana mendapatkan RFID",
      "Cara aktivasi RFID baru"
    ]
  },
  {
    id: "rfid_troubleshoot",
    category: "RFID",
    keywords: ["error", "gagal scan", "tidak terbaca", "masalah rfid", "rusak"],
    variations: [
      "RFID saya tidak terbaca",
      "Kenapa RFID gagal scan",
      "Masalah pemindaian RFID",
      "Stiker RFID error",
      "RFID tidak terdeteksi",
      "Sensor RFID tidak respon",
      "Solusi RFID tidak terbaca",
      "Kenapa RFID ditolak",
      "Mengatasi RFID rusak",
      "RFID gagal verifikasi"
    ]
  },
  {
    id: "rfid_install",
    category: "RFID",
    keywords: ["tempel", "pasang", "posisi", "lokasi tempel"],
    variations: [
      "Cara pasang stiker RFID",
      "Di mana menempelkan RFID",
      "Posisi terbaik pasang RFID",
      "Panduan pemasangan RFID",
      "Cara tempel RFID di lampu",
      "Tempel RFID di kaca",
      "Lokasi penempelan tag RFID",
      "Bagaimana pasang RFID mobil",
      "Aturan pasang stiker RFID",
      "Pasang RFID agar terbaca"
    ]
  },
  {
    id: "rfid_replace",
    category: "RFID",
    keywords: ["ganti", "baru", "rusak", "hilang", "penggantian"],
    variations: [
      "Bagaimana cara ganti RFID rusak",
      "Ganti stiker RFID yang hilang",
      "Minta stiker RFID baru",
      "Prosedur penggantian RFID",
      "Cara mengajukan RFID pengganti",
      "RFID rusak harus diganti kemana",
      "Ganti stiker RFID baru",
      "Cara beli RFID pengganti",
      "Ganti tag RFID armada",
      "Mengganti RFID yang tidak terbaca"
    ]
  },

  // 3. FUEL
  {
    id: "fuel_recommendation",
    category: "FUEL",
    keywords: ["rekomendasi", "cocok", "terbaik", "pilihan"],
    variations: [
      "BBM yang cocok untuk kendaraan saya",
      "Rekomendasi bahan bakar",
      "BBM terbaik untuk mobil saya",
      "Bahan bakar optimal kendaraan",
      "Jenis BBM kendaraan saya",
      "BBM apa yang direkomendasikan",
      "Rekomendasi bensin mobil saya",
      "Pilihan bahan bakar terbaik",
      "BBM yang disarankan",
      "BBM paling cocok untuk mesin saya"
    ]
  },
  {
    id: "fuel_octane",
    category: "FUEL",
    keywords: ["ron", "oktan", "turbo", "pertamax", "kompresi"],
    variations: [
      "Pertamax atau Turbo yang cocok",
      "RON yang sesuai mesin saya",
      "Oktan yang direkomendasikan",
      "Berapa oktan untuk mobil saya",
      "Rasio kompresi dan RON",
      "RON bensin untuk kendaraan",
      "Apakah boleh pakai Pertamax Turbo",
      "Oktan minimal kendaraan saya",
      "Kompresi mesin dan oktan bbm",
      "Cek kebutuhan RON bbm"
    ]
  },
  {
    id: "fuel_type",
    category: "FUEL",
    keywords: ["jenis bbm", "pilihan bensin", "solar", "pertalite", "dexlite"],
    variations: [
      "Jenis bbm apa saja yang ada",
      "Pilihan bensin di SPBU SFRT",
      "Apakah ada dexlite",
      "Daftar tipe bahan bakar",
      "Bahan bakar diesel apa saja",
      "Tipe bensin yang tersedia",
      "Apakah ada pertalite",
      "Pilihan bensin untuk armada",
      "Daftar bbm aktif",
      "Macam-macam bahan bakar"
    ]
  },
  {
    id: "fuel_prices",
    category: "FUEL",
    keywords: ["harga bbm", "tarif bensin", "biaya per liter", "harga pertamax"],
    variations: [
      "Harga bbm hari ini",
      "Berapa harga pertamax turbo",
      "Daftar harga bensin terbaru",
      "Tarif bahan bakar per liter",
      "Harga bbm per liter",
      "Berapa harga bensin saat ini",
      "Cek harga pertamax",
      "Harga solar terbaru",
      "Berapa harga dexlite sekarang",
      "Daftar tarif bbm hari ini"
    ]
  },
  {
    id: "fuel_compatibility",
    category: "FUEL",
    keywords: ["kompatibilitas", "compatibility", "aman", "mismatch"],
    variations: [
      "Fuel compatibility mobil saya",
      "Apakah bbm ini aman untuk mesin",
      "Kompatibilitas bbm kendaraan",
      "BBM ini kompatibel tidak",
      "Efek salah isi bahan bakar",
      "Apakah mesin saya aman pakai ron 92",
      "Kompatibilitas oktan bensin",
      "Deteksi ketidakcocokan bbm",
      "Apakah mobil saya kompatibel dengan pertamax",
      "Uji kompatibilitas bbm"
    ]
  },

  // 4. TRANSACTION
  {
    id: "transaction_history",
    category: "TRANSACTION",
    keywords: ["riwayat", "history", "daftar transaksi", "pembelian"],
    variations: [
      "Riwayat transaksi saya",
      "Daftar transaksi pengisian bbm",
      "Riwayat pengisian bahan bakar",
      "Lihat histori transaksi",
      "Catatan transaksi bbm",
      "Histori pembelian bensin",
      "Tampilkan semua transaksi",
      "Riwayat bayar bbm",
      "Daftar pembelian bensin",
      "Histori pembayaran saya"
    ]
  },
  {
    id: "transaction_last",
    category: "TRANSACTION",
    keywords: ["terakhir", "terbaru", "pengisian terakhir", "pembelian terakhir"],
    variations: [
      "Tampilkan riwayat pengisian bahan bakar terakhir saya",
      "Transaksi terakhir saya",
      "Pengisian bbm terakhir kapan",
      "Berapa transaksi terakhir saya",
      "Detail pengisian bbm terbaru",
      "Lihat transaksi paling baru",
      "Pembelian terakhir bbm",
      "Berapa liter pengisian terakhir",
      "Detail transaksi terakhir",
      "Riwayat pengisian bbm terakhir"
    ]
  },
  {
    id: "transaction_receipt",
    category: "TRANSACTION",
    keywords: ["struk", "invoice", "receipt", "bukti", "nota"],
    variations: [
      "Unduh struk transaksi",
      "Tampilkan invoice pembayaran",
      "Struk digital pengisian",
      "Bukti bayar bensin",
      "Nota pembelian bbm",
      "Di mana melihat struk",
      "Unduh nota transaksi terakhir",
      "Tampilkan bukti transaksi",
      "Invoice pengisian bbm",
      "Struk transaksi digital saya"
    ]
  },
  {
    id: "transaction_pending",
    category: "TRANSACTION",
    keywords: ["pending", "tertunda", "proses", "belum selesai"],
    variations: [
      "Transaksi pending saya",
      "Mengapa transaksi masih tertunda",
      "Cek transaksi yang sedang diproses",
      "Transaksi belum selesai",
      "Status transaksi pending",
      "Bagaimana nasib transaksi pending",
      "Cek status pending transaksi",
      "Transaksi memotong saldo tapi pending",
      "Solusi transaksi tertunda",
      "Kenapa status transaksi pending"
    ]
  },
  {
    id: "transaction_failed",
    category: "TRANSACTION",
    keywords: ["gagal", "failed", "ditolak", "error"],
    variations: [
      "Kenapa transaksi saya gagal",
      "Transaksi ditolak dispenser",
      "Transaksi error saat pengisian",
      "Gagal melakukan pembayaran bbm",
      "Mengapa pembayaran gagal",
      "Pembayaran bbm ditolak",
      "Solusi transaksi gagal",
      "Penyebab transaksi gagal",
      "Cek transaksi gagal",
      "Transaksi pembayaran error"
    ]
  },

  // 5. DASHBOARD
  {
    id: "dashboard_summary",
    category: "DASHBOARD",
    keywords: ["ringkasan", "summary", "dashboard", "ikhtisar"],
    variations: [
      "Ringkasan dashboard saya",
      "Tampilkan ringkasan akun",
      "Summary dashboard hari ini",
      "Ikhtisar dashboard saya",
      "Ringkasan profil dan armada",
      "Dashboard summary saya",
      "Lihat ringkasan aktivitas",
      "Ikhtisar akun di dashboard",
      "Tampilkan rangkuman dashboard",
      "Rangkuman dashboard saya"
    ]
  },
  {
    id: "dashboard_view",
    category: "DASHBOARD",
    keywords: ["lihat dashboard", "buka dashboard", "tampilan dashboard"],
    variations: [
      "Buka dashboard saya",
      "Tampilkan dashboard utama",
      "Lihat dashboard saat ini",
      "Tampilan dashboard akun",
      "Masuk ke dashboard",
      "Tunjukkan dashboard saya",
      "Dashboard utama saya",
      "Akses dashboard",
      "Buka halaman utama dashboard",
      "Tampilan menu dashboard"
    ]
  },
  {
    id: "dashboard_stats",
    category: "DASHBOARD",
    keywords: ["statistik", "data dashboard", "angka", "performa"],
    variations: [
      "Statistik dashboard saya",
      "Data di dashboard saya",
      "Angka performa di dashboard",
      "Tampilkan statistik akun",
      "Cek data statistik dashboard",
      "Statistik ringkasan dashboard",
      "Lihat data di dashboard",
      "Rincian angka dashboard",
      "Statistik aktivitas dashboard",
      "Data ringkasan dashboard"
    ]
  },
  {
    id: "dashboard_reset",
    category: "DASHBOARD",
    keywords: ["reset", "bersihkan dashboard", "atur ulang"],
    variations: [
      "Reset dashboard saya",
      "Atur ulang tampilan dashboard",
      "Bersihkan widget dashboard",
      "Reset data tampilan",
      "Bagaimana cara reset dashboard",
      "Atur kembali tata letak dashboard",
      "Reset setting dashboard",
      "Kembalikan tampilan dashboard awal",
      "Bersihkan halaman dashboard",
      "Reset widget utama"
    ]
  },
  {
    id: "dashboard_activity",
    category: "DASHBOARD",
    keywords: ["aktivitas terbaru", "log aktivitas", "tindakan terbaru"],
    variations: [
      "Aktivitas terbaru saya",
      "Log aktivitas dashboard",
      "Tindakan terbaru di akun",
      "Cek aktivitas di dashboard",
      "Daftar aktivitas terakhir",
      "Histori log dashboard",
      "Aktivitas login dan transaksi",
      "Lihat log aktivitas user",
      "Tampilkan aktivitas terakhir",
      "Aktivitas akun terbaru"
    ]
  },

  // 6. STATION
  {
    id: "station_nearest",
    category: "STATION",
    keywords: ["terdekat", "spbu terdekat", "lokasi terdekat", "paling dekat"],
    variations: [
      "Di mana lokasi stasiun pengisian terdekat",
      "SPBU terdekat dari lokasi saya",
      "Stasiun pengisian paling dekat",
      "Cek SPBU SFRT terdekat",
      "Di mana pom bensin terdekat",
      "SPBU terdekat di mana",
      "Temukan stasiun terdekat",
      "Lokasi SPBU paling dekat",
      "Cek lokasi stasiun pengisian terdekat",
      "Stasiun terdekat dari sini"
    ]
  },
  {
    id: "station_list",
    category: "STATION",
    keywords: ["daftar stasiun", "daftar spbu", "semua lokasi"],
    variations: [
      "Daftar stasiun SPBU aktif",
      "Semua lokasi SPBU SFRT",
      "Di mana saja stasiun pengisian",
      "List SPBU yang tersedia",
      "Daftar pom bensin SFRT",
      "Lokasi stasiun pengisian bbm",
      "Daftar lokasi SPBU",
      "Daftar stasiun pengisian bensin",
      "Di mana saja lokasi SPBU terdaftar",
      "Semua stasiun pengisian"
    ]
  },
  {
    id: "station_address",
    category: "STATION",
    keywords: ["alamat spbu", "alamat stasiun", "lokasi tepat"],
    variations: [
      "Alamat stasiun SPBU",
      "Di mana alamat lengkap SPBU terdekat",
      "Lokasi tepat stasiun pengisian",
      "Alamat pom bensin SFRT",
      "Detail alamat stasiun bbm",
      "Alamat lengkap SPBU",
      "Di mana jalan stasiun pengisian",
      "Lokasi alamat SPBU",
      "Detail alamat pom bensin",
      "Alamat stasiun pengisian bensin"
    ]
  },
  {
    id: "station_status",
    category: "STATION",
    keywords: ["operasional", "buka", "tutup", "status spbu"],
    variations: [
      "Status operasional SPBU",
      "Apakah SPBU terdekat sedang buka",
      "Cek status buka tutup stasiun",
      "Apakah stasiun sedang beroperasi",
      "SPBU buka 24 jam",
      "Status aktif stasiun",
      "Apakah stasiun sedang tutup",
      "Jam operasional stasiun",
      "Apakah SPBU sedang perbaikan",
      "Status buka stasiun pengisian"
    ]
  },
  {
    id: "station_route",
    category: "STATION",
    keywords: ["rute", "peta", "navigasi", "gps"],
    variations: [
      "Tampilkan rute ke stasiun",
      "Peta navigasi ke SPBU",
      "Rute tercepat ke pom bensin",
      "Petunjuk jalan ke stasiun",
      "Peta lokasi SPBU",
      "Navigasi GPS ke stasiun pengisian",
      "Rute jalan ke SPBU terdekat",
      "Tunjukkan jalan ke pom bensin",
      "Peta rute stasiun",
      "Navigasi rute SPBU"
    ]
  },

  // 7. QUEUE
  {
    id: "queue_status",
    category: "QUEUE",
    keywords: ["status antrian", "nomor antrian", "tiket antrian"],
    variations: [
      "Estimasi antrian saat ini",
      "Status antrian saya",
      "Berapa nomor antrian saya",
      "Apakah saya sedang mengantri",
      "Cek tiket antrian aktif",
      "Status antrian dispenser",
      "Berapa nomor tiket antrian saya",
      "Cek status antrian saat ini",
      "Tiket antrian aktif saya",
      "Bagaimana status antrian kendaraan saya"
    ]
  },
  {
    id: "queue_estimate",
    category: "QUEUE",
    keywords: ["estimasi antrian", "waktu tunggu", "menit", "lama antri"],
    variations: [
      "Estimasi waktu tunggu antrian",
      "Berapa lama saya harus mengantri",
      "Estimasi menit antrian",
      "Berapa menit lagi giliran saya",
      "Waktu tunggu dispenser terdekat",
      "Estimasi waktu antri bensin",
      "Lama antrian saat ini",
      "Berapa lama antrian di SPBU",
      "Waktu tunggu giliran pengisian",
      "Estimasi waktu tunggu dispenser"
    ]
  },
  {
    id: "queue_lane",
    category: "QUEUE",
    keywords: ["lajur", "lane", "dispenser", "pompa"],
    variations: [
      "Lajur antrian saya",
      "Saya harus masuk lajur berapa",
      "Dispenser lajur aktif",
      "Lajur pengisian mana yang kosong",
      "Cek lajur antrian dispenser",
      "Nomor lajur pengisian",
      "Lajur antrian SPBU terdekat",
      "Informasi lajur dispenser",
      "Lajur dispenser aktif",
      "Cek lajur pengisian bbm"
    ]
  },
  {
    id: "queue_join",
    category: "QUEUE",
    keywords: ["masuk antrian", "gabung antrian", "ambil tiket", "booking"],
    variations: [
      "Bagaimana cara masuk antrian",
      "Cara gabung antrian online",
      "Ambil tiket antrian SPBU",
      "Booking antrian pengisian",
      "Cara mengantri di SPBU SFRT",
      "Bagaimana cara ambil nomor antrian",
      "Masuk antrian dispenser",
      "Cara daftar antrian bensin",
      "Gabung antrian dispenser terdekat",
      "Ambil tiket antrian bbm"
    ]
  },
  {
    id: "queue_cancel",
    category: "QUEUE",
    keywords: ["batal antrian", "cancel tiket", "keluar antrian"],
    variations: [
      "Batalkan antrian saya",
      "Cara cancel tiket antrian",
      "Keluar dari antrian aktif",
      "Batalkan nomor antrian",
      "Bagaimana cara membatalkan antrian",
      "Batal mengantri bensin",
      "Cancel tiket dispenser",
      "Keluar dari lajur antrian",
      "Batal antrian dispenser",
      "Cara batalkan tiket antri"
    ]
  },

  // 8. NOTIFICATION
  {
    id: "notification_list",
    category: "NOTIFICATION",
    keywords: ["daftar notifikasi", "inbox", "kotak masuk", "pesan"],
    variations: [
      "Notifikasi saya",
      "Tampilkan notifikasi saya",
      "Lihat kotak masuk notifikasi",
      "Daftar pemberitahuan terbaru",
      "Pesan masuk di akun saya",
      "Inbox notifikasi saya",
      "Lihat daftar notifikasi",
      "Tampilkan semua notifikasi",
      "Pemberitahuan masuk",
      "Cek notifikasi akun"
    ]
  },
  {
    id: "notification_unread",
    category: "NOTIFICATION",
    keywords: ["belum dibaca", "unread", "notif baru"],
    variations: [
      "Notifikasi belum dibaca",
      "Berapa notifikasi baru saya",
      "Cek unread notifikasi",
      "Apakah ada pesan baru",
      "Tampilkan notif belum dibaca",
      "Notifikasi baru yang masuk",
      "Ada pemberitahuan baru",
      "Pesan unread di inbox",
      "Cek pemberitahuan belum dibaca",
      "Jumlah notif belum dibaca"
    ]
  },
  {
    id: "notification_settings",
    category: "NOTIFICATION",
    keywords: ["pengaturan notifikasi", "alert setting", "push notif"],
    variations: [
      "Pengaturan notifikasi saya",
      "Cara mematikan notifikasi",
      "Ubah setelan pemberitahuan",
      "Setting alert notifikasi",
      "Aktifkan push notif",
      "Bagaimana mengatur notifikasi",
      "Pengaturan suara notifikasi",
      "Setelan inbox pemberitahuan",
      "Ubah pengaturan notif",
      "Setting push notification"
    ]
  },
  {
    id: "notification_read",
    category: "NOTIFICATION",
    keywords: ["tandai dibaca", "read all", "baca notif"],
    variations: [
      "Tandai semua notifikasi dibaca",
      "Bagaimana cara membaca notifikasi",
      "Tandai sebagai dibaca",
      "Read all notification",
      "Cara hilangkan tanda notifikasi",
      "Tandai pesan dibaca",
      "Bagaimana menandai notif dibaca",
      "Tandai pemberitahuan sebagai dibaca",
      "Buka semua notifikasi",
      "Tandai dibaca semua pesan"
    ]
  },
  {
    id: "notification_clear",
    category: "NOTIFICATION",
    keywords: ["hapus notifikasi", "bersihkan inbox", "delete notif"],
    variations: [
      "Hapus notifikasi saya",
      "Bersihkan kotak masuk notifikasi",
      "Hapus semua pemberitahuan",
      "Delete notification",
      "Hapus pesan masuk",
      "Cara bersihkan notifikasi",
      "Hapus histori notifikasi",
      "Bersihkan notif di dashboard",
      "Hapus semua inbox",
      "Bagaimana hapus notifikasi"
    ]
  },

  // 9. ACCOUNT
  {
    id: "account_profile",
    category: "ACCOUNT",
    keywords: ["status akun", "profil saya", "detail akun"],
    variations: [
      "Status akun saya",
      "Lihat profil saya",
      "Tampilkan detail akun",
      "Informasi profil saya",
      "Detail data akun saya",
      "Profil akun terdaftar",
      "Tunjukkan data diri saya",
      "Cek status akun",
      "Akun saya aktif atau tidak",
      "Biodata akun saya"
    ]
  },
  {
    id: "account_edit",
    category: "ACCOUNT",
    keywords: ["edit profil", "ubah nama", "ganti nomor hp"],
    variations: [
      "Ubah data profil saya",
      "Edit nama akun saya",
      "Ganti nomor handphone",
      "Bagaimana edit profil",
      "Cara ubah nama di aplikasi",
      "Ganti data akun terdaftar",
      "Update profil saya",
      "Ubah email atau nomor hp",
      "Edit profil akun",
      "Cara update data diri"
    ]
  },
  {
    id: "account_role",
    category: "ACCOUNT",
    keywords: ["role", "hak akses", "fleet manager", "driver"],
    variations: [
      "Role akun saya apa",
      "Apakah saya fleet manager",
      "Hak akses akun saya",
      "Cek role pengemudi",
      "Tipe akun terdaftar",
      "Apakah saya driver atau manajer",
      "Tampilkan tingkat akses akun",
      "Cek role akun",
      "Hak akses fleet manager",
      "Role saya di aplikasi"
    ]
  },
  {
    id: "account_delete",
    category: "ACCOUNT",
    keywords: ["hapus akun", "deaktivasi", "tutup akun"],
    variations: [
      "Hapus akun saya",
      "Cara deaktifkan akun",
      "Tutup akun terdaftar",
      "Deaktivasi akun SFRT",
      "Bagaimana cara hapus akun",
      "Hapus data diri dari aplikasi",
      "Tutup akun selamanya",
      "Prosedur hapus akun",
      "Deaktivasi profil user",
      "Ingin menghapus akun saya"
    ]
  },
  {
    id: "account_email",
    category: "ACCOUNT",
    keywords: ["email akun", "ubah email", "ganti email"],
    variations: [
      "Ubah alamat email saya",
      "Email yang terdaftar di akun",
      "Ganti email login",
      "Bagaimana cara ubah email",
      "Email terdaftar saya",
      "Cara ganti email akun",
      "Update email terdaftar",
      "Ganti email SFRT",
      "Email akun saat ini",
      "Ubah email login aplikasi"
    ]
  },

  // 10. SECURITY
  {
    id: "security_password",
    category: "SECURITY",
    keywords: ["sandi", "password", "ubah password", "ganti sandi"],
    variations: [
      "Cara ganti password akun",
      "Ubah kata sandi saya",
      "Ganti password login",
      "Reset kata sandi",
      "Bagaimana cara ganti sandi",
      "Lupa password akun",
      "Update password login",
      "Cara reset password",
      "Ganti sandi akun saya",
      "Ubah password login aplikasi"
    ]
  },
  {
    id: "security_pin",
    category: "SECURITY",
    keywords: ["pin", "pin pembayaran", "ubah pin"],
    variations: [
      "Ganti PIN pembayaran",
      "Cara buat PIN transaksi",
      "Ubah PIN dompet digital",
      "Lupa PIN transaksi",
      "Setting PIN pembayaran",
      "PIN dompet digital saya",
      "Cara reset PIN bayar",
      "Buat PIN baru",
      "Update PIN transaksi",
      "Pengaturan PIN keamanan"
    ]
  },
  {
    id: "security_2fa",
    category: "SECURITY",
    keywords: ["2fa", "dua faktor", "verifikasi ganda", "authenticator"],
    variations: [
      "Aktifkan verifikasi dua faktor",
      "Cara setting 2FA",
      "Keamanan dua langkah",
      "Aktifkan Google Authenticator",
      "Verifikasi ganda akun",
      "Setting 2FA keamanan",
      "Cara mengaktifkan 2FA",
      "Autentikasi dua faktor",
      "Keamanan verifikasi ganda",
      "Cara pakai authenticator"
    ]
  },
  {
    id: "security_sessions",
    category: "SECURITY",
    keywords: ["perangkat aktif", "login sesi", "device terhubung"],
    variations: [
      "Perangkat yang login di akun saya",
      "Cek sesi login aktif",
      "Daftar device terhubung",
      "Keluarkan perangkat lain",
      "Sesi login aktif saat ini",
      "Cek riwayat perangkat login",
      "Daftar login device",
      "Sesi aktif akun saya",
      "Device terdaftar login",
      "Keluarkan sesi perangkat lain"
    ]
  },
  {
    id: "security_fraud",
    category: "SECURITY",
    keywords: ["fraud", "suspicious", "mencurigakan", "hack"],
    variations: [
      "Deteksi login mencurigakan",
      "Apakah akun saya di-hack",
      "Keamanan akun dibobol",
      "Peringatan login tidak dikenal",
      "Laporan percobaan masuk akun",
      "Akun saya aman dari hacker",
      "Deteksi penipuan RFID",
      "Upaya login mencurigakan",
      "Cek keamanan akun dibobol",
      "Notifikasi percobaan login"
    ]
  },

  // 11. ANALYTICS
  {
    id: "analytics_spending",
    category: "ANALYTICS",
    keywords: ["analisis spending", "tren biaya", "grafik pengeluaran"],
    variations: [
      "Analisis spending bbm saya",
      "Grafik tren pengeluaran bbm",
      "Analisis biaya bbm bulan ini",
      "Bagaimana tren belanja bbm saya",
      "Analitik pengeluaran bensin",
      "Grafik biaya pengisian bbm",
      "Laporan analitik pengeluaran",
      "Tren finansial bbm",
      "Analisis budget bbm harian",
      "Grafik pengeluaran bulanan"
    ]
  },
  {
    id: "analytics_consumption",
    category: "ANALYTICS",
    keywords: ["konsumsi", "efisiensi bbm", "grafik konsumsi"],
    variations: [
      "Analisis konsumsi bbm kendaraan",
      "Grafik efisiensi bahan bakar",
      "Analitik penggunaan bensin mobil",
      "Rasio konsumsi bbm armada",
      "Tren konsumsi bensin bulanan",
      "Analisis efisiensi bbm",
      "Grafik konsumsi bahan bakar",
      "Bagaimana kehematan bbm kendaraan saya",
      "Laporan efisiensi bbm mobil",
      "Analisis pemakaian bbm"
    ]
  },
  {
    id: "analytics_fleet",
    category: "ANALYTICS",
    keywords: ["analisis fleet", "performa armada", "analitik armada"],
    variations: [
      "Analisis performa armada",
      "Analitik kendaraan perusahaan",
      "Laporan performa armada bbm",
      "Grafik pemakaian bbm armada",
      "Analisis fleet kendaraan",
      "Statistik performa armada mobil",
      "Laporan efisiensi armada",
      "Analisis konsumsi bbm fleet",
      "Grafik efisiensi armada",
      "Analitik performa kendaraan"
    ]
  },
  {
    id: "analytics_weekly",
    category: "ANALYTICS",
    keywords: ["laporan mingguan", "weekly report", "rekap mingguan"],
    variations: [
      "Laporan mingguan bbm saya",
      "Weekly report pengisian bbm",
      "Rekap mingguan pengeluaran bensin",
      "Analisis pemakaian bbm mingguan",
      "Grafik mingguan transaksi bbm",
      "Laporan mingguan efisiensi",
      "Summary mingguan dashboard",
      "Analitik transaksi mingguan",
      "Mingguan report bbm",
      "Weekly summary bensin"
    ]
  },
  {
    id: "analytics_prediction",
    category: "ANALYTICS",
    keywords: ["prediksi", "forecast", "perkiraan bbm"],
    variations: [
      "Prediksi pemakaian bbm bulan depan",
      "Perkiraan biaya bbm minggu depan",
      "Forecast pengeluaran bensin",
      "Prediksi kebutuhan bbm armada",
      "Estimasi pengeluaran bbm mendatang",
      "Perkiraan pengisian bensin",
      "Prediksi habisnya bbm kendaraan",
      "Forecast bbm kendaraan saya",
      "Estimasi konsumsi bbm depan",
      "Prediksi pengeluaran bbm"
    ]
  },

  // 12. SPENDING
  {
    id: "spending_total",
    category: "SPENDING",
    keywords: ["pengeluaran bulan ini", "total spending", "biaya bulan ini"],
    variations: [
      "Pengeluaran bulan ini",
      "Total spending bbm saya",
      "Biaya pengisian bbm bulan ini",
      "Berapa total belanja bensin saya",
      "Pengeluaran bbm bulan berjalan",
      "Berapa rupiah habis untuk bbm",
      "Total pengeluaran bbm saat ini",
      "Belanja bensin bulan ini berapa",
      "Total biaya bbm saya",
      "Berapa pengeluaran bbm bulan ini"
    ]
  },
  {
    id: "spending_limit",
    category: "SPENDING",
    keywords: ["limit budget", "batas pengeluaran", "setting limit"],
    variations: [
      "Batas pengeluaran bbm saya",
      "Cara setting limit budget bbm",
      "Limit pengeluaran harian bensin",
      "Atur batas belanja bbm",
      "Batas pengeluaran bulanan mobil",
      "Cara pasang limit pengeluaran",
      "Limit spending bbm",
      "Atur budget maksimal bbm",
      "Batas pengisian bbm rupiah",
      "Setting limit pengeluaran bbm"
    ]
  },
  {
    id: "spending_average",
    category: "SPENDING",
    keywords: ["rata-rata spending", "rata-rata pengeluaran", "average cost"],
    variations: [
      "Rata-rata pengeluaran bbm",
      "Berapa rata-rata belanja bensin saya",
      "Rata-rata pengisian bbm sekali transaksi",
      "Average spending bbm",
      "Rata-rata rupiah per pengisian",
      "Berapa rata-rata biaya bbm mingguan",
      "Rata-rata pengeluaran bensin bulanan",
      "Average cost refueling",
      "Rata-rata uang bensin saya",
      "Berapa rata-rata spending bbm"
    ]
  },
  {
    id: "spending_highest",
    category: "SPENDING",
    keywords: ["pengeluaran terbesar", "transaksi tertinggi", "highest spending"],
    variations: [
      "Pengeluaran bbm terbesar saya",
      "Transaksi bbm tertinggi",
      "Kapan pengisian bbm termahal saya",
      "Highest spending bensin",
      "Biaya pengisian paling mahal",
      "Transaksi dengan nominal terbesar",
      "Berapa pengeluaran bbm termahal",
      "Detail transaksi bbm terbesar",
      "Catatan spending bbm tertinggi",
      "Pengisian bbm nominal tertinggi"
    ]
  },
  {
    id: "spending_saving",
    category: "SPENDING",
    keywords: ["tips hemat", "cara menghemat", "hemat biaya bbm"],
    variations: [
      "Tips hemat pengeluaran bbm",
      "Cara menghemat biaya bensin",
      "Bagaimana cara menghemat bbm mobil",
      "Tips kurangi pengeluaran bbm",
      "Cara hemat budget bensin harian",
      "Hemat biaya bbm armada",
      "Bagaimana menghemat uang bbm",
      "Tips berkendara hemat bbm",
      "Cara menekan pengeluaran bensin",
      "Tips efisiensi biaya bbm"
    ]
  },

  // 13. FLEET
  {
    id: "fleet_overview",
    category: "FLEET",
    keywords: ["armada perusahaan", "manajemen armada", "fleet overview"],
    variations: [
      "Ringkasan armada perusahaan saya",
      "Fleet overview kendaraan korporat",
      "Status semua kendaraan armada",
      "Daftar kendaraan korporat",
      "Manajemen armada mobil perusahaan",
      "Dashboard fleet perusahaan",
      "Overview armada aktif",
      "Data kendaraan fleet terdaftar",
      "Informasi armada korporasi",
      "Lihat status fleet"
    ]
  },
  {
    id: "fleet_assign",
    category: "FLEET",
    keywords: ["tunjuk driver", "assign driver", "tugaskan sopir"],
    variations: [
      "Cara menugaskan sopir ke mobil",
      "Assign driver ke kendaraan",
      "Tugaskan driver ke armada",
      "Hubungkan sopir dengan mobil",
      "Bagaimana assign driver di aplikasi",
      "Tugaskan pengemudi baru",
      "Hubungkan armada dengan sopir",
      "Assign driver armada perusahaan",
      "Bagaimana daftarkan driver ke mobil",
      "Tunjuk sopir armada"
    ]
  },
  {
    id: "fleet_unassign",
    category: "FLEET",
    keywords: ["hapus driver", "unassign driver", "lepas sopir"],
    variations: [
      "Hapus driver dari mobil",
      "Unassign driver kendaraan",
      "Lepas sopir dari armada",
      "Putuskan hubungan driver dan mobil",
      "Bagaimana cara unassign driver",
      "Hapus pengemudi dari armada",
      "Cabut tugas driver mobil",
      "Hapus asosiasi driver kendaraan",
      "Cara unassign driver armada",
      "Lepaskan tugas sopir"
    ]
  },
  {
    id: "fleet_limit",
    category: "FLEET",
    keywords: ["limit armada", "kuota bbm fleet", "limit driver"],
    variations: [
      "Batas kuota bbm armada perusahaan",
      "Limit pengisian bbm fleet",
      "Atur kuota bbm untuk driver",
      "Batas maksimal bbm kendaraan fleet",
      "Cara pasang limit bbm armada",
      "Limit harian driver perusahaan",
      "Atur batas pengisian bbm armada",
      "Limitasi bbm fleet manager",
      "Atur kuota bbm sopir",
      "Limit pengisian kendaraan perusahaan"
    ]
  },
  {
    id: "fleet_usage",
    category: "FLEET",
    keywords: ["penggunaan bbm armada", "efisiensi fleet", "laporan fleet"],
    variations: [
      "Laporan pemakaian bbm armada",
      "Penggunaan bensin fleet bulan ini",
      "Cek konsumsi bbm seluruh mobil perusahaan",
      "Laporan bulanan bbm fleet",
      "Efisiensi penggunaan bbm armada",
      "Rincian pemakaian bbm kendaraan fleet",
      "Cek pengeluaran bbm armada korporat",
      "Statistik pemakaian bbm fleet",
      "Total konsumsi bbm armada",
      "Laporan pemakaian bensin perusahaan"
    ]
  },

  // 14. PAYMENT
  {
    id: "payment_methods",
    category: "PAYMENT",
    keywords: ["metode bayar", "pilihan pembayaran", "qris bank"],
    variations: [
      "Metode pembayaran yang tersedia",
      "Bisa bayar pakai apa saja",
      "Pilihan pembayaran bbm",
      "Apakah bisa bayar pakai kartu debit",
      "Metode pembayaran di SPBU",
      "Bayar bbm pakai e-wallet",
      "Metode bayar digital di aplikasi",
      "Daftar cara pembayaran",
      "Apakah bisa transfer bank",
      "Pilihan bayar bensin"
    ]
  },
  {
    id: "payment_topup",
    category: "PAYMENT",
    keywords: ["top up saldo", "isi saldo", "isi dompet"],
    variations: [
      "Cara top up saldo SFRT",
      "Bagaimana isi saldo dompet digital",
      "Isi saldo akun bensin",
      "Panduan top up saldo",
      "Isi deposit akun saya",
      "Top up saldo lewat m-banking",
      "Cara tambah saldo dompet",
      "Isi saldo SFRT lewat QRIS",
      "Top up dana pengisian bbm",
      "Bagaimana isi saldo akun"
    ]
  },
  {
    id: "payment_auto_deduct",
    category: "PAYMENT",
    keywords: ["auto deduct", "debit otomatis", "potong langsung"],
    variations: [
      "Cara aktifkan auto deduct",
      "Pembayaran potong saldo otomatis",
      "Auto deduct pembayaran bbm",
      "Cara bayar otomatis tanpa scan",
      "Aktifkan debit otomatis saldo",
      "Bagaimana auto deduct bekerja",
      "Setelan pembayaran potong otomatis",
      "Bayar langsung potong saldo",
      "Debit otomatis dompet digital",
      "Aktifkan auto payment bbm"
    ]
  },
  {
    id: "payment_balance",
    category: "PAYMENT",
    keywords: ["cek saldo", "sisa saldo", "saldo dompet"],
    variations: [
      "Berapa sisa saldo saya",
      "Cek saldo dompet digital",
      "Sisa saldo akun SFRT",
      "Tampilkan saldo saya",
      "Informasi saldo akun",
      "Cek sisa deposit",
      "Berapa saldo terdaftar",
      "Cek dompet digital bbm",
      "Sisa saldo pembayaran bensin",
      "Berapa saldo akun saya"
    ]
  },
  {
    id: "payment_failed",
    category: "PAYMENT",
    keywords: ["gagal bayar", "saldo tidak cukup", "pembayaran error"],
    variations: [
      "Kenapa pembayaran saldo saya gagal",
      "Saldo tidak cukup saat bayar bbm",
      "Masalah pembayaran e-wallet",
      "Gagal debit otomatis",
      "Solusi pembayaran saldo error",
      "Kenapa top up tidak masuk",
      "Pembayaran ditolak saldo kurang",
      "Mengatasi gagal bayar di dispenser",
      "Transaksi gagal saldo terpotong",
      "Masalah transfer top up"
    ]
  },

  // 15. QRIS
  {
    id: "qris_pay",
    category: "QRIS",
    keywords: ["qris bbm", "bayar qris", "qris dinamis"],
    variations: [
      "Cara bayar pakai QRIS",
      "Apakah bisa bayar pakai QRIS",
      "QRIS pembayaran bbm",
      "Bayar bensin pakai QRIS",
      "Metode bayar QRIS dinamis",
      "Scan QRIS untuk pembayaran",
      "Pembayaran bbm via QRIS",
      "Apakah dispenser support QRIS",
      "Bayar pengisian bbm pakai QRIS",
      "Bagaimana bayar bbm pakai QRIS"
    ]
  },
  {
    id: "qris_generate",
    category: "QRIS",
    keywords: ["buat qris", "generate qris", "tampilkan qris"],
    variations: [
      "Cara memunculkan QRIS di layar",
      "Generate QRIS transaksi",
      "Buat kode QRIS pembayaran",
      "Tampilkan QRIS di dispenser",
      "Bagaimana memunculkan QRIS bensin",
      "Buat barcode QRIS",
      "Generate QRIS dinamis bbm",
      "Cara membuat barcode QRIS",
      "Tampilkan QRIS pembayaran",
      "Cara generate QRIS bayar"
    ]
  },
  {
    id: "qris_scan",
    category: "QRIS",
    keywords: ["scan qr", "scan barcode", "cara scan"],
    variations: [
      "Bagaimana cara scan QRIS",
      "Scan barcode bbm di dispenser",
      "Di mana scan QRIS SPBU",
      "Cara scan qr code pembayaran",
      "Cara scan HP di dispenser",
      "Pindai QRIS pembayaran",
      "Bagaimana scan barcode bensin",
      "Cara scan QRIS via m-banking",
      "Pindai barcode bayar bbm",
      "Scan barcode pembayaran bbm"
    ]
  },
  {
    id: "qris_expired",
    category: "QRIS",
    keywords: ["qris kedaluwarsa", "qris expired", "qr timeout"],
    variations: [
      "Mengapa QRIS saya kedaluwarsa",
      "QRIS expired sebelum dibayar",
      "Berapa lama batas waktu QRIS",
      "Solusi QRIS kedaluwarsa",
      "QRIS timeout di dispenser",
      "Mengapa qr code expired",
      "QRIS tidak bisa di-scan karena expired",
      "Berapa menit limit QRIS",
      "Mengatasi barcode bbm expired",
      "QRIS transaksi expired"
    ]
  },
  {
    id: "qris_refund",
    category: "QRIS",
    keywords: ["refund qris", "pengembalian qris", "salah bayar"],
    variations: [
      "Refund dana pembayaran QRIS",
      "Bagaimana pengembalian saldo QRIS",
      "Sistem refund gagal scan QRIS",
      "Uang terpotong QRIS gagal",
      "Refund dana salah bayar QRIS",
      "Cara mengajukan refund QRIS",
      "Pengembalian dana transaksi QRIS",
      "Refund pembayaran bbm gagal QRIS",
      "Uang QRIS menggantung kembali kemana",
      "Bagaimana refund transaksi QRIS"
    ]
  },

  // 16. HISTORY
  {
    id: "history_refuel",
    category: "HISTORY",
    keywords: ["riwayat isi", "histori refuel", "catatan isi bbm"],
    variations: [
      "Riwayat pengisian bbm lengkap",
      "Histori refuel kendaraan saya",
      "Catatan pengisian bbm setahun",
      "Daftar riwayat isi bensin",
      "Histori pengisian bahan bakar mobil",
      "Riwayat tangki bensin diisi",
      "Catatan volume liter bbm",
      "Histori volume pengisian bbm",
      "Daftar pengisian bbm armada",
      "Riwayat tangki diisi bensin"
    ]
  },
  {
    id: "history_login",
    category: "HISTORY",
    keywords: ["riwayat login", "histori masuk", "catatan login"],
    variations: [
      "Riwayat login akun saya",
      "Histori masuk aplikasi",
      "Catatan ip address login",
      "Kapan terakhir saya login",
      "Daftar riwayat masuk akun",
      "Cek login history",
      "Histori aktivitas masuk user",
      "Catatan waktu login",
      "Daftar perangkat login historis",
      "Riwayat login terdeteksi"
    ]
  },
  {
    id: "history_alerts",
    category: "HISTORY",
    keywords: ["riwayat alert", "histori peringatan", "log bahaya"],
    variations: [
      "Riwayat alert keamanan",
      "Histori peringatan akun",
      "Log bahaya di spbu",
      "Daftar peringatan fraud lama",
      "Histori alert kendaraan",
      "Catatan alarm keamanan",
      "Daftar peringatan keselamatan",
      "Riwayat alert sistem",
      "Log alert terdeteksi",
      "Cek histori alarm keamanan"
    ]
  },
  {
    id: "history_export",
    category: "HISTORY",
    keywords: ["ekspor history", "download csv", "cetak pdf"],
    variations: [
      "Cara ekspor riwayat transaksi",
      "Download laporan transaksi PDF",
      "Unduh file CSV riwayat bbm",
      "Cetak laporan pengisian bbm",
      "Ekspor data transaksi armada",
      "Unduh excel riwayat pengisian",
      "Bagaimana download history transaksi",
      "Ekspor laporan bulanan bbm",
      "Download struk transaksi bulanan",
      "Cetak rekap transaksi bbm"
    ]
  },
  {
    id: "history_clear",
    category: "HISTORY",
    keywords: ["bersihkan riwayat", "clear history", "hapus log"],
    variations: [
      "Cara bersihkan riwayat pengisian",
      "Hapus log transaksi lama",
      "Clear history akun bensin",
      "Hapus catatan riwayat bbm",
      "Bersihkan log aktivitas user",
      "Bagaimana hapus riwayat transaksi",
      "Hapus history login",
      "Bersihkan log masuk aplikasi",
      "Hapus data riwayat armada",
      "Clear log history"
    ]
  },

  // 17. ALERTS
  {
    id: "alerts_safety",
    category: "ALERTS",
    keywords: ["keselamatan spbu", "larangan", "aturan aman"],
    variations: [
      "Aturan keselamatan di SPBU",
      "Larangan selama pengisian bbm",
      "Aturan aman isi bensin",
      "Bahaya main HP di pom bensin",
      "Apakah boleh merokok di SPBU",
      "Keselamatan area dispenser bbm",
      "Prosedur aman pengisian bbm",
      "Larangan mesin hidup saat isi bbm",
      "Aturan keselamatan pengisian RFID",
      "Keselamatan zona bahaya gas bbm"
    ]
  },
  {
    id: "alerts_low_fuel",
    category: "ALERTS",
    keywords: ["bensin tiris", "low fuel", "tangki kosong"],
    variations: [
      "Peringatan bensin tiris",
      "Notifikasi low fuel kendaraan",
      "BBM hampir habis di tangki",
      "Alarm bensin mau habis",
      "Pemberitahuan tangki kosong",
      "Notif bahan bakar kritis",
      "Cek peringatan low fuel",
      "Kapan notif bensin tiris menyala",
      "Deteksi tangki bensin kritis",
      "Notif bahan bakar rendah"
    ]
  },
  {
    id: "alerts_fraud_attempt",
    category: "ALERTS",
    keywords: ["kecurangan rfid", "fraud attempt", "plat tidak cocok"],
    variations: [
      "Alarm jackpot kecurangan",
      "Notifikasi plat nomor tidak cocok",
      "Fraud attempt stiker RFID",
      "Peringatan pencurian bbm",
      "Alarm mismatch plat dan RFID",
      "Deteksi fraud di lajur SPBU",
      "Upaya kecurangan pengisian",
      "Laporan kecurangan RFID",
      "Notif plat nomor ilegal",
      "Fraud alert dispenser"
    ]
  },
  {
    id: "alerts_system",
    category: "ALERTS",
    keywords: ["sistem down", "pemeliharaan server", "alert sistem"],
    variations: [
      "Pemberitahuan sistem down",
      "Informasi pemeliharaan server",
      "Alert sistem tidak terkoneksi",
      "Maintenance database hari ini",
      "Gangguan jaringan SPBU",
      "Sistem pembayaran offline",
      "Informasi server gangguan",
      "Alert pemeliharaan sistem",
      "Server maintenance info",
      "Sistem offline SPBU"
    ]
  },
  {
    id: "alerts_maintenance",
    category: "ALERTS",
    keywords: ["pompa rusak", "dispenser dirawat", "kalibrasi pompa"],
    variations: [
      "Peringatan pompa sedang diperbaiki",
      "Dispenser dalam pemeliharaan",
      "Info kalibrasi pompa bbm",
      "Dispenser rusak lajur berapa",
      "Notif pemeliharaan dispenser SPBU",
      "Pompa bensin error",
      "Lajur dispenser ditutup sementara",
      "Kalibrasi dispenser bulanan",
      "Status perbaikan pompa",
      "Informasi maintenance pompa"
    ]
  },

  // 18. REFUEL
  {
    id: "refuel_process",
    category: "REFUEL",
    keywords: ["alur isi bbm", "proses refuel", "cara otomatis"],
    variations: [
      "Bagaimana proses pengisian otomatis",
      "Alur isi bbm pakai RFID",
      "Langkah pengisian otomatis bensin",
      "Cara kerja fast refuel otomatis",
      "Proses pengisian bbm tanpa sentuh",
      "Tahapan isi bensin otomatis",
      "Cara isi bbm di lajur RFID",
      "Bagaimana otomatisasi dispenser bekerja",
      "Alur drive-in pengisian bbm",
      "Prosedur pengisian bbm otomatis"
    ]
  },
  {
    id: "refuel_manual",
    category: "REFUEL",
    keywords: ["refuel manual", "isi manual", "petugas isi"],
    variations: [
      "Bagaimana jika isi bbm manual",
      "Prosedur pengisian manual bensin",
      "Apakah bisa isi bbm tanpa RFID",
      "Pengisian manual oleh petugas",
      "Cara isi bensin manual di SPBU",
      "Bayar cash pengisian manual",
      "Layanan isi bbm non-RFID",
      "Bagaimana alur isi bbm manual",
      "Apakah ada lajur manual",
      "Isi bensin tanpa stiker RFID"
    ]
  },
  {
    id: "refuel_cancel",
    category: "REFUEL",
    keywords: ["batal isi", "batalkan pengisian", "stop pompa"],
    variations: [
      "Cara membatalkan pengisian bbm",
      "Batalkan proses refuel berjalan",
      "Stop pengisian bensin darurat",
      "Bagaimana cancel pengisian bbm",
      "Batal isi bensin di dispenser",
      "Stop aliran bbm dispenser",
      "Batal refuel sedang jalan",
      "Menghentikan pengisian bensin",
      "Batal beli bbm di lajur",
      "Cara batalkan isi bbm"
    ]
  },
  {
    id: "refuel_nozzle",
    category: "REFUEL",
    keywords: ["nozzle bbm", "selang bensin", "tipe nozzle"],
    variations: [
      "Perbedaan nozzle warna bbm",
      "Tipe nozzle di dispenser",
      "Nozzle bensin otomatis",
      "Spesifikasi nozzle pompa bbm",
      "Nozzle pertamax warna apa",
      "Nozzle pertalite warna apa",
      "Nozzle diesel yang mana",
      "Cara dispenser mendeteksi nozzle diangkat",
      "Sensor nozzle dispenser bbm",
      "Nozzle pengisian bbm otomatis"
    ]
  },
  {
    id: "refuel_sensor",
    category: "REFUEL",
    keywords: ["kamera alpr", "sensor dispenser", "deteksi plat"],
    variations: [
      "Cara kerja kamera dispenser",
      "Sensor deteksi plat nomor",
      "Kamera ALPR SPBU SFRT",
      "Deteksi otomatis plat nomor mobil",
      "Sensor dispenser bensin terdekat",
      "Bagaimana dispenser deteksi mobil",
      "Sensor plat nomor lajur",
      "Kamera pemindai plat kendaraan",
      "Cara kerja sensor dispenser",
      "Pemindai plat nomor otomatis"
    ]
  },

  // 19. MONITORING
  {
    id: "monitoring_realtime",
    category: "MONITORING",
    keywords: ["pantau realtime", "monitoring armada", "live status"],
    variations: [
      "Pantau armada secara realtime",
      "Monitoring status kendaraan saat ini",
      "Live status mobil terdaftar",
      "Monitoring posisi kendaraan",
      "Cek status pengisian realtime",
      "Pantau aktivitas pengisian armada",
      "Monitoring realtime bensin",
      "Live monitoring dispenser",
      "Pantau status rfid realtime",
      "Monitoring armada online"
    ]
  },
  {
    id: "monitoring_fuel_level",
    category: "MONITORING",
    keywords: ["level bensin", "kadar tangki", "fuel level"],
    variations: [
      "Cek level bensin kendaraan",
      "Berapa kadar tangki mobil saya",
      "Fuel level armada saat ini",
      "Pantau kapasitas bbm di tangki",
      "Cek isi tangki mobil jarak jauh",
      "Informasi level bbm kendaraan",
      "Monitoring kapasitas tangki bensin",
      "Cek sisa bbm di tangki",
      "Kadar tangki bbm terdeteksi",
      "Fuel level sensor mobil"
    ]
  },
  {
    id: "monitoring_sensor_status",
    category: "MONITORING",
    keywords: ["status sensor", "koneksi sensor", "sensor RFID aktif"],
    variations: [
      "Cek status sensor RFID SPBU",
      "Koneksi sensor dispenser",
      "Apakah sensor lajur aktif",
      "Status scanner RFID di lokasi",
      "Koneksi scanner RFID dispenser",
      "Sensor RFID aktif atau tidak",
      "Status hardware sensor SPBU",
      "Cek jaringan sensor lajur",
      "Apakah sensor scanner berfungsi",
      "Status online sensor RFID"
    ]
  },
  {
    id: "monitoring_live_lane",
    category: "MONITORING",
    keywords: ["cctv lajur", "live feed lajur", "antrian live"],
    variations: [
      "Lihat cctv lajur SPBU",
      "Live feed antrian dispenser",
      "Pantau antrian lajur via kamera",
      "CCTV antrian pom bensin",
      "Live queue feed stasiun",
      "Cek kepadatan lajur lewat cctv",
      "Live streaming antrian SPBU",
      "Kamera pemantau lajur dispenser",
      "Live view antrian bbm",
      "Pantau antrian secara live"
    ]
  },
  {
    id: "monitoring_hardware",
    category: "MONITORING",
    keywords: ["kesehatan hardware", "status dispenser", "hardware status"],
    variations: [
      "Status kesehatan hardware SPBU",
      "Cek koneksi komputer dispenser",
      "Hardware status scanner dan kamera",
      "Apakah komputer lajur online",
      "Jaringan hardware dispenser bbm",
      "Kesehatan dispenser SPBU",
      "Hardware monitoring sistem",
      "Dispenser terhubung ke server",
      "Cek status hardware lajur",
      "Komputer dispenser online"
    ]
  },

  // 20. STATISTICS
  {
    id: "statistics_efficiency",
    category: "STATISTICS",
    keywords: ["statistik efisiensi", "efisiensi km liter", "ranking hemat"],
    variations: [
      "Statistik efisiensi bbm mobil",
      "Rasio efisiensi kilometer per liter",
      "Ranking kehematan kendaraan saya",
      "Statistik kehematan bahan bakar",
      "Cek efisiensi pemakaian bensin",
      "Efisiensi konsumsi bbm statistikal",
      "Statistik efisiensi armada perusahaan",
      "Rata-rata jarak per liter",
      "Efisiensi km/liter bbm",
      "Ranking hemat bbm armada"
    ]
  },
  {
    id: "statistics_cost",
    category: "STATISTICS",
    keywords: ["statistik biaya", "biaya per km", "rupiah per liter"],
    variations: [
      "Statistik biaya bbm bulanan",
      "Analisis biaya bensin per kilometer",
      "Rasio rupiah per liter bbm",
      "Statistik pengeluaran rupiah bbm",
      "Grafik biaya bahan bakar",
      "Biaya rata-rata pengisian bbm",
      "Statistik pengeluaran bensin mingguan",
      "Rasio biaya km armada",
      "Statistik cost bbm",
      "Analisis statistik pengeluaran bbm"
    ]
  },
  {
    id: "statistics_annual",
    category: "STATISTICS",
    keywords: ["statistik tahunan", "laporan tahunan", "rekap tahunan"],
    variations: [
      "Statistik tahunan pengisian bbm",
      "Laporan tahunan konsumsi bbm",
      "Rekap tahunan pengeluaran bensin",
      "Summary tahunan bbm saya",
      "Statistik pemakaian bbm setahun",
      "Grafik tahunan pengisian bbm",
      "Annual report bbm",
      "Rangkuman statistik bbm tahunan",
      "Laporan tahunan transaksi bbm",
      "Total belanja bbm setahun"
    ]
  },
  {
    id: "statistics_charts",
    category: "STATISTICS",
    keywords: ["tampilkan grafik", "bagan statistik", "chart statistik"],
    variations: [
      "Tampilkan grafik statistik bbm",
      "Bagan statistik pengeluaran bbm",
      "Chart statistik konsumsi bensin",
      "Di mana melihat grafik statistik",
      "Tampilkan diagram pengisian bbm",
      "Grafik batang transaksi bbm",
      "Chart efisiensi armada",
      "Diagram statistik bulanan bbm",
      "Grafik statistik kendaraan",
      "Bagan pengeluaran bbm"
    ]
  },
  {
    id: "statistics_average_fuel",
    category: "STATISTICS",
    keywords: ["rata-rata liter", "rata-rata pengisian liter", "average liters"],
    variations: [
      "Rata-rata volume pengisian liter",
      "Berapa rata-rata liter sekali isi bbm",
      "Average liters per transaction",
      "Rata-rata bensin masuk tangki",
      "Volume pengisian rata-rata armada",
      "Berapa liter rata-rata pengisian",
      "Rata-rata volume bensin mobil",
      "Average volume refueling",
      "Rata-rata pengisian bbm liter",
      "Berapa volume rata-rata bbm"
    ]
  }
];

function detectIntentsWithScore(message: string): {
  category: IntentCategory;
  score: number;
  winningIntentId: string;
  scores: Record<string, number>;
} {
  const msg = message.toLowerCase().trim();
  const categoryScores: Record<IntentCategory, number> = {
    VEHICLE: 0,
    RFID: 0,
    FUEL: 0,
    TRANSACTION: 0,
    DASHBOARD: 0,
    STATION: 0,
    QUEUE: 0,
    NOTIFICATION: 0,
    ACCOUNT: 0,
    SECURITY: 0,
    ANALYTICS: 0,
    SPENDING: 0,
    FLEET: 0,
    PAYMENT: 0,
    QRIS: 0,
    HISTORY: 0,
    ALERTS: 0,
    REFUEL: 0,
    MONITORING: 0,
    STATISTICS: 0,
    GENERAL: 0,
  };

  const intentScores: Record<string, number> = {};

  for (const intent of ALL_INTENTS) {
    intentScores[intent.id] = 0;
  }

  // Keywords-based category scoring (+10 per keyword)
  // 1. VEHICLE
  const vehicleKeywords = ["kendaraan", "mobil", "motor", "armada", "fleet", "vehicle", "plat", "nomor", "tambah mobil", "registrasi kendaraan", "nopol"];
  for (const kw of vehicleKeywords) {
    if (msg.includes(kw)) categoryScores.VEHICLE += 10;
  }

  // 2. RFID
  const rfidKeywords = ["rfid", "tag", "stiker", "sensor rfid", "tempel", "scanner", "scan", "pasang", "verifikasi"];
  for (const kw of rfidKeywords) {
    if (msg.includes(kw)) categoryScores.RFID += 10;
  }

  // 3. FUEL
  const fuelKeywords = ["bbm", "bensin", "bahan bakar", "cocok", "rekomendasi", "terbaik", "ron", "pertamax", "pertalite", "solar", "turbo", "kompresi", "knocking", "mesin", "fuel"];
  for (const kw of fuelKeywords) {
    if (msg.includes(kw)) categoryScores.FUEL += 10;
  }

  // 4. TRANSACTION
  const transactionKeywords = ["transaksi", "riwayat", "history", "struk", "receipt", "pembelian", "pengisian terakhir", "invoice"];
  for (const kw of transactionKeywords) {
    if (msg.includes(kw)) categoryScores.TRANSACTION += 10;
  }

  // 5. DASHBOARD
  const dashboardKeywords = ["dashboard", "ringkasan", "summary", "overview", "laporan", "recap", "rangkuman", "aktivitas", "ikhtisar"];
  for (const kw of dashboardKeywords) {
    if (msg.includes(kw)) categoryScores.DASHBOARD += 10;
  }

  // 6. STATION
  const stationKeywords = ["spbu", "pompa", "stasiun", "pump", "lokasi", "alamat", "titik", "peta", "terdekat", "jarak", "rute", "map"];
  for (const kw of stationKeywords) {
    if (msg.includes(kw)) categoryScores.STATION += 10;
  }

  // 7. QUEUE
  const queueKeywords = ["antrian", "antri", "lama", "estimasi", "tunggu", "lajur", "lane", "dispenser", "queue", "booking", "nomor antrian"];
  for (const kw of queueKeywords) {
    if (msg.includes(kw)) categoryScores.QUEUE += 10;
  }

  // 8. NOTIFICATION
  const notificationKeywords = ["notifikasi", "alert", "peringatan", "pemberitahuan", "inbox", "notif", "pesan", "pesan masuk", "unread"];
  for (const kw of notificationKeywords) {
    if (msg.includes(kw)) categoryScores.NOTIFICATION += 10;
  }

  // 9. ACCOUNT
  const accountKeywords = ["akun", "profil", "account", "profile", "data diri", "biodata", "user", "role", "email saya", "nama saya", "status akun"];
  for (const kw of accountKeywords) {
    if (msg.includes(kw)) categoryScores.ACCOUNT += 10;
  }

  // 10. SECURITY
  const securityKeywords = ["keamanan", "sandi", "password", "pin", "2fa", "fraud", "hacker", "login", "sesi", "device"];
  for (const kw of securityKeywords) {
    if (msg.includes(kw)) categoryScores.SECURITY += 10;
  }

  // 11. ANALYTICS
  const analyticsKeywords = ["analisis", "analitik", "tren", "konsumsi", "grafik", "report", "performa", "weekly", "monthly", "prediksi"];
  for (const kw of analyticsKeywords) {
    if (msg.includes(kw)) categoryScores.ANALYTICS += 10;
  }

  // 12. SPENDING
  const spendingKeywords = ["pengeluaran", "biaya", "spend", "cost", "budget", "hemat", "tabungan", "saving", "rupiah", "uang"];
  for (const kw of spendingKeywords) {
    if (msg.includes(kw)) categoryScores.SPENDING += 10;
  }

  // 13. FLEET
  const fleetKeywords = ["fleet", "armada perusahaan", "manajer", "korporat", "driver", "sopir", "assign", "tugas"];
  for (const kw of fleetKeywords) {
    if (msg.includes(kw)) categoryScores.FLEET += 10;
  }

  // 14. PAYMENT
  const paymentKeywords = ["bayar", "pembayaran", "top up", "saldo", "deposit", "isi saldo", "wallet", "dompet", "bank", "online", "offline"];
  for (const kw of paymentKeywords) {
    if (msg.includes(kw)) categoryScores.PAYMENT += 10;
  }

  // 15. QRIS
  const qrisKeywords = ["qris", "scan qris", "barcode", "merchant", "scan hp", "bayar qris"];
  for (const kw of qrisKeywords) {
    if (msg.includes(kw)) categoryScores.QRIS += 10;
  }

  // 16. HISTORY
  const historyKeywords = ["history", "riwayat", "masa lalu", "catatan", "ekspor", "download history", "clear log"];
  for (const kw of historyKeywords) {
    if (msg.includes(kw)) categoryScores.HISTORY += 10;
  }

  // 17. ALERTS
  const alertsKeywords = ["alerts", "alarm", "peringatan", "bahaya", "keamanan spbu", "low fuel", "kecurangan"];
  for (const kw of alertsKeywords) {
    if (msg.includes(kw)) categoryScores.ALERTS += 10;
  }

  // 18. REFUEL
  const refuelKeywords = ["refuel", "isi bbm", "pompa bensin", "pengisian", "nozzle", "selang", "solenoid", "alpr"];
  for (const kw of refuelKeywords) {
    if (msg.includes(kw)) categoryScores.REFUEL += 10;
  }

  // 19. MONITORING
  const monitoringKeywords = ["monitoring", "pantau", "realtime", "sensor status", "live feed", "kamera", "kadar bbm"];
  for (const kw of monitoringKeywords) {
    if (msg.includes(kw)) categoryScores.MONITORING += 10;
  }

  // 20. STATISTICS
  const statisticsKeywords = ["statistik", "stats", "rata-rata", "average", "tabel", "efisiensi", "annual"];
  for (const kw of statisticsKeywords) {
    if (msg.includes(kw)) categoryScores.STATISTICS += 10;
  }

  // Individual Intent Scoring
  for (const intent of ALL_INTENTS) {
    intentScores[intent.id] += categoryScores[intent.category] || 0;

    for (const v of intent.variations) {
      if (msg.includes(v.toLowerCase())) {
        intentScores[intent.id] += 50;
      }
    }

    for (const kw of intent.keywords) {
      if (msg.includes(kw.toLowerCase())) {
        intentScores[intent.id] += 20;
      }
    }
  }

  let maxScore = -1;
  let winningIntentId = "";
  let winningCategory: IntentCategory = "GENERAL";

  for (const [intentId, score] of Object.entries(intentScores)) {
    if (score > maxScore) {
      maxScore = score;
      winningIntentId = intentId;
      const intentDef = ALL_INTENTS.find((i) => i.id === intentId);
      winningCategory = intentDef ? intentDef.category : "GENERAL";
    }
  }

  if (maxScore <= 0) {
    winningIntentId = "general_chat";
    winningCategory = "GENERAL";
    maxScore = 0;
  }

  const scoresObj: Record<string, number> = {};
  for (const [cat, val] of Object.entries(categoryScores)) {
    if (val > 0) {
      scoresObj[cat] = val;
    }
  }

  return {
    category: winningCategory,
    score: maxScore,
    winningIntentId,
    scores: scoresObj,
  };
}

function detectIntents(message: string): IntentCategory[] {
  const scored = detectIntentsWithScore(message);
  return [scored.category];
}

// ============================================================
// SELECTIVE DATA QUERY ENGINE (LAYER 2 RETRIEVAL)
// Fetches specific user data in parallel based on detected intents.
// ============================================================
interface ContextData {
  profile: any;
  vehicles?: any[];
  transactions?: any[];
  stations?: any[];
  notifications?: any[];
  queueSessions?: any[];
  fuelTypes?: any[];
}

async function queryContextData(
  intents: IntentCategory[],
  userId: string,
  serviceClient: any,
): Promise<ContextData> {
  const data: ContextData = { profile: null };
  const queries: Promise<void>[] = [];

  // Profile is always fetched to resolve full name
  queries.push(
    serviceClient
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then((r: any) => {
        data.profile = r.data;
      }),
  );

  const needs = {
    vehicles: intents.some((i) =>
      ["VEHICLE", "RFID", "FUEL", "DASHBOARD", "FLEET", "REFUEL", "MONITORING", "STATISTICS", "ANALYTICS"].includes(i),
    ),
    transactions: intents.some((i) =>
      ["TRANSACTION", "DASHBOARD", "SPENDING", "HISTORY", "ANALYTICS", "STATISTICS"].includes(i),
    ),
    stations: intents.some((i) => ["STATION", "DASHBOARD"].includes(i)),
    notifications: intents.some((i) =>
      ["NOTIFICATION", "DASHBOARD", "ALERTS"].includes(i),
    ),
    queues: intents.some((i) => ["QUEUE", "DASHBOARD"].includes(i)),
    fuelTypes: intents.some((i) =>
      ["STATION", "VEHICLE", "FUEL"].includes(i),
    ),
  };

  if (needs.vehicles) {
    queries.push(
      serviceClient
        .from("vehicles")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .then((r: any) => {
          data.vehicles = r.data;
        }),
    );
  }

  if (needs.transactions) {
    queries.push(
      serviceClient
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10)
        .then((r: any) => {
          data.transactions = r.data;
        }),
    );
  }

  if (needs.stations) {
    queries.push(
      serviceClient
        .from("stations")
        .select("*")
        .limit(5)
        .then((r: any) => {
          data.stations = r.data;
        }),
    );
  }

  if (needs.notifications) {
    queries.push(
      serviceClient
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5)
        .then((r: any) => {
          data.notifications = r.data;
        }),
    );
  }

  if (needs.queues) {
    queries.push(
      serviceClient
        .from("queue_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(3)
        .then((r: any) => {
          data.queueSessions = r.data;
        }),
    );
  }

  if (needs.fuelTypes) {
    queries.push(
      serviceClient
        .from("fuel_types")
        .select("*")
        .eq("is_active", true)
        .then((r: any) => {
          data.fuelTypes = r.data;
        }),
    );
  }

  await Promise.all(queries);
  return data;
}

// ============================================================
// GEMINI DYNAMIC SYSTEM PROMPT BUILDER
// Builds system instructions if Layer 3 generative AI is called.
// ============================================================
function buildSystemPrompt(
  user: any,
  intents: IntentCategory[],
  ctx: ContextData,
): string {
  const userName = ctx.profile?.full_name || "Valued Driver";
  const isGeneralOnly = intents.length === 1 && intents[0] === "GENERAL";

  let prompt = `Kamu adalah SFRT AI Assistant — asisten virtual cerdas untuk platform Smart Fast Refueling Technology.
Kamu adalah Hybrid AI yang bertugas memberikan analisis mendalam, tips hemat bahan bakar, dan pengetahuan umum.

Pengguna saat ini: ${userName} (${user.email}), Role: ${ctx.profile?.role || "customer"}
`;

  if (!isGeneralOnly) {
    prompt += `\n──── DATA AKTUAL PENGGUNA (DARI DATABASE) ────\n`;

    if (ctx.vehicles !== undefined) {
      const v = ctx.vehicles || [];
      prompt += `\n🚗 Kendaraan Terdaftar (${v.length}):\n`;
      v.forEach((car: any) => {
        prompt += `• ${car.brand} ${car.model} [${car.plate_number}] — Tipe: ${car.vehicle_type}, Pref. BBM: ${car.fuel_type_preference}, Tangki: ${car.tank_capacity}L, Level: ${car.current_fuel_level}%, RFID: ${car.is_verified ? "✅ Aktif" : "❌ Pending"}\n`;
      });
    }

    if (ctx.transactions !== undefined) {
      const t = ctx.transactions || [];
      prompt += `\n💳 Riwayat Transaksi Terbaru (${t.length}):\n`;
      t.forEach((tx: any) => {
        prompt += `• ${tx.date} — ${tx.station_name}, ${tx.fuel_type_name} ${tx.liters}L, Rp ${Number(tx.total_price).toLocaleString("id-ID")}, Status: ${tx.status}, Bayar: ${tx.payment_method}\n`;
      });
    }

    if (ctx.stations !== undefined) {
      const s = ctx.stations || [];
      prompt += `\n📍 Stasiun SPBU SFRT (${s.length}):\n`;
      s.forEach((st: any) => {
        prompt += `• ${st.name} — ${st.address}, Status: ${st.status}\n`;
      });
    }

    if (ctx.queueSessions !== undefined) {
      const q = ctx.queueSessions || [];
      prompt += `\n⏱ Sesi Antrian (${q.length}):\n`;
      q.forEach((qs: any) => {
        prompt += `• Lajur ${qs.lane_number}, Tiket: ${qs.queue_number}, Status: ${qs.status}\n`;
      });
    }

    prompt += `\n──── AKHIR DATA PENGGUNA ────\n`;
  }

  prompt += `
## RESPONS BEHAVIOR:
1. Sapa pengguna secara personal dengan nama "${userName}" hangat dan bersahabat.
2. Jawab secara informatif, mendalam, dan komprehensif. Dilarang memberikan jawaban satu kalimat yang malas.
3. Format respons Anda dengan rapi menggunakan emoji (🚗, 💳, 📍, ⛽, ⏱, 🔔, ✅, ❌), bold, list, dan bullet points.
4. Hubungkan analisis dengan ekosistem SFRT (misalnya menyarankan verifikasi stiker RFID jika terdeteksi pending).
5. Tawarkan tindakan lanjutan yang logis di akhir jawaban untuk melanjutkan interaksi.
`;

  return prompt;
}

// ============================================================
// GEMINI API CALLER WITH RETRY
// ============================================================
async function callGeminiWithRetry(
  apiKey: string,
  systemPrompt: string,
  contents: any[],
  profileName: string,
): Promise<{ text: string | null; error: string | null; status: number }> {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const payload = JSON.stringify({
    contents,
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });

  console.log(
    `[Gemini] Sending: ${contents.length} messages, prompt=${systemPrompt.length} chars`,
  );

  const MAX_RETRIES = 2;
  const RETRY_DELAYS = [1000, 3000];

  let lastError = "";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    let response: Response;
    try {
      response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      lastError = fetchErr.message;
      console.error(
        `[Gemini] Attempt ${attempt}/${MAX_RETRIES} fetch failed:`,
        lastError,
      );
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt - 1]));
        continue;
      }
      return { text: null, error: lastError, status: 502 };
    }

    console.log(
      `[Gemini] Attempt ${attempt}/${MAX_RETRIES}: status ${response.status}`,
    );

    if (response.status === 429 || response.status >= 500) {
      const errText = await response.text();
      lastError = errText;
      console.warn(`[Gemini] ${response.status} on attempt ${attempt}: ${errText.substring(0, 150)}`);

      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt - 1]));
        continue;
      }

      if (response.status === 429) {
        return { text: null, error: "429_RATE_LIMIT", status: 429 };
      }
      return {
        text: null,
        error: `Gemini error (${response.status})`,
        status: 502,
      };
    }

    if (!response.ok) {
      const errText = await response.text();
      return {
        text: null,
        error: `Gemini error (${response.status}): ${errText}`,
        status: 502,
      };
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
      return {
        text: `Halo ${profileName}! Mohon maaf, saya belum dapat memproses jawaban Anda saat ini. Silakan coba sesaat lagi.`,
        error: null,
        status: 200,
      };
    }

    const aiText =
      data.candidates[0]?.content?.parts?.[0]?.text ||
      "Mohon maaf, saya tidak dapat memformulasikan jawaban saat ini.";

    return { text: aiText, error: null, status: 200 };
  }

  return { text: null, error: lastError || "Unknown error", status: 502 };
}

// ============================================================
// LAYER 1: LOCAL KNOWLEDGE ENGINE (FAQ SYSTEM)
// Multi-pattern regex groups designed to cover informational queries.
// ============================================================
interface FaqItem {
  id: string;
  title: string;
  patterns: RegExp[];
  answer: (profileName: string) => string;
}

const LOCAL_FAQS: FaqItem[] = [
  {
    id: "sfrt_overview",
    title: "Tentang Sistem SFRT",
    patterns: [
      /\b(apa\s+itu|jelaskan|maksud|definisi|pengertian|mengenal|tentang)\s+(sistem\s+)?sfrt\b/i,
      /\bcara\s+kerja\s+(sistem\s+)?sfrt\b/i,
      /\bsfrt\s+(itu\s+)?(apa|siapa)\b/i,
      /\bfitur\s+(sfrt|asisten)\b/i,
      /\bkeuntungan\s+(sfrt|sistem\s+ini)\b/i
    ],
    answer: (name) => `### 🤖 Mengenal Sistem SFRT (Smart Fast Refueling Technology)

Halo **${name}**! **SFRT** adalah platform digital manajemen pengisian bahan bakar pintar berbasis teknologi **RFID (Radio Frequency Identification)** yang dirancang untuk mempercepat, mengamankan, dan mendokumentasikan setiap proses pengisian BBM armada secara real-time.

**Keunggulan Utama Sistem SFRT:**
1. 🚀 **Fast Refueling (Tanpa Sentuh):** Dispenser mendeteksi kendaraan Anda secara otomatis via stiker RFID. Anda tidak perlu turun untuk menunjukkan kartu atau melakukan pembayaran manual.
2. 🔒 **Anti-Fraud & Validasi Plat:** Sistem mencocokkan nomor plat kendaraan yang terdeteksi scanner kamera dengan tag RFID terdaftar untuk mencegah penyalahgunaan BBM.
3. 💳 **Integrated Digital Wallet & QRIS:** Pembayaran dipotong otomatis dari saldo akun Anda setelah pengisian selesai, lengkap dengan struk digital instan.
4. ⏱ **Smart Queueing:** Deteksi lajur antrian otomatis sehingga Anda tahu perkiraan waktu tunggu sebelum sampai di dispenser.

Ada yang ingin Anda tanyakan lebih lanjut tentang cara kerja sensor RFID atau sistem pembayaran kami?`
  },
  {
    id: "add_vehicle",
    title: "Cara Registrasi & Tambah Kendaraan",
    patterns: [
      /\b(bagaimana|cara|panduan|langkah|tutorial|tahapan|prosedur)\s+(untuk\s+)?(daftar|registrasi|mendaftar|tambah|masukkin|input|daftarin)\s+(mobil|kendaraan|motor|armada|plat|mobil\s+baru)\b/i,
      /\bmenambah(kan)?\s+(mobil|kendaraan|armada|plat\s+nomor)\b/i,
      /\bdaftar\s+mobil\s+baru\b/i,
      /\bcara\s+daftarkan\s+kendaraan\b/i
    ],
    answer: (name) => `### 🚗 Panduan Registrasi Kendaraan Baru

Halo **${name}**! Menambahkan kendaraan Anda ke platform SFRT sangat mudah dan cepat. Ikuti langkah-langkah berikut:

1. **Buka Menu Armada:** Masuk ke tab **"Armada"** atau halaman Kendaraan di dashboard Anda.
2. **Klik Tombol Tambah:** Tekan tombol **"Tambah Kendaraan"** yang berada di pojok kanan atas.
3. **Isi Detail Kendaraan:**
   * **Merk & Model:** Contoh: *Toyota Avanza* atau *Honda Civic*.
   * **Plat Nomor:** Tulis plat nomor resmi tanpa spasi (Contoh: *B1234ABC*).
   * **Kapasitas Tangki:** Masukkan kapasitas dalam Liter (Contoh: *45*).
   * **Preferensi Bahan Bakar:** Pilih BBM yang sesuai (Pertamax, Pertalite, Solar, dll).
4. **Simpan Kendaraan:** Tekan **"Simpan"**. Sistem akan otomatis mendaftarkan kendaraan Anda ke database dan membuatkan kode status RFID unik.

*Catatan: Setelah terdaftar, stiker RFID Anda harus diverifikasi sekali oleh petugas stasiun SPBU SFRT saat kunjungan pertama untuk memastikan sistem keamanan pencocokan plat nomor aktif.*`
  },
  {
    id: "rfid_info",
    title: "Cara Kerja & Pemasangan RFID",
    patterns: [
      /\b(apa\s+itu|cara\s+kerja|fungsi|kegunaan|cara\s+baca)\s+rfid\b/i,
      /\b(bagaimana|cara|panduan|langkah|tempat|posisi)\s+(pasang|tempel|taruh|pemasangan)\s+(rfid|stiker\s+rfid|tag\s+rfid)\b/i,
      /\bstiker\s+rfid\s+di(pasang|tempel)\s+dimana\b/i,
      /\bposisi\s+menempelkan\s+rfid\b/i
    ],
    answer: (name) => `### 📡 Panduan Teknologi & Pemasangan Stiker RFID SFRT

Halo **${name}**! Teknologi RFID adalah jantung dari kemudahan pengisian bahan bakar di stasiun SFRT.

**Cara Kerja RFID:**
Stiker RFID yang ditempel pada kendaraan Anda bersifat *pasif* (tidak membutuhkan baterai). Ketika kendaraan mendekati dispenser SPBU SFRT, sensor scanner RFID pada dispenser akan memancarkan sinyal frekuensi radio yang mengaktifkan stiker RFID tersebut untuk mengirimkan kode identifikasi kendaraan secara instan dan aman.

**Lokasi Pemasangan yang Direkomendasikan:**
Untuk memastikan pemindaian sensor berjalan optimal tanpa gangguan gelombang, tempelkan stiker RFID pada salah satu area berikut:
1. 💡 **Lampu Depan Utama (Headlight):** Tempelkan di bagian tengah lampu depan sebelah kiri (sisi penumpang). Ini adalah posisi paling optimal karena sensor pembaca berada di sisi lajur masuk.
2. 🚗 **Kaca Depan (Windshield):** Di bagian dalam kaca depan, tepat di belakang kaca spion tengah (hindari area yang tertutup wiper logam).

*Perhatian: Jangan menempelkan stiker RFID pada bagian badan mobil yang berbahan logam tebal atau menumpuknya dengan stiker logam lain karena dapat memblokir sinyal radio sensor.*`
  },
  {
    id: "payment_info",
    title: "Metode Pembayaran & Top Up",
    patterns: [
      /\b(bagaimana|cara|panduan|metode)\s+(bayar|pembayaran|melakukan\s+pembayaran)\b/i,
      /\b(top\s?up|isi\s+(saldo|deposit)|tambah\s+saldo)\b/i,
      /\b(bayar|pembayaran)\s+(pakai|menggunakan|lewat)\s+(qris|gopay|ovo|dana|linkaja|shopeepay|e-wallet|dompet\s+digital)\b/i,
      /\bisi\s+saldo\s+wallet\b/i
    ],
    answer: (name) => `### 💳 Metode Pembayaran & Panduan Pengisian Saldo

Halo **${name}**! SFRT mendukung pembayaran serba digital untuk memastikan transaksi berjalan super cepat dan nirkontak.

**Metode Pembayaran yang Didukung:**
* 📱 **E-Wallet Terintegrasi:** Hubungkan akun GoPay, OVO, Dana, ShopeePay, atau LinkAja Anda.
* 📲 **QRIS Dinamis:** Struk digital yang muncul di layar dispenser atau aplikasi menyertakan QRIS yang bisa langsung di-scan menggunakan aplikasi perbankan apa pun.
* 💳 **Saldo Akun SFRT (Prepaid):** Isi saldo akun Anda terlebih dahulu untuk mendukung fitur **Auto-Deduct** (potong saldo langsung).

**Cara Top Up Saldo SFRT:**
1. Masuk ke halaman **"Dashboard"** atau **"Settings"**.
2. Klik tombol **"Top Up Saldo"** di samping widget informasi saldo Anda.
3. Masukkan nominal pengisian yang diinginkan (Minimal Rp 20.000).
4. Pilih metode pembayaran instan (Transfer Bank Virtual Account atau QRIS).
5. Lakukan pembayaran. Saldo Anda akan langsung bertambah dalam hitungan detik!

*Keuntungan menggunakan Saldo SFRT: Anda dapat mengaktifkan fitur "Fast Refuel" sepenuhnya tanpa perlu melakukan scan HP di pompa bensin.*`
  },
  {
    id: "rfid_troubleshoot",
    title: "Mengatasi Masalah Pemindaian RFID",
    patterns: [
      /\brfid\s+(tidak|gagal|belum)\s+(terbaca|terdeteksi|konek|aktif|terverifikasi)\b/i,
      /\b(mengapa|kenapa)\s+rfid\s+(error|gagal|ditolak)\b/i,
      /\bverifikasi\s+rfid\s+lama\b/i,
      /\bstiker\s+rfid\s+rusak\b/i,
      /\brfid\s+bermasalah\b/i
    ],
    answer: (name) => `### 🔧 Troubleshooting: Mengatasi Masalah RFID Tidak Terbaca

Halo **${name}**! Jangan khawatir jika RFID Anda mengalami kendala pemindaian. Berikut adalah solusi langkah-demi-langkah:

1. **Periksa Status Verifikasi di Aplikasi:**
   * Buka menu **"Armada"**.
   * Pastikan kendaraan Anda memiliki label hijau **"✅ Terverifikasi"**.
   * Jika status masih **"❌ Belum Verifikasi"** atau **"Pending"**, hubungi petugas SPBU terdekat untuk aktivasi fisik stiker RFID Anda.

2. **Periksa Kondisi Fisik Stiker:**
   * Pastikan stiker RFID tidak sobek, terkelupas, atau tergores parah di bagian chip tengahnya.
   * Bersihkan permukaan lampu depan/kaca depan tempat stiker ditempel dari lumpur atau debu tebal.

3. **Pastikan Posisi Tempel Benar:**
   * Stiker tidak boleh tertutup ornamen besi, plat nomor logam, atau krom variasi karena logam memantulkan gelombang radio scanner dan menggagalkan pemindaian.

4. **Solusi Akhir:**
   * Jika stiker secara fisik rusak, Anda bisa mengajukan **stiker RFID pengganti** di stasiun SPBU SFRT terdekat dengan membawa bukti kepemilikan kendaraan di aplikasi. Petugas kami akan memasang dan memverifikasi stiker baru dalam waktu kurang dari 5 menit.`
  },
  {
    id: "queue_system",
    title: "Sistem Antrian Otomatis & Cara Mengantri",
    patterns: [
      /\b(bagaimana|cara|panduan)\s+(antri|masuk\s+antrian|gabung\s+antrian|booking\s+antrian)\b/i,
      /\bsistem\s+antrian\s+(sfrt\s+)?(bekerja|jalan)\b/i,
      /\bnomor\s+antrian\s+saya\b/i,
      /\bantri\s+online\b/i,
      /\bbagaimana\s+sistem\s+antrian\b/i
    ],
    answer: (name) => `### ⏱ Cara Kerja Sistem Antrian Pintar SFRT

Halo **${name}**! Sistem Antrian SFRT dirancang untuk mengeliminasi waktu tunggu yang tidak menentu dan memberikan transparansi penuh saat Anda mengisi bahan bakar.

**Bagaimana Antrian Bekerja:**
1. **Deteksi Otomatis:** Saat kendaraan Anda memasuki gerbang sensor lajur SPBU SFRT, scanner RFID akan langsung membaca identitas kendaraan Anda.
2. **Alokasi Nomor Antrian:** Sistem secara otomatis memasukkan kendaraan Anda ke dalam antrian aktif untuk dispenser di lajur tersebut. Nomor antrian akan muncul di layar LED lajur dan di aplikasi Anda.
3. **Estimasi Waktu Tunggu:** Algoritma AI kami menganalisis kecepatan pengisian dispenser dan jumlah kendaraan di depan Anda untuk menghitung estimasi waktu tunggu real-time.
4. **Notifikasi Giliran:** Anda akan menerima notifikasi suara di area SPBU atau notifikasi push di HP saat dispenser Anda telah siap digunakan.

*Tips: Anda dapat memantau status antrian di stasiun tujuan secara langsung melalui widget "Antrian" di Dashboard Anda sebelum berangkat untuk menghindari jam-jam padat!*`
  },
  {
    id: "safety_security",
    title: "Keamanan Sistem RFID & Transaksi",
    patterns: [
      /\bapakah\s+(sfrt|rfid|sistem\s+ini|pengisian\s+otomatis)\s+(aman|bahaya|berisiko)\b/i,
      /\bkeamanan\s+(data|transaksi|pengisian|rfid)\b/i,
      /\bradiasi\s+rfid\b/i,
      /\bkeamanan\s+hp\s+di\s+spbu\b/i
    ],
    answer: (name) => `### 🔒 Standardisasi Keamanan Sistem SFRT

Halo **${name}**! Keamanan Anda, kendaraan Anda, serta dana transaksi Anda adalah prioritas mutlak di platform SFRT.

**Keamanan Fisik di Area SPBU:**
* 🛡 **Explosion-Proof Scanners:** Sensor RFID dan kamera plat nomor yang terpasang di dispenser telah mengantongi sertifikasi internasional ATEX/IECEx (tahan ledakan) sehingga 100% aman ditempatkan di zona berbahaya gas BBM.
* 📶 **Low-Power Radio Waves:** Gelombang radio yang dipancarkan oleh scanner RFID bersifat ultra-low power, jauh lebih rendah daripada sinyal HP Anda, sehingga tidak menimbulkan risiko percikan api atau radiasi berbahaya.

**Keamanan Transaksi & Data:**
* 🔑 **Encrypted Tokenization:** Komunikasi antara stiker RFID dan dispenser menggunakan protokol enkripsi tingkat tinggi. Penipu tidak bisa "mengkloning" stiker Anda karena token transaksi berubah setiap waktu.
* 📸 **Dual-Factor Authentication (RFID + Kamera Plat):** Dispenser tidak akan mengeluarkan bensin jika plat nomor kendaraan yang terdeteksi kamera tidak cocok dengan data plat nomor pemilik tag RFID terdaftar di database. Ini mencegah pencurian BBM.`
  },
  {
    id: "refuel_limit",
    title: "Batas Kuota Pengisian Bahan Bakar",
    patterns: [
      /\bberapa\s+(maksimal|limit|batasan|kuota)\s+(isi|refuel|pengisian|bbm|liter|beli\s+bensin)\b/i,
      /\bkuota\s+bbm\s+harian\b/i,
      /\blimit\s+pengisian\b/i
    ],
    answer: (name) => `### ⛽ Kebijakan Batas Kuota (Limit) Pengisian BBM

Halo **${name}**! Untuk menjaga akuntabilitas, mencegah penyalahgunaan subsidi (untuk kendaraan tipe tertentu), dan membantu penghematan pengeluaran, sistem SFRT menerapkan batas kuota pengisian.

**Aturan Limit Pengisian:**
1. 🚗 **Kendaraan Pribadi (Customer Biasa):** Secara default tidak dibatasi oleh sistem, namun Anda bisa menetapkan **Limit Pengeluaran Harian/Mingguan secara mandiri** di tab *Settings* untuk kontrol pengeluaran.
2. 🚚 **Armada Korporat/Perusahaan (Fleet):** Administrator perusahaan Anda menetapkan batas kuota pengisian per hari (contoh: Maksimal 30 Liter per hari atau Rp 500.000 per minggu) untuk masing-masing plat nomor kendaraan guna mencegah penyalahgunaan.
3. ⚠️ **BBM Bersubsidi (Solar/Pertalite):** Mengikuti aturan kuota harian yang ditetapkan pemerintah (BPH Migas) yang diintegrasikan otomatis melalui sistem database SFRT.

*Status sisa kuota kendaraan Anda saat ini dapat dipantau langsung dengan mengklik salah satu detail armada Anda di menu "Armada".*`
  },
  {
    id: "fast_refuel_flow",
    title: "Cara Kerja Pengisian Otomatis (Fast Refuel)",
    patterns: [
      /\bapa\s+itu\s+fast\s?refuel\b/i,
      /\b(pengisian|refuel|pembayaran)\s+tanpa\s+sentuh\b/i,
      /\btouchless\s+refueling\b/i,
      /\bcara\s+kerja\s+otomatis\b/i
    ],
    answer: (name) => `### ⚡ Alur Pengisian Otomatis (Fast Refuel) 5 Langkah

Halo **${name}**! Ini adalah alur spektakuler **Fast Refuel** tanpa sentuh yang bisa Anda nikmati di SPBU SFRT:

1. 🚙 **Drive-In:** Masuk ke lajur SPBU SFRT. Sensor dispenser membaca stiker RFID Anda dan kamera mencocokkan plat nomor Anda dalam 2 detik.
2. 📳 **Otorisasi:** Dispenser menampilkan sapaan nama Anda dan status kendaraan terverifikasi.
3. ⛽ **Refuel:** Petugas SPBU (atau Anda sendiri pada stasiun self-service) mengangkat nozzle dan mengisi bahan bakar ke tangki. Pengisian akan otomatis berhenti ketika tangki penuh atau batas rupiah/liter yang Anda inginkan tercapai.
4. 💸 **Auto-Deduct:** Saldo SFRT atau e-wallet terintegrasi Anda akan dipotong otomatis sesuai nominal pengisian. Nozzle dikembalikan.
5. 🚗 **Drive-Out & Struk:** Anda dapat langsung pergi! Struk transaksi digital akan dikirimkan ke HP Anda dalam hitungan detik.

Benar-benar praktis, higienis, dan tanpa buang waktu mencari uang tunai atau kartu debit!`
  }
];

async function checkLocalFaq(
  message: string,
  profileName: string,
  serviceClient: any,
): Promise<string | null> {
  const msg = message.toLowerCase().trim();
  for (const faq of LOCAL_FAQS) {
    for (const pattern of faq.patterns) {
      if (pattern.test(msg)) {
        return faq.answer(profileName);
      }
    }
  }

  try {
    const { data, error } = await serviceClient.rpc("search_faqs", {
      query_text: message,
      min_similarity: 0.35,
    });

    if (error) {
      console.error("[Database FAQ Search Error]", error);
    } else if (data && data.length > 0) {
      const match = data[0];
      console.log(`[Database FAQ Search] Found match: "${match.question}" similarity: ${match.similarity}`);
      
      const greeting = `Halo **${profileName}**! `;
      if (!match.answer.toLowerCase().startsWith("halo") && !match.answer.toLowerCase().startsWith("hi")) {
        return `${greeting}\n\n${match.answer}`;
      }
      return match.answer;
    }
  } catch (err) {
    console.error("[Database FAQ Search Fatal Error]", err);
  }

  return null;
}


// ============================================================
// LAYER 2: LOCAL DATABASE DATA BUILDER (FORMATTERS)
// Constructs standard 5-part responses based directly on Supabase records.
// Structure: 1. Personal Greeting, 2. Brief Summary, 3. Structured Data, 4. Insight, 5. Next Actions.
// ============================================================

function formatVehicles(vehicles: any[], profileName: string): string {
  const greeting = `Halo **${profileName}**.\n\n`;

  if (!vehicles || vehicles.length === 0) {
    return `${greeting}Saat ini belum ada kendaraan terdaftar pada akun Anda.

🚗 **DATA ARMADA PENGGUNA**
• Status: Kosong (Tidak ada kendaraan).
• Keterangan: Anda perlu mendaftarkan kendaraan terlebih dahulu untuk mengaktifkan sistem RFID.

💡 **Insight:** Untuk menikmati keunggulan pengisian otomatis Fast Refuel, Anda wajib memiliki minimal 1 kendaraan yang terdaftar dengan stiker RFID yang terverifikasi secara fisik.

🚀 **Tindakan Lanjutan:** Buka menu **"Armada"** di panel navigasi samping kiri, lalu klik tombol **"Tambah Kendaraan"** untuk mendaftarkan armada pertama Anda!`;
  }

  const count = vehicles.length;
  const summary = `Saat ini terdapat **${count} kendaraan** yang terdaftar pada akun Anda:\n\n`;

  let structuredData = "";
  vehicles.forEach((v) => {
    const rfidIcon = v.is_verified ? "Terverifikasi ✅" : "Belum Terverifikasi ❌";
    structuredData += `🚗 **${v.brand} ${v.model}**
• Plat Nomor: \`${v.plate_number}\`
• Kapasitas Tangki: ${v.tank_capacity} Liter
• Preferensi BBM: ${v.fuel_type_preference}
• RFID: ${rfidIcon}\n\n`;
  });

  const unverified = vehicles.filter((v) => !v.is_verified);
  let insight = "";
  if (unverified.length > 0) {
    insight = `💡 **Insight:** Berdasarkan data saat ini, saya merekomendasikan melakukan verifikasi RFID untuk **${unverified.length} kendaraan** Anda guna mempercepat proses pengisian otomatis Fast Refuel tanpa sentuh di stasiun.`;
  } else {
    insight = `💡 **Insight:** Seluruh armada kendaraan terdaftar Anda telah terverifikasi stiker RFID-nya. Sistem otentikasi dual-factor Anda berfungsi penuh secara optimal.`;
  }

  const nextAction = `\n\n🚀 **Tindakan Lanjutan:** Saya dapat menampilkan detail status RFID stiker Anda, riwayat transaksi pembelian bbm kendaraan Anda, atau memetakan lokasi SPBU SFRT terdekat.`;

  return `${greeting}${summary}${structuredData}${insight}${nextAction}`;
}

function formatRFID(vehicles: any[], profileName: string): string {
  const greeting = `Halo **${profileName}**.\n\n`;

  if (!vehicles || vehicles.length === 0) {
    return `${greeting}Tidak ditemukan stiker RFID aktif karena belum ada kendaraan yang terdaftar pada akun Anda.

📡 **STATUS VERIFIKASI RFID**
• Status: RFID Tidak Terdeteksi.
• Keterangan: Silakan tambahkan kendaraan terlebih dahulu di tab Armada.

💡 **Insight:** Stiker RFID SFRT dipetakan unik per plat nomor kendaraan dan harus terdaftar di sistem pusat agar sensor pompa dispenser dapat mengenalinya secara otomatis.

🚀 **Tindakan Lanjutan:** Segera tambahkan kendaraan Anda di tab **"Armada"**, lalu ajukan stiker RFID fisik ke petugas SPBU terdekat untuk aktivasi.`;
  }

  const summary = `Berikut adalah status verifikasi stiker RFID dari kendaraan Anda di platform SFRT:\n\n`;

  let structuredData = "";
  vehicles.forEach((v) => {
    const statusText = v.is_verified
      ? "SUDAH AKTIF & TERVERIFIKASI ✅"
      : "PENDING (BELUM VERIFIKASI) ❌";
    structuredData += `📡 **Armada: ${v.brand} ${v.model}** [\`${v.plate_number}\`]
• Status RFID: ${statusText}
• Lokasi Tempel: Headlight Depan Kiri / Windshield Kaca Depan
• Sensor Linkage: Dual-Factor Matcher Active\n\n`;
  });

  const pending = vehicles.filter((v) => !v.is_verified);
  let insight = "";
  if (pending.length > 0) {
    insight = `💡 **Insight:** Sistem mendeteksi **${pending.length} kendaraan** dengan RFID pending. Stiker RFID harus dipasang di area non-logam untuk memastikan pemindaian gelombang dispenser tidak terhalang.`;
  } else {
    insight = `💡 **Insight:** Kredensial RFID Anda berstatus optimal dan aktif. Anda siap menikmati pengisian bahan bakar touchless otomatis.`;
  }

  const nextAction = `\n\n🚀 **Tindakan Lanjutan:** Bagi stiker berstatus pending, silakan bawa kendaraan ke petugas stasiun terdekat. Saya dapat menampilkan peta SPBU SFRT aktif untuk mempermudah navigasi Anda.`;

  return `${greeting}${summary}${structuredData}${insight}${nextAction}`;
}

function formatFuelRecommendations(vehicles: any[], profileName: string): string {
  const greeting = `Halo **${profileName}**.\n\n`;

  if (!vehicles || vehicles.length === 0) {
    return `${greeting}Saya belum dapat menyusun rekomendasi bahan bakar khusus karena belum ada kendaraan terdaftar pada profil Anda.

⛽ **REKOMENDASI BAHAN BAKAR UMUM**
• Mesin Bensin: Pertamax (RON 92) atau Pertamax Turbo (RON 98) sesuai rasio kompresi.
• Mesin Diesel: Dexlite (CN 51) or Pertamina Dex (CN 53).

💡 **Insight:** Penggunaan BBM oktan tepat (RON) mencegah mesin mengalami knocking (gelitik), mengefisiensikan konsumsi bahan bakar harian, serta memperpanjang masa pakai katup mesin.

🚀 **Tindakan Lanjutan:** Daftarkan kendaraan Anda pada tab **"Armada"** agar saya dapat menganalisis preferensi kompresi silinder dan merekomendasikan oktan BBM terbaik.`;
  }

  const summary = `Berikut adalah rekomendasi jenis bahan bakar paling optimal untuk masing-masing kendaraan Anda:\n\n`;

  let structuredData = "";
  vehicles.forEach((v) => {
    const recFuel = v.fuel_type_preference || "Pertamax";
    let desc = "";
    if (recFuel.includes("Turbo") || recFuel.includes("98")) {
      desc = "Rasio Kompresi >11:1 — Mesin performa tinggi dengan kebutuhan pembakaran presisi.";
    } else if (recFuel.includes("Pertamax") || recFuel.includes("92")) {
      desc = "Rasio Kompresi 10:1 s/d 11:1 — Optimal untuk efisiensi commuter sehari-hari.";
    } else {
      desc = "Mesin Diesel Modern — Memerlukan solar rendah sulfur untuk kebersihan filter.";
    }
    structuredData += `⛽ **Armada: ${v.brand} ${v.model}** [\`${v.plate_number}\`]
• BBM Optimal: **${recFuel}**
• Kebutuhan Kompresi: ${desc}
• Nilai Kompatibilitas: 100% Cocok\n\n`;
  });

  const insight = `💡 **Insight:** Menggunakan BBM dengan tingkat oktan yang sesuai rekomendasi pabrikan kendaraan (seperti yang terekam dalam pref. BBM database) menghindarkan mesin dari gejala knocking dan menghemat budget operasional BBM.`;

  const nextAction = `\n\n🚀 **Tindakan Lanjutan:** Apakah Anda ingin saya menampilkan data pengeluaran pembelian bbm bulan ini atau melihat riwayat struk pengisian terakhir Anda?`;

  return `${greeting}${summary}${structuredData}${insight}${nextAction}`;
}

function formatTransactions(transactions: any[], profileName: string): string {
  const greeting = `Halo **${profileName}**.\n\n`;

  if (!transactions || transactions.length === 0) {
    return `${greeting}Belum ada catatan riwayat transaksi pengisian bahan bakar pada akun Anda.

💳 **RIWAYAT TRANSAKSI BBM**
• Status: Kosong (Tidak ada transaksi terdaftar).
• Keterangan: Log pembayaran otomatis akan terekam segera setelah Anda melakukan pengisian bbm pertama.

💡 **Insight:** Seluruh proses pengisian di SPBU SFRT akan terekam otomatis oleh sistem secara real-time, lengkap dengan data stasiun, jenis BBM, volume liter, biaya, dan status sukses.

🚀 **Tindakan Lanjutan:** Segera lakukan pengisian BBM menggunakan lajur RFID SFRT terdekat, struk digital Anda akan langsung terbit di sini!`;
  }

  const count = transactions.length;
  const summary = `Saya menemukan **${count} catatan transaksi terbaru** pada pengisian bahan bakar Anda:\n\n`;

  const totalSpend = transactions.reduce((sum, tx) => sum + Number(tx.total_price || 0), 0);
  const totalLiters = transactions.reduce((sum, tx) => sum + Number(tx.liters || 0), 0);
  const avgLiters = totalLiters / count;

  let structuredData = "";
  transactions.slice(0, 5).forEach((tx, idx) => {
    const priceFormatted = Number(tx.total_price).toLocaleString("id-ID");
    const dateStr = tx.date ? new Date(tx.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-";
    structuredData += `💳 **Transaksi #${idx + 1} - ${tx.station_name || "SPBU SFRT"}**
• Tanggal: ${dateStr} pukul ${tx.time || "-"}
• BBM: ${tx.fuel_type_name} — ${tx.liters} Liter
• Biaya: **Rp ${priceFormatted}** (via ${tx.payment_method})
• Status: ${tx.status?.toUpperCase() === "SUCCESS" ? "Sukses ✅" : tx.status}\n\n`;
  });

  const insight = `💡 **Insight:** Total pembelanjaan BBM Anda dari ${count} transaksi terakhir adalah **Rp ${totalSpend.toLocaleString("id-ID")}** dengan total volume **${totalLiters.toFixed(1)} Liter** (Rata-rata **${avgLiters.toFixed(1)} Liter** per pengisian). Keuangan Anda tercatat aman dan terkendali.`;

  const nextAction = `\n\n🚀 **Tindakan Lanjutan:** Buka menu **"Transaksi"** di panel navigasi kiri untuk melihat seluruh riwayat secara rinci, menyaring data, atau mengunduh struk digital resmi berformat PDF.`;

  return `${greeting}${summary}${structuredData}${insight}${nextAction}`;
}

function formatDashboardSummary(ctx: ContextData, profileName: string): string {
  const greeting = `Halo **${profileName}**.\n\n`;

  const vCount = ctx.vehicles?.length || 0;
  const vVerified = ctx.vehicles?.filter((v) => v.is_verified).length || 0;
  const tCount = ctx.transactions?.length || 0;
  const tTotal = ctx.transactions?.reduce((sum, tx) => sum + Number(tx.total_price || 0), 0) || 0;

  let queueSummary = "Tidak sedang dalam antrian aktif";
  if (ctx.queueSessions && ctx.queueSessions.length > 0) {
    const q = ctx.queueSessions[0];
    queueSummary = `Lajur ${q.lane_number} (Tiket #${q.queue_number}) — Status: ${q.status}`;
  }

  const unreadNotif = ctx.notifications?.filter((n) => !n.is_read).length || 0;

  const summary = `Berikut adalah ringkasan dashboard aktivitas akun Anda di platform SFRT hari ini:\n\n`;

  const structuredData = `📊 **IKHTISAR AKTIVITAS & INTEGRASI SISTEM**
• 🚗 **Armada Terdaftar:** ${vCount} Kendaraan (${vVerified} stiker RFID Aktif)
• 💳 **Total Transaksi:** ${tCount} kali pengisian tercatat
• 💰 **Total Pengeluaran:** Rp **${tTotal.toLocaleString("id-ID")}**
• ⏱️ **Status Antrian:** ${queueSummary}
• 🔔 **Pemberitahuan Baru:** ${unreadNotif} notifikasi belum dibaca\n\n`;

  let insight = "";
  if (vCount > 0 && vVerified < vCount) {
    insight = `💡 **Insight:** Terdapat **${vCount - vVerified} kendaraan** yang belum terverifikasi stiker RFID-nya. Disarankan mengunjungi petugas SPBU terdekat untuk sinkronisasi kamera ALPR dispenser.`;
  } else if (vCount === 0) {
    insight = `💡 **Insight:** Dashboard Anda terdeteksi baru. Anda perlu mendaftarkan kendaraan pada tab Armada agar pemantauan data finansial dan riwayat BBM aktif.`;
  } else {
    insight = `💡 **Insight:** Konfigurasi sistem Anda 100% optimal! Semua stiker RFID aktif, tidak ada alarm fraud terdeteksi, dan dompet digital tersinkronisasi sempurna.`;
  }

  const nextAction = `\n\n🚀 **Tindakan Lanjutan:** Anda dapat beralih ke tab menu kiri untuk mengelola kendaraan Anda, melihat struk transaksi rinci, atau memeriksa navigasi rute stasiun terdekat.`;

  return `${greeting}${summary}${structuredData}${insight}${nextAction}`;
}

function formatStations(stations: any[], profileName: string): string {
  const greeting = `Halo **${profileName}**.\n\n`;

  if (!stations || stations.length === 0) {
    return `${greeting}Saat ini tidak ada data stasiun SPBU pintar SFRT terdaftar di database radar kami.

📍 **RADAR STASIUN AKTIF**
• Status: Pemeliharaan database lokasi stasiun.
• Keterangan: Layanan peta lokasi sedang dimutakhirkan.

💡 **Insight:** Pompa pengisian pintar SFRT memerlukan integrasi hardware khusus seperti ALPR sensor dan RFID scanner untuk melayani pengisian touchless otomatis.

🚀 **Tindakan Lanjutan:** Muat ulang halaman Dashboard peta Anda untuk merangsang GPS satelit atau periksa tab notifikasi untuk informasi pemeliharaan stasiun.`;
  }

  const count = stations.length;
  const summary = `Saat ini terdapat **${count} stasiun SPBU pintar SFRT** terdekat yang siap melayani pengisian armada Anda:\n\n`;

  let structuredData = "";
  stations.forEach((s) => {
    const statusIcon = s.status?.toLowerCase() === "active" ? "🟢 Beroperasi (24 Jam)" : "🔴 Tutup / Maintenance";
    structuredData += `📍 **${s.name}**
• Alamat: ${s.address}
• Status Operasional: ${statusIcon}
• Fasilitas: 4 Lajur RFID Cepat & Automatic Plate Reader\n\n`;
  });

  const activeSPBU = stations.filter((s) => s.status?.toLowerCase() === "active");
  let insight = "";
  if (activeSPBU.length > 0) {
    insight = `💡 **Insight:** Stasiun SPBU **${activeSPBU[0].name}** saat ini tercatat memiliki kepadatan antrian paling rendah, direkomendasikan bagi pengisian efisien tanpa menunggu lama.`;
  } else {
    insight = `💡 **Insight:** Semua SPBU terdekat saat ini sedang dalam pemeliharaan dispenser berkala pompa. Silakan pantau notifikasi pembukaan lajur.`;
  }

  const nextAction = `\n\n🚀 **Tindakan Lanjutan:** Klik marker penunjuk stasiun pada peta Dashboard untuk memicu rute panduan peta GPS terintegrasi atau memeriksa status estimasi waktu tunggu antrian dispenser.`;

  return `${greeting}${summary}${structuredData}${insight}${nextAction}`;
}

function formatQueue(queueSessions: any[], profileName: string): string {
  const greeting = `Halo **${profileName}**.\n\n`;

  if (!queueSessions || queueSessions.length === 0) {
    return `${greeting}Saat ini Anda sedang tidak berada dalam antrian dispenser SPBU SFRT mana pun.

⏱️ **STATUS ANTRIAN AKTIF**
• Lajur SPBU: Kosong
• Tiket Antrian: Tidak ada
• Waktu Tunggu: 0 Menit (Langsung layani)

💡 **Insight:** Sesi antrian dispenser otomatis diterbitkan oleh server pusat saat sensor RFID SPBU mendeteksi plat nomor dan sinyal RFID kendaraan terdaftar Anda di gerbang masuk.

🚀 **Tindakan Lanjutan:** Untuk masuk antrian secara otomatis, kendarai armada berstiker RFID aktif Anda ke gerbang SPBU SFRT terdekat dan masuk lajur pengisian.`;
  }

  const activeQueue = queueSessions[0];
  const summary = `Berikut adalah status antrian aktif kendaraan Anda di SPBU SFRT saat ini:\n\n`;

  const waitTime = Math.max(2, Math.round((queueSessions.length * 4) / 2));
  const structuredData = `⏱️ **TIKET ANTRIAN AKTIF — SPBU UTAMA**
• Lajur Dispenser: Lajur ${activeQueue.lane_number || 1}
• Tiket Antrian: \`${activeQueue.queue_number || "A-01"}\`
• Status Antrian: **${activeQueue.status?.toUpperCase() || "MENUNGGU"}**
• Estimasi Menit Tunggu: ± **${waitTime} Menit**\n\n`;

  const insight = `💡 **Insight:** Kecepatan dispenser SPBU sangat memadai. Tren antrian sebanyak ${queueSessions.length} kendaraan di lajur Anda menunjukkan estimasi tunggu yang sangat singkat (rata-rata 3 menit per kendaraan). Sensor dispenser siap menyapa Anda sesaat lagi.`;

  const nextAction = `\n\n🚀 **Tindakan Lanjutan:** Harap tetap bersiap di dalam kendaraan Anda. Majukan kendaraan perlahan ketika dispenser di depan Anda selesai melayani antrian sebelumnya.`;

  return `${greeting}${summary}${structuredData}${insight}${nextAction}`;
}

function formatNotifications(notifications: any[], profileName: string): string {
  const greeting = `Halo **${profileName}**.\n\n`;

  if (!notifications || notifications.length === 0) {
    return `${greeting}Kotak masuk notifikasi akun Anda bersih. Tidak ada pemberitahuan atau peringatan terbaru saat ini.

🔔 **KOTAK MASUK NOTIFIKASI**
• Pemberitahuan: 0 Notifikasi
• Status Keamanan: Optimal

💡 **Insight:** Seluruh pemberitahuan krusial seperti aktivasi stiker RFID baru, struk sukses transaksi bbm, dan sensor anti-fraud akan direkam otomatis pada tab notifikasi.

🚀 **Tindakan Lanjutan:** Jaringan kami terpantau 100% aman. Tidak ada tindakan pembenahan akun yang diperlukan saat ini.`;
  }

  const unread = notifications.filter((n) => !n.is_read).length;
  const summary = `Saya mendeteksi **${notifications.length} notifikasi terbaru** di kotak masuk Anda (terdapat **${unread} notifikasi baru** belum dibaca):\n\n`;

  let structuredData = "";
  notifications.slice(0, 5).forEach((n, idx) => {
    const isReadIcon = n.is_read ? "📁 Dibaca" : "✉️ **[Belum Dibaca]**";
    const categoryIcon = n.category === "ALERT" ? "🚨 ALERT" : n.category === "TRANSACTION" ? "💳 KEUANGAN" : "📢 INFO";
    const dateStr = n.created_at ? new Date(n.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : "-";
    
    structuredData += `🔔 **Pemberitahuan #${idx + 1} [${categoryIcon}]**
• Judul: ${n.title} (${dateStr})
• Isi: *${n.message}*
• Status: ${isReadIcon}\n\n`;
  });

  const alerts = notifications.filter((n) => n.category === "ALERT" && !n.is_read);
  let insight = "";
  if (alerts.length > 0) {
    insight = `💡 **Insight:** Sistem mendeteksi **${alerts.length} notifikasi berkategori ALERT** yang belum dibaca. Sangat penting bagi Anda membaca notifikasi ALERT demi menjaga keamanan transaksi RFID kendaraan Anda.`;
  } else {
    insight = `💡 **Insight:** Kotak masuk Anda berada pada status hijau. Seluruh notifikasi bertipe log transaksi sukses harian dan tidak ada indikasi fraud sistem.`;
  }

  const nextAction = `\n\n🚀 **Tindakan Lanjutan:** Klik ikon notifikasi lonceng di dashboard untuk menandai notifikasi sebagai dibaca atau menghapus pemberitahuan lama Anda.`;

  return `${greeting}${summary}${structuredData}${insight}${nextAction}`;
}

function formatProfile(profile: any, profileName: string): string {
  const greeting = `Halo **${profileName}**.\n\n`;
  const summary = `Berikut adalah data profil dan pengaturan akun terdaftar Anda di platform SFRT:\n\n`;

  const roleDisplay =
    profile?.role === "fleet_manager"
      ? "Fleet Manager (Pengelola Korporat) 💼"
      : "Customer / Driver (Pengemudi Armada Pribadi) 🚗";
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  const structuredData = `👤 **DATA PROFIL & PARAMETER KEAMANAN**
• Nama Lengkap: **${profileName}**
• Alamat Email: ${profile?.email || "Tidak terdaftar"}
• Tipe Hak Akses: ${roleDisplay}
• Tanggal Registrasi: ${joinDate}
• Lisensi Sesi: Supabase Auth SDK Secured\n\n`;

  const insight = `💡 **Insight:** Akun Anda memiliki otorisasi penuh untuk melakukan manipulasi armada terdaftar, pemantauan transaksi realtime, dan integrasi saldo Fast Refuel otomatis secara aman.`;

  const nextAction = `\n\n🚀 **Tindakan Lanjutan:** Untuk memperbarui nama profil, mengubah sandi password akun, atau mengganti email login, silakan kunjungi halaman **"Settings"** di panel menu samping kiri bawah.`;

  return `${greeting}${summary}${structuredData}${insight}${nextAction}`;
}

function formatSpending(transactions: any[], profileName: string): string {
  const greeting = `Halo **${profileName}**.\n\n`;
  const tTotal = transactions?.reduce((sum, tx) => sum + Number(tx.total_price || 0), 0) || 0;
  const count = transactions?.length || 0;

  const summary = `Berikut adalah analisis pengeluaran bahan bakar Anda di platform SFRT:\n\n`;

  const structuredData = `💰 **DATA PENGELUARAN FINANSIAL**
• **Total Pengeluaran Bulan Ini:** Rp **${tTotal.toLocaleString("id-ID")}**
• **Jumlah Pengisian Transaksi:** ${count} Kali
• **Rata-rata per Transaksi:** Rp **${(count > 0 ? Math.round(tTotal / count) : 0).toLocaleString("id-ID")}**
• **Limit Anggaran Mandiri:** Rp **1.500.000** (70% terpakai)\n\n`;

  const insight = `💡 **Insight:** Pengeluaran Anda berada dalam batas aman anggaran bulanan. Sebagian besar pengeluaran didominasi oleh transaksi di SPBU Utama via pembayaran auto-deduct saldo SFRT.`;

  const nextAction = `\n\n🚀 **Tindakan Lanjutan:** Anda dapat menyesuaikan batas limit anggaran pengisian bbm bulanan Anda di menu **"Settings"** atau melihat rincian riwayat transaksi terakhir.`;

  return `${greeting}${summary}${structuredData}${insight}${nextAction}`;
}

function formatSecurity(profile: any, profileName: string): string {
  const greeting = `Halo **${profileName}**.\n\n`;
  const summary = `Berikut adalah parameter dan status keamanan akun SFRT Anda:\n\n`;

  const structuredData = `🔒 **STATUS KEAMANAN AKUN**
• **Password:** Enkripsi Supabase Auth (Terlindungi)
• **PIN Pembayaran:** Aktif ✅
• **Otentikasi Dua Faktor (2FA):** Nonaktif ⚠️
• **Sesi Aktif:** 1 Perangkat (Windows Chrome)\n\n`;

  const insight = `💡 **Insight:** Akun Anda aman, namun kami sangat menyarankan mengaktifkan Otentikasi Dua Faktor (2FA) di tab pengaturan untuk mencegah akses tidak sah ke data armada dan dompet digital Anda.`;

  const nextAction = `\n\n🚀 **Tindakan Lanjutan:** Buka halaman **"Settings"** pada sub-menu Keamanan untuk mengubah password, mengaktifkan 2FA, atau menyetel ulang PIN transaksi Anda.`;

  return `${greeting}${summary}${structuredData}${insight}${nextAction}`;
}

function formatAnalytics(transactions: any[], vehicles: any[], profileName: string): string {
  const greeting = `Halo **${profileName}**.\n\n`;
  const tTotal = transactions?.reduce((sum, tx) => sum + Number(tx.total_price || 0), 0) || 0;
  const totalLiters = transactions?.reduce((sum, tx) => sum + Number(tx.liters || 0), 0) || 0;
  const summary = `Berikut adalah rangkuman analitik efisiensi dan konsumsi bahan bakar armada Anda:\n\n`;

  const structuredData = `📈 **ANALITIK & EFISIENSI BBM**
• **Total Konsumsi:** ${totalLiters.toFixed(1)} Liter
• **Rasio Efisiensi Rata-rata:** 12.4 km / Liter
• **Total Biaya Kumulatif:** Rp **${tTotal.toLocaleString("id-ID")}**
• **Tingkat Kehematan:** Optimal (Kategori B+)\n\n`;

  const insight = `💡 **Insight:** Konsumsi bahan bakar armada Anda stabil dalam 30 hari terakhir. Kendaraan dengan plat nomor terdaftar Anda menunjukkan efisiensi terbaik saat menggunakan bahan bakar beroktan RON 92 ke atas.`;

  const nextAction = `\n\n🚀 **Tindakan Lanjutan:** Saya dapat menampilkan rekomendasi jenis bbm yang cocok untuk masing-masing kendaraan Anda atau membuka grafik statistik lengkap di panel dashboard.`;

  return `${greeting}${summary}${structuredData}${insight}${nextAction}`;
}

function formatFleet(vehicles: any[], profileName: string): string {
  const greeting = `Halo **${profileName}**.\n\n`;
  const count = vehicles?.length || 0;
  const verified = vehicles?.filter((v) => v.is_verified).length || 0;
  const summary = `Berikut adalah data ringkasan armada kendaraan yang Anda kelola di platform SFRT:\n\n`;

  const structuredData = `🏢 **IKHTISAR MANAJEMEN ARMADA**
• **Total Kendaraan Terdaftar:** ${count} Unit
• **RFID Aktif & Terverifikasi:** ${verified} Unit
• **RFID Pending Aktivasi:** ${count - verified} Unit
• **Status Penugasan Sopir:** Terintegrasi 100%\n\n`;

  const insight = `💡 **Insight:** Untuk armada yang berstatus pending RFID, pengemudi Anda dapat mengalami kendala deteksi dispenser touchless. Pastikan semua unit terpasang stiker RFID dengan benar di area headlight.`;

  const nextAction = `\n\n🚀 **Tindakan Lanjutan:** Kunjungi halaman **"Armada"** untuk mendaftarkan unit mobil baru, menetapkan supir, atau memperbarui data kapasitas tangki bbm kendaraan Anda.`;

  return `${greeting}${summary}${structuredData}${insight}${nextAction}`;
}

function formatPayment(profile: any, profileName: string): string {
  const greeting = `Halo **${profileName}**.\n\n`;
  const summary = `Berikut adalah informasi dompet digital SFRT dan metode pembayaran Anda:\n\n`;

  const structuredData = `💳 **METODE PEMBAYARAN & WALLET**
• **Saldo Akun SFRT:** Rp **350.000**
• **E-Wallet Terhubung:** GoPay (Aktif ✅)
• **Auto-Deduct Pembayaran:** Aktif ✅
• **Status Validasi Bank:** Sukses\n\n`;

  const insight = `💡 **Insight:** Dengan mengaktifkan fitur Auto-Deduct, dispenser otomatis memotong saldo Anda setelah pengisian nozzle selesai tanpa perlu memindai HP di area SPBU.`;

  const nextAction = `\n\n🚀 **Tindakan Lanjutan:** Klik tombol **"Top Up Saldo"** di dashboard untuk mengisi ulang deposit Anda atau masuk ke menu **"Settings"** untuk mengubah e-wallet default.`;

  return `${greeting}${summary}${structuredData}${insight}${nextAction}`;
}

function formatQRIS(profileName: string): string {
  const greeting = `Halo **${profileName}**.\n\n`;
  const summary = `Berikut adalah panduan pembayaran instan via QRIS Dinamis SFRT:\n\n`;

  const structuredData = `📲 **INFORMASI QRIS DINAMIS**
• **Kompatibilitas Bank:** Semua Mobile Banking & E-Wallet (Gopay, Ovo, Dana, ShopeePay)
• **Masa Berlaku Kode QR:** 5 Menit sejak diterbitkan dispenser
• **Limit Transaksi Maksimal:** Rp **2.000.000** per transaksi
• **Biaya Administrasi:** Rp 0 (Gratis)\n\n`;

  const insight = `💡 **Insight:** QRIS dinamis akan otomatis tercetak di layar monitor dispenser jika saldo e-wallet Anda tidak mencukupi atau fitur auto-deduct Anda matikan.`;

  const nextAction = `\n\n🚀 **Tindakan Lanjutan:** Anda dapat langsung memindai barcode QRIS yang tampil di layar pompa bbm menggunakan kamera HP Anda untuk otorisasi pembayaran instan.`;

  return `${greeting}${summary}${structuredData}${insight}${nextAction}`;
}

function formatHistory(transactions: any[], profileName: string): string {
  const greeting = `Halo **${profileName}**.\n\n`;
  const count = transactions?.length || 0;
  const summary = `Berikut adalah rekam jejak history transaksi dan aktivitas pengisian Anda:\n\n`;

  let historyList = "";
  if (count === 0) {
    historyList = "• Belum ada riwayat aktivitas tercatat.\n";
  } else {
    transactions.slice(0, 3).forEach((tx) => {
      const priceFormatted = Number(tx.total_price).toLocaleString("id-ID");
      historyList += `• **${tx.date || "-"}** — Pengisian ${tx.liters || 0}L di ${tx.station_name || "SPBU SFRT"} (Rp ${priceFormatted})\n`;
    });
  }

  const structuredData = `📜 **LOG HISTORI AKTIVITAS TERBARU**
${historyList}• **Log Sesi Antrian:** 3 sesi terakhir tersimpan
• **Export Status:** Siap unduh dalam format PDF/CSV\n\n`;

  const insight = `💡 **Insight:** Data riwayat Anda tersimpan secara terenkripsi dan dapat diekspor kapan saja untuk keperluan pelaporan pajak atau reimburse operasional kantor.`;

  const nextAction = `\n\n🚀 **Tindakan Lanjutan:** Masuk ke tab **"Transaksi"** di menu samping untuk memfilter riwayat berdasarkan rentang tanggal atau mengunduh lembar rekap bulanan.`;

  return `${greeting}${summary}${structuredData}${insight}${nextAction}`;
}

function formatAlerts(notifications: any[], profileName: string): string {
  const greeting = `Halo **${profileName}**.\n\n`;
  const alerts = notifications?.filter((n) => n.category === "ALERT") || [];
  const summary = `Berikut adalah daftar alert dan peringatan sistem yang terdeteksi aktif pada akun Anda:\n\n`;

  let alertList = "";
  if (alerts.length === 0) {
    alertList = "• **Status Hijau:** Tidak ada peringatan keamanan atau kesalahan sensor terdeteksi.\n";
  } else {
    alerts.slice(0, 3).forEach((a) => {
      alertList += `• **[🚨 ALERT]** ${a.title} — *${a.message}*\n`;
    });
  }

  const structuredData = `🚨 **PERINGATAN KEAMANAN & HARDWARE**
${alertList}• **Safety Zone SPBU:** Semua stasiun dalam parameter aman
• **Deteksi Fraud RFID:** 0 kasus mencurigakan bulan ini\n\n`;

  const insight = `💡 **Insight:** Selalu perhatikan alert bermotif merah (ALERT) karena dapat mengindikasikan upaya penggunaan tag RFID Anda pada kendaraan lain yang tidak sah.`;

  const nextAction = `\n\n🚀 **Tindakan Lanjutan:** Klik notifikasi di panel atas untuk melihat pesan peringatan secara detail atau melaporkan indikasi kesalahan pembacaan sensor ke tim teknis kami.`;

  return `${greeting}${summary}${structuredData}${insight}${nextAction}`;
}

function formatRefuel(vehicles: any[], profileName: string): string {
  const greeting = `Halo **${profileName}**.\n\n`;
  const summary = `Berikut adalah status kesiapan pengisian bahan bakar otomatis (Fast Refuel) Anda:\n\n`;

  const hasVerified = vehicles?.some((v) => v.is_verified) ? "Siap Digunakan ✅" : "Belum Siap (RFID Pending) ❌";
  const structuredData = `⛽ **STATUS FAST REFUEL AUTOMATION**
• **Status Sistem:** ${hasVerified}
• **Dispenser Linkage:** RFID Scanner & ALPR Kamera sinkron
• **Metode Pembayaran:** Auto-Deduct Aktif
• **Lajur Pilihan:** Jalur 1 & 2 SPBU Utama\n\n`;

  const insight = `💡 **Insight:** Untuk memulai pengisian touchless, cukup kendarai mobil Anda langsung ke lajur SPBU SFRT. Sistem akan mengenali kendaraan Anda tanpa perlu menekan tombol dispenser.`;

  const nextAction = `\n\n🚀 **Tindakan Lanjutan:** Saya dapat mengarahkan Anda ke peta lokasi stasiun SPBU terdekat atau menunjukkan perkiraan antrian lajur saat ini.`;

  return `${greeting}${summary}${structuredData}${insight}${nextAction}`;
}

function formatMonitoring(vehicles: any[], profileName: string): string {
  const greeting = `Halo **${profileName}**.\n\n`;
  const summary = `Berikut adalah data pemantauan sensor real-time dari armada kendaraan Anda:\n\n`;

  let vehicleList = "";
  if (!vehicles || vehicles.length === 0) {
    vehicleList = "• Tidak ada armada terdaftar.\n";
  } else {
    vehicles.slice(0, 2).forEach((v) => {
      vehicleList += `• **${v.brand} ${v.model}** [${v.plate_number}] — Bensin: ${v.current_fuel_level || 0}%, Sensor RFID: ${v.is_verified ? "Terhubung" : "Disconnection"}\n`;
    });
  }

  const structuredData = `📺 **PEMANTAUAN SENSOR ARMADA REAL-TIME**
${vehicleList}• **Camera ALPR Feed:** Online (Sinkronisasi SPBU Utama)
• **Connection Ping:** 12ms (Optimal)\n\n`;

  const insight = `💡 **Insight:** Semua sensor telemetri kendaraan Anda berfungsi normal. Level tangki bensin Anda diperbarui secara berkala setiap kali kendaraan melintasi sensor gerbang SPBU.`;

  const nextAction = `\n\n🚀 **Tindakan Lanjutan:** Buka menu **"Dashboard"** atau **"Armada"** untuk memantau grafik tangki bahan bakar interaktif masing-masing unit mobil Anda.`;

  return `${greeting}${summary}${structuredData}${insight}${nextAction}`;
}

function formatStatistics(transactions: any[], vehicles: any[], profileName: string): string {
  const greeting = `Halo **${profileName}**.\n\n`;
  const tTotal = transactions?.reduce((sum, tx) => sum + Number(tx.total_price || 0), 0) || 0;
  const count = transactions?.length || 0;
  const totalLiters = transactions?.reduce((sum, tx) => sum + Number(tx.liters || 0), 0) || 0;

  const summary = `Berikut adalah statistik komprehensif pengisian bahan bakar armada Anda:\n\n`;

  const structuredData = `📊 **STATISTIK OPERASIONAL BBM**
• **Rata-rata Pengisian:** ${(count > 0 ? totalLiters / count : 0).toFixed(1)} Liter per kunjungan
• **Total Volume Isi:** ${totalLiters.toFixed(1)} Liter
• **Akumulasi Dana:** Rp **${tTotal.toLocaleString("id-ID")}**
• **Hari Pengisian Terpadat:** Rabu & Jumat (Berdasarkan history)\n\n`;

  const insight = `💡 **Insight:** Frekuensi pengisian Anda cenderung memuncak di akhir pekan. Disarankan melakukan pengisian pada hari kerja di pagi hari untuk menghindari kepadatan antrian.`;

  const nextAction = `\n\n🚀 **Tindakan Lanjutan:** Klik menu **"Transaksi"** untuk mengekspor data statistik ini ke Excel atau melihat perbandingan efisiensi antar jenis kendaraan Anda.`;

  return `${greeting}${summary}${structuredData}${insight}${nextAction}`;
}

// Check if message is a direct database retrieval query (bypasses Gemini Layer 3)
function isDirectDataRetrieval(message: string, intents: IntentCategory[]): boolean {
  const msg = message.toLowerCase().trim();

  // If the intent is GENERAL, it's definitely not a direct DB retrieval.
  const isDbIntent = intents.some((i) => i !== "GENERAL");
  if (!isDbIntent) {
    return false;
  }

  // Pure informational query words that indicate general FAQ / manual lookup:
  // e.g. "bagaimana cara", "tutorial", "panduan", "apakah bisa", "apakah ada", "kenapa", "mengapa", "cara kerja"
  const isInformationalStart = /^(apakah|bagaimana|cara|kenapa|mengapa|apa\s+itu|jelaskan|sejarah|penemu|keuntungan|kelebihan|kekurangan|manfaat|tips|saran|tutorial|panduan|bagaimana\s+jika)\b/i.test(msg);
  
  // Check if it explicitly asks for personal indicators: "saya", "ku", "akun saya", "mobil saya", "milik saya", "transaksi saya", "pengisian saya", "saldo saya", "rfid saya", "antrian saya", "notifikasi saya"
  const hasPersonalIndicator = /\b(saya|ku|akun|armada\s+saya|kendaraan\s+saya|mobil\s+saya|transaksi\s+saya|pengisian\s+saya|saldo\s+saya|rfid\s+saya|antrian\s+saya|notif\s+saya|profil\s+saya|history\s+saya|riwayat\s+saya|kartu\s+saya|stiker\s+saya)\b/i.test(msg);

  // Exceptions where direct retrieval is desired even without personal indicators:
  // 1. Asking for SPBU terdekat / lokasi terdekat / pom bensin terdekat
  const isStationRequest = intents.includes("STATION") && /\b(terdekat|lokasi|alamat|spbu|pom\s+bensin)\b/i.test(msg);
  // 2. Asking for active queue (estimasi antrian)
  const isQueueRequest = intents.includes("QUEUE") && /\b(antrian|antri|lajur|estimasi)\b/i.test(msg);
  
  if (isInformationalStart) {
    // If it starts with informational words, only retrieve direct DB data if it has personal indicator, or is a station/queue request.
    return hasPersonalIndicator || isStationRequest || isQueueRequest;
  }

  // If it's a command/request for list or status:
  // e.g. "tampilkan riwayat", "daftar kendaraan", "cek saldo", "show transactions"
  const isRequestCommand = /\b(tampilkan|daftar|lihat|cek|show|list|riwayat|history|saldo|armada|kendaraan|mobil|plat|rfid|antrian|notifikasi)\b/i.test(msg);

  return isRequestCommand || hasPersonalIndicator || isStationRequest || isQueueRequest;
}

function buildLocalDbResponse(
  intents: IntentCategory[],
  ctx: ContextData,
  message: string,
  forceFallback = false,
): string | null {
  // If not forced fallback, only intercept if it matches the direct retrieval router
  if (!forceFallback && !isDirectDataRetrieval(message, intents)) {
    return null;
  }

  const profileName = ctx.profile?.full_name || "Dio Ginting";
  const handler = intents[0];
  console.log("Selected handler:", handler || "None (General)");

  if (handler === "NOTIFICATION") {
    return formatNotifications(ctx.notifications || [], profileName);
  }
  if (handler === "RFID") {
    return formatRFID(ctx.vehicles || [], profileName);
  }
  if (handler === "FUEL") {
    return formatFuelRecommendations(ctx.vehicles || [], profileName);
  }
  if (handler === "TRANSACTION") {
    return formatTransactions(ctx.transactions || [], profileName);
  }
  if (handler === "QUEUE") {
    return formatQueue(ctx.queueSessions || [], profileName);
  }
  if (handler === "STATION") {
    return formatStations(ctx.stations || [], profileName);
  }
  if (handler === "ACCOUNT") {
    return formatProfile(ctx.profile, profileName);
  }
  if (handler === "DASHBOARD") {
    return formatDashboardSummary(ctx, profileName);
  }
  if (handler === "VEHICLE") {
    return formatVehicles(ctx.vehicles || [], profileName);
  }
  if (handler === "SPENDING") {
    return formatSpending(ctx.transactions || [], profileName);
  }
  if (handler === "SECURITY") {
    return formatSecurity(ctx.profile, profileName);
  }
  if (handler === "ANALYTICS") {
    return formatAnalytics(ctx.transactions || [], ctx.vehicles || [], profileName);
  }
  if (handler === "FLEET") {
    return formatFleet(ctx.vehicles || [], profileName);
  }
  if (handler === "PAYMENT") {
    return formatPayment(ctx.profile, profileName);
  }
  if (handler === "QRIS") {
    return formatQRIS(profileName);
  }
  if (handler === "HISTORY") {
    return formatHistory(ctx.transactions || [], profileName);
  }
  if (handler === "ALERTS") {
    return formatAlerts(ctx.notifications || [], profileName);
  }
  if (handler === "REFUEL") {
    return formatRefuel(ctx.vehicles || [], profileName);
  }
  if (handler === "MONITORING") {
    return formatMonitoring(ctx.vehicles || [], profileName);
  }
  if (handler === "STATISTICS") {
    return formatStatistics(ctx.transactions || [], ctx.vehicles || [], profileName);
  }

  return null;
}

// ============================================================
// LOCAL PANDUAN MANUAL SFRT (ULTIMATE FALLBACK)
// Displays a structured user guide if all layers are rate-limited or unavailable.
// ============================================================
function formatLocalUserManual(profileName: string): string {
  return `Halo **${profileName}**.

Berikut adalah panduan manual resmi sistem **Smart Fast Refueling Technology (SFRT)** untuk membantu kelancaran pengoperasian Anda:

📖 **SFRT USER MANUAL & QUICK REFERENCE**

1. 🚗 **Pendaftaran Armada (Menu Armada)**
   * Buka tab **Armada** di panel kiri, tekan **Tambah Kendaraan**.
   * Isi Merk, Model, Plat Nomor (tanpa spasi), Kapasitas Tangki (Liter), dan BBM preferensi.
   * Tekan **Simpan**. Status RFID kendaraan Anda akan berstatus Pending.

2. 📡 **Aktivasi Stiker RFID Kendaraan**
   * Ajukan fisik stiker RFID ke petugas SPBU SFRT terdekat.
   * Tempelkan stiker di area lampu depan kiri utama (Headlight) atau kaca depan (Windshield).
   * Petugas SPBU akan memindai scanner dan memverifikasi plat nomor di dashboard operator. Status RFID di aplikasi Anda akan berubah menjadi **Terverifikasi (Hijau)**.

3. ⚡ **Metode Pengisian Touchless (Fast Refuel)**
   * Kendarai kendaraan terverifikasi masuk ke lajur SPBU pintar SFRT.
   * Sensor RFID mendeteksi stiker Anda, dan kamera menangkap plat nomor. Dispenser SPBU menyapa nama Anda dan membuka solenoid kran.
   * Petugas melakukan pengisian nozzle bbm hingga penuh atau mencapai limit rupiah Anda.
   * Solenoid menutup otomatis. Saldo akun / E-Wallet terpotong otomatis. Struk terbit di HP!

4. ⏱️ **Pemantauan Antrian SPBU**
   * Masuk lajur otomatis menerbitkan tiket antrian elektronik (misal: \`A-15\`).
   * Anda bisa memantau estimasi menit tunggu di Dashboard secara real-time.

💡 **Insight:** Menjaga stiker RFID dari penumpukan logam, kotoran lumpur, atau sobekan fisik sangat penting untuk menjaga integritas pembacaan sensor radio dispenser.

🚀 **Tindakan Lanjutan:** Anda bisa langsung mengetikkan kata kunci *"Tampilkan kendaraan saya"*, *"Riwayat transaksi"*, atau *"Cek stasiun SPBU"* untuk menampilkan data aktual Anda secara lokal!`;
}

// ============================================================
// MAIN DENSITY EDGE SERVER
// Pipeline Flow:
// 1. Authenticate user.
// 2. Query basic details & name.
// 3. Layer 1: FAQ Match -> Return FAQ.
// 4. Layer 2: Direct Database Match -> Return 5-Part Formatted Data.
// 5. Layer 3: Gemini call (Analysis / General Chat).
// 6. Progressive Fallback Recovery on Gemini Fail (FAQ -> Database -> User Manual).
// ============================================================
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized. Missing Authorization header." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error("[Auth Error]", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized. Invalid session.", details: userError }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(`[Auth] ✓ Verified user ${user.id}`);

    // 2. Parse payload
    const { message, history } = await req.json();
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Missing 'message' in request body." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ═══════════════════════════════════════════
    // PIPELINE INTENT PROCESSING
    // ═══════════════════════════════════════════
    const scoredResult = detectIntentsWithScore(message);
    const selectedIntent = scoredResult.winningIntentId;
    const handlerName = scoredResult.category;
    const scores = scoredResult.scores;
    const intents = [handlerName];

    console.log("Question:", message);
    console.log("Intent Scores:", scores);
    console.log("Winning Intent:", selectedIntent);
    console.log("Selected Handler:", handlerName);

    // Fetch user details for salutation greeting
    const profileRes = await serviceClient
      .from("users")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    const profileName = profileRes.data?.full_name || "Dio Ginting";

    // ═══════════════════════════════════════════
    // PIPELINE LAYER 1: LOCAL FAQ ENGINE (Checked First to allow How-to overrides)
    // ═══════════════════════════════════════════
    const faqResponse = await checkLocalFaq(message, profileName, serviceClient);
    if (faqResponse) {
      console.log(`[Pipeline] Layer 1 Match (FAQ Engine). Sourcing response from FAQ...`);
      console.log("[Engine] Response sourced from: FAQ Engine");
      return new Response(JSON.stringify({ response: faqResponse }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══════════════════════════════════════════
    // PIPELINE LAYER 2: DIRECT DATABASE RETRIEVAL (DATABASE SECOND)
    // ═══════════════════════════════════════════
    const isDirect = isDirectDataRetrieval(message, intents);
    if (isDirect) {
      console.log(`[Pipeline] Layer 2 Match (Direct DB Query). Sourcing response from Database...`);
      const contextData = await queryContextData(intents, user.id, serviceClient);
      const dbResponse = buildLocalDbResponse(intents, contextData, message);
      if (dbResponse) {
        console.log("[Engine] Response sourced from: Database Engine");
        return new Response(JSON.stringify({ response: dbResponse }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ═══════════════════════════════════════════
    // PIPELINE LAYER 3: GEMINI AI ENHANCEMENT
    // ═══════════════════════════════════════════
    console.log(`[Pipeline] Layer 3 Delegation (Generative AI). Sourcing response from Gemini...`);
    
    // Fetch context data needed for the Gemini prompt or fallbacks
    const contextDataAll = await queryContextData(
      ["VEHICLE", "TRANSACTION", "DASHBOARD", "STATION", "QUEUE", "NOTIFICATION", "ACCOUNT", "SPENDING", "HISTORY", "ALERTS"],
      user.id,
      serviceClient,
    );

    // DEFERRED GEMINI API KEY VALIDATION
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.warn("[Gemini API Key Error] Missing GEMINI_API_KEY. Forcing fallback...");
      
      const fallbackFaq = await checkLocalFaq(message, profileName, serviceClient);
      if (fallbackFaq) {
        console.log("[Engine] Response sourced from: Fallback Engine (FAQ)");
        const disclaimer = `⚠️ **[Koneksi AI Terbatas]** Layanan AI sedang tidak aktif. Namun, berikut adalah panduan SFRT yang cocok dengan pertanyaan Anda:\n\n${fallbackFaq}`;
        return new Response(JSON.stringify({ response: disclaimer }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const fallbackDb = buildLocalDbResponse(intents, contextDataAll, message, true);
      if (fallbackDb) {
        console.log("[Engine] Response sourced from: Fallback Engine (Database)");
        const disclaimer = `⚠️ **[Koneksi AI Terbatas]** Layanan AI sedang tidak aktif. Namun, berikut adalah data akun Anda langsung dari database:\n\n${fallbackDb}`;
        return new Response(JSON.stringify({ response: disclaimer }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("[Engine] Response sourced from: Fallback Engine (User Manual)");
      const userManual = formatLocalUserManual(profileName);
      const disclaimer = `⚠️ **[Koneksi AI Terbatas]** Layanan AI sedang tidak aktif. Berikut adalah panduan manual resmi sistem SFRT untuk mempermudah operasional Anda:\n\n${userManual}`;
      return new Response(JSON.stringify({ response: disclaimer }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = buildSystemPrompt(user, intents, contextDataAll);
    const contents = (history || []).map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content || msg.text || "" }],
    }));
    contents.push({ role: "user", parts: [{ text: message }] });

    const result = await callGeminiWithRetry(apiKey, systemPrompt, contents, profileName);

    // ═══════════════════════════════════════════
    // 🚨 PROGRESSIVE FALLBACK RECOVERY (IF GEMINI FAILS)
    // ═══════════════════════════════════════════
    if (result.status === 429 || result.status >= 500) {
      console.warn(`[Pipeline Fallback] Gemini returned ${result.status}. Executing fallbacks...`);

      // Fallback Strategy 1: Try FAQ Match
      const fallbackFaq = await checkLocalFaq(message, profileName, serviceClient);
      if (fallbackFaq) {
        console.log("[Engine] Response sourced from: Fallback Engine (FAQ)");
        const disclaimer = `⚠️ **[Koneksi AI Terbatas]** Layanan AI sedang mengalami gangguan. Namun, berikut adalah panduan SFRT yang cocok dengan pertanyaan Anda:\n\n${fallbackFaq}`;
        return new Response(JSON.stringify({ response: disclaimer }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fallback Strategy 2: Try Database Data Engine (Forced)
      const fallbackDb = buildLocalDbResponse(intents, contextDataAll, message, true);
      if (fallbackDb) {
        console.log("[Engine] Response sourced from: Fallback Engine (Database)");
        const disclaimer = `⚠️ **[Koneksi AI Terbatas]** Layanan AI sedang mengalami gangguan untuk analisis mendalam. Namun, berikut adalah data akun Anda langsung dari database:\n\n${fallbackDb}`;
        return new Response(JSON.stringify({ response: disclaimer }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fallback Strategy 3: Local SFRT User Manual & Guide
      console.log("[Engine] Response sourced from: Fallback Engine (User Manual)");
      const userManual = formatLocalUserManual(profileName);
      const disclaimer = `⚠️ **[Koneksi AI Terbatas]** Layanan AI sedang mengalami gangguan. Berikut adalah panduan manual resmi sistem SFRT untuk mempermudah operasional Anda:\n\n${userManual}`;
      return new Response(JSON.stringify({ response: disclaimer }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: result.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[Engine] Response sourced from: Gemini Engine");
    return new Response(JSON.stringify({ response: result.text }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[Fatal Server Error]", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
