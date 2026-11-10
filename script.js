/**
 * Nosso Universo 3D - Davi & Stella
 * Fiel à estética original + Efeito Neon + Cartinhas + Spotify + Sem Emojis na Órbita
 */

const PLANETAS = [
  { id: 'date', name: "Planeta do Date", icon: "🎬", color: "#ff4d8d", radius: 55, size: 10, speed: 0.002, height: 4, desc: "Aperte o botão para o universo decidir nosso próximo encontro." },
  { id: 'cozinha', name: "Planeta da Cozinha", icon: "🍝", color: "#ff75c3", radius: 80, size: 9, speed: -0.0015, height: -3, desc: "Nosso cardápio estelar." },
  { id: 'girassol', name: "Planeta Girassol", icon: "🌻", color: "#ffd700", radius: 105, size: 12, speed: 0.0012, height: 5, desc: "Cuidem da plantinha! Reguem para ganhar XP e subir de nível." },
  { id: 'musica', name: "Planeta da Música", icon: "🎵", color: "#a855f7", radius: 130, size: 10, speed: -0.001, height: -4, desc: "A trilha sonora da nossa galáxia." },
  { id: 'memorias', name: "Planeta das Memórias", icon: "📸", color: "#ffb6c1", radius: 155, size: 13, speed: 0.0008, height: 6, desc: "Nossa galeria de momentos inesquecíveis." },
  { id: 'cartinhas', name: "Planeta das Cartinhas", icon: "💌", color: "#ff8ba7", radius: 180, size: 9, speed: -0.0009, height: -2, desc: "Recados e bilhetes deixados no espaço." },
  { id: 'surpresa', name: "Planeta Surpresa", icon: "🎲", color: "#ff2a7a", radius: 210, size: 11, speed: 0.0007, height: 3, desc: "Desafios e jogos rápidos só para nós os dois." }
];

// FRASES SEM EMOJIS CONFORME PEDIDO
const FRASES_ORBITAIS = [
  "O NOSSO UNIVERSO", 
  "A MINHA VIDA INTEIRA", 
  "AMO-TE INFINITAMENTE", 
  "PARA SEMPRE NOS", 
  "A MINHA PESSOA FAVORITA", 
  "A MELHOR NAMORADA", 
  "E PURA MAGIA", 
  "DAVI & STELLA", 
  "O MEU PORTO SEGURO", 
  "CADA SEGUNDO AO TEU LADO"
];

let scene, camera, renderer, controls, composer;
let container = document.getElementById('canvas-container');
let blackHoleGroup, milkyWay, warpGroup;
let orbitItems = []; 
let raycaster, mouse;
let isWarping = false;
let galaxyVisible = false;
let hoveredPlanet = null;
const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 700;
const mobileMenu = document.getElementById('mobile-planets');
let touchStart = null;
const MOBILE_PLANET_SCALE = 1.8;
function viewportSize() { return { width: window.innerWidth, height: window.innerHeight }; }
function isModalOpen() { return document.getElementById('planet-modal').classList.contains('open'); }


const tooltip = document.getElementById('planet-tooltip');

function createParticleTexture(type = 'glow') {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const center = 32;

  if (type === 'glow') {
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,200,255,0.8)');
    gradient.addColorStop(0.5, 'rgba(255,100,200,0.2)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(canvas);
}
// Criar textura somente depois de iniciar o aplicativo; evita erro silencioso se WebGL não estiver disponível.
let texGlow;


function init() {
  texGlow = createParticleTexture('glow');
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020005, 0.001); 

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 4000);
  camera.position.set(0, 0, 20);

  renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: isMobile ? "default" : "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0; 
  container.appendChild(renderer.domElement);

  const renderScene = new THREE.RenderPass(scene, camera);
  const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
  bloomPass.threshold = 0.15; 
  bloomPass.strength = 1.2;  
  bloomPass.radius = 0.6;    

  // Bloom em resolução cheia sobrecarrega diversas GPUs móveis.
  // Renderização direta em celulares preserva a galáxia e diminui travamentos.
  if (!isMobile) {
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
  }

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.05;
  controls.rotateSpeed = 0.5; controls.zoomSpeed = 0.8;
  controls.minDistance = 30; controls.maxDistance = 400;
  controls.maxPolarAngle = Math.PI / 1.5; 
  controls.autoRotate = !isMobile; controls.autoRotateSpeed = 0.2; 
  controls.enabled = false; 

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  buildWarpTunnel();
  buildDeepSpace();
  buildMilkyWay();
  buildCentralPlanet();
  buildOrbitingPlanets();
  buildOrbitingTexts();
  
  setGalaxyVisibility(false);

  window.addEventListener('resize', onWindowResize);
  if (!isMobile) window.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerdown', onCanvasPointerDown, { passive: true });
  renderer.domElement.addEventListener('pointerup', onCanvasPointerUp, { passive: true });
  if (!isMobile) renderer.domElement.addEventListener('click', onClick);
  if (isMobile) setupMobileMenu();
  setupUIEvents();

  animate(0);
}

