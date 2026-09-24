(function () {
  'use strict';

  let isProcessing = false;

  // --- Site bazlı seçiciler ---
  const INPUT_SELECTORS = [
    '#prompt-textarea',
    'div[contenteditable="true"][data-testid*="chat" i]',
    'div.ProseMirror[contenteditable="true"]',
    'rich-textarea div[contenteditable="true"]',
    'textarea[placeholder*="Ask" i]',
    'textarea[data-testid="tweetTextarea_0"]',
    'form textarea',
    'div[contenteditable="true"]'
  ];

  const SEND_BUTTON_SELECTORS = [
    'button[data-testid="send-button"]',
    'button[aria-label*="Send" i]',
    'button[aria-label*="Gönder" i]',
    'button[aria-label*="Submit" i]',
    'button[type="submit"]'
  ];

  function findInputElement() {
    for (const sel of INPUT_SELECTORS) {
      const el = document.querySelector(sel);
      if (el && isVisible(el)) return el;
    }
    return null;
  }

  function findSendButton() {
    for (const sel of SEND_BUTTON_SELECTORS) {
      const el = document.querySelector(sel);
      if (el && isVisible(el) && !el.disabled) return el;
    }
    return null;
  }

  function isVisible(el) {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getText(el) {
    if (!el) return '';
    if (el.tagName === 'TEXTAREA') return el.value;
    return el.innerText || el.textContent || '';
  }

  function setText(el, text) {
    if (!el) return;
    if (el.tagName === 'TEXTAREA') {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(el, text);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      el.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, text);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function submitForm(inputEl) {
    const sendBtn = findSendButton();
    if (sendBtn) {
      sendBtn.click();
      return;
    }
    inputEl.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true
    }));
  }

  function showToast(message, type = 'info') {
    let toast = document.getElementById('pd-toast');
    if (toast) toast.remove();
    toast = document.createElement('div');
    toast.id = 'pd-toast';
    toast.className = `pd-toast pd-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('pd-toast-visible'));
    setTimeout(() => {
      toast.classList.remove('pd-toast-visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function formatNumber(n) {
    return new Intl.NumberFormat('tr-TR').format(n);
  }

  // ================= Canlı Belirsizlik Skoru (kural tabanlı, API çağrısı yok) =================
  const VAGUE_WORDS = [
    'bir şey', 'bişey', 'güzel', 'iyi bir', 'yardım et', 'yap bana', 'nasıl yapılır',
    'anlat', 'bilgi ver', 'şey', 'falan', 'filan'
  ];

  function computeVaguenessScore(text) {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    let score = 0;
    if (wordCount < 4) score += 45;
    else if (wordCount < 8) score += 25;
    else if (wordCount < 15) score += 10;
    const lower = trimmed.toLowerCase();
    let vagueHits = 0;
    for (const w of VAGUE_WORDS) if (lower.includes(w)) vagueHits++;
    score += Math.min(vagueHits * 12, 30);
    const hasSpecificMarkers = /\d|https?:\/\/|\.js|\.py|python|javascript|react|excel|word|pdf/i.test(trimmed);
    if (!hasSpecificMarkers && wordCount < 20) score += 10;
    if (wordCount >= 20) score = Math.max(score - 15, 0);
    return Math.max(0, Math.min(100, score));
  }

  function getVaguenessLabel(score) {
    if (score === null) return { label: '', className: '' };
    if (score >= 55) return { label: 'Belirsiz', className: 'pd-vague-high' };
    if (score >= 25) return { label: 'Geliştirilebilir', className: 'pd-vague-mid' };
    return { label: 'Net', className: 'pd-vague-low' };
  }

  function ensureVaguenessBadge() {
    let badge = document.getElementById('pd-vague-badge');
    if (badge) return badge;
    badge = document.createElement('div');
    badge.id = 'pd-vague-badge';
    badge.className = 'pd-vague-badge';
    badge.innerHTML = `
      <div class="pd-vague-bar-track"><div class="pd-vague-bar-fill" id="pd-vague-fill"></div></div>
      <span class="pd-vague-text" id="pd-vague-text"></span>
    `;
    document.body.appendChild(badge);
    return badge;
  }

  function positionBadgeNearInput(badge, inputEl) {
    const rect = inputEl.getBoundingClientRect();
    badge.style.position = 'fixed';
    badge.style.left = `${rect.left}px`;
    badge.style.top = `${Math.max(rect.top - 34, 8)}px`;
    badge.style.width = `${Math.min(rect.width, 260)}px`;
  }

  function updateVaguenessIndicator() {
    const inputEl = findInputElement();
    const badge = document.getElementById('pd-vague-badge');
    if (!inputEl) { if (badge) badge.style.display = 'none'; return; }
    const text = getText(inputEl).trim();
    if (!text) { if (badge) badge.style.display = 'none'; return; }
    const score = computeVaguenessScore(text);
    const { label, className } = getVaguenessLabel(score);
    const el = ensureVaguenessBadge();
    positionBadgeNearInput(el, inputEl);
    el.style.display = 'flex';
    el.className = `pd-vague-badge ${className}`;
    const fill = document.getElementById('pd-vague-fill');
    const textEl = document.getElementById('pd-vague-text');
    if (fill) fill.style.width = `${score}%`;
    if (textEl) textEl.textContent = label;
  }

  let debounceTimer = null;
  document.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateVaguenessIndicator, 150);
  }, true);
  window.addEventListener('scroll', updateVaguenessIndicator, true);
  window.addEventListener('resize', updateVaguenessIndicator);
  chrome.storage.local.get(['enabled'], (data) => {
    if (data.enabled !== false) setInterval(updateVaguenessIndicator, 1500);
  });

  const TASK_TYPE_LABELS = {
    'kod yazma': '💻 Kod',
    'yazılı içerik': '✍️ Yazı',
    'analiz/araştırma': '🔍 Analiz',
    'çeviri': '🌐 Çeviri',
    'tasarım/görsel': '🎨 Tasarım',
    'veri/tablo': '📊 Veri',
    'planlama': '🗓️ Planlama',
    'genel soru-cevap': '💬 Soru-Cevap',
    'diğer': '✦ Genel'
  };

  function closeModal() {
    const existing = document.getElementById('pd-modal-overlay');
    if (existing) existing.remove();
  }

  function buildModalShell(taskLabel, subtitleText) {
    const overlay = document.createElement('div');
    overlay.id = 'pd-modal-overlay';
    overlay.className = 'pd-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'pd-modal';

    const header = document.createElement('div');
    header.className = 'pd-modal-header';

    const headerLeft = document.createElement('div');
    headerLeft.className = 'pd-modal-header-left';
    const icon = document.createElement('div');
    icon.className = 'pd-modal-icon';
    icon.textContent = '✦';
    const titleWrap = document.createElement('div');
    const titleRow = document.createElement('div');
    titleRow.style.display = 'flex';
    titleRow.style.alignItems = 'center';
    titleRow.style.gap = '8px';
    const title = document.createElement('div');
    title.className = 'pd-modal-title';
    title.textContent = 'Prompt Denetçisi';
    if (taskLabel) {
      const taskBadge = document.createElement('span');
      taskBadge.className = 'pd-task-badge';
      taskBadge.textContent = taskLabel;
      titleRow.appendChild(title);
      titleRow.appendChild(taskBadge);
    } else {
      titleRow.appendChild(title);
    }
    const subtitle = document.createElement('div');
    subtitle.className = 'pd-modal-subtitle';
    subtitle.textContent = subtitleText;
    titleWrap.appendChild(titleRow);
    titleWrap.appendChild(subtitle);
    headerLeft.appendChild(icon);
    headerLeft.appendChild(titleWrap);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'pd-modal-close';
    closeBtn.textContent = '✕';
    closeBtn.onclick = () => { closeModal(); };

    header.appendChild(headerLeft);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    const escHandler = (e) => {
      if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);

    return { overlay, modal };
  }

  // ============================================================
  // AŞAMA 1 penceresi: Sorular (seçenek + serbest metin birlikte)
  // ============================================================
  function showQuestionsModal(originalPrompt, taskType, questions, onSynthesize, onSkip) {
    closeModal();
    const taskLabel = TASK_TYPE_LABELS[taskType] || TASK_TYPE_LABELS['diğer'];
    const { modal } = buildModalShell(
      taskLabel,
      questions.length > 0
        ? `${questions.length} soruyu cevapla, en iyi prompt'u birlikte oluşturalım`
        : 'Prompt zaten net görünüyor'
    );

    const body = document.createElement('div');
    body.className = 'pd-editor-wrap';

    const answerState = {}; // id -> answer text

    if (questions.length === 0) {
      const noQ = document.createElement('div');
      noQ.className = 'pd-bracket-notice';
      noQ.textContent = 'Ek bilgiye gerek görülmedi. İstersen doğrudan devam edebilirsin.';
      body.appendChild(noQ);
    } else {
      questions.forEach((q) => {
        answerState[q.id] = '';

        const qBlock = document.createElement('div');
        qBlock.className = 'pd-question-card';

        const qText = document.createElement('div');
        qText.className = 'pd-question-text';
        qText.textContent = q.question;
        qBlock.appendChild(qText);

        const optRow = document.createElement('div');
        optRow.className = 'pd-question-options';

        (q.options || []).forEach((opt) => {
          const optBtn = document.createElement('button');
          optBtn.className = 'pd-option-btn';
          optBtn.textContent = opt;
          optBtn.onclick = () => {
            answerState[q.id] = opt;
            optRow.querySelectorAll('.pd-option-btn').forEach(b => b.classList.remove('pd-option-selected'));
            optBtn.classList.add('pd-option-selected');
            freeInput.value = opt;
          };
          optRow.appendChild(optBtn);
        });

        qBlock.appendChild(optRow);

        const freeInput = document.createElement('input');
        freeInput.type = 'text';
        freeInput.className = 'pd-free-input';
        freeInput.placeholder = 'ya da kendi cevabını yaz...';
        freeInput.addEventListener('input', () => {
          answerState[q.id] = freeInput.value;
          optRow.querySelectorAll('.pd-option-btn').forEach(b => {
            if (b.textContent !== freeInput.value) b.classList.remove('pd-option-selected');
          });
        });
        qBlock.appendChild(freeInput);

        body.appendChild(qBlock);
      });
    }

    modal.appendChild(body);

    const btnRow = document.createElement('div');
    btnRow.className = 'pd-modal-btn-row';

    const skipBtn = document.createElement('button');
    skipBtn.className = 'pd-btn pd-btn-cancel';
    skipBtn.textContent = 'Değiştirmeden Gönder';
    skipBtn.onclick = () => { closeModal(); onSkip(); };

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'pd-btn pd-btn-confirm';
    confirmBtn.textContent = questions.length > 0 ? 'Prompt\'u Oluştur' : 'Devam Et';
    confirmBtn.onclick = () => {
      const answers = questions.map(q => ({ question: q.question, answer: answerState[q.id] || '' }));
      onSynthesize(answers);
    };

    btnRow.appendChild(skipBtn);
    btnRow.appendChild(confirmBtn);
    modal.appendChild(btnRow);
  }

  // ============================================================
  // AŞAMA 2 penceresi: Sentezlenmiş nihai prompt, düzenlenebilir
  // ============================================================
  function showFinalPromptModal(finalPrompt, statsInfo, onConfirm, onCancel) {
    closeModal();
    const { modal } = buildModalShell(null, 'Nihai prompt hazır — düzenleyebilir, sonra gönderebilirsin');

    const editorWrap = document.createElement('div');
    editorWrap.className = 'pd-editor-wrap';

    const editor = document.createElement('textarea');
    editor.className = 'pd-modal-textarea';
    editor.value = finalPrompt;

    editorWrap.appendChild(editor);
    modal.appendChild(editorWrap);

    const statsBar = document.createElement('div');
    statsBar.className = 'pd-stats-bar';
    statsBar.innerHTML = `
      <div class="pd-stat"><span class="pd-stat-label">Bu oturum</span><span class="pd-stat-value">${formatNumber(statsInfo.sessionTokens)} token</span></div>
      <div class="pd-stat-sep"></div>
      <div class="pd-stat"><span class="pd-stat-label">Toplam istem</span><span class="pd-stat-value">${formatNumber(statsInfo.totalRequests)}</span></div>
      <div class="pd-stat-sep"></div>
      <div class="pd-stat"><span class="pd-stat-label">Toplam token</span><span class="pd-stat-value">${formatNumber(statsInfo.totalTokens)}</span></div>
    `;
    modal.appendChild(statsBar);

    const btnRow = document.createElement('div');
    btnRow.className = 'pd-modal-btn-row';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'pd-btn pd-btn-cancel';
    cancelBtn.textContent = 'İptal';
    cancelBtn.onclick = () => { closeModal(); onCancel(); };

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'pd-btn pd-btn-confirm';
    confirmBtn.textContent = 'Gönder';
    confirmBtn.onclick = () => {
      const text = editor.value;
      closeModal();
      onConfirm(text);
    };

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(confirmBtn);
    modal.appendChild(btnRow);

    editor.focus();
  }

  function showLoadingModal(message) {
    closeModal();
    const { modal } = buildModalShell(null, '');
    const loading = document.createElement('div');
    loading.className = 'pd-loading-wrap';
    loading.innerHTML = `<div class="pd-spinner"></div><div class="pd-loading-text">${message}</div>`;
    modal.appendChild(loading);
  }

  // ============================================================
  // Ana akış
  // ============================================================
  async function handleCtrlEnter(inputEl) {
    if (isProcessing) return;
    const rawText = getText(inputEl).trim();
    if (!rawText) return;

    isProcessing = true;
    let sessionTokens = 0;

    showLoadingModal('Prompt analiz ediliyor...');

    chrome.runtime.sendMessage({ type: 'ANALYZE_PROMPT', text: rawText }, (response) => {
      if (!response) {
        isProcessing = false;
        closeModal();
        showToast('Uzantı ile bağlantı kurulamadı.', 'error');
        return;
      }
      if (!response.ok) {
        isProcessing = false;
        closeModal();
        showToast('Hata: ' + response.error, 'error');
        return;
      }

      sessionTokens += (response.inputTokens || 0) + (response.outputTokens || 0);
      const stats = response.stats || {};

      showQuestionsModal(
        rawText,
        response.taskType,
        response.questions || [],
        (answers) => {
          // Sentezle
          showLoadingModal('Cevapların harmanlanıp nihai prompt oluşturuluyor...');
          chrome.runtime.sendMessage(
            { type: 'SYNTHESIZE_PROMPT', originalPrompt: rawText, answers },
            (synthResponse) => {
              isProcessing = false;
              if (!synthResponse || !synthResponse.ok) {
                closeModal();
                showToast('Hata: ' + (synthResponse ? synthResponse.error : 'bağlantı kurulamadı'), 'error');
                return;
              }
              sessionTokens += (synthResponse.inputTokens || 0) + (synthResponse.outputTokens || 0);
              const finalStats = synthResponse.stats || {};
              showFinalPromptModal(
                synthResponse.finalPrompt,
                {
                  sessionTokens,
                  totalRequests: finalStats.totalRequests || 0,
                  totalTokens: (finalStats.totalInputTokens || 0) + (finalStats.totalOutputTokens || 0)
                },
                (finalText) => {
                  setText(inputEl, finalText);
                  setTimeout(() => submitForm(inputEl), 150);
                },
                () => { showToast('İptal edildi', 'info'); }
              );
            }
          );
        },
        () => {
          // Değiştirmeden gönder
          isProcessing = false;
          submitForm(inputEl);
        }
      );
    });
  }

  function onKeyDown(e) {
    const isCtrlEnter = (e.ctrlKey || e.metaKey) && e.key === 'Enter';
    if (!isCtrlEnter) return;

    const inputEl = findInputElement();
    if (!inputEl) return;

    e.preventDefault();
    e.stopPropagation();

    chrome.storage.local.get(['enabled'], (data) => {
      if (data.enabled === false) {
        submitForm(inputEl);
        return;
      }
      handleCtrlEnter(inputEl);
    });
  }

  document.addEventListener('keydown', onKeyDown, true);

  console.log('[Prompt Denetçisi] Aktif. Ctrl+Enter ile promptunu kontrol ettir.');
})();
