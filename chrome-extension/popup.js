// ===== State =====
let config = null;
let currentTabInfo = null;
let groups = [];
let saving = false;

// ===== DOM =====
const $ = (id) => document.getElementById(id);
const configScreen = $('configScreen');
const saveScreen = $('saveScreen');

const DEFAULT_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTQiIGZpbGw9IiNmM2Y0ZjYiLz48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIxNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOWNhM2FmIiBzdHJva2Utd2lkdGg9IjIuNSIvPjxwYXRoIGQ9Ik0yMCAyOGgyNE0yMCAzNmgyNCIgc3Ryb2tlPSIjOWNhM2FmIiBzdHJva2Utd2lkdGg9IjIiLz48ZWxsaXBzZSBjeD0iMzIiIGN5PSIzMiIgcng9IjciIHJ5PSIxNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOWNhM2FmIiBzdHJva2Utd2lkdGg9IjEuNSIvPjwvc3ZnPg=='

// ===== Init =====
document.addEventListener('DOMContentLoaded', async () => {
  config = await loadConfig();
  if (config && config.backendUrl && config.token) {
    initSaveScreen();
  } else {
    showConfigScreen();
  }
});

// ===== Storage =====
function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['backendUrl', 'token'], (items) => {
      resolve(items);
    });
  });
}

function saveConfig(backendUrl, token) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ backendUrl, token }, resolve);
  });
}

// ===== API Helper (XMLHttpRequest 更适配扩展环境) =====
function apiPost(path, body, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const url = config.backendUrl.replace(/\/+$/, '') + path;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + config.token);
    xhr.timeout = timeoutMs;

    xhr.ontimeout = () => reject(new Error('请求超时'));
    xhr.onerror = () => reject(new Error('网络错误'));
    xhr.onabort = () => reject(new Error('请求被取消'));

    xhr.onload = function () {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.code === 0) {
          resolve(data.data);
        } else {
          reject(new Error(data.msg || '请求失败 (' + xhr.status + ')'));
        }
      } catch (e) {
        reject(new Error('返回数据格式错误'));
      }
    };

    xhr.send(JSON.stringify(body));
  });
}

// ===== Current Tab =====
function getCurrentTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0] || null);
    });
  });
}

function getFaviconUrl(tab) {
  if (tab && tab.favIconUrl && !tab.favIconUrl.startsWith('chrome://')) {
    return tab.favIconUrl;
  }
  // 无法获取 favicon 时，用 Google 服务兜底
  try {
    const domain = tab && tab.url ? new URL(tab.url).hostname : '';
    if (!domain) return DEFAULT_ICON;
    return 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=64';
  } catch {
    return DEFAULT_ICON;
  }
}

// ===== Screens =====
function showConfigScreen() {
  configScreen.classList.remove('hidden');
  saveScreen.classList.add('hidden');

  if (config) {
    $('backendUrl').value = config.backendUrl || '';
    $('tokenInput').value = config.token || '';
  }
}

function showSaveScreen() {
  configScreen.classList.add('hidden');
  saveScreen.classList.remove('hidden');
}

// ===== Config Screen =====
$('saveConfigBtn').addEventListener('click', async () => {
  const backendUrl = $('backendUrl').value.trim();
  const token = $('tokenInput').value.trim();
  $('configError').classList.add('hidden');
  $('configLoading').classList.remove('hidden');
  $('saveConfigBtn').disabled = true;

  if (!backendUrl) {
    showConfigError('请输入服务器地址');
    return;
  }
  if (!token) {
    showConfigError('请输入访问令牌');
    return;
  }

  // 验证连接（使用 LoginInterceptor 接口确保令牌有效）
  config = { backendUrl, token };
  try {
    await apiPost('/api/user/getInfo', {});
    await saveConfig(backendUrl, token);
    $('configLoading').classList.add('hidden');
    $('saveConfigBtn').disabled = false;
    initSaveScreen();
  } catch (e) {
    showConfigError('连接失败：' + e.message);
  }
});

function showConfigError(msg) {
  $('configLoading').classList.add('hidden');
  $('saveConfigBtn').disabled = false;
  $('configError').textContent = msg;
  $('configError').classList.remove('hidden');
}