function setGalaxyVisibility(visible) {
  galaxyVisible = visible;
  if (blackHoleGroup) blackHoleGroup.visible = visible;
  orbitItems.forEach(item => item.visible = visible);
  if(visible) {
    document.getElementById('universe-hint').classList.remove('hidden');
    if (mobileMenu && isMobile) mobileMenu.classList.remove('hidden');
  }
}

function buildWarpTunnel() {
  warpGroup = new THREE.Group();
  const count = isMobile ? 950 : 3500;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const z = -Math.random() * 2000;
    const radius = 10 + Math.random() * 80;
    const angle = Math.random() * Math.PI * 2;

    positions[i3] = Math.cos(angle) * radius;
    positions[i3 + 1] = Math.sin(angle) * radius;
    positions[i3 + 2] = z;

    const isWhite = Math.random() > 0.5;
    colors[i3] = isWhite ? 1 : 1;
    colors[i3+1] = isWhite ? 1 : 0.16; 
    colors[i3+2] = isWhite ? 1 : 0.47;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 4.5, map: texGlow, vertexColors: true, transparent: true,
    opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false
  });

  warpGroup.add(new THREE.Points(geometry, material));
  scene.add(warpGroup);
}

function buildDeepSpace() {
  const starsCount = isMobile ? 1600 : 8000; 
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(starsCount * 3);

  for (let i = 0; i < starsCount; i++) {
    const i3 = i * 3;
    const radius = 300 + Math.random() * 1000; 
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0.5 });
  scene.add(new THREE.Points(geometry, material));
}

function buildMilkyWay() {
  blackHoleGroup = new THREE.Group();
  
  const particleCount = isMobile ? 14000 : 60000;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const innerRadius = 18;
  const outerRadius = 240;

  const colorMid = new THREE.Color(0xff1493); 
  const colorOuter = new THREE.Color(0x2d0a4e); 

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const progress = Math.pow(Math.random(), 1.6);
    const r = innerRadius + progress * (outerRadius - innerRadius);

    const arms = 4;
    const armOffset = ((i % arms) * (2 * Math.PI)) / arms;
    let angleSpread = (Math.random() > 0.4) ? (Math.random() - 0.5) * 0.5 : (Math.random() - 0.5) * Math.PI;

    const spiralAngle = r * 0.18 + armOffset + angleSpread;
    const x = Math.cos(spiralAngle) * r;
    const z = Math.sin(spiralAngle) * r;
    const y = (Math.random() - 0.5) * (4.0 + (r / outerRadius) * 6.0);

    positions[i3] = x; positions[i3 + 1] = y; positions[i3 + 2] = z;

    const t = (r - innerRadius) / (outerRadius - innerRadius);
    let c = new THREE.Color();
    
    if (Math.random() > 0.98) {
        c.setHex(0xffffff); 
    } else {
        c.copy(colorMid).lerp(colorOuter, t);
    }
    colors[i3] = c.r; colors[i3 + 1] = c.g; colors[i3 + 2] = c.b;
  }

  const galGeo = new THREE.BufferGeometry();
  galGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  galGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const galMat = new THREE.PointsMaterial({
    size: 2.8, map: texGlow, vertexColors: true, transparent: true,
    opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false
  });

  milkyWay = new THREE.Points(galGeo, galMat);
  blackHoleGroup.add(milkyWay);
  scene.add(blackHoleGroup);
}

