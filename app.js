// URL API SERVER GOOGLE ANDA
const API_URL = "https://script.google.com/macros/s/AKfycbzKBdj35_ZBr1Zujqh-hbBeYIftr6Cht4vl-jLyCV5cwuAtkCe6CbsF8Jy3oI3hXH8S/exec";
let globalDusunId = 0; 
let dusunCount = 0; 
let masterWilayah = {};

window.onload = function() { 
  tambahDusun(); 
  loadWilayahData();
};

// 1. MENGAMBIL DATA MASTER MELALUI API
function loadWilayahData() {
  fetch(API_URL)
    .then(response => response.json())
    .then(data => {
      masterWilayah = data;
      let kabSelect = document.getElementById('kabupatenSelect');
      kabSelect.innerHTML = '<option value="" disabled selected>-- Pilih Kabupaten/Kota --</option>';
      for(let kab in masterWilayah) {
        let opt = document.createElement('option');
        opt.value = kab; opt.innerText = kab;
        kabSelect.appendChild(opt);
      }
      kabSelect.disabled = false;
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      document.getElementById('kabupatenSelect').innerHTML = '<option value="" disabled selected>⚠️ Gagal Memuat Data</option>';
    });
}

// DROPDOWN CASCADING
function updateKecamatan() {
  let kabSelect = document.getElementById('kabupatenSelect').value;
  let kecSelect = document.getElementById('kecamatanSelect');
  let desaSelect = document.getElementById('desaSelect');
  kecSelect.innerHTML = '<option value="" disabled selected>-- Pilih Kecamatan --</option>';
  desaSelect.innerHTML = '<option value="" disabled selected>-- Tunggu Kecamatan --</option>';
  desaSelect.disabled = true;
  if(kabSelect && masterWilayah[kabSelect]) {
    for(let kec in masterWilayah[kabSelect]) {
      let opt = document.createElement('option');
      opt.value = kec; opt.innerText = kec;
      kecSelect.appendChild(opt);
    }
    kecSelect.disabled = false;
  }
}

function updateDesa() {
  let kabSelect = document.getElementById('kabupatenSelect').value;
  let kecSelect = document.getElementById('kecamatanSelect').value;
  let desaSelect = document.getElementById('desaSelect');
  desaSelect.innerHTML = '<option value="" disabled selected>-- Pilih Desa/Kelurahan --</option>';
  if(kabSelect && kecSelect && masterWilayah[kabSelect][kecSelect]) {
    masterWilayah[kabSelect][kecSelect].forEach(function(desa) {
      let opt = document.createElement('option');
      opt.value = desa; opt.innerText = desa;
      desaSelect.appendChild(opt);
    });
    desaSelect.disabled = false;
  }
}

// LOGIKA UI LAINNYA (Dusun, GPS, Kompresi Foto, Validasi)
function tambahDusun() {
  globalDusunId++; dusunCount++;
  const container = document.getElementById('dusunAccordion');
  const templateStr = document.getElementById('dusunTemplate').innerHTML;
  let newHtml = templateStr.replace(/__ID__/g, globalDusunId).replace(/__NUM__/g, dusunCount);
  const div = document.createElement('div'); div.innerHTML = newHtml;
  const accordionItem = div.firstElementChild;
  container.appendChild(accordionItem);
  if (dusunCount > 1) { accordionItem.querySelector('.btn-hapus-dusun').classList.remove('d-none'); }
  const collapseElement = document.getElementById(`collapse-${globalDusunId}`);
  new bootstrap.Collapse(collapseElement, { toggle: false }).show(); 
  updateSubmitButton();
}

let dusunYangAkanDihapus = null; 
function hapusDusun(btn, id) {
  dusunYangAkanDihapus = btn.closest('.accordion-item');
  new bootstrap.Modal(document.getElementById('confirmDeleteModal')).show();
}
function eksekusiHapus() {
  if (dusunYangAkanDihapus) {
    dusunYangAkanDihapus.remove(); dusunCount--;
    document.querySelectorAll('.dusun-item').forEach((item, index) => {
      item.querySelector('.dusun-number-text').innerText = `#${index + 1}`;
      if (index === 0 && dusunCount === 1) item.querySelector('.btn-hapus-dusun').classList.add('d-none');
    });
    updateSubmitButton(); dusunYangAkanDihapus = null; 
    var modalInstance = bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal'));
    if(modalInstance) modalInstance.hide();
  }
}

