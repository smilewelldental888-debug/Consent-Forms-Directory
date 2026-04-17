export const MEDIA_FAILURE_REASONS = {
  INVALID_URL: 'invalid_url',
  UNSUPPORTED_FORMAT: 'unsupported_format',
  PROVIDER_BLOCKED: 'provider_blocked',
  PERMISSION_OR_SHARING: 'permission_or_sharing',
  APP_SECURITY: 'app_security',
  UNKNOWN: 'unknown',
};

const HTTP_PROTOCOLS = new Set(['http:', 'https:']);
const DIRECT_VIDEO_EXTENSIONS = new Set(['.mp4', '.m4v', '.mov', '.webm', '.ogg', '.ogv']);
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{6,}$/;

function normalizePlatformHint(platform) {
  const value = String(platform || '').trim().toLowerCase();
  if (value === 'yt') return 'youtube';
  if (value === 'youtube' || value === 'drive') return value;
  return value;
}

function hasDirectVideoExtension(pathname = '') {
  const normalizedPath = String(pathname || '').toLowerCase();
  return Array.from(DIRECT_VIDEO_EXTENSIONS).some(ext => normalizedPath.endsWith(ext));
}

function isYouTubeHost(hostname = '') {
  const host = String(hostname || '').replace(/^www\./, '').toLowerCase();
  return host === 'youtu.be' || host.includes('youtube.com') || host.includes('youtube-nocookie.com');
}

function isDriveHost(hostname = '') {
  return String(hostname || '').replace(/^www\./, '').toLowerCase().includes('drive.google.com');
}

function getDefaultBaseHref(baseHref = '') {
  if (baseHref) return baseHref;
  if (typeof window !== 'undefined' && window.location?.href) {
    return window.location.href;
  }
  return 'http://localhost/';
}

function getDefaultOrigin(origin = '') {
  if (origin) return origin;
  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
    return window.location.origin;
  }
  return '';
}

export function parseMediaUrl(url, {baseHref = ''} = {}) {
  const value = typeof url === 'string' ? url.trim() : '';
  if (!value) return null;

  try {
    return new URL(value, getDefaultBaseHref(baseHref));
  } catch {
    return null;
  }
}

function extractYouTubeIdFromParsed(parsed, rawUrl = '') {
  if (parsed) {
    if (isYouTubeHost(parsed.hostname) && parsed.hostname.replace(/^www\./, '') === 'youtu.be') {
      const shortId = parsed.pathname.split('/').filter(Boolean)[0] || '';
      return YOUTUBE_ID_PATTERN.test(shortId) ? shortId : '';
    }

    if (isYouTubeHost(parsed.hostname)) {
      const watchId = parsed.searchParams.get('v') || '';
      if (YOUTUBE_ID_PATTERN.test(watchId)) return watchId;

      const parts = parsed.pathname.split('/').filter(Boolean);
      const index = parts.findIndex(part => ['embed', 'shorts', 'live', 'v'].includes(part));
      const pathId = index >= 0 ? parts[index + 1] || '' : '';
      if (YOUTUBE_ID_PATTERN.test(pathId)) return pathId;
    }
  }

  const rawValue = String(rawUrl || '');
  const watchMatch = rawValue.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  if (watchMatch && YOUTUBE_ID_PATTERN.test(watchMatch[1])) return watchMatch[1];

  const shortMatch = rawValue.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  if (shortMatch && YOUTUBE_ID_PATTERN.test(shortMatch[1])) return shortMatch[1];

  const embedMatch = rawValue.match(/\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{6,})/);
  if (embedMatch && YOUTUBE_ID_PATTERN.test(embedMatch[1])) return embedMatch[1];

  return '';
}

function extractYouTubeStartTime(parsed, rawUrl) {
  if (parsed) {
    const startParam = parsed.searchParams.get('start') || parsed.searchParams.get('t') || '';
    if (startParam) {
      const match = String(startParam).match(/^(\d+)/);
      if (match) return match[1];
    }
  }
  const rawValue = String(rawUrl || '');
  const startMatch = rawValue.match(/[?&](?:start|t)=(\d+)/);
  if (startMatch) return startMatch[1];
  return '';
}

