import {resolveMediaSource} from './media-utils.js';

const DATA_URL = './data/site-data.json';
const FORMS_ENRICHED_URL = './data/forms.enriched.json';
const LOCATIONS_URL = './data/locations.json';
const PAGE_PARAMS = new URLSearchParams(window.location.search);
const IS_PREVIEW_SHELL = PAGE_PARAMS.get('preview-shell') === '1';
const IDLE_TIMEOUT_MS = 180;
const MEDIA_LOAD_TIMEOUT_MS = 4500;
const PREVIEW_FAILURE_TTL_MS = 10000;
const GDRIVE_TIMEOUT_MS = 12000;
const STORAGE = {
  language: 'opendental-directory-language',
  activeForm: 'opendental-directory-active-form',
  theme: 'opendental-directory-theme',
  location: 'opendental-directory-location',
};

const THEME_COLORS = {
  light: '#f4efe8',
  dark: '#0e141b',
};

const THEME_MEDIA =
  typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

const LANGUAGE_SHORT = {
  en: 'EN',
  ko: 'KR',
};

const PREVIEW_BLOCK_REMOVAL_PATTERNS = [
  /Patient Name/i,
  /Date of Birth/i,
  /Chart #/i,
  /Treating Dentist/i,
  /Tooth \/ Area/i,
  /Date of Procedure/i,
  /Patient Signature/i,
  /Guardian\/Representative/i,
  /Dentist Signature/i,
  /Confirmation of Explanation/i,
  /이 양식은 Health Professions/i,
];

const I18N = {
  en: {
    sidebarEyebrow: 'Forms',
    sidebarTitle: 'Form library',
    sidebarSectionLabel: 'Suggest Consent',
    navDashboard: 'Dashboard',
    navPractice: 'Practice',
    navForms: 'Consent Forms',
    sidebarBody: '',
    statusLabel: 'Sync',
    countLabel: 'Total',
    visibleLabel: 'Visible',
    formListTitle: 'Active forms',
    locationLabel: 'Location',
    languageLabel: 'Language',
    themeLabel: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    emptyEyebrow: 'Directory ready',
    emptyTitle: 'Select a form to begin',
    emptyBody:
      'The workspace will show the document preview and any linked training videos.',
    detailEyebrow: 'Smile Well',
    detailTitle: 'SMILE WELL DENTAL CONSENT FORMS',
    selectedFormLabel: 'Selected form',
    tabForm: 'Form',
    tabYouTube: 'YouTube',
    tabDrive: 'Drive',
    signTabAction: 'Sign Form',
    signTabMeta: 'OpenDental web form',
    signPanelEyebrow: 'Patient Signature',
    signPanelTitle: 'Ready to complete this consent?',
    signDocumentAction: 'Sign Form',
    signDocumentBody: 'Open the official OpenDental web form in a new tab so the patient can review and sign directly.',
    documentPreview: 'Document preview',
    signForm: 'Live sign form',
    signFormBody: 'OpenDental remains available below when the embedded preview is supported.',
    previewUnavailable: 'This source may block embedding. Use the open action if the frame stays blank.',
    noDataTitle: 'No directory data loaded',
    noDataBody: 'Run the sync script to generate data/site-data.json, then reload the page.',
    httpRequiredTitle: 'Server required',
    httpRequiredBody: 'Open this site through the local HTTP server, not as a file.',
    noFormSelected: 'Select a form to begin.',
    noDocumentPreview: 'No document preview is available for this form yet.',
    noVideoTitle: 'No training links yet',
    noVideoBody: 'Add YouTube or Drive videos for this form to show them here.',
    loading: 'Loading site data...',
    loadingPreview: 'Loading form preview...',
    loadingMediaTitle: 'Loading media',
    loadingMediaBody: 'If the embedded player does not appear, open this resource in a new tab.',
    previewLoadFailedTitle: 'Preview failed to load',
    previewLoadFailedBody: 'The preview source could not be loaded right now. Reload the page or verify the preview JSON asset for this form.',
    mediaTimeoutTitle: 'Embedded media is taking too long',
    mediaTimeoutBody: 'This provider may be blocking the embedded player. Open the resource in a new tab if the player does not appear.',
    imported: 'Ready',
    linkOnly: 'Preview only',
    openVideo: 'Open video',
    openLink: 'Open link',
    formUnavailable: 'Form link unavailable',
    mediaInvalidTitle: 'Unable to load this resource',
    mediaInvalidBody: 'The link for this resource could not be converted to an embeddable URL. Try opening it directly.',
    lastSyncLabel: 'Synced',
    previewReady: 'Preview ready',
    formReady: 'Form ready',
    languageNames: {en: 'English', ko: '한국어'},
  },
  ko: {
    sidebarEyebrow: '양식',
    sidebarTitle: 'Form library',
    sidebarSectionLabel: '추천 동의서',
    navDashboard: '대시보드',
    navPractice: '진료',
    navForms: '동의서',
    sidebarBody: '',
    statusLabel: '동기화',
    countLabel: '전체',
    visibleLabel: '표시',
    formListTitle: '활성 양식',
    locationLabel: '지점',
    languageLabel: '언어',
    themeLabel: '테마',
    themeLight: '라이트',
    themeDark: '다크',
    emptyEyebrow: '디렉터리 준비됨',
    emptyTitle: '양식을 선택해 시작하세요',
    emptyBody: '오른쪽 작업 공간에는 문서 미리보기와 관련 교육 영상이 표시됩니다.',
    detailEyebrow: 'Smile Well',
    detailTitle: 'SMILE WELL DENTAL CONSENT FORMS',
    selectedFormLabel: '선택한 양식',
    tabForm: '양식',
    tabYouTube: 'YouTube',
    tabDrive: 'Drive',
    signTabAction: '서명 양식 열기',
    signTabMeta: 'OpenDental 웹 양식',
    signPanelEyebrow: '환자 서명',
    signPanelTitle: '이 동의서를 바로 완료할까요?',
    signDocumentAction: '서명 양식 열기',
    signDocumentBody: '공식 OpenDental 웹 양식을 새 탭으로 열어 환자가 바로 검토하고 서명할 수 있습니다.',
    documentPreview: '문서 미리보기',
    signForm: '실시간 서명 양식',
    signFormBody: '임베드가 허용되면 아래에서 OpenDental 양식을 바로 볼 수 있습니다.',
    previewUnavailable: '이 소스는 임베드를 차단할 수 있습니다. 프레임이 비어 있으면 열기 버튼을 사용하세요.',
    noDataTitle: '디렉터리 데이터를 불러오지 못했습니다',
    noDataBody: '동기화 스크립트를 실행해 data/site-data.json을 만든 뒤 페이지를 새로고침하세요.',
    httpRequiredTitle: '서버가 필요합니다',
    httpRequiredBody: '이 사이트는 파일이 아니라 로컬 HTTP 서버 주소로 열어야 합니다.',
    noFormSelected: '시작하려면 양식을 선택하세요.',
    noDocumentPreview: '이 양식에는 아직 문서 미리보기가 없습니다.',
    noVideoTitle: '연결된 교육 영상이 없습니다',
    noVideoBody: 'YouTube 또는 Drive 영상을 연결하면 여기에 표시됩니다.',
    loading: '사이트 데이터를 불러오는 중...',
    loadingPreview: '양식 미리보기를 불러오는 중...',
    loadingMediaTitle: '미디어를 불러오는 중',
    loadingMediaBody: '임베드 플레이어가 나타나지 않으면 새 탭에서 이 리소스를 여세요.',
    previewLoadFailedTitle: '미리보기를 불러오지 못했습니다',
    previewLoadFailedBody: '지금은 미리보기 소스를 불러올 수 없습니다. 페이지를 새로고침하거나 이 양식의 preview JSON 파일을 확인하세요.',
    mediaTimeoutTitle: '임베드 미디어 로딩이 지연되고 있습니다',
    mediaTimeoutBody: '이 제공자가 임베드 플레이어를 차단하고 있을 수 있습니다. 플레이어가 나타나지 않으면 새 탭에서 여세요.',
    imported: '준비됨',
    linkOnly: '미리보기만 가능',
    openVideo: '영상 열기',
    openLink: '링크 열기',
    formUnavailable: '양식 링크를 사용할 수 없습니다',
    mediaInvalidTitle: '리소스를 불러올 수 없습니다',
    mediaInvalidBody: '이 리소스의 링크를 임베드 URL로 변환할 수 없습니다. 직접 열어보세요.',
    lastSyncLabel: '동기화',
    previewReady: '미리보기 가능',
    formReady: '양식 가능',
    languageNames: {en: 'English', ko: '한국어'},
  },
};

const state = {
  theme: 'light',
  language: 'en',
  location: '',
  locations: [],
  locationFormUrls: {},
  forms: [],
  activeFormId: '',
  activeTab: 'form',
  videoSelection: {},
  emptyMode: 'default',
};

