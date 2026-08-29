const JSON_FILE_PATH = 'data/students_all_years.json';

const TAG_CATEGORIES = {
    '表現技法': [
        '3Dモデリング', 'AIモデリング', 'Blender', 'Live2D', 'ピクセルアート',
        '音声合成', 'ゲーム開発', 'Unity', 'ティラノビルダー', 'デジタルファブリケーション',
        'VR', 'AR', 'TouchDesigner', 'プログラミング', 'モーショングラフィックス',
        'シネマグラフ', 'コマ撮り', '作字', 'ZINE', '絵本', 'アニメーション制作',
        '映像制作', 'ウェブ制作', 'アプリ開発', 'SNS', 'ブロックチェーン',
        'ジェネラティブ', 'タイポグラフィ', '体験型メディア', 'デジタル音楽', 'デジタルイラスト'
    ],
    'テーマ': [
        'キャラクターデザイン', 'VTuber', '空間デザイン', 'UI・UXデザイン',
        'グラフィックデザイン', 'ファッション', '世界観', '物語', 'シナリオ',
        'イラスト', 'マンガ', 'メディアアート', '体験のデザイン', '文化研究',
        '音楽', '記憶', '感情', '社会', '自然', '身体表現', '日常', '地域',
        'コミュニティ', 'アイデンティティ', 'ブランディング', 'スポーツ', '風景',
        'デザイン研究', 'スペキュラティブデザイン', 'ペルソナ分析', 'Live配信',
        '平面と立体', '質感表現', '創作活動', '総合芸術', 'ホラー', '造形'
    ]
};

let studentsData = [];
let selectedYears = new Set();
let selectedTags = new Set();
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
});

function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-filters-btn');
    const clearBtnAlt = document.getElementById('clear-filters-btn-alt');

    searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value.trim().toLowerCase();
        renderResults();
    });

    const clearFilters = () => {
        searchQuery = '';
        searchInput.value = '';
        selectedYears.clear();
        selectedTags.clear();
        updateFilterUI();
        renderResults();
    };

    clearBtn.addEventListener('click', clearFilters);
    if (clearBtnAlt) clearBtnAlt.addEventListener('click', clearFilters);
}

async function loadData() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');

    try {
        const response = await fetch(JSON_FILE_PATH);
        if (!response.ok) throw new Error('JSON not found');

        studentsData = await response.json();
        loading.style.display = 'none';

        buildFilters();
        renderResults();
        document.getElementById('archive-results').style.display = 'block';
    } catch (e) {
        loading.style.display = 'none';
        error.style.display = 'flex';
        console.error(e);
    }
}

function getTagCategory(tag) {
    for (const [category, tags] of Object.entries(TAG_CATEGORIES)) {
        if (tags.includes(tag)) return category;
    }
    return 'テーマ';
}

function getTagClass(tag) {
    const category = getTagCategory(tag);
    if (category === '表現技法') return 'tag-technique';
    return 'tag-theme';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getAllYears() {
    return [...new Set(studentsData.map(s => s.grade))].sort((a, b) => b - a);
}

function getTagsByCategory(category) {
    const tagCounts = {};
    studentsData.forEach(s => {
        (s.tags || []).forEach(tag => {
            if (getTagCategory(tag) === category) {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
        });
    });
    return Object.entries(tagCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja'));
}

function buildTagButtons(container, category) {
    const tags = getTagsByCategory(category);
    container.innerHTML = tags.map(([tag, count]) => `
        <button type="button" class="archive-filter-pill archive-tag-pill ${getTagClass(tag)}"
                data-tag="${tag.replace(/"/g, '&quot;')}" title="${count}件">
            ${escapeHtml(tag)}
        </button>
    `).join('');

    container.querySelectorAll('[data-tag]').forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.dataset.tag;
            if (selectedTags.has(tag)) {
                selectedTags.delete(tag);
            } else {
                selectedTags.add(tag);
            }
            updateFilterUI();
            renderResults();
        });
    });
}

function buildFilters() {
    const yearContainer = document.getElementById('year-filters');
    const techniqueContainer = document.getElementById('technique-filters');
    const themeContainer = document.getElementById('theme-filters');

    yearContainer.innerHTML = getAllYears().map(year => `
        <button type="button" class="archive-filter-pill archive-year-pill" data-year="${year}">
            ${year}
        </button>
    `).join('');

    yearContainer.querySelectorAll('[data-year]').forEach(btn => {
        btn.addEventListener('click', () => {
            const year = parseInt(btn.dataset.year, 10);
            if (selectedYears.has(year)) {
                selectedYears.delete(year);
            } else {
                selectedYears.add(year);
            }
            updateFilterUI();
            renderResults();
        });
    });

    buildTagButtons(techniqueContainer, '表現技法');
    buildTagButtons(themeContainer, 'テーマ');
}

