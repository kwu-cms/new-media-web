// Excelファイルのパス
const EXCEL_FILE_PATH = 'data/students.xlsx';

// 学生データを格納
let studentsData = [];

// タグの分類定義
const TAG_CATEGORIES = {
    '技術・手法': [
        '3Dモデリング', 'AIモデリング', 'Blender', 'Live2D', 'VTuber', 'ピクセルアート',
        '音声合成', 'ゲーム開発', 'Unity', 'ティラノビルダー', 'デジタルファブリケーション'
    ],
    'ジャンル・形式': [
        'ノベルゲーム', 'アクションゲーム', 'アドベンチャーゲーム', 'ホラー',
        'マンガ・アニメ', 'Live配信'
    ],
    'テーマ・領域': [
        'キャラクターデザイン', 'デザイン技法', '空間デザイン', 'UIデザイン',
        '体験のデザイン', '物語', 'シナリオ', 'イラスト', '文化研究',
        'スペキュラティブデザイン', 'ペルソナ分析'
    ]
};

// タグのカテゴリを取得
function getTagCategory(tag) {
    for (const [category, tags] of Object.entries(TAG_CATEGORIES)) {
        if (tags.includes(tag)) {
            return category;
        }
    }
    return 'テーマ・領域'; // デフォルト
}

// タグラベルを生成
function createTagLabels(tags) {
    if (!tags || tags.length === 0) return '';
    
    return tags.map(tag => {
        const category = getTagCategory(tag);
        const categoryClass = category === '技術・手法' ? 'tag-technique' :
                             category === 'ジャンル・形式' ? 'tag-genre' : 'tag-theme';
        return `<span class="tag-badge ${categoryClass}">${escapeHtml(tag)}</span>`;
    }).join('');
}

// ビュー状態管理
let currentView = 'card'; // 'card' または 'table'

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', () => {
    setupScrollNavbar();
    loadHeroMedia();
    setupViewToggle();
    
    // ローカルストレージからビュー設定を読み込む
    const savedView = localStorage.getItem('studentListView');
    if (savedView === 'table' || savedView === 'card') {
        currentView = savedView;
        updateViewToggleUI();
    }
    
    // 初期ビューを適用
    applyInitialView();
    
    // Heroテキストアニメーションを設定
    setupHeroTextAnimation();
    
    // Excelデータを読み込む
    loadExcelData();
});

// ページアンロード時にシェーダーをクリーンアップ
window.addEventListener('beforeunload', () => {
    // シェーダー切り替えタイマーをクリア
    if (shaderToggleTimer) {
        clearInterval(shaderToggleTimer);
        shaderToggleTimer = null;
    }
    if (heroVideoShader) {
        heroVideoShader.destroy();
        heroVideoShader = null;
    }
});

// yugop.comスタイルのランダムテキストアニメーションクラス
class SimpleRandomText {
    constructor(options) {
        this.str = options.str || '';
        this.speed = options.speed || 2;
        this.placeholderChar = options.placeholderChar || '_';
        this.frameOffset = options.frameOffset || 20;
        this.charOffset = options.charOffset || 15;
        this.charStep = options.charStep || 5;
        this.minCharCode = options.minCharCode || 33;
        this.maxCharCode = options.maxCharCode || 126;
        this.onProgress = options.onProgress || (() => {});
        this.onComplete = options.onComplete || (() => {});
        
        // 各文字の状態を管理
        this.charStates = [];
        this.frameCount = 0;
        this.animationId = null;
        this.isComplete = false;
        
        // 文字ごとのアニメーション状態を初期化
        for (let i = 0; i < this.str.length; i++) {
            const char = this.str[i];
            // スペースや改行はそのまま表示
            if (char === ' ' || char === '\n' || char === '\t') {
                this.charStates.push({
                    char: char,
                    isComplete: true,
                    startFrame: 0,
                    shuffleFrames: 0
                });
            } else {
                this.charStates.push({
                    char: char,
                    isComplete: false,
                    startFrame: this.frameOffset + i * this.charStep + Math.random() * 10,
                    shuffleFrames: this.charOffset + Math.random() * 10
                });
            }
        }
    }
    
