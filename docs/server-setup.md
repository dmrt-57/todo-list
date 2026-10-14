# Sunucu Kurulumu ve Uzaktan Erişim

## 1. Projenin Amacı
Bu çalışmada Ubuntu Server üzerinde bir yapılacaklar listesi uygulaması çalıştırılmıştır. Uygulamanın sunucu yeniden başlatıldığında otomatik olarak başlaması sağlanmış ve uzaktan erişim için Tailscale kullanılmıştır.

## 2. Kullanılan Teknolojiler

- Proxmox VE: Sanal makineleri yönetmek için kullanıldı.
- Ubuntu Server: Uygulamanın çalıştığı işletim sistemi.
- Python: Uygulamayı çalıştırmak için kullanıldı.
- SQLite: Uygulama verilerini saklamak için kullanıldı.
- systemd: Uygulamanın servis olarak yönetilmesi ve otomatik başlatılması için kullanıldı.
- Tailscale: Uzaktan ve özel ağ üzerinden erişim sağlamak için kullanıldı.
- GitHub: Kodların ve teknik dokümantasyonun saklandığı platform.

## 3. Uygulamanın Sunucuya Kurulması

Proje, GitHub deposundan Ubuntu Server üzerindeki `/opt/todo-app` dizinine klonlanmıştır.

Kullanılan komut:

```bash
git clone https://github.com/dmrt-57/todo-list.git /opt/todo-app
```

Uygulama dizinine geçmek için:

```bash
cd /opt/todo-app
```

Uygulamayı test etmek için aşağıdaki komut kullanılmıştır:

```bash
python3 app.py
```

Bu komut, Python uygulamasını başlatır. Uygulamanın düzgün çalıştığı tarayıcı üzerinden kontrol edilmiştir.

## 4. systemd Servisinin Yapılandırılması

Uygulamanın arka planda çalışması ve sunucu yeniden başlatıldığında otomatik olarak başlaması için systemd servisi oluşturulmuştur.

Servis dosyasının konumu:

```text
/etc/systemd/system/todo-app.service
```

Servisin çalışması için kullanılan temel ayarlar:

```ini
[Unit]
Description=Modern Todo App
After=network.target

[Service]
Type=simple
User=isa
WorkingDirectory=/opt/todo-app
ExecStart=/usr/bin/python3 /opt/todo-app/app.py
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Servisi etkinleştirme ve başlatma

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now todo-app
```

- `daemon-reload`: systemd yapılandırmalarını yeniden yükler.
- `enable`: Servisin açılışta otomatik başlamasını sağlar.
- `--now`: Servisi hemen başlatır.

### Servis durumunu kontrol etme

Servisin çalışıp çalışmadığını kontrol etmek için:

```bash
sudo systemctl status todo-app --no-pager
```

Servisin otomatik başlatılmak üzere etkin olup olmadığını kontrol etmek için:

```bash
systemctl is-enabled todo-app
```

Servisin şu anda çalışıp çalışmadığını kontrol etmek için:

```bash
systemctl is-active todo-app
```

Kontrollerde servis durumunun `active` ve otomatik başlatma durumunun `enabled` olduğu doğrulanmıştır.

## 5. Tailscale ile Uzaktan Erişim

Proxmox yönetim arayüzüne ve Ubuntu Server üzerinde çalışan uygulamaya farklı bir ağdan erişebilmek için Tailscale kullanılmıştır.

Tailscale, cihazların özel bir ağ üzerinden güvenli biçimde iletişim kurmasını sağlar.

### Proxmox yönetim arayüzüne erişim

```text
https://<PROXMOX_TAILSCALE_IP>:8006
```

### Todo uygulamasına erişim

```text
http://<UBUNTU_TAILSCALE_IP>:8000
```

`<PROXMOX_TAILSCALE_IP>` ve `<UBUNTU_TAILSCALE_IP>` ifadeleri örnek yer tutuculardır. Gerçek adresler Tailscale üzerinden kontrol edilmelidir.

**Güvenlik notu:** Gerçek IP adresleri, parolalar ve erişim anahtarları herkese açık GitHub deposuna eklenmemelidir. Yönetim arayüzüne doğrudan internet üzerinden erişim açılmamıştır.

## 6. Yapılan Testler

- [x] Uygulamanın Ubuntu Server üzerinde çalışması kontrol edildi.
- [x] Uygulamaya tarayıcı üzerinden uzaktan erişildi.
- [x] Yeni görev ekleme işlemi test edildi.
- [x] Uygulama verilerinin SQLite veritabanında saklandığı kontrol edildi.
- [x] systemd servisinin çalıştığı doğrulandı.
- [x] Servisin otomatik başlatılması etkinleştirildi.
- [x] Proxmox yönetim arayüzüne Tailscale üzerinden farklı bir ağdan erişildi.

## 7. Öğrenilen Konular

Bu çalışma sırasında aşağıdaki konularda uygulama yapıldı:

- Proxmox ile sanal sunucu yönetimi
- Ubuntu Server üzerinde uygulama çalıştırma
- Linux servislerini systemd ile yönetme
- Servis durumlarını kontrol etme
- SQLite veritabanı kullanımı
- Tailscale ile uzaktan erişim
- GitHub üzerinde teknik dokümantasyon hazırlama

## 8. Güvenlik Notları

- Parolalar ve erişim anahtarları herkese açık depolara eklenmemelidir.
- Sunucu yönetim arayüzleri doğrudan internete açılmamalıdır.
- Uzaktan erişim hesaplarının güvenliği korunmalıdır.