function updateFilterUI() {
    document.querySelectorAll('[data-year]').forEach(btn => {
        const year = parseInt(btn.dataset.year, 10);
        btn.classList.toggle('active', selectedYears.has(year));
    });

    document.querySelectorAll('[data-tag]').forEach(btn => {
        btn.classList.toggle('active', selectedTags.has(btn.dataset.tag));
    });

    const sidebar = document.getElementById('archive-sidebar');
    const hasFilters = selectedYears.size > 0 || selectedTags.size > 0 || searchQuery;
    sidebar.classList.toggle('has-active-filters', hasFilters);
}

function filterStudents() {
    return studentsData.filter(student => {
        if (selectedYears.size > 0 && !selectedYears.has(student.grade)) {
            return false;
        }

        if (selectedTags.size > 0) {
            const studentTags = student.tags || [];
            const hasAllTags = [...selectedTags].every(tag => studentTags.includes(tag));
            if (!hasAllTags) return false;
        }

        if (searchQuery) {
            const title = (student.title || '').toLowerCase();
            const tags = (student.tags || []).join(' ').toLowerCase();
            const year = String(student.grade);
            const haystack = `${title} ${tags} ${year}`;
            if (!haystack.includes(searchQuery)) return false;
        }

        return true;
    });
}

function getDetailLink(student) {
    if (student.grade === 2025 && student.studentId) {
        return `student.html?id=${encodeURIComponent(student.studentId)}`;
    }
    return null;
}

function createTagLabels(tags) {
    if (!tags || tags.length === 0) return '';

    const techniqueTags = tags.filter(t => getTagCategory(t) === '表現技法');
    const themeTags = tags.filter(t => getTagCategory(t) === 'テーマ');
    if (techniqueTags.length === 0 && themeTags.length === 0) return '';

    const renderGroup = (groupTags, label) => {
        if (groupTags.length === 0) return '';
        return `
            <div class="archive-item-tag-group">
                <span class="archive-item-tag-label">${label}</span>
                ${groupTags.map(tag =>
                    `<span class="tag-badge ${getTagClass(tag)}">${escapeHtml(tag)}</span>`
                ).join('')}
            </div>
        `;
    };

    return `
        <div class="archive-item-tags">
            ${renderGroup(techniqueTags, '技法')}
            ${renderGroup(themeTags, 'テーマ')}
        </div>
    `;
}

function renderResults() {
    const filtered = filterStudents();
    const resultsEl = document.getElementById('archive-results');
    const noResultsEl = document.getElementById('no-results');
    const countEl = document.getElementById('result-count');

    const activeFilterCount = selectedYears.size + selectedTags.size + (searchQuery ? 1 : 0);
    countEl.innerHTML = `
        <span class="archive-result-number">${filtered.length}</span>
        <span class="archive-result-label">件の研究題目</span>
        ${activeFilterCount > 0 ? `<span class="archive-result-meta">（全${studentsData.length}件中 · フィルタ${activeFilterCount}件）</span>` : ''}
    `;

    updateFilterUI();

    if (filtered.length === 0) {
        resultsEl.style.display = 'none';
        noResultsEl.style.display = 'flex';
        return;
    }

    noResultsEl.style.display = 'none';
    resultsEl.style.display = 'block';

    const byYear = {};
    filtered.forEach(s => {
        if (!byYear[s.grade]) byYear[s.grade] = [];
        byYear[s.grade].push(s);
    });

    const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

    resultsEl.innerHTML = years.map(year => {
        const items = byYear[year].sort((a, b) => a.id - b.id);
        return `
            <section class="archive-year-block" id="year-${year}">
                <header class="archive-year-header">
                    <div class="archive-year-header-main">
                        <span class="archive-year-number">${year}</span>
                        <span class="archive-year-suffix">年度</span>
                    </div>
                    <span class="archive-year-meta">${items.length}件</span>
                </header>
                <ul class="archive-item-list">
                    ${items.map((student, index) => {
                        const link = getDetailLink(student);
                        const tagsHtml = createTagLabels(student.tags);
                        const titleInner = escapeHtml(student.title);
                        const titleHtml = link
                            ? `<a href="${link}" class="archive-item-title archive-item-title--link">${titleInner}<i class="fas fa-arrow-up-right-from-square archive-item-link-icon" aria-hidden="true"></i></a>`
                            : `<span class="archive-item-title">${titleInner}</span>`;

                        return `
                            <li class="archive-item">
                                <span class="archive-item-index">${String(index + 1).padStart(2, '0')}</span>
                                <div class="archive-item-body">
                                    ${titleHtml}
                                    ${tagsHtml}
                                </div>
                            </li>
                        `;
                    }).join('')}
                </ul>
            </section>
        `;
    }).join('');
}
