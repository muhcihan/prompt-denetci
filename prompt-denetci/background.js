// ============================================================
// AŞAMA 1: Analiz — görev tipini tanı, eksik bilgiler için sorular üret
// ============================================================
const ANALYZE_SYSTEM_PROMPT = `Sen deneyimli bir prompt mühendisisin. Kullanıcının yapay zekaya vereceği İLK
mesajı analiz ediyorsun — yani sistemin kullanıcıyı, ihtiyacını ve bağlamı henüz hiç tanımadığı an.

Görevin, prompt'u DEĞİL, önce SADECE şunu belirlemek:
1. Bu görev hangi kategoriye giriyor (kod yazma, yazılı içerik, analiz/araştırma, çeviri, tasarım/görsel,
   veri/tablo, planlama, genel soru-cevap, diğer)?
2. En iyi cevabı üretebilmek için hangi bilgiler eksik? (hedef kitle, ton, uzunluk, format, teknoloji/versiyon,
   bütçe, zaman aralığı, kısıtlar, bağlam gibi — göreve göre değişir)

Bu eksiklikler için en fazla 4 soru üret. Her soru:
- Kısa ve net olmalı.
- 2-4 kısa seçenek içermeli (kullanıcı tek tıkla seçebilsin).
- Kullanıcı isterse serbest metinle de cevaplayabilir (bunu ayrıca belirtmene gerek yok, arayüz zaten sağlıyor).

Sadece cevap kalitesini GERÇEKTEN etkileyecek soruları sor. Prompt zaten yeterince netse, az soru sor
veya hiç sorma (boş liste dön).

Kullanıcının kullandığı dili tespit et ve sorularını o dilde yaz (Türkçe ise Türkçe, İngilizce ise İngilizce).

ÇIKTI FORMATI — SADECE aşağıdaki JSON şemasına uyan, başka hiçbir şey içermeyen ham JSON döndür.
Açıklama, markdown code fence, giriş cümlesi EKLEME:

{
  "task_type": "kod yazma" | "yazılı içerik" | "analiz/araştırma" | "çeviri" | "tasarım/görsel" | "veri/tablo" | "planlama" | "genel soru-cevap" | "diğer",
  "questions": [
    { "id": "q1", "question": "kısa soru metni", "options": ["seçenek1", "seçenek2", "seçenek3"] }
  ]
}`;

// ============================================================
// AŞAMA 2: Sentez — orijinal istek + kullanıcı cevapları → nihai prompt
// ============================================================
const SYNTHESIZE_SYSTEM_PROMPT = `Sen deneyimli bir prompt mühendisisin. Sana kullanıcının orijinal, ham isteği
ve bu isteği netleştirmek için sorduğun sorulara kullanıcının verdiği cevaplar veriliyor.

Görevin: Bunların hepsini harmanlayarak, SIFIRDAN, profesyonel bir prompt mühendisinin yazacağı kalitede,
eksiksiz ve net bir prompt üretmek. Bu sadece orijinal cümleye ekleme yapmak değil — orijinal niyeti ve
kullanıcının verdiği tüm cevapları gerçek bir ihtiyaç analizi gibi değerlendirip, en iyi sonucu alacak
şekilde YENİDEN YAPILANDIRILMIŞ bir prompt yazmak.

Kurallar:
- Kullanıcının asıl niyetini koru, asla değiştirme.
- Kullanıcının verdiği her cevabı prompt'un içine anlamlı şekilde yerleştir.
- Cevaplanmamış (boş bırakılmış) sorular varsa, o konuda makul ve yaygın bir varsayımla doldur; kullanıcıyı
  tekrar soru sormakla uğraştırma.
- Görev tipine uygun yapısal talimatlar ekle (örn. kod için "yorum satırlı, çalışır kod" beklentisi;
  yazı için ton/uzunluk çerçevesi; analiz için derinlik/kaynak beklentisi).
- Gereksiz nezaket kelimeleri ekleme, doğrudan ve profesyonelce yaz.
- Kullanıcının kullandığı dili koru.
- Prompt iyi organize olsun: gerekiyorsa kısa paragraflar veya madde işaretleri kullanabilirsin, ama
  abartma — hâlâ doğal bir prompt gibi okunmalı, form doldurma gibi değil.

ÇIKTI FORMATI — SADECE aşağıdaki JSON şemasına uyan, başka hiçbir şey içermeyen ham JSON döndür:

{
  "final_prompt": "sentezlenmiş, nihai, eksiksiz prompt metni"
}`;

