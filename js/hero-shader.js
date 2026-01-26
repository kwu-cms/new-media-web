/**
 * Hero動画用のWebGLシェーダーエフェクト
 * RGBシフトとグリッチ効果を実装
 */

/**
 * Hero動画シェーダーエフェクトの設定（デフォルト設定）
 * 実際の効果は各動画ごとにJSONオブジェクトで管理されます
 */
const HERO_SHADER_CONFIG = {
    enabled: true,  // falseにすると通常のvideo要素を使用
    rgbShift: {
        enabled: false,
        intensity: 0.01,
        speed: 0.5,
        offsetX: 0.0,  // X方向のオフセット基本値
        offsetY: 0.0,  // Y方向のオフセット基本値
        speedX: 2.0,   // X方向の速度係数
        speedY: 1.5    // Y方向の速度係数
    },
    glitch: {
        enabled: false,
        intensity: 0.15,
        duration: 0.3,
        interval: 3.0
    },
    mosaic: {
        enabled: false,
        size: 20.0,  // 後方互換性のため（sizeFrom/sizeToが未設定の場合に使用）
        sizeFrom: 20.0,  // イージング開始値
        sizeTo: 20.0,    // イージング終了値
        easingDuration: 1.0  // イージングの期間（秒）
    },
    bloom: {
        enabled: false,
        intensity: 1.5,
        threshold: 0.7,
        radius: 10.0
    },
    blur: {
        enabled: false,
        intensity: 5.0,  // 後方互換性のため（intensityFrom/intensityToが未設定の場合に使用）
        intensityFrom: 5.0,  // イージング開始値
        intensityTo: 5.0,    // イージング終了値
        easingDuration: 2.0   // イージングの期間（秒）
    },
    vignette: {
        enabled: false,
        intensity: 0.5,  // ビネットの強度（0.0-1.0）
        radius: 0.8,  // ビネットの半径（0.0-1.0）
        softness: 0.3  // ビネットのソフトネス（0.0-1.0）
    },
    tiling: {
        enabled: false,
        countX: 2.0,  // X方向のタイリング数（後方互換性のため）
        countY: 2.0,  // Y方向のタイリング数（後方互換性のため）
        countXTo: 2.0,  // イージング終了値（X方向）
        countYTo: 2.0,  // イージング終了値（Y方向）
        easingDuration: 2.0,  // イージングの期間（秒）
        offsetX: 0.0,  // X方向のオフセット
        offsetY: 0.0  // Y方向のオフセット
    },
    zoomIn: {
        enabled: false,
        intensity: 0.2,  // ズームインの強度（0.0-1.0、大きいほど拡大）
        speed: 0.5  // ズームインの速度
    },
    zoomOut: {
        enabled: false,
        intensity: 0.3,  // ズームアウトの強度（0.0-1.0、大きいほど縮小）
        speed: 0.5  // ズームアウトの速度
    }
};

// 頂点シェーダー
const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
    }