    start() {
        if (this.isComplete) return;
        
        const animate = () => {
            let allComplete = true;
            let result = '';
            
            for (let i = 0; i < this.charStates.length; i++) {
                const state = this.charStates[i];
                
                if (state.isComplete) {
                    result += state.char;
                } else {
                    const elapsed = this.frameCount - state.startFrame;
                    
                    if (elapsed < 0) {
                        // まだ開始していない
                        result += this.placeholderChar;
                        allComplete = false;
                    } else if (elapsed < state.shuffleFrames) {
                        // ランダム文字を表示
                        const randomChar = String.fromCharCode(
                            this.minCharCode + Math.floor(Math.random() * (this.maxCharCode - this.minCharCode + 1))
                        );
                        result += randomChar;
                        allComplete = false;
                    } else {
                        // 最終文字を表示
                        result += state.char;
                        state.isComplete = true;
                    }
                }
            }
            
            this.onProgress(result);
            this.frameCount += this.speed;
            
            if (allComplete) {
                this.onComplete(this.str);
                this.isComplete = true;
            } else {
                this.animationId = requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// 文章から文章へのトランジションアニメーション（2段階）
function transitionText(fromText, toText, onProgress, onComplete) {
    const SPEED_MULTIPLIER = 1 / 1.5; // 1.5倍速くする（1/1.5 = 0.67）
    const FADE_OUT_SPEED = Math.max(1, Math.floor(1 * SPEED_MULTIPLIER)); // 後ろから消える速度（フレーム数）1.5倍速
    const FRAME_OFFSET_BASE = Math.floor(20 * SPEED_MULTIPLIER); // 20 * 0.67 ≈ 13
    const CHAR_OFFSET_BASE = Math.floor(13 * SPEED_MULTIPLIER); // 13 * 0.67 ≈ 9
    const CHAR_STEP_BASE = Math.floor(5 * SPEED_MULTIPLIER); // 5 * 0.67 ≈ 3
    const MIN_CHAR_CODE = 33;
    const MAX_CHAR_CODE = 126;
    const PLACEHOLDER_CHAR = '_';
    
    // 改行をスペースに置き換える（タイトルバー表示用）
    fromText = fromText.replace(/\n/g, ' ');
    toText = toText.replace(/\n/g, ' ');
    
    let phase = 'fadeOut'; // 'fadeOut' -> 'fadeIn'
    let fadeOutFrameCount = 0;
    let frameCount = 0;
    let animationId = null;
    let charStates = [];
    
    // フェーズ1: 後ろから順に_に置き換え（1行テキストとして処理）
    let fadeOutIndex = fromText.length;
    
    const animate = () => {
        let result = '';
        
        if (phase === 'fadeOut') {
            // フェーズ1: 後ろから順に_に置き換え
            for (let i = 0; i < fromText.length; i++) {
                if (i >= fadeOutIndex) {
                    result += PLACEHOLDER_CHAR;
                } else {
                    result += fromText[i];
                }
            }
            
            fadeOutFrameCount += 1;
            
            // 一定フレームごとに後ろから1文字ずつ消す
            if (fadeOutFrameCount >= FADE_OUT_SPEED) {
                if (fadeOutIndex > 0) {
                    fadeOutIndex -= 1;
                }
                fadeOutFrameCount = 0;
            }
            
            // 全ての文字が消えたかチェック
            if (fadeOutIndex <= 0) {
                // フェーズ1完了、フェーズ2へ
                phase = 'fadeIn';
                frameCount = 0;
                
                // フェーズ2の文字状態を初期化
                charStates = [];
                
                for (let i = 0; i < toText.length; i++) {
                    const toChar = toText[i];
                    const isSpace = toChar === ' ' || toChar === '\t';
                    
                    const charStartFrame = FRAME_OFFSET_BASE + i * CHAR_STEP_BASE + Math.random() * 10;
                    
                    charStates.push({
                        toChar: toChar,
                        isComplete: false,
                        isSpace: isSpace,
                        startFrame: charStartFrame,
                        shuffleFrames: CHAR_OFFSET_BASE + Math.random() * 10
                    });
                }
            }
            
            onProgress(result);
            animationId = requestAnimationFrame(animate);
        } else {
            // フェーズ2: _からテキストBへ
            let allComplete = true;
            
            for (let i = 0; i < charStates.length; i++) {
                const state = charStates[i];
                
                if (state.isComplete) {
                    // 完了した文字を表示
                    if (state.toChar !== null) {
                        result += state.toChar;
                    }
                } else {
                    const elapsed = frameCount - state.startFrame;
                    
                    if (elapsed < 0) {
                        // まだ開始していない - プレースホルダーを表示
                        result += PLACEHOLDER_CHAR;
                        allComplete = false;
                    } else if (elapsed < state.shuffleFrames) {
                        // ランダム文字を表示（スペースや改行の場合はそのまま）
                        if (state.isSpace && state.toChar) {
                            result += state.toChar;
                            state.isComplete = true;
                        } else {
                            const randomChar = String.fromCharCode(
                                MIN_CHAR_CODE + Math.floor(Math.random() * (MAX_CHAR_CODE - MIN_CHAR_CODE + 1))
                            );
                            result += randomChar;
                            allComplete = false;
                        }
                    } else {
                        // 最終文字を表示
                        if (state.toChar !== null) {
                            result += state.toChar;
                        }
                        state.isComplete = true;
                    }
                }
            }
            
            onProgress(result);
            frameCount += 1.5; // 1.5倍速にするため、フレームカウントを1.5ずつ増やす
            
            if (allComplete) {
                onComplete(result);
            } else {
                animationId = requestAnimationFrame(animate);
            }
        }
    };
    
    animate();
    
    return {
        stop: () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        }
    };
}

// Heroテキストアニメーションを設定
async function setupHeroTextAnimation() {
    const heroTitle = document.getElementById('hero-title');
    const heroSubtitle = document.getElementById('hero-subtitle');
    const heroTitleBar = document.querySelector('.hero-title-bar');
    
    if (!heroTitle || !heroSubtitle) {
        return;
    }
    
    // JSONファイルからテキストセットを読み込む
    let textSets = [];
    try {
        const response = await fetch('data/hero-texts.json');
        if (response.ok) {
            textSets = await response.json();
            // データの検証
            if (!Array.isArray(textSets) || textSets.length === 0) {
                throw new Error('テキストセットが空です');
            }
            // 各セットにtitleとsubtitleがあるか確認
            textSets = textSets.filter(set => set && set.title && set.subtitle);
            if (textSets.length === 0) {
                throw new Error('有効なテキストセットが見つかりません');
            }
        } else {
            throw new Error('JSONファイルの読み込みに失敗しました');
        }
    } catch (error) {
        console.error('HeroテキストJSONの読み込みエラー:', error);
        // フォールバック: デフォルトのテキストセットを使用
        textSets = [
            {
                title: 'ニューメディア研究ゼミ',
                subtitle: '2025年度 卒業研究発表'
            }
        ];
    }
    
    let currentIndex = 0;
    let loopTimer = null;
    let titleAnimation = null;
    let subtitleAnimation = null;
    const DISPLAY_DURATION = 5000; // 各テキストセットの表示時間（ミリ秒）変更なし
    const TRANSITION_DELAY = Math.floor(300 / 1.5); // タイトルとサブタイトルの間の遅延（ミリ秒）1.5倍速
    const FADE_DURATION = 300; // フェードの時間（ミリ秒）
    
    // テキストセットをアニメーション表示する関数
    function animateTextSet(index, isFirstLoad = false) {
        const textSet = textSets[index];
        if (!textSet) return;
        
        // 現在のアニメーションを停止
        if (loopTimer) {
            clearTimeout(loopTimer);
        }
        if (titleAnimation) {
            titleAnimation.stop();
        }
        if (subtitleAnimation) {
            subtitleAnimation.stop();
        }
        
        // 現在のテキストを取得
        let currentTitle = heroTitle.textContent || '';
        let currentSubtitle = heroSubtitle.textContent || '';
        
        // 最初の読み込み時は、タイトルバーの拡縮アニメーションから始める
        if (isFirstLoad && index === 0) {
            // タイトルバーを初期状態にリセット
            if (heroTitleBar) {
                heroTitleBar.classList.remove('animate-width', 'animate-height', 'ready');
                // インラインスタイルを削除してCSSクラスが適用されるようにする
                heroTitleBar.style.width = '';
                heroTitleBar.style.height = '';
                heroTitleBar.style.maxHeight = '';
                heroTitleBar.style.padding = '';
                heroTitleBar.style.opacity = '';
            }
            
            heroTitle.style.visibility = 'hidden';
            heroSubtitle.style.visibility = 'hidden';
            heroTitle.style.opacity = '0';
            heroSubtitle.style.opacity = '0';
            
            // テキストをクリア（念のため）
            heroTitle.textContent = '';
            heroSubtitle.textContent = '';
            
            // タイトルバーの拡縮アニメーション
            if (heroTitleBar) {
                // 強制的にリフローを発生させてからアニメーション開始
                heroTitleBar.offsetHeight;
                
                // 1. 横幅を拡張（0.6秒）
                setTimeout(() => {
                    heroTitleBar.classList.add('animate-width');
                }, 200);
                
                // 2. 縦幅とパディングを拡張（0.5秒、0.3秒遅延）
                setTimeout(() => {
                    heroTitleBar.classList.add('animate-height');
                }, 500);
                
                // 3. アンダーバー入力開始（縦幅拡張完了後）
                setTimeout(() => {
                    heroTitleBar.classList.add('ready');
                    heroTitle.style.visibility = 'visible';
                    heroSubtitle.style.visibility = 'visible';
                    heroTitle.style.opacity = '1';
                    heroSubtitle.style.opacity = '1';
                    
                    // アンダーバーを1つずつ増殖させるアニメーション（加速度的）
                    // 改行をスペースに置き換えた長さを計算
                    const titleText = textSet.title.replace(/\n/g, ' ');
                    const subtitleText = textSet.subtitle.replace(/\n/g, ' ');
                    const titleLength = titleText.length;
                    const subtitleLength = subtitleText.length;
                    const maxLength = Math.max(titleLength, subtitleLength);
                    
                    // 2秒間で全てのアンダーバーを配置（加速度的に）
                    const duration = 2000; // 2秒
                    const startInterval = 100; // 最初の間隔（ミリ秒）
                    const endInterval = 8; // 最後の間隔（ミリ秒）
                    
                    let currentTitleUnderscores = '';
                    let currentSubtitleUnderscores = '';
                    let charIndex = 0;
                    let currentInterval = startInterval;
                    let lastTime = Date.now();
                    
                    function addUnderscore() {
                        const now = Date.now();
                        const elapsed = now - lastTime;
                        
                        if (elapsed >= currentInterval) {
                            if (charIndex < titleLength) {
                                currentTitleUnderscores += '_';
                                heroTitle.textContent = currentTitleUnderscores;
                            }
                            
                            if (charIndex < subtitleLength) {
                                currentSubtitleUnderscores += '_';
                                heroSubtitle.textContent = currentSubtitleUnderscores;
                            }
                            
                            charIndex++;
                            lastTime = now;
                            
                            // 間隔を加速度的に短くする（指数関数的に）
                            const progress = charIndex / maxLength;
                            currentInterval = startInterval * Math.pow(endInterval / startInterval, progress);
                            
                            // 全てのアンダーバーが配置されたら、アニメーション開始
                            if (charIndex >= maxLength) {
                                // アンダーバー配置完了後、currentTitleとcurrentSubtitleを設定してからアニメーション開始
                                const finalTitle = currentTitleUnderscores;
                                const finalSubtitle = currentSubtitleUnderscores;
                                startAnimations(finalTitle, finalSubtitle);
                                return;
                            }
                        }
                        
                        // 次のフレームをスケジュール
                        requestAnimationFrame(addUnderscore);
                    }
                    
                    // アニメーション開始
                    requestAnimationFrame(addUnderscore);
                }, 900); // 横幅(600ms) + 縦幅遅延(300ms) + 少し余裕
            }
            
            return;
        }
        
        // 通常のトランジション
        startAnimations(currentTitle, currentSubtitle);
        
        function startAnimations(fromTitle, fromSubtitle) {
            // 引数が渡されていない場合は、現在のテキストを使用
            // 改行をスペースに置き換える
            const startTitle = (fromTitle !== undefined ? fromTitle : currentTitle).replace(/\n/g, ' ');
            const startSubtitle = (fromSubtitle !== undefined ? fromSubtitle : currentSubtitle).replace(/\n/g, ' ');
            const targetTitle = textSet.title.replace(/\n/g, ' ');
            const targetSubtitle = textSet.subtitle.replace(/\n/g, ' ');
            
            // タイトルとサブタイトルを同時にトランジション開始
            heroTitle.style.visibility = 'visible';
            heroTitle.style.opacity = '1';
            heroSubtitle.style.visibility = 'visible';
            heroSubtitle.style.opacity = '1';
            
            let titleComplete = false;
            let subtitleComplete = false;
            
            // タイトルのトランジション
            titleAnimation = transitionText(
                startTitle,
                targetTitle,
                (str) => {
                    heroTitle.textContent = str;
                },
                (str) => {
                    heroTitle.textContent = str;
                    titleComplete = true;
                    checkBothComplete();
                }
            );
            
            // サブタイトルのトランジション（同時に開始）
            subtitleAnimation = transitionText(
                startSubtitle,
                targetSubtitle,
                (str) => {
                    heroSubtitle.textContent = str;
                },
                (str) => {
                    heroSubtitle.textContent = str;
                    subtitleComplete = true;
                    checkBothComplete();
                }
            );
            
            // 両方のアニメーションが完了したら次のテキストセットへ
            function checkBothComplete() {
                if (titleComplete && subtitleComplete) {
                    // 次のテキストセットへの切り替えをスケジュール
                    scheduleNextTextSet();
                }
            }
        }
    }
    
    // 次のテキストセットへの切り替えをスケジュール
    function scheduleNextTextSet() {
        loopTimer = setTimeout(() => {
            currentIndex = (currentIndex + 1) % textSets.length;
            animateTextSet(currentIndex);
        }, DISPLAY_DURATION);
    }
    
    // CSSトランジションを設定
    heroTitle.style.transition = `opacity ${FADE_DURATION}ms ease-in-out`;
    heroSubtitle.style.transition = `opacity ${FADE_DURATION}ms ease-in-out`;
    
    // 最初のテキストセットを表示（画面読み込み後2.5秒後にアニメーション開始）
    setTimeout(() => {
        animateTextSet(currentIndex, true);
    }, 2500);
}

// 初期ビューを適用
function applyInitialView() {
    const studentList = document.getElementById('student-list');
    const studentTableContainer = document.getElementById('student-table-container');
    
    if (currentView === 'card') {
        if (studentList) studentList.style.display = '';
        if (studentTableContainer) studentTableContainer.style.display = 'none';
    } else {
        if (studentList) studentList.style.display = 'none';
        if (studentTableContainer) studentTableContainer.style.display = '';
    }
}

// Hero動画管理
let heroVideoList = []; // 利用可能な動画ファイルのリスト
let currentPlaylist = []; // 現在のプレイリスト [{ videoUrl, seekPosition }, ...]
let currentPlaylistIndex = -1; // 現在のプレイリスト内のインデックス
let lastVideoUrl = null; // 最後に再生した動画（P）
let secondLastVideoUrl = null; // その一つ前の動画（Q）
let videoSwitchTimer = null;
const VIDEO_PLAY_DURATION = 5; // 5秒再生
let heroVideoShader = null; // WebGLシェーダーインスタンス
let shaderToggleTimer = null; // シェーダーオン/オフ切り替えタイマー
let isShaderActive = false; // シェーダーが現在アクティブかどうか（最初はオフ）
const SHADER_TOGGLE_INTERVAL = 3000; // 3秒ごとに切り替え

// Hero画像/動画を読み込む（Excelから設定）
async function loadHeroMedia() {
    try {
        // まず利用可能な動画リストを取得
        await loadVideoList();
        
        if (heroVideoList.length === 0) {
            console.log('利用可能な動画が見つかりません');
            return;
        }
        
        // 最初のプレイリストを生成して再生開始
        generateNewPlaylist();
        playNextVideoFromPlaylist();
    } catch (error) {
        console.log('Heroメディアの読み込みに失敗しました:', error);
    }
}

// 利用可能な動画リストを読み込む
async function loadVideoList() {
    heroVideoList = [];
    
    try {
        // videos_info.jsonから動画情報を取得
        const response = await fetch('assets/hero/videos/videos_info.json');
        if (response.ok) {
            const videosInfo = await response.json();
            if (videosInfo && videosInfo.length > 0) {
                heroVideoList = videosInfo.map(v => `assets/hero/videos/${v.processed}`);
                return;
            }
        }
    } catch (error) {
        console.log('videos_info.jsonの読み込みに失敗:', error);
    }
    
    // JSONが読み込めない場合は、直接動画ファイルを探す
    // 動画ファイルを動的に検索（フォールバック）
    const videoFiles = [
        '2025_new_media_00001.mp4',
        '2025_new_media_00002.mp4',
        '2025_new_media_00003.mp4',
        '2025_new_media_00004.mp4',
        '2025_new_media_00005.mp4',
        '2025_new_media_00006.mp4'
    ];
    
    heroVideoList = videoFiles.map(file => `assets/hero/videos/${file}`);
}

// Fisher-Yatesアルゴリズムで配列をシャッフル
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// PとQを最初に来ないようにシャッフル
function shuffleArrayAvoidingFirst(array, avoidUrls) {
    if (array.length <= 2 || avoidUrls.length === 0) {
        return shuffleArray(array);
    }
    
    let shuffled;
    let attempts = 0;
    const maxAttempts = 100; // 無限ループを防ぐ
    
    do {
        shuffled = shuffleArray(array);
        attempts++;
        // 最初の要素がavoidUrlsに含まれていないか確認
        if (!avoidUrls.includes(shuffled[0].videoUrl)) {
            return shuffled;
        }
    } while (attempts < maxAttempts);
    
    // 最大試行回数に達した場合は、そのまま返す
    return shuffled;
}

// シェーダー効果のプリセット定義
const SHADER_EFFECT_PRESETS = {
    // 単一効果
    rgbShift: {
        rgbShift: { enabled: true, intensity: 0.01, speed: 0.5 },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: false },
        vignette: { enabled: false },
        tiling: { enabled: false }
    },
    glitch: {
        rgbShift: { enabled: false },
        glitch: { enabled: true, intensity: 0.2, duration: 0.3, interval: 3.0 },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: false },
        vignette: { enabled: false },
        tiling: { enabled: false }
    },
    mosaic: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: true, size: 25.0 },
        bloom: { enabled: false },
        blur: { enabled: false },
        vignette: { enabled: false },
        tiling: { enabled: false }
    },
    blur: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: true, intensity: 8.0 },
        vignette: { enabled: false },
        tiling: { enabled: false }
    },
    vignette: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: false },
        vignette: { enabled: true, intensity: 0.6, radius: 0.75, softness: 0.4 },
        tiling: { enabled: false }
    },
    bloom: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: true, intensity: 2.0, threshold: 0.6, radius: 15.0 },
        blur: { enabled: false },
        vignette: { enabled: false },
        tiling: { enabled: false }
    },
    tiling: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: false },
        vignette: { enabled: false },
        tiling: { enabled: true, countX: 2.0, countY: 2.0, offsetX: 0.0, offsetY: 0.0 }
    },
    // 2つ重ねがけ
    rgbShiftVignette: {
        rgbShift: { enabled: true, intensity: 0.008, speed: 0.5 },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: false },
        vignette: { enabled: true, intensity: 0.5, radius: 0.8, softness: 0.3 },
        tiling: { enabled: false }
    },
    blurVignette: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: true, intensity: 6.0 },
        vignette: { enabled: true, intensity: 0.7, radius: 0.7, softness: 0.4 },
        tiling: { enabled: false }
    },
    bloomVignette: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: true, intensity: 1.8, threshold: 0.65, radius: 12.0 },
        blur: { enabled: false },
        vignette: { enabled: true, intensity: 0.55, radius: 0.75, softness: 0.35 },
        tiling: { enabled: false }
    },
    glitchMosaic: {
        rgbShift: { enabled: false },
        glitch: { enabled: true, intensity: 0.18, duration: 0.3, interval: 3.0 },
        mosaic: { enabled: true, size: 30.0 },
        bloom: { enabled: false },
        blur: { enabled: false },
        vignette: { enabled: false },
        tiling: { enabled: false }
    },
    tilingBlur: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: true, intensity: 5.0 },
        vignette: { enabled: false },
        tiling: { enabled: true, countX: 3.0, countY: 3.0, offsetX: 0.0, offsetY: 0.0 }
    },
    // 効果なし
    none: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: false },
        vignette: { enabled: false },
        tiling: { enabled: false }
    }
};