function extractDriveIdFromParsed(parsed, rawUrl) {
  if (parsed) {
    const pathMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
    if (pathMatch?.[1]) return pathMatch[1];

    const queryId = parsed.searchParams.get('id');
    if (queryId) return queryId;
  }

  const rawValue = String(rawUrl || '');
  const pathMatch = rawValue.match(/\/file\/d\/([^/]+)/);
  if (pathMatch?.[1]) return pathMatch[1];

  const queryMatch = rawValue.match(/[?&]id=([^&]+)/);
  if (queryMatch?.[1]) return queryMatch[1];

  return '';
}

function buildCanonicalYouTubeUrlFromId(id, startTime) {
  if (!YOUTUBE_ID_PATTERN.test(id)) return '';
  let url = `https://youtu.be/${id}`;
  if (startTime && String(startTime).match(/^\d+$/)) {
    url += `?t=${startTime}s`;
  }
  return url;
}

function buildCanonicalDriveViewUrlFromId(id) {
  return id ? `https://drive.google.com/file/d/${id}/view` : '';
}

function buildYouTubeEmbedUrlFromId(id, {origin = '', startTime = ''} = {}) {
  if (!YOUTUBE_ID_PATTERN.test(id)) return '';

  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    enablejsapi: '1',
  });
  const safeOrigin = getDefaultOrigin(origin);
  if (safeOrigin && /^https?:/i.test(safeOrigin)) {
    params.set('origin', safeOrigin);
  }
  if (startTime && String(startTime).match(/^\d+$/)) {
    params.set('start', String(Number(startTime) || 0));
  }
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

function buildDrivePreviewUrlFromId(id) {
  return id ? `https://drive.google.com/file/d/${id}/preview` : '';
}

function classifyMediaCandidate(url, {baseHref = ''} = {}) {
  const sourceUrl = typeof url === 'string' ? url.trim() : '';
  if (!sourceUrl) {
    return {
      kind: 'fallback',
      provider: 'unknown',
      sourceUrl: '',
      reason: MEDIA_FAILURE_REASONS.INVALID_URL,
    };
  }

  const parsed = parseMediaUrl(sourceUrl, {baseHref});
  if (!parsed) {
    return {
      kind: 'fallback',
      provider: 'unknown',
      sourceUrl,
      reason: MEDIA_FAILURE_REASONS.INVALID_URL,
    };
  }

  if (!HTTP_PROTOCOLS.has(parsed.protocol)) {
    return {
      kind: 'fallback',
      provider: 'unknown',
      sourceUrl,
      reason: MEDIA_FAILURE_REASONS.APP_SECURITY,
    };
  }

  const normalizedUrl = parsed.toString();
  if (hasDirectVideoExtension(parsed.pathname)) {
    return {
      kind: 'video',
      provider: 'direct',
      sourceUrl: normalizedUrl,
      videoUrl: normalizedUrl,
    };
  }

  const youtubeId = extractYouTubeIdFromParsed(parsed, sourceUrl);
  if (youtubeId) {
    const startTime = extractYouTubeStartTime(parsed, sourceUrl);
    return {
      kind: 'iframe',
      provider: 'youtube',
      sourceUrl: buildCanonicalYouTubeUrlFromId(youtubeId, startTime),
      mediaId: youtubeId,
      startTime,
    };
  }
  if (isYouTubeHost(parsed.hostname)) {
    return {
      kind: 'fallback',
      provider: 'youtube',
      sourceUrl: normalizedUrl,
      reason: MEDIA_FAILURE_REASONS.INVALID_URL,
    };
  }

  const driveId = extractDriveIdFromParsed(parsed, sourceUrl);
  if (driveId) {
    return {
      kind: 'iframe',
      provider: 'drive',
      sourceUrl: buildCanonicalDriveViewUrlFromId(driveId),
      mediaId: driveId,
    };
  }
  if (isDriveHost(parsed.hostname)) {
    return {
      kind: 'fallback',
      provider: 'drive',
      sourceUrl: normalizedUrl,
      reason: MEDIA_FAILURE_REASONS.INVALID_URL,
    };
  }

  return {
    kind: 'fallback',
    provider: 'unknown',
    sourceUrl: normalizedUrl,
    reason: MEDIA_FAILURE_REASONS.UNSUPPORTED_FORMAT,
  };
}

export function isYouTubeUrl(url, {baseHref = ''} = {}) {
  const parsed = parseMediaUrl(url, {baseHref});
  return Boolean(parsed && isYouTubeHost(parsed.hostname));
}

export function isDriveUrl(url, {baseHref = ''} = {}) {
  const parsed = parseMediaUrl(url, {baseHref});
  return Boolean(parsed && isDriveHost(parsed.hostname));
}