const el = {
  formList: document.querySelector('#formList'),
  emptyState: document.querySelector('#emptyState'),
  detailShell: document.querySelector('#detailShell'),
  detailBody: document.querySelector('#detailBody'),
  signFormTabButton: document.querySelector('#signFormTabButton'),
  announcer: document.querySelector('#announcer'),
  locationSelect: document.querySelector('#locationSelect'),
  languageSelect: document.querySelector('#languageSelect'),
  themeButtons: Array.from(document.querySelectorAll('[data-theme-value]')),
  tabButtons: Array.from(document.querySelectorAll('[data-tab]')),
  tabBar: document.querySelector('.tab-bar'),
  themeColorMeta: document.querySelector('meta[name="theme-color"]'),
  i18nNodes: Array.from(document.querySelectorAll('[data-i18n]')),
};

const collatorCache = new Map();
const previewSourceCache = new Map();
const previewFailureCache = new Map();
const previewHtmlCache = new Map();
const previewTemplateCache = new Map();
const sortedFormsCache = new Map();
const mediaRuntime = {
  youtube: createMediaRuntime(),
  drive: createMediaRuntime(),
};
let tabSliderFrame = 0;
let detailRenderToken = 0;
let activePreviewController = null;
let activePreviewKey = '';
let gdriveTimeoutId = 0;
let gdriveTimeoutToken = 0;

document.addEventListener('DOMContentLoaded', bootstrap);
window.addEventListener('storage', onStorageChange);

async function bootstrap() {
  state.theme = readTheme();
  state.language = readLanguage();
  document.documentElement.classList.toggle('is-preview-shell', IS_PREVIEW_SHELL);
  applyTheme();
  bindEvents();
  applyLanguage();
  await loadLocationsData();
  await loadSiteData();
  restoreActiveForm();
  render();
}

function bindEvents() {
  window.addEventListener('resize', scheduleTabSliderSync, {passive: true});

  el.languageSelect?.addEventListener('change', () => {
    const next = el.languageSelect?.value || '';
    if (!next || next === state.language) return;
    state.language = next;
    save(STORAGE.language, next);
    applyLanguage();
    renderLanguageChange();
    announce(text('sidebarTitle'));
  });

  el.locationSelect?.addEventListener('change', () => {
    const next = el.locationSelect?.value || '';
    if (!next || next === state.location) return;
    setLocation(next);
  });

  el.themeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const next = button.dataset.themeValue;
      if (!next) return;
      if (next === state.theme && hasStoredThemePreference()) return;
      setTheme(next);
    });
  });

  if (typeof THEME_MEDIA?.addEventListener === 'function') {
    THEME_MEDIA.addEventListener('change', onSystemThemeChange);
  } else if (typeof THEME_MEDIA?.addListener === 'function') {
    THEME_MEDIA.addListener(onSystemThemeChange);
  }

  el.tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const next = button.dataset.tab;
      if (!next || next === state.activeTab || button.disabled) return;
      pauseYouTubeIfLeaving(next);
      state.activeTab = next;
      renderTabs();
      renderDetail();
      announce(text(next === 'youtube' ? 'tabYouTube' : next === 'drive' ? 'tabDrive' : 'tabForm'));
    });
  });

  el.formList?.addEventListener('click', event => {
    const button = event.target instanceof Element ? event.target.closest('[data-form-id]') : null;
    if (!(button instanceof HTMLElement)) return;
    setActiveForm(button.dataset.formId || '');
  });

  [el.signFormTabButton].forEach(button => {
    button?.addEventListener('click', event => {
      if (button.classList.contains('is-disabled')) {
        event.preventDefault();
      }
    });
  });

  el.detailBody?.addEventListener('click', event => {
    const videoButton =
      event.target instanceof Element ? event.target.closest('[data-video-id]') : null;
    if (videoButton instanceof HTMLElement && (state.activeTab === 'youtube' || state.activeTab === 'drive')) {
      const form = getActiveVisibleForm();
      if (form) {
        setVideoChoice(form.id, state.activeTab, videoButton.dataset.videoId || '');
        const paneHost = getDetailPaneHost(state.activeTab);
        if (paneHost) {
          updateMediaPane(paneHost, form, state.activeTab);
        }
        const selected = getSelectedVideo(form, state.activeTab, getPlatformVideos(form, state.activeTab));
        if (selected) {
          announce(pickLocalized(selected.title, state.language) || text('openVideo'));
        }
      }
      return;
    }

    const reloadButton =
      event.target instanceof Element ? event.target.closest('[data-action="reload-gdrive-preview"]') : null;
    if (reloadButton instanceof HTMLElement) {
      event.preventDefault();
      reloadGdriveFrame();
      return;
    }

    const signLink = event.target instanceof Element ? event.target.closest('#documentSignLink') : null;
    if (signLink instanceof HTMLElement && signLink.classList.contains('is-disabled')) {
      event.preventDefault();
    }
  });
}

function createMediaRuntime() {
  return {
    embedUrl: '',
    sourceUrl: '',
    status: 'idle',
    timeoutId: 0,
    loadToken: 0,
    frame: null,
    handleLoad: null,
  };
}

function getMediaRuntime(platform) {
  return mediaRuntime[platform] || (mediaRuntime[platform] = createMediaRuntime());
}

function clearMediaRuntime(platform, {preserveEmbed = false} = {}) {
  const runtime = getMediaRuntime(platform);
  runtime.loadToken += 1;
  if (runtime.timeoutId) {
    window.clearTimeout(runtime.timeoutId);
    runtime.timeoutId = 0;
  }
  if (runtime.frame instanceof HTMLIFrameElement && typeof runtime.handleLoad === 'function') {
    runtime.frame.removeEventListener('load', runtime.handleLoad);
  }
  runtime.frame = null;
  runtime.handleLoad = null;
  if (!preserveEmbed) {
    runtime.embedUrl = '';
    runtime.sourceUrl = '';
    runtime.status = 'idle';
  }
  return runtime;
}

function clearAllMediaRuntime() {
  clearMediaRuntime('youtube');
  clearMediaRuntime('drive');
}

function pauseYouTubeIfLeaving(nextTab = '') {
  if (state.activeTab !== 'youtube' || nextTab === 'youtube') return;
  const paneHost = getDetailPaneHost('youtube');
  const frame = paneHost?.querySelector('[data-role="mediaFrame"]');
  if (!(frame instanceof HTMLIFrameElement)) return;
  try {
    frame.contentWindow?.postMessage(
      JSON.stringify({
        event: 'command',
        func: 'pauseVideo',
        args: [],
      }),
      '*',
    );
  } catch {
    // Ignore postMessage failures from cross-origin embeds.
  }
}

function cancelActivePreviewLoad({exceptKey = ''} = {}) {
  if (activePreviewController && activePreviewKey !== exceptKey) {
    activePreviewController.abort();
    activePreviewController = null;
    activePreviewKey = '';
  }
}

async function loadSiteData() {
  state.emptyMode = 'default';
  state.forms = [];
  sortedFormsCache.clear();
  previewSourceCache.clear();
  previewFailureCache.clear();
  previewHtmlCache.clear();
  previewTemplateCache.clear();
  cancelActivePreviewLoad();
  clearAllMediaRuntime();

  if (window.location.protocol === 'file:') {
    state.emptyMode = 'http-required';
    return;
  }

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const normalizedForms = normalizeForms(payload);
    const forms = (await hydrateFormsWithEnrichedData(normalizedForms)).filter(hasUsableFormData);

    if (forms.length) {
      state.forms = forms;
      state.emptyMode = 'default';
    }
  } catch (error) {
    console.error('Failed to load site data.', error);
  }

  if (!state.forms.length) {
    state.emptyMode = 'no-data';
  }
}