// シェーダー効果のプリセットリスト（ランダム選択用）
const SHADER_PRESET_KEYS = Object.keys(SHADER_EFFECT_PRESETS);

// ランダムにシェーダー効果のプリセットを選択
function getRandomShaderPreset() {
    const randomIndex = Math.floor(Math.random() * SHADER_PRESET_KEYS.length);
    const presetKey = SHADER_PRESET_KEYS[randomIndex];
    return {
        presetName: presetKey,
        config: JSON.parse(JSON.stringify(SHADER_EFFECT_PRESETS[presetKey])) // ディープコピー
    };
}

// 新しいプレイリストを生成
// currentP: 現在再生中の動画（P）、次のプレイリストで最初に来ないようにする
function generateNewPlaylist(currentP = null) {
    if (heroVideoList.length === 0) {
        return;
    }
    
    // 動画とランダムなシーク位置、シェーダー効果を含むプレイリストアイテムを作成
    const playlistItems = heroVideoList.map(videoUrl => {
        const shaderPreset = getRandomShaderPreset();
        return {
            videoUrl: videoUrl,
            seekPosition: null, // メタデータ読み込み後に決定
            shaderConfig: shaderPreset.config, // シェーダー設定（JSONオブジェクト）
            shaderPresetName: shaderPreset.presetName // プリセット名（デバッグ用）
        };
    });
    
    // PとQを最初に来ないようにシャッフル
    const avoidUrls = [];
    // currentPが指定されている場合はそれを使用、そうでなければlastVideoUrlを使用
    const p = currentP || lastVideoUrl;
    if (p) avoidUrls.push(p);
    if (secondLastVideoUrl) avoidUrls.push(secondLastVideoUrl);
    
    currentPlaylist = shuffleArrayAvoidingFirst(playlistItems, avoidUrls);
    currentPlaylistIndex = 0;
    
    console.log('新しいプレイリストを生成:', currentPlaylist.map(item => ({
        video: item.videoUrl,
        shader: item.shaderPresetName
    })));
}

