// Excelファイルのパス
const EXCEL_FILE_PATH = 'data/students.xlsx';

// 学生データを格納
let studentsData = [];

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', () => {
    loadExcelData();
    setupScrollNavbar();
    loadHeroImage();
});

// Hero画像を読み込む（Excelから設定）
async function loadHeroImage() {
    try {
        const response = await fetch(EXCEL_FILE_PATH);
        if (!response.ok) {
            return;
        }

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        // 設定シートまたは最初のシートからHero画像パスを取得
        // 設定シートがある場合はそちらを優先
        let heroImagePath = null;
        
        // 設定シートを探す
        const configSheet = workbook.Sheets['設定'] || workbook.Sheets['設定'] || workbook.Sheets['config'] || workbook.Sheets['Config'];
        if (configSheet) {
            const configData = XLSX.utils.sheet_to_json(configSheet, { defval: '' });
            if (configData.length > 0 && configData[0]['Hero画像パス']) {
                heroImagePath = configData[0]['Hero画像パス'];
            }
        }
        
        // 設定シートがない場合、最初のシートの1行目から取得を試みる
        if (!heroImagePath && jsonData.length > 0) {
            // 最初の行にHero画像パスがあるかチェック（通常はないが、念のため）
            heroImagePath = jsonData[0]['Hero画像パス'] || jsonData[0]['hero画像'] || null;
        }
        
        // Hero画像を設定
        if (heroImagePath && heroImagePath.trim()) {
            const heroBg = document.getElementById('hero-background-image');
            if (heroBg) {
                // パスがURLの場合はそのまま使用、そうでなければassets/hero/を追加
                let imageUrl = heroImagePath.trim();
                if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
                    imageUrl = `assets/hero/${imageUrl}`;
                }
                heroBg.style.backgroundImage = `url('${imageUrl}')`;
                heroBg.style.display = 'block';
            }
        }
    } catch (error) {
        console.log('Hero画像の読み込みに失敗しました（デフォルト背景を使用）:', error);
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
            return {
                id: row['No'] || index + 1,
                grade: row['所属学年'] || '',
                studentId: row['学籍番号'] || '',
                name: row['氏名'] || '',
                nameEn: row['氏名英字'] || '',
                title: row['題目'] || row['研究題目'] || '',
                imagePath: row['画像パス'] || row['画像'] || '',
                reportPath: row['レポートパス'] || row['レポート'] || '',
                presentationPath: row['プレゼンパス'] || row['プレゼン'] || row['プレゼンテーション'] || ''
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

// 学生一覧を表示
function displayStudents() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const studentList = document.getElementById('student-list');

    loading.style.display = 'none';
    error.style.display = 'none';

    if (studentsData.length === 0) {
        showError('学生データが見つかりませんでした。');
        return;
    }

    studentList.innerHTML = '';

    studentsData.forEach(student => {
        const card = createStudentCard(student);
        studentList.appendChild(card);
    });
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

    card.innerHTML = `
        <div class="student-card-image-wrapper">
            ${imageSrc 
                ? `<img src="${imageSrc}" class="card-img-top" alt="${student.name}" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'250\\'%3E%3Crect fill=\\'%23667eea\\' width=\\'400\\' height=\\'250\\'/%3E%3Ctext fill=\\'%23fff\\' font-family=\\'sans-serif\\' font-size=\\'18\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'0.3em\\'%3E画像なし%3C/text%3E%3C/svg%3E'">` 
                : `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: rgba(255,255,255,0.8); font-size: 1.1rem;">画像なし</div>`}
            <div class="student-card-image-overlay"></div>
        </div>
        <div class="card-body student-card-body">
            <h5 class="card-title student-card-name">${escapeHtml(student.name)}</h5>
            <p class="card-text student-card-name-en">${escapeHtml(student.nameEn)}</p>
            ${student.title ? `<p class="card-text student-card-title">${escapeHtml(student.title)}</p>` : ''}
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
