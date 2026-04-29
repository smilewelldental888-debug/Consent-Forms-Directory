import {resolveMediaSource} from './media-utils.js';

const DATA_URL = './data/forms.json';
const LOCATIONS_URL = './data/locations.json';
const PAGE_PARAMS = new URLSearchParams(window.location.search);
const IS_PREVIEW_SHELL = PAGE_PARAMS.get('preview-shell') === '1';
const IS_PATIENT_LINK = PAGE_PARAMS.get('patient') === '1';
const PATIENT_FORM_LIMIT = 3;
const PATIENT_FORM_IDS = parsePatientFormIds(PAGE_PARAMS.get('forms') || '');
const PATIENT_LOCATION = PAGE_PARAMS.get('location') || '';
const MEDIA_LOAD_TIMEOUT_MS = 8000;
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
  ko: 'KO',
};

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
    locationLoadFailed: 'Location data unavailable',
    locationLoadFailedFull: 'Locations unavailable. Please refresh or contact support.',
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
    copyPatientLink: 'Create Patient Link',
    copyPatientLinkCopied: 'Patient link copied.',
    copyPatientLinkFailed: 'Could not copy the patient link. Please try again.',
    patientLinkInvalidForms: 'This patient link does not include any available consent forms. Please ask staff to resend it.',
    patientLinkInvalidLocation: 'This patient link has an invalid clinic location. Please ask staff to resend it.',
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
    pdfPage: 'Page',
    pdfOf: 'of',
    pdfZoomIn: 'Zoom in',
    pdfZoomOut: 'Zoom out',
    pdfPrevPage: 'Previous page',
    pdfNextPage: 'Next page',
    pdfUnavailable: 'Preview unavailable. Please ask staff for assistance.',
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
    locationLoadFailed: '지점 데이터를 불러올 수 없습니다',
    locationLoadFailedFull: '지점 정보를 사용할 수 없습니다. 새로고침하거나 직원에게 문의하세요.',
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
    copyPatientLink: '환자 링크 만들기',
    copyPatientLinkCopied: '환자 링크가 복사되었습니다.',
    copyPatientLinkFailed: '환자 링크를 복사하지 못했습니다. 다시 시도해 주세요.',
    patientLinkInvalidForms: '이 환자 링크에는 사용 가능한 동의서가 없습니다. 직원에게 다시 요청해 주세요.',
    patientLinkInvalidLocation: '이 환자 링크의 지점 정보가 올바르지 않습니다. 직원에게 다시 요청해 주세요.',
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
    pdfPage: '페이지',
    pdfOf: '/',
    pdfZoomIn: '확대',
    pdfZoomOut: '축소',
    pdfPrevPage: '이전 페이지',
    pdfNextPage: '다음 페이지',
    pdfUnavailable: '미리보기를 사용할 수 없습니다. 직원에게 문의하세요.',
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
  patientLinkError: '',
  patientFormIds: [],
  patientLinkSelectedForms: [],
};

