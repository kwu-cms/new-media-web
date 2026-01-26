// Excelファイルのパス
const EXCEL_FILE_PATH = 'data/students.xlsx';

// 学生データを格納
let studentsData = [];
let currentStudent = null;
let currentImageIndex = 0;
let currentImages = [];

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', () => {
    // URLパラメータから学生IDを取得
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('id');

    if (!studentId) {
        showError('学生IDが指定されていません。');
        return;
    }

    loadExcelData(studentId);
    setupLightbox();
});

// Excelファイルを読み込む
async function loadExcelData(targetStudentId) {
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
        
        // JSON形式に変換
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

        // 対象の学生を検索
        const student = studentsData.find(s => String(s.id) === String(targetStudentId));
        
        if (!student) {
            showError('学生情報が見つかりませんでした。');
            return;
        }

        currentStudent = student;
        displayStudentDetail();
    } catch (error) {
        console.error('Excel読み込みエラー:', error);
        showError('Excelファイルの読み込みに失敗しました。ファイルが正しく配置されているか確認してください。');
        
        // ローカルストレージから読み込む（フォールバック）
        const cachedData = localStorage.getItem('studentsData');
        if (cachedData) {
            studentsData = JSON.parse(cachedData);
            const student = studentsData.find(s => String(s.id) === String(targetStudentId));
            if (student) {
                currentStudent = student;
                displayStudentDetail();
            }
        }
    }
}

// 学生詳細を表示
function displayStudentDetail() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const studentDetail = document.getElementById('student-detail');

    loading.style.display = 'none';
    error.style.display = 'none';
    studentDetail.style.display = 'block';

    if (!currentStudent) {
        showError('学生情報が見つかりませんでした。');
        return;
    }

    // 基本情報を設定
    document.getElementById('student-name').textContent = currentStudent.name;
    document.getElementById('student-name-en').textContent = currentStudent.nameEn;
    document.getElementById('student-id').textContent = currentStudent.studentId;
    document.getElementById('student-grade').textContent = currentStudent.grade;
    document.getElementById('research-title').textContent = currentStudent.title || '題目未設定';

    // 画像を表示
    displayImages();

    // レポートを表示
    displayReports();

    // プレゼン資料を表示
    displayPresentations();
}

// 画像を表示（カルーセルを使用）
function displayImages() {
    const imagesSection = document.getElementById('images-section');
    const imageCarouselContainer = document.getElementById('image-carousel-container');

    if (!currentStudent.imagePath) {
        imagesSection.style.display = 'none';
        return;
    }

    // 画像パスを配列に変換（カンマ区切りの場合に対応）
    const imagePaths = currentStudent.imagePath.split(',').map(path => path.trim()).filter(path => path);
    
    if (imagePaths.length === 0) {
        imagesSection.style.display = 'none';
        return;
    }

    imagesSection.style.display = 'block';
    imageCarouselContainer.innerHTML = '';

    // フルパスに変換
    currentImages = imagePaths.map(path => {
        return path.startsWith('http') ? path : `assets/images/${path}`;
    });

    // カルーセルIDを生成
    const carouselId = `carousel-${currentStudent.id}`;
    
    // カルーセルHTMLを作成
    let carouselHTML = `
        <div id="${carouselId}" class="carousel slide carousel-fade" data-bs-ride="carousel">
            <div class="carousel-indicators">
    `;

    // インジケーター
    currentImages.forEach((_, index) => {
        carouselHTML += `<button type="button" data-bs-target="#${carouselId}" data-bs-slide-to="${index}" ${index === 0 ? 'class="active" aria-current="true"' : ''} aria-label="Slide ${index + 1}"></button>`;
    });

    carouselHTML += `
            </div>
            <div class="carousel-inner">
    `;

    // カルーセルアイテム
    currentImages.forEach((imagePath, index) => {
        carouselHTML += `
            <div class="carousel-item ${index === 0 ? 'active' : ''}" data-bs-interval="5000">
                <img src="${imagePath}" class="d-block w-100" alt="${currentStudent.name} - 画像 ${index + 1}" 
                     onclick="openLightbox(${index})" style="cursor: pointer;"
                     onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'800\\' height=\\'600\\'%3E%3Crect fill=\\'%23e9ecef\\' width=\\'800\\' height=\\'600\\'/%3E%3Ctext fill=\\'%236c757d\\' font-family=\\'sans-serif\\' font-size=\\'24\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'0.3em\\'%3E画像読み込みエラー%3C/text%3E%3C/svg%3E'">
            </div>
        `;
    });

    carouselHTML += `
            </div>
            <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Next</span>
            </button>
        </div>
    `;

    // サムネイルギャラリー
    if (currentImages.length > 1) {
        carouselHTML += '<div class="thumbnail-gallery mt-4">';
        currentImages.forEach((imagePath, index) => {
            carouselHTML += `
                <div class="thumbnail-item ${index === 0 ? 'active' : ''}" 
                     onclick="switchCarouselSlide('${carouselId}', ${index})">
                    <img src="${imagePath}" alt="Thumbnail ${index + 1}" 
                         onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'120\\' height=\\'120\\'%3E%3Crect fill=\\'%23e9ecef\\' width=\\'120\\' height=\\'120\\'/%3E%3C/svg%3E'">
                </div>
            `;
        });
        carouselHTML += '</div>';
    }

    imageCarouselContainer.innerHTML = carouselHTML;

    // カルーセルイベントリスナーを設定
    const carouselElement = document.getElementById(carouselId);
    if (carouselElement) {
        carouselElement.addEventListener('slid.bs.carousel', function(event) {
            const activeIndex = event.to;
            updateThumbnailActive(activeIndex);
            currentImageIndex = activeIndex;
        });
    }
}

