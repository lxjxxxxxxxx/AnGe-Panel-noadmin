// Options page - 加载/保存配置
document.addEventListener('DOMContentLoaded', async () => {
  const items = await new Promise((resolve) => {
    chrome.storage.sync.get(['backendUrl', 'token'], resolve);
  });
  document.getElementById('optBackendUrl').value = items.backendUrl || '';
  document.getElementById('optTokenInput').value = items.token || '';
});

document.getElementById('optSaveBtn').addEventListener('click', async () => {
  const backendUrl = document.getElementById('optBackendUrl').value.trim();
  const token = document.getElementById('optTokenInput').value.trim();
  const result = document.getElementById('optResult');

  if (!backendUrl || !token) {
    result.textContent = '请填写完整信息';
    result.className = 'msg msg-error';
    result.classList.remove('hidden');
    return;
  }

  await new Promise((resolve) => {
    chrome.storage.sync.set({ backendUrl, token }, resolve);
  });

  result.textContent = '✅ 配置已保存';
  result.className = 'msg msg-success';
  result.classList.remove('hidden');
});