// シェーダーのオン/オフを切り替える
function toggleShader() {
    const heroVideo = document.getElementById('hero-background-video');
    if (!heroVideo) return;
    
    // シェーダーが有効な設定かどうかを確認
    if (typeof HeroVideoShader === 'undefined' || !HERO_SHADER_CONFIG || !HERO_SHADER_CONFIG.enabled) {
        // シェーダーが無効な場合はvideo要素を表示
        isShaderActive = false;
        if (heroVideoShader) {
            heroVideoShader.disable();
            heroVideoShader = null;
        }
        heroVideo.style.display = 'block';
        heroVideo.style.opacity = '0.4';
        heroVideo.classList.add('active');
        return;
    }
    
    // シェーダーインスタンスを作成（まだ存在しない場合）
    if (!heroVideoShader) {
        heroVideoShader = new HeroVideoShader(heroVideo, null);
    }
    
    // シェーダーの状態を切り替え
    isShaderActive = !isShaderActive;
    
    // 状態を適用
    applyShaderState();
    
    console.log(`シェーダー: ${isShaderActive ? 'ON' : 'OFF'}`);
}

// シェーダーのオン/オフ切り替えタイマーを開始（最初はオフ、既に実行中の場合は継続）
function startShaderToggle() {
    const heroVideo = document.getElementById('hero-background-video');
    if (!heroVideo) return;
    
    // タイマーが既に実行中の場合は、現在の状態を維持して継続
    if (shaderToggleTimer) {
        // 現在の状態を適用
        applyShaderState();
        return;
    }
    
    // 最初はオフから開始
    isShaderActive = false;
    
    // シェーダーが有効な設定かどうかを確認
    if (typeof HeroVideoShader === 'undefined' || !HERO_SHADER_CONFIG || !HERO_SHADER_CONFIG.enabled) {
        // シェーダーが無効な場合はvideo要素を表示
        if (heroVideoShader) {
            heroVideoShader.disable();
            heroVideoShader = null;
        }
        heroVideo.style.display = 'block';
        heroVideo.style.opacity = '0.4';
        heroVideo.classList.add('active');
        return;
    }
    
    // シェーダーインスタンスを作成（まだ存在しない場合）
    if (!heroVideoShader) {
        heroVideoShader = new HeroVideoShader(heroVideo, null);
    }
    
    // 最初はvideo要素を表示（オフ状態）
    applyShaderState();
    
    // 3秒ごとに切り替え
    shaderToggleTimer = setInterval(() => {
        toggleShader();
    }, SHADER_TOGGLE_INTERVAL);
    
    console.log('シェーダー切り替えタイマー開始（最初はOFF）');
}

