const apiKeyInput = document.getElementById('apiKey');
const modelSelect = document.getElementById('modelSelect');
const enabledToggle = document.getElementById('enabledToggle');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');
const statRequests = document.getElementById('statRequests');
const statTokens = document.getElementById('statTokens');
const resetStatsBtn = document.getElementById('resetStatsBtn');

function formatNumber(n) {
  return new Intl.NumberFormat('tr-TR').format(n || 0);
}

function loadStats() {
  chrome.runtime.sendMessage({ type: 'GET_STATS' }, (response) => {
    if (response && response.ok) {
      const s = response.stats;
      statRequests.textContent = formatNumber(s.totalRequests);
      statTokens.textContent = formatNumber((s.totalInputTokens || 0) + (s.totalOutputTokens || 0));
    }
  });
}

// Ayarları yükle
chrome.storage.local.get(['apiKey', 'model', 'enabled'], (data) => {
  if (data.apiKey) apiKeyInput.value = data.apiKey;
  if (data.model) modelSelect.value = data.model;
  enabledToggle.checked = data.enabled !== false; // varsayılan: açık
});

loadStats();

saveBtn.addEventListener('click', () => {
  const apiKey = apiKeyInput.value.trim();
  const model = modelSelect.value;
  const enabled = enabledToggle.checked;

  chrome.storage.local.set({ apiKey, model, enabled }, () => {
    status.textContent = '✓ Kaydedildi';
    setTimeout(() => { status.textContent = ''; }, 2000);
  });
});

enabledToggle.addEventListener('change', () => {
  chrome.storage.local.set({ enabled: enabledToggle.checked });
});

resetStatsBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'RESET_STATS' }, (response) => {
    if (response && response.ok) {
      loadStats();
    }
  });
});
