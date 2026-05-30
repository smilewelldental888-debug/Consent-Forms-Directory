const feedbackUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSd1yPpjbJrKsVc9fXvOcOuEmlb4mcUrsbC1_m_Gh0wrtOsADw/viewform?usp=dialog';

const staffTools = [
  {
    name: 'Switbot',
    category: 'AI Tool',
    description: 'Ask quick Smile Well workflow, communication, and office-support questions.',
    buttonText: 'Open Tool',
    url: 'https://chatgpt.com/g/g-68f94293e558819192ea48e5d8e9721c-switbot',
  },
  {
    name: 'Procedure Code Assistant',
    category: 'AI Tool',
    description: 'Get help reviewing dental procedure code guidance and billing-related notes.',
    buttonText: 'Open Tool',
    url: 'https://chatgpt.com/g/g-692f7511348c8191890b124a46b55f06-procedure-code-assistant',
  },
  {
    name: 'Daily Report Assistant',
    category: 'AI Tool',
    description: 'Prepare or review daily production, collections, scheduling, and operations summaries.',
    buttonText: 'Open Tool',
    url: 'https://chatgpt.com/g/g-6927808275248191baf46361f2ceaa77-daily-report-assistant',
  },
  {
    name: 'Dental Notes Assistant',
    category: 'AI Tool',
    description: 'Draft structured dental note text for provider review and documentation support.',
    buttonText: 'Open Tool',
    url: 'https://chatgpt.com/g/g-6946ea0367088191afbc6ee43b289d4e-dental-notes-assistant',
  },
  {
    name: 'Live Dental Notes Tool',
    category: 'AI Tool',
    description: 'Open the live web-based notes tool for chairside or end-of-day note support.',
    buttonText: 'Open Tool',
    url: 'https://livedentalnotes.vercel.app/',
  },
  {
    name: 'Consent Forms Directory',
    category: 'Forms Tool',
    description: 'Quickly find and open organized Open Dental consent form links.',
    buttonText: 'Open Tool',
    url: 'https://opendental-forms-directory-deploy.vercel.app/',
  },
  {
    name: 'Staff Feedback Google Form',
    category: 'Feedback',
    description: 'Share ideas, workflow issues, training requests, or suggestions with the Smile Well team.',
    buttonText: 'Open Feedback Form',
    url: feedbackUrl,
  },
  {
    name: 'Patient Education Videos',
    category: 'Video Guide',
    description: 'Access patient-friendly videos for explaining treatment options and dental procedures.',
    buttonText: 'Watch Videos',
    url: 'https://www.youtube.com/watch?v=RhFeTUEPoQ0&list=PLVYpohA80z5YyweLpCuSKuKMHvU-zmUEg',
  },
  {
    name: 'Smile Well SOPs',
    category: 'Video Guide',
    description: 'Watch Smile Well-specific workflow, training, and standard operating procedure videos.',
    buttonText: 'Watch Videos',
    url: 'https://www.youtube.com/watch?v=au3wVpFkj2M&list=PLVYpohA80z5ZN7hOZfkG4690hUNl3Z2Ev',
  },
  {
    name: 'Open Dental SOPs',
    category: 'Video Guide',
    description: 'Review Open Dental workflow videos for front desk, clinical, and admin tasks.',
    buttonText: 'Watch Videos',
    url: 'https://www.youtube.com/watch?v=4ZAPol4qamI&list=PLVYpohA80z5bKPIOZ5XFzwCyE__pQ_ew_',
  },
  {
    name: 'Smile Well Dental',
    category: 'Company Website',
    description: 'Visit the public Smile Well Dental website for patient-facing clinic information and services.',
    buttonText: 'Visit Website',
    url: 'https://smilewelldental.ca',
  },
  {
    name: 'Smile Well Medical Spa',
    category: 'Company Website',
    description: 'Visit the public Smile Well Medical Spa website for treatments, services, and brand information.',
    buttonText: 'Visit Website',
    url: 'https://smilewellmedicalspa.com',
  },
  {
    name: 'Smile Well Dental Facebook',
    category: 'Social Media',
    group: 'Smile Well Dental',
    description: 'Open the Smile Well Dental Facebook page for posts, updates, and community content.',
    buttonText: 'Open Social Page',
    url: 'https://www.facebook.com/smilewelldentalgroup/',
  },
  {
    name: 'Smile Well Dental Instagram',
    category: 'Social Media',
    group: 'Smile Well Dental',
    description: 'Open the Smile Well Dental Instagram page for photos, reels, and brand content.',
    buttonText: 'Open Social Page',
    url: 'https://www.instagram.com/smile.well.dental/',
  },
  {
    name: 'Smile Well Dental TikTok',
    category: 'Social Media',
    group: 'Smile Well Dental',
    description: 'Open the Smile Well Dental TikTok page for short-form videos and patient-facing content.',
    buttonText: 'Open Social Page',
    url: 'https://www.tiktok.com/@smilewelldental_bc',
  },
  {
    name: 'Smile Well Medical Spa Facebook',
    category: 'Social Media',
    group: 'Smile Well Medical Spa',
    description: 'Open the Smile Well Medical Spa Facebook page for posts, promotions, and updates.',
    buttonText: 'Open Social Page',
    url: 'https://www.facebook.com/profile.php?id=61583929072581',
  },
  {
    name: 'Smile Well Medical Spa Instagram',
    category: 'Social Media',
    group: 'Smile Well Medical Spa',
    description: 'Open the Smile Well Medical Spa Instagram page for treatment content, photos, and reels.',
    buttonText: 'Open Social Page',
    url: 'https://www.instagram.com/smile.well.medical/',
  },
  {
    name: 'Smile Well Medical Spa / Acupuncture TikTok',
    category: 'Social Media',
    group: 'Smile Well Medical Spa',
    description: 'Open the Smile Well Medical Spa and acupuncture TikTok page for short-form treatment content.',
    buttonText: 'Open Social Page',
    url: 'https://www.tiktok.com/@smilewell_acupuncture',
  },
];

