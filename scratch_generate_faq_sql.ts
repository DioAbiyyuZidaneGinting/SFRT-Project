import fs from 'fs';
import path from 'path';

const brands = [
  "Toyota Avanza", "Honda Civic", "Mitsubishi Pajero", "Hyundai Ioniq", 
  "Tesla Model Y", "Suzuki Ertiga", "Daihatsu Xenia", "Wuling Almaz", 
  "Ferrari F80", "BMW 320i", "Mercedes C200", "Isuzu Elf", 
  "Hino Truck", "Fuso", "Honda Beat", "Yamaha NMAX",
  "Mazda CX-5", "Toyota Innova", "Honda HR-V", "Suzuki Carry",
  "Mitsubishi L300", "Daihatsu Sigra", "Hyundai Creta", "Wuling Binguo"
];

const cities = [
  "Jakarta", "Bandung", "Surabaya", "Medan", "Semarang", 
  "Makassar", "Palembang", "Tangerang", "Bekasi", "Depok", 
  "Bogor", "Yogyakarta", "Denpasar", "Balikpapan",
  "Malang", "Solo", "Pekanbaru", "Padang", "Banjarmasin",
  "Pontianak", "Samarinda", "Manado", "Ambon"
];

const fuels = [
  "Pertamax", "Pertalite", "Pertamax Turbo", "Solar", "Dexlite", "Pertamina Dex"
];

const errors = [
  "gagal scan", "tidak terdeteksi", "error 404", "status pending", 
  "rusak fisik", "salah plat nomor", "terkelupas", "salah lajur"
];

const actions = [
  "daftar baru", "migrasi", "edit data", "hapus", 
  "unassign driver", "top up saldo", "klaim cashback", "tarik dana"
];

const faqs: { question: string; answer: string; category: string }[] = [];

