// Excelファイルのパス
const EXCEL_FILE_PATH = 'data/students.xlsx';

// 学生データを格納
let studentsData = [];
let currentStudent = null;
// 画像関連の変数は使用しない（スライドPDFとレポートのみ表示）

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
        setupNavigationButtons();
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

    // プレゼン資料を表示（最初に表示）
    displayPresentations();

    // レポートを表示
    displayReports();
    
    // 画像は表示しない（スライドPDFとレポートのみ）
}

// 前後移動ボタンの設定
function setupNavigationButtons() {
    if (!currentStudent || studentsData.length === 0) {
        return;
    }

    // 現在の学生のインデックスを取得
    const currentIndex = studentsData.findIndex(s => String(s.id) === String(currentStudent.id));
    
    // 前後の学生を取得
    const prevStudent = currentIndex > 0 ? studentsData[currentIndex - 1] : null;
    const nextStudent = currentIndex < studentsData.length - 1 ? studentsData[currentIndex + 1] : null;
    
    // ボタンの参照を取得
    const prevBtn = document.getElementById('prev-student-btn');
    const nextBtn = document.getElementById('next-student-btn');
    
    // ボタンの有効/無効を設定
    if (prevBtn) {
        prevBtn.disabled = !prevStudent;
        if (prevStudent) {
            prevBtn.onclick = () => {
                navigateToStudent(prevStudent.id);
            };
        } else {
            prevBtn.onclick = null;
        }
    }
    
    if (nextBtn) {
        nextBtn.disabled = !nextStudent;
        if (nextStudent) {
            nextBtn.onclick = () => {
                navigateToStudent(nextStudent.id);
            };
        } else {
            nextBtn.onclick = null;
        }
    }
}

// 指定された学生IDに遷移
function navigateToStudent(studentId) {
    const url = new URL(window.location.href);
    url.searchParams.set('id', studentId);
    window.location.href = url.toString();
}

// 画像表示機能は使用しない（スライドPDFとレポートのみ表示）

// レポートを表示（PDFとして表示）
function displayReports() {
    const reportSection = document.getElementById('report-section');
    const reportContainer = document.getElementById('report-container');

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
    reportContainer.innerHTML = '';

    reportPaths.forEach((reportPath, index) => {
        // ファイル名を決定
        let fileName;
        let fullPath;
        
        if (reportPath.startsWith('http')) {
            fullPath = reportPath;
            fileName = reportPath.split('/').pop() || `レポート${index + 1}.pdf`;
        } else if (reportPath.includes('/')) {
            fullPath = `assets/reports/${reportPath}`;
            fileName = reportPath.split('/').pop() || `レポート${index + 1}.pdf`;
        } else {
            // 学籍番号のみの場合は.pdfを追加
            fileName = reportPath.endsWith('.pdf') ? reportPath : `${reportPath}.pdf`;
            // reports/pdfフォルダ内のPDFを探す
            fullPath = `assets/reports/pdf/${fileName}`;
        }
        
        // PDFビューアー用のカードを作成
        const pdfCard = document.createElement('div');
        pdfCard.className = 'presentation-pdf-card';
        pdfCard.innerHTML = `
            <div class="pdf-header">
                <div class="pdf-controls">
                    <button class="btn btn-sm btn-outline-secondary pdf-control-btn" data-action="prev" title="前のページ">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <span class="pdf-page-info">
                        <span class="pdf-page-current">1</span> / <span class="pdf-page-total">-</span>
                    </span>
                    <button class="btn btn-sm btn-outline-secondary pdf-control-btn" data-action="next" title="次のページ">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary pdf-control-btn" data-action="zoom-out" title="縮小">
                        <i class="fas fa-search-minus"></i>
                    </button>
                    <span class="pdf-zoom-info">100%</span>
                    <button class="btn btn-sm btn-outline-secondary pdf-control-btn" data-action="zoom-in" title="拡大">
                        <i class="fas fa-search-plus"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary pdf-control-btn" data-action="fit-width" title="幅に合わせる">
                        <i class="fas fa-arrows-alt-h"></i>
                    </button>
                </div>
            </div>
            <div class="pdf-viewer-container" data-pdf-path="${fullPath}">
                <div class="pdf-loading">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">読み込み中...</span>
                    </div>
                    <p class="mt-2">PDFを読み込んでいます...</p>
                </div>
                <div class="pdf-canvas-wrapper">
                    <canvas class="pdf-canvas"></canvas>
                </div>
            </div>
        `;
        reportContainer.appendChild(pdfCard);
        
        // PDFを読み込んで表示
        loadPdfViewer(pdfCard, fullPath);
    });
}