function updateSubmitButton() { document.getElementById('btnSubmit').innerText = `Kirim Semua Usulan (${dusunCount} Dusun)`; }

function hitungBelumBerlistrik(inputElement) {
  const inputs = inputElement.closest('.row').querySelectorAll('.input-calc');
  const output = inputElement.closest('.row').querySelector('.output-calc');
  let belum = (Number(inputs[0].value)||0) - ((Number(inputs[1].value)||0) + (Number(inputs[2].value)||0));
  output.value = belum < 0 ? 0 : belum;
}

let toastTimeout;
function showToast(message, autoHide = false) {
  const toast = document.getElementById('customToast');
  const msg = document.getElementById('toastMessage');
  msg.innerHTML = message;
  clearTimeout(toastTimeout);
  toast.classList.add('show');
  if (autoHide) { toastTimeout = setTimeout(() => { tutupToast(); }, 3500); }
}
function tutupToast() { document.getElementById('customToast').classList.remove('show'); }

function dapatkanGPS(btn) {
  const container = btn.closest('.row');
  btn.innerText = "⏳ Sedang mencari..."; 
  btn.disabled = true;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        container.querySelector('.input-long').value = pos.coords.longitude;
        container.querySelector('.input-lat').value = pos.coords.latitude;
        btn.innerText = "✅ GPS Diambil"; btn.disabled = false; btn.style.color = "#198754";
        showToast("✅ Lokasi Anda telah berhasil dikunci.", true); 
      },
      err => { 
        showToast("⚠️ <b>Sinyal satelit gagal ditangkap.</b><br>Pastikan Anda di Luar Ruangan & GPS aktif.", false);
        btn.innerText = "📍 Coba Ambil GPS Lagi"; btn.disabled = false; 
      },
      { enableHighAccuracy: true, timeout: 15000 } 
    );
  } else { 
    showToast("⚠️ Browser HP Anda tidak mendukung fitur pelacakan lokasi.", false);
    btn.innerText = "📍 Ambil GPS"; btn.disabled = false; 
  }
}

function handleFile(fileInput, dataName, fileNameInputName) {
  const box = fileInput.closest('.photo-upload-box');
  const preview = box.querySelector('.image-preview');
  const textPlace = box.querySelector('.placeholder-text');
  const descPlace = box.querySelector('.placeholder-desc');
  const iconPlace = box.querySelector('.upload-icon');
  const dataHidden = box.querySelector('.base64-data');
  const nameHidden = box.querySelector('.file-name');

  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    if(file.size > 8 * 1024 * 1024) { 
        showToast("⚠️ Ukuran foto asli Anda melebihi 8MB. Silakan pilih foto lain.", false); 
        fileInput.value = ""; return; 
    }
    nameHidden.value = file.name;
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        const MAX_WIDTH = 1024, MAX_HEIGHT = 1024;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        preview.src = dataUrl; preview.style.display = 'block';
        textPlace.innerText = "Foto Dipilih (Terkonversi)"; textPlace.style.color = "#198754"; 
        descPlace.innerText = "Ketuk untuk mengganti"; iconPlace.style.display = 'none';
        dataHidden.value = dataUrl;
      }
      img.src = e.target.result;
    }
    reader.readAsDataURL(file);
  }
}

function showNotif(isSuccess, title, message) {
  document.getElementById('notifIconModal').innerText = isSuccess ? '✅' : '❌';
  document.getElementById('notifTitle').innerText = title;
  document.getElementById('notifTitle').style.color = isSuccess ? '#1a5f60' : 'var(--danger)';
  document.getElementById('notifMessageModal').innerHTML = message;
  new bootstrap.Modal(document.getElementById('notifModal')).show();
}

