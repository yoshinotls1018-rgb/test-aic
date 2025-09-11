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
const dorayakiTexture = textureLoader.load('shiro.png');
const dorayakiMaterial = new THREE.MeshBasicMaterial({
    map: dorayakiTexture,
    transparent: true // 画像の透明部分を有効にする
});
const dorayakiGeometry = new THREE.PlaneGeometry(1, 1); // 1x1の板ポリゴン

const dorayakis = [];
const beams = [];
const beamMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // 赤いビーム
const beamGeometry = new THREE.CylinderGeometry(0.5, 0.5, 10, 8); // 細長い円柱

function createBeam(originDorayaki, targetDorayaki) {
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.copy(originDorayaki.position);

    // ターゲット方向へ向ける
    beam.lookAt(targetDorayaki.position);
    beam.rotateX(Math.PI / 2); // 円柱の向きを調整

    beam.userData.target = targetDorayaki;
    beam.userData.speed = 2; // ビームの速度

    beams.push(beam);
    scene.add(beam);
}

function createDorayaki() {
    const dorayaki = new THREE.Mesh(dorayakiGeometry, dorayakiMaterial);

    // 大きさをランダムに
    const scale = Math.random() * 10 + 5;
    dorayaki.scale.set(scale, scale, scale);

    // 初期位置
    dorayaki.position.x = (Math.random() - 0.5) * 100;
    dorayaki.position.y = (Math.random() - 0.5) * 100; // Yもランダムに
    dorayaki.position.z = (Math.random() - 0.5) * 50; // Zもランダムに

    // カスタムプロパティ
    dorayaki.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5, // X方向の速度
        (Math.random() - 0.5) * 0.5, // Y方向の速度
        (Math.random() - 0.5) * 0.5  // Z方向の速度
    );
    // Z軸周りの回転速度
    dorayaki.userData.rotationSpeed = (Math.random() - 0.5) * 0.02;
    dorayaki.userData.isDisappearing = false; // 新しいフラグ：消滅中かどうか

    dorayakis.push(dorayaki);
    scene.add(dorayaki);
}

// === アニメーションループ ===
function animate() {
    requestAnimationFrame(animate);

    // どら焼きの動きを更新
    for (let i = dorayakis.length - 1; i >= 0; i--) {
        const dorayaki = dorayakis[i];

        if (dorayaki.userData.isDisappearing) { // 吸い込みではなく、消滅中
            // 吸い込まれる動きと同様にスケールを小さくして消す
            dorayaki.scale.multiplyScalar(0.95);

            // 小さくなったら消す
            if (dorayaki.scale.x < 0.1) {
                scene.remove(dorayaki);
                dorayakis.splice(i, 1);
            }
        } else {
            // ランダムな方向への移動
            dorayaki.position.add(dorayaki.userData.velocity);
            dorayaki.rotation.z += dorayaki.userData.rotationSpeed;

            // 画面端での跳ね返り
            const halfWidth = (camera.aspect * camera.position.z) / Math.tan(camera.fov * Math.PI / 360);
            const halfHeight = camera.position.z / Math.tan(camera.fov * Math.PI / 360);

            if (dorayaki.position.x > halfWidth || dorayaki.position.x < -halfWidth) {
                dorayaki.userData.velocity.x *= -1;
            }
            if (dorayaki.position.y > halfHeight || dorayaki.position.y < -halfHeight) {
                dorayaki.userData.velocity.y *= -1;
            }
            // Z軸方向の跳ね返りも追加
            if (dorayaki.position.z > camera.position.z + 10 || dorayaki.position.z < camera.position.z - 40) {
                dorayaki.userData.velocity.z *= -1;
            }
        }
    }

    // ビームの更新
    for (let i = beams.length - 1; i >= 0; i--) {
        const beam = beams[i];
        const target = beam.userData.target;

        // ビームを移動
        const direction = new THREE.Vector3().subVectors(target.position, beam.position).normalize();
        beam.position.add(direction.multiplyScalar(beam.userData.speed));

        // ビームとどら焼きの衝突判定 (簡易的)
        if (beam.position.distanceTo(target.position) < target.scale.x * 0.5) { // どら焼きの半径内に入ったら衝突
            if (!target.userData.isDisappearing) {
                target.userData.isDisappearing = true; // どら焼きを消滅させる
            }
            scene.remove(beam);
            beams.splice(i, 1);
            continue; // 次のビームへ
        }

        // ビームが画面外に出たら消す (簡易的な判定)
        if (beam.position.y > 100 || beam.position.y < -100 || beam.position.x > 100 || beam.position.x < -100) {
            scene.remove(beam);
            beams.splice(i, 1);
        }
    }

    // ランダムなタイミングでビームを生成
    if (Math.random() < 0.01 && dorayakis.length >= 2) { // どら焼きが2つ以上いる場合のみ
        const originIndex = Math.floor(Math.random() * dorayakis.length);
        let targetIndex = Math.floor(Math.random() * dorayakis.length);
        // 発射元とターゲットが同じにならないように
        while (originIndex === targetIndex) {
            targetIndex = Math.floor(Math.random() * dorayakis.length);
        }
        createBeam(dorayakis[originIndex], dorayakis[targetIndex]);
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

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    // マウス座標を正規化 (Three.jsの-1から1の範囲に変換)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // レイを生成
    raycaster.setFromCamera(mouse, camera);

    // レイと交差するオブジェクトを検出
    const intersects = raycaster.intersectObjects(scene.children);

    for (let i = 0; i < intersects.length; i++) {
        // 交差したオブジェクトがどら焼きであれば消滅フラグを立てる
        if (dorayakis.includes(intersects[i].object) && !intersects[i].object.userData.isDisappearing) {
            intersects[i].object.userData.isDisappearing = true;
            break; // 最初のどら焼きだけを消す
        }
    }
}

window.addEventListener('click', onMouseClick, false);

// アニメーション開始
animate();