async function loadLocationsData() {
  state.locations = [];
  state.locationFormUrls = {};
  state.location = '';

  if (window.location.protocol === 'file:') {
    state.emptyMode = 'http-required';
    return;
  }

  try {
    const response = await fetch(LOCATIONS_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    const locations = Array.isArray(payload?.locations) ? payload.locations : [];
    const enabled = locations.filter(loc => loc && loc.enabled !== false && loc.slug);

    if (!enabled.length) {
      return;
    }

    state.locations = enabled;
    const defaultSlug = payload.defaultLocation || enabled[0].slug;
    const requested = PAGE_PARAMS.get('location') || '';
    const stored = read(STORAGE.location);
    const matchSlug = slug => enabled.some(loc => loc.slug === slug);

    state.location = matchSlug(requested)
      ? requested
      : matchSlug(stored)
        ? stored
        : matchSlug(defaultSlug)
          ? defaultSlug
          : enabled[0].slug;

    applyLocationFormUrls();
    populateLocationSelect();
  } catch (error) {
    console.error('Failed to load locations data.', error);
  }
}

function applyLocationFormUrls() {
  const loc = state.locations.find(l => l.slug === state.location);
  state.locationFormUrls = (loc && typeof loc.formUrls === 'object') ? loc.formUrls : {};
}

function populateLocationSelect() {
  if (!el.locationSelect) return;

  el.locationSelect.innerHTML = '';
  for (const loc of state.locations) {
    const option = document.createElement('option');
    option.value = loc.slug;
    option.textContent = pickLocalized(loc.label, state.language) || loc.slug;
    el.locationSelect.appendChild(option);
  }
  el.locationSelect.value = state.location;
}

function setLocation(slug) {
  if (!slug || slug === state.location) return;
  if (!state.locations.some(loc => loc.slug === slug)) return;

  state.location = slug;
  save(STORAGE.location, slug);
  applyLocationFormUrls();
  renderMain();
  renderDetail();
  const loc = state.locations.find(l => l.slug === slug);
  announce(pickLocalized(loc?.label, state.language) || slug);
}

function getFormSignUrl(form) {
  if (!form) return '';
  const locationUrl = state.locationFormUrls[form.id];
  if (typeof locationUrl === 'string') return locationUrl;
  return form.formUrl || '';
}

function normalizeForms(payload) {
  const forms = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.forms)
      ? payload.forms
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.directory)
          ? payload.directory
          : [];

  return forms
    .map((form, index) => normalizeForm(form, index))
    .filter(Boolean);
}

function normalizeForm(form, index) {
  if (!form || typeof form !== 'object') return null;

  const nameSource = form.sheetFormName ?? form.formName ?? form.title ?? form.name ?? `form-${index + 1}`;
  const seedName = pickLocalized(nameSource, 'en') || pickLocalized(nameSource, state.language) || `form-${index + 1}`;
  const id = form.id || slugify(seedName);

  return {
    ...form,
    id,
    order: Number.isFinite(form.order) ? form.order : index,
    sheetFormName: nameSource,
    translations: form.translations ?? {},
    formName: form.formName ?? form.title ?? form.name ?? nameSource,
    category: form.category ?? form.group ?? '',
    description: form.description ?? form.summary ?? '',
    notes: form.notes ?? '',
    docPreviewTitle: form.docPreviewTitle ?? '',
    previewDataUrl: firstString(form.previewDataUrl),
    formUrl: firstString(form.formUrl, form.url, form.accessUrl, form.sheetUrl, form.link, form.sourceUrl),
    docPreviewHtml: form.docPreviewHtml ?? form.documentPreviewHtml ?? form.previewHtml ?? form.preview ?? '',
    docPreviewText: form.docPreviewText ?? form.documentPreviewText ?? form.previewText ?? form.documentText ?? '',
    videos: normalizeVideos(form.videos),
  };
}

function normalizeVideos(videos) {
  if (!Array.isArray(videos)) return [];

  return videos
    .map((video, index) => {
      if (!video || typeof video !== 'object') return null;
      const url = firstString(video.url, video.link, video.sourceUrl);
      if (!url) return null;

      return {
        ...video,
        id: video.id || slugify(firstString(pickLocalized(video.title, 'en'), url, `video-${index + 1}`)),
        platform: normalizePlatform(video.platform, url),
        url,
        title: video.title ?? video.name ?? video.label ?? `Video ${index + 1}`,
        description: video.description ?? '',
      };
    })
    .filter(Boolean);
}

async function hydrateFormsWithEnrichedData(forms) {
  if (!Array.isArray(forms) || !forms.length) return [];

  const enrichedById = await loadEnrichedFormsById();
  if (!enrichedById.size) return forms;

  return forms.map(form => {
    const enriched = enrichedById.get(form.id);
    if (!enriched) return form;

    const mergedTranslations = {...(form.translations || {})};
    if (enriched.translations && typeof enriched.translations === 'object') {
      Object.entries(enriched.translations).forEach(([language, values]) => {
        if (!values || typeof values !== 'object') return;
        mergedTranslations[language] = {
          ...(mergedTranslations[language] || {}),
          ...values,
        };
      });
    }

    return {
      ...form,
      translations: mergedTranslations,
      googleViewerFileId: enriched.googleViewerFileId ?? form.googleViewerFileId,
      videos: Array.isArray(enriched.videos) ? normalizeVideos(enriched.videos) : form.videos,
    };
  });
}

async function loadEnrichedFormsById() {
  try {
    const response = await fetch(FORMS_ENRICHED_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const forms = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.forms)
        ? payload.forms
        : [];

    return new Map(
      forms
        .filter(form => form && typeof form === 'object' && form.id)
        .map(form => [form.id, form]),
    );
  } catch (error) {
    console.error('Failed to load enriched form data.', error);
    return new Map();
  }
}

function normalizePlatform(platform, url) {
  const value = String(platform || '').toLowerCase();
  if (value.includes('drive') || /drive\.google\.com/i.test(url || '')) return 'drive';
  if (value.includes('youtube') || /youtu\.?be/i.test(url || '')) return 'youtube';
  return value || 'youtube';
}

function hasUsableFormData(form) {
  return Boolean(
    form &&
      displayName(form, 'en') &&
      (getFormSignUrl(form) || hasPreviewSource(form, 'en') || hasPreviewSource(form, state.language) || (form.videos || []).length),
  );
}

