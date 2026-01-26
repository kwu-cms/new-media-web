// JSONファイルのパス
const JSON_FILE_PATH = 'data/students.json';

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
    
    // Excelデータを読み込む（完了後にHero動画を読み込む）
    loadExcelData().then(() => {
        loadHeroMedia();
    }).catch(() => {
        // エラー時もHero動画の読み込みを試みる
        loadHeroMedia();
    });
    
    // 保存されたプリセットを読み込む
    loadSavedPresets();
    
    // ランダム範囲設定を初期化
    initializeRandomRanges();
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
            // キャプションを上から下にスライドして消す
            const captionElement = document.getElementById('hero-video-caption');
            if (captionElement) {
                captionElement.classList.remove('show');
                captionElement.classList.add('hiding');
                setTimeout(() => {
                    captionElement.classList.remove('hiding');
                    captionElement.style.display = 'none';
                }, 500);
            }
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
    
    // Excelから読み込んだデータから「hero動画」列を取得
    if (studentsData && studentsData.length > 0) {
        const videoFiles = studentsData
            .map(student => student.heroVideo)
            .filter(video => video && video.trim() !== '') // 空でない動画ファイル名のみ
            .map(video => video.trim());
        
        if (videoFiles.length > 0) {
            heroVideoList = videoFiles.map(file => {
                // 既にパスが含まれている場合はそのまま、そうでなければパスを追加
                if (file.startsWith('assets/') || file.startsWith('/')) {
                    return file;
                }
                return `assets/hero/videos/${file}`;
            });
            console.log('Excelから動画リストを読み込みました:', heroVideoList.length, '件');
            return;
        }
    }
    
    // Excelデータがない、またはhero動画列が空の場合はフォールバック
    try {
        // videos_info.jsonから動画情報を取得
        const response = await fetch('assets/hero/videos/videos_info.json');
        if (response.ok) {
            const videosInfo = await response.json();
            if (videosInfo && videosInfo.length > 0) {
                heroVideoList = videosInfo.map(v => `assets/hero/videos/${v.processed}`);
                console.log('videos_info.jsonから動画リストを読み込みました:', heroVideoList.length, '件');
                return;
            }
        }
    } catch (error) {
        console.log('videos_info.jsonの読み込みに失敗:', error);
    }
    
    // 最後のフォールバック: ハードコードされた動画ファイルリスト
    const videoFiles = [
        '2025_new_media_00001.mp4',
        '2025_new_media_00002.mp4',
        '2025_new_media_00003.mp4',
        '2025_new_media_00004.mp4',
        '2025_new_media_00005.mp4',
        '2025_new_media_00006.mp4',
        '2025_new_media_00007.mp4'
    ];
    
    heroVideoList = videoFiles.map(file => `assets/hero/videos/${file}`);
    console.log('フォールバック動画リストを使用しました:', heroVideoList.length, '件');
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
        rgbShift: { enabled: true, intensity: 0.01, speed: 0.5, offsetX: 0.0, offsetY: 0.0, speedX: 2.0, speedY: 1.5 },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: false },
        vignette: { enabled: false },
        tiling: { enabled: false },
        zoomIn: { enabled: false },
        zoomOut: { enabled: false }
    },
    glitch: {
        rgbShift: { enabled: false },
        glitch: { enabled: true, intensity: 0.2, duration: 0.3, interval: 3.0 },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: false },
        vignette: { enabled: false },
        tiling: { enabled: false },
        zoomIn: { enabled: false },
        zoomOut: { enabled: false }
    },
    mosaic: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: true, size: 25.0 },
        bloom: { enabled: false },
        blur: { enabled: false },
        vignette: { enabled: false },
        tiling: { enabled: false },
        zoomIn: { enabled: false },
        zoomOut: { enabled: false }
    },
    blur: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: true, intensity: 8.0 },
        vignette: { enabled: false },
        tiling: { enabled: false },
        zoomIn: { enabled: false },
        zoomOut: { enabled: false }
    },
    vignette: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: false },
        vignette: { enabled: true, intensity: 0.6, radius: 0.75, softness: 0.4 },
        tiling: { enabled: false },
        zoomIn: { enabled: false },
        zoomOut: { enabled: false }
    },
    bloom: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: true, intensity: 2.0, threshold: 0.6, radius: 15.0 },
        blur: { enabled: false },
        vignette: { enabled: false },
        tiling: { enabled: false },
        zoomIn: { enabled: false },
        zoomOut: { enabled: false }
    },
    tiling: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: false },
        vignette: { enabled: false },
        tiling: { enabled: true, countX: 2.0, countY: 2.0, offsetX: 0.0, offsetY: 0.0 },
        zoomIn: { enabled: false },
        zoomOut: { enabled: false }
    },
    zoomIn: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: false },
        vignette: { enabled: false },
        tiling: { enabled: false },
        zoomIn: { enabled: true, intensity: 0.25, speed: 0.5 },
        zoomOut: { enabled: false }
    },
    zoomOut: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: false },
        vignette: { enabled: false },
        tiling: { enabled: true, countX: 2.0, countY: 2.0, offsetX: 0.0, offsetY: 0.0 },
        zoomIn: { enabled: false },
        zoomOut: { enabled: true, intensity: 0.3, speed: 0.4 }
    },
    // 2つ重ねがけ
    rgbShiftVignette: {
        rgbShift: { enabled: true, intensity: 0.008, speed: 0.5, offsetX: 0.0, offsetY: 0.0, speedX: 2.0, speedY: 1.5 },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: false },
        vignette: { enabled: true, intensity: 0.5, radius: 0.8, softness: 0.3 },
        tiling: { enabled: false },
        zoomIn: { enabled: false },
        zoomOut: { enabled: false }
    },
    blurVignette: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: true, intensity: 6.0 },
        vignette: { enabled: true, intensity: 0.7, radius: 0.7, softness: 0.4 },
        tiling: { enabled: false },
        zoomIn: { enabled: false },
        zoomOut: { enabled: false }
    },
    bloomVignette: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: true, intensity: 1.8, threshold: 0.65, radius: 12.0 },
        blur: { enabled: false },
        vignette: { enabled: true, intensity: 0.55, radius: 0.75, softness: 0.35 },
        tiling: { enabled: false },
        zoomIn: { enabled: false },
        zoomOut: { enabled: false }
    },
    glitchMosaic: {
        rgbShift: { enabled: false },
        glitch: { enabled: true, intensity: 0.18, duration: 0.3, interval: 3.0 },
        mosaic: { enabled: true, size: 30.0 },
        bloom: { enabled: false },
        blur: { enabled: false },
        vignette: { enabled: false },
        tiling: { enabled: false },
        zoomIn: { enabled: false },
        zoomOut: { enabled: false }
    },
    tilingBlur: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: true, intensity: 5.0 },
        vignette: { enabled: false },
        tiling: { enabled: true, countX: 3.0, countY: 3.0, offsetX: 0.0, offsetY: 0.0 },
        zoomIn: { enabled: false },
        zoomOut: { enabled: false }
    },
    zoomInVignette: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: false },
        vignette: { enabled: true, intensity: 0.5, radius: 0.8, softness: 0.3 },
        tiling: { enabled: false },
        zoomIn: { enabled: true, intensity: 0.2, speed: 0.5 },
        zoomOut: { enabled: false }
    },
    zoomOutTiling: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: false },
        vignette: { enabled: false },
        tiling: { enabled: true, countX: 2.5, countY: 2.5, offsetX: 0.0, offsetY: 0.0 },
        zoomIn: { enabled: false },
        zoomOut: { enabled: true, intensity: 0.35, speed: 0.4 }
    },
    zoomOutBlur: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: true, intensity: 6.0 },
        vignette: { enabled: false },
        tiling: { enabled: true, countX: 2.0, countY: 2.0, offsetX: 0.0, offsetY: 0.0 },
        zoomIn: { enabled: false },
        zoomOut: { enabled: true, intensity: 0.3, speed: 0.4 }
    },
    // 効果なし
    none: {
        rgbShift: { enabled: false },
        glitch: { enabled: false },
        mosaic: { enabled: false },
        bloom: { enabled: false },
        blur: { enabled: false },
        vignette: { enabled: false },
        tiling: { enabled: false },
        zoomIn: { enabled: false },
        zoomOut: { enabled: false }
    }
};

// シェーダー効果のプリセットリスト（ランダム選択用）
const SHADER_PRESET_KEYS = Object.keys(SHADER_EFFECT_PRESETS);

// ランダムにシェーダー効果のプリセットを選択
// デバッグモードの場合は、Tweakpaneで有効になっているエフェクトのみを使用
function getRandomShaderPreset() {
    // デバッグモードでdebugConfigが存在する場合は、それを使用
    if (isDebugMode && debugConfig) {
        // debugConfigをディープコピーして返す
        const config = JSON.parse(JSON.stringify(debugConfig));
        return {
            presetName: 'debug-mode',
            config: config
        };
    }
    
    // 通常モードの場合
    // Tweakpaneで設定した値をベースに、ランダム範囲内で値を生成
    if (debugConfig && randomRanges) {
        const config = generateRandomConfigFromDebugConfig();
        return {
            presetName: 'random-from-debug',
            config: config
        };
    }
    
    // 保存されたプリセットがある場合は、それも含めてランダムに選択
    const allPresets = [...SHADER_PRESET_KEYS];
    const allPresetConfigs = [...Object.values(SHADER_EFFECT_PRESETS)];
    
    // 保存されたプリセットを追加
    savedPresets.forEach((preset, index) => {
        allPresets.push(`saved-preset-${index}`);
        allPresetConfigs.push(preset);
    });
    
    // ランダムに選択
    const randomIndex = Math.floor(Math.random() * allPresets.length);
    const presetKey = allPresets[randomIndex];
    const presetConfig = allPresetConfigs[randomIndex];
    
    return {
        presetName: presetKey,
        config: JSON.parse(JSON.stringify(presetConfig)) // ディープコピー
    };
}