async function callClaude(systemPrompt, userContent, apiKey, model) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userContent }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    if (errText.includes('not scoped to a workspace')) {
      throw new Error('Bu API anahtarı bir workspace\'e bağlı değil. console.anthropic.com/settings/keys üzerinden, workspace seçili şekilde YENİ bir anahtar oluşturup onu kullan.');
    }
    if (response.status === 401) {
      throw new Error('API anahtarı geçersiz. Ayarlardan doğru anahtarı girdiğinden emin ol.');
    }
    if (response.status === 429) {
      throw new Error('API kullanım limitine ulaşıldı. Birkaç dakika sonra tekrar dene.');
    }
    throw new Error(`API hatası (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const textBlock = data.content.find(b => b.type === 'text');
  if (!textBlock) throw new Error('Model metin döndürmedi.');

  const usage = data.usage || {};
  let parsed = null;
  try {
    const cleaned = textBlock.text.trim().replace(/^```json\s*|^```\s*|```\s*$/g, '');
    parsed = JSON.parse(cleaned);
  } catch (e) {
    parsed = null;
  }

  return {
    parsed,
    rawText: textBlock.text.trim(),
    inputTokens: usage.input_tokens || 0,
    outputTokens: usage.output_tokens || 0
  };
}

async function analyzePrompt(rawPrompt, apiKey, model) {
  const result = await callClaude(ANALYZE_SYSTEM_PROMPT, rawPrompt, apiKey, model);
  const parsed = result.parsed || { task_type: 'diğer', questions: [] };
  return {
    taskType: parsed.task_type || 'diğer',
    questions: Array.isArray(parsed.questions) ? parsed.questions : [],
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens
  };
}

async function synthesizePrompt(originalPrompt, answers, apiKey, model) {
  // answers: [{ question, answer }]
  const answersText = answers
    .filter(a => a.answer && a.answer.trim())
    .map(a => `- Soru: ${a.question}\n  Cevap: ${a.answer.trim()}`)
    .join('\n');

  const userContent = `Orijinal istek: "${originalPrompt}"

Kullanıcının verdiği ek bilgiler:
${answersText || '(kullanıcı ek bilgi vermedi, makul varsayımlarla tamamla)'}

Bu bilgileri harmanlayarak nihai prompt'u oluştur.`;

  const result = await callClaude(SYNTHESIZE_SYSTEM_PROMPT, userContent, apiKey, model);
  const parsed = result.parsed || { final_prompt: result.rawText };
  return {
    finalPrompt: parsed.final_prompt || result.rawText,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens
  };
}

async function recordUsage(inputTokens, outputTokens) {
  const data = await chrome.storage.local.get(['stats']);
  const stats = data.stats || { totalRequests: 0, totalInputTokens: 0, totalOutputTokens: 0 };
  stats.totalRequests += 1;
  stats.totalInputTokens += inputTokens;
  stats.totalOutputTokens += outputTokens;
  await chrome.storage.local.set({ stats });
  return stats;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Aşama 1: Analiz et, soruları üret
  if (message.type === 'ANALYZE_PROMPT') {
    chrome.storage.local.get(['apiKey', 'model'], async (data) => {
      if (!data.apiKey) {
        sendResponse({ ok: false, error: 'API anahtarı ayarlanmamış. Uzantı ikonuna tıklayıp ayarlardan gir.' });
        return;
      }
      try {
        const result = await analyzePrompt(message.text, data.apiKey, data.model);
        const stats = await recordUsage(result.inputTokens, result.outputTokens);
        sendResponse({
          ok: true,
          taskType: result.taskType,
          questions: result.questions,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          stats
        });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
    });
    return true;
  }

  // Aşama 2: Sentezle, nihai prompt'u üret
  if (message.type === 'SYNTHESIZE_PROMPT') {
    chrome.storage.local.get(['apiKey', 'model'], async (data) => {
      if (!data.apiKey) {
        sendResponse({ ok: false, error: 'API anahtarı ayarlanmamış.' });
        return;
      }
      try {
        const result = await synthesizePrompt(message.originalPrompt, message.answers, data.apiKey, data.model);
        const stats = await recordUsage(result.inputTokens, result.outputTokens);
        sendResponse({
          ok: true,
          finalPrompt: result.finalPrompt,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          stats
        });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
    });
    return true;
  }

  if (message.type === 'GET_STATS') {
    chrome.storage.local.get(['stats'], (data) => {
      sendResponse({ ok: true, stats: data.stats || { totalRequests: 0, totalInputTokens: 0, totalOutputTokens: 0 } });
    });
    return true;
  }

  if (message.type === 'RESET_STATS') {
    chrome.storage.local.set({ stats: { totalRequests: 0, totalInputTokens: 0, totalOutputTokens: 0 } }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
