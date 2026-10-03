'use strict';
// ===== Языки: выбор и перевод строк =====
// Тексты в коде пишутся по-русски и оборачиваются в t('…'); переводы лежат в js/lang-<код>.js (I18N.<код>).
// Данные (названия оружия, героев, уровней…) переводятся там же, при загрузке, — смена языка перезагружает страницу.
// {0}, {1}… в строке — подстановки: t('Ур. {0}', 5)
const LANGS = { ru: 'Русский', en: 'English' };
const LANG = (() => {
  try { const s = JSON.parse(localStorage.getItem('endlesswar_v1')); const l = s && s.settings && s.settings.lang; if (LANGS[l]) return l; } catch (e) { }
  const n = String(navigator.language || 'ru').toLowerCase();       // первый запуск — по языку устройства
  return /^(ru|uk|be|kk)/.test(n) ? 'ru' : 'en';
})();
document.documentElement.lang = LANG;
const I18N = {};
function t(s, ...a) {
  const d = I18N[LANG];
  let r = d && d[s] !== undefined ? d[s] : s;
  if (a.length) r = r.replace(/\{(\d)\}/g, (_, i) => a[i]);
  return r;
}