`;

// フラグメントシェーダー（全効果対応）
const fragmentShaderSource = `
    precision mediump float;
    
    uniform sampler2D u_texture;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_rgbShiftIntensity;
    uniform float u_rgbShiftOffsetX;
    uniform float u_rgbShiftOffsetY;
    uniform float u_rgbShiftSpeedX;
    uniform float u_rgbShiftSpeedY;
    uniform float u_glitchIntensity;
    uniform float u_glitchDuration;
    uniform float u_glitchInterval;
    uniform float u_rgbShiftEnabled;
    uniform float u_glitchEnabled;
    uniform float u_mosaicEnabled;
    uniform float u_mosaicSize;
    uniform float u_mosaicSizeFrom;
    uniform float u_mosaicSizeTo;
    uniform float u_mosaicEasingDuration;
    uniform float u_bloomEnabled;
    uniform float u_bloomIntensity;
    uniform float u_bloomThreshold;
    uniform float u_bloomRadius;
    uniform float u_blurEnabled;
    uniform float u_blurIntensity;
    uniform float u_blurIntensityFrom;
    uniform float u_blurIntensityTo;
    uniform float u_blurEasingDuration;
    uniform float u_vignetteEnabled;
    uniform float u_vignetteIntensity;
    uniform float u_vignetteRadius;
    uniform float u_vignetteSoftness;
    uniform float u_tilingEnabled;
    uniform float u_tilingCountX;
    uniform float u_tilingCountY;
    uniform float u_tilingCountXTo;
    uniform float u_tilingCountYTo;
    uniform float u_tilingEasingDuration;
    uniform float u_tilingOffsetX;
    uniform float u_tilingOffsetY;
    uniform float u_zoomInEnabled;
    uniform float u_zoomInIntensity;
    uniform float u_zoomInSpeed;
    uniform float u_zoomOutEnabled;
    uniform float u_zoomOutIntensity;
    uniform float u_zoomOutSpeed;
    
    varying vec2 v_texCoord;
    
    // ガウシアンブラーのサンプリング（簡易版）
    vec3 sampleBlur(vec2 uv, float radius) {
        vec3 color = vec3(0.0);
        float total = 0.0;
        
        // 簡易的なガウシアンブラー（9サンプル、3x3）
        // 重みを直接計算（配列を使わない）
        for (int y = -1; y <= 1; y++) {
            for (int x = -1; x <= 1; x++) {
                float dist = float(x*x + y*y);
                float weight = 1.0 / (1.0 + dist * 2.0); // 距離に応じた重み
                vec2 offset = vec2(float(x), float(y)) * radius / u_resolution;
                color += texture2D(u_texture, uv + offset).rgb * weight;
                total += weight;
            }
        }
        
        return color / total;
    }
    
    // ビネット効果を計算（レンズの光学的な実装に基づく）
    float calculateVignette(vec2 uv) {
        // 中心からの距離を計算（正規化座標系で0.0-1.0）
        vec2 center = vec2(0.5, 0.5);
        vec2 distFromCenter = uv - center;
        
        // 正規化された距離（中心からコーナーまでが約0.707）
        float dist = length(distFromCenter);
        
        // レンズの光学的ビネット効果を模倣
        // 距離の2乗または4乗に比例して減衰（より現実的な減衰カーブ）
        // radiusで効果の範囲を制御（0.0-1.0、大きいほど効果範囲が広い）
        float normalizedDist = dist / 0.707; // コーナーまでの距離で正規化
        
        // レンズビネットの減衰カーブ（cosカーブを使用してより自然な減衰）
        // softnessで減衰の急峻さを制御
        float vignetteFactor = 1.0;
        
        if (normalizedDist > u_vignetteRadius) {
            // 半径を超えた部分で減衰を開始
            float falloff = (normalizedDist - u_vignetteRadius) / (1.0 - u_vignetteRadius);
            // cosカーブで滑らかな減衰（softnessで調整）
            float smoothFalloff = 1.0 - pow(falloff, 1.0 / (u_vignetteSoftness + 0.01));
            // 距離の4乗に比例した減衰（レンズの光学的特性）
            float opticalFalloff = pow(1.0 - falloff, 4.0) * smoothFalloff;
            vignetteFactor = 1.0 - u_vignetteIntensity * (1.0 - opticalFalloff);
        }
        
        return vignetteFactor;
    }
    
    void main() {
        vec2 uv = v_texCoord;
        vec2 sampleUV = uv;
        
        // ズームイン効果（タイリングの前に適用）
        if (u_zoomInEnabled > 0.5) {
            vec2 center = vec2(0.5, 0.5);
            vec2 offset = uv - center;
            // ズームイン：中心に向かって縮小（アニメーション付き）
            float zoomScale = 1.0 - u_zoomInIntensity * (0.5 + 0.5 * sin(u_time * u_zoomInSpeed));
            sampleUV = center + offset * zoomScale;
        }
        
        // ズームアウト効果（タイリングの前に適用）
        if (u_zoomOutEnabled > 0.5) {
            vec2 center = vec2(0.5, 0.5);
            vec2 offset = uv - center;
            // ズームアウト：中心から拡大（アニメーション付き）
            float zoomScale = 1.0 + u_zoomOutIntensity * (0.5 + 0.5 * sin(u_time * u_zoomOutSpeed));
            sampleUV = center + offset * zoomScale;
        }
        
        // タイリング効果（ズームの後に適用）
        if (u_tilingEnabled > 0.5) {
            // 2つの値の間でイージング（ease-in-out、一方向のみ、往復しない）
            float tilingCountX;
            float tilingCountY;
            if (u_tilingEasingDuration > 0.0 && (u_tilingCountX != u_tilingCountXTo || u_tilingCountY != u_tilingCountYTo)) {
                // イージング周期を計算（0.0-1.0の範囲でループ、往復しない）
                // 目的の値に到達する前に次の値が設定されるため、連続的に変化する
                float easingCycle = mod(u_time, u_tilingEasingDuration) / u_tilingEasingDuration;
                // ease-in-out補間
                float t = easingCycle * easingCycle * (3.0 - 2.0 * easingCycle);
                tilingCountX = mix(u_tilingCountX, u_tilingCountXTo, t);
                tilingCountY = mix(u_tilingCountY, u_tilingCountYTo, t);
            } else {
                // イージングが無効な場合は通常のcountX/countYを使用
                tilingCountX = u_tilingCountX;
                tilingCountY = u_tilingCountY;
            }
            sampleUV = vec2(
                mod(sampleUV.x * tilingCountX + u_tilingOffsetX, 1.0),
                mod(sampleUV.y * tilingCountY + u_tilingOffsetY, 1.0)
            );
        }
        
        // モザイク効果（タイリングの後に適用）
        if (u_mosaicEnabled > 0.5) {
            // 2つの値の間でイージング（ease-in-out）
            float mosaicSize;
            if (u_mosaicEasingDuration > 0.0 && u_mosaicSizeFrom != u_mosaicSizeTo) {
                // イージング周期を計算（0.0-1.0）
                float easingCycle = mod(u_time, u_mosaicEasingDuration * 2.0) / u_mosaicEasingDuration;
                float t;
                if (easingCycle < 1.0) {
                    // 0.0-1.0: sizeFromからsizeToへ
                    t = easingCycle;
                } else {
                    // 1.0-2.0: sizeToからsizeFromへ
                    t = 2.0 - easingCycle;
                }
                // ease-in-out補間
                t = t * t * (3.0 - 2.0 * t);
                mosaicSize = mix(u_mosaicSizeFrom, u_mosaicSizeTo, t);
            } else {
                // イージングが無効な場合は通常のsizeを使用
                mosaicSize = u_mosaicSize;
            }
            // sizeが0以下の場合はモザイク効果を適用しない（通常表示）
            if (mosaicSize > 0.0) {
                sampleUV = floor(sampleUV * u_resolution / mosaicSize) * mosaicSize / u_resolution;
            }
        }
        
        vec3 color;
        
        // RGBシフト（横方向と縦方向の両方に適用）
        if (u_rgbShiftEnabled > 0.5) {
            // オフセット計算（パラメータ化）
            // 基本オフセット + 時間ベースのアニメーション
            float shiftX = u_rgbShiftOffsetX + u_rgbShiftIntensity * sin(u_time * u_rgbShiftSpeedX);
            float shiftY = u_rgbShiftOffsetY + u_rgbShiftIntensity * cos(u_time * u_rgbShiftSpeedY);
            
            vec2 offsetR = vec2(shiftX, shiftY);
            vec2 offsetG = vec2(0.0, 0.0);
            vec2 offsetB = vec2(-shiftX, -shiftY);
            
            float r = texture2D(u_texture, sampleUV + offsetR).r;
            float g = texture2D(u_texture, sampleUV + offsetG).g;
            float b = texture2D(u_texture, sampleUV + offsetB).b;
            
            color = vec3(r, g, b);
        } else {
            // RGBシフトが無効な場合は通常の色を取得
            color = texture2D(u_texture, sampleUV).rgb;
        }
        
        // グリッチ効果（一定時間継続する）
        if (u_glitchEnabled > 0.5) {
            // グリッチのタイミングを計算（一定間隔で発生）
            float glitchCycle = mod(u_time, u_glitchInterval);
            float glitchActive = step(0.0, glitchCycle) * step(glitchCycle, u_glitchDuration);
            
            if (glitchActive > 0.5) {
                // グリッチ中のオフセット（ランダムだが一定時間維持）
                float glitchSeed = floor(u_time / u_glitchInterval);
                vec2 glitchOffset = vec2(
                    (fract(sin(glitchSeed * 50.0) * 43758.5453) - 0.5) * u_glitchIntensity,
                    (fract(sin(glitchSeed * 30.0) * 43758.5453) - 0.5) * u_glitchIntensity * 0.5
                );
                
                color = texture2D(u_texture, sampleUV + glitchOffset).rgb;
            }
        }
        
        // ブラー効果
        if (u_blurEnabled > 0.5) {
            // 2つの値の間でイージング（ease-in-out）
            float blurIntensity;
            if (u_blurEasingDuration > 0.0 && u_blurIntensityFrom != u_blurIntensityTo) {
                // イージング周期を計算（0.0-1.0）
                float easingCycle = mod(u_time, u_blurEasingDuration * 2.0) / u_blurEasingDuration;
                float t;
                if (easingCycle < 1.0) {
                    // 0.0-1.0: intensityFromからintensityToへ
                    t = easingCycle;
                } else {
                    // 1.0-2.0: intensityToからintensityFromへ
                    t = 2.0 - easingCycle;
                }
                // ease-in-out補間
                t = t * t * (3.0 - 2.0 * t);
                blurIntensity = mix(u_blurIntensityFrom, u_blurIntensityTo, t);
            } else {
                // イージングが無効な場合は通常のintensityを使用
                blurIntensity = u_blurIntensity;
            }
            color = sampleBlur(sampleUV, blurIntensity);
        }
        
        // ブルーム効果（元のテクスチャからサンプリング）
        if (u_bloomEnabled > 0.5) {
            // 明るさを計算
            float brightness = dot(color, vec3(0.299, 0.587, 0.114));
            
            // 閾値以上の明るい部分のみブルームを適用
            if (brightness > u_bloomThreshold) {
                vec3 bloom = sampleBlur(sampleUV, u_bloomRadius);
                float bloomAmount = (brightness - u_bloomThreshold) / (1.0 - u_bloomThreshold);
                color += bloom * bloomAmount * u_bloomIntensity;
            }
        }
        
        // ビネット効果（最後に適用）
        if (u_vignetteEnabled > 0.5) {
            float vignette = calculateVignette(uv);
            color *= vignette;
        }
        
        gl_FragColor = vec4(color, 1.0);
    }