function getFormUrlVariant(url, formFactor = '') {
  if (!url) return '';

  try {
    const parsed = new URL(url, window.location.href);
    const isOpenDentalForm =
      /(^|\.)patientviewer\.com$/i.test(parsed.hostname) &&
      /\/WebFormsGWT\/GWT\/WebForms\/WebForms\.html$/i.test(parsed.pathname);

    if (isOpenDentalForm && formFactor) {
      parsed.searchParams.set('formfactor', formFactor);
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

function getEmbeddedFormUrl(url) {
  return getFormUrlVariant(url, 'phone');
}

function setActionButtonState(button, href) {
  if (!button) return;

  if (href) {
    button.href = href;
    button.classList.remove('is-disabled');
    button.removeAttribute('aria-disabled');
    return;
  }

  button.href = '#';
  button.classList.add('is-disabled');
  button.setAttribute('aria-disabled', 'true');
}

function restoreActiveForm() {
  if (!state.forms.length) return;
  const requested = PAGE_PARAMS.get('form') || '';
  const stored = read(STORAGE.activeForm);
  const sorted = getVisibleForms();
  state.activeFormId = state.forms.some(form => form.id === requested)
    ? requested
    : state.forms.some(form => form.id === stored)
      ? stored
      : sorted[0]?.id || state.forms[0]?.id || '';
  state.activeTab = 'form';
}

function render() {
  syncActiveFormToVisibleResults();
  renderLocationControl();
  renderLanguageControl();
  renderThemeButtons();
  renderStaticCopy();
  renderSidebar();
  renderMain();
  renderTabs();
  renderDetail();
}

function renderLanguageChange() {
  sortedFormsCache.clear();
  syncActiveFormToVisibleResults();
  renderLocationControl();
  renderLanguageControl();
  renderStaticCopy();
  renderSidebar();
  renderMain();
  renderTabs();
  renderDetail();
}

function renderSidebar() {
  const forms = getVisibleForms();
  el.formList.innerHTML = '';

  if (!forms.length) {
    const emptyCopy = getListEmptyCopy();
    el.formList.innerHTML = `
      <div class="empty-slot">
        <div>
          <strong>${esc(emptyCopy.title)}</strong>
          <p>${esc(emptyCopy.body)}</p>
        </div>
      </div>
    `;
    return;
  }

  for (const form of forms) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `form-card${form.id === state.activeFormId ? ' is-active' : ''}`;
    button.dataset.formId = form.id;
    button.setAttribute('role', 'listitem');
    button.setAttribute('aria-pressed', String(form.id === state.activeFormId));
    button.innerHTML = `<span class="form-card__title">${esc(displayName(form, state.language))}</span>`;
    el.formList.append(button);
  }
}

function renderMain() {
  const form = getActiveVisibleForm();

  if (!form) {
    applyEmptyStateCopy(getMainEmptyCopy());
    el.emptyState.classList.remove('is-hidden');
    el.detailShell.classList.add('is-hidden');
    document.title = 'OpenDental';
    return;
  }

  el.emptyState.classList.add('is-hidden');
  el.detailShell.classList.remove('is-hidden');

  const name = displayName(form, state.language);
  setActionButtonState(el.signFormTabButton, getEmbeddedFormUrl(getFormSignUrl(form)));

  document.title = `${name} - OpenDental`;
}

function renderTabs() {
  const form = getActiveVisibleForm();
  const tabAvailability = {
    form: Boolean(form),
    youtube: Boolean(form && getPlatformVideos(form, 'youtube').length),
    drive: Boolean(form && getPlatformVideos(form, 'drive').length),
  };

  if (!tabAvailability[state.activeTab]) {
    state.activeTab = 'form';
  }

  el.tabButtons.forEach(button => {
    const tab = button.dataset.tab;
    const active = tab === state.activeTab;
    const enabled = Boolean(tabAvailability[tab]);
    button.disabled = !enabled;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });

  scheduleTabSliderSync();
}

function renderDetail() {
  detailRenderToken += 1;
  const renderToken = detailRenderToken;
  const form = getActiveVisibleForm();
  if (!form) {
    if (gdriveTimeoutId) {
      window.clearTimeout(gdriveTimeoutId);
      gdriveTimeoutId = 0;
    }
    cancelActivePreviewLoad();
    clearAllMediaRuntime();
    el.detailBody.innerHTML = '';
    el.detailBody.dataset.formId = '';
    el.detailBody.dataset.language = '';
    el.detailBody.dataset.activePane = '';
    return;
  }

  const didMountDetailPanes = ensureDetailPanesMounted(form);
  setActiveDetailPane(state.activeTab);

  if (state.activeTab === 'youtube' || state.activeTab === 'drive') {
    if (gdriveTimeoutId) {
      window.clearTimeout(gdriveTimeoutId);
      gdriveTimeoutId = 0;
    }
    cancelActivePreviewLoad();
    renderMediaDetail(form, state.activeTab, {forceMount: didMountDetailPanes});
    return;
  }

  renderFormDetail(form, renderToken, {forceMount: didMountDetailPanes});
}

function ensureDetailPanesMounted(form) {
  const shouldMount =
    !getDetailPaneHost('form') ||
    el.detailBody.dataset.formId !== form.id ||
    el.detailBody.dataset.language !== state.language;

  if (shouldMount) {
    clearAllMediaRuntime();
    el.detailBody.innerHTML = renderDetailPanes();
    el.detailBody.dataset.formId = form.id;
    el.detailBody.dataset.language = state.language;
  }

  return shouldMount;
}

function renderDetailPanes() {
  return `
    <div class="detail-panes">
      <section class="detail-pane" data-detail-pane="form"></section>
      <section class="detail-pane is-hidden" data-detail-pane="youtube" aria-hidden="true"></section>
      <section class="detail-pane is-hidden" data-detail-pane="drive" aria-hidden="true"></section>
    </div>
  `;
}

function getDetailPaneHost(pane) {
  const host = el.detailBody.querySelector(`[data-detail-pane="${cssEscape(pane)}"]`);
  return host instanceof HTMLElement ? host : null;
}

function setActiveDetailPane(activePane) {
  ['form', 'youtube', 'drive'].forEach(pane => {
    const host = getDetailPaneHost(pane);
    if (!(host instanceof HTMLElement)) return;
    const isActive = pane === activePane;
    host.classList.toggle('is-hidden', !isActive);
    host.setAttribute('aria-hidden', String(!isActive));
  });
  el.detailBody.dataset.activePane = activePane;
}

function renderMediaDetail(form, platform, {forceMount = false} = {}) {
  const paneHost = getDetailPaneHost(platform);
  if (!(paneHost instanceof HTMLElement)) return;
  const shouldMountMediaPane =
    forceMount ||
    paneHost.dataset.formId !== form.id ||
    paneHost.dataset.language !== state.language ||
    !paneHost.querySelector('[data-role="mediaFrame"]');
  if (shouldMountMediaPane) {
    paneHost.innerHTML = renderMediaPane(form, platform);
  }
  paneHost.dataset.formId = form.id;
  paneHost.dataset.language = state.language;
  updateMediaPane(paneHost, form, platform, {forceListRender: shouldMountMediaPane});
}

function renderFormDetail(form, renderToken, {forceMount = false} = {}) {
  const paneHost = getDetailPaneHost('form');
  if (!(paneHost instanceof HTMLElement)) return;
  const shouldMountShell =
    forceMount ||
    paneHost.dataset.language !== state.language ||
    paneHost.dataset.formId !== form.id ||
    !paneHost.querySelector('#docPreviewHost');

  if (shouldMountShell) {
    paneHost.innerHTML = renderFormPane(form);
  }

  paneHost.dataset.formId = form.id;
  paneHost.dataset.language = state.language;

  updateFormPaneActions(form, paneHost);
  const host = getDocPreviewHost(paneHost);
  if (!(host instanceof HTMLElement)) return;

  if (gdriveTimeoutId) {
    window.clearTimeout(gdriveTimeoutId);
    gdriveTimeoutId = 0;
  }

  const fileId = resolveViewerFileId(form, state.language);
  host.innerHTML = fileId ? renderGdriveViewerMarkup(form, fileId) : renderPreviewUnavailableMarkup();
  host.scrollTop = 0;

  if (fileId) {
    startGdriveTimeout();
  }
}

function renderFormPane(form) {
  const signHref = getEmbeddedFormUrl(getFormSignUrl(form));
  const previewTitle = pickLocalized(form.docPreviewTitle, state.language);
  const formName = displayName(form, state.language);
  const subtitle =
    previewTitle && normalizeWhitespace(previewTitle) !== normalizeWhitespace(formName)
      ? previewTitle
      : '';

  return `
    <div class="detail-stack">
      <section class="surface surface--document">
        <div class="surface__header surface__header--document">
          <div class="surface__heading surface__heading--document">
            <p class="surface__eyebrow">${esc(text('selectedFormLabel'))}</p>
            <h3 class="surface__document-title">${esc(formName)}</h3>
            ${subtitle ? `<p class="surface__subtle surface__subtle--document">${esc(subtitle)}</p>` : ''}
          </div>
        </div>
        <div class="surface__body surface__body--document">
          <div id="docPreviewHost" class="doc-preview"></div>
          <section class="document-cta">
            <div class="document-cta__copy">
              <p class="document-cta__eyebrow">${esc(text('signPanelEyebrow'))}</p>
              <h3 class="document-cta__title">${esc(text('signPanelTitle'))}</h3>
              <p class="document-cta__body">${esc(text('signDocumentBody'))}</p>
            </div>
            <a
              id="documentSignLink"
              class="action-button action-button--sign action-button--sign-inline${
                signHref ? '' : ' is-disabled'
              }"
              href="${esc(signHref || '#')}"
              target="_blank"
              rel="noreferrer"
              ${signHref ? '' : 'aria-disabled="true"'}
            >
              <span class="action-button__label">${esc(text('signDocumentAction'))}</span>
            </a>
          </section>
        </div>
      </section>
    </div>
  `;
}

function renderPreviewLoadingMarkup() {
  return `<p class="muted-copy">${esc(text('loadingPreview'))}</p>`;
}

function resolveViewerFileId(form, language) {
  const raw = form?.googleViewerFileId;
  if (!raw) return '';
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw !== 'object') return '';

  const isKo = language === 'ko' || language === 'kr';
  if (isKo) {
    return firstString(raw.ko, raw.kr, raw.en);
  }

  return firstString(raw.en, raw.ko, raw.kr);
}

function renderGdriveViewerMarkup(form, fileId) {
  const title = displayName(form, state.language) || 'Form Preview';
  return `
    <div class="gdrive-viewer-shell">
      <iframe
        id="gdrive-preview-frame"
        src="https://docs.google.com/document/d/${esc(fileId)}/preview?rm=minimal"
        frameborder="0"
        allowfullscreen
        title="${esc(title)}"
      ></iframe>
      <div class="gdrive-viewer-timeout" id="gdrive-timeout-overlay" style="display:none;">
        <p>Preview is taking too long to load.</p>
        <button type="button" class="action-button action-button--ghost" data-action="reload-gdrive-preview">Reload</button>
      </div>
    </div>
  `;
}

function renderPreviewUnavailableMarkup() {
  return '<p class="preview-unavailable">Preview not available for this form.</p>';
}

function startGdriveTimeout() {
  const frame = document.getElementById('gdrive-preview-frame');
  const overlay = document.getElementById('gdrive-timeout-overlay');
  if (!(frame instanceof HTMLIFrameElement) || !(overlay instanceof HTMLElement)) return;

  if (gdriveTimeoutId) {
    window.clearTimeout(gdriveTimeoutId);
    gdriveTimeoutId = 0;
  }

  overlay.style.display = 'none';
  const timeoutToken = ++gdriveTimeoutToken;
  gdriveTimeoutId = window.setTimeout(() => {
    if (timeoutToken !== gdriveTimeoutToken) return;
    overlay.style.display = 'flex';
    gdriveTimeoutId = 0;
  }, GDRIVE_TIMEOUT_MS);

  frame.addEventListener(
    'load',
    () => {
      if (timeoutToken !== gdriveTimeoutToken) return;
      if (gdriveTimeoutId) {
        window.clearTimeout(gdriveTimeoutId);
        gdriveTimeoutId = 0;
      }
      overlay.style.display = 'none';
    },
    {once: true},
  );
}

function reloadGdriveFrame() {
  const frame = document.getElementById('gdrive-preview-frame');
  const overlay = document.getElementById('gdrive-timeout-overlay');
  if (!(frame instanceof HTMLIFrameElement)) return;
  if (overlay instanceof HTMLElement) {
    overlay.style.display = 'none';
  }
  frame.src = frame.src;
  startGdriveTimeout();
}

function renderPreviewEmptyMarkup() {
  return `
    <div class="empty-slot">
      <div><strong>${esc(text('noDocumentPreview'))}</strong></div>
    </div>
  `;
}

function renderPreviewErrorMarkup() {
  return `
    <div class="empty-slot">
      <div>
        <strong>${esc(text('previewLoadFailedTitle'))}</strong>
        <p>${esc(text('previewLoadFailedBody'))}</p>
      </div>
    </div>
  `;
}

function schedulePreviewRender(form, language, renderToken) {
  const commitPreview = async () => {
    let preview = '';
    let previewFailed = false;
    const previewKey = getPreviewCacheKey(form.id, language);
    const needsPreviewLoad = !previewHtmlCache.has(previewKey);
    const controller =
      needsPreviewLoad && typeof AbortController === 'function' ? new AbortController() : null;

    if (controller) {
      cancelActivePreviewLoad({exceptKey: previewKey});
      activePreviewController = controller;
      activePreviewKey = previewKey;
    }

    try {
      preview = await getResolvedPreviewHtml(form, language, {signal: controller?.signal});
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }
      previewFailed = true;
      console.error(`Failed to load preview for "${form.id}" (${language}).`, error);
    } finally {
      if (controller && activePreviewController === controller) {
        activePreviewController = null;
        activePreviewKey = '';
      }
    }

    if (
      renderToken !== detailRenderToken ||
      state.activeTab !== 'form' ||
      state.activeFormId !== form.id ||
      state.language !== language
    ) {
      return;
    }

    const host = document.querySelector('#docPreviewHost');
    if (!(host instanceof HTMLElement)) return;
    host.scrollTop = 0;
    const markup = previewFailed
      ? renderPreviewErrorMarkup()
      : preview || renderPreviewEmptyMarkup();
    setDocPreviewMarkup(
      host,
      markup,
      !previewFailed && preview ? getPreviewCacheKey(form.id, language) : '',
    );
  };

  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => {
      void commitPreview();
    });
    return;
  }

  void commitPreview();
}