function buildCentralPlanet() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.beginPath();
  ctx.arc(256, 256, 200, 0, Math.PI * 2);
  ctx.fillStyle = '#1a0530';
  ctx.fill();

  ctx.lineWidth = 15;
  ctx.strokeStyle = '#ff75c3';
  ctx.shadowColor = '#ff2a7a';
  ctx.shadowBlur = 40;
  ctx.stroke();

  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffffff';
  ctx.shadowBlur = 10;
  ctx.stroke();

  ctx.shadowBlur = 15;
  ctx.font = '100px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('💖', 230, 270);
  ctx.font = '60px sans-serif';
  ctx.fillText('💖', 310, 210);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;

  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const centralSprite = new THREE.Sprite(spriteMat);
  centralSprite.scale.set(35, 35, 1);
  
  centralSprite.userData = {
      type: 'planet', id: 'centro', name: "Planeta Davi & Stella", icon: "🌌", desc: "O centro do nosso sistema estelar."
  };

  blackHoleGroup.add(centralSprite); 
  orbitItems.push(centralSprite);
}

function createPlanetCanvas(planetData) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.shadowColor = planetData.color;
  ctx.shadowBlur = 30;

  ctx.beginPath();
  ctx.arc(128, 128, 100, 0, Math.PI * 2);
  ctx.fillStyle = '#100520'; 
  ctx.fill();

  ctx.lineWidth = 8;
  ctx.strokeStyle = planetData.color;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.font = '80px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(planetData.icon, 128, 138);

  return new THREE.CanvasTexture(canvas);
}

function buildOrbitingPlanets() {
  PLANETAS.forEach((p, index) => {
    const texture = createPlanetCanvas(p);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.95 });
    const sprite = new THREE.Sprite(spriteMat);
    
    sprite.scale.set(p.size * (isMobile ? MOBILE_PLANET_SCALE : 1), p.size * (isMobile ? MOBILE_PLANET_SCALE : 1), 1); 
    const angle = (index * (Math.PI * 2)) / PLANETAS.length;

    sprite.userData = {
      type: 'planet', id: p.id, name: p.name, icon: p.icon, desc: p.desc, color: p.color,
      orbitRadius: p.radius, orbitSpeed: p.speed, orbitAngle: angle, orbitHeight: p.height, baseScale: p.size * (isMobile ? MOBILE_PLANET_SCALE : 1)
    };

    scene.add(sprite);
    orbitItems.push(sprite);
  });
}

function createTextSprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.font = 'bold 36px "Outfit", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff'; ctx.letterSpacing = "2px";
  ctx.shadowColor = '#ff2a7a'; ctx.shadowBlur = 8;
  ctx.fillText(text, 512, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.8, depthWrite: false });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(30, 3.75, 1);
  return sprite;
}

function buildOrbitingTexts() {
  const total = FRASES_ORBITAIS.length;
  for (let i = 0; i < total; i++) {
    const text = FRASES_ORBITAIS[i];
    const sprite = createTextSprite(text);

    const radius = 55 + (i * 15);
    const angle = (i * (Math.PI * 2)) / total;
    // Reduzi a velocidade um pouquinho para dar tempo de ler as frases bonitas
    const speed = 0.0005 * (i % 2 === 0 ? 1 : -1) + (Math.random() * 0.0003);
    const height = (Math.random() - 0.5) * 10;

    sprite.userData = { type: 'phrase', orbitRadius: radius, orbitSpeed: speed, orbitAngle: angle, orbitHeight: height };
    scene.add(sprite);
    orbitItems.push(sprite);
  }
}

function animate(time) {
  requestAnimationFrame(animate);
  TWEEN.update();

  const seconds = time * 0.001;

  if (blackHoleGroup && galaxyVisible) {
    blackHoleGroup.rotation.y -= 0.0008; 
  }

  if (galaxyVisible) {
      orbitItems.forEach(item => {
        if (item.userData.orbitRadius) {
          item.userData.orbitAngle += item.userData.orbitSpeed;
          const angle = item.userData.orbitAngle;
          const r = item.userData.orbitRadius;

          const x = Math.cos(angle) * r;
          const z = Math.sin(angle) * r;
          const y = item.userData.orbitHeight + Math.sin(seconds + r) * 1.5;

          item.position.set(x, y, z);
        }
      });
  }

  if (isWarping && warpGroup) {
    const pointsMesh = warpGroup.children[0];
    const positions = pointsMesh.geometry.attributes.position.array;
    for (let i = 0; i < positions.length / 3; i++) {
      const i3 = i * 3 + 2;
      positions[i3] += 18; 
      if (positions[i3] > 50) positions[i3] = -2000; 
    }
    pointsMesh.geometry.attributes.position.needsUpdate = true;
    warpGroup.rotation.z -= 0.005; 
  }

  controls.update();
  
  if (composer) {
      composer.render();
  } else {
      renderer.render(scene, camera);
  }
}