function validateForm() {
  let missing = [];
  if (!document.querySelector('select[name="kabupaten"]').value) missing.push("Kabupaten/Kota");
  if (!document.querySelector('select[name="kecamatan"]').value) missing.push("Kecamatan");
  if (!document.querySelector('select[name="desa"]').value) missing.push("Desa/Kelurahan");

  const dusuns = document.querySelectorAll('.dusun-item');
  dusuns.forEach((dusun) => {
    let dusunNum = dusun.querySelector('.dusun-number-text').innerText.replace('#', '');
    let dusunMissing = [];
    if (!dusun.querySelector('input[name="namaDusun"]').value.trim()) dusunMissing.push("Nama Dusun");
    if (!dusun.querySelector('input[name="totalRt"]').value) dusunMissing.push("Total RT");
    if (!dusun.querySelector('input[name="jumlahFasum"]').value) dusunMissing.push("Jumlah Fasum");
    if (!dusun.querySelector('input[name="rincianFasum"]').value.trim()) dusunMissing.push("Rincian Fasum");
    if (!dusun.querySelector('input[name="longitude"]').value) dusunMissing.push("Titik Koordinat");
    if (!dusun.querySelector('input[name="fileDataJalan"]').value) dusunMissing.push("Foto Jalan (1)");
    if (!dusun.querySelector('input[name="fileDataRumah"]').value) dusunMissing.push("Foto Rumah (2)");
    if (!dusun.querySelector('input[name="fileDataJaringan"]').value) dusunMissing.push("Foto Jaringan (3)");
    if (dusunMissing.length > 0) missing.push(`<b>Dusun #${dusunNum}:</b> ` + dusunMissing.join(", "));
  });

  if (!document.querySelector('input[name="namaAparat"]').value.trim()) missing.push("Nama Aparat");
  if (!document.querySelector('input[name="noHp"]').value.trim()) missing.push("No HP");
  return missing;
}

function tampilkanFormLagi() {
  document.getElementById('successView').style.display = 'none';
  document.getElementById('mainFormView').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 2. MENGIRIM DATA FORM KE API
function submitForm(event) {
  event.preventDefault();
  
  let missingItems = validateForm();
  if (missingItems.length > 0) {
    let errorHtml = "<div class='text-start mt-3' style='font-size: 0.9em;'><p>Lengkapi data berikut:</p><ul class='text-danger ps-3 mb-0' style='text-align: left;'>";
    missingItems.forEach(item => { errorHtml += `<li class='mb-1'>${item}</li>`; });
    errorHtml += "</ul></div>";
    showNotif(false, "DATA BELUM LENGKAP", errorHtml);
    return; 
  }

  var btn = document.getElementById('btnSubmit');
  btn.disabled = true;
  let oldBtnText = btn.innerText;
  btn.innerText = "🚀 Mengunggah API... Mohon Tunggu";
  btn.style.boxShadow = "inset 4px 4px 10px rgba(0,0,0,0.2)";

  var form = document.getElementById('usulForm');
  var formData = new FormData(form);
  var dataObj = {};
  
  formData.forEach((value, key) => {
    if (!dataObj.hasOwnProperty(key)) { dataObj[key] = value; } 
    else {
      if (!Array.isArray(dataObj[key])) dataObj[key] = [dataObj[key]];
      dataObj[key].push(value);
    }
  });

  // MENGGUNAKAN METODE FETCH WEB MODERN KE SERVER GOOGLE
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(dataObj)
  })
  .then(response => response.json())
  .then(response => {
    if(response.success) {
      form.reset();
      document.getElementById('dusunAccordion').innerHTML = "";
      globalDusunId = 0; dusunCount = 0; 
      tambahDusun();
      document.getElementById('mainFormView').style.display = 'none';
      document.getElementById('successView').style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else { 
      showNotif(false, "GAGAL MENGIRIM", response.message); 
    }
  })
  .catch(error => {
    showNotif(false, "ERROR SISTEM", "Gagal terhubung ke API Server. Coba lagi.");
    console.error(error);
  })
  .finally(() => {
    btn.disabled = false;
    btn.innerText = oldBtnText;
    btn.style.boxShadow = "";
    updateSubmitButton();
  });
}