// デバッグ設定をベースにランダムな設定を生成
function generateRandomConfigFromDebugConfig() {
    if (!debugConfig) {
        // フォールバック: デフォルトプリセットからランダムに選択
        const randomIndex = Math.floor(Math.random() * SHADER_PRESET_KEYS.length);
        const presetKey = SHADER_PRESET_KEYS[randomIndex];
        return JSON.parse(JSON.stringify(SHADER_EFFECT_PRESETS[presetKey]));
    }
    
    const config = JSON.parse(JSON.stringify(debugConfig));
    
    // 各エフェクトのパラメータをランダム化（enabledがtrueの場合のみ）
    // パラメータが範囲オブジェクト（{min, max}）の場合は範囲内でランダム生成
    // パラメータが数値の場合は、randomRangesを使用してランダム化
    
    if (config.rgbShift && config.rgbShift.enabled) {
        // intensity, speed: パラメータを参考に（現在の値 ± ランダム範囲）
        config.rgbShift.intensity = getRandomValue(config.rgbShift.intensity, randomRanges?.rgbShift?.intensity);
        config.rgbShift.speed = getRandomValue(config.rgbShift.speed, randomRanges?.rgbShift?.speed);
        
        // offsetX, offsetY: 適当に散らす（固定範囲でランダム生成）
        // 範囲形式の設定がある場合はそれを使用、なければ -0.01 から 0.01 の範囲
        if (config.rgbShift.offsetX && typeof config.rgbShift.offsetX === 'object' && 'min' in config.rgbShift.offsetX) {
            config.rgbShift.offsetX = getRandomValue(config.rgbShift.offsetX);
        } else {
            config.rgbShift.offsetX = getRandomValue({ min: -0.01, max: 0.01 });
        }
        if (config.rgbShift.offsetY && typeof config.rgbShift.offsetY === 'object' && 'min' in config.rgbShift.offsetY) {
            config.rgbShift.offsetY = getRandomValue(config.rgbShift.offsetY);
        } else {
            config.rgbShift.offsetY = getRandomValue({ min: -0.01, max: 0.01 });
        }
        
        // speedX, speedY: 0から離して、-2から2の範囲で散らす（0を含まない）
        // excludeZeroフラグがある場合は0を除外、なければ通常のランダム生成
        if (config.rgbShift.speedX && typeof config.rgbShift.speedX === 'object' && 'min' in config.rgbShift.speedX) {
            if (config.rgbShift.speedX.excludeZero) {
                config.rgbShift.speedX = getRandomValueExcludingZero({ min: config.rgbShift.speedX.min, max: config.rgbShift.speedX.max });
            } else {
                config.rgbShift.speedX = getRandomValue(config.rgbShift.speedX);
            }
        } else {
            config.rgbShift.speedX = getRandomValueExcludingZero({ min: -2.0, max: 2.0 });
        }
        if (config.rgbShift.speedY && typeof config.rgbShift.speedY === 'object' && 'min' in config.rgbShift.speedY) {
            if (config.rgbShift.speedY.excludeZero) {
                config.rgbShift.speedY = getRandomValueExcludingZero({ min: config.rgbShift.speedY.min, max: config.rgbShift.speedY.max });
            } else {
                config.rgbShift.speedY = getRandomValue(config.rgbShift.speedY);
            }
        } else {
            config.rgbShift.speedY = getRandomValueExcludingZero({ min: -2.0, max: 2.0 });
        }
    }
    
    if (config.glitch && config.glitch.enabled) {
        // Glitchは範囲形式の設定をサポート
        // 範囲形式: { normal: {...}, strong: {...}, strongProbability: 0.2 }
        if (config.glitch.normal && config.glitch.strong) {
            // 範囲形式の設定
            const strongProbability = config.glitch.strongProbability !== undefined ? config.glitch.strongProbability : 0.2;
            const useStrongGlitch = Math.random() < strongProbability;
            
            if (useStrongGlitch) {
                // 強い設定
                config.glitch.intensity = getRandomValue(config.glitch.strong.intensity);
                config.glitch.duration = getRandomValue(config.glitch.strong.duration);
                config.glitch.interval = getRandomValue(config.glitch.strong.interval);
            } else {
                // 通常設定
                config.glitch.intensity = getRandomValue(config.glitch.normal.intensity);
                config.glitch.duration = getRandomValue(config.glitch.normal.duration);
                config.glitch.interval = getRandomValue(config.glitch.normal.interval);
            }
            // 範囲形式のプロパティを削除
            delete config.glitch.normal;
            delete config.glitch.strong;
            delete config.glitch.strongProbability;
        } else {
            // 通常形式の設定（後方互換性のため）
            // 80%で通常設定、20%で強い設定
            const useStrongGlitch = Math.random() < 0.2;
            
            if (useStrongGlitch) {
                // 強い設定（2枚目の画像の値）
                config.glitch.intensity = getRandomValue({ min: 0.9, max: 1.0 }, randomRanges?.glitch?.intensity);
                config.glitch.duration = getRandomValue({ min: 0.5, max: 0.7 }, randomRanges?.glitch?.duration);
                config.glitch.interval = getRandomValue({ min: 0.5, max: 0.9 }, randomRanges?.glitch?.interval);
            } else {
                // 通常設定（1枚目の画像の値）
                config.glitch.intensity = getRandomValue({ min: 0.7, max: 0.85 }, randomRanges?.glitch?.intensity);
                config.glitch.duration = getRandomValue({ min: 0.4, max: 0.6 }, randomRanges?.glitch?.duration);
                config.glitch.interval = getRandomValue({ min: 1.4, max: 1.8 }, randomRanges?.glitch?.interval);
            }
        }
    }
    
    if (config.mosaic && config.mosaic.enabled) {
        // Mosaicのsizeは15-100の間で6刻み（15, 21, 27, 33, ..., 99）でランダムに選ぶ
        const mosaicValues = [];
        for (let i = 15; i <= 100; i += 6) {
            mosaicValues.push(i);
        }
        // 開始値をランダムに選ぶ
        const size1 = mosaicValues[Math.floor(Math.random() * mosaicValues.length)];
        
        // 100などの大きな数字からスタートする場合は0になる方が効果的
        let size2;
        if (size1 >= 60) {
            // 大きい値（60以上）からスタートする場合は0へ
            size2 = 0;
        } else {
            // 小さい値からスタートする場合は別の値をランダムに選ぶ
            size2 = mosaicValues[Math.floor(Math.random() * mosaicValues.length)];
        }
        
        config.mosaic.size = size1; // 現在の値（後方互換性のため）
        config.mosaic.sizeFrom = size1; // イージング開始値
        config.mosaic.sizeTo = size2;   // イージング終了値
        config.mosaic.easingDuration = 0.5 + Math.random() * 0.5; // 0.5-1.0秒のランダム
    }
    
    if (config.bloom && config.bloom.enabled) {
        // Bloomのintensityは2.0-4.0の間で0.5刻み（2.0, 2.5, 3.0, 3.5, 4.0）でランダムに選ぶ
        const bloomIntensityValues = [];
        for (let i = 2.0; i <= 4.0; i += 0.5) {
            bloomIntensityValues.push(i);
        }
        config.bloom.intensity = bloomIntensityValues[Math.floor(Math.random() * bloomIntensityValues.length)];
        
        // thresholdとradiusは通常通りランダム化
        config.bloom.threshold = getRandomValue(config.bloom.threshold, randomRanges?.bloom?.threshold);
        config.bloom.radius = getRandomValue(config.bloom.radius, randomRanges?.bloom?.radius);
    }
    
    if (config.blur && config.blur.enabled) {
        // Blurのintensityは0-20の間で5刻み（0, 5, 10, 15, 20）でランダムに選ぶ
        const blurIntensityValues = [];
        for (let i = 0; i <= 20; i += 5) {
            blurIntensityValues.push(i);
        }
        // 2つの値をランダムに選ぶ（イージング用）
        const intensity1 = blurIntensityValues[Math.floor(Math.random() * blurIntensityValues.length)];
        const intensity2 = blurIntensityValues[Math.floor(Math.random() * blurIntensityValues.length)];
        
        config.blur.intensity = intensity1; // 現在の値（後方互換性のため）
        config.blur.intensityFrom = intensity1; // イージング開始値
        config.blur.intensityTo = intensity2;   // イージング終了値
        config.blur.easingDuration = 2.0; // イージングの期間（秒）
    }
    
    // Vignetteはパラメータをランダム化せず、ON/OFFのみランダムに選ぶ
    // （パラメータはTweakpaneで設定した値を使用）
    // enabledのON/OFFは既にプリセットやデバッグ設定で決定されているため、ここでは変更しない
    
    if (config.tiling && config.tiling.enabled) {
        // TilingのcountX/countYは以下のパターンからランダムに選ぶ：
        // 1. 同数から同数へ（拡大縮小効果）- 50%の確率
        // 2. 極端に異なる比率（例: countX=1, countY=10など）- 50%の確率
        // イージングの途中（70-80%の地点）で次の値が設定されるため、連続的に変化する
        
        const useSameValue = Math.random() < 0.5; // 50%の確率で同数パターン
        
        // 現在の値を開始値として使用（countXTo/countYToが設定されている場合は、それを現在値として使用）
        // これにより、イージングの途中で次の値が設定される
        const currentCountX = config.tiling.countXTo !== undefined ? config.tiling.countXTo : (config.tiling.countX || 2.0);
        const currentCountY = config.tiling.countYTo !== undefined ? config.tiling.countYTo : (config.tiling.countY || 2.0);
        
        if (useSameValue) {
            // 同数から同数へ（拡大縮小効果）
            // 1-10の範囲でランダムに選ぶ
            const sameValue = Math.floor(Math.random() * 10) + 1;
            // 現在の値から新しい値へ（イージングの途中で次の値が設定される）
            config.tiling.countX = currentCountX;
            config.tiling.countY = currentCountY;
            config.tiling.countXTo = sameValue;
            config.tiling.countYTo = sameValue; // 同じ値
            config.tiling.easingDuration = 2.0 + Math.random() * 2.0; // 2-4秒
        } else {
            // 極端に異なる比率
            // countXとcountYを1-10の範囲でランダムに選ぶ
            const countX = Math.floor(Math.random() * 10) + 1;
            const countY = Math.floor(Math.random() * 10) + 1;
            // 現在の値から新しい値へ（イージングの途中で次の値が設定される）
            config.tiling.countX = currentCountX;
            config.tiling.countY = currentCountY;
            config.tiling.countXTo = countX;
            config.tiling.countYTo = countY;
            config.tiling.easingDuration = 2.0 + Math.random() * 2.0; // 2-4秒
        }
        
        // offsetX/Yは適当に散らす（固定範囲でランダム生成）
        // 範囲形式の設定がある場合はそれを使用、なければ -0.5 から 0.5 の範囲
        if (config.tiling.offsetX && typeof config.tiling.offsetX === 'object' && 'min' in config.tiling.offsetX) {
            config.tiling.offsetX = getRandomValue(config.tiling.offsetX);
        } else {
            config.tiling.offsetX = getRandomValue({ min: -0.5, max: 0.5 });
        }
        if (config.tiling.offsetY && typeof config.tiling.offsetY === 'object' && 'min' in config.tiling.offsetY) {
            config.tiling.offsetY = getRandomValue(config.tiling.offsetY);
        } else {
            config.tiling.offsetY = getRandomValue({ min: -0.5, max: 0.5 });
        }
    }
    
    if (config.zoomIn && config.zoomIn.enabled) {
        config.zoomIn.intensity = getRandomValue(config.zoomIn.intensity, randomRanges?.zoomIn?.intensity);
        config.zoomIn.speed = getRandomValue(config.zoomIn.speed, randomRanges?.zoomIn?.speed);
    }
    
    if (config.zoomOut && config.zoomOut.enabled) {
        config.zoomOut.intensity = getRandomValue(config.zoomOut.intensity, randomRanges?.zoomOut?.intensity);
        config.zoomOut.speed = getRandomValue(config.zoomOut.speed, randomRanges?.zoomOut?.speed);
    }
    
    return config;
}

