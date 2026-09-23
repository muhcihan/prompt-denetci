# ✦ Prompt Denetçisi

**Yazdığın prompt'u göndermeden önce bir kez daha kontrol eden Chrome uzantısı.**

ChatGPT, Claude, Gemini, Perplexity ve Grok'ta çalışır. Yazarken canlı bir netlik göstergesi sunar; `Ctrl+Enter` ile promptunu görev tipine göre iyileştirir, eksik bilgileri işaretler ve göndermeden önce onayına sunar.

Kendi Anthropic API anahtarınla çalışır (BYOK — *Bring Your Own Key*). Hiçbir veri geliştirici sunucusuna gitmez; her istek doğrudan senin hesabından, doğrudan Anthropic'e gider.

---

## Neden bu araç var

Bir sohbete gönderdiğin ilk mesaj, sistemin seni ve ihtiyacını henüz hiç tanımadığı andır. O mesajda unutulan bir detay — hedef kitle, format, teknoloji/versiyon, ton, kapsam — çoğu zaman gereksiz bir geri-dönüş turuna ya da baştan yanlış giden bir cevaba mal olur.

Prompt Denetçisi, bu boşluğu yazım anında yakalamak için var: sen "gönder"e basmadan önce, hâlâ düzeltme fırsatın varken.

---

## Özellikler

**🟢 Canlı Netlik Göstergesi**
Yazarken input kutusunun üstünde beliren küçük bir çubuk, prompt'unun ne kadar net olduğunu anlık gösterir (Net / Geliştirilebilir / Belirsiz). Tamamen yerel hesaplama — API çağrısı yapmaz, ücretsizdir.

**🧠 Görev Tipi Algılama**
`Ctrl+Enter`'a bastığında, prompt'unun türünü (kod yazma, yazılı içerik, analiz, çeviri, tasarım, planlama vb.) tanır ve onay penceresinde rozet olarak gösterir.

**🟨 Eksik Bilgi İşaretleme**
Cevap kalitesini etkileyecek ama belirtilmemiş bilgileri `[köşeli parantez]` ile, sarı vurgulu olarak prompt'un tam ait olduğu yere yerleştirir.

**⚡ Tek Tıkla Takip Soruları**
En kritik eksiklikler için kısa, çoktan seçmeli sorular üretir. Yazmana gerek kalmadan bir seçeneğe tıklarsın, ilgili köşeli parantez otomatik doldurulur.

**📊 Kullanım İstatistikleri**
Toplam istem ve token sayısını gösterir. Tüm veriler yalnızca senin cihazında tutulur.

**🔒 BYOK / Sıfır Sunucu**
Geliştirici hiçbir prompt'unu görmez, hiçbir veri saklanmaz.

## Desteklenen Siteler

| Site | Adres |
|---|---|
| ChatGPT | `chat.openai.com`, `chatgpt.com` |
| Claude | `claude.ai` |
| Gemini | `gemini.google.com` |
| Perplexity | `perplexity.ai` |
| Grok | `grok.com` |

---

## Kurulum

Uzantı şu an Chrome Web Store'da yayında değil; kaynak koddan yükleniyor.

1. Bu repoyu indir (Code → Download ZIP) veya klonla:
   ```bash
   git clone https://github.com/<kullanici-adi>/prompt-denetci.git
   ```
2. Chrome'da `chrome://extensions` adresine git.
3. Sağ üstten **Geliştirici modu**'nu aç.
4. **Paketlenmemiş öğe yükle** butonuna tıkla.
5. İndirdiğin `prompt-denetci` klasörünü seç.
6. Uzantı ikonuna tıkla, Anthropic API anahtarını gir, **Kaydet**'e bas.

> ⚠️ API anahtarını [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) üzerinden alırken mutlaka bir **workspace seçili** olarak oluştur. Workspace'e bağlı olmayan anahtarlar hata verir.

## Kullanım

1. Desteklenen bir sitede promptunu yaz. Üstte beliren çubuk, yazdıkça netliğini gösterir.
2. Normal **Enter** ile gönderirsen hiçbir şey değişmez.
3. **Ctrl+Enter** (Mac'te `Cmd+Enter`) basarsan:
   - Prompt analiz edilir, türü tanınır, eksikler tespit edilir.
   - Onay penceresinde görev tipi rozetini, sarı vurgulu notları ve varsa hızlı soru butonlarını görürsün.
   - Soruları cevapla veya metni elle düzenle.
   - **Gönder** dersen o hâliyle gider; **İptal** dersen hiçbir şey gönderilmez.

## Ayarlar

Uzantı ikonuna tıklayarak API anahtarını, modelini (Haiku/Sonnet), aç-kapa durumunu ve kullanım istatistiklerini yönetebilirsin.

## Maliyet

- Canlı netlik göstergesi → tamamen ücretsiz, yerel hesaplama
- `Ctrl+Enter` ile iyileştirme → kendi Anthropic API anahtarınla ücretlendirilir (Haiku ile istek başına yaklaşık $0.001)

Geliştirici hiçbir sunucu işletmiyor, hiçbir kullanım verisi görmüyor.

## Proje Yapısı

```
prompt-denetci/
├── manifest.json      # Chrome Manifest V3 tanımı
├── background.js      # API çağrısı, sistem promptu, istatistik takibi
├── content.js         # Site tespiti, input yakalama, onay penceresi, canlı gösterge
├── content.css        # Arayüz stilleri
├── popup.html/.js     # Ayarlar arayüzü
└── icons/             # Uzantı ikonları
```

## Bilinen Sınırlamalar

- Site arayüzleri değişebiliyor; bir sitede giriş kutusu bulunamazsa `content.js` içindeki seçici listeleri güncellenmeli.
- API anahtarı `chrome.storage.local` içinde düz metin tutulur — paylaşılan bilgisayarlarda dikkatli kullan.
- İstatistikler yalnızca bulunduğun tarayıcı profilinde tutulur.

## Katkıda Bulunma

Yeni site desteği eklemek, bir seçiciyi düzeltmek veya sistem promptunu iyileştirmek istersen pull request açabilirsin.

## Lisans

MIT
