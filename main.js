import * as THREE from 'three';
// Import OrbitControls for camera interaction
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// Import RGBELoader for environment maps (optional but recommended)
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
// Import Post-processing modules for Bloom effect
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// --- DOM Element Checks ---
const canvas = document.getElementById('three-canvas');
const container = document.getElementById('three-container');

if (!canvas) {
    console.error("Fatal Error: Canvas element with ID 'three-canvas' not found!");
    throw new Error("Canvas not found. Stopping execution.");
}
if (!container) {
    console.error("Fatal Error: Container element with ID 'three-container' not found!");
    throw new Error("Container not found. Stopping execution.");
}

// --- Scene Setup ---
const scene = new THREE.Scene();

// --- Camera Setup ---
const camera = new THREE.PerspectiveCamera(
    75, // Field of view
    container.clientWidth / container.clientHeight, // Initial aspect ratio from container
    0.1, // Near clipping plane
    1000 // Far clipping plane
);
camera.position.z = 7; // Move camera back a bit further to see fire

// --- Renderer Setup ---
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true, // Smoother edges
    alpha: true // Allow transparency
});
renderer.setSize(container.clientWidth, container.clientHeight); // Initial size
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Optimize for high DPI screens
renderer.outputColorSpace = THREE.SRGBColorSpace; // Correct color space for PBR/Bloom

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // Slightly lower intensity due to fire/bloom
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Slightly lower intensity
directionalLight.position.set(5, 8, 6);
scene.add(directionalLight);

// --- Texture Loader ---
const textureLoader = new THREE.TextureLoader();
let hieroglyphTexture = null; // For cube (optional)
let particleTexture = null;   // For fire particles (important!)

// --- Load Cube Texture (Optional) ---
/*
try {
    hieroglyphTexture = textureLoader.load(
        'assets/hieroglyphs.png', // <-- UPDATE PATH HERE
        (texture) => { texture.colorSpace = THREE.SRGBColorSpace; console.log("Hieroglyph texture loaded."); },
        undefined,
        (error) => { console.error('An error happened loading the hieroglyph texture:', error); }
    );
} catch (error) { console.error("Error initiating hieroglyph texture load:", error); }
*/

// --- Load Particle Texture (Recommended) ---
try {
    // IMPORTANT: Create or download a soft, circular particle texture (e.g., white blur on transparent background)
    // Save it as 'particle.png' in your assets folder or update the path.
    particleTexture = textureLoader.load(
        'assets/particle.png', // <-- UPDATE PATH HERE or create this file
        (texture) => { console.log("Particle texture loaded."); },
        undefined,
        (error) => { console.error('An error happened loading the particle texture:', error); }
    );
} catch (error) { console.error("Error initiating particle texture load:", error); }


// --- Cube Object ---
const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5); // Base dimensions
const material = new THREE.MeshStandardMaterial({
    map: hieroglyphTexture,
    metalness: 0.4,
    roughness: 0.6,
    emissive: new THREE.Color(0x00ff00), // Still allow cube to have its own emissive color
    emissiveIntensity: 1.0 // Maybe lower intensity if fire is bright
});
const cube = new THREE.Mesh(geometry, material);
cube.scale.set(2, 2, 2); // Scale the cube up
scene.add(cube);

// --- Environment Map (Optional) ---
/*
const rgbeLoader = new RGBELoader();
try {
    rgbeLoader.load(
        'assets/environment.hdr', // <-- UPDATE PATH HERE
        (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = texture;
            console.log("Environment map loaded.");
        },
        undefined,
        (error) => { console.error('An error happened loading the HDR environment map:', error); }
    );
} catch (error) { console.error("Error initiating HDR load:", error); }
*/

// --- Fire Particle System Setup ---
const particleCount = 4000; // Adjust count for performance/density
const particlesGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

const fireColors = [
    new THREE.Color(0x8A2BE2), // Purple
    new THREE.Color(0x483D8B), // DarkSlateBlue
    new THREE.Color(0xFF0000), // Red
    new THREE.Color(0x4B0082), // Indigo
    new THREE.Color(0x6A0DAD)  // Darker Purple
];

// Calculate emission area based on scaled cube
const cubeSize = cube.geometry.parameters;
const scale = cube.scale;
const baseRadius = Math.max(cubeSize.width * scale.x, cubeSize.depth * scale.z) * 0.6; // Radius around scaled cube
const baseHeight = -(cubeSize.height * scale.y / 2) * 0.9; // Start near bottom of scaled cube
const topHeight = (cubeSize.height * scale.y / 2) * 0.9; // Allow some flames near top

// Store velocities, lifespans, and ages outside geometry
const particleVelocities = [];
const particleLifespans = [];
let particleAges = new Float32Array(particleCount).fill(0);

for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;

    // Initial position (randomly around the base/sides)
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * baseRadius;
    const height = baseHeight + Math.random() * (topHeight - baseHeight); // Start along height
    positions[i3 + 0] = Math.cos(angle) * radius; // x
    positions[i3 + 1] = height;                   // y
    positions[i3 + 2] = Math.sin(angle) * radius; // z

    // Assign a random color from our fire palette
    const color = fireColors[Math.floor(Math.random() * fireColors.length)];
    colors[i3 + 0] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;

    // Initialize velocity and lifespan
    particleVelocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.01, // Slight horizontal drift
        Math.random() * 0.04 + 0.03,   // Upward velocity (adjust speed)
        (Math.random() - 0.5) * 0.01  // Slight horizontal drift
    ));
    particleLifespans.push(Math.random() * 1.5 + 0.5); // Lifespan in seconds (adjust duration)
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