// PDF.jsのワーカーを設定
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// プレゼン資料を表示（PDFとして表示）
function displayPresentations() {
    const presentationSection = document.getElementById('presentation-section');
    const presentationContainer = document.getElementById('presentation-container');

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
    presentationContainer.innerHTML = '';

    presentationPaths.forEach((presentationPath, index) => {
        // ファイル名を決定
        let fileName;
        let fullPath;
        
        if (presentationPath.startsWith('http')) {
            fullPath = presentationPath;
            fileName = presentationPath.split('/').pop() || `プレゼン${index + 1}.pdf`;
        } else {
            // PPTX拡張子の場合はPDFに変換
            if (presentationPath.toLowerCase().endsWith('.pptx') || presentationPath.toLowerCase().endsWith('.ppt')) {
                fileName = presentationPath.replace(/\.(pptx?)$/i, '.pdf');
            } else if (/^\d{7}$/.test(presentationPath)) {
                // 学籍番号のみの場合はPDF拡張子を追加
                fileName = `${presentationPath}.pdf`;
            } else {
                fileName = presentationPath;
            }
            
            // rehearsal/pdfフォルダ内のPDFを探す
            fullPath = `assets/presentations/rehearsal/pdf/${fileName}`;
        }
        
        // PDFビューアー用のカードを作成
        const pdfCard = document.createElement('div');
        pdfCard.className = 'presentation-pdf-card';
        pdfCard.innerHTML = `
            <div class="pdf-header">
                <div class="pdf-controls">
                    <button class="btn btn-sm btn-outline-secondary pdf-control-btn" data-action="prev" title="前のページ">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <span class="pdf-page-info">
                        <span class="pdf-page-current">1</span> / <span class="pdf-page-total">-</span>
                    </span>
                    <button class="btn btn-sm btn-outline-secondary pdf-control-btn" data-action="next" title="次のページ">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary pdf-control-btn" data-action="zoom-out" title="縮小">
                        <i class="fas fa-search-minus"></i>
                    </button>
                    <span class="pdf-zoom-info">100%</span>
                    <button class="btn btn-sm btn-outline-secondary pdf-control-btn" data-action="zoom-in" title="拡大">
                        <i class="fas fa-search-plus"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary pdf-control-btn" data-action="fit-width" title="幅に合わせる">
                        <i class="fas fa-arrows-alt-h"></i>
                    </button>
                </div>
            </div>
            <div class="pdf-viewer-container" data-pdf-path="${fullPath}">
                <div class="pdf-loading">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">読み込み中...</span>
                    </div>
                    <p class="mt-2">PDFを読み込んでいます...</p>
                </div>
                <div class="pdf-canvas-wrapper">
                    <canvas class="pdf-canvas"></canvas>
                </div>
            </div>
        `;
        presentationContainer.appendChild(pdfCard);
        
        // PDFを読み込んで表示
        loadPdfViewer(pdfCard, fullPath);
    });
}