function getCachedPreviewHtml(form, language) {
  if (!form) return '';
  return previewHtmlCache.get(getPreviewCacheKey(form.id, language)) || '';
}

function updateFormPaneActions(form, scope = document) {
  const signHref = getEmbeddedFormUrl(getFormSignUrl(form));
  const signLink = scope.querySelector('#documentSignLink');

  setActionButtonState(signLink, signHref);
}

function getDocPreviewHost(scope = document) {
  const host = scope.querySelector('#docPreviewHost');
  return host instanceof HTMLElement ? host : null;
}

function getPreviewCacheKey(formId, language) {
  return `${formId}:${language}`;
}

function setDocPreviewMarkup(host, markup, cacheKey = '') {
  if (!(host instanceof HTMLElement)) return;

  if (!cacheKey || !markup) {
    host.innerHTML = markup;
    return;
  }

  let template = previewTemplateCache.get(cacheKey);
  if (!template) {
    template = document.createElement('template');
    template.innerHTML = markup;
    previewTemplateCache.set(cacheKey, template);
  }

  host.replaceChildren(template.content.cloneNode(true));
}

function deferNonCriticalWork(task) {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => {
      void task();
    }, {timeout: IDLE_TIMEOUT_MS});
    return;
  }

  window.setTimeout(() => {
    void task();
  }, 0);
}

function scheduleTabSliderSync() {
  if (tabSliderFrame) return;
  tabSliderFrame = window.requestAnimationFrame(() => {
    tabSliderFrame = 0;
    syncTabSlider();
  });
}

function syncTabSlider() {
  const tabBar = el.tabBar;
  if (!tabBar) return;

  const activeButton = tabBar.querySelector('.tab-button.is-active:not(:disabled)');
  if (!(activeButton instanceof HTMLElement)) {
    tabBar.style.setProperty('--tab-slider-opacity', '0');
    return;
  }

  const barRect = tabBar.getBoundingClientRect();
  const activeRect = activeButton.getBoundingClientRect();
  tabBar.style.setProperty('--tab-slider-left', `${activeRect.left - barRect.left}px`);
  tabBar.style.setProperty('--tab-slider-width', `${activeRect.width}px`);
  tabBar.style.setProperty('--tab-slider-opacity', '1');
}

function renderMediaPane(form, platform) {
  const items = getPlatformVideos(form, platform);
  const hasSelector = items.length > 1;
  return `
    <section class="surface surface--media">
      <div class="surface__body surface__body--media">
        <div class="media-workspace">
          <div class="media-list${hasSelector ? '' : ' is-hidden'}" data-role="mediaList"></div>
          <div class="media-browser">
            <iframe
              data-role="mediaFrame"
              class="is-hidden"
              loading="lazy"
              referrerpolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
            <div data-role="mediaFallback" class="media-fallback is-hidden"></div>
          </div>
          <div data-role="mediaFooter" class="media-frame__footer is-hidden"></div>
        </div>
      </div>
    </section>
  `;
}

function getMediaPaneNodes(paneHost) {
  const listHost = paneHost.querySelector('[data-role="mediaList"]');
  const frame = paneHost.querySelector('[data-role="mediaFrame"]');
  const frameFooter = paneHost.querySelector('[data-role="mediaFooter"]');
  const fallbackHost = paneHost.querySelector('[data-role="mediaFallback"]');
  if (
    !(listHost instanceof HTMLElement) ||
    !(frame instanceof HTMLIFrameElement) ||
    !(frameFooter instanceof HTMLElement) ||
    !(fallbackHost instanceof HTMLElement)
  ) {
    return null;
  }
  return {listHost, frame, frameFooter, fallbackHost};
}

function renderMediaFallbackMarkup(title, body, url = '', actionLabel = text('openVideo')) {
  return `
    <div class="media-fallback__content">
      <div>
        <strong>${esc(title)}</strong>
        <p>${esc(body)}</p>
      </div>
        ${
          url
          ? `<a class="action-button action-button--ghost" href="${esc(url)}" target="_blank" rel="noreferrer">${esc(actionLabel)}</a>`
          : ''
        }
      </div>
  `;
}

function showMediaFallback(host, markup, modifier = '') {
  host.className = `media-fallback${modifier ? ` media-fallback--${modifier}` : ''}`;
  host.innerHTML = markup;
  host.classList.remove('is-hidden');
}

function hideMediaFallback(host) {
  host.className = 'media-fallback is-hidden';
  host.innerHTML = '';
}

function renderMediaFooter(frameFooter, sourceUrl) {
  if (!sourceUrl) {
    frameFooter.classList.add('is-hidden');
    frameFooter.innerHTML = '';
    return;
  }

  frameFooter.classList.remove('is-hidden');
  frameFooter.innerHTML = `
    <a class="muted-link" href="${esc(sourceUrl)}" target="_blank" rel="noreferrer">${esc(text('openVideo'))}</a>
  `;
}

function renderMediaFooterWithAdvisory(frameFooter, sourceUrl, advisoryText) {
  if (!sourceUrl) {
    frameFooter.classList.add('is-hidden');
    frameFooter.innerHTML = '';
    return;
  }

  frameFooter.classList.remove('is-hidden');
  frameFooter.innerHTML = `
    <div style="margin-bottom: 8px; font-size: 12px; opacity: 0.8;">${esc(advisoryText)}</div>
    <a class="muted-link" href="${esc(sourceUrl)}" target="_blank" rel="noreferrer">${esc(text('openVideo'))}</a>
  `;
}

