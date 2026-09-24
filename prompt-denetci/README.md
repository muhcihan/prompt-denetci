# ✦ Prompt Denetçisi

**Yazdığın prompt'u göndermeden önce bir prompt mühendisi gibi ele alan Chrome uzantısı.**

ChatGPT, Claude, Gemini, Perplexity ve Grok'ta çalışır. Yazarken canlı bir netlik göstergesi sunar; `Ctrl+Enter` ile promptunu analiz eder, eksik bilgiler için sana sorular sorar (seçenekli veya serbest cevap), verdiğin cevapları harmanlayarak sıfırdan nihai bir prompt sentezler.

Kendi Anthropic API anahtarınla çalışır (BYOK — *Bring Your Own Key*). Hiçbir veri geliştirici sunucusuna gitmez.

---

## Neden bu araç var

Bir sohbete gönderdiğin ilk mesaj, sistemin seni ve ihtiyacını henüz hiç tanımadığı andır. O mesajda unutulan bir detay — hedef kitle, format, teknoloji/versiyon, ton, kapsam — çoğu zaman gereksiz bir geri-dönüş turuna ya da baştan yanlış giden bir cevaba mal olur.

Prompt Denetçisi, bu boşluğu iki adımda kapatır: önce sana doğru soruları sorar, sonra verdiğin cevapları gerçek bir prompt mühendisi gibi harmanlayıp senin için nihai prompt'u yazar.

---

## Nasıl Çalışır

**1) Yazarken — Canlı Netlik Göstergesi**
Input kutusunun üstünde beliren küçük bir çubuk, prompt'unun ne kadar net olduğunu anlık gösterir. Tamamen yerel hesaplama, API çağrısı yapmaz, ücretsizdir.

**2) `Ctrl+Enter` — Analiz ve Sorular**
Uzantı prompt'unun görev tipini (kod, yazı, analiz, çeviri, tasarım, planlama vb.) tanır ve cevap kalitesini etkileyecek eksik bilgiler için en fazla 4 soru üretir. Her soru için:
- Hazır seçeneklere tıklayabilirsin, **veya**
- Kendi cevabını serbest metin kutusuna yazabilirsin.

**3) "Prompt'u Oluştur" — Sentez**
Verdiğin tüm cevaplar, orijinal isteğinle birlikte tekrar modele gönderilir. Model bunları sadece yan yana eklemez — gerçek bir prompt mühendisinin yapacağı gibi, sıfırdan, yapılandırılmış, eksiksiz bir nihai prompt yazar.

**4) Onay ve Gönderim**
Nihai prompt bir düzenleme kutusunda gösterilir. İstersen elle değiştir, sonra **Gönder**'e bas. **İptal** dersen hiçbir şey gönderilmez.

> Her aşamada **"Değiştirmeden Gönder"** seçeneğiyle süreci atlayıp orijinal prompt'unu olduğu gibi gönderebilirsin.

---

## Özellikler

- 🟢 **Canlı Netlik Göstergesi** — ücretsiz, API'siz, yerel hesaplama
- 🧠 **Görev Tipi Algılama** — kod, yazı, analiz, çeviri, tasarım, planlama vb.
- ❓ **Akıllı Sorular** — hem hazır seçenek hem serbest metin ile cevaplanabilir
- 🔀 **Gerçek Sentez** — cevapların basit birleşimi değil, sıfırdan yeniden yazılmış nihai prompt
- 📊 **Kullanım İstatistikleri** — istem ve token sayacı, tamamen cihazında tutulur
- 🔒 **BYOK / Sıfır Sunucu** — geliştirici hiçbir prompt'unu görmez

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

1. Bu repoyu indir veya klonla:
   ```bash
   git clone https://github.com/<kullanici-adi>/prompt-denetci.git
   ```
2. Chrome'da `chrome://extensions` adresine git.
3. Sağ üstten **Geliştirici modu**'nu aç.
4. **Paketlenmemiş öğe yükle** butonuna tıkla, `prompt-denetci` klasörünü seç.
5. Uzantı ikonuna tıkla, Anthropic API anahtarını gir, **Kaydet**'e bas.

> ⚠️ API anahtarını [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) üzerinden alırken mutlaka bir **workspace seçili** olarak oluştur.

## Maliyet

Bu akış artık **iki API çağrısı** yapıyor (analiz + sentez), önceki tek çağrılı sürüme göre biraz daha fazla token tüketir — yine de Haiku ile istek başına yaklaşık $0.002-0.004 civarındadır. Canlı netlik göstergesi hâlâ tamamen ücretsizdir.

## Proje Yapısı

```
prompt-denetci/
├── manifest.json      # Chrome Manifest V3 tanımı
├── background.js      # İki aşamalı API mantığı: analiz + sentez
├── content.js         # Site tespiti, soru/sentez pencereleri, canlı gösterge
├── content.css        # Arayüz stilleri
├── popup.html/.js     # Ayarlar arayüzü
└── icons/             # Uzantı ikonları
```

## Bilinen Sınırlamalar

- Site arayüzleri değişebiliyor; `content.js` içindeki seçici listeleri gerekirse güncellenmeli.
- API anahtarı `chrome.storage.local` içinde düz metin tutulur.
- İstatistikler yalnızca bulunduğun tarayıcı profilinde tutulur.

## Katkıda Bulunma

Pull request'lere açığız — yeni site desteği, seçici düzeltmeleri, sistem promptu iyileştirmeleri.

## Lisans

MIT
