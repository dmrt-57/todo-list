# 🚀 TaskFlow Pro - Modern Todo & Liste Yönetim Uygulaması

![Python](https://img.shields.io/badge/Python-3.9%2B-blue?logo=python&logoColor=white)
![Database](https://img.shields.io/badge/Database-SQLite3-003B57?logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)
![Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Built--in)-success)
![Design](https://img.shields.io/badge/Design-Modern%20UI%20%2F%20Dark%20Mode-6366f1)

TaskFlow Pro; modern, hızlı, SQLite veritabanı destekli, çoklu liste ve kategori yapısına sahip profesyonel bir yapılacaklar (Todo) listesi uygulamasıdır.

Geliştirici Profili: [@dmrt-57](https://github.com/dmrt-57)

---

## ✨ Özellikler

- 🎨 **Modern & Şık Kullanıcı Arayüzü**:
  - Koyu (Dark) ve Açık (Light) tema desteği (tercihiniz otomatik hatırlanır).
  - Akıcı geçişler, kart tasarımları, mikro etkileşimler ve responsive (mobil/tablet/masaüstü) uyumluluk.
  - Canlı ilerleme çubuğu ve istatistik kartları (% tamamlanma oranı, bekleyen ve biten görevler).

- 📁 **Özel Listeler & Kategoriler (Nested / Çoklu Liste)**:
  - İstediğiniz kadar özel liste oluşturabilirsiniz (Örn: *🛒 Alışveriş Listesi*, *💼 İş & Projeler*, *🎯 Kişisel Hedefler*).
  - Her liste için emoji simgesi ve tema rengi belirleyebilirsiniz.
  - Bir listeyi seçtiğinizde yalnızca o listeye ait görevler listelenir ve doğrudan o listeye yeni maddeler eklenebilir.
  - "Tüm Görevler" görünümü ile tüm listelerdeki işleri tek bir ekranda toplayabilirsiniz.

- 🔍 **Arama Butonu & Anlık Filtreleme**:
  - Görev başlıklarında ve açıklama notlarında arama yapan **Arama Butonu** ve anlık filtreleme.
  - Arama yapılan kelimeleri otomatik vurgulama (highlight).
  - Durum filtreleri (*Tümü*, *Bekleyenler*, *Tamamlananlar*).
  - Öncelik filtreleri (*🔴 Yüksek*, *🟡 Orta*, *🟢 Düşük*).

- ⚠️ **Onaylı Güvenli Silme (Delete Confirmation Modal)**:
  - Görev veya liste silerken yanlış tıklamaları önlemek amacıyla şık bir onay penceresi açılır.
  - Onay verilmeden hiçbir veri silinmez.

- ⚡ **Sıfır Dış Bağımlılık (Zero External Dependencies)**:
  - `npm`, `node_modules` veya harici ağır kütüphanelere ihtiyaç duymaz!
  - Saf Python 3 standart kütüphanesi (`sqlite3`, `http.server`) ile çalışır. Bilgisayarında Python olan herkes tek tıkla çalıştırabilir.

- 💾 **Kalıcı SQLite Veritabanı**:
  - Tüm listeler ve görevler `todos.db` dosyasında güvenle saklanır.
  - İlişkisel tablo yapısı ve yabancı anahtar (Foreign Key + CASCADE Delete) desteği.

---

## 📂 Proje Yapısı

```text
modern-todo-app/
├── app.py              # REST API sunucusu ve statik dosya dağıtımı (Python)
├── database.py         # SQLite veritabanı bağlantısı, şema ve CRUD sorguları
├── run.sh              # Tek tıkla çalıştırma betiği
├── templates/
│   └── index.html      # Modern SPA arayüzü ve modallar
├── static/
│   ├── css/
│   │   └── style.css   # Modern tema, animasyonlar ve responsive tasarım
│   ├── js/
│   │   └── app.js      # Canlı DOM yönetimi, API istekleri, arama ve onay modalları
│   └── favicon.svg     # Özel checklist ikon
├── .gitignore          # Git tarafından yok sayılacak dosyalar
└── README.md           # Kapsamlı dokümantasyon
```

---

## 🚀 Hızlı Başlangıç (Nasıl Çalıştırılır?)

### 1. Uygulamayı Başlatın

Terminalde proje dizinine gidin ve şu komutu çalıştırın:

```bash
python3 app.py
```
*(Alternatif olarak `./run.sh` komutunu da kullanabilirsiniz)*

### 2. Tarayıcıda Açın

Sunucu başladığında tarayıcınızdan şu adrese gidin:

👉 **[http://localhost:8000](http://localhost:8000)**

---

## 📤 GitHub'a Yükleme Rehberi (dmrt-57)

Bu projeyi [github.com/dmrt-57](https://github.com/dmrt-57) profilinize yüklemek için aşağıdaki adımları takip edin:

### Adım 1: GitHub'da Yeni Depo (Repository) Oluşturun
1. [github.com/new](https://github.com/new) adresine gidin.
2. **Repository name** kısmına `modern-todo-app` yazın.
3. Repoyu **Public** veya **Private** olarak seçin.
4. "Add a README file" seçeneğini **işaretlemeyin** (çünkü depomuzda hazır README mevcuttur).
5. **Create repository** butonuna tıklayın.

### Adım 2: Terminalden GitHub'a Push Edin
Terminali açıp proje klasörüne gidin ve sırasıyla şu komutları çalıştırın:

```bash
cd /Users/isademirtas/.gemini/antigravity/scratch/modern-todo-app

# GitHub remote adresini ekleyin:
git remote add origin https://github.com/dmrt-57/modern-todo-app.git

# Ana dalı main yapın ve GitHub'a yükleyin:
git branch -M main
git push -u origin main
```

Tebrikler! Projeniz artık GitHub profilinizde yayında olacaktır:
👉 `https://github.com/dmrt-57/modern-todo-app`

---

## 🔌 REST API Endpoints

Uygulama tam fonksiyonel bir REST API sunar:

| Metot | Uç Nokta (Endpoint) | Açıklama |
|---|---|---|
| `GET` | `/api/lists` | Tüm listeleri ve görev istatistiklerini getirir |
| `POST` | `/api/lists` | Yeni liste oluşturur (`name`, `icon`, `color`) |
| `PUT` | `/api/lists/:id` | Var olan listeyi günceller |
| `DELETE` | `/api/lists/:id` | Listeyi ve içindeki tüm görevleri siler |
| `GET` | `/api/tasks` | Görevleri getirir (filtreler: `list_id`, `search`, `status`, `priority`) |
| `POST` | `/api/tasks` | Yeni görev ekler (`list_id`, `title`, `notes`, `priority`, `due_date`) |
| `PUT` | `/api/tasks/:id` | Görevi günceller |
| `POST` | `/api/tasks/:id/toggle` | Görevin tamamlandı/bekliyor durumunu değiştirir |
| `DELETE` | `/api/tasks/:id` | Görevi siler |
| `GET` | `/api/stats` | Genel tamamlama yüzdesi ve sayaçları döndürür |

---

## 👨‍💻 Geliştirici

- **GitHub:** [@dmrt-57](https://github.com/dmrt-57)
- **Lisans:** MIT