function startMediaLoad(platform, frame, fallbackHost, frameFooter, sourceUrl, embedUrl) {
  const runtime = clearMediaRuntime(platform);
  runtime.embedUrl = embedUrl;
  runtime.sourceUrl = sourceUrl;
  runtime.status = 'loading';
  const isYouTube = platform === 'youtube';

  // For YouTube: keep iframe visible, don't show loading fallback
  // For Drive: show loading fallback and hide iframe
  if (isYouTube) {
    hideMediaFallback(fallbackHost);
    renderMediaFooter(frameFooter, sourceUrl);
    frame.classList.remove('is-hidden');
  } else {
    showMediaFallback(
      fallbackHost,
      renderMediaFallbackMarkup(text('loadingMediaTitle'), text('loadingMediaBody'), sourceUrl),
      'loading',
    );
    renderMediaFooter(frameFooter, sourceUrl);
    frame.classList.add('is-hidden');
  }

  const loadToken = runtime.loadToken;
  runtime.frame = frame;
  runtime.handleLoad = () => {
    const current = getMediaRuntime(platform);
    if (current.loadToken !== loadToken || current.embedUrl !== embedUrl) {
      return;
    }
    if (current.timeoutId) {
      window.clearTimeout(current.timeoutId);
      current.timeoutId = 0;
    }
    hideMediaFallback(fallbackHost);
    frame.classList.remove('is-hidden');
    current.status = 'ready';
    frame.removeEventListener('load', current.handleLoad);
    current.handleLoad = null;
    current.frame = null;
  };

  frame.addEventListener('load', runtime.handleLoad, {once: true});
  runtime.timeoutId = window.setTimeout(() => {
    const current = getMediaRuntime(platform);
    if (current.loadToken !== loadToken || current.embedUrl !== embedUrl) {
      return;
    }
    current.timeoutId = 0;
    current.status = 'timeout';

    // For YouTube: keep iframe visible, show advisory footer only
    // For Drive: hide iframe and show full fallback
    if (isYouTube) {
      renderMediaFooterWithAdvisory(frameFooter, sourceUrl, text('mediaTimeoutBody'));
    } else {
      frame.classList.add('is-hidden');
      showMediaFallback(
        fallbackHost,
        renderMediaFallbackMarkup(text('mediaTimeoutTitle'), text('mediaTimeoutBody'), sourceUrl),
        'timeout',
      );
    }
  }, MEDIA_LOAD_TIMEOUT_MS);

  if (frame.getAttribute('src') !== embedUrl) {
    // Set referrer policy for YouTube to improve embed success rate
    if (isYouTube) {
      frame.referrerPolicy = 'origin';
    }
    frame.src = embedUrl;
  }
}

function applyMediaRuntimePresentation(platform, frame, fallbackHost, frameFooter) {
  const runtime = getMediaRuntime(platform);
  const isYouTube = platform === 'youtube';

  if (runtime.status === 'ready') {
    renderMediaFooter(frameFooter, runtime.sourceUrl);
    hideMediaFallback(fallbackHost);
    frame.classList.remove('is-hidden');
    return;
  }

  if (runtime.status === 'timeout') {
    if (isYouTube) {
      // For YouTube: keep iframe visible, show advisory footer
      renderMediaFooterWithAdvisory(frameFooter, runtime.sourceUrl, text('mediaTimeoutBody'));
      frame.classList.remove('is-hidden');
      hideMediaFallback(fallbackHost);
    } else {
      // For Drive: hide iframe, show full fallback
      renderMediaFooter(frameFooter, runtime.sourceUrl);
      frame.classList.add('is-hidden');
      showMediaFallback(
        fallbackHost,
        renderMediaFallbackMarkup(text('mediaTimeoutTitle'), text('mediaTimeoutBody'), runtime.sourceUrl),
        'timeout',
      );
    }
    return;
  }

  if (runtime.status === 'loading') {
    if (isYouTube) {
      // For YouTube: keep iframe visible
      renderMediaFooter(frameFooter, runtime.sourceUrl);
      frame.classList.remove('is-hidden');
      hideMediaFallback(fallbackHost);
    } else {
      // For Drive: show loading fallback, hide iframe
      renderMediaFooter(frameFooter, runtime.sourceUrl);
      frame.classList.add('is-hidden');
      showMediaFallback(
        fallbackHost,
        renderMediaFallbackMarkup(text('loadingMediaTitle'), text('loadingMediaBody'), runtime.sourceUrl),
        'loading',
      );
    }
    return;
  }

  frame.classList.add('is-hidden');
  hideMediaFallback(fallbackHost);
}

function updateMediaPane(paneHost, form, platform, {forceListRender = false} = {}) {
  const items = getPlatformVideos(form, platform);
  const nodes = getMediaPaneNodes(paneHost);
  if (!nodes) return;
  const {listHost, frame, frameFooter, fallbackHost} = nodes;

  const hasSelector = items.length > 1;
  if (!items.length) {
    clearMediaRuntime(platform);
    listHost.classList.add('is-hidden');
    listHost.innerHTML = '';
    delete listHost.dataset.formId;
    delete listHost.dataset.platform;
    delete listHost.dataset.language;
    frame.removeAttribute('src');
    frame.classList.add('is-hidden');
    frameFooter.classList.add('is-hidden');
    frameFooter.innerHTML = '';
    showMediaFallback(fallbackHost, renderMediaFallbackMarkup(text('noVideoTitle'), text('noVideoBody')));
    return;
  }

  const selected = getSelectedVideo(form, platform, items);
  const requiresListMarkup =
    hasSelector &&
    (forceListRender ||
      listHost.dataset.formId !== form.id ||
      listHost.dataset.platform !== platform ||
      listHost.dataset.language !== state.language);

  listHost.classList.toggle('is-hidden', !hasSelector);

  if (requiresListMarkup) {
    listHost.innerHTML = items
      .map(item => {
        const active = item.id === selected.id;
        const title = pickLocalized(item.title, state.language) || text('openVideo');
        return `
          <button
            type="button"
            class="video-item${active ? ' is-active' : ''}"
            data-video-id="${esc(item.id)}"
            aria-pressed="${active ? 'true' : 'false'}"
          >
            <strong class="video-item__title">${esc(title)}</strong>${
              getVideoLanguageLabel(item) ? `<span class="video-item__lang">${esc(getVideoLanguageLabel(item))}</span>` : ''
            }
          </button>
        `;
      })
      .join('');
    listHost.dataset.formId = form.id;
    listHost.dataset.platform = platform;
    listHost.dataset.language = state.language;
  } else if (hasSelector) {
    updateMediaListSelection(listHost, selected.id);
  } else {
    listHost.innerHTML = '';
    delete listHost.dataset.formId;
    delete listHost.dataset.platform;
    delete listHost.dataset.language;
  }

  const mediaSource = resolveMediaSource(selected.url, platform, {origin: window.location.origin});
  frame.title = pickLocalized(selected.title, state.language) || text('openVideo');

  if (mediaSource.kind !== 'iframe' || !mediaSource.embedUrl) {
    clearMediaRuntime(platform);
    frame.removeAttribute('src');
    frame.classList.add('is-hidden');
    renderMediaFooter(frameFooter, mediaSource.sourceUrl || selected.url);
    showMediaFallback(
      fallbackHost,
      renderMediaFallbackMarkup(
        selected.url ? text('mediaInvalidTitle') : text('noVideoTitle'),
        selected.url ? text('mediaInvalidBody') : text('noVideoBody'),
        mediaSource.sourceUrl || selected.url,
      ),
      'invalid',
    );
    return;
  }

  const runtime = getMediaRuntime(platform);
  if (runtime.embedUrl === mediaSource.embedUrl && runtime.sourceUrl === mediaSource.sourceUrl) {
    applyMediaRuntimePresentation(platform, frame, fallbackHost, frameFooter);
    return;
  }

  startMediaLoad(platform, frame, fallbackHost, frameFooter, mediaSource.sourceUrl, mediaSource.embedUrl);
}