function onPointerMove(event) {
  if(!galaxyVisible) return;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const clickables = orbitItems.filter(i => i.userData.type === 'planet');
  const intersects = raycaster.intersectObjects(clickables);

  if (intersects.length > 0) {
    document.body.style.cursor = 'pointer';
    const target = intersects[0].object;
    
    if (target.userData.id !== 'centro') {
        const bs = target.userData.baseScale;
        target.scale.set(bs * 1.3, bs * 1.3, 1);
    }

    if (hoveredPlanet !== target) {
        hoveredPlanet = target;
        tooltip.innerText = target.userData.name;
        tooltip.style.borderColor = target.userData.color || '#ff75c3';
        tooltip.classList.remove('hidden');
    }
    tooltip.style.left = (event.clientX) + 'px';
    tooltip.style.top = (event.clientY - 20) + 'px';

  } else {
    document.body.style.cursor = 'default';
    tooltip.classList.add('hidden');
    hoveredPlanet = null;
    clickables.forEach(c => {
        if(c.userData.id !== 'centro') {
            const bs = c.userData.baseScale;
            c.scale.set(bs, bs, 1);
        }
    });
  }
}

function onClick(event) {
  if(!galaxyVisible || isModalOpen()) return;
  if (event.target.closest('#planet-modal') || event.target.closest('#start-card')) return;

  pickPlanetAt(event.clientX, event.clientY);
}
function pickPlanetAt(x, y) {
  const bounds = renderer.domElement.getBoundingClientRect();
  mouse.x = ((x - bounds.left) / bounds.width) * 2 - 1;
  mouse.y = -((y - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(orbitItems.filter(i => i.userData.type === 'planet'));
  if (intersects.length) { zoomAndOpenPlanet(intersects[0].object); return; }
  if (isMobile) {
    const tap = new THREE.Vector2(x - bounds.left, y - bounds.top);
    let nearest = null;
    let nearestDist = 34;
    orbitItems.filter(i => i.userData.type === 'planet').forEach(item => {
      const projected = item.getWorldPosition(new THREE.Vector3()).project(camera);
      if (projected.z < -1 || projected.z > 1) return;
      const projectedPoint = new THREE.Vector2((projected.x + 1) * bounds.width / 2, (1 - projected.y) * bounds.height / 2);
      const dist = tap.distanceTo(projectedPoint);
      if (dist < nearestDist) { nearestDist = dist; nearest = item; }
    });
    if (nearest) zoomAndOpenPlanet(nearest);
  }
}
function onCanvasPointerDown(event) {
  touchStart = { x: event.clientX, y: event.clientY, time: performance.now() };
}
function onCanvasPointerUp(event) {
  if (!isMobile || !touchStart || !galaxyVisible || isModalOpen()) return;
  const movement = Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y);
  const elapsed = performance.now() - touchStart.time;
  touchStart = null;
  // Ignorar arrastos/pinch do OrbitControls: apenas toques curtos abrem um planeta.
  if (movement < 18 && elapsed < 800) pickPlanetAt(event.clientX, event.clientY);
}
function setupMobileMenu() {
  const menu = document.getElementById('mobile-planet-menu');
  const toggle = document.getElementById('mobile-menu-toggle');
  const choices = [{ id: 'centro', name: 'Planeta Davi & Stella', icon: '💖' }, ...PLANETAS];
  choices.forEach(planet => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mobile-planet-option';
    button.textContent = planet.icon + ' ' + planet.name;
    button.addEventListener('click', () => {
      menu.classList.add('hidden');
      toggle.setAttribute('aria-expanded', 'false');
      const target = orbitItems.find(item => item.userData.id === planet.id);
      if (target) {
        if (isMobile) {
          controls.autoRotate = false;
          openModalForPlanet(target.userData);
        } else zoomAndOpenPlanet(target);
      }
    });
    menu.appendChild(button);
  });
  toggle.addEventListener('click', () => {
    const show = menu.classList.toggle('hidden') === false;
    toggle.setAttribute('aria-expanded', String(show));
  });
}