const filters = ['All', 'AI Tools', 'Feedback', 'Videos', 'Websites', 'Social Media'];
const filterCategoryMap = {
  'AI Tools': new Set(['AI Tool', 'Forms Tool']),
  Feedback: new Set(['Feedback']),
  Videos: new Set(['Video Guide']),
  Websites: new Set(['Company Website']),
  'Social Media': new Set(['Social Media']),
};

const sectionOrder = [
  'AI Tools',
  'Feedback',
  'YouTube Playlists / Video Guides',
  'Company Public Websites',
  'Social Media',
];

const iconPaths = {
  bot: 'M12 3v3m-5 4h10a3 3 0 013 3v3a4 4 0 01-4 4H8a4 4 0 01-4-4v-3a3 3 0 013-3zm2 5l1-2 1 2 2 1-2 1-1 2-1-2-2-1 2-1zM9 15h.01M15 15h.01',
  clipboard: 'M9 4h6l1 2h3v14H5V6h3l1-2zm0 6h6m-6 4h6',
  chart: 'M5 19V9m7 10V5m7 14v-7M3 19h18',
  note: 'M6 4h9l3 3v13H6V4zm9 0v4h4M9 12h6m-6 4h4',
  mic: 'M12 4a3 3 0 00-3 3v4a3 3 0 006 0V7a3 3 0 00-3-3zm-6 7a6 6 0 0012 0M12 17v4',
  folder: 'M3 7h7l2 2h9v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
  feedback: 'M4 5h16v11H8l-4 4V5zm5 5h6m-6 3h4',
  youtube: 'M4 7.5A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v9a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 16.5v-9zM10 9l5 3-5 3V9z',
  globe: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 0c3 3 3 15 0 18m0-18c-3 3-3 15 0 18M4 12h16',
  facebook: 'M14 8h2V5h-2c-3 0-5 2-5 5v2H7v3h2v6h4v-6h3l1-3h-4v-2c0-1 .5-2 1-2z',
  instagram: 'M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4zm5 5a4 4 0 100 8 4 4 0 000-8zm5-1h.01',
  tiktok: 'M13 3v10.5a3.5 3.5 0 11-3.5-3.5c.5 0 1 .1 1.5.3V6h2a5 5 0 004 4v3a8 8 0 01-4-1.1',
};

const state = {
  query: '',
  filter: 'All',
};

const elements = {
  toolSections: document.querySelector('#toolSections'),
  searchInput: document.querySelector('#toolSearch'),
  filterChips: document.querySelector('#filterChips'),
  emptyMessage: document.querySelector('#emptyToolsMessage'),
};

renderFilters();
renderTools();
bindEvents();

function bindEvents() {
  elements.searchInput?.addEventListener('input', event => {
    state.query = event.target.value.trim().toLowerCase();
    renderTools();
  });
}

function renderFilters() {
  if (!elements.filterChips) return;
  const chips = filters.map(filter => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'staff-filter__chip';
    button.textContent = filter;
    button.setAttribute('aria-pressed', String(filter === state.filter));
    button.addEventListener('click', () => {
      state.filter = filter;
      renderFilters();
      renderTools();
    });
    if (filter === state.filter) {
      button.classList.add('is-active');
    }
    return button;
  });
  elements.filterChips.replaceChildren(...chips);
}

function renderTools() {
  if (!elements.toolSections) return;
  const visibleTools = staffTools.filter(tool => matchesFilter(tool) && matchesSearch(tool));
  elements.emptyMessage?.classList.toggle('is-hidden', visibleTools.length > 0);

  const sections = groupTools(visibleTools).map(([title, tools]) => createToolGroup(title, tools));
  elements.toolSections.replaceChildren(...sections);
}

function matchesFilter(tool) {
  if (state.filter === 'All') return true;
  return filterCategoryMap[state.filter]?.has(tool.category) || false;
}