function updateMediaListSelection(listHost, selectedId) {
  listHost.querySelectorAll('[data-video-id]').forEach(button => {
    if (!(button instanceof HTMLElement)) return;
    const active = button.dataset.videoId === selectedId;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function renderLocationControl() {
  if (!el.locationSelect || !state.locations.length) return;

  Array.from(el.locationSelect.options).forEach(option => {
    const loc = state.locations.find(l => l.slug === option.value);
    if (loc) {
      option.textContent = pickLocalized(loc.label, state.language) || loc.slug;
    }
  });
  el.locationSelect.value = state.location;
  el.locationSelect.setAttribute('aria-label', text('locationLabel'));
}

function renderLanguageControl() {
  const labels = I18N[state.language]?.languageNames ?? I18N.en.languageNames;
  if (!el.languageSelect) return;

  Array.from(el.languageSelect.options).forEach(option => {
    const language = option.value || 'en';
    option.textContent = labels[language] ?? LANGUAGE_SHORT[language] ?? language.toUpperCase();
  });
  el.languageSelect.value = state.language;
  el.languageSelect.title = labels[state.language] ?? state.language;
  el.languageSelect.setAttribute('aria-label', text('languageLabel'));
}

function renderThemeButtons() {
  el.themeButtons.forEach(button => {
    const theme = button.dataset.themeValue || 'light';
    const active = theme === state.theme;
    button.title = text(theme === 'dark' ? 'themeDark' : 'themeLight');
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function renderStaticCopy() {
  el.i18nNodes.forEach(node => {
    const key = node.dataset.i18n;
    if (key && typeof I18N[state.language]?.[key] === 'string') {
      node.textContent = I18N[state.language][key];
    }
  });
}

function applyEmptyStateCopy(copy) {
  const eyebrow = el.emptyState.querySelector('[data-i18n="emptyEyebrow"]');
  const titleNode = el.emptyState.querySelector('[data-i18n="emptyTitle"]');
  const bodyNode = el.emptyState.querySelector('[data-i18n="emptyBody"]');

  if (eyebrow) eyebrow.textContent = copy.eyebrow;
  if (titleNode) titleNode.textContent = copy.title;
  if (bodyNode) bodyNode.textContent = copy.body;
}

function getEmptyCopy() {
  if (state.emptyMode === 'http-required') {
    return {
      eyebrow: text('httpRequiredTitle'),
      title: text('httpRequiredTitle'),
      body: text('httpRequiredBody'),
    };
  }

  if (state.emptyMode === 'no-data') {
    return {
      eyebrow: text('noDataTitle'),
      title: text('noDataTitle'),
      body: text('noDataBody'),
    };
  }

  return {
    eyebrow: text('emptyEyebrow'),
    title: text('emptyTitle'),
    body: text('emptyBody'),
  };
}

function getListEmptyCopy() {
  return {
    title: getEmptyCopy().title,
    body: getEmptyCopy().body,
  };
}

function getMainEmptyCopy() {
  return getEmptyCopy();
}

function setActiveForm(formId) {
  if (!formId || formId === state.activeFormId) return;
  pauseYouTubeIfLeaving('form');
  const previousFormId = state.activeFormId;
  state.activeFormId = formId;
  state.activeTab = 'form';
  save(STORAGE.activeForm, formId);
  renderSidebarSelection(previousFormId, formId);
  renderMain();
  renderTabs();
  renderDetail();
  const form = getActiveVisibleForm();
  announce(form ? displayName(form, state.language) : text('emptyTitle'));
}

function renderSidebarSelection(previousFormId, nextFormId) {
  if (!el.formList) return;

  const updateButtonState = (formId, isActive) => {
    if (!formId) return;
    const button = el.formList.querySelector(`[data-form-id="${cssEscape(formId)}"]`);
    if (!(button instanceof HTMLElement)) return;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  };

  updateButtonState(previousFormId, false);
  updateButtonState(nextFormId, true);
}

function setVideoChoice(formId, platform, videoId) {
  if (!state.videoSelection[formId]) state.videoSelection[formId] = {};
  state.videoSelection[formId][platform] = videoId;
}

function getSelectedVideo(form, platform, items) {
  if (!items.length) return null;
  const chosen = state.videoSelection[form.id]?.[platform];
  return items.find(item => item.id === chosen) || items[0];
}

function getVideoLanguageLabel(video) {
  if (!video) return '';
  const lang = String(video.language || '').trim().toLowerCase();
  if (!lang) return '';
  if (lang.startsWith('ko') || lang === 'kr') return 'KO';
  if (lang.startsWith('en')) return 'EN';
  return lang.substring(0, 2).toUpperCase();
}

function getPlatformVideos(form, platform) {
  const items = (form.videos || []).filter(item => item.platform === platform);
  if (!items.length) return [];

  const preferredLanguage = state.language === 'ko' || state.language === 'kr' ? 'ko' : 'en';
  const matching = items.filter(item => {
    const language = String(item.language || '').toLowerCase();
    return preferredLanguage === 'ko' ? language === 'ko' || language === 'kr' : language === 'en';
  });
  if (matching.length) return matching;

  const englishOrDefault = items.filter(item => {
    const language = String(item.language || '').toLowerCase();
    return !language || language === 'en';
  });
  return englishOrDefault.length ? englishOrDefault : items;
}

function getActiveVisibleForm() {
  const visible = getVisibleForms();
  if (!visible.length) return null;
  return visible.find(form => form.id === state.activeFormId) || visible[0] || null;
}

function getVisibleForms() {
  const cacheKey = state.language;
  if (!sortedFormsCache.has(cacheKey)) {
    sortedFormsCache.set(cacheKey, sortForms(state.forms, state.language));
  }
  return sortedFormsCache.get(cacheKey) || [];
}

function syncActiveFormToVisibleResults() {
  const visible = getVisibleForms();

  if (!state.forms.length) {
    state.activeFormId = '';
    return;
  }

  if (!state.activeFormId && visible[0]) {
    state.activeFormId = visible[0].id;
    return;
  }

  if (visible.length && !visible.some(form => form.id === state.activeFormId)) {
    state.activeFormId = visible[0].id;
  }
}

function sortForms(forms, language) {
  const collator = getCollator(language);
  return [...forms].sort((a, b) => {
    const byName = collator.compare(displayName(a, language), displayName(b, language));
    return byName || (a.order || 0) - (b.order || 0);
  });
}

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === 'function') {
    return window.CSS.escape(value);
  }

  return String(value).replace(/["\\]/g, '\\$&');
}

function getCollator(language) {
  if (!collatorCache.has(language)) {
    collatorCache.set(
      language,
      new Intl.Collator(language === 'ko' ? 'ko' : 'en', {sensitivity: 'base'}),
    );
  }
  return collatorCache.get(language);
}

function displayName(form, language) {
  if (!form) return '';
  const isKo = language === 'ko' || language === 'kr';
  if (isKo) {
    return (form.translations &&
            form.translations.ko &&
            form.translations.ko.formName) ||
           form.formName ||
           form.name ||
           form.sheetFormName ||
           '';
  }
  return form.formName || form.name || form.sheetFormName || '';
}

function localizedField(form, field, language) {
  if (!form || !field) return '';
  const translations = form.translations || {};
  return firstNonEmpty(
    textValue(translations?.[language]?.[field], language),
    textValue(translations?.en?.[field], 'en'),
    textValue(form[field], language),
  );
}

function pickLocalized(value, language) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(item => pickLocalized(item, language)).filter(Boolean).join(' ');
  if (typeof value === 'object') {
    return firstNonEmpty(
      textValue(value[language], language),
      textValue(value.en, 'en'),
      textValue(value.ko, 'ko'),
      textValue(Object.values(value)[0], language),
    );
  }
  return String(value);
}

function textValue(value, language = state.language) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(item => textValue(item, language)).filter(Boolean).join(' ');
  if (typeof value === 'object') return pickLocalized(value, language);
  return '';
}

function resolvePreviewValue(value, language) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(item => resolvePreviewValue(item, language)).filter(Boolean).join(' ');
  if (typeof value === 'object') {
    if (language === 'ko') {
      return firstNonEmpty(
        textValue(value.ko, 'ko'),
        textValue(value.en, 'en'),
        textValue(Object.values(value)[0], language),
      );
    }

    return firstNonEmpty(
      textValue(value[language], language),
      textValue(value.en, 'en'),
      textValue(Object.values(value)[0], language),
    );
  }
  return String(value);
}

function resolvePreviewHtml(form, language) {
  const raw = firstNonEmpty(
    resolvePreviewValue(form.docPreviewHtml, language),
    resolvePreviewValue(form.docPreviewText, language),
    resolvePreviewValue(form.docPreviewHtml, 'en'),
    resolvePreviewValue(form.docPreviewText, 'en'),
  );

  if (!raw) return '';
  if (/<[a-z][\s\S]*>/i.test(raw)) return sanitizeHtml(raw, language);
  return `<p>${esc(cleanPreviewText(raw, language)).replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br />')}</p>`;
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw new DOMException('Preview load aborted.', 'AbortError');
  }
}

function getPreviewFailureEntry(formId) {
  const entry = previewFailureCache.get(formId);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    previewFailureCache.delete(formId);
    return null;
  }
  return entry;
}

async function getResolvedPreviewHtml(form, language, {signal} = {}) {
  const cacheKey = getPreviewCacheKey(form.id, language);
  if (previewHtmlCache.has(cacheKey)) {
    return previewHtmlCache.get(cacheKey) || '';
  }

  if (!hasPreviewSource(form, language)) {
    return '';
  }

  throwIfAborted(signal);
  const previewSource = await loadPreviewSource(form, {signal});
  throwIfAborted(signal);
  const previewHtml = previewSource ? resolveLoadedPreviewHtml(previewSource, language) : '';
  throwIfAborted(signal);
  previewHtmlCache.set(cacheKey, previewHtml);
  return previewHtml;
}

async function loadPreviewSource(form, {signal} = {}) {
  if (!form) return null;
  if (hasInlinePreviewSource(form)) return form;
  if (!form.previewDataUrl) return null;

  if (previewSourceCache.has(form.id)) {
    return previewSourceCache.get(form.id) || null;
  }

  const cachedFailure = getPreviewFailureEntry(form.id);
  if (cachedFailure) {
    throw cachedFailure.error;
  }

  try {
    const response = await fetch(form.previewDataUrl, {signal});
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    throwIfAborted(signal);
    const previewSource = normalizePreviewPayload(payload, form);
    previewSourceCache.set(form.id, previewSource);
    previewFailureCache.delete(form.id);
    return previewSource;
  } catch (error) {
    if (error?.name !== 'AbortError') {
      previewFailureCache.set(form.id, {
        error,
        expiresAt: Date.now() + PREVIEW_FAILURE_TTL_MS,
      });
    }
    throw error;
  }
}

function normalizePreviewPayload(payload, form) {
  return {
    id: payload?.id || form.id,
    schemaVersion: payload?.schemaVersion ?? 0,
    trustedPreview: Boolean(form.previewDataUrl),
    docPreviewTitle: payload?.docPreviewTitle ?? form.docPreviewTitle ?? '',
    docPreviewImages: payload?.docPreviewImages ?? '',
    docPreviewHtml: payload?.docPreviewHtml ?? '',
    docPreviewText: payload?.docPreviewText ?? '',
  };
}

function resolveLoadedPreviewHtml(previewSource, language) {
  const previewImages = resolvePreviewImages(previewSource.docPreviewImages, language);
  if (previewImages.length) {
    return renderPreviewImagesMarkup(previewImages);
  }

  const raw = firstNonEmpty(
    resolvePreviewValue(previewSource.docPreviewHtml, language),
    resolvePreviewValue(previewSource.docPreviewText, language),
    resolvePreviewValue(previewSource.docPreviewHtml, 'en'),
    resolvePreviewValue(previewSource.docPreviewText, 'en'),
  );

  if (!raw) return '';

  if (!/<[a-z][\s\S]*>/i.test(raw)) {
    return `<p>${esc(cleanPreviewText(raw, language)).replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br />')}</p>`;
  }

  if (previewSource.trustedPreview || previewSource.schemaVersion === 1) {
    return sanitizeHtml(raw, language);
  }

  return sanitizeHtml(raw, language);
}

function renderPreviewImagesMarkup(images) {
  return `
    <div class="doc-preview-pages">
      ${images
        .map(
          (src, index) => `
            <figure class="doc-preview-page">
              <img
                class="doc-preview-page__image"
                src="${esc(src)}"
                alt="${esc(text('documentPreview'))} page ${index + 1}"
                ${index === 0 ? 'decoding="async"' : 'loading="lazy" decoding="async"'}
              />
            </figure>
          `,
        )
        .join('')}
    </div>
  `;
}

function resolvePreviewImages(value, language) {
  if (value == null) return [];
  if (typeof value === 'string') {
    return firstString(value) ? [firstString(value)] : [];
  }
  if (Array.isArray(value)) {
    return value
      .map(item => firstString(typeof item === 'string' ? item : textValue(item, language)))
      .filter(Boolean);
  }
  if (typeof value === 'object') {
    return firstNonEmptyArray(
      normalizePreviewImageList(value[language], language),
      normalizePreviewImageList(value.en, 'en'),
      normalizePreviewImageList(value.ko, 'ko'),
      ...Object.values(value).map(entry => normalizePreviewImageList(entry, language)),
    );
  }
  return [];
}

function normalizePreviewImageList(value, language) {
  if (value == null) return [];
  if (typeof value === 'string') {
    return firstString(value) ? [firstString(value)] : [];
  }
  if (Array.isArray(value)) {
    return value
      .map(item => firstString(typeof item === 'string' ? item : textValue(item, language)))
      .filter(Boolean);
  }
  return [];
}

function hasInlinePreviewSource(form, language = state.language) {
  return Boolean(
    form &&
      firstNonEmpty(
      resolvePreviewValue(form.docPreviewHtml, language),
      resolvePreviewValue(form.docPreviewText, language),
      resolvePreviewValue(form.docPreviewHtml, 'en'),
      resolvePreviewValue(form.docPreviewText, 'en'),
    ),
  );
}

function hasPreviewSource(form, language = state.language) {
  return Boolean(form?.previewDataUrl || form?.hasDocxPreview || hasInlinePreviewSource(form, language));
}

function sanitizeHtml(html, language = state.language) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return '';

  root.querySelectorAll('script, iframe, object, embed, link').forEach(node => node.remove());

  root.querySelectorAll('*').forEach(node => {
    Array.from(node.attributes).forEach(attribute => {
      if (/^on/i.test(attribute.name)) {
        node.removeAttribute(attribute.name);
      }
    });
  });

  if (language !== 'ko') {
    prunePreviewContent(root, language);
  }

  return root.innerHTML;
}