function zoomAndOpenPlanet(planet) {
  if (isModalOpen()) return;
  if (isMobile) {
    controls.autoRotate = false;
    openModalForPlanet(planet.userData);
    return;
  }
  controls.autoRotate = false;
  if (mobileMenu) mobileMenu.classList.add('hidden');
  tooltip.classList.add('hidden');
  
  const targetPos = new THREE.Vector3();
  planet.getWorldPosition(targetPos);
  
  const offset = new THREE.Vector3(0, 10, 40); 
  const camPos = targetPos.clone().add(offset);

  new TWEEN.Tween(camera.position)
    .to({ x: camPos.x, y: camPos.y, z: camPos.z }, 1500)
    .easing(TWEEN.Easing.Cubic.Out)
    .start();

  new TWEEN.Tween(controls.target)
    .to({ x: targetPos.x, y: targetPos.y, z: targetPos.z }, 1500)
    .easing(TWEEN.Easing.Cubic.Out)
    .onComplete(() => {
        openModalForPlanet(planet.userData);
    })
    .start();
}

// -----------------------------------------------------
// LÓGICA ATUALIZADA (FOTOS, MÚSICAS, DESAFIOS E CARTINHAS)
// -----------------------------------------------------
const appLogic = {
    dates: ["Noite de Pizza e Filme em casa 🍕", "Caminhada num parque novo 🌳", "Ir tomar um açaí/sorvete 🍦", "Noite de Fondue ou Tábua de Frios 🧀", "Jogar vídeo-game/tabuleiro juntos 🎮", "Cozinhar uma receita que nunca fizemos 🍳"],
    sortearDate: function() {
        const res = document.getElementById('res');
        res.classList.add('spin');
        res.innerText = "Sorteando o destino...";
        setTimeout(() => {
            const random = this.dates[Math.floor(Math.random() * this.dates.length)];
            res.classList.remove('spin');
            res.innerHTML = `🌟 Sorteado:<br><strong>${random}</strong>`;
        }, 1000);
    },
    receitas: ["Macarrão à Carbonara", "Hambúrguer Caseiro", "Risoto de Queijo", "Lasanha de Frigideira", "Torta de Liquidificador"],
    sortearCozinha: function() {
        const res = document.getElementById('res');
        res.classList.add('spin');
        res.innerText = "Pensando no cardápio...";
        setTimeout(() => {
            const random = this.receitas[Math.floor(Math.random() * this.receitas.length)];
            res.classList.remove('spin');
            res.innerHTML = `👨‍🍳 Receita do Dia:<br><strong>${random}</strong>`;
        }, 1000);
    },
    desafios: [
      "Façam uma massagem de 5 minutos um ao outro 💆‍♂️",
      "Quem rir primeiro paga a sobremesa do próximo date 🍨",
      "Digam 3 coisas que mais amam na outra pessoa ❤️",
      "Batalha de cócegas durante 1 minuto! 😂",
      "Recriem a primeira foto que tiraram juntos 📸",
      "Quem perder no Pedra, Papel, Tesoura faz o jantar 🍽️"
    ],
    sortearDesafio: function() {
        const res = document.getElementById('res-desafio');
        res.classList.add('spin');
        res.innerText = "Sorteando...";
        setTimeout(() => {
            const random = this.desafios[Math.floor(Math.random() * this.desafios.length)];
            res.classList.remove('spin');
            res.innerHTML = `🔥 Desafio:<br><strong>${random}</strong>`;
        }, 1000);
    },
    cartinhas: [
      { 
        titulo: "Abre quando estiveres triste", 
        texto: "Lembra-te sempre de que eu estou aqui para ti. O teu sorriso é a estrela mais brilhante do nosso universo. Amo-te infinitamente!" 
      },
      { 
        titulo: "Abre quando tiveres saudades", 
        texto: "Também estou com imensas saudades tuas! Fecha os olhos e imagina que te estou a dar um abraço bem apertado agora mesmo." 
      },
      { 
        titulo: "Abre no nosso aniversário", 
        texto: "Feliz data para nós! Cada dia ao teu lado é uma aventura nova. Que este seja apenas o começo da nossa galáxia." 
      },
      { 
        titulo: "O que eu mais amo em ti", 
        texto: "Amo a forma como me fazes sentir único, amo a tua voz e a maneira como construímos este nosso universo juntos." 
      }
    ],
    regarGirassol: function() {
        let xp = parseInt(localStorage.getItem('girassolXP') || '0');
        let nivel = parseInt(localStorage.getItem('girassolNivel') || '1');
        
        xp += 20;
        if(xp >= 100) {
            xp = 0;
            nivel += 1;
            document.getElementById('nivel-text').classList.add('level-up');
            setTimeout(() => document.getElementById('nivel-text').classList.remove('level-up'), 1000);
        }
        
        localStorage.setItem('girassolXP', xp);
        localStorage.setItem('girassolNivel', nivel);
        
        document.getElementById('nivel-text').innerText = `Nvl ${nivel}`;
        document.getElementById('xp-bar').style.width = `${xp}%`;
        document.getElementById('regar-btn').innerText = "Regado! 💧";
        document.getElementById('regar-btn').style.background = "#ffd700";
        document.getElementById('regar-btn').style.color = "#000";
    },
    calcularDias: function() {
        const dataInicio = new Date('2025-07-27T00:00:00'); 
        const hoje = new Date();
        const diffTempo = Math.abs(hoje - dataInicio);
        const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24)); 
        return diffDias;
    }
};