const el = {
  formList: document.querySelector('#formList'),
  emptyState: document.querySelector('#emptyState'),
  detailShell: document.querySelector('#detailShell'),
  detailBody: document.querySelector('#detailBody'),
  signFormTabButton: document.querySelector('#signFormTabButton'),
  createPatientLinkButton: document.querySelector('#createPatientLinkButton'),
  patientLinkModal: document.querySelector('#patientLinkModal'),
  patientLinkFormList: document.querySelector('#patientLinkFormList'),
  patientLinkLocationSelect: document.querySelector('#patientLinkLocationSelect'),
  copyPatientLinkButton: document.querySelector('#copyPatientLinkButton'),
  patientLinkCloseButtons: Array.from(document.querySelectorAll('[data-patient-link-close]')),
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
const sortedFormsCache = new Map();
const mediaRuntime = {
  youtube: createMediaRuntime(),
  drive: createMediaRuntime(),
};
let tabSliderFrame = 0;
let detailRenderToken = 0;

document.addEventListener('DOMContentLoaded', bootstrap);
window.addEventListener('storage', onStorageChange);

async function bootstrap() {
  state.theme = readTheme();
  state.language = readLanguage();
  document.documentElement.classList.toggle('is-preview-shell', IS_PREVIEW_SHELL);
  document.documentElement.classList.toggle('is-patient-link', IS_PATIENT_LINK);
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

    button.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const enabledButtons = el.tabButtons.filter(btn => !btn.disabled);
      if (enabledButtons.length < 2) return;
      const currentIndex = enabledButtons.indexOf(button);
      if (currentIndex < 0) return;
      const direction = e.key === 'ArrowLeft' ? -1 : 1;
      const nextIndex = (currentIndex + direction + enabledButtons.length) % enabledButtons.length;
      const targetButton = enabledButtons[nextIndex];
      targetButton.focus();
      const next = targetButton.dataset.tab;
      if (next && next !== state.activeTab) {
        pauseYouTubeIfLeaving(next);
        state.activeTab = next;
        renderTabs();
        renderDetail();
        announce(text(next === 'youtube' ? 'tabYouTube' : next === 'drive' ? 'tabDrive' : 'tabForm'));
      }
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

  el.createPatientLinkButton?.addEventListener('click', openPatientLinkModal);
  el.patientLinkCloseButtons.forEach(button => {
    button.addEventListener('click', closePatientLinkModal);
  });
  el.patientLinkFormList?.addEventListener('change', event => {
    const input = event.target instanceof Element ? event.target.closest('[data-patient-form-id]') : null;
    if (input instanceof HTMLInputElement) {
      updatePatientLinkCopyState();
    }
  });
  el.patientLinkLocationSelect?.addEventListener('change', updatePatientLinkCopyState);
  el.copyPatientLinkButton?.addEventListener('click', copyPatientLink);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && el.patientLinkModal && !el.patientLinkModal.classList.contains('is-hidden')) {
      closePatientLinkModal();
    }
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

function cancelActivePreviewLoad() {}

async function loadSiteData() {
  state.emptyMode = 'default';
  state.forms = [];
  sortedFormsCache.clear();
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
    const forms = normalizedForms.filter(hasUsableFormData);

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
      if (IS_PATIENT_LINK) {
        state.patientLinkError = 'location';
      }
      return;
    }

    state.locations = enabled;
    const defaultSlug = payload.defaultLocation || enabled[0].slug;
    const requested = PAGE_PARAMS.get('location') || '';
    const stored = read(STORAGE.location);
    const matchSlug = slug => enabled.some(loc => loc.slug === slug);

    if (IS_PATIENT_LINK) {
      if (!matchSlug(PATIENT_LOCATION)) {
        state.patientLinkError = 'location';
        populateLocationSelect();
        return;
      }

      state.location = PATIENT_LOCATION;
      applyLocationFormUrls();
      populateLocationSelect();
      return;
    }

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
    state.locationLoadFailed = true;
    if (IS_PATIENT_LINK) {
      state.patientLinkError = 'location';
    }
  }
}

function applyLocationFormUrls() {
  const loc = state.locations.find(l => l.slug === state.location);
  state.locationFormUrls = (loc && typeof loc.formUrls === 'object') ? loc.formUrls : {};
}

function populateLocationSelect() {
  if (!el.locationSelect) return;

  el.locationSelect.innerHTML = '';

  const controlGroup = el.locationSelect.closest('.control-group');
  const existingError = controlGroup?.querySelector('#locationSelectError');

  if (state.locationLoadFailed) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = text('locationLoadFailed');
    option.disabled = true;
    option.selected = true;
    el.locationSelect.appendChild(option);

    if (existingError instanceof HTMLElement) {
      existingError.textContent = text('locationLoadFailedFull');
      existingError.classList.remove('sr-only');
    }
    return;
  }

  if (existingError instanceof HTMLElement) {
    existingError.textContent = '';
    existingError.classList.add('sr-only');
  }

  for (const loc of state.locations) {
    const option = document.createElement('option');
    option.value = loc.slug;
    option.textContent = pickLocalized(loc.label, state.language) || loc.slug;
    el.locationSelect.appendChild(option);
  }
  el.locationSelect.value = state.location;
}