// 現在のシェーダー状態を適用
function applyShaderState() {
    const heroVideo = document.getElementById('hero-background-video');
    if (!heroVideo) return;
    
    if (isShaderActive) {
        // シェーダーをオン
        if (heroVideoShader && heroVideoShader.isShaderEnabled()) {
            heroVideoShader.show();
        } else {
            // シェーダーが初期化に失敗した場合はvideo要素を表示
            if (heroVideoShader) {
                heroVideoShader.hide();
            }
            heroVideo.style.display = 'block';
            heroVideo.style.opacity = '0.4';
            heroVideo.classList.add('active');
        }
    } else {
        // シェーダーをオフ（video要素を表示）
        if (heroVideoShader) {
            heroVideoShader.hide();
        }
        heroVideo.style.display = 'block';
        heroVideo.style.opacity = '0.4';
        heroVideo.classList.add('active');
    }
}

// プレイリストから次の動画を再生
function playNextVideoFromPlaylist() {
    if (currentPlaylist.length === 0) {
        return;
    }
    
    // プレイリストから次のアイテムを取得
    const playlistItem = currentPlaylist[currentPlaylistIndex];
    if (!playlistItem) {
        return;
    }
    
    // 現在のプレイリストの最後の動画（P）を再生するかどうかを確認
    // currentPlaylistIndexは次に再生する動画のインデックス
    // 最後の動画を再生するときは currentPlaylistIndex === currentPlaylist.length - 1
    const isLastVideo = currentPlaylistIndex === currentPlaylist.length - 1;
    
    // 動画を再生（最後の動画を再生している間に次のプレイリストを生成する）
    playVideoAtRandomPosition(playlistItem.videoUrl, playlistItem, isLastVideo);
    
    // インデックスを進める（次の動画の準備）
    currentPlaylistIndex++;
}

