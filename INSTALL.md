# 📦 IT Asset Management — Panduan Instalasi Production

> Aplikasi: Next.js 16 + SQLite | Stack: Node.js, npm, PM2

---

## Daftar Isi
- [Prasyarat](#prasyarat)
- [Instalasi di Ubuntu Server](#-instalasi-di-ubuntu-server)
- [Instalasi di Windows Server / Windows 10+](#-instalasi-di-windows)
- [Konfigurasi Awal Setelah Install](#-konfigurasi-awal-setelah-install)
- [Manajemen & Perawatan](#️-manajemen--perawatan)

---

## Prasyarat

| Kebutuhan | Versi Minimum |
|-----------|--------------|
| Node.js | 20.x LTS |
| npm | 10.x |
| RAM | 512 MB (rekomendasi 1 GB) |
| Disk | 2 GB kosong |
| OS | Ubuntu 20.04+ / Windows Server 2019+ / Windows 10+ |

---

## 🐧 Instalasi di Ubuntu Server

### Langkah 1 — Update sistem

```bash
sudo apt update && sudo apt upgrade -y
```

### Langkah 2 — Install Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verifikasi:

```bash
node -v    # Harus: v20.x.x
npm -v     # Harus: 10.x.x
```

### Langkah 3 — Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### Langkah 4 — Upload / Clone project

Opsi A — Upload via SCP dari Windows:
```bash
# Jalankan dari komputer Windows Anda
scp -r "C:\Users\Asus\Downloads\it-asset-management-main\web" user@IP_SERVER:/var/www/itam
```

Opsi B — Clone dari GitHub:
```bash
git clone https://github.com/voizzz/it-asset-management.git /var/www/itam
cd /var/www/itam/web
```

### Langkah 5 — Install dependencies

```bash
cd /var/www/itam/web
npm install
```

### Langkah 6 — Buat file `.env`

```bash
nano .env
```

Isi dengan:
```env
DATABASE_URL="file:./itam_v2.db"
SESSION_SECRET="ganti-dengan-string-rahasia-panjang-minimal-32-karakter"
```

Simpan dengan `Ctrl+X` → `Y` → `Enter`

### Langkah 7 — Siapkan database awal

Jika tidak membawa file `itam_v2.db` dari server lama, jalankan seed:
```bash
node seed.js
```

### Langkah 8 — Build aplikasi

```bash
npm run build
```

> Proses ini memakan waktu 1-3 menit. Tunggu sampai muncul ✓ pada semua halaman.

### Langkah 9 — Buat folder uploads

```bash
mkdir -p public/uploads/attachments
```

### Langkah 10 — Jalankan dengan PM2

```bash
pm2 start npm --name "itam" -- start
pm2 save
pm2 startup
```

> Ikuti instruksi yang muncul dari `pm2 startup` (copy-paste perintahnya dan jalankan).

### Langkah 11 — Verifikasi berjalan

```bash
pm2 status
curl http://localhost:3000
```

> Jika muncul HTML → aplikasi berjalan! ✅

---

### (Opsional) Setup Nginx sebagai Reverse Proxy

Install Nginx:
```bash
sudo apt install -y nginx
```

Buat konfigurasi site:
```bash
sudo nano /etc/nginx/sites-available/itam
```

Isi:
```nginx
server {
    listen 80;
    server_name IP_ATAU_DOMAIN_ANDA;

    # Upload file max 50MB
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktifkan dan restart:
```bash
sudo ln -s /etc/nginx/sites-available/itam /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

Sekarang aplikasi bisa diakses di port **80** tanpa `:3000`!

### (Opsional) Setup Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## 🪟 Instalasi di Windows

### Langkah 1 — Install Node.js 20 LTS

1. Download dari: https://nodejs.org/en/download
2. Pilih **Windows Installer (.msi)** versi **20.x LTS**
3. Jalankan installer, centang semua opsi default
4. Restart komputer setelah selesai

Verifikasi (buka **PowerShell** atau **Command Prompt**):
```powershell
node -v
npm -v
```

### Langkah 2 — Install PM2

```powershell
npm install -g pm2
npm install -g pm2-windows-startup
```

### Langkah 3 — Clone atau salin project

Opsi A — Clone dari GitHub:
```powershell
git clone https://github.com/voizzz/it-asset-management.git C:\ITAM
cd C:\ITAM\web
```

Opsi B — Salin folder project secara manual ke `C:\ITAM\web\`

### Langkah 4 — Buat file `.env`

Buat file `.env` (tanpa ekstensi apapun) di dalam folder `C:\ITAM\web\`:

```env
DATABASE_URL="file:./itam_v2.db"
SESSION_SECRET="ganti-dengan-string-rahasia-panjang-minimal-32-karakter"
```

> ⚠️ Di Windows Explorer, aktifkan "Show file extensions" agar tidak tersimpan sebagai `.env.txt`

### Langkah 5 — Install dependencies

Buka **PowerShell sebagai Administrator**:

```powershell
cd C:\ITAM\web
npm install
```

### Langkah 6 — Siapkan database awal

Jika tidak membawa file `itam_v2.db` dari server lama:
```powershell
node seed.js
```

### Langkah 7 — Buat folder uploads

```powershell
New-Item -ItemType Directory -Force -Path "C:\ITAM\web\public\uploads\attachments"
```

### Langkah 8 — Build aplikasi

```powershell
npm run build
```

### Langkah 9 — Jalankan dengan PM2

```powershell
pm2 start npm --name "itam" -- start
pm2 save
pm2-windows-startup install
```

### Langkah 10 — Verifikasi

Buka browser: **http://localhost:3000**

Atau dari jaringan lain: **http://IP_KOMPUTER:3000**

---

### (Opsional) Izinkan di Windows Firewall

1. Buka **Windows Defender Firewall with Advanced Security**
2. **Inbound Rules** → **New Rule**
3. Pilih **Port** → **TCP** → Port: `3000`
4. Pilih **Allow the connection**
5. Beri nama: `ITAM App`
6. Klik **Finish**

---

## ⚙️ Konfigurasi Awal Setelah Install

### Akun Default

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin |

> 🔴 **WAJIB ganti password admin segera setelah login pertama!**  
> **Settings → User Management → Edit**

### Akses dari Jaringan Lokal

Edit `next.config.ts` dan tambahkan IP jaringan Anda:
```typescript
const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.0', '10.0.0.1'],
};
```

Lalu rebuild dan restart:
```bash
npm run build
pm2 restart itam
```

---

## 🛠️ Manajemen & Perawatan

### Perintah PM2

| Perintah | Fungsi |
|----------|--------|
| `pm2 status` | Cek status aplikasi |
| `pm2 restart itam` | Restart aplikasi |
| `pm2 stop itam` | Stop aplikasi |
| `pm2 start itam` | Start aplikasi |
| `pm2 logs itam` | Lihat log real-time |
| `pm2 logs itam --lines 100` | 100 baris log terakhir |

### Backup Database

Database tersimpan di file `itam_v2.db`. Backup secara rutin:

```bash
# Ubuntu — tambahkan ke cron untuk backup otomatis harian
cp /var/www/itam/web/itam_v2.db /backup/itam_$(date +%Y%m%d).db
```

```powershell
# Windows
Copy-Item C:\ITAM\web\itam_v2.db "C:\Backup\itam_$(Get-Date -Format 'yyyyMMdd').db"
```

### Update Aplikasi

```bash
# 1. Pull perubahan terbaru
cd /var/www/itam
git pull origin main

# 2. Install dependencies baru
cd web
npm install

# 3. Hapus cache build lama
rm -rf .next

# 4. Build ulang
npm run build

# 5. Restart
pm2 restart itam
```

### Cek Port Berjalan

```bash
# Ubuntu
ss -tlnp | grep 3000

# Windows
netstat -ano | findstr :3000
```

---

> **💡 Tips Production:** Gunakan Nginx di Ubuntu agar port 80 tanpa `:3000` dan mudah tambah HTTPS dengan Certbot (Let's Encrypt) secara gratis.
>
> **⚠️ Penting:** Selalu backup file `itam_v2.db` secara rutin — itulah satu-satunya tempat data seluruh aset Anda tersimpan!