// 値をランダム範囲内でランダム化
// value: 数値または範囲オブジェクト（{min, max}）
// range: ランダム範囲（±値、randomRangesから取得）
function getRandomValue(value, range) {
    // 範囲オブジェクトの場合は、その範囲内でランダム生成
    if (value && typeof value === 'object' && 'min' in value && 'max' in value) {
        const min = value.min;
        const max = value.max;
        const randomValue = min + Math.random() * (max - min);
        // 小数点以下を適切な桁数に丸める
        const decimals = (max - min) < 0.01 ? 4 : ((max - min) < 0.1 ? 3 : 2);
        return Math.round(randomValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }
    
    // 数値の場合は、rangeを使用してランダム化
    if (typeof value === 'number') {
        if (range === undefined || range === null || range === 0) {
            return value;
        }
        const min = Math.max(0, value - Math.abs(range));
        const max = value + Math.abs(range);
        const randomValue = min + Math.random() * (max - min);
        // 小数点以下を適切な桁数に丸める（範囲に応じて）
        const decimals = range < 0.01 ? 4 : (range < 0.1 ? 3 : 2);
        return Math.round(randomValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }
    
    // その他の場合はそのまま返す
    return value;
}

// 値をランダム範囲内でランダム化（0を除外）
// value: 範囲オブジェクト（{min, max}）
function getRandomValueExcludingZero(range) {
    if (!range || typeof range !== 'object' || !('min' in range) || !('max' in range)) {
        return 0;
    }
    
    const min = range.min;
    const max = range.max;
    
    // 範囲が0を含む場合、0を除外してランダム生成
    if (min <= 0 && max >= 0) {
        // 0を含む範囲を2つに分割してランダム選択
        if (Math.random() < 0.5) {
            // 負の範囲から選択
            const randomValue = min + Math.random() * (-0.01 - min);
            const decimals = Math.abs(min) < 0.01 ? 4 : (Math.abs(min) < 0.1 ? 3 : 2);
            return Math.round(randomValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
        } else {
            // 正の範囲から選択
            const randomValue = 0.01 + Math.random() * (max - 0.01);
            const decimals = max < 0.01 ? 4 : (max < 0.1 ? 3 : 2);
            return Math.round(randomValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
        }
    } else {
        // 0を含まない範囲の場合は通常通り
        const randomValue = min + Math.random() * (max - min);
        const decimals = (max - min) < 0.01 ? 4 : ((max - min) < 0.1 ? 3 : 2);
        return Math.round(randomValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }
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
    // デバッグモードが有効な場合は、シェーダーを常にONにするため、切り替えを行わない
    if (isDebugMode) {
        return;
    }
    
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
    
    // デバッグモードが有効な場合は、タイマーを開始せず、常にシェーダーをONにする
    if (isDebugMode) {
        // 既存のタイマーを停止
        if (shaderToggleTimer) {
            clearInterval(shaderToggleTimer);
            shaderToggleTimer = null;
        }
        
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
        
        // 常にシェーダーをONにする
        isShaderActive = true;
        applyShaderState();
        
        console.log('デバッグモード: シェーダーを常にONにします');
        return;
    }
    
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
        
        // キャプションを更新
        updateHeroVideoCaption(videoUrl);
        
        // プレイリストアイテムからシェーダー設定を取得して適用
        // デバッグモードの場合はデバッグ設定を優先
        if (!isDebugMode && playlistItem && playlistItem.shaderConfig) {
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
        } else if (isDebugMode && debugConfig) {
            // デバッグモードの場合はデバッグ設定を適用
            if (typeof HeroVideoShader !== 'undefined' && HERO_SHADER_CONFIG && HERO_SHADER_CONFIG.enabled) {
                if (!heroVideoShader) {
                    heroVideoShader = new HeroVideoShader(heroVideo, null);
                }
                if (heroVideoShader && heroVideoShader.isShaderEnabled()) {
                    heroVideoShader.setConfig(debugConfig);
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
        
        // キャプションを上から下にスライドして消す
        const captionElement = document.getElementById('hero-video-caption');
        if (captionElement) {
            captionElement.classList.remove('show');
            captionElement.classList.add('hiding');
            setTimeout(() => {
                captionElement.classList.remove('hiding');
                captionElement.style.display = 'none';
            }, 500);
        }
        
        // 次の動画を試す
        setTimeout(() => {
            playNextVideoFromPlaylist();
        }, 1000);
    }, { once: true });
}

// Hero動画のキャプションを更新
function updateHeroVideoCaption(videoUrl) {
    const captionElement = document.getElementById('hero-video-caption');
    const captionTitle = document.getElementById('hero-video-caption-title');
    const captionLink = document.getElementById('hero-video-caption-link');
    
    if (!captionElement || !captionTitle || !captionLink) {
        console.error('キャプション要素が見つかりません');
        return;
    }
    
    // まず既存のキャプションを上から下にスライドして消す
    const isCurrentlyVisible = captionElement.classList.contains('show');
    if (isCurrentlyVisible) {
        captionElement.classList.remove('show');
        captionElement.classList.add('hiding');
        // スライドアウト完了を待つ（0.5秒）
        setTimeout(() => {
            captionElement.classList.remove('hiding');
            updateCaptionContent(videoUrl, captionElement, captionTitle, captionLink);
        }, 500);
    } else {
        // 既に非表示の場合はすぐに更新
        captionElement.classList.remove('hiding');
        updateCaptionContent(videoUrl, captionElement, captionTitle, captionLink);
    }
}

// キャプションの内容を更新
function updateCaptionContent(videoUrl, captionElement, captionTitle, captionLink) {
    console.log('キャプション更新開始:', videoUrl);
    
    // 動画URLから学籍番号を抽出
    // 例: assets/hero/videos/1522074.mp4 → 1522074
    const filenameMatch = videoUrl.match(/([^\/]+)\.(mp4|mov|avi|mkv|webm|m4v)$/i);
    if (!filenameMatch) {
        console.log('ファイル名の抽出に失敗:', videoUrl);
        // キャプションを上から下にスライドして消す
        captionElement.classList.remove('show');
        captionElement.classList.add('hiding');
        setTimeout(() => {
            captionElement.classList.remove('hiding');
            captionElement.style.display = 'none';
        }, 500);
        return;
    }
    
    const filename = filenameMatch[1];
    console.log('抽出されたファイル名:', filename);
    
    // 学籍番号を抽出（ファイル名から拡張子を除いた部分）
    // 学籍番号は通常7桁の数字
    const studentIdMatch = filename.match(/(\d{7})/);
    if (!studentIdMatch) {
        console.log('学籍番号の抽出に失敗:', filename);
        // キャプションを上から下にスライドして消す
        captionElement.classList.remove('show');
        captionElement.classList.add('hiding');
        setTimeout(() => {
            captionElement.classList.remove('hiding');
            captionElement.style.display = 'none';
        }, 500);
        return;
    }
    
    const studentId = studentIdMatch[1];
    console.log('抽出された学籍番号:', studentId);
    console.log('学生データ数:', studentsData.length);
    
    // 学生データから該当する学生を検索
    const student = studentsData.find(s => String(s.studentId) === String(studentId));
    
    if (!student) {
        console.log('学生が見つかりません:', studentId);
        // キャプションを上から下にスライドして消す
        captionElement.classList.remove('show');
        captionElement.classList.add('hiding');
        setTimeout(() => {
            captionElement.classList.remove('hiding');
            captionElement.style.display = 'none';
        }, 500);
        return;
    }
    
    if (!student.title) {
        console.log('学生のタイトルがありません:', student);
        // キャプションを上から下にスライドして消す
        captionElement.classList.remove('show');
        captionElement.classList.add('hiding');
        setTimeout(() => {
            captionElement.classList.remove('hiding');
            captionElement.style.display = 'none';
        }, 500);
        return;
    }
    
    console.log('学生データが見つかりました:', student);
    
    // キャプションを更新
    captionTitle.textContent = student.title;
    captionLink.href = `student.html?id=${student.id}`;
    
    // キャプションを表示（フェードイン）
    captionElement.style.display = 'block';
    setTimeout(() => {
        captionElement.classList.add('show');
        console.log('キャプションを表示しました:', student.title);
    }, 50);
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

// JSONファイルを読み込む
async function loadExcelData() {
    try {
        const jsonResponse = await fetch(JSON_FILE_PATH);
        if (!jsonResponse.ok) {
            throw new Error('JSONファイルが見つかりません');
        }

        const jsonData = await jsonResponse.json();
        if (!Array.isArray(jsonData) || jsonData.length === 0) {
            throw new Error('JSONファイルのデータが無効です');
        }

        studentsData = jsonData;
        console.log(`JSONファイルから読み込みました: ${studentsData.length}件の学生データ`);
        
        // ローカルストレージに保存
        localStorage.setItem('studentsData', JSON.stringify(studentsData));
        
        displayStudents();
    } catch (error) {
        console.error('JSON読み込みエラー:', error);
        showError('JSONファイルの読み込みに失敗しました。ファイルが正しく配置されているか確認してください。');
        
        // ローカルストレージから読み込む（フォールバック）
        const cachedData = localStorage.getItem('studentsData');
        if (cachedData) {
            studentsData = JSON.parse(cachedData);
            console.log(`ローカルストレージから読み込みました: ${studentsData.length}件の学生データ`);
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

// デバッグモード管理
let isDebugMode = false;
let debugPane = null;
let debugConfig = null;
let debugConfigReplaylistTimer = null; // デバッグ設定変更時のプレイリスト再生成タイマー
let savedPresets = []; // 保存されたプリセット（JSONから読み込んだもの）
let randomRanges = null; // パラメータのランダム範囲設定

// デバッグモードのトグル（Cmd+D / Ctrl+D）
// DOMContentLoadedの後に実行されるようにする
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('keydown', (e) => {
        // 入力フィールドにフォーカスがある場合は無視
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }
        
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
                      navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
        const isDebugKey = isMac 
            ? (e.metaKey && (e.key === 'd' || e.key === 'D'))
            : (e.ctrlKey && (e.key === 'd' || e.key === 'D'));
        
        if (isDebugKey) {
            e.preventDefault();
            e.stopPropagation();
            toggleDebugMode();
        }
    });
});

// デバッグモードのトグル
function toggleDebugMode() {
    // Tweakpaneを表示する場合は必ずdebugModeをtrueにする
    if (!isDebugMode) {
        isDebugMode = true;
        console.log('デバッグモード: ON（Tweakpane表示）');
        
        // 既存のシェーダー切り替えタイマーを停止
        if (shaderToggleTimer) {
            clearInterval(shaderToggleTimer);
            shaderToggleTimer = null;
        }
        
        initDebugPane();
        
        // デバッグモードが有効になったら、シェーダーを常にONにする
        const heroVideo = document.getElementById('hero-background-video');
        if (heroVideo && typeof HeroVideoShader !== 'undefined' && HERO_SHADER_CONFIG && HERO_SHADER_CONFIG.enabled) {
            if (!heroVideoShader) {
                heroVideoShader = new HeroVideoShader(heroVideo, null);
            }
            if (heroVideoShader && heroVideoShader.isShaderEnabled()) {
                isShaderActive = true;
                applyShaderState();
            }
        }
        
        // デバッグモードが有効になったら、現在のプレイリストを再生成
        if (heroVideoList.length > 0) {
            generateNewPlaylist();
            console.log('デバッグモード有効化によりプレイリストを再生成しました');
        }
    } else {
        // 既にデバッグモードが有効な場合は、Tweakpaneを非表示にしてdebugModeをfalseにする
        isDebugMode = false;
        console.log('デバッグモード: OFF');
        destroyDebugPane();
        
        // 通常モードに戻すため、シェーダー切り替えタイマーを再開
        startShaderToggle();
        
        // デバッグモードが無効になったら、通常モードのプレイリストを再生成
        if (heroVideoList.length > 0) {
            generateNewPlaylist();
            console.log('デバッグモード無効化によりプレイリストを再生成しました');
        }
    }
}

// デバッグパネルの初期化
function initDebugPane() {
    if (debugPane) {
        console.log('デバッグパネルは既に存在します');
        return;
    }
    
    // Tweakpaneが利用可能か確認（複数の可能性をチェック）
    // Tweakpane 4.0はESモジュールとして提供されるため、グローバル変数の確認方法を拡張
    let TweakpaneClass = null;
    
    // Tweakpane 4.0の可能性をチェック（ESモジュールからインポートされた場合）
    if (typeof window.Tweakpane !== 'undefined') {
        if (typeof window.Tweakpane.Pane !== 'undefined') {
            TweakpaneClass = window.Tweakpane.Pane;
        } else if (typeof window.Tweakpane === 'function') {
            // Tweakpane 4.0ではPaneが直接エクスポートされる可能性
            TweakpaneClass = window.Tweakpane;
        }
    }
    
    // Tweakpane 3.xの可能性をチェック
    if (!TweakpaneClass && typeof Tweakpane !== 'undefined') {
        if (typeof Tweakpane.Pane !== 'undefined') {
            TweakpaneClass = Tweakpane.Pane;
        }
    }
    
    // Paneが直接グローバル変数として利用可能な場合
    if (!TweakpaneClass) {
        if (typeof Pane !== 'undefined') {
            TweakpaneClass = Pane;
        } else if (typeof window.Pane !== 'undefined') {
            TweakpaneClass = window.Pane;
        }
    }
    
    if (!TweakpaneClass) {
        console.error('Tweakpaneが読み込まれていません。Tweakpaneライブラリを確認してください。');
        console.log('Tweakpaneの状態:', {
            Tweakpane: typeof Tweakpane,
            windowTweakpane: typeof window.Tweakpane,
            Pane: typeof Pane,
            windowPane: typeof window.Pane
        });
        console.log('windowオブジェクトの確認:', Object.keys(window).filter(k => 
            k.toLowerCase().includes('tweak') || 
            k.toLowerCase().includes('pane') ||
            k === 'Tweakpane' ||
            k === 'Pane'
        ));
        // Tweakpane 4.0がESモジュールとして読み込まれている場合のヒント
        console.log('ヒント: Tweakpane 4.0はESモジュールとして提供されます。type="module"を使用するか、UMD版を使用してください。');
        return;
    }
    
    console.log('Tweakpaneが利用可能です:', TweakpaneClass);
    
    // 現在のシェーダー設定を取得またはデフォルト設定を作成
    debugConfig = getCurrentShaderConfig();
    // 設定が完全であることを確認（すべてのパラメータが存在することを保証）
    ensureConfigComplete(debugConfig);
    console.log('デバッグ設定を取得しました:', debugConfig);
    console.log('debugConfigの構造確認:', {
        enabled: typeof debugConfig.enabled,
        rgbShift: debugConfig.rgbShift ? {
            enabled: debugConfig.rgbShift.enabled,
            hasOffsetX: typeof debugConfig.rgbShift.offsetX !== 'undefined',
            hasOffsetY: typeof debugConfig.rgbShift.offsetY !== 'undefined',
            hasSpeedX: typeof debugConfig.rgbShift.speedX !== 'undefined',
            hasSpeedY: typeof debugConfig.rgbShift.speedY !== 'undefined'
        } : 'undefined',
        mosaic: debugConfig.mosaic ? {
            enabled: debugConfig.mosaic.enabled,
            hasSizeFrom: typeof debugConfig.mosaic.sizeFrom !== 'undefined',
            hasSizeTo: typeof debugConfig.mosaic.sizeTo !== 'undefined',
            hasEasingDuration: typeof debugConfig.mosaic.easingDuration !== 'undefined'
        } : 'undefined',
        zoomIn: typeof debugConfig.zoomIn,
        zoomOut: typeof debugConfig.zoomOut
    });
    
    try {
        // Tweakpaneインスタンスを作成
        debugPane = new TweakpaneClass({
            title: 'Shader Debug',
            expanded: true
        });
        console.log('Tweakpaneパネルを作成しました:', debugPane);
        console.log('Tweakpaneのメソッド:', Object.getOwnPropertyNames(Object.getPrototypeOf(debugPane)).filter(m => m.includes('add')));
    } catch (error) {
        console.error('Tweakpaneパネルの作成に失敗しました:', error);
        console.error('エラーの詳細:', error.stack);
        return;
    }
    
    // シェーダー有効/無効
    try {
        debugPane.addBinding(debugConfig, 'enabled', {
            label: 'Shader Enabled'
        }).on('change', () => {
            if (typeof HERO_SHADER_CONFIG !== 'undefined') {
                HERO_SHADER_CONFIG.enabled = debugConfig.enabled;
            }
        });
        console.log('Shader Enabledバインディングを追加しました');
    } catch (error) {
        console.error('Shader Enabledバインディングの追加に失敗:', error);
    }
    
    // RGB Shift
    try {
        // debugConfig.rgbShiftが存在し、新しいパラメータが含まれていることを確認
        if (!debugConfig.rgbShift) {
            debugConfig.rgbShift = { enabled: false, intensity: 0.01, speed: 0.5, offsetX: 0.0, offsetY: 0.0, speedX: 2.0, speedY: 1.5 };
        }
        if (typeof debugConfig.rgbShift.offsetX === 'undefined') {
            debugConfig.rgbShift.offsetX = 0.0;
        }
        if (typeof debugConfig.rgbShift.offsetY === 'undefined') {
            debugConfig.rgbShift.offsetY = 0.0;
        }
        if (typeof debugConfig.rgbShift.speedX === 'undefined') {
            debugConfig.rgbShift.speedX = 2.0;
        }
        if (typeof debugConfig.rgbShift.speedY === 'undefined') {
            debugConfig.rgbShift.speedY = 1.5;
        }
        
        // ensureConfigCompleteでパラメータを補完
        ensureConfigComplete(debugConfig);
        
        const rgbShiftFolder = debugPane.addFolder({ title: 'RGB Shift', expanded: true });
        
        // enabled
        rgbShiftFolder.addBinding(debugConfig.rgbShift, 'enabled').on('change', applyDebugConfig);
        
        // intensity（強度）
        rgbShiftFolder.addBinding(debugConfig.rgbShift, 'intensity', { min: 0, max: 0.05, step: 0.001 }).on('change', applyDebugConfig);
        
        // speed（速度）
        rgbShiftFolder.addBinding(debugConfig.rgbShift, 'speed', { min: 0, max: 2, step: 0.1 }).on('change', applyDebugConfig);
        
        // offsetX（X方向のオフセット）
        rgbShiftFolder.addBinding(debugConfig.rgbShift, 'offsetX', { min: -0.1, max: 0.1, step: 0.001 }).on('change', applyDebugConfig);
        
        // offsetY（Y方向のオフセット）
        rgbShiftFolder.addBinding(debugConfig.rgbShift, 'offsetY', { min: -0.1, max: 0.1, step: 0.001 }).on('change', applyDebugConfig);
        
        // speedX（X方向の速度係数）
        rgbShiftFolder.addBinding(debugConfig.rgbShift, 'speedX', { min: 0, max: 5, step: 0.1 }).on('change', applyDebugConfig);
        
        // speedY（Y方向の速度係数）
        rgbShiftFolder.addBinding(debugConfig.rgbShift, 'speedY', { min: 0, max: 5, step: 0.1 }).on('change', applyDebugConfig);
        
        console.log('RGB Shiftフォルダを追加しました');
        console.log('RGB Shift設定:', debugConfig.rgbShift);
        console.log('RGB Shiftパラメータ確認:', {
            enabled: debugConfig.rgbShift.enabled,
            intensity: debugConfig.rgbShift.intensity,
            speed: debugConfig.rgbShift.speed,
            offsetX: debugConfig.rgbShift.offsetX,
            offsetY: debugConfig.rgbShift.offsetY,
            speedX: debugConfig.rgbShift.speedX,
            speedY: debugConfig.rgbShift.speedY
        });
    } catch (error) {
        console.error('RGB Shiftフォルダの追加に失敗:', error);
    }
    
    // Glitch
    try {
        const glitchFolder = debugPane.addFolder({ title: 'Glitch', expanded: true });
        glitchFolder.addBinding(debugConfig.glitch, 'enabled').on('change', applyDebugConfig);
        glitchFolder.addBinding(debugConfig.glitch, 'intensity', { min: 0, max: 1, step: 0.01 }).on('change', applyDebugConfig);
        glitchFolder.addBinding(debugConfig.glitch, 'duration', { min: 0, max: 2, step: 0.1 }).on('change', applyDebugConfig);
        glitchFolder.addBinding(debugConfig.glitch, 'interval', { min: 0, max: 10, step: 0.1 }).on('change', applyDebugConfig);
        console.log('Glitchフォルダを追加しました');
    } catch (error) {
        console.error('Glitchフォルダの追加に失敗:', error);
    }
    
    // Mosaic
    try {
        const mosaicFolder = debugPane.addFolder({ title: 'Mosaic', expanded: true });
        mosaicFolder.addBinding(debugConfig.mosaic, 'enabled').on('change', applyDebugConfig);
        mosaicFolder.addBinding(debugConfig.mosaic, 'size', { min: 1, max: 100, step: 1 }).on('change', applyDebugConfig);
        mosaicFolder.addBinding(debugConfig.mosaic, 'sizeFrom', { min: 0, max: 100, step: 6 }).on('change', applyDebugConfig);
        mosaicFolder.addBinding(debugConfig.mosaic, 'sizeTo', { min: 0, max: 100, step: 6 }).on('change', applyDebugConfig);
        mosaicFolder.addBinding(debugConfig.mosaic, 'easingDuration', { min: 0.1, max: 2.0, step: 0.1 }).on('change', applyDebugConfig);
        console.log('Mosaicフォルダを追加しました');
    } catch (error) {
        console.error('Mosaicフォルダの追加に失敗:', error);
    }
    
    // Bloom
    try {
        const bloomFolder = debugPane.addFolder({ title: 'Bloom', expanded: true });
        bloomFolder.addBinding(debugConfig.bloom, 'enabled').on('change', applyDebugConfig);
        bloomFolder.addBinding(debugConfig.bloom, 'intensity', { min: 0, max: 5, step: 0.1 }).on('change', applyDebugConfig);
        bloomFolder.addBinding(debugConfig.bloom, 'threshold', { min: 0, max: 1, step: 0.01 }).on('change', applyDebugConfig);
        bloomFolder.addBinding(debugConfig.bloom, 'radius', { min: 0, max: 50, step: 1 }).on('change', applyDebugConfig);
        console.log('Bloomフォルダを追加しました');
    } catch (error) {
        console.error('Bloomフォルダの追加に失敗:', error);
    }
    
    // Blur
    try {
        // debugConfig.blurが存在することを確認
        if (!debugConfig.blur) {
            debugConfig.blur = { enabled: false, intensity: 5.0, intensityFrom: 5.0, intensityTo: 5.0, easingDuration: 2.0 };
        }
        
        // ensureConfigCompleteでパラメータを補完（他のエフェクトと同様）
        ensureConfigComplete(debugConfig);
        
        const blurFolder = debugPane.addFolder({ title: 'Blur', expanded: true });
        blurFolder.addBinding(debugConfig.blur, 'enabled').on('change', applyDebugConfig);
        blurFolder.addBinding(debugConfig.blur, 'intensity', { min: 0, max: 20, step: 0.5 }).on('change', applyDebugConfig);
        blurFolder.addBinding(debugConfig.blur, 'intensityFrom', { min: 0, max: 20, step: 5 }).on('change', applyDebugConfig);
        blurFolder.addBinding(debugConfig.blur, 'intensityTo', { min: 0, max: 20, step: 5 }).on('change', applyDebugConfig);
        blurFolder.addBinding(debugConfig.blur, 'easingDuration', { min: 0.5, max: 5.0, step: 0.1 }).on('change', applyDebugConfig);
        console.log('Blurフォルダを追加しました');
    } catch (error) {
        console.error('Blurフォルダの追加に失敗:', error);
        console.error('エラーの詳細:', error.stack);
    }
    
    // Vignette
    try {
        const vignetteFolder = debugPane.addFolder({ title: 'Vignette', expanded: true });
        vignetteFolder.addBinding(debugConfig.vignette, 'enabled').on('change', applyDebugConfig);
        vignetteFolder.addBinding(debugConfig.vignette, 'intensity', { min: 0, max: 1, step: 0.01 }).on('change', applyDebugConfig);
        vignetteFolder.addBinding(debugConfig.vignette, 'radius', { min: 0, max: 1, step: 0.01 }).on('change', applyDebugConfig);
        vignetteFolder.addBinding(debugConfig.vignette, 'softness', { min: 0, max: 1, step: 0.01 }).on('change', applyDebugConfig);
        console.log('Vignetteフォルダを追加しました');
    } catch (error) {
        console.error('Vignetteフォルダの追加に失敗:', error);
    }
    
    // Tiling
    try {
        const tilingFolder = debugPane.addFolder({ title: 'Tiling', expanded: true });
        tilingFolder.addBinding(debugConfig.tiling, 'enabled').on('change', applyDebugConfig);
        tilingFolder.addBinding(debugConfig.tiling, 'countX', { min: 1, max: 10, step: 0.1 }).on('change', applyDebugConfig);
        tilingFolder.addBinding(debugConfig.tiling, 'countY', { min: 1, max: 10, step: 0.1 }).on('change', applyDebugConfig);
        tilingFolder.addBinding(debugConfig.tiling, 'countXTo', { min: 1, max: 10, step: 0.1 }).on('change', applyDebugConfig);
        tilingFolder.addBinding(debugConfig.tiling, 'countYTo', { min: 1, max: 10, step: 0.1 }).on('change', applyDebugConfig);
        tilingFolder.addBinding(debugConfig.tiling, 'easingDuration', { min: 0.5, max: 5.0, step: 0.1 }).on('change', applyDebugConfig);
        tilingFolder.addBinding(debugConfig.tiling, 'offsetX', { min: -1, max: 1, step: 0.01 }).on('change', applyDebugConfig);
        tilingFolder.addBinding(debugConfig.tiling, 'offsetY', { min: -1, max: 1, step: 0.01 }).on('change', applyDebugConfig);
        console.log('Tilingフォルダを追加しました');
    } catch (error) {
        console.error('Tilingフォルダの追加に失敗:', error);
    }
    
    // Zoom In
    try {
        const zoomInFolder = debugPane.addFolder({ title: 'Zoom In', expanded: true });
        zoomInFolder.addBinding(debugConfig.zoomIn, 'enabled').on('change', applyDebugConfig);
        zoomInFolder.addBinding(debugConfig.zoomIn, 'intensity', { min: 0, max: 1, step: 0.01 }).on('change', applyDebugConfig);
        zoomInFolder.addBinding(debugConfig.zoomIn, 'speed', { min: 0, max: 2, step: 0.1 }).on('change', applyDebugConfig);
        console.log('Zoom Inフォルダを追加しました');
    } catch (error) {
        console.error('Zoom Inフォルダの追加に失敗:', error);
    }
    
    // Zoom Out
    try {
        // debugConfig.zoomOutが存在することを確認
        if (!debugConfig.zoomOut) {
            console.warn('debugConfig.zoomOutが存在しません。初期化します。');
            debugConfig.zoomOut = { enabled: false, intensity: 0.3, speed: 0.5 };
        }
        console.log('Zoom Out設定:', debugConfig.zoomOut);
        
        const zoomOutFolder = debugPane.addFolder({ title: 'Zoom Out', expanded: true });
        const enabledBinding = zoomOutFolder.addBinding(debugConfig.zoomOut, 'enabled');
        enabledBinding.on('change', (ev) => {
            console.log('Zoom Out enabled changed:', ev.value, debugConfig.zoomOut.enabled);
            applyDebugConfig();
        });
        zoomOutFolder.addBinding(debugConfig.zoomOut, 'intensity', { min: 0, max: 1, step: 0.01 }).on('change', applyDebugConfig);
        zoomOutFolder.addBinding(debugConfig.zoomOut, 'speed', { min: 0, max: 2, step: 0.1 }).on('change', applyDebugConfig);
        console.log('Zoom Outフォルダを追加しました');
    } catch (error) {
        console.error('Zoom Outフォルダの追加に失敗:', error);
        console.error('エラーの詳細:', error.stack);
    }
    
    console.log('すべてのバインディングを追加しました。debugConfig:', debugConfig);
    
    // ランダム範囲設定を初期化
    initializeRandomRanges();
    
    // ランダム範囲設定フォルダを追加
    try {
        const randomRangeFolder = debugPane.addFolder({ title: 'Random Ranges', expanded: false });
        
        // RGB Shift
        const rgbShiftRangeFolder = randomRangeFolder.addFolder({ title: 'RGB Shift', expanded: false });
        rgbShiftRangeFolder.addBinding(randomRanges.rgbShift, 'intensity', { min: 0, max: 0.01, step: 0.0001 }).on('change', applyDebugConfig);
        rgbShiftRangeFolder.addBinding(randomRanges.rgbShift, 'speed', { min: 0, max: 0.5, step: 0.01 }).on('change', applyDebugConfig);
        rgbShiftRangeFolder.addBinding(randomRanges.rgbShift, 'offsetX', { min: 0, max: 0.02, step: 0.0001 }).on('change', applyDebugConfig);
        rgbShiftRangeFolder.addBinding(randomRanges.rgbShift, 'offsetY', { min: 0, max: 0.02, step: 0.0001 }).on('change', applyDebugConfig);
        rgbShiftRangeFolder.addBinding(randomRanges.rgbShift, 'speedX', { min: 0, max: 1, step: 0.1 }).on('change', applyDebugConfig);
        rgbShiftRangeFolder.addBinding(randomRanges.rgbShift, 'speedY', { min: 0, max: 1, step: 0.1 }).on('change', applyDebugConfig);
        
        // Glitch
        const glitchRangeFolder = randomRangeFolder.addFolder({ title: 'Glitch', expanded: false });
        glitchRangeFolder.addBinding(randomRanges.glitch, 'intensity', { min: 0, max: 0.2, step: 0.01 }).on('change', applyDebugConfig);
        glitchRangeFolder.addBinding(randomRanges.glitch, 'duration', { min: 0, max: 0.2, step: 0.01 }).on('change', applyDebugConfig);
        glitchRangeFolder.addBinding(randomRanges.glitch, 'interval', { min: 0, max: 0.5, step: 0.01 }).on('change', applyDebugConfig);
        
        // Mosaic
        const mosaicRangeFolder = randomRangeFolder.addFolder({ title: 'Mosaic', expanded: false });
        mosaicRangeFolder.addBinding(randomRanges.mosaic, 'size', { min: 0, max: 20, step: 1 }).on('change', applyDebugConfig);
        
        // Bloom
        const bloomRangeFolder = randomRangeFolder.addFolder({ title: 'Bloom', expanded: false });
        bloomRangeFolder.addBinding(randomRanges.bloom, 'intensity', { min: 0, max: 1, step: 0.1 }).on('change', applyDebugConfig);
        bloomRangeFolder.addBinding(randomRanges.bloom, 'threshold', { min: 0, max: 0.2, step: 0.01 }).on('change', applyDebugConfig);
        bloomRangeFolder.addBinding(randomRanges.bloom, 'radius', { min: 0, max: 10, step: 1 }).on('change', applyDebugConfig);
        
        // Blur
        const blurRangeFolder = randomRangeFolder.addFolder({ title: 'Blur', expanded: false });
        blurRangeFolder.addBinding(randomRanges.blur, 'intensity', { min: 0, max: 5, step: 0.5 }).on('change', applyDebugConfig);
        
        // Vignette
        const vignetteRangeFolder = randomRangeFolder.addFolder({ title: 'Vignette', expanded: false });
        vignetteRangeFolder.addBinding(randomRanges.vignette, 'intensity', { min: 0, max: 0.2, step: 0.01 }).on('change', applyDebugConfig);
        vignetteRangeFolder.addBinding(randomRanges.vignette, 'radius', { min: 0, max: 0.2, step: 0.01 }).on('change', applyDebugConfig);
        vignetteRangeFolder.addBinding(randomRanges.vignette, 'softness', { min: 0, max: 0.2, step: 0.01 }).on('change', applyDebugConfig);
        
        // Tiling
        const tilingRangeFolder = randomRangeFolder.addFolder({ title: 'Tiling', expanded: false });
        tilingRangeFolder.addBinding(randomRanges.tiling, 'countX', { min: 0, max: 2, step: 0.1 }).on('change', applyDebugConfig);
        tilingRangeFolder.addBinding(randomRanges.tiling, 'countY', { min: 0, max: 2, step: 0.1 }).on('change', applyDebugConfig);
        tilingRangeFolder.addBinding(randomRanges.tiling, 'offsetX', { min: 0, max: 0.2, step: 0.01 }).on('change', applyDebugConfig);
        tilingRangeFolder.addBinding(randomRanges.tiling, 'offsetY', { min: 0, max: 0.2, step: 0.01 }).on('change', applyDebugConfig);
        
        // Zoom In
        const zoomInRangeFolder = randomRangeFolder.addFolder({ title: 'Zoom In', expanded: false });
        zoomInRangeFolder.addBinding(randomRanges.zoomIn, 'intensity', { min: 0, max: 0.2, step: 0.01 }).on('change', applyDebugConfig);
        zoomInRangeFolder.addBinding(randomRanges.zoomIn, 'speed', { min: 0, max: 0.5, step: 0.1 }).on('change', applyDebugConfig);
        
        // Zoom Out
        const zoomOutRangeFolder = randomRangeFolder.addFolder({ title: 'Zoom Out', expanded: false });
        zoomOutRangeFolder.addBinding(randomRanges.zoomOut, 'intensity', { min: 0, max: 0.2, step: 0.01 }).on('change', applyDebugConfig);
        zoomOutRangeFolder.addBinding(randomRanges.zoomOut, 'speed', { min: 0, max: 0.5, step: 0.1 }).on('change', applyDebugConfig);
        
        console.log('ランダム範囲設定フォルダを追加しました');
    } catch (error) {
        console.error('ランダム範囲設定フォルダの追加に失敗:', error);
    }
    
    // JSON書き出し/読み込みボタンを追加
    try {
        const exportButton = debugPane.addButton({ title: 'Export JSON' });
        exportButton.on('click', () => {
            exportDebugConfig();
        });
        
        const importButton = debugPane.addButton({ title: 'Import JSON' });
        importButton.on('click', () => {
            importDebugConfig();
        });
        
        console.log('JSON書き出し/読み込みボタンを追加しました');
    } catch (error) {
        console.error('ボタンの追加に失敗:', error);
        // フォールバック: コンソールから直接呼び出せるようにする
        window.exportDebugConfig = exportDebugConfig;
        window.importDebugConfig = importDebugConfig;
        console.log('フォールバック: コンソールから exportDebugConfig(), importDebugConfig() を呼び出せます');
    }
    
    // デバッグモードが有効なときは、Tweakpaneのパラメータを強制的に有効にする
    // （enabledフラグを無視して、Tweakpaneの設定を優先）
    forceDebugConfigEnabled();
    
    // 初期設定を適用
    applyDebugConfig();
    
    console.log('デバッグモードを有効化しました（Cmd+D / Ctrl+Dでトグル）');
    console.log('Tweakpaneパネルが表示されない場合は、ブラウザのコンソールでエラーを確認してください。');
}

// デバッグモードが有効なときは、Tweakpaneのパラメータを強制的に有効にする
function forceDebugConfigEnabled() {
    if (!debugConfig) return;
    
    // デバッグモードが有効なときは、Tweakpaneで設定されたパラメータを優先する
    // （enabledフラグも含めて、Tweakpaneの設定がそのまま使用される）
    // この関数では特に変更は行わない（Tweakpaneの設定が既にdebugConfigに反映されている）
    console.log('デバッグモード: Tweakpaneのパラメータを優先します');
}

// JSON書き出し（範囲形式でエクスポート）
function exportDebugConfig() {
    if (!debugConfig || !randomRanges) {
        console.warn('エクスポートする設定がありません');
        return;
    }
    
    // 範囲形式の設定オブジェクトを作成
    const rangeConfig = {
        enabled: debugConfig.enabled,
        rgbShift: debugConfig.rgbShift?.enabled ? {
            enabled: true,
            // intensity, speed: パラメータを参考に（現在の値 ± ランダム範囲）
            intensity: { min: Math.max(0, debugConfig.rgbShift.intensity - randomRanges.rgbShift.intensity), max: debugConfig.rgbShift.intensity + randomRanges.rgbShift.intensity },
            speed: { min: Math.max(0, debugConfig.rgbShift.speed - randomRanges.rgbShift.speed), max: debugConfig.rgbShift.speed + randomRanges.rgbShift.speed },
            // offsetX, offsetY: 適当に散らす（固定範囲）
            offsetX: { min: -0.01, max: 0.01 },
            offsetY: { min: -0.01, max: 0.01 },
            // speedX, speedY: 0から離して、-2から2の範囲で散らす（0を含まない）
            speedX: { min: -2.0, max: 2.0, excludeZero: true },
            speedY: { min: -2.0, max: 2.0, excludeZero: true }
        } : { enabled: false },
        glitch: debugConfig.glitch?.enabled ? {
            enabled: true,
            // Glitchは通常設定と強い設定の2パターン
            normal: {
                intensity: { min: 0.7, max: 0.85 },
                duration: { min: 0.4, max: 0.6 },
                interval: { min: 1.4, max: 1.8 }
            },
            strong: {
                intensity: { min: 0.9, max: 1.0 },
                duration: { min: 0.5, max: 0.7 },
                interval: { min: 0.5, max: 0.9 }
            },
            strongProbability: 0.2  // 強い設定を使う確率（20%）
        } : { enabled: false },
        mosaic: debugConfig.mosaic?.enabled ? {
            enabled: true,
            // 15-100の間で6刻みの値からランダムに選ぶ（大きい値からスタートする場合は0へ）
            sizeFrom: { min: 0, max: 100, step: 6 },
            sizeTo: { min: 0, max: 100, step: 6 },
            easingDuration: { min: 0.5, max: 1.0 }
        } : { enabled: false },
        bloom: debugConfig.bloom?.enabled ? {
            enabled: true,
            intensity: { min: Math.max(0, debugConfig.bloom.intensity - randomRanges.bloom.intensity), max: debugConfig.bloom.intensity + randomRanges.bloom.intensity },
            threshold: { min: Math.max(0, debugConfig.bloom.threshold - randomRanges.bloom.threshold), max: Math.min(1, debugConfig.bloom.threshold + randomRanges.bloom.threshold) },
            radius: { min: Math.max(0, debugConfig.bloom.radius - randomRanges.bloom.radius), max: debugConfig.bloom.radius + randomRanges.bloom.radius }
        } : { enabled: false },
        blur: debugConfig.blur?.enabled ? {
            enabled: true,
            intensity: { min: Math.max(0, debugConfig.blur.intensity - randomRanges.blur.intensity), max: debugConfig.blur.intensity + randomRanges.blur.intensity }
        } : { enabled: false },
        vignette: debugConfig.vignette?.enabled ? {
            enabled: true,
            intensity: { min: Math.max(0, debugConfig.vignette.intensity - randomRanges.vignette.intensity), max: Math.min(1, debugConfig.vignette.intensity + randomRanges.vignette.intensity) },
            radius: { min: Math.max(0, debugConfig.vignette.radius - randomRanges.vignette.radius), max: Math.min(1, debugConfig.vignette.radius + randomRanges.vignette.radius) },
            softness: { min: Math.max(0, debugConfig.vignette.softness - randomRanges.vignette.softness), max: Math.min(1, debugConfig.vignette.softness + randomRanges.vignette.softness) }
        } : { enabled: false },
        tiling: debugConfig.tiling?.enabled ? {
            enabled: true,
            countX: { min: Math.max(1, debugConfig.tiling.countX - randomRanges.tiling.countX), max: debugConfig.tiling.countX + randomRanges.tiling.countX },
            countY: { min: Math.max(1, debugConfig.tiling.countY - randomRanges.tiling.countY), max: debugConfig.tiling.countY + randomRanges.tiling.countY },
            offsetX: { min: Math.max(-1, debugConfig.tiling.offsetX - randomRanges.tiling.offsetX), max: Math.min(1, debugConfig.tiling.offsetX + randomRanges.tiling.offsetX) },
            offsetY: { min: Math.max(-1, debugConfig.tiling.offsetY - randomRanges.tiling.offsetY), max: Math.min(1, debugConfig.tiling.offsetY + randomRanges.tiling.offsetY) }
        } : { enabled: false },
        zoomIn: debugConfig.zoomIn?.enabled ? {
            enabled: true,
            intensity: { min: Math.max(0, debugConfig.zoomIn.intensity - randomRanges.zoomIn.intensity), max: Math.min(1, debugConfig.zoomIn.intensity + randomRanges.zoomIn.intensity) },
            speed: { min: Math.max(0, debugConfig.zoomIn.speed - randomRanges.zoomIn.speed), max: debugConfig.zoomIn.speed + randomRanges.zoomIn.speed }
        } : { enabled: false },
        zoomOut: debugConfig.zoomOut?.enabled ? {
            enabled: true,
            intensity: { min: Math.max(0, debugConfig.zoomOut.intensity - randomRanges.zoomOut.intensity), max: Math.min(1, debugConfig.zoomOut.intensity + randomRanges.zoomOut.intensity) },
            speed: { min: Math.max(0, debugConfig.zoomOut.speed - randomRanges.zoomOut.speed), max: debugConfig.zoomOut.speed + randomRanges.zoomOut.speed }
        } : { enabled: false }
    };
    
    const json = JSON.stringify(rangeConfig, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shader-config-ranges-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('設定を範囲形式のJSONファイルとしてエクスポートしました:', rangeConfig);
}

// JSON読み込み（範囲形式と通常形式の両方に対応）
function importDebugConfig() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                
                // 範囲形式のJSONかどうかを判定
                if (isRangeConfig(importedData)) {
                    // 範囲形式のJSONを通常形式に変換
                    debugConfig = convertRangeConfigToNormalConfig(importedData);
                    // randomRangesも更新
                    updateRandomRangesFromRangeConfig(importedData);
                } else {
                    // 通常形式のJSON
                    if (validateConfig(importedData)) {
                        debugConfig = importedData;
                        ensureConfigComplete(debugConfig);
                    } else {
                        console.error('無効な設定ファイルです');
                        return;
                    }
                }
                
                // Tweakpaneを再初期化して新しい設定を反映
                if (debugPane) {
                    destroyDebugPane();
                    initDebugPane();
                }
                
                // 設定を適用
                applyDebugConfig();
                
                console.log('設定をJSONファイルからインポートしました:', debugConfig);
            } catch (error) {
                console.error('JSONファイルの読み込みに失敗しました:', error);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// 範囲形式の設定かどうかを判定
function isRangeConfig(config) {
    if (!config || typeof config !== 'object') return false;
    
    // 範囲形式の特徴: パラメータが {min, max} オブジェクトになっている
    const effects = ['rgbShift', 'glitch', 'mosaic', 'bloom', 'blur', 'vignette', 'tiling', 'zoomIn', 'zoomOut'];
    for (const effectName of effects) {
        if (config[effectName] && config[effectName].enabled) {
            const effect = config[effectName];
            // パラメータが範囲オブジェクトかどうかを確認
            for (const key in effect) {
                if (key !== 'enabled' && effect[key] && typeof effect[key] === 'object' && 'min' in effect[key] && 'max' in effect[key]) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

// 範囲形式の設定を通常形式に変換
function convertRangeConfigToNormalConfig(rangeConfig) {
    const config = {
        enabled: rangeConfig.enabled !== undefined ? rangeConfig.enabled : true
    };
    
    // RGB Shift
    if (rangeConfig.rgbShift && rangeConfig.rgbShift.enabled) {
        const rs = rangeConfig.rgbShift;
        config.rgbShift = {
            enabled: true,
            intensity: rs.intensity?.min !== undefined ? (rs.intensity.min + rs.intensity.max) / 2 : 0.01,
            speed: rs.speed?.min !== undefined ? (rs.speed.min + rs.speed.max) / 2 : 0.5,
            offsetX: rs.offsetX?.min !== undefined ? (rs.offsetX.min + rs.offsetX.max) / 2 : 0.0,
            offsetY: rs.offsetY?.min !== undefined ? (rs.offsetY.min + rs.offsetY.max) / 2 : 0.0,
            speedX: rs.speedX?.min !== undefined ? (rs.speedX.min + rs.speedX.max) / 2 : 2.0,
            speedY: rs.speedY?.min !== undefined ? (rs.speedY.min + rs.speedY.max) / 2 : 1.5
        };
    } else {
        config.rgbShift = { enabled: false, intensity: 0.01, speed: 0.5, offsetX: 0.0, offsetY: 0.0, speedX: 2.0, speedY: 1.5 };
    }
    
    // Glitch（範囲形式の場合は通常設定を使用）
    if (rangeConfig.glitch && rangeConfig.glitch.enabled) {
        const gl = rangeConfig.glitch;
        // normalまたはstrongの範囲から中央値を取得
        if (gl.normal) {
            config.glitch = {
                enabled: true,
                intensity: (gl.normal.intensity.min + gl.normal.intensity.max) / 2,
                duration: (gl.normal.duration.min + gl.normal.duration.max) / 2,
                interval: (gl.normal.interval.min + gl.normal.interval.max) / 2
            };
        } else if (gl.intensity && typeof gl.intensity === 'object') {
            config.glitch = {
                enabled: true,
                intensity: (gl.intensity.min + gl.intensity.max) / 2,
                duration: gl.duration ? (gl.duration.min + gl.duration.max) / 2 : 0.5,
                interval: gl.interval ? (gl.interval.min + gl.interval.max) / 2 : 1.6
            };
        } else {
            config.glitch = { enabled: true, intensity: 0.78, duration: 0.5, interval: 1.6 };
        }
    } else {
        config.glitch = { enabled: false, intensity: 0.15, duration: 0.3, interval: 3.0 };
    }
    
    // 他のエフェクトも同様に変換
    config.mosaic = rangeConfig.mosaic?.enabled ? {
        enabled: true,
        size: rangeConfig.mosaic.sizeFrom ? (rangeConfig.mosaic.sizeFrom.min + rangeConfig.mosaic.sizeFrom.max) / 2 : 20.0,
        sizeFrom: rangeConfig.mosaic.sizeFrom ? (rangeConfig.mosaic.sizeFrom.min + rangeConfig.mosaic.sizeFrom.max) / 2 : 20.0,
        sizeTo: rangeConfig.mosaic.sizeTo ? (rangeConfig.mosaic.sizeTo.min + rangeConfig.mosaic.sizeTo.max) / 2 : 20.0,
        easingDuration: rangeConfig.mosaic.easingDuration ? (rangeConfig.mosaic.easingDuration.min + rangeConfig.mosaic.easingDuration.max) / 2 : 1.0
    } : { enabled: false, size: 20.0, sizeFrom: 20.0, sizeTo: 20.0, easingDuration: 1.0 };
    
    config.bloom = rangeConfig.bloom?.enabled ? {
        enabled: true,
        intensity: rangeConfig.bloom.intensity ? (rangeConfig.bloom.intensity.min + rangeConfig.bloom.intensity.max) / 2 : 1.5,
        threshold: rangeConfig.bloom.threshold ? (rangeConfig.bloom.threshold.min + rangeConfig.bloom.threshold.max) / 2 : 0.7,
        radius: rangeConfig.bloom.radius ? (rangeConfig.bloom.radius.min + rangeConfig.bloom.radius.max) / 2 : 10.0
    } : { enabled: false, intensity: 1.5, threshold: 0.7, radius: 10.0 };
    
    config.blur = rangeConfig.blur?.enabled ? {
        enabled: true,
        intensity: rangeConfig.blur.intensity ? (rangeConfig.blur.intensity.min + rangeConfig.blur.intensity.max) / 2 : 5.0
    } : { enabled: false, intensity: 5.0 };
    
    config.vignette = rangeConfig.vignette?.enabled ? {
        enabled: true,
        intensity: rangeConfig.vignette.intensity ? (rangeConfig.vignette.intensity.min + rangeConfig.vignette.intensity.max) / 2 : 0.5,
        radius: rangeConfig.vignette.radius ? (rangeConfig.vignette.radius.min + rangeConfig.vignette.radius.max) / 2 : 0.8,
        softness: rangeConfig.vignette.softness ? (rangeConfig.vignette.softness.min + rangeConfig.vignette.softness.max) / 2 : 0.3
    } : { enabled: false, intensity: 0.5, radius: 0.8, softness: 0.3 };
    
    config.tiling = rangeConfig.tiling?.enabled ? {
        enabled: true,
        countX: rangeConfig.tiling.countX ? (rangeConfig.tiling.countX.min + rangeConfig.tiling.countX.max) / 2 : 2.0,
        countY: rangeConfig.tiling.countY ? (rangeConfig.tiling.countY.min + rangeConfig.tiling.countY.max) / 2 : 2.0,
        offsetX: rangeConfig.tiling.offsetX ? (rangeConfig.tiling.offsetX.min + rangeConfig.tiling.offsetX.max) / 2 : 0.0,
        offsetY: rangeConfig.tiling.offsetY ? (rangeConfig.tiling.offsetY.min + rangeConfig.tiling.offsetY.max) / 2 : 0.0
    } : { enabled: false, countX: 2.0, countY: 2.0, offsetX: 0.0, offsetY: 0.0 };
    
    config.zoomIn = rangeConfig.zoomIn?.enabled ? {
        enabled: true,
        intensity: rangeConfig.zoomIn.intensity ? (rangeConfig.zoomIn.intensity.min + rangeConfig.zoomIn.intensity.max) / 2 : 0.2,
        speed: rangeConfig.zoomIn.speed ? (rangeConfig.zoomIn.speed.min + rangeConfig.zoomIn.speed.max) / 2 : 0.5
    } : { enabled: false, intensity: 0.2, speed: 0.5 };
    
    config.zoomOut = rangeConfig.zoomOut?.enabled ? {
        enabled: true,
        intensity: rangeConfig.zoomOut.intensity ? (rangeConfig.zoomOut.intensity.min + rangeConfig.zoomOut.intensity.max) / 2 : 0.3,
        speed: rangeConfig.zoomOut.speed ? (rangeConfig.zoomOut.speed.min + rangeConfig.zoomOut.speed.max) / 2 : 0.5
    } : { enabled: false, intensity: 0.3, speed: 0.5 };
    
    ensureConfigComplete(config);
    return config;
}

// 範囲形式の設定からrandomRangesを更新
function updateRandomRangesFromRangeConfig(rangeConfig) {
    if (!randomRanges) {
        initializeRandomRanges();
    }
    
    // RGB Shift
    if (rangeConfig.rgbShift && rangeConfig.rgbShift.enabled) {
        const rs = rangeConfig.rgbShift;
        if (rs.intensity && typeof rs.intensity === 'object') {
            randomRanges.rgbShift.intensity = (rs.intensity.max - rs.intensity.min) / 2;
        }
        if (rs.speed && typeof rs.speed === 'object') {
            randomRanges.rgbShift.speed = (rs.speed.max - rs.speed.min) / 2;
        }
        if (rs.offsetX && typeof rs.offsetX === 'object') {
            randomRanges.rgbShift.offsetX = (rs.offsetX.max - rs.offsetX.min) / 2;
        }
        if (rs.offsetY && typeof rs.offsetY === 'object') {
            randomRanges.rgbShift.offsetY = (rs.offsetY.max - rs.offsetY.min) / 2;
        }
        if (rs.speedX && typeof rs.speedX === 'object') {
            randomRanges.rgbShift.speedX = (rs.speedX.max - rs.speedX.min) / 2;
        }
        if (rs.speedY && typeof rs.speedY === 'object') {
            randomRanges.rgbShift.speedY = (rs.speedY.max - rs.speedY.min) / 2;
        }
    }
    
    // Glitch
    if (rangeConfig.glitch && rangeConfig.glitch.enabled) {
        const gl = rangeConfig.glitch;
        if (gl.normal && gl.normal.intensity) {
            randomRanges.glitch.intensity = (gl.normal.intensity.max - gl.normal.intensity.min) / 2;
        }
        if (gl.normal && gl.normal.duration) {
            randomRanges.glitch.duration = (gl.normal.duration.max - gl.normal.duration.min) / 2;
        }
        if (gl.normal && gl.normal.interval) {
            randomRanges.glitch.interval = (gl.normal.interval.max - gl.normal.interval.min) / 2;
        }
    }
    
    // Mosaic（範囲形式の場合はsizeFrom/sizeToを使用）
    if (rangeConfig.mosaic && rangeConfig.mosaic.enabled) {
        // Mosaicは6刻みの値から選ぶため、randomRangesは使用しない
        // 範囲形式の設定から直接読み込む
    }
    
    if (rangeConfig.bloom && rangeConfig.bloom.enabled) {
        if (rangeConfig.bloom.intensity) {
            randomRanges.bloom.intensity = (rangeConfig.bloom.intensity.max - rangeConfig.bloom.intensity.min) / 2;
        }
        if (rangeConfig.bloom.threshold) {
            randomRanges.bloom.threshold = (rangeConfig.bloom.threshold.max - rangeConfig.bloom.threshold.min) / 2;
        }
        if (rangeConfig.bloom.radius) {
            randomRanges.bloom.radius = (rangeConfig.bloom.radius.max - rangeConfig.bloom.radius.min) / 2;
        }
    }
    
    if (rangeConfig.blur && rangeConfig.blur.enabled && rangeConfig.blur.intensity) {
        randomRanges.blur.intensity = (rangeConfig.blur.intensity.max - rangeConfig.blur.intensity.min) / 2;
    }
    
    if (rangeConfig.vignette && rangeConfig.vignette.enabled) {
        if (rangeConfig.vignette.intensity) {
            randomRanges.vignette.intensity = (rangeConfig.vignette.intensity.max - rangeConfig.vignette.intensity.min) / 2;
        }
        if (rangeConfig.vignette.radius) {
            randomRanges.vignette.radius = (rangeConfig.vignette.radius.max - rangeConfig.vignette.radius.min) / 2;
        }
        if (rangeConfig.vignette.softness) {
            randomRanges.vignette.softness = (rangeConfig.vignette.softness.max - rangeConfig.vignette.softness.min) / 2;
        }
    }
    
    if (rangeConfig.tiling && rangeConfig.tiling.enabled) {
        if (rangeConfig.tiling.countX) {
            randomRanges.tiling.countX = (rangeConfig.tiling.countX.max - rangeConfig.tiling.countX.min) / 2;
        }
        if (rangeConfig.tiling.countY) {
            randomRanges.tiling.countY = (rangeConfig.tiling.countY.max - rangeConfig.tiling.countY.min) / 2;
        }
        if (rangeConfig.tiling.offsetX) {
            randomRanges.tiling.offsetX = (rangeConfig.tiling.offsetX.max - rangeConfig.tiling.offsetX.min) / 2;
        }
        if (rangeConfig.tiling.offsetY) {
            randomRanges.tiling.offsetY = (rangeConfig.tiling.offsetY.max - rangeConfig.tiling.offsetY.min) / 2;
        }
    }
    
    if (rangeConfig.zoomIn && rangeConfig.zoomIn.enabled) {
        if (rangeConfig.zoomIn.intensity) {
            randomRanges.zoomIn.intensity = (rangeConfig.zoomIn.intensity.max - rangeConfig.zoomIn.intensity.min) / 2;
        }
        if (rangeConfig.zoomIn.speed) {
            randomRanges.zoomIn.speed = (rangeConfig.zoomIn.speed.max - rangeConfig.zoomIn.speed.min) / 2;
        }
    }
    
    if (rangeConfig.zoomOut && rangeConfig.zoomOut.enabled) {
        if (rangeConfig.zoomOut.intensity) {
            randomRanges.zoomOut.intensity = (rangeConfig.zoomOut.intensity.max - rangeConfig.zoomOut.intensity.min) / 2;
        }
        if (rangeConfig.zoomOut.speed) {
            randomRanges.zoomOut.speed = (rangeConfig.zoomOut.speed.max - rangeConfig.zoomOut.speed.min) / 2;
        }
    }
}

// 設定の検証
function validateConfig(config) {
    if (!config || typeof config !== 'object') return false;
    
    const requiredEffects = ['rgbShift', 'glitch', 'mosaic', 'bloom', 'blur', 'vignette', 'tiling', 'zoomIn', 'zoomOut'];
    for (const effectName of requiredEffects) {
        if (!config[effectName] || typeof config[effectName] !== 'object') {
            return false;
        }
    }
    
    return true;
}

// 現在の設定をプリセットに追加
function addToPresets() {
    if (!debugConfig) {
        console.warn('追加する設定がありません');
        return;
    }
    
    // 現在の設定をディープコピーしてプリセットに追加
    const preset = JSON.parse(JSON.stringify(debugConfig));
    savedPresets.push(preset);
    
    console.log('現在の設定をプリセットに追加しました。プリセット数:', savedPresets.length);
    console.log('追加されたプリセット:', preset);
    
    // プリセットをローカルストレージに保存
    try {
        localStorage.setItem('savedShaderPresets', JSON.stringify(savedPresets));
        console.log('プリセットをローカルストレージに保存しました');
    } catch (error) {
        console.error('ローカルストレージへの保存に失敗:', error);
    }
}

// ページ読み込み時に保存されたプリセットを読み込む
function loadSavedPresets() {
    try {
        const saved = localStorage.getItem('savedShaderPresets');
        if (saved) {
            savedPresets = JSON.parse(saved);
            console.log('保存されたプリセットを読み込みました。プリセット数:', savedPresets.length);
        }
    } catch (error) {
        console.error('保存されたプリセットの読み込みに失敗:', error);
        savedPresets = [];
    }
}

// ランダム範囲設定を初期化
function initializeRandomRanges() {
    // ローカルストレージから読み込む
    try {
        const saved = localStorage.getItem('shaderRandomRanges');
        if (saved) {
            randomRanges = JSON.parse(saved);
            console.log('保存されたランダム範囲設定を読み込みました:', randomRanges);
            return;
        }
    } catch (error) {
        console.error('ランダム範囲設定の読み込みに失敗:', error);
    }
    
    // デフォルトのランダム範囲設定
    randomRanges = {
        rgbShift: {
            intensity: 0.005,  // ±0.005
            speed: 0.2,         // ±0.2
            offsetX: 0.01,      // ±0.01
            offsetY: 0.01,      // ±0.01
            speedX: 0.5,        // ±0.5
            speedY: 0.5         // ±0.5
        },
        glitch: {
            intensity: 0.1,    // ±0.1（通常: 0.78, 強い: 1.00）
            duration: 0.1,      // ±0.1（通常: 0.5, 強い: 0.6）
            interval: 0.3       // ±0.3（通常: 1.6, 強い: 0.7）
        },
        mosaic: {
            size: 10            // ±10
        },
        bloom: {
            intensity: 0.5,    // ±0.5
            threshold: 0.1,     // ±0.1
            radius: 5           // ±5
        },
        blur: {
            intensity: 2        // ±2
        },
        vignette: {
            intensity: 0.1,     // ±0.1
            radius: 0.1,        // ±0.1
            softness: 0.1       // ±0.1
        },
        tiling: {
            countX: 1,          // ±1
            countY: 1,          // ±1
            offsetX: 0.2,       // ±0.2
            offsetY: 0.2        // ±0.2
        },
        zoomIn: {
            intensity: 0.1,     // ±0.1
            speed: 0.2          // ±0.2
        },
        zoomOut: {
            intensity: 0.1,     // ±0.1
            speed: 0.2          // ±0.2
        }
    };
    
    // ローカルストレージに保存
    try {
        localStorage.setItem('shaderRandomRanges', JSON.stringify(randomRanges));
    } catch (error) {
        console.error('ランダム範囲設定の保存に失敗:', error);
    }
}

// 現在のシェーダー設定を取得
function getCurrentShaderConfig() {
    // シェーダーインスタンスから現在の設定を取得
    if (heroVideoShader && heroVideoShader.currentConfig) {
        // ディープコピーを作成
        const config = JSON.parse(JSON.stringify(heroVideoShader.currentConfig));
        // すべてのプロパティが存在することを確認
        ensureConfigComplete(config);
        // Blurのenabledがboolean型であることを確認
        if (config.blur && typeof config.blur.enabled !== 'boolean') {
            config.blur.enabled = Boolean(config.blur.enabled);
        }
        return config;
    }
    
    // デフォルト設定を使用
    if (typeof HERO_SHADER_CONFIG !== 'undefined') {
        const config = JSON.parse(JSON.stringify(HERO_SHADER_CONFIG));
        ensureConfigComplete(config);
        // Blurのenabledがboolean型であることを確認
        if (config.blur && typeof config.blur.enabled !== 'boolean') {
            config.blur.enabled = Boolean(config.blur.enabled);
        }
        return config;
    }
    
    // フォールバック: デフォルト設定オブジェクト
    const fallbackConfig = {
        enabled: true,
        rgbShift: { enabled: false, intensity: 0.01, speed: 0.5, offsetX: 0.0, offsetY: 0.0, speedX: 2.0, speedY: 1.5 },
        glitch: { enabled: false, intensity: 0.15, duration: 0.3, interval: 3.0 },
        mosaic: { enabled: false, size: 20.0, sizeFrom: 20.0, sizeTo: 20.0, easingDuration: 1.0 },
        bloom: { enabled: false, intensity: 1.5, threshold: 0.7, radius: 10.0 },
        blur: { enabled: false, intensity: 5.0, intensityFrom: 5.0, intensityTo: 5.0, easingDuration: 2.0 },
        vignette: { enabled: false, intensity: 0.5, radius: 0.8, softness: 0.3 },
        tiling: { enabled: false, countX: 2.0, countY: 2.0, countXTo: 2.0, countYTo: 2.0, easingDuration: 2.0, offsetX: 0.0, offsetY: 0.0 },
        zoomIn: { enabled: false, intensity: 0.2, speed: 0.5 },
        zoomOut: { enabled: false, intensity: 0.3, speed: 0.5 }
    };
    ensureConfigComplete(fallbackConfig);
    return fallbackConfig;
}

// 設定オブジェクトが完全であることを確認（後方互換性のため）
function ensureConfigComplete(config) {
    // 各エフェクト設定が存在し、必要なプロパティを持っているか確認
    const effects = ['rgbShift', 'glitch', 'mosaic', 'bloom', 'blur', 'vignette', 'tiling', 'zoomIn', 'zoomOut'];
    
    // デフォルト設定を定義
    const defaults = {
        rgbShift: { enabled: false, intensity: 0.01, speed: 0.5, offsetX: 0.0, offsetY: 0.0, speedX: 2.0, speedY: 1.5 },
        glitch: { enabled: false, intensity: 0.15, duration: 0.3, interval: 3.0 },
        mosaic: { enabled: false, size: 20.0, sizeFrom: 20.0, sizeTo: 20.0, easingDuration: 1.0 },
        bloom: { enabled: false, intensity: 1.5, threshold: 0.7, radius: 10.0 },
        blur: { enabled: false, intensity: 5.0, intensityFrom: 5.0, intensityTo: 5.0, easingDuration: 2.0 },
        vignette: { enabled: false, intensity: 0.5, radius: 0.8, softness: 0.3 },
        tiling: { enabled: false, countX: 2.0, countY: 2.0, countXTo: 2.0, countYTo: 2.0, easingDuration: 2.0, offsetX: 0.0, offsetY: 0.0 },
        zoomIn: { enabled: false, intensity: 0.2, speed: 0.5 },
        zoomOut: { enabled: false, intensity: 0.3, speed: 0.5 }
    };
    
    effects.forEach(effectName => {
        if (!config[effectName]) {
            // エフェクトが存在しない場合はデフォルト設定を作成
            config[effectName] = JSON.parse(JSON.stringify(defaults[effectName]));
        } else {
            // エフェクトが存在する場合、不足しているプロパティを補完
            const defaultEffect = defaults[effectName];
            if (defaultEffect) {
                Object.keys(defaultEffect).forEach(key => {
                    if (typeof config[effectName][key] === 'undefined') {
                        config[effectName][key] = defaultEffect[key];
                    }
                });
            }
            
            // enabledプロパティがboolean型であることを確認
            if (typeof config[effectName].enabled !== 'boolean') {
                config[effectName].enabled = Boolean(config[effectName].enabled);
            }
        }
    });
}

// デバッグ設定をシェーダーに適用
function applyDebugConfig() {
    if (!debugConfig) {
        return;
    }
    
    // デバッグモードが有効なときは、Tweakpaneのパラメータを強制的に有効にする
    // （enabledフラグはTweakpaneで設定された値を使用）
    if (isDebugMode) {
        // すべてのエフェクトのenabledフラグは、Tweakpaneで設定された値を使用
        // ここでは特に変更しない（Tweakpaneの値が優先される）
    }
    
    // グローバル設定を更新
    if (typeof HERO_SHADER_CONFIG !== 'undefined') {
        Object.assign(HERO_SHADER_CONFIG, debugConfig);
    }
    
    // シェーダーインスタンスに設定を適用
    if (heroVideoShader && heroVideoShader.isShaderEnabled()) {
        heroVideoShader.setConfig(debugConfig);
    } else if (heroVideoShader && !heroVideoShader.isShaderEnabled()) {
        // シェーダーが無効な場合は再初期化を試みる
        const heroVideo = document.getElementById('hero-background-video');
        if (heroVideo && typeof HeroVideoShader !== 'undefined') {
            heroVideoShader = new HeroVideoShader(heroVideo, null);
            if (heroVideoShader.isShaderEnabled()) {
                heroVideoShader.setConfig(debugConfig);
            }
        }
    }
    
    // ランダム範囲設定をローカルストレージに保存
    if (randomRanges) {
        try {
            localStorage.setItem('shaderRandomRanges', JSON.stringify(randomRanges));
        } catch (error) {
            console.error('ランダム範囲設定の保存に失敗:', error);
        }
    }
    
    // デバッグモードが有効で、プレイリストが存在する場合は再生成
    // （ただし、連続して呼ばれる可能性があるので、少し遅延させる）
    if (isDebugMode && heroVideoList.length > 0) {
        if (debugConfigReplaylistTimer) {
            clearTimeout(debugConfigReplaylistTimer);
        }
        debugConfigReplaylistTimer = setTimeout(() => {
            generateNewPlaylist();
            console.log('デバッグ設定変更によりプレイリストを再生成しました');
            debugConfigReplaylistTimer = null;
        }, 500); // 500ms後に再生成（連続変更を防ぐ）
    }
}

// デバッグパネルの破棄
function destroyDebugPane() {
    if (debugPane) {
        debugPane.dispose();
        debugPane = null;
    }
    debugConfig = null;
    console.log('デバッグモードを無効化しました');
}