function prunePreviewContent(root, language = state.language) {
  root.querySelectorAll('table, p, blockquote, ul, ol').forEach(block => {
    const value = normalizeWhitespace(block.textContent);
    if (shouldRemovePreviewBlock(value)) {
      block.remove();
      return;
    }
    cleanPreviewTextNodes(block, language);
    if (!normalizeWhitespace(block.textContent)) {
      block.remove();
    }
  });

  cleanPreviewTextNodes(root, language);

  root.querySelectorAll('*').forEach(node => {
    if (!node.children.length && !normalizeWhitespace(node.textContent)) {
      node.remove();
    }
  });
}

function cleanPreviewTextNodes(root, language = state.language) {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  for (const node of nodes) {
    node.textContent = cleanPreviewText(node.textContent, language);
  }
}

function shouldRemovePreviewBlock(value) {
  return PREVIEW_BLOCK_REMOVAL_PATTERNS.some(pattern => pattern.test(value));
}

function cleanPreviewText(value, language = state.language) {
  if (value == null) return '';
  if (language === 'ko') return String(value).trim();

  let cleaned = String(value);
  cleaned = cleaned.replace(/<br\s*\/?>\s*이 양식은 Health Professions[^<]*/gi, '');
  cleaned = cleaned.replace(/\s*\/\s*[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF\s().,&/:-]*/g, '');
  cleaned = cleaned.replace(/\s*[—-]\s*[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF\s().,&/:-]*/g, '');
  cleaned = cleaned.replace(/[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF][\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF\s().,&/:-]*/g, '');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.replace(/\s+([,.;:])/g, '$1');
  cleaned = cleaned.replace(/\(\s*\)/g, '');
  cleaned = cleaned.replace(/^\s+|\s+$/g, '');
  cleaned = cleaned.replace(/\s*\|\s*$/g, '');
  return cleaned.trim();
}

function normalizeWhitespace(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}



function firstString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function firstNonEmptyArray(...values) {
  for (const value of values) {
    if (Array.isArray(value) && value.length) {
      return value;
    }
  }
  return [];
}

function slugify(value) {
  return (
    String(value ?? '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'form'
  );
}

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('`', '&#96;');
}

function text(key) {
  return I18N[state.language]?.[key] ?? I18N.en[key] ?? key;
}

function read(key) {
  try {
    return window.localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function save(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures.
  }
}

function readTheme() {
  const stored = read(STORAGE.theme);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return THEME_MEDIA?.matches ? 'dark' : 'light';
}

function hasStoredThemePreference() {
  const stored = read(STORAGE.theme);
  return stored === 'light' || stored === 'dark';
}

function readLanguage() {
  const requested = PAGE_PARAMS.get('lang') || '';
  if (['en', 'ko'].includes(requested)) {
    return requested;
  }
  const stored = read(STORAGE.language);
  return ['en', 'ko'].includes(stored) ? stored : 'en';
}

function applyLanguage() {
  document.documentElement.lang = state.language;
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.style.colorScheme = state.theme;
  if (el.themeColorMeta) {
    el.themeColorMeta.setAttribute('content', THEME_COLORS[state.theme] || THEME_COLORS.light);
  }
}

function setTheme(theme, {persist = true} = {}) {
  state.theme = theme === 'dark' ? 'dark' : 'light';
  applyTheme();
  renderThemeButtons();
  if (persist) {
    save(STORAGE.theme, state.theme);
  }
}

function announce(message) {
  if (el.announcer) {
    el.announcer.textContent = message;
  }
}

function onSystemThemeChange(event) {
  if (hasStoredThemePreference()) return;
  state.theme = event.matches ? 'dark' : 'light';
  applyTheme();
  renderThemeButtons();
}

function onStorageChange(event) {
  if (event.key === STORAGE.language && ['en', 'ko'].includes(event.newValue || '')) {
    state.language = event.newValue || 'en';
    applyLanguage();
    renderLanguageChange();
  }

  if (event.key === STORAGE.theme) {
    state.theme = readTheme();
    applyTheme();
    renderThemeButtons();
  }

  if (event.key === STORAGE.activeForm) {
    const next = event.newValue || '';
    if (next && next !== state.activeFormId && state.forms.some(form => form.id === next)) {
      setActiveForm(next);
    }
  }

  if (event.key === STORAGE.location) {
    const next = event.newValue || '';
    if (next && next !== state.location) {
      setLocation(next);
      if (el.locationSelect) el.locationSelect.value = state.location;
    }
  }
}