// PDFビューアーを読み込む
async function loadPdfViewer(container, pdfPath) {
    const viewerContainer = container.querySelector('.pdf-viewer-container');
    const canvas = container.querySelector('.pdf-canvas');
    const loadingDiv = container.querySelector('.pdf-loading');
    const canvasWrapper = container.querySelector('.pdf-canvas-wrapper');
    const prevBtn = container.querySelector('[data-action="prev"]');
    const nextBtn = container.querySelector('[data-action="next"]');
    const zoomInBtn = container.querySelector('[data-action="zoom-in"]');
    const zoomOutBtn = container.querySelector('[data-action="zoom-out"]');
    const fitWidthBtn = container.querySelector('[data-action="fit-width"]');
    const pageCurrent = container.querySelector('.pdf-page-current');
    const pageTotal = container.querySelector('.pdf-page-total');
    const zoomInfo = container.querySelector('.pdf-zoom-info');
    
    let pdfDoc = null;
    let pageNum = 1;
    let pageRendering = false;
    let pageNumPending = null;
    let scale = 1.0;
    const scaleDelta = 0.2;
    
    try {
        // PDF.jsを使用してPDFを読み込む
        if (typeof pdfjsLib === 'undefined') {
            // PDF.jsが利用できない場合はiframeにフォールバック
            fallbackToIframe(viewerContainer, pdfPath);
            return;
        }
        
        const loadingTask = pdfjsLib.getDocument(pdfPath);
        pdfDoc = await loadingTask.promise;
        
        pageTotal.textContent = pdfDoc.numPages;
        
        // 初期表示
        renderPage(pageNum);
        
        // コントロールボタンのイベントリスナー
        prevBtn.addEventListener('click', () => {
            if (pageNum <= 1) return;
            pageNum--;
            queueRenderPage(pageNum);
        });
        
        nextBtn.addEventListener('click', () => {
            if (pageNum >= pdfDoc.numPages) return;
            pageNum++;
            queueRenderPage(pageNum);
        });
        
        zoomInBtn.addEventListener('click', () => {
            scale += scaleDelta;
            queueRenderPage(pageNum);
        });
        
        zoomOutBtn.addEventListener('click', () => {
            if (scale <= scaleDelta) return;
            scale -= scaleDelta;
            queueRenderPage(pageNum);
        });
        
        fitWidthBtn.addEventListener('click', () => {
            // 幅に合わせる
            const containerWidth = canvasWrapper.clientWidth;
            canvas.width = containerWidth;
            scale = containerWidth / canvas.width;
            queueRenderPage(pageNum);
        });
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (!viewerContainer.contains(document.activeElement) && 
                !container.contains(document.activeElement)) return;
            
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (pageNum > 1) {
                    pageNum--;
                    queueRenderPage(pageNum);
                }
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                if (pageNum < pdfDoc.numPages) {
                    pageNum++;
                    queueRenderPage(pageNum);
                }
            }
        });
        
    } catch (error) {
        console.error('PDF読み込みエラー:', error);
        fallbackToIframe(viewerContainer, pdfPath);
    }
    
    function queueRenderPage(num) {
        if (pageRendering) {
            pageNumPending = num;
        } else {
            renderPage(num);
        }
    }
    
    async function renderPage(num) {
        pageRendering = true;
        
        try {
            const page = await pdfDoc.getPage(num);
            const viewport = page.getViewport({ scale: scale });
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            const renderContext = {
                canvasContext: canvas.getContext('2d'),
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            pageRendering = false;
            pageCurrent.textContent = num;
            zoomInfo.textContent = Math.round(scale * 100) + '%';
            
            // ボタンの有効/無効を更新
            prevBtn.disabled = (num <= 1);
            nextBtn.disabled = (num >= pdfDoc.numPages);
            
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
            
            // ローディングを非表示
            loadingDiv.style.display = 'none';
            canvasWrapper.style.display = 'block';
            
        } catch (error) {
            console.error('ページレンダリングエラー:', error);
            fallbackToIframe(viewerContainer, pdfPath);
        }
    }
}

// iframeにフォールバック
function fallbackToIframe(container, pdfPath) {
    container.innerHTML = `
        <iframe src="${pdfPath}#toolbar=1&navpanes=1&scrollbar=1" 
                class="pdf-iframe"
                title="PDF Viewer"
                allow="fullscreen">
            <p>PDFを表示できません。<a href="${pdfPath}" target="_blank" rel="noopener noreferrer">こちらからダウンロード</a>してください。</p>
        </iframe>
    `;
}

// ライトボックス機能は使用しない（スライドPDFとレポートのみ表示）


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

// 画像関連のグローバル関数は使用しない（スライドPDFとレポートのみ表示）