`;

class HeroVideoShader {
    constructor(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.gl = null;
        this.program = null;
        this.texture = null;
        this.time = 0;
        this.animationFrame = null;
        this.isEnabled = false; // シェーダーが有効かどうか
        this.currentConfig = null; // 現在適用されているシェーダー設定
        
        // 設定でシェーダーが無効な場合は何もしない
        if (!HERO_SHADER_CONFIG || !HERO_SHADER_CONFIG.enabled) {
            this.isEnabled = false;
            // 既存のcanvasがあれば削除
            if (this.canvas && this.canvas.parentElement) {
                this.canvas.parentElement.removeChild(this.canvas);
                this.canvas = null;
            }
            // video要素を確実に表示
            if (this.video) {
                this.video.style.display = 'block';
                this.video.style.opacity = '0.4';
                this.video.classList.add('active');
            }
            return;
        }
        
        this.initWebGL();
    }
    
    initWebGL() {
        // Canvasを設定
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.className = 'hero-background-video-shader';
            this.canvas.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                min-width: 100%;
                min-height: 100%;
                width: auto;
                height: auto;
                transform: translate(-50%, -50%);
                z-index: 0;
                object-fit: cover;
                opacity: 0;
                transition: opacity 1s ease-in-out;
                display: none;
            `;
            this.video.parentElement.appendChild(this.canvas);
        }
        
        // WebGLコンテキストを取得
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) {
            console.warn('WebGL not supported, falling back to video element');
            this.isEnabled = false;
            if (this.canvas && this.canvas.parentElement) {
                this.canvas.parentElement.removeChild(this.canvas);
            }
            return;
        }
        
        // シェーダーをコンパイル
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        if (!vertexShader || !fragmentShader) {
            console.error('Shader compilation failed, falling back to video element');
            this.isEnabled = false;
            if (this.canvas && this.canvas.parentElement) {
                this.canvas.parentElement.removeChild(this.canvas);
            }
            return;
        }
        
        // プログラムを作成
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);
        
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            const errorLog = this.gl.getProgramInfoLog(this.program);
            console.error('Program linking failed:', errorLog);
            console.error('Shader source:', fragmentShaderSource);
            this.isEnabled = false;
            if (this.canvas && this.canvas.parentElement) {
                this.canvas.parentElement.removeChild(this.canvas);
            }
            return;
        }
        
        // すべての初期化が成功した場合のみ有効化
        this.isEnabled = true;
        
        // テクスチャを作成
        this.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        
        // バッファを設定
        this.setupBuffers();
        
        // アニメーションループを開始
        this.animate();
    }
    
    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation failed:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    setupBuffers() {
        // フルスクリーンクワッドの頂点データ
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
            -1,  1,
             1, -1,
             1,  1
        ]);
        
        const texCoords = new Float32Array([
            0, 1,
            1, 1,
            0, 0,
            0, 0,
            1, 1,
            1, 0
        ]);
        
        // 位置バッファ
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
        
        const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
        
        // テクスチャ座標バッファ
        const texCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);
        
        const texCoordLocation = this.gl.getAttribLocation(this.program, 'a_texCoord');
        this.gl.enableVertexAttribArray(texCoordLocation);
        this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);
    }
    
    animate() {
        // シェーダーが有効でない場合はアニメーションを開始しない
        if (!this.isEnabled || !this.gl || !this.program) {
            return;
        }
        
        const animate = () => {
            // シェーダーが無効になった場合はアニメーションを停止
            if (!this.isEnabled || !this.gl || !this.program) {
                if (this.animationFrame) {
                    cancelAnimationFrame(this.animationFrame);
                    this.animationFrame = null;
                }
                return;
            }
            
            if (!this.video || this.video.readyState < 2) {
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }
            
            // Canvasサイズを更新（video要素のサイズに合わせる）
            // video要素はCSSでmin-width/min-heightが100%に設定されているため、
            // 実際の表示サイズを取得してcanvasに適用
            const rect = this.video.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                // デバイスピクセル比を考慮
                const dpr = window.devicePixelRatio || 1;
                const displayWidth = Math.floor(rect.width * dpr);
                const displayHeight = Math.floor(rect.height * dpr);
                
                // サイズが変更された場合のみ更新（パフォーマンス最適化）
                if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
                    this.canvas.width = displayWidth;
                    this.canvas.height = displayHeight;
                    this.canvas.style.width = rect.width + 'px';
                    this.canvas.style.height = rect.height + 'px';
                }
                this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            }
            
            // 動画フレームをテクスチャにアップロード
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.video);
            
            // シェーダーを使用
            this.gl.useProgram(this.program);
            
            // ユニフォームを設定
            const config = this.currentConfig || HERO_SHADER_CONFIG;
            
            const resolutionLocation = this.gl.getUniformLocation(this.program, 'u_resolution');
            const timeLocation = this.gl.getUniformLocation(this.program, 'u_time');
            const rgbShiftIntensityLocation = this.gl.getUniformLocation(this.program, 'u_rgbShiftIntensity');
            const rgbShiftOffsetXLocation = this.gl.getUniformLocation(this.program, 'u_rgbShiftOffsetX');
            const rgbShiftOffsetYLocation = this.gl.getUniformLocation(this.program, 'u_rgbShiftOffsetY');
            const rgbShiftSpeedXLocation = this.gl.getUniformLocation(this.program, 'u_rgbShiftSpeedX');
            const rgbShiftSpeedYLocation = this.gl.getUniformLocation(this.program, 'u_rgbShiftSpeedY');
            const glitchIntensityLocation = this.gl.getUniformLocation(this.program, 'u_glitchIntensity');
            const glitchDurationLocation = this.gl.getUniformLocation(this.program, 'u_glitchDuration');
            const glitchIntervalLocation = this.gl.getUniformLocation(this.program, 'u_glitchInterval');
            const rgbShiftEnabledLocation = this.gl.getUniformLocation(this.program, 'u_rgbShiftEnabled');
            const glitchEnabledLocation = this.gl.getUniformLocation(this.program, 'u_glitchEnabled');
            const mosaicEnabledLocation = this.gl.getUniformLocation(this.program, 'u_mosaicEnabled');
            const mosaicSizeLocation = this.gl.getUniformLocation(this.program, 'u_mosaicSize');
            const mosaicSizeFromLocation = this.gl.getUniformLocation(this.program, 'u_mosaicSizeFrom');
            const mosaicSizeToLocation = this.gl.getUniformLocation(this.program, 'u_mosaicSizeTo');
            const mosaicEasingDurationLocation = this.gl.getUniformLocation(this.program, 'u_mosaicEasingDuration');
            const bloomEnabledLocation = this.gl.getUniformLocation(this.program, 'u_bloomEnabled');
            const bloomIntensityLocation = this.gl.getUniformLocation(this.program, 'u_bloomIntensity');
            const bloomThresholdLocation = this.gl.getUniformLocation(this.program, 'u_bloomThreshold');
            const bloomRadiusLocation = this.gl.getUniformLocation(this.program, 'u_bloomRadius');
            const blurEnabledLocation = this.gl.getUniformLocation(this.program, 'u_blurEnabled');
            const blurIntensityLocation = this.gl.getUniformLocation(this.program, 'u_blurIntensity');
            const blurIntensityFromLocation = this.gl.getUniformLocation(this.program, 'u_blurIntensityFrom');
            const blurIntensityToLocation = this.gl.getUniformLocation(this.program, 'u_blurIntensityTo');
            const blurEasingDurationLocation = this.gl.getUniformLocation(this.program, 'u_blurEasingDuration');
            const vignetteEnabledLocation = this.gl.getUniformLocation(this.program, 'u_vignetteEnabled');
            const vignetteIntensityLocation = this.gl.getUniformLocation(this.program, 'u_vignetteIntensity');
            const vignetteRadiusLocation = this.gl.getUniformLocation(this.program, 'u_vignetteRadius');
            const vignetteSoftnessLocation = this.gl.getUniformLocation(this.program, 'u_vignetteSoftness');
            const tilingEnabledLocation = this.gl.getUniformLocation(this.program, 'u_tilingEnabled');
            const tilingCountXLocation = this.gl.getUniformLocation(this.program, 'u_tilingCountX');
            const tilingCountYLocation = this.gl.getUniformLocation(this.program, 'u_tilingCountY');
            const tilingCountXToLocation = this.gl.getUniformLocation(this.program, 'u_tilingCountXTo');
            const tilingCountYToLocation = this.gl.getUniformLocation(this.program, 'u_tilingCountYTo');
            const tilingEasingDurationLocation = this.gl.getUniformLocation(this.program, 'u_tilingEasingDuration');
            const tilingOffsetXLocation = this.gl.getUniformLocation(this.program, 'u_tilingOffsetX');
            const tilingOffsetYLocation = this.gl.getUniformLocation(this.program, 'u_tilingOffsetY');
            const zoomInEnabledLocation = this.gl.getUniformLocation(this.program, 'u_zoomInEnabled');
            const zoomInIntensityLocation = this.gl.getUniformLocation(this.program, 'u_zoomInIntensity');
            const zoomInSpeedLocation = this.gl.getUniformLocation(this.program, 'u_zoomInSpeed');
            const zoomOutEnabledLocation = this.gl.getUniformLocation(this.program, 'u_zoomOutEnabled');
            const zoomOutIntensityLocation = this.gl.getUniformLocation(this.program, 'u_zoomOutIntensity');
            const zoomOutSpeedLocation = this.gl.getUniformLocation(this.program, 'u_zoomOutSpeed');
            
            this.gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);
            this.time += 0.016; // 約60fps
            this.gl.uniform1f(timeLocation, this.time);
            this.gl.uniform1f(rgbShiftIntensityLocation, config.rgbShift?.intensity || 0.0);
            this.gl.uniform1f(rgbShiftOffsetXLocation, config.rgbShift?.offsetX || 0.0);
            this.gl.uniform1f(rgbShiftOffsetYLocation, config.rgbShift?.offsetY || 0.0);
            this.gl.uniform1f(rgbShiftSpeedXLocation, config.rgbShift?.speedX || 2.0);
            this.gl.uniform1f(rgbShiftSpeedYLocation, config.rgbShift?.speedY || 1.5);
            this.gl.uniform1f(glitchIntensityLocation, config.glitch?.intensity || 0.0);
            this.gl.uniform1f(glitchDurationLocation, config.glitch?.duration || 0.0);
            this.gl.uniform1f(glitchIntervalLocation, config.glitch?.interval || 0.0);
            this.gl.uniform1f(rgbShiftEnabledLocation, (config.rgbShift?.enabled && config.rgbShift.enabled) ? 1.0 : 0.0);
            this.gl.uniform1f(glitchEnabledLocation, (config.glitch?.enabled && config.glitch.enabled) ? 1.0 : 0.0);
            this.gl.uniform1f(mosaicEnabledLocation, (config.mosaic?.enabled && config.mosaic.enabled) ? 1.0 : 0.0);
            this.gl.uniform1f(mosaicSizeLocation, config.mosaic?.size || 20.0);
            this.gl.uniform1f(mosaicSizeFromLocation, config.mosaic?.sizeFrom !== undefined ? config.mosaic.sizeFrom : (config.mosaic?.size || 20.0));
            this.gl.uniform1f(mosaicSizeToLocation, config.mosaic?.sizeTo !== undefined ? config.mosaic.sizeTo : (config.mosaic?.size || 20.0));
            this.gl.uniform1f(mosaicEasingDurationLocation, config.mosaic?.easingDuration !== undefined ? config.mosaic.easingDuration : 1.0);
            this.gl.uniform1f(bloomEnabledLocation, (config.bloom?.enabled && config.bloom.enabled) ? 1.0 : 0.0);
            this.gl.uniform1f(bloomIntensityLocation, config.bloom?.intensity || 1.5);
            this.gl.uniform1f(bloomThresholdLocation, config.bloom?.threshold || 0.7);
            this.gl.uniform1f(bloomRadiusLocation, config.bloom?.radius || 10.0);
            this.gl.uniform1f(blurEnabledLocation, (config.blur?.enabled && config.blur.enabled) ? 1.0 : 0.0);
            this.gl.uniform1f(blurIntensityLocation, config.blur?.intensity || 5.0);
            this.gl.uniform1f(blurIntensityFromLocation, config.blur?.intensityFrom !== undefined ? config.blur.intensityFrom : (config.blur?.intensity || 5.0));
            this.gl.uniform1f(blurIntensityToLocation, config.blur?.intensityTo !== undefined ? config.blur.intensityTo : (config.blur?.intensity || 5.0));
            this.gl.uniform1f(blurEasingDurationLocation, config.blur?.easingDuration !== undefined ? config.blur.easingDuration : 2.0);
            this.gl.uniform1f(vignetteEnabledLocation, (config.vignette?.enabled && config.vignette.enabled) ? 1.0 : 0.0);
            this.gl.uniform1f(vignetteIntensityLocation, config.vignette?.intensity || 0.5);
            this.gl.uniform1f(vignetteRadiusLocation, config.vignette?.radius || 0.8);
            this.gl.uniform1f(vignetteSoftnessLocation, config.vignette?.softness || 0.3);
            this.gl.uniform1f(tilingEnabledLocation, (config.tiling?.enabled && config.tiling.enabled) ? 1.0 : 0.0);
            this.gl.uniform1f(tilingCountXLocation, config.tiling?.countX || 2.0);
            this.gl.uniform1f(tilingCountYLocation, config.tiling?.countY || 2.0);
            this.gl.uniform1f(tilingCountXToLocation, config.tiling?.countXTo !== undefined ? config.tiling.countXTo : (config.tiling?.countX || 2.0));
            this.gl.uniform1f(tilingCountYToLocation, config.tiling?.countYTo !== undefined ? config.tiling.countYTo : (config.tiling?.countY || 2.0));
            this.gl.uniform1f(tilingEasingDurationLocation, config.tiling?.easingDuration !== undefined ? config.tiling.easingDuration : 2.0);
            this.gl.uniform1f(tilingOffsetXLocation, config.tiling?.offsetX || 0.0);
            this.gl.uniform1f(tilingOffsetYLocation, config.tiling?.offsetY || 0.0);
            this.gl.uniform1f(zoomInEnabledLocation, (config.zoomIn?.enabled && config.zoomIn.enabled) ? 1.0 : 0.0);
            this.gl.uniform1f(zoomInIntensityLocation, config.zoomIn?.intensity || 0.2);
            this.gl.uniform1f(zoomInSpeedLocation, config.zoomIn?.speed || 0.5);
            this.gl.uniform1f(zoomOutEnabledLocation, (config.zoomOut?.enabled && config.zoomOut.enabled) ? 1.0 : 0.0);
            this.gl.uniform1f(zoomOutIntensityLocation, config.zoomOut?.intensity || 0.3);
            this.gl.uniform1f(zoomOutSpeedLocation, config.zoomOut?.speed || 0.5);
            
            // 描画
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    show() {
        // シェーダーが有効で、WebGLとプログラムが正常に初期化されている場合のみシェーダーを表示
        if (this.isEnabled && this.canvas && this.gl && this.program) {
            // シェーダーCanvasを表示
            this.canvas.style.display = 'block';
            this.canvas.style.opacity = '0.4';
            this.canvas.classList.add('active');
            // 元のvideo要素は非表示（ただし再生は継続）
            if (this.video) {
                this.video.style.display = 'none';
                this.video.style.opacity = '0';
                this.video.classList.remove('active');
            }
        } else {
            // シェーダーが無効または失敗した場合はvideo要素を表示
            // Canvasを確実に非表示
            if (this.canvas) {
                this.canvas.style.display = 'none';
                this.canvas.style.opacity = '0';
                this.canvas.classList.remove('active');
            }
            // video要素を確実に表示
            if (this.video) {
                this.video.style.display = 'block';
                this.video.style.opacity = '0.4';
                this.video.classList.add('active');
            }
        }
    }
    
    hide() {
        // シェーダーCanvasを非表示
        if (this.canvas) {
            this.canvas.style.display = 'none';
            this.canvas.style.opacity = '0';
            this.canvas.classList.remove('active');
        }
        // video要素を表示（フォールバック）
        if (this.video) {
            this.video.style.display = 'block';
            this.video.style.opacity = '0.4';
            this.video.classList.add('active');
        }
    }
    
    // シェーダーを完全に無効化（canvasを削除）
    disable() {
        this.isEnabled = false;
        // アニメーションを停止
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        // Canvasを削除
        if (this.canvas && this.canvas.parentElement) {
            this.canvas.parentElement.removeChild(this.canvas);
            this.canvas = null;
        }
        // video要素を表示
        if (this.video) {
            this.video.style.display = 'block';
            this.video.style.opacity = '0.4';
            this.video.classList.add('active');
        }
    }
    
    // シェーダーが有効かどうかを確認するメソッド
    isShaderEnabled() {
        return this.isEnabled && this.gl && this.program;
    }
    
    // シェーダー設定を更新
    setConfig(config) {
        this.currentConfig = config;
    }
    
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.texture) {
            this.gl.deleteTexture(this.texture);
        }
        if (this.program) {
            this.gl.deleteProgram(this.program);
        }
        if (this.canvas && this.canvas.parentElement) {
            this.canvas.parentElement.removeChild(this.canvas);
        }
    }
}

// グローバルにエクスポート
window.HeroVideoShader = HeroVideoShader;
window.HERO_SHADER_CONFIG = HERO_SHADER_CONFIG;
