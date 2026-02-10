// State untuk melacak komponen yang sudah ditempatkan
let state = { 
  resistor: false, 
  led: false,
  battery: true // Baterai sudah terpasang tetap
};

// Elemen DOM utama
const draggables = document.querySelectorAll('.draggable');
const dropZones = document.querySelectorAll('.drop-zone');
const btnGenerate = document.getElementById('btn-generate');
const circuitStatus = document.getElementById('circuit-status');
const statusDot = circuitStatus.querySelector('.status-dot');
const statusText = circuitStatus.querySelector('.status-text');

// Elemen input (SLIDER DIHAPUS)
const vInput = document.getElementById('v-input');
const rInput = document.getElementById('r-input');

// Elemen display
const pDisplay = document.getElementById('p-display');

// Update status sirkuit
function updateCircuitStatus() {
  const componentsNeeded = Object.keys(state).filter(key => key !== 'battery' && !state[key]);
  
  if (componentsNeeded.length === 0) {
    statusDot.style.background = '#4CAF50';
    statusText.textContent = 'Sirkuit Siap!';
    statusText.style.color = '#2E7D32';
    circuitStatus.style.background = '#E8F5E9';
    circuitStatus.style.borderColor = '#C8E6C9';
    statusDot.style.animation = 'none';
  } else {
    statusDot.style.background = '#F44336';
    statusText.textContent = 'Sirkuit Tidak Lengkap';
    statusText.style.color = '#D32F2F';
    circuitStatus.style.background = '#FFEBEE';
    circuitStatus.style.borderColor = '#FFCDD2';
    statusDot.style.animation = 'pulse 2s infinite';
  }
}

// Reset LED ke kondisi awal
function resetLED() {
  const ledSlot = document.querySelector('#slot-led');
  if (!ledSlot) return;
  
  const ledBulb = ledSlot.querySelector('.led-bulb');
  if (ledBulb) {
    ledBulb.setAttribute('fill', '#FFFFFF');
    ledBulb.style.opacity = '1';
    ledBulb.style.animation = 'none';
    ledBulb.style.transition = 'none';
    
    // Hapus filter SVG jika ada
    const svgElement = ledSlot.querySelector('svg');
    if (svgElement) {
      const defs = svgElement.querySelector('defs');
      if (defs) {
        const filter = defs.querySelector('filter');
        if (filter) filter.remove();
      }
      ledBulb.removeAttribute('filter');
    }
  }
}

// Reset tampilan hasil
function resetDisplay() {
  iDisplay.textContent = '0.00';
  resetLED();
}

// Update warna LED berdasarkan arus (VERSI DIPERBAIKI - tanpa error)
function updateLEDColor(I_mA) {
  const ledSlot = document.querySelector('#slot-led');
  if (!ledSlot) return;
  
  const ledBulb = ledSlot.querySelector('.led-bulb');
  if (!ledBulb) return;
  
  let color = "#ffffff";
  
  if (I_mA > 0 && I_mA < 50) {
    color = "#fffc5f"; // Kuning sangat redup
  } else if (I_mA >= 50 && I_mA < 150) {
    color = "#fc9653"; // Kuning
  } else if (I_mA >= 150 && I_mA <= 200) {
    color = "#ff3c01"; // Oranye terang
  } else if (I_mA > 200) {
    color = "#ff0000"; // Hitam (burnout)
    // LED berkedip jika arus terlalu tinggi
    ledBulb.style.animation = 'blink 0.5s infinite alternate';
  } else {
    ledBulb.style.animation = 'none';
  }
  
  // Terapkan perubahan warna fill
  ledBulb.setAttribute('fill', color);
  ledBulb.style.transition = "fill 0.5s ease";
}

// Fungsi untuk menghitung dan menampilkan hasil (HANYA saat tombol ditekan)
function calculateAndDisplay() {
  // Validasi: cek apakah sirkuit lengkap
  if (!state.resistor || !state.led) {
    // Tidak ada notifikasi
    return;
  }

  const V = parseFloat(vInput.value);
  const R = parseFloat(rInput.value);
  
  // Validasi input
  if (isNaN(V) || V <= 0) {
    // Tidak ada notifikasi
    return;
  }
  
  if (isNaN(R) || R <= 0) {
    // Tidak ada notifikasi
    return;
  }
// 1. Hitung Arus dulu (I = V / R)
  const I = V / R;
  
  // 2. Hitung Daya (P = V * I) atau (P = V^2 / R)
  const P_Watt = V * I;
  
  // 3. Update tampilan Daya
  pDisplay.textContent = P_Watt.toFixed(2);
  
  // 4. Update visual LED berdasarkan Daya (misal: LED panas jika daya > 2W)
  const I_mA = I * 1000;
  updateLEDColor(I_mA);
}

// Event listener untuk input number (TANPA SYNC SLIDER)
[vInput, rInput].forEach(input => {
  input.addEventListener('input', function() {
    const value = parseFloat(this.value);
    const min = parseFloat(this.min);
    const max = parseFloat(this.max);
    
    // Validasi range
    if (value < min) this.value = min;
    if (value > max) this.value = max;
    
    // Reset tampilan saat nilai diubah (karena simulasi belum dijalankan)
    resetDisplay();
  });
});

// Drag & Drop functionality
draggables.forEach(item => {
  item.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('type', item.dataset.type);
    e.dataTransfer.setData('sourceId', item.id);
    item.style.opacity = '0.4';
  });
  
  item.addEventListener('dragend', (e) => {
    item.style.opacity = '1';
  });
});

dropZones.forEach(zone => {
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.style.borderColor = '#00BCD4';
    zone.style.transform = 'scale(1.05)';
  });
  
  zone.addEventListener('dragleave', (e) => {
    zone.style.borderColor = '#bbb';
    zone.style.transform = 'scale(1)';
  });
  
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.style.borderColor = '#bbb';
    zone.style.transform = 'scale(1)';
    
    const type = e.dataTransfer.getData('type');
    const sourceId = e.dataTransfer.getData('sourceId');
    const expectedType = zone.dataset.type;

    if (type === expectedType) {
      const sourceElement = document.getElementById(sourceId);
      const clone = sourceElement.querySelector('svg').cloneNode(true);
      
      // Kosongkan dan tambahkan komponen
      zone.innerHTML = "";
      zone.appendChild(clone);
      zone.classList.add('filled');
      
      // Update state
      state[type] = true;
      
      // Update status sirkuit
      updateCircuitStatus();
      
      // Reset tampilan karena komponen baru ditambahkan
      resetDisplay();
      
      // Tidak menampilkan toast sukses
    } 
    // Tidak menampilkan toast error
  });
});

// Event listener untuk tombol generate/simulate (HANYA di sini perhitungan dilakukan)
btnGenerate.addEventListener('click', () => {
  // Tambahkan efek visual pada tombol
  btnGenerate.classList.add('clicked');
  setTimeout(() => {
    btnGenerate.classList.remove('clicked');
  }, 300);
  
  // Jalankan perhitungan
  calculateAndDisplay();
});

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
  // Reset tampilan awal
  resetDisplay();
  
  // Cek jika komponen sudah ada di drop zone (untuk reload halaman)
  dropZones.forEach(zone => {
    if (zone.querySelector('svg')) {
      const type = zone.dataset.type;
      state[type] = true;
    }
  });
  
  updateCircuitStatus();
});