function setLocation(slug) {
  if (IS_PATIENT_LINK) return;
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

function normalizePlatform(platform, url) {
  const value = String(platform || '').toLowerCase();
  if (value.includes('drive') || /drive\.google\.com/i.test(url || '')) return 'drive';
  if (value.includes('youtube') || /youtu\.?be/i.test(url || '')) return 'youtube';
  return value || 'youtube';
}

function hasUsableFormData(form) {
  const pdfPath = resolvePdfPath(form, 'en') || resolvePdfPath(form, state.language);
  return Boolean(
    form &&
      displayName(form, 'en') &&
      (getFormSignUrl(form) || hasPreviewSource(form, 'en') || hasPreviewSource(form, state.language) || (form.videos || []).length || pdfPath),
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
  return getFormUrlVariant(url, '');
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
  if (IS_PATIENT_LINK) {
    if (state.patientLinkError) {
      state.activeFormId = '';
      state.patientFormIds = [];
      return;
    }

    const formIds = PATIENT_FORM_IDS.filter(id => state.forms.some(form => form.id === id));
    if (formIds.length < 1 || formIds.length > PATIENT_FORM_LIMIT) {
      state.patientLinkError = 'forms';
      state.activeFormId = '';
      state.patientFormIds = [];
      return;
    }

    state.patientFormIds = formIds;
    state.activeFormId = formIds[0] || '';
    state.activeTab = 'form';
    return;
  }

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
  refreshPatientLinkModal();
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
  refreshPatientLinkModal();
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
    document.title = 'Smile Well';
    return;
  }

  el.emptyState.classList.add('is-hidden');
  el.detailShell.classList.remove('is-hidden');

  const name = displayName(form, state.language);
  setActionButtonState(el.signFormTabButton, getEmbeddedFormUrl(getFormSignUrl(form)));

  document.title = `${name} - Smile Well`;
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
    button.setAttribute('tabindex', active ? '0' : '-1');
  });

  scheduleTabSliderSync();
}

function renderDetail() {
  detailRenderToken += 1;
  const renderToken = detailRenderToken;
  const form = getActiveVisibleForm();
  if (!form) {
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
      <section class="detail-pane" id="panel-form" data-detail-pane="form" role="tabpanel" aria-labelledby="tab-form"></section>
      <section class="detail-pane is-hidden" id="panel-youtube" data-detail-pane="youtube" aria-hidden="true" role="tabpanel" aria-labelledby="tab-youtube"></section>
      <section class="detail-pane is-hidden" id="panel-drive" data-detail-pane="drive" aria-hidden="true" role="tabpanel" aria-labelledby="tab-drive"></section>
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

  const pdfPath = resolvePdfPath(form, state.language);
  host.innerHTML = '';
  host.scrollTop = 0;
  renderPdfPreview(pdfPath, 'docPreviewHost');
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
              ${signHref ? `href="${esc(signHref)}" target="_blank" rel="noopener noreferrer"` : 'aria-disabled="true"'}
            >
              <span class="action-button__label">${esc(text('signDocumentAction'))}</span>
            </a>
          </section>
        </div>
      </section>
    </div>
  `;
}

function resolvePdfPath(form, language) {
  const raw = form?.pdfPath;
  if (!raw) return '';
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw !== 'object') return '';

  const isKo = language === 'ko';
  if (isKo) {
    return firstString(raw.ko, raw.en);
  }

  return firstString(raw.en, raw.ko);
}

async function renderPdfPreview(pdfPath, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  if (!pdfPath) {
    container.innerHTML = renderPreviewUnavailableMarkup();
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'pdf-viewer';

  const toolbar = document.createElement('div');
  toolbar.className = 'pdf-toolbar';

  const pageCounter = document.createElement('span');
  pageCounter.className = 'pdf-toolbar__counter';
  pageCounter.textContent = `${text('pdfPage')} 1 ${text('pdfOf')} 1`;

  const navGroup = document.createElement('div');
  navGroup.className = 'pdf-toolbar__group';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'pdf-toolbar__btn';
  prevBtn.textContent = '\u2190';
  prevBtn.setAttribute('aria-label', text('pdfPrevPage'));

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'pdf-toolbar__btn';
  nextBtn.textContent = '\u2192';
  nextBtn.setAttribute('aria-label', text('pdfNextPage'));

  navGroup.appendChild(prevBtn);
  navGroup.appendChild(nextBtn);

  const zoomGroup = document.createElement('div');
  zoomGroup.className = 'pdf-toolbar__group';

  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.type = 'button';
  zoomOutBtn.className = 'pdf-toolbar__btn';
  zoomOutBtn.textContent = '\u2212';
  zoomOutBtn.setAttribute('aria-label', text('pdfZoomOut'));

  const zoomInBtn = document.createElement('button');
  zoomInBtn.type = 'button';
  zoomInBtn.className = 'pdf-toolbar__btn';
  zoomInBtn.textContent = '+';
  zoomInBtn.setAttribute('aria-label', text('pdfZoomIn'));

  zoomGroup.appendChild(zoomOutBtn);
  zoomGroup.appendChild(zoomInBtn);

  toolbar.appendChild(navGroup);
  toolbar.appendChild(pageCounter);
  toolbar.appendChild(zoomGroup);

  const canvas = document.createElement('canvas');
  canvas.className = 'pdf-viewer__canvas';

  wrapper.appendChild(toolbar);
  wrapper.appendChild(canvas);
  container.appendChild(wrapper);

  let currentPage = 1;
  let totalPages = 1;
  let currentScale = 1.5;
  let pdfDoc = null;

  async function renderPage(pageNum) {
    if (!pdfDoc) return;
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({scale: currentScale});

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const context = canvas.getContext('2d');
    await page.render({canvasContext: context, viewport}).promise;

    pageCounter.textContent = `${text('pdfPage')} ${pageNum} ${text('pdfOf')} ${totalPages}`;
    prevBtn.disabled = pageNum <= 1;
    nextBtn.disabled = pageNum >= totalPages;
  }

  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage(currentPage);
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderPage(currentPage);
    }
  });

  zoomInBtn.addEventListener('click', () => {
    currentScale = Math.min(currentScale + 0.25, 4);
    renderPage(currentPage);
  });

  zoomOutBtn.addEventListener('click', () => {
    currentScale = Math.max(currentScale - 0.25, 0.5);
    renderPage(currentPage);
  });

  try {
    const lib = window.pdfjsLib;
    if (!lib) throw new Error('PDF.js not loaded');
    pdfDoc = await lib.getDocument(pdfPath).promise;
    totalPages = pdfDoc.numPages;
    await renderPage(currentPage);
  } catch {
    container.innerHTML = '';
    const errorEl = document.createElement('div');
    errorEl.className = 'pdf-viewer__error';
    errorEl.textContent = text('pdfUnavailable');
    container.appendChild(errorEl);
  }
}

function renderPreviewUnavailableMarkup() {
  return '<p class="preview-unavailable">Preview not available for this form.</p>';
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
              sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
              allow="autoplay; encrypted-media"
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
          ? `<a class="action-button action-button--ghost" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(actionLabel)}</a>`
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
    <a class="muted-link" href="${esc(sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(text('openVideo'))}</a>
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
    <a class="muted-link" href="${esc(sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(text('openVideo'))}</a>
  `;
}

