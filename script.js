/**
 * ElectroLab - Simulasi Daya (Watt) 
 * FIX: Touch Drag & Drop Version
 */

// 1. State & Global Variables
let state = { 
  resistor: false, 
  led: false,
  battery: true 
};

let touchType = null;
let touchSourceId = null;
let ghostElement = null;

// Elemen DOM
const draggables = document.querySelectorAll('.draggable');
const dropZones = document.querySelectorAll('.drop-zone');
const btnGenerate = document.getElementById('btn-generate');
const circuitStatus = document.getElementById('circuit-status');
const vInput = document.getElementById('v-input');
const rInput = document.getElementById('r-input');
const pDisplay = document.getElementById('p-display');

// 2. Fungsi Utama Penempatan
function handlePlacement(zone, type, sourceId) {
  if (type === zone.dataset.type && !zone.classList.contains('filled')) {
    const sourceElement = document.getElementById(sourceId);
    const clone = sourceElement.querySelector('svg').cloneNode(true);
    
    zone.innerHTML = "";
    zone.appendChild(clone);
    zone.classList.add('filled');
    
    state[type] = true;
    updateCircuitStatus();
    resetDisplay();
    
    if (window.navigator.vibrate) window.navigator.vibrate(40);
    return true;
  }
  return false;
}

// 3. DESKTOP DRAG & DROP
draggables.forEach(item => {
  item.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('type', item.dataset.type);
    e.dataTransfer.setData('sourceId', item.id);
    item.style.opacity = '0.4';
  });
  item.addEventListener('dragend', () => item.style.opacity = '1');
});

dropZones.forEach(zone => {
  zone.addEventListener('dragover', (e) => e.preventDefault());
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    const sourceId = e.dataTransfer.getData('sourceId');
    handlePlacement(zone, type, sourceId);
  });
});

// 4. MOBILE TOUCH SUPPORT (FIXED)
draggables.forEach(item => {
  item.addEventListener('touchstart', (e) => {
    // Ambil data sebelum buat ghost
    touchType = item.dataset.type;
    touchSourceId = item.id;
    
    const touch = e.touches[0];
    
    // Buat bayangan
    ghostElement = item.querySelector('svg').cloneNode(true);
    ghostElement.style.position = 'fixed';
    ghostElement.style.width = '60px';
    ghostElement.style.height = '60px';
    ghostElement.style.opacity = '0.8';
    ghostElement.style.pointerEvents = 'none'; // PENTING: Supaya tidak menghalangi deteksi drop zone
    ghostElement.style.zIndex = '9999';
    
    // Posisikan sedikit di atas jari supaya terlihat
    ghostElement.style.left = (touch.clientX - 30) + 'px';
    ghostElement.style.top = (touch.clientY - 70) + 'px'; 
    
    document.body.appendChild(ghostElement);
    item.style.opacity = '0.4';
  }, { passive: false });

  item.addEventListener('touchmove', (e) => {
    if (!ghostElement) return;
    const touch = e.touches[0];
    
    // Update posisi bayangan
    ghostElement.style.left = (touch.clientX - 30) + 'px';
    ghostElement.style.top = (touch.clientY - 70) + 'px';
    
    // Mencegah layar bergeser saat tarik komponen
    e.preventDefault();
  }, { passive: false });

  item.addEventListener('touchend', (e) => {
    if (!ghostElement) return;

    const touch = e.changedTouches[0];
    const x = touch.clientX;
    const y = touch.clientY;

    // Cek apakah koordinat lepas jari ada di dalam kotak drop zone
    dropZones.forEach(zone => {
      const rect = zone.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        handlePlacement(zone, touchType, touchSourceId);
      }
    });

    // Hapus bayangan
    ghostElement.remove();
    ghostElement = null;
    item.style.opacity = '1';
  });
});

// 5. LOGIKA SIRKUIT (Status & Hitung)
function updateCircuitStatus() {
  const statusDot = circuitStatus.querySelector('.status-dot');
  const statusText = circuitStatus.querySelector('.status-text');
  const isComplete = state.resistor && state.led;

  statusDot.style.background = isComplete ? '#4CAF50' : '#F44336';
  statusText.textContent = isComplete ? 'Sirkuit Siap!' : 'Sirkuit Tidak Lengkap';
  statusText.style.color = isComplete ? '#2E7D32' : '#D32F2F';
  circuitStatus.style.background = isComplete ? '#E8F5E9' : '#FFEBEE';
}

function calculateAndDisplay() {
  if (!state.resistor || !state.led) return;

  const V = parseFloat(vInput.value);
  const R = parseFloat(rInput.value);
  if (isNaN(V) || V <= 0 || isNaN(R) || R <= 0) return;

  const I = V / R;
  const P = V * I;
  
  if (pDisplay) pDisplay.textContent = P.toFixed(2);
  updateLEDColor(I * 1000);
}

function updateLEDColor(I_mA) {
  const ledBulb = document.querySelector('#slot-led .led-bulb');
  if (!ledBulb) return;

  let color = "#ffffff";
  if (I_mA > 0 && I_mA < 50) color = "#fffc5f";
  else if (I_mA >= 50 && I_mA < 150) color = "#fc9653";
  else if (I_mA >= 150 && I_mA <= 200) color = "#ff3c01";
  else if (I_mA > 200) {
    color = "#ff0000";
    ledBulb.style.animation = 'blink 0.5s infinite alternate';
  } else {
    ledBulb.style.animation = 'none';
  }
  ledBulb.setAttribute('fill', color);
}

function resetDisplay() {
  if (pDisplay) pDisplay.textContent = '0.00';
  const ledBulb = document.querySelector('#slot-led .led-bulb');
  if (ledBulb) {
    ledBulb.setAttribute('fill', '#FFFFFF');
    ledBulb.style.animation = 'none';
  }
}

// 6. EVENT LISTENERS
[vInput, rInput].forEach(input => {
  input.addEventListener('input', resetDisplay);
});

btnGenerate.addEventListener('click', calculateAndDisplay);

document.addEventListener('DOMContentLoaded', () => {
  updateCircuitStatus();
});