// ランダムな位置から動画を再生
function playVideoAtRandomPosition(videoUrl, playlistItem, isLastVideo) {
    const heroVideo = document.getElementById('hero-background-video');
    const videoSource = document.getElementById('hero-video-source');
    
    if (!heroVideo || !videoSource) {
        return;
    }
    
    // 既存のタイマーをクリア
    if (videoSwitchTimer) {
        clearTimeout(videoSwitchTimer);
        videoSwitchTimer = null;
    }
    
    // 動画ソースを設定
    videoSource.src = videoUrl;
    heroVideo.load();
    
    // 動画のメタデータ読み込み完了を待つ
    const onLoadedMetadata = () => {
        const duration = heroVideo.duration;
        
        // シーク位置が未設定の場合は決定
        let seekPosition = playlistItem.seekPosition;
        if (seekPosition === null) {
            if (duration && duration > VIDEO_PLAY_DURATION) {
                // 開始位置をランダムに決定（0秒から終了の5秒前まで）
                const maxStartTime = Math.max(0, duration - VIDEO_PLAY_DURATION);
                seekPosition = Math.random() * maxStartTime;
                playlistItem.seekPosition = seekPosition; // プレイリストに保存
            } else {
                seekPosition = 0;
                playlistItem.seekPosition = 0;
            }
        }
        
        heroVideo.currentTime = seekPosition;
        heroVideo.play();
        
        // プレイリストアイテムからシェーダー設定を取得して適用
        if (playlistItem && playlistItem.shaderConfig) {
            // シェーダーインスタンスを作成または更新
            if (typeof HeroVideoShader !== 'undefined' && HERO_SHADER_CONFIG && HERO_SHADER_CONFIG.enabled) {
                if (!heroVideoShader) {
                    heroVideoShader = new HeroVideoShader(heroVideo, null);
                }
                // シェーダー設定を適用
                if (heroVideoShader && heroVideoShader.isShaderEnabled()) {
                    heroVideoShader.setConfig(playlistItem.shaderConfig);
                    console.log(`シェーダー設定を適用: ${playlistItem.shaderPresetName || 'custom'}`, playlistItem.shaderConfig);
                }
            }
        }
        
        // シェーダーのオン/オフ切り替えを開始（最初はオフ）
        startShaderToggle();
        
        // 最後の動画（P）を再生している場合、次のプレイリストを生成
        if (isLastVideo) {
            // 動画を再生している間に次のプレイリストを生成
            // Qを更新（現在のPが次のQになる）
            // lastVideoUrlを更新する前に、現在のlastVideoUrlをQとして保存
            if (lastVideoUrl) {
                secondLastVideoUrl = lastVideoUrl;
            }
            // 次のプレイリストを生成（現在のvideoUrlがPとして使われる）
            generateNewPlaylist(videoUrl);
        }
        
        // lastVideoUrlを更新（次の動画の準備）
        lastVideoUrl = videoUrl;
        
        console.log(`動画再生開始: ${videoUrl} (${seekPosition.toFixed(2)}秒から)`);
        
        // 5秒後に次の動画に切り替え
        const playDuration = duration && duration > VIDEO_PLAY_DURATION 
            ? VIDEO_PLAY_DURATION 
            : (duration || VIDEO_PLAY_DURATION);
        
        videoSwitchTimer = setTimeout(() => {
            playNextVideoFromPlaylist();
        }, playDuration * 1000);
        
        heroVideo.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
    
    heroVideo.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
    
    // エラーハンドリング
    heroVideo.addEventListener('error', (e) => {
        console.log('Hero動画の読み込みに失敗しました:', videoUrl, e);
        // シェーダーを無効化
        if (heroVideoShader) {
            heroVideoShader.disable();
            heroVideoShader = null;
        }
        // シェーダー切り替えタイマーをクリア
        if (shaderToggleTimer) {
            clearInterval(shaderToggleTimer);
            shaderToggleTimer = null;
        }
        // video要素を非表示
        heroVideo.style.display = 'none';
        heroVideo.style.opacity = '0';
        heroVideo.classList.remove('active');
        // 次の動画を試す
        setTimeout(() => {
            playNextVideoFromPlaylist();
        }, 1000);
    }, { once: true });
}

// Hero画像を設定
function loadHeroImage(heroImagePath) {
    const heroBg = document.getElementById('hero-background-image');
    if (heroBg) {
        let imageUrl = heroImagePath.trim();
        if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
            imageUrl = `assets/hero/${imageUrl}`;
        }
        heroBg.style.backgroundImage = `url('${imageUrl}')`;
        heroBg.style.display = 'block';
    }
}

