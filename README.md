# 🚀 Blockchain P2P Murni

Sistem blockchain sederhana yang 100% peer-to-peer tanpa server pusat. Jalankan node, share IP ke teman, dan jaringan terbentuk secara otomatis.

![Logo](./public/logo_White.png)

---

## ✨ Fitur Utama

- **Pure P2P** - Tanpa server, tanpa tracker, tanpa file external
- **Real-time Sync** - Chain otomatis sync antar node
- **User Storage di Chain** - Data user tersimpan di blockchain, bukan database
- **Balance Real-time** - Balance diambil langsung dari chain
- **Auto Discovery** - Node otomatis discover peer baru via DHT
- **Multi-platform** - Windows, Linux, Mac, bahkan Android (Termux)

---

## 🏃‍♂️ Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/OpikStudio/blockchain-p2p.git
cd blockchain-p2p
npm install
```

### 2. Jalankan Node

```bash
npm run start
```

### 3. Share IP

Lihat IP di console, share ke teman:

```
📋 Share this IP to friends: ws://192.168.1.5:6177
```

### 4. Connect

Teman masukkan IP di halaman node-management → connect → done!

## 📱 Android (Termux)

```bash
pkg install nodejs git
git clone https://github.com/OpikStudio/blockchain-p2p.git
cd blockchain-p2p
npm install
npm run node1
```

Cek IP di notification → share ke laptop → connect!

---

## 📄 Lisensi

MIT License - bebas digunakan untuk apapun
👨‍💻 Developed by Opik Studio

Blockchain Enthusiast | Full Stack Developer

https://github.com/Opikz-Nrdyth/

https://opikstudio.my.id/
