import * as THREE from 'three';

// === 基本設定 ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
const container = document.getElementById('canvas-container');
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

camera.position.z = 50;

// === ライト ===
// テクスチャを貼った板ポリゴンには複雑なライトは不要なため、環境光のみにします
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

// === どら焼きの準備 ===
const textureLoader = new THREE.TextureLoader();
const dorayakiTexture = textureLoader.load('rectangle_large_type_2_f4510c4cdc76deef5eea53d122902a00.webp');
const dorayakiMaterial = new THREE.MeshBasicMaterial({
    map: dorayakiTexture,
    transparent: true // 画像の透明部分を有効にする
});
const dorayakiGeometry = new THREE.PlaneGeometry(1, 1); // 1x1の板ポリゴン

const dorayakis = [];
const MOUTH_POS = new THREE.Vector3(0, -40, 0);

function createDorayaki() {
    const dorayaki = new THREE.Mesh(dorayakiGeometry, dorayakiMaterial);

    // 大きさをランダムに
    const scale = Math.random() * 10 + 5;
    dorayaki.scale.set(scale, scale, scale);

    // 初期位置
    dorayaki.position.x = (Math.random() - 0.5) * 100;
    dorayaki.position.y = 60 + (Math.random() * 20);

    // カスタムプロパティ
    dorayaki.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        -0.1 - Math.random() * 0.1, //落下速度
        0
    );
    // Z軸周りの回転速度
    dorayaki.userData.rotationSpeed = (Math.random() - 0.5) * 0.02;
    dorayaki.userData.isSucking = false;

    dorayakis.push(dorayaki);
    scene.add(dorayaki);
}

// === アニメーションループ ===
function animate() {
    requestAnimationFrame(animate);

    // どら焼きの動きを更新
    for (let i = dorayakis.length - 1; i >= 0; i--) {
        const dorayaki = dorayakis[i];

        if (dorayaki.userData.isSucking) {
            // 吸い込まれる動き
            dorayaki.position.lerp(MOUTH_POS, 0.05);
            dorayaki.scale.multiplyScalar(0.95);

            // 小さくなったら消す
            if (dorayaki.scale.x < 0.1) {
                scene.remove(dorayaki);
                dorayakis.splice(i, 1);
            }
        } else {
            // 通常の落下
            dorayaki.position.add(dorayaki.userData.velocity);
            dorayaki.rotation.z += dorayaki.userData.rotationSpeed;

            // 画面下部に到達したら吸い込みモードへ
            if (dorayaki.position.y < -35) {
                dorayaki.userData.isSucking = true;
            }
        }
    }

    renderer.render(scene, camera);
}

// === どら焼きを定期的に生成 ===
setInterval(createDorayaki, 300);

// === ウィンドウリサイズ対応 ===
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// アニメーション開始
animate();