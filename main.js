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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1.2, 200);
pointLight.position.set(0, 50, 50);
scene.add(pointLight);

// === どら焼きの準備 ===
const doughMaterial = new THREE.MeshStandardMaterial({ color: '#A0522D', roughness: 0.8 });
const ankoMaterial = new THREE.MeshStandardMaterial({ color: '#4B0082', roughness: 0.8 }); // Indigo
const doughGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 32);
const ankoGeometry = new THREE.CylinderGeometry(0.9, 0.9, 0.2, 32);

const dorayakis = [];
const MOUTH_POS = new THREE.Vector3(0, -40, 0);

function createDorayaki() {
    const group = new THREE.Group();

    const topDough = new THREE.Mesh(doughGeometry, doughMaterial);
    topDough.position.y = 0.15;

    const anko = new THREE.Mesh(ankoGeometry, ankoMaterial);

    const bottomDough = new THREE.Mesh(doughGeometry, doughMaterial);
    bottomDough.position.y = -0.15;

    group.add(topDough);
    group.add(anko);
    group.add(bottomDough);

    const scale = Math.random() * 2 + 1; // 大きさをランダムに
    const dorayaki = group;

    // 初期位置とスケール
    dorayaki.position.x = (Math.random() - 0.5) * 100;
    dorayaki.position.y = 60 + (Math.random() * 20);
    dorayaki.scale.set(scale, scale, scale);

    // 回転
    dorayaki.rotation.x = Math.random() * Math.PI * 2;
    dorayaki.rotation.y = Math.random() * Math.PI * 2;

    // カスタムプロパティ
    dorayaki.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        -0.1 - Math.random() * 0.1, //落下速度
        0
    );
    dorayaki.userData.rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        0
    );
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
            dorayaki.rotation.x += dorayaki.userData.rotationSpeed.x;
            dorayaki.rotation.y += dorayaki.userData.rotationSpeed.y;

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