export function isDirectMediaFileUrl(url, {baseHref = ''} = {}) {
  const parsed = parseMediaUrl(url, {baseHref});
  if (!parsed) return false;
  return hasDirectVideoExtension(parsed.pathname);
}

export function normalizeMediaPlatform(platform, url, {baseHref = ''} = {}) {
  const hint = normalizePlatformHint(platform);
  if (hint === 'youtube' || hint === 'drive') return hint;

  const candidate = classifyMediaCandidate(url, {baseHref});
  if (candidate.provider === 'youtube' || candidate.provider === 'drive') {
    return candidate.provider;
  }

  return hint;
}

export function extractYouTubeId(url, {baseHref = ''} = {}) {
  if (!url) return '';
  const parsed = parseMediaUrl(url, {baseHref});
  return extractYouTubeIdFromParsed(parsed, url);
}

export function buildCanonicalYouTubeUrl(url, {baseHref = ''} = {}) {
  const id = extractYouTubeId(url, {baseHref});
  return buildCanonicalYouTubeUrlFromId(id);
}

export function buildYouTubeEmbedUrl(url, {origin = '', baseHref = ''} = {}) {
  return buildYouTubeEmbedUrlFromId(extractYouTubeId(url, {baseHref}), {origin});
}

export function extractDriveId(url, {baseHref = ''} = {}) {
  if (!url) return '';
  const parsed = parseMediaUrl(url, {baseHref});
  return extractDriveIdFromParsed(parsed, url);
}

export function buildCanonicalDriveViewUrl(url, {baseHref = ''} = {}) {
  const id = extractDriveId(url, {baseHref});
  return buildCanonicalDriveViewUrlFromId(id);
}

export function buildDrivePreviewUrl(url, {baseHref = ''} = {}) {
  return buildDrivePreviewUrlFromId(extractDriveId(url, {baseHref}));
}

export function resolveMediaSource(url, platformHint, {origin = '', baseHref = ''} = {}) {
  const sourceUrl = typeof url === 'string' ? url.trim() : '';
  const platform = normalizeMediaPlatform(platformHint, sourceUrl, {baseHref});
  const candidate = classifyMediaCandidate(sourceUrl, {baseHref});

  switch (candidate.kind) {
    case 'video':
      return {
        kind: 'video',
        provider: 'direct',
        platform,
        sourceUrl: candidate.sourceUrl,
        videoUrl: candidate.videoUrl,
      };
    case 'iframe':
      if (candidate.provider === 'youtube') {
        const embedUrl = buildYouTubeEmbedUrlFromId(candidate.mediaId, {origin, startTime: candidate.startTime});
        return embedUrl
          ? {
              kind: 'iframe',
              provider: 'youtube',
              platform: 'youtube',
              sourceUrl: candidate.sourceUrl,
              embedUrl,
            }
          : {
              kind: 'fallback',
              provider: 'youtube',
              sourceUrl: candidate.sourceUrl,
              reason: MEDIA_FAILURE_REASONS.INVALID_URL,
            };
      }

      if (candidate.provider === 'drive') {
        const embedUrl = buildDrivePreviewUrlFromId(candidate.mediaId);
        return embedUrl
          ? {
              kind: 'iframe',
              provider: 'drive',
              platform: 'drive',
              sourceUrl: candidate.sourceUrl,
              embedUrl,
            }
          : {
              kind: 'fallback',
              provider: 'drive',
              sourceUrl: candidate.sourceUrl,
              reason: MEDIA_FAILURE_REASONS.INVALID_URL,
            };
      }
      break;
    default:
      break;
  }

  return {
    kind: 'fallback',
    provider: candidate.provider || platform || 'unknown',
    sourceUrl: candidate.sourceUrl,
    reason: candidate.reason || MEDIA_FAILURE_REASONS.UNKNOWN,
  };
}

export function classifyMediaFailure(source, {stage = 'preflight'} = {}) {
  if (stage === 'timeout') {
    if (source?.provider === 'youtube') return MEDIA_FAILURE_REASONS.PROVIDER_BLOCKED;
    if (source?.provider === 'drive') return MEDIA_FAILURE_REASONS.PERMISSION_OR_SHARING;
    return MEDIA_FAILURE_REASONS.UNKNOWN;
  }

  return source?.reason || MEDIA_FAILURE_REASONS.UNKNOWN;
}