// スクロール時にナビゲーションバーを表示/非表示
function setupScrollNavbar() {
    const navbar = document.getElementById('main-navbar');
    const heroSection = document.querySelector('.hero-section');
    const body = document.body;
    
    if (!navbar || !heroSection) return;
    
    let lastScrollTop = 0;
    let isNavbarVisible = false;
    
    const updateNavbar = () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const heroHeight = heroSection.offsetHeight;
        
        // ヒーローセクションを過ぎたかどうかをチェック
        if (scrollTop > heroHeight * 0.7) {
            if (!isNavbarVisible) {
                navbar.style.transform = 'translateY(0)';
                body.classList.add('has-navbar');
                isNavbarVisible = true;
            }
        } else {
            if (isNavbarVisible) {
                navbar.style.transform = 'translateY(-100%)';
                body.classList.remove('has-navbar');
                isNavbarVisible = false;
            }
        }
        
        lastScrollTop = scrollTop;
    };
    
    window.addEventListener('scroll', updateNavbar, { passive: true });
    
    // 初期状態を確認
    updateNavbar();
}

// Excelファイルを読み込む
async function loadExcelData() {
    try {
        const response = await fetch(EXCEL_FILE_PATH);
        if (!response.ok) {
            throw new Error('Excelファイルが見つかりません');
        }

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // 最初のシートを取得
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // JSON形式に変換（ヘッダー行を最初の行として使用）
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        // データを正規化
        studentsData = jsonData.map((row, index) => {
            // タグを配列に変換（キーワード列から読み込む）
            const tagString = row['タグ'] || row['キーワード'] || '';
            const tags = tagString.split(',').map(tag => tag.trim()).filter(tag => tag);
            
            return {
                id: row['No'] || index + 1,
                grade: row['所属学年'] || '',
                studentId: row['学籍番号'] || '',
                name: row['氏名'] || '',
                nameEn: row['氏名英字'] || '',
                title: row['題目'] || row['研究題目'] || '',
                imagePath: row['画像パス'] || row['画像'] || '',
                reportPath: row['レポートパス'] || row['レポート'] || '',
                presentationPath: row['プレゼンパス'] || row['プレゼン'] || row['プレゼンテーション'] || '',
                tags: tags
            };
        });

        // ローカルストレージに保存（オプション）
        localStorage.setItem('studentsData', JSON.stringify(studentsData));
        
        displayStudents();
    } catch (error) {
        console.error('Excel読み込みエラー:', error);
        showError('Excelファイルの読み込みに失敗しました。ファイルが正しく配置されているか確認してください。');
        
        // ローカルストレージから読み込む（フォールバック）
        const cachedData = localStorage.getItem('studentsData');
        if (cachedData) {
            studentsData = JSON.parse(cachedData);
            displayStudents();
        }
    }
}

// ビュー切り替えの設定
function setupViewToggle() {
    const cardRadio = document.getElementById('view-card');
    const tableRadio = document.getElementById('view-table');
    
    if (cardRadio && tableRadio) {
        cardRadio.addEventListener('change', () => {
            if (cardRadio.checked) {
                switchView('card');
            }
        });
        
        tableRadio.addEventListener('change', () => {
            if (tableRadio.checked) {
                switchView('table');
            }
        });
    }
}