function matchesSearch(tool) {
  if (!state.query) return true;
  return [tool.name, tool.category, tool.group, tool.description]
    .filter(Boolean)
    .some(value => value.toLowerCase().includes(state.query));
}

function groupTools(tools) {
  const groups = new Map();
  tools.forEach(tool => {
    const title = getSectionTitle(tool);
    if (!groups.has(title)) {
      groups.set(title, []);
    }
    groups.get(title).push(tool);
  });

  return sectionOrder
    .filter(title => groups.has(title))
    .map(title => [title, groups.get(title)]);
}

function getSectionTitle(tool) {
  if (tool.category === 'AI Tool' || tool.category === 'Forms Tool') return 'AI Tools';
  if (tool.category === 'Video Guide') return 'YouTube Playlists / Video Guides';
  if (tool.category === 'Company Website') return 'Company Public Websites';
  if (tool.category === 'Social Media') return 'Social Media';
  return tool.category;
}
function createToolGroup(title, tools) {
  const section = document.createElement('section');
  section.className = 'tool-group';
  section.setAttribute('aria-labelledby', getSectionId(title));

  const header = document.createElement('div');
  header.className = 'tool-group__header';

  const heading = document.createElement('h3');
  heading.className = 'tool-group__title';
  heading.id = getSectionId(title);
  heading.textContent = title;

  const count = document.createElement('span');
  count.className = 'tool-group__count';
  count.textContent = `${tools.length} ${tools.length === 1 ? 'resource' : 'resources'}`;

  const grid = createToolGrid(title, tools);

  header.append(heading, count);
  section.append(header, grid);
  return section;
}
function createToolGrid(title, tools) {
  if (title !== 'Social Media') {
    const grid = document.createElement('div');
    grid.className = 'staff-tool-grid';
    grid.replaceChildren(...tools.map(createToolCard));
    return grid;
  }

  const socialWrap = document.createElement('div');
  socialWrap.className = 'social-group-list';
  ['Smile Well Dental', 'Smile Well Medical Spa'].forEach(groupName => {
    const groupTools = tools.filter(tool => tool.group === groupName);
    if (!groupTools.length) return;
    const group = document.createElement('section');
    group.className = 'social-group';
    const heading = document.createElement('h4');
    heading.textContent = groupName;
    const grid = document.createElement('div');
    grid.className = 'staff-tool-grid social-grid';
    grid.replaceChildren(...groupTools.map(createToolCard));
    group.append(heading, grid);
    socialWrap.append(group);
  });
  return socialWrap;
}
function createToolCard(tool) {
  const article = document.createElement('article');
  article.className = 'tool-card';
  if (tool.category === 'Social Media') {
    article.classList.add('tool-card--social');
  }

  const body = document.createElement('div');
  body.className = 'tool-card__body';

  const icon = createIcon(tool);
  const topline = document.createElement('div');
  topline.className = 'tool-card__topline';

  const category = document.createElement('p');
  category.className = 'tool-card__category';
  category.textContent = tool.group ? `${tool.category} · ${tool.group}` : tool.category;
  topline.append(icon, category);

  const title = document.createElement('h3');
  title.textContent = getDisplayName(tool);

  const description = document.createElement('p');
  description.textContent = tool.description;

  const link = document.createElement('a');
  link.className = 'tool-card__button';
  link.href = tool.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = getCtaText(tool);

  body.append(topline, title, description);
  article.append(body, link);
  if (tool.category === 'Social Media') {
    article.prepend(icon);
    topline.remove();
  }
  return article;
}
function createIcon(tool) {
  const iconName = getIconName(tool);
  const span = document.createElement('span');
  span.className = `tool-icon tool-icon--${iconName}`;
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${iconPaths[iconName]}"/></svg>`;
  return span;
}
function getIconName(tool) {
  if (tool.name.includes('Facebook')) return 'facebook';
  if (tool.name.includes('Instagram')) return 'instagram';
  if (tool.name.includes('TikTok')) return 'tiktok';
  if (tool.category === 'Video Guide') return 'youtube';
  if (tool.category === 'Company Website') return 'globe';
  if (tool.category === 'Feedback') return 'feedback';
  if (tool.name === 'Switbot') return 'bot';
  if (tool.name.includes('Procedure')) return 'clipboard';
  if (tool.name.includes('Daily')) return 'chart';
  if (tool.name === 'Live Dental Notes Tool') return 'mic';
  if (tool.name.includes('Notes')) return 'note';
  if (tool.name.includes('Consent')) return 'folder';
  return 'globe';
}
function getDisplayName(tool) {
  if (tool.category !== 'Social Media') return tool.name;
  return tool.name.replace('Smile Well Dental ', '').replace('Smile Well Medical Spa ', '');
}
function getCtaText(tool) {
  if (tool.category === 'Social Media') return 'Open ↗';
  return `${tool.buttonText} ↗`;
}

function getSectionId(title) {
  return `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}