// ===== Save Screen =====
async function initSaveScreen() {
  showSaveScreen();
  $('saveBtn').disabled = true;
  hideResult();

  // 获取当前标签页信息
  currentTabInfo = await getCurrentTab();
  if (!currentTabInfo || !currentTabInfo.url || currentTabInfo.url.startsWith('chrome://') || currentTabInfo.url.startsWith('chrome-extension://') || currentTabInfo.url.startsWith('about:')) {
    $('pageUrlDisplay').textContent = '无法获取当前页面信息，请在普通网页中使用';
    $('saveBtn').disabled = true;
    return;
  }

  $('titleInput').value = currentTabInfo.title || '';
  $('urlInput').value = currentTabInfo.url || '';

  // 加载分组（loadGroups 内部会控制按钮状态）
  await loadGroups($('typeSelect').value);
}

// 分类切换 → 重新加载分组
$('typeSelect').addEventListener('change', async () => {
  $('saveBtn').disabled = true;
  hideResult();
  $('groupSelect').innerHTML = '<option value="">加载中...</option>';
  await loadGroups($('typeSelect').value);
  // loadGroups 内部控制按钮状态，这里不重置
});

async function loadGroups(groupType) {
  $('groupError').classList.add('hidden');
  const select = $('groupSelect');

  try {
    const result = await apiPost('/api/panel/itemIconGroup/getList', { groupType });
    groups = (result && result.list) || [];
    select.innerHTML = '';
    if (groups.length === 0) {
      select.innerHTML = '<option value="">暂无分组，请在面板中创建</option>';
      $('saveBtn').disabled = true;
      return;
    }
    for (const g of groups) {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = g.title || ('分组 #' + g.id);
      select.appendChild(opt);
    }
    $('saveBtn').disabled = false;
  } catch (e) {
    select.innerHTML = '<option value="">加载失败</option>';
    $('groupError').textContent = '加载分组失败：' + e.message;
    $('groupError').classList.remove('hidden');
    $('saveBtn').disabled = true;
  }
}

// ===== 修改服务器配置 =====
$('settingsBtn').addEventListener('click', () => {
  showConfigScreen();
});

// ===== 去除 URL 后缀 =====
$('stripSuffixBtn').addEventListener('click', () => {
  const input = $('urlInput');
  try {
    const url = new URL(input.value.trim());
    input.value = url.origin;
  } catch {
    // URL 无效时不操作
  }
});

// ===== 保存 =====
$('saveBtn').addEventListener('click', async () => {
  if (saving) return;

  const groupId = parseInt($('groupSelect').value);
  if (!groupId) {
    showResult('请选择一个分组', 'error');
    return;
  }

  const title = $('titleInput').value.trim();
  if (!title) {
    showResult('请输入标题', 'error');
    return;
  }

  saving = true;
  $('saveBtn').disabled = true;
  showLoading('保存中...');
  hideResult();

  try {
    const tab = currentTabInfo;

    const iconSrc = getFaviconUrl(tab);

    const finalUrl = $('urlInput').value.trim();
    if (!finalUrl) {
      throw new Error('请输入网址');
    }

    await apiPost('/api/panel/itemIcon/edit', {
      title: title,
      url: finalUrl,
      description: $('remarkInput').value.trim(),
      itemIconGroupId: groupId,
      openMethod: 2,
      icon: {
        itemType: 2,
        src: iconSrc,
      },
    });
    hideLoading();
    showResult('✅ 保存成功！', 'success');
    setTimeout(() => window.close(), 1500);
  } catch (e) {
    hideLoading();
    showResult('❌ 保存失败：' + (e.message || '未知错误'), 'error');
  } finally {
    saving = false;
    $('saveBtn').disabled = false;
  }
});

// ===== UI Helpers =====
function showResult(text, type) {
  const el = $('saveResult');
  el.textContent = text;
  el.className = 'msg msg-' + type;
  el.classList.remove('hidden');
}

function hideResult() {
  $('saveResult').classList.add('hidden');
}

function showLoading(text) {
  $('loadingBar').classList.remove('hidden');
  if (text) $('loadingText').textContent = text;
}

function hideLoading() {
  $('loadingBar').classList.add('hidden');
}