// ビュー切り替えUIの更新
function updateViewToggleUI() {
    const cardRadio = document.getElementById('view-card');
    const tableRadio = document.getElementById('view-table');
    
    if (cardRadio && tableRadio) {
        if (currentView === 'card') {
            cardRadio.checked = true;
        } else {
            tableRadio.checked = true;
        }
    }
}

// ビューの切り替え
function switchView(view) {
    currentView = view;
    localStorage.setItem('studentListView', view);
    
    const studentList = document.getElementById('student-list');
    const studentTableContainer = document.getElementById('student-table-container');
    
    if (view === 'card') {
        studentList.style.display = '';
        studentTableContainer.style.display = 'none';
        displayStudentsCard();
    } else {
        studentList.style.display = 'none';
        studentTableContainer.style.display = '';
        displayStudentsTable();
    }
}

// 学生一覧を表示
function displayStudents() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');

    loading.style.display = 'none';
    error.style.display = 'none';

    if (studentsData.length === 0) {
        showError('学生データが見つかりませんでした。');
        return;
    }

    // 現在のビューに応じて表示
    if (currentView === 'card') {
        displayStudentsCard();
    } else {
        displayStudentsTable();
    }
}

// カードビューで学生一覧を表示
function displayStudentsCard() {
    const studentList = document.getElementById('student-list');
    studentList.innerHTML = '';

    studentsData.forEach(student => {
        const card = createStudentCard(student);
        studentList.appendChild(card);
    });
}

// 表ビューで学生一覧を表示
function displayStudentsTable() {
    const studentTableBody = document.getElementById('student-table-body');
    if (!studentTableBody) return;
    
    studentTableBody.innerHTML = '';

    studentsData.forEach(student => {
        const row = createStudentTableRow(student);
        studentTableBody.appendChild(row);
    });
}

// 学生テーブル行を作成
function createStudentTableRow(student) {
    const row = document.createElement('tr');
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => {
        window.location.href = `student.html?id=${student.id}`;
    });

    // 画像のパスを決定（最初の画像を使用）
    let imageSrc = '';
    if (student.imagePath) {
        const firstImage = student.imagePath.split(',')[0].trim();
        if (firstImage.startsWith('http')) {
            imageSrc = firstImage;
        } else {
            imageSrc = `assets/images/${student.studentId}/${firstImage}`;
        }
    }

    const tagLabels = createTagLabels(student.tags);
    
    row.innerHTML = `
        <td>
            ${imageSrc 
                ? `<img src="${imageSrc}" alt="${escapeHtml(student.name)}" class="student-table-image" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'60\\' height=\\'60\\'%3E%3Crect fill=\\'%23667eea\\' width=\\'60\\' height=\\'60\\'/%3E%3Ctext fill=\\'%23fff\\' font-family=\\'sans-serif\\' font-size=\\'10\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'0.3em\\'%3E画像なし%3C/text%3E%3C/svg%3E'">` 
                : `<div class="student-table-image-placeholder">画像なし</div>`}
        </td>
        <td>${escapeHtml(student.studentId || '')}</td>
        <td><strong>${escapeHtml(student.title || '')}</strong></td>
        <td>${escapeHtml(student.name || '')}</td>
        <td>${escapeHtml(student.nameEn || '')}</td>
        <td>${escapeHtml(student.grade || '')}</td>
        <td><div class="student-table-tags">${tagLabels || '-'}</div></td>
    `;

    return row;
}

// 学生カードを作成
function createStudentCard(student) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';

    const card = document.createElement('a');
    card.href = `student.html?id=${student.id}`;
    card.className = 'card student-card';

    // 画像のパスを決定（最初の画像を使用）
    let imageSrc = '';
    if (student.imagePath) {
        const firstImage = student.imagePath.split(',')[0].trim();
        if (firstImage.startsWith('http')) {
            imageSrc = firstImage;
        } else {
            // 学籍番号フォルダを含むパスに変換
            imageSrc = `assets/images/${student.studentId}/${firstImage}`;
        }
    }

    const tagLabels = createTagLabels(student.tags);
    
    card.innerHTML = `
        <div class="student-card-image-wrapper">
            ${imageSrc 
                ? `<img src="${imageSrc}" class="card-img-top" alt="${student.name}" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'250\\'%3E%3Crect fill=\\'%23667eea\\' width=\\'400\\' height=\\'250\\'/%3E%3Ctext fill=\\'%23fff\\' font-family=\\'sans-serif\\' font-size=\\'18\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'0.3em\\'%3E画像なし%3C/text%3E%3C/svg%3E'">` 
                : `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: rgba(255,255,255,0.8); font-size: 1.1rem;">画像なし</div>`}
            <div class="student-card-image-overlay"></div>
        </div>
        <div class="card-body student-card-body">
            ${student.title ? `<h5 class="card-title student-card-title">${escapeHtml(student.title)}</h5>` : ''}
            <div class="text-end mt-2">
                <p class="card-text student-card-name mb-1">${escapeHtml(student.name)}</p>
                <p class="card-text student-card-name-en mb-0" style="font-size: 0.9rem;">${escapeHtml(student.nameEn)}</p>
            </div>
            ${tagLabels ? `<div class="student-card-tags mt-3">${tagLabels}</div>` : ''}
        </div>
    `;

    col.appendChild(card);
    return col;
}

// エラーを表示
function showError(message) {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    
    loading.style.display = 'none';
    error.style.display = 'block';
    error.classList.add('show');
    const errorText = error.querySelector('strong').nextSibling;
    if (errorText) {
        errorText.textContent = ' ' + message;
    }
}

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