// カルーセルのスライドを切り替え
function switchCarouselSlide(carouselId, index) {
    const carousel = bootstrap.Carousel.getInstance(document.getElementById(carouselId));
    if (carousel) {
        carousel.to(index);
    }
    updateThumbnailActive(index);
    currentImageIndex = index;
}

// サムネイルのアクティブ状態を更新
function updateThumbnailActive(activeIndex) {
    const thumbnails = document.querySelectorAll('.thumbnail-item');
    thumbnails.forEach((thumb, index) => {
        if (index === activeIndex) {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });
}

// レポートを表示
function displayReports() {
    const reportSection = document.getElementById('report-section');
    const reportLinks = document.getElementById('report-links');

    if (!currentStudent.reportPath) {
        reportSection.style.display = 'none';
        return;
    }

    // レポートパスを配列に変換（カンマ区切りの場合に対応）
    const reportPaths = currentStudent.reportPath.split(',').map(path => path.trim()).filter(path => path);
    
    if (reportPaths.length === 0) {
        reportSection.style.display = 'none';
        return;
    }

    reportSection.style.display = 'block';
    reportLinks.innerHTML = '';

    reportPaths.forEach((reportPath, index) => {
        const fullPath = reportPath.startsWith('http') ? reportPath : `assets/reports/${reportPath}`;
        const fileName = reportPath.split('/').pop() || `レポート${index + 1}.docx`;
        
        const link = document.createElement('a');
        link.href = fullPath;
        link.className = 'file-link-btn';
        link.target = '_blank';
        link.download = fileName;
        
        link.innerHTML = `
            <i class="bi bi-file-earmark-word-fill text-success"></i>
            <span>${escapeHtml(fileName)}</span>
            <i class="bi bi-download ms-auto"></i>
        `;

        reportLinks.appendChild(link);
    });
}

// プレゼン資料を表示
function displayPresentations() {
    const presentationSection = document.getElementById('presentation-section');
    const presentationLinks = document.getElementById('presentation-links');

    if (!currentStudent.presentationPath) {
        presentationSection.style.display = 'none';
        return;
    }

    // プレゼンパスを配列に変換（カンマ区切りの場合に対応）
    const presentationPaths = currentStudent.presentationPath.split(',').map(path => path.trim()).filter(path => path);
    
    if (presentationPaths.length === 0) {
        presentationSection.style.display = 'none';
        return;
    }

    presentationSection.style.display = 'block';
    presentationLinks.innerHTML = '';

    presentationPaths.forEach((presentationPath, index) => {
        const fullPath = presentationPath.startsWith('http') ? presentationPath : `assets/presentations/${presentationPath}`;
        const fileName = presentationPath.split('/').pop() || `プレゼン${index + 1}.pptx`;
        
        const link = document.createElement('a');
        link.href = fullPath;
        link.className = 'file-link-btn';
        link.target = '_blank';
        link.download = fileName;
        
        link.innerHTML = `
            <i class="bi bi-file-earmark-slides-fill text-danger"></i>
            <span>${escapeHtml(fileName)}</span>
            <i class="bi bi-download ms-auto"></i>
        `;

        presentationLinks.appendChild(link);
    });
}

// ライトボックスを設定（Bootstrap Modalを使用）
function setupLightbox() {
    // キーボード操作
    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('lightboxModal');
        if (!modal || !modal.classList.contains('show')) return;

        if (e.key === 'Escape') {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        } else if (e.key === 'ArrowLeft') {
            const prevBtn = document.getElementById('lightbox-prev');
            if (prevBtn) prevBtn.click();
        } else if (e.key === 'ArrowRight') {
            const nextBtn = document.getElementById('lightbox-next');
            if (nextBtn) nextBtn.click();
        }
    });
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

// グローバル関数（HTMLのonclickから呼び出される）
window.openLightbox = function(index) {
    if (currentImages.length === 0) return;
    currentImageIndex = index;
    const lightboxImg = document.getElementById('lightbox-img');
    const modalElement = document.getElementById('lightboxModal');
    const modal = new bootstrap.Modal(modalElement);
    
    lightboxImg.src = currentImages[currentImageIndex];
    modal.show();

    // ナビゲーションボタンのイベントリスナーを設定
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');

    if (prevBtn && nextBtn) {
        // 既存のイベントリスナーを削除して新しいものを追加
        const newPrevBtn = prevBtn.cloneNode(true);
        const newNextBtn = nextBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

        document.getElementById('lightbox-prev').onclick = (e) => {
            e.stopPropagation();
            if (currentImages.length > 0) {
                currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
                document.getElementById('lightbox-img').src = currentImages[currentImageIndex];
            }
        };

        document.getElementById('lightbox-next').onclick = (e) => {
            e.stopPropagation();
            if (currentImages.length > 0) {
                currentImageIndex = (currentImageIndex + 1) % currentImages.length;
                document.getElementById('lightbox-img').src = currentImages[currentImageIndex];
            }
        };
    }
};

window.switchCarouselSlide = function(carouselId, index) {
    const carouselElement = document.getElementById(carouselId);
    if (carouselElement) {
        const carousel = bootstrap.Carousel.getInstance(carouselElement) || new bootstrap.Carousel(carouselElement);
        carousel.to(index);
        updateThumbnailActive(index);
        currentImageIndex = index;
    }
};