function startMediaLoad(platform, frame, fallbackHost, frameFooter, sourceUrl, embedUrl) {
  const runtime = clearMediaRuntime(platform);
  runtime.embedUrl = embedUrl;
  runtime.sourceUrl = sourceUrl;
  runtime.status = 'loading';
  const isYouTube = platform === 'youtube';

  // Keep iframe visible while loading for both YouTube and Drive
  hideMediaFallback(fallbackHost);
  renderMediaFooter(frameFooter, sourceUrl);
  frame.classList.remove('is-hidden');

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

    // Keep iframe visible on timeout, show advisory footer
    renderMediaFooterWithAdvisory(frameFooter, sourceUrl, text('mediaTimeoutBody'));
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

  if (runtime.status === 'ready') {
    renderMediaFooter(frameFooter, runtime.sourceUrl);
    hideMediaFallback(fallbackHost);
    frame.classList.remove('is-hidden');
    return;
  }

  if (runtime.status === 'timeout') {
    // Keep iframe visible on timeout, show advisory footer
    renderMediaFooterWithAdvisory(frameFooter, runtime.sourceUrl, text('mediaTimeoutBody'));
    frame.classList.remove('is-hidden');
    hideMediaFallback(fallbackHost);
    return;
  }

  if (runtime.status === 'loading') {
    // Keep iframe visible while loading
    renderMediaFooter(frameFooter, runtime.sourceUrl);
    frame.classList.remove('is-hidden');
    hideMediaFallback(fallbackHost);
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
  if (state.patientLinkError === 'forms') {
    return {
      eyebrow: text('emptyEyebrow'),
      title: text('patientLinkInvalidForms'),
      body: text('patientLinkInvalidForms'),
    };
  }

  if (state.patientLinkError === 'location') {
    return {
      eyebrow: text('emptyEyebrow'),
      title: text('patientLinkInvalidLocation'),
      body: text('patientLinkInvalidLocation'),
    };
  }

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

function openPatientLinkModal() {
  if (IS_PATIENT_LINK || !el.patientLinkModal) return;

  const activeForm = getActiveVisibleForm();
  state.patientLinkSelectedForms = activeForm ? [activeForm.id] : [];
  renderPatientLinkModal();
  el.patientLinkModal.classList.remove('is-hidden');
  el.patientLinkModal.removeAttribute('aria-hidden');

  const firstCheckbox = el.patientLinkFormList?.querySelector('[data-patient-form-id]');
  if (firstCheckbox instanceof HTMLInputElement) {
    firstCheckbox.focus();
  } else {
    el.patientLinkLocationSelect?.focus();
  }
}

function closePatientLinkModal() {
  if (!el.patientLinkModal) return;
  el.patientLinkModal.classList.add('is-hidden');
  el.patientLinkModal.setAttribute('aria-hidden', 'true');
  el.createPatientLinkButton?.focus();
}

function refreshPatientLinkModal() {
  if (!el.patientLinkModal || el.patientLinkModal.classList.contains('is-hidden')) return;
  renderPatientLinkModal();
}

function renderPatientLinkModal() {
  renderPatientLinkFormOptions();
  renderPatientLinkLocationOptions();
  updatePatientLinkCopyState();
}

function renderPatientLinkFormOptions() {
  if (!el.patientLinkFormList) return;

  const forms = sortForms(state.forms, state.language);
  const availableIds = new Set(forms.map(form => form.id));
  state.patientLinkSelectedForms = state.patientLinkSelectedForms
    .filter(id => availableIds.has(id))
    .slice(0, PATIENT_FORM_LIMIT);

  if (!forms.length) {
    el.patientLinkFormList.innerHTML = `<p class="patient-link-form-list__empty">${esc(text('noDataTitle'))}</p>`;
    return;
  }

  const selected = new Set(state.patientLinkSelectedForms);
  el.patientLinkFormList.innerHTML = forms
    .map(form => {
      const checked = selected.has(form.id) ? ' checked' : '';
      return `
        <label class="patient-link-option">
          <input type="checkbox" value="${esc(form.id)}" data-patient-form-id="${esc(form.id)}"${checked}>
          <span>${esc(displayName(form, state.language))}</span>
        </label>
      `;
    })
    .join('');
}

function renderPatientLinkLocationOptions() {
  if (!el.patientLinkLocationSelect) return;

  const current = el.patientLinkLocationSelect.value || state.location;
  el.patientLinkLocationSelect.innerHTML = state.locations
    .map(loc => {
      const label = pickLocalized(loc.label, state.language) || loc.slug;
      return `<option value="${esc(loc.slug)}">${esc(label)}</option>`;
    })
    .join('');

  el.patientLinkLocationSelect.value = state.locations.some(loc => loc.slug === current)
    ? current
    : state.location;
}

function updatePatientLinkCopyState() {
  const selected = getSelectedPatientLinkFormIds();
  const atLimit = selected.length >= PATIENT_FORM_LIMIT;
  const validLocation = isKnownLocation(el.patientLinkLocationSelect?.value || '');

  el.patientLinkFormList?.querySelectorAll('[data-patient-form-id]').forEach(input => {
    if (!(input instanceof HTMLInputElement)) return;
    input.disabled = !input.checked && atLimit;
  });

  if (el.copyPatientLinkButton) {
    el.copyPatientLinkButton.disabled =
      selected.length < 1 || selected.length > PATIENT_FORM_LIMIT || !validLocation;
  }
}

function getSelectedPatientLinkFormIds() {
  const selected = Array.from(el.patientLinkFormList?.querySelectorAll('[data-patient-form-id]:checked') || [])
    .filter(input => input instanceof HTMLInputElement)
    .map(input => input.value)
    .filter(Boolean);
  state.patientLinkSelectedForms = selected;
  return selected;
}

async function copyPatientLink() {
  const formIds = getSelectedPatientLinkFormIds();
  const locationSlug = el.patientLinkLocationSelect?.value || '';
  if (formIds.length < 1 || formIds.length > PATIENT_FORM_LIMIT || !isKnownLocation(locationSlug)) {
    updatePatientLinkCopyState();
    return;
  }

  try {
    await writeClipboardText(buildPatientLinkUrl(formIds, locationSlug));
    closePatientLinkModal();
    announce(text('copyPatientLinkCopied'));
  } catch {
    announce(text('copyPatientLinkFailed'));
  }
}

function buildPatientLinkUrl(formIds, locationSlug) {
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const params = [
    'patient=1',
    `forms=${formIds.map(encodeURIComponent).join(',')}`,
    `location=${encodeURIComponent(locationSlug)}`,
    `lang=${encodeURIComponent(state.language)}`,
  ];
  return `${baseUrl}?${params.join('&')}`;
}

async function writeClipboardText(value) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  document.body.append(textarea);
  textarea.focus();
  textarea.select();

  try {
    if (!document.execCommand('copy')) {
      throw new Error('Copy command failed');
    }
  } finally {
    textarea.remove();
  }
}

function isKnownLocation(slug) {
  return state.locations.some(loc => loc.slug === slug);
}

function setActiveForm(formId) {
  if (!formId || formId === state.activeFormId) return;
  pauseYouTubeIfLeaving('form');
  const previousFormId = state.activeFormId;
  state.activeFormId = formId;
  state.activeTab = 'form';
  if (!IS_PATIENT_LINK) {
    save(STORAGE.activeForm, formId);
  }

  const form = getActiveVisibleForm();
  const externalUrl = form?.externalUrl?.trim();
  if (externalUrl) {
    renderSidebarSelection(previousFormId, formId);
    window.open(externalUrl, '_blank', 'noopener,noreferrer');
    announce(form ? displayName(form, state.language) : text('emptyTitle'));
    return;
  }

  renderSidebarSelection(previousFormId, formId);
  renderMain();
  renderTabs();
  renderDetail();
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
  if (lang.startsWith('ko')) return 'KO';
  if (lang.startsWith('en')) return 'EN';
  return lang.substring(0, 2).toUpperCase();
}

function getPlatformVideos(form, platform) {
  const items = (form.videos || []).filter(item => item.platform === platform);
  if (!items.length) return [];

  const preferredLanguage = state.language === 'ko' ? 'ko' : 'en';
  const matching = items.filter(item => {
    const language = String(item.language || '').toLowerCase();
    return preferredLanguage === 'ko' ? language === 'ko' : language === 'en';
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
  if (IS_PATIENT_LINK) {
    if (state.patientLinkError) return [];
    return state.patientFormIds
      .map(id => state.forms.find(form => form.id === id))
      .filter(Boolean);
  }

  const cacheKey = state.language;
  if (!sortedFormsCache.has(cacheKey)) {
    sortedFormsCache.set(cacheKey, sortForms(state.forms, state.language));
  }
  return sortedFormsCache.get(cacheKey) || [];
}

function syncActiveFormToVisibleResults() {
  const visible = getVisibleForms();

  if (IS_PATIENT_LINK && state.patientLinkError) {
    state.activeFormId = '';
    return;
  }

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

function parsePatientFormIds(value) {
  const ids = [];
  const seen = new Set();

  for (const raw of String(value || '').split(',')) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    ids.push(id);
    seen.add(id);
  }

  return ids;
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
  const isKo = language === 'ko';
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

function hasPreviewSource(form, language = state.language) {
  const hasInline =
    form &&
    firstNonEmpty(
      pickLocalized(form.docPreviewHtml, language),
      pickLocalized(form.docPreviewText, language),
      pickLocalized(form.docPreviewHtml, 'en'),
      pickLocalized(form.docPreviewText, 'en'),
    );
  return Boolean(form?.previewDataUrl || form?.hasDocxPreview || hasInline);
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

  if (!IS_PATIENT_LINK && event.key === STORAGE.activeForm) {
    const next = event.newValue || '';
    if (next && next !== state.activeFormId && state.forms.some(form => form.id === next)) {
      setActiveForm(next);
    }
  }

  if (!IS_PATIENT_LINK && event.key === STORAGE.location) {
    const next = event.newValue || '';
    if (next && next !== state.location) {
      setLocation(next);
      if (el.locationSelect) el.locationSelect.value = state.location;
    }
  }
}