// Helper to escape SQL string
function esc(str: string): string {
  return str.replace(/'/g, "''");
}

// 1. RFID Errors
for (const brand of brands) {
  for (const error of errors) {
    faqs.push({
      question: `Stiker RFID ${brand} saya ${error}. Apa yang harus dilakukan?`,
      answer: `Jika stiker RFID ${brand} Anda mengalami ${error}, periksa status verifikasinya di menu 'Armada'. Jika masih pending, kunjungi petugas SPBU terdekat untuk verifikasi fisik. Jika rusak fisik, Anda dapat mengajukan penggantian stiker baru lewat stasiun SPBU SFRT terdekat.`,
      category: "RFID"
    });
  }
}

// 2. RFID Install
for (const brand of brands) {
  faqs.push({
    question: `Bagaimana cara memasang stiker RFID di ${brand}?`,
    answer: `Untuk ${brand}, stiker RFID pasif direkomendasikan ditempel pada kaca depan sebelah kiri (windshield) atau lampu utama (headlight) kiri. Pastikan area tersebut bebas dari kotoran atau bahan logam tebal agar sensor dispenser SPBU SFRT dapat memindai gelombang radio dengan optimal.`,
    category: "RFID"
  });
}

// 3. RFID Weather
for (const brand of brands) {
  faqs.push({
    question: `Apakah stiker RFID ${brand} aman jika terkena air hujan atau cuaca ekstrem?`,
    answer: `Ya, stiker RFID SFRT dirancang tahan cuaca, waterproof, dan tahan panas. Stiker ini akan tetap bekerja normal pada kendaraan ${brand} Anda selama tidak mengalami sobekan fisik yang memotong chip RFID di dalamnya.`,
    category: "RFID"
  });
}

// 4. RFID Scanner Failure
for (const brand of brands) {
  for (const city of cities) {
    faqs.push({
      question: `Kenapa scanner RFID SPBU ${city} gagal mendeteksi stiker ${brand} saya?`,
      answer: `Kegagalan pemindaian di SPBU ${city} untuk ${brand} biasanya disebabkan oleh gangguan logam (metalic interference) seperti plat modifikasi dekat sensor, atau stiker berstatus belum terverifikasi di database. Kunjungi petugas SPBU untuk kalibrasi dual-factor.`,
      category: "TROUBLESHOOTING"
    });
  }
}

// 5. Payment Actions
for (const action of actions) {
  faqs.push({
    question: `Bagaimana cara ${action} melalui aplikasi SFRT?`,
    answer: `Untuk melakukan ${action}, silakan masuk ke tab menu yang sesuai (misalnya 'Dashboard' untuk top up saldo, 'Armada' untuk manajemen driver). Sistem kami mendukung otomatisasi penuh sehingga transaksi diproses dalam waktu kurang dari 5 detik secara aman.`,
    category: "PAYMENT"
  });
}

// 6. QRIS Fuel
for (const fuel of fuels) {
  faqs.push({
    question: `Bisa bayar pengisian ${fuel} pakai QRIS bank apa saja?`,
    answer: `Tentu saja! QRIS SFRT dinamis untuk pengisian ${fuel} mendukung pembayaran dari seluruh aplikasi M-Banking (BCA, Mandiri, BRI, BNI) serta E-Wallet populer seperti GoPay, OVO, Dana, LinkAja, dan ShopeePay.`,
    category: "PAYMENT"
  });
}

// 7. Double Deduct
for (const fuel of fuels) {
  for (const city of cities) {
    faqs.push({
      question: `Bagaimana jika saldo SFRT saya terpotong ganda saat mengisi ${fuel} di SPBU ${city}?`,
      answer: `Jika terjadi pemotongan ganda saat pengisian ${fuel} di stasiun ${city}, sistem rekonsiliasi otomatis kami akan mengembalikan selisih saldo ke akun Anda dalam waktu 15 menit. Anda juga dapat melihat log struk digital di tab 'Transaksi'.`,
      category: "TROUBLESHOOTING"
    });
  }
}

// 8. Queue Times
for (const city of cities) {
  faqs.push({
    question: `Berapa estimasi waktu tunggu antrian di SPBU SFRT ${city}?`,
    answer: `Estimasi waktu tunggu di SPBU SFRT ${city} berkisar antara 2 hingga 8 menit tergantung pada panjang lajur aktif. Anda dapat memantau grafik antrian dispenser secara real-time langsung melalui tab Dashboard sebelum berkendara.`,
    category: "QUEUE"
  });
}

// 9. 24h Stations
for (const city of cities) {
  faqs.push({
    question: `Apakah SPBU SFRT ${city} beroperasi 24 jam?`,
    answer: `Sebagian besar stasiun SPBU pintar SFRT di ${city} beroperasi 24 jam dengan sistem dispenser otomatis. Namun, disarankan memeriksa status operasional (ikon hijau aktif) pada peta stasiun di dashboard Anda.`,
    category: "STATION"
  });
}

// 10. Auto Queue
for (const fuel of fuels) {
  faqs.push({
    question: `Bagaimana cara mengambil nomor antrian pengisian ${fuel} sebelum tiba di SPBU?`,
    answer: `Sistem antrian pengisian ${fuel} SFRT teralokasi secara otomatis ketika sensor RFID kendaraan Anda terdeteksi saat memasuki gerbang masuk SPBU. Anda tidak perlu memesan antrian secara manual di aplikasi.`,
    category: "QUEUE"
  });
}

// 11. Fleet Limits
for (const fuel of fuels) {
  for (const brand of brands) {
    faqs.push({
      question: `Bagaimana menetapkan limit pengisian harian ${fuel} untuk driver ${brand}?`,
      answer: `Sebagai Fleet Manager, Anda dapat mengatur kuota pengisian harian bbm ${fuel} untuk kendaraan ${brand} melalui menu 'Armada' lalu memilih submenu 'Limitasi Fleet'. Anda bisa membatasi konsumsi per hari dalam satuan Liter atau Rupiah.`,
      category: "FLEET"
    });
  }
}

// 12. RFID Swap Check
for (const brand of brands) {
  faqs.push({
    question: `Bagaimana jika sopir menukar stiker RFID ${brand} dengan kendaraan lain?`,
    answer: `Sistem keamanan SFRT dilengkapi Dual-Factor Authentication. Kamera kecerdasan buatan (ALPR) di SPBU akan mencocokkan plat nomor fisik kendaraan dengan plat nomor yang terdaftar di tag RFID. Jika tidak cocok dengan unit ${brand}, dispenser akan terkunci otomatis dan memicu peringatan Fraud di tab Alerts manajer.`,
    category: "SECURITY"
  });
}

// 13. Unassign Driver
for (const brand of brands) {
  faqs.push({
    question: `Bagaimana cara unassign driver dari unit ${brand}?`,
    answer: `Anda dapat melepas driver dari kendaraan ${brand} dengan membuka menu 'Armada', memilih mobil tersebut, lalu mengklik tombol 'Unassign Driver'. Kode otentikasi driver akan dinonaktifkan seketika.`,
    category: "FLEET"
  });
}

// 14. Fuel Compatibility
for (const fuel of fuels) {
  for (const brand of brands) {
    faqs.push({
      question: `Apa kelebihan menggunakan BBM ${fuel} untuk mobil ${brand}?`,
      answer: `Menggunakan ${fuel} untuk ${brand} sangat disarankan untuk menjaga kebersihan ruang bakar silinder sesuai kompresi pabrikan. Hal ini membantu mencegah detonasi prematur (knocking) dan menjaga efisiensi konsumsi BBM.`,
      category: "FUEL"
    });
  }
}

// 15. Capacity check
for (const brand of brands) {
  for (const fuel of fuels) {
    faqs.push({
      question: `Berapa kapasitas tangki ${brand} untuk pengisian ${fuel}?`,
      answer: `Kapasitas tangki standar ${brand} berkisar antara 40 hingga 80 liter. Untuk pengisian ${fuel}, dispenser pintar SFRT akan menghentikan aliran otomatis ketika sensor mendeteksi tingkat cairan telah mencapai batas kapasitas maksimum tangki.`,
      category: "VEHICLE"
    });
  }
}

// 16. Station availability
for (const city of cities) {
  for (const fuel of fuels) {
    faqs.push({
      question: `Apakah stasiun SPBU SFRT di ${city} menyediakan bahan bakar ${fuel}?`,
      answer: `Ya, stasiun pengisian pintar SFRT di wilayah ${city} menyediakan pasokan bahan bakar lengkap termasuk ${fuel}. Anda dapat memeriksa ketersediaan stok liter aktual melalui peta stasiun.`,
      category: "STATION"
    });
  }
}

// 17. Cost check
for (const brand of brands) {
  for (const city of cities) {
    faqs.push({
      question: `Berapa biaya pengisian penuh (full tank) bbm untuk ${brand} di SPBU ${city}?`,
      answer: `Biaya pengisian penuh untuk ${brand} bervariasi bergantung pada fluktuasi harga bahan bakar per liter di ${city}. Secara rata-rata berkisar antara Rp 400.000 hingga Rp 1.200.000.`,
      category: "SPENDING"
    });
  }
}

// 18. Custom Static FAQs
const staticFaqs = [
  {
    question: "apakah pembayaran disini bisa online dan offline?",
    answer: "Ya, sistem pembayaran SFRT mendukung metode online (Auto-Deduct saldo akun, e-wallet seperti GoPay/OVO, serta scan QRIS Dinamis) dan metode offline (pembayaran tunai/cash melalui petugas SPBU yang bertugas). Namun, kami sangat menyarankan metode online untuk mendukung kelancaran pengisian otomatis tanpa sentuh (touchless).",
    category: "PAYMENT"
  },
  {
    question: "Apakah bisa bayar pakai uang tunai atau cash di SPBU SFRT?",
    answer: "Ya, Anda tetap dapat melakukan pembayaran menggunakan uang tunai atau cash secara langsung kepada petugas SPBU SFRT yang berjaga di lajur pengisian.",
    category: "PAYMENT"
  },
  {
    question: "Bagaimana jika saldo terpotong ganda tetapi bensin tidak keluar?",
    answer: "Jika saldo terpotong tetapi pengisian gagal, dana akan dikembalikan ke saldo akun SFRT Anda secara otomatis dalam waktu maksimal 15 menit melalui sistem rekonsiliasi kami. Anda juga bisa melaporkan kejadian ke tim CS kami.",
    category: "TROUBLESHOOTING"
  },
  {
    question: "Bagaimana cara menghubungi customer service SFRT?",
    answer: "Anda dapat menghubungi Customer Service kami melalui tombol WhatsApp Emergency di Halaman FAQ atau chat langsung ke nomor +6289522177567.",
    category: "SUPPORT"
  },
  {
    question: "Apakah stiker RFID bisa dilepas dan ditempel kembali?",
    answer: "Stiker RFID dirancang sekali tempel untuk alasan keamanan. Melepas stiker secara paksa akan merusak antena logam di dalamnya, sehingga stiker tidak akan terbaca lagi oleh scanner dispenser.",
    category: "RFID"
  },
  {
    question: "Apakah ada biaya pendaftaran akun SFRT?",
    answer: "Pendaftaran akun dan registrasi kendaraan di platform SFRT 100% gratis tanpa biaya bulanan.",
    category: "ACCOUNT"
  },
  {
    question: "Berapa lama waktu verifikasi RFID setelah mendaftar?",
    answer: "Verifikasi fisik stiker RFID oleh petugas SPBU hanya memerlukan waktu 2-3 menit saat kunjungan pertama Anda.",
    category: "RFID"
  },
  {
    question: "Bagaimana cara melakukan penarikan kembali (refund) saldo SFRT?",
    answer: "Pengajuan refund saldo akun dapat dilakukan melalui menu Settings > Dompet Digital > Tarik Saldo. Proses verifikasi bank memakan waktu 1-2 hari kerja.",
    category: "PAYMENT"
  },
  {
    question: "Apakah aman menggunakan aplikasi SFRT di dekat dispenser?",
    answer: "Aplikasi digunakan sebelum atau sesudah pengisian. Saat berada di dekat dispenser, pengisian berjalan otomatis tanpa perlu menyentuh HP berkat stiker RFID.",
    category: "SECURITY"
  },
  {
    question: "Bagaimana cara mereset PIN transaksi yang lupa?",
    answer: "Buka menu Settings > Keamanan > Reset PIN. Tautan verifikasi akan dikirimkan ke email terdaftar Anda untuk membuat PIN baru.",
    category: "SECURITY"
  }
];

staticFaqs.forEach(faq => {
  faqs.push(faq);
  // Add some variations to make sure they match
  faqs.push({
    question: faq.question.toUpperCase(),
    answer: faq.answer,
    category: faq.category
  });
  faqs.push({
    question: faq.question.toLowerCase(),
    answer: faq.answer,
    category: faq.category
  });
});

console.log(`Generated ${faqs.length} FAQ entries.`);

// Build SQL file contents
let sql = `TRUNCATE public.faqs;\n\n`;

// Insert in batches of 100 to avoid long single statement limits
const batchSize = 100;
for (let i = 0; i < faqs.length; i += batchSize) {
  const batch = faqs.slice(i, i + batchSize);
  sql += `INSERT INTO public.faqs (question, answer, category) VALUES\n`;
  sql += batch.map(f => `  ('${esc(f.question)}', '${esc(f.answer)}', '${esc(f.category)}')`).join(",\n");
  sql += `;\n\n`;
}

fs.writeFileSync(path.resolve(process.cwd(), 'insert_faqs.sql'), sql);
console.log(`SQL seed written to insert_faqs.sql successfully.`);