window.appLogic = appLogic; 

function openModalForPlanet(data) {
  const modal = document.getElementById('planet-modal');
  document.getElementById('modal-icon').innerText = data.icon;
  document.getElementById('modal-title').innerText = data.name;
  
  const body = document.getElementById('modal-body');
  let content = `<p class="app-desc">${data.desc}</p>`;

  if (data.id === 'date') {
      content += `<button class="app-btn" onclick="appLogic.sortearDate()">Sortear Date 🎲</button>
                  <div id="res" class="app-result">Toque no botão acima</div>`;
  } else if (data.id === 'cozinha') {
      content += `<button class="app-btn" onclick="appLogic.sortearCozinha()">O que vamos cozinhar?</button>
                  <div id="res" class="app-result">Toque no botão acima</div>`;
  } else if (data.id === 'surpresa') {
      content += `<button class="app-btn" onclick="appLogic.sortearDesafio()">Tirar um Desafio 🃏</button>
                  <div id="res-desafio" class="app-result">Quem tem coragem?</div>`;
  } else if (data.id === 'musica') {
      // Integração Spotify - Álbum Davi & Stella (Corrigido e Formatado)
      content += `
        <iframe 
          style="border-radius:12px; border:none;" 
          src="https://open.spotify.com/embed/album/2W8ooBBs6kNRLf5AUcW7TW?utm_source=generator&theme=0" 
          width="100%" 
          height="352" 
          allowfullscreen="" 
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
          loading="lazy">
        </iframe>
      `;
  } else if (data.id === 'memorias') {
      // Galeria de Fotos (Buscando da pasta assets/)
      content += `
        <div class="gallery-container">
           <img src="assets/foto1.jpg" class="gallery-img" alt="Foto 1">
           <img src="assets/foto2.jpg" class="gallery-img" alt="Foto 2">
           <img src="assets/foto3.jpg" class="gallery-img" alt="Foto 3">
           <img src="assets/foto4.jpg" class="gallery-img" alt="Foto 4">
        </div>
      `;
  } else if (data.id === 'cartinhas') {
      // Sistema de Cartas 
      content += `<div style="max-height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">`;
      
      appLogic.cartinhas.forEach((carta) => {
          content += `<button class="app-btn" style="margin-bottom: 0; padding: 10px; font-size: 0.9rem;" onclick="document.getElementById('leitor-cartas').innerHTML = '<strong style=\'color:#ff75c3; font-size:1.1rem;\'>${carta.titulo}</strong><br><br>${carta.texto}'">${carta.titulo}</button>`;
      });
      
      content += `</div>
                  <div id="leitor-cartas" class="app-result" style="text-align: left; font-weight: normal; font-size: 0.95rem; min-height: 100px; color: #eee; line-height: 1.5;">
                    <em>Escolhe uma carta na lista acima para ler...</em>
                  </div>`;
  } else if (data.id === 'girassol') {
      const nivelAtual = localStorage.getItem('girassolNivel') || '1';
      const xpAtual = localStorage.getItem('girassolXP') || '0';
      content += `<div class="stats-grid">
                    <div class="stat-box"><div class="stat-num" id="nivel-text">Nvl ${nivelAtual}</div><div class="stat-label">Crescimento</div></div>
                    <div class="stat-box"><div class="stat-num">🌻</div><div class="stat-label">Brotinho</div></div>
                  </div>
                  <div class="progress-bar"><div class="progress-fill" id="xp-bar" style="width: ${xpAtual}%;"></div></div>
                  <button id="regar-btn" class="app-btn" style="margin-top:15px;" onclick="appLogic.regarGirassol()">Regar Planta 💧</button>`;
  } else if (data.id === 'centro') {
      const diasJuntos = appLogic.calcularDias();
      content += `<div class="stats-grid">
                    <div class="stat-box"><div class="stat-num">${diasJuntos}</div><div class="stat-label">Dias Juntos</div></div>
                    <div class="stat-box"><div class="stat-num">27/07</div><div class="stat-label">Nossa Data</div></div>
                  </div>`;
  } else {
      content += `<button class="app-btn">Em breve...</button>`;
  }

  body.innerHTML = content;
  if (mobileMenu && isMobile) mobileMenu.classList.add('hidden');
  modal.classList.remove('hidden');
  setTimeout(() => modal.classList.add('open'), 10);
}