// --- Particle Material ---
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.12,          // Adjust particle size
    map: particleTexture, // Use the loaded texture (essential for good look)
    vertexColors: true,  // Use the colors assigned per particle
    blending: THREE.AdditiveBlending, // Makes colors add up (good for fire)
    transparent: true,
    depthWrite: false,   // Prevent particles blocking each other weirdly
    sizeAttenuation: true // Particles get smaller further away
});

const fireParticles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(fireParticles);


// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 3;
controls.maxDistance = 25; // Increased max distance
// controls.autoRotate = true;
// controls.autoRotateSpeed = 0.5;

// --- Post Processing (Bloom Effect - might enhance fire) ---
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    0.8, // Lower strength maybe, as fire is already bright
    0.5, // Radius
    0.7  // Threshold - adjust based on fire brightness
);
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass); // Add bloom AFTER fire particles are added

// Ensure correct color space for composer targets
composer.renderTarget1.texture.colorSpace = THREE.SRGBColorSpace;
composer.renderTarget2.texture.colorSpace = THREE.SRGBColorSpace;
bloomPass.renderToScreen = true;

// --- Handle Window Resizing ---
function onWindowResize() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    composer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
window.addEventListener('resize', onWindowResize);

// --- Animation Loop ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();
    const deltaTime = clock.getDelta(); // Time since last frame

    // --- Animate Cube Emissive Color (Optional) ---
    const hue = (elapsedTime * 0.25) % 1;
    material.emissive.setHSL(hue, 1.0, 0.5);

    // --- Animate Fire Particles ---
    const positionsAttribute = fireParticles.geometry.getAttribute('position');
    const colorsAttribute = fireParticles.geometry.getAttribute('color'); // Needed if changing color on reset

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        // Update age
        particleAges[i] += deltaTime;

        // Check lifespan & Reset if needed
        if (particleAges[i] > particleLifespans[i]) {
            // Reset position
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * baseRadius;
            const height = baseHeight + Math.random() * (topHeight - baseHeight) * 0.2; // Reset lower down mostly
            positionsAttribute.array[i3 + 0] = Math.cos(angle) * radius;
            positionsAttribute.array[i3 + 1] = height;
            positionsAttribute.array[i3 + 2] = Math.sin(angle) * radius;

            // Reset age
            particleAges[i] = Math.random() * 0.1; // Start with slightly varied age

            // Reset velocity
            particleVelocities[i].y = Math.random() * 0.04 + 0.03;
            particleVelocities[i].x = (Math.random() - 0.5) * 0.01;
            particleVelocities[i].z = (Math.random() - 0.5) * 0.01;

            // Optional: Assign a new random color on reset
            const color = fireColors[Math.floor(Math.random() * fireColors.length)];
            colorsAttribute.array[i3 + 0] = color.r;
            colorsAttribute.array[i3 + 1] = color.g;
            colorsAttribute.array[i3 + 2] = color.b;

        } else {
            // Update position based on velocity (frame-rate independent)
            positionsAttribute.array[i3 + 0] += particleVelocities[i].x * deltaTime * 60;
            positionsAttribute.array[i3 + 1] += particleVelocities[i].y * deltaTime * 60;
            positionsAttribute.array[i3 + 2] += particleVelocities[i].z * deltaTime * 60;

            // Add slight downward pull (gravity-like) - optional
            // particleVelocities[i].y -= 0.0005 * deltaTime * 60;

            // Add slight inward pull towards center y-axis - optional
            // let radialFactor = 0.001;
            // positionsAttribute.array[i3 + 0] *= (1.0 - radialFactor * deltaTime * 60);
            // positionsAttribute.array[i3 + 2] *= (1.0 - radialFactor * deltaTime * 60);
        }
    }
    positionsAttribute.needsUpdate = true; // VERY IMPORTANT
    colorsAttribute.needsUpdate = true; // IMPORTANT if changing colors

    // --- Optional: Cube Rotation ---
     cube.rotation.x += 0.004; // Maybe stop rotation if fire is main focus
     cube.rotation.y += 0.006;

    // Update controls
    controls.update();

    // Render using the composer
    composer.render();
}

// --- Initial Setup Calls ---
onWindowResize(); // Set initial size correctly
animate(); // Start the animation loop

console.log("Three.js scene initialized with fire particle effect.");

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', (event) => {

    const navbar = document.getElementById('navbar');
    if (!navbar) {
        console.error("Navbar element not found!");
        return; // Exit if navbar doesn't exist
    }

    let lastScrollTop = 0;
    const delta = 5; // Minimum scroll distance to trigger hide/show
    const navbarHeight = navbar.offsetHeight; // Get the actual height of the navbar

    window.addEventListener('scroll', function() {
        let currentScroll = window.scrollY || document.documentElement.scrollTop;

        // Make sure user scrolled more than delta
        if (Math.abs(lastScrollTop - currentScroll) <= delta) {
            return;
        }

        // If scrolled down and past the navbar height, add the hidden class.
        if (currentScroll > lastScrollTop && currentScroll > navbarHeight) {
            // Scroll Down
            navbar.classList.add('navbar-hidden');
        } else {
            // Scroll Up or at the top
            // If user scrolls up, remove the hidden class.
            if (currentScroll + window.innerHeight < document.documentElement.scrollHeight) {
                 navbar.classList.remove('navbar-hidden');
            }
        }

        // Update last scroll position
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll; // For Mobile or negative scrolling
    }, false);
});