function closePlanetModal() {
  const modal = document.getElementById('planet-modal');
  modal.classList.remove('open');
  setTimeout(() => {
    modal.classList.add('hidden');
    if (mobileMenu && isMobile) mobileMenu.classList.remove('hidden');
    new TWEEN.Tween(camera.position)
      .to({ x: 0, y: isMobile ? 105 : 70, z: isMobile ? 360 : 240 }, 2000)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();
      
    new TWEEN.Tween(controls.target)
      .to({ x: 0, y: 0, z: 0 }, 2000)
      .easing(TWEEN.Easing.Cubic.Out)
      .onComplete(() => { controls.autoRotate = !isMobile; })
      .start();
  }, 300);
}

function startMusic() {
  const audio = document.getElementById('bg-music');
  audio.play().catch(() => {});
}

function setupUIEvents() {
  document.getElementById('btn-enter').addEventListener('click', () => {
    startMusic();
    isWarping = true;
    document.getElementById('intro-screen').classList.add('fade-out');
    container.classList.add('active');

    const pointsMesh = warpGroup.children[0];
    new TWEEN.Tween(pointsMesh.material).to({ opacity: 1 }, 200).start();

    setTimeout(() => {
        setGalaxyVisibility(true);
        new TWEEN.Tween(pointsMesh.material).to({ opacity: 0 }, 1500).onComplete(()=> {
            isWarping = false; scene.remove(warpGroup);
        }).start();

        camera.position.set(0, 40, -100); 
        new TWEEN.Tween(camera.position)
          .to({ x: 0, y: isMobile ? 105 : 70, z: isMobile ? 360 : 240 }, 4000)
          .easing(TWEEN.Easing.Cubic.Out)
          .onComplete(() => { controls.enabled = true; })
          .start();
    }, 2800); 
  });

  document.getElementById('modal-close').addEventListener('click', closePlanetModal);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if(composer) composer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    if (typeof THREE === 'undefined' || typeof TWEEN === 'undefined' || !THREE.OrbitControls) throw new Error('Bibliotecas 3D indisponíveis');
    init();
  } catch (error) {
    console.error('Erro ao iniciar o universo:', error);
    const errorBox = document.createElement('p');
    errorBox.className = 'startup-error';
    errorBox.textContent = 'O universo não conseguiu abrir neste navegador. Tente atualizar a página ou abrir no Chrome/Safari atualizado.';
    document.querySelector('#start-card').appendChild(errorBox);
    document.getElementById('btn-enter').disabled = true;
  }
});
