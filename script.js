// =========================================================================
// ⚙️ KONFIGURASI UTAMA & INITIALISASI DATABASE SUPABASE
// =========================================================================

// URL Endpoint proyek Supabase Sobat Tentena Anda
const SUPABASE_URL = 'https://jdmvepfxiuvjsebvypfa.supabase.co';

// Kunci Publik (Anon Key) untuk autentikasi dan hak akses client-side
const SUPABASE_KEY = 'sb_publishable_6VCuASp19-VvDklo6zAspg_elcuAWf4';

// Mengambil fungsi bawan createClient dari library global Supabase
const { createClient } = supabase;

// Menginisialisasi koneksi client database dengan variabel sb
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// Nama-nama tabel yang digunakan di database Supabase
const TABLE_UMKM = 'iklan_umkm';
const TABLE_TEBENGAN = 'tebengan';

// State global untuk menampung seluruh data tebengan yang aktif dari server
let semuaData = [];

// Variabel cache penampung koordinat lokasi real-time dari Google Maps API
let dataKoordinat = {
    latJemput: null, lngJemput: null, alamatJemput: '',
    latTujuan: null, lngTujuan: null, alamatTujuan: '',
    jarakText: '', biayaTotal: 0
};


// =========================================================================
// 🔐 LOGIKA UTAMA OTOMATISASI AUTHENTICATION (SESSION LISTENER)
// =========================================================================

/**
 * Listener global dari Supabase untuk memantau perubahan status akun (Login/Logout).
 */
sb.auth.onAuthStateChange((event, session) => {
    const textMenu = document.getElementById('text-auth-menu');
    const iconMenu = document.getElementById('icon-auth-menu');
    
    if (session) {
        const namaUser = session.user.user_metadata.full_name || session.user.email.split('@')[0];
        if (textMenu) textMenu.innerText = `Keluar (${namaUser})`;
        if (iconMenu) iconMenu.className = "fa-solid fa-right-from-bracket text-red-500 w-6";
    } else {
        if (textMenu) textMenu.innerText = "Masuk Akun";
        if (iconMenu) iconMenu.className = "fa-solid fa-right-to-bracket text-gray-600 w-6";
    }
});


// =========================================================================
// 🛍️ KONTROL MODUL PAPAN IKLAN UMKM LOKAL TENTENA
// =========================================================================

/**
 * Mengambil data iklan UMKM dari tabel Supabase lalu merendernya ke halaman depan.
 */
async function loadBulletinBoard() {
    const container = document.getElementById('bulletin-container');
    
    try {
        const { data, error } = await sb.from(TABLE_UMKM).select('*');
        if (error) throw error;
        
        container.innerHTML = ''; 
        
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'umkm-card';
            
            card.innerHTML = `
                <div>
                    <img src="${item.foto_url}" alt="${item.produk}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 16px; margin-bottom: 10px;">
                    <div class="umkm-name">${item.nama_umkm}</div>
                    <div class="product-name">${item.produk}</div>
                    <div class="product-desc">${item.deskripsi}</div>
                </div>
                <button class="wa-btn" 
                    onclick="handleWaClick('${item.id}', '${item.nomor_wa}', '${item.produk}', '${item.jumlah_klik}')">
                    Hubungi Penjual via WA
                </button>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        container.innerHTML = '<p class="text-gray-400 text-xs p-2">Gagal memuat pengumuman. Silakan coba lagi nanti.</p>';
        console.error('Error fetching data:', error);
    }
}

/**
 * Menangani aksi klik tombol WhatsApp pada iklan UMKM (Tracking click).
 */
async function handleWaClick(id, nomorWa, namaProduk, currentClicks) {
    const pesan = `Halo, saya tertarik dengan produk ${namaProduk} yang saya lihat di SOBAT.`;
    const waUrl = `https://wa.me/${nomorWa}?text=${encodeURIComponent(pesan)}`;
    
    window.open(waUrl, '_blank');
    const newClicks = parseInt(currentClicks || 0) + 1;
    
    try {
        await sb.from(TABLE_UMKM).update({ jumlah_klik: newClicks }).eq('id', id);
    } catch (error) {
        console.error('Gagal mencatat tracking:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadBulletinBoard);


// =========================================================================
// 📱 KONTROL UTILITAS ANTARMUKA (UI / UX UTILITIES)
// =========================================================================

function setAktif(id) {
    const links = document.querySelectorAll('.bottom-nav a');
    links.forEach(link => link.classList.remove('active-nav'));
    document.getElementById(id).classList.add('active-nav');
}

window.addEventListener('load', () => {
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.style.display = 'none', 500);
        }
    }, 1800);
});

document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('tos-modal');
    const btnSetuju = document.getElementById('btn-setuju');

    if (modal) {
        if (localStorage.getItem('sudahSetuju')) {
            modal.style.display = 'none';
        } else {
            modal.style.display = 'flex';
        }

        btnSetuju.addEventListener('click', function() {
            localStorage.setItem('sudahSetuju', 'true');
            modal.style.display = 'none';
        });
    }
});

function bukaTentangKami() {
    const narasi = `SOBAT Tentena adalah inisiatif berbasis teknologi yang hadir untuk memfasilitasi kebutuhan mobilitas harian civitas akademika dan Pelajar Tentena dengan semangat "Dibuat oleh Sobat untuk Sobat". Kami berfokus pada efisiensi, aksesibilitas, dan penguatan nilai gotong-royong.

Keamanan Data & Privasi
Privasi adalah prioritas kami. Seluruh data bersifat sementara dan dibersihkan otomatis setiap satu jam. Kami tidak menyimpan data perjalanan jangka panjang untuk meminimalisir risiko kebocoran informasi pribadi.

Keselamatan di Jalan
Keselamatan adalah prioritas utama. Kami mengimbau seluruh pengguna untuk selalu menaati aturan lalu lintas dan melakukan verifikasi titik jemput yang akurat. Harap ingat segala interaksi di luar platform merupakan tanggung jawab pribadi.`;
    
    bukaModalInfo('Tentang Kami', narasi);
}

function bukaMenu() {
    const menu = document.getElementById('menu-side');
    menu.classList.remove('hidden');
    setTimeout(() => menu.classList.add('opacity-100'), 10);
}

function tutupMenu() {
    const menu = document.getElementById('menu-side');
    menu.classList.add('hidden');
    menu.classList.remove('opacity-100');
}

function bukaModalInfo(judul, pesan) {
    document.getElementById('info-title').innerText = judul;
    document.getElementById('info-text').innerText = pesan;
    document.getElementById('modal-info').classList.remove('hidden');
}

function tutupModalInfo() {
    document.getElementById('modal-info').classList.add('hidden');
}

function formatWA(input) {
    let value = input.value.replace(/[^\d+]/g, '');
    input.value = value;
}


// =========================================================================
// 🚖 MODUL GOJEK-STYLE: AUTOCOMPLETE & OTOMATISASI HITUNG TARIF RUTE
// =========================================================================

document.addEventListener('DOMContentLoaded', initGoogleMapsAutocomplete);

/**
 * Mengaktifkan sistem pencarian alamat pintar Google Places Autocomplete pada formulir.
 */
function initGoogleMapsAutocomplete() {
    if (typeof google === 'undefined') return;

    const inputJemput = document.getElementById('input-jemput');
    const inputTujuan = document.getElementById('input-tujuan');

    if (!inputJemput || !inputTujuan) return;

    const autocompleteJemput = new google.maps.places.Autocomplete(inputJemput, {
        componentRestrictions: { country: 'id' }
    });

    const autocompleteTujuan = new google.maps.places.Autocomplete(inputTujuan, {
        componentRestrictions: { country: 'id' }
    });

    autocompleteJemput.addListener('place_changed', () => {
        const place = autocompleteJemput.getPlace();
        if (!place.geometry) return;
        dataKoordinat.latJemput = place.geometry.location.lat();
        dataKoordinat.lngJemput = place.geometry.location.lng();
        dataKoordinat.alamatJemput = place.formatted_address;
        hitungRuteDanEstimasiBiaya();
    });

    autocompleteTujuan.addListener('place_changed', () => {
        const place = autocompleteTujuan.getPlace();
        if (!place.geometry) return;
        dataKoordinat.latTujuan = place.geometry.location.lat();
        dataKoordinat.lngTujuan = place.geometry.location.lng();
        dataKoordinat.alamatTujuan = place.formatted_address;
        hitungRuteDanEstimasiBiaya();
    });
}

/**
 * Menggunakan Google Distance Matrix Service untuk menghitung rute riil jalan & tarif otomatis.
 */
function hitungRuteDanEstimasiBiaya() {
    if (!dataKoordinat.latJemput || !dataKoordinat.latTujuan) return;

    const origin = new google.maps.LatLng(dataKoordinat.latJemput, dataKoordinat.lngJemput);
    const destination = new google.maps.LatLng(dataKoordinat.latTujuan, dataKoordinat.lngTujuan);

    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING
    }, (response, status) => {
        if (status === google.maps.DistanceMatrixStatus.OK) {
            const results = response.rows[0].elements[0];
            if (results.status === "ZERO_RESULTS") {
                alert("Rute jalan tidak ditemukan.");
                return;
            }

            const jarakText = results.distance.text;
            const jarakMeter = results.distance.value;
            const jarakKm = jarakMeter / 1000;

            // Aturan hitung biaya: Rp 3.000 / km, minimal bayar Rp 5.000
            const TARIF_PER_KM = 3000;
            const TARIF_MINIMAL = 5000;
            
            let kalkulasiBiaya = Math.round(jarakKm * TARIF_PER_KM);
            if (kalkulasiBiaya < TARIF_MINIMAL) kalkulasiBiaya = TARIF_MINIMAL;

            dataKoordinat.jarakText = jarakText;
            dataKoordinat.biayaTotal = kalkulasiBiaya;

            // Suntik ke UI Box Estimasi halaman HTML
            document.getElementById('txt-jarak').innerText = jarakText;
            document.getElementById('txt-biaya').innerText = `Rp ${kalkulasiBiaya.toLocaleString('id-ID')}`;
            document.getElementById('box-estimasi').classList.remove('hidden');
        }
    });
}

// --- PERBAIKAN FUNGSI GEOLOCATION ---
async function getLokasiOtomatisGojek() {
    const inputJemput = document.getElementById('input-jemput');
    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
    
    if (navigator.geolocation) {
        inputJemput.value = "Mendeteksi lokasi GPS Anda...";
        navigator.geolocation.getCurrentPosition((pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            // Menyimpan koordinat murni agar nanti bisa dibaca link Peta di daftar jok
            inputJemput.value = `https://www.google.com/maps?q=${lat},${lng}`;
        }, (err) => { 
            alert("Gagal mendapatkan lokasi. Pastikan izin lokasi perangkat aktif."); 
            inputJemput.value = ""; 
        }, options);
    } else {
        alert("Browser tidak mendukung geolokasi.");
    }
}

// =========================================================================
// 🚗 PAPAN DASHBOARD ORDERAN: LOAD DATA PERMINTAAN JEMPUTAN PENUMPANG
// =========================================================================

/**
 * Memuat pesanan penumpang aktif berdurasi maksimal 1 jam terakhir dari database.
 */
async function loadDataTebengan() {
    const container = document.getElementById('modal-data-container');
    container.innerHTML = '<p class="text-white text-center p-4"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat pesanan aktif...</p>';
    try {
        const satuJamLalu = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        
        const { data, error } = await sb
            .from(TABLE_TEBENGAN)
            .select('*')
            .gte('created_at', satuJamLalu) 
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        semuaData = data; 
        tampilkanData(semuaData);
    } catch (e) { 
        container.innerHTML = '<p class="text-white text-center p-4">Gagal memuat papan orderan.</p>'; 
    }
}

/**
 * MENAMPILKAN DATA ORDER PENUMPANG (Sisi Driver memantau Rute Peta, Catatan & Harga)
 */
function tampilkanData(data) {
    const container = document.getElementById('modal-data-container');
    
    container.innerHTML = data.length > 0 ? data.map(item => {
        // Mengamankan data alamat/tujuan jika menggunakan kolom versi lama agar tidak crash
        const jemputFix = item.alamat_jemput || item.titik_jemput || 'Lokasi tidak terdeteksi';
        const tujuanFix = item.alamat_tujuan || item.tujuan || 'Tujuan tidak ditentukan';
        const biayaFix = item.estimasi_biaya || item.tarif || 0;
        const jarakFix = item.estimasi_jarak || '0 Km';

        return `
        <div class="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 flex flex-col gap-2">
            <div class="flex justify-between items-center">
                <h4 class="font-bold text-gray-800 text-sm"><i class="fa-solid fa-user text-blue-500 mr-1"></i> ${item.nama}</h4>
                <span class="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">${jarakFix}</span>
            </div>
            
            <div class="text-xs text-gray-600 space-y-1.5 bg-gray-50 p-2.5 rounded-xl border border-gray-100 mt-1">
                <div><span class="font-bold text-green-600">📍 Jemput:</span> ${jemputFix}</div>
                <div><span class="font-bold text-red-500">🏁 Tujuan:</span> ${tujuanFix}</div>
            </div>

            ${item.catatan ? `
            <div class="text-[11px] italic text-gray-500 bg-amber-50/70 border border-amber-100 px-2.5 py-2 rounded-xl">
                <span class="font-bold text-amber-700 not-italic">💬 Pesan:</span> "${item.catatan}"
            </div>` : ''}

            <div class="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg self-start mt-1">
                Estimasi Tarif: Rp ${biayaFix.toLocaleString('id-ID')}
            </div>

            <div class="mt-2 flex gap-2">
                <a href="https://www.google.com/maps/dir/?api=1&origin=${item.lat_jemput || ''},${item.lng_jemput || ''}&destination=${item.lat_tujuan || ''},${item.lng_tujuan || ''}" target="_blank" class="flex-1 text-center bg-gray-100 hover:bg-gray-200 py-2.5 rounded-xl text-xs font-bold text-gray-700 transition flex items-center justify-center gap-1">
                    <i class="fa-solid fa-map-location-dot"></i> Rute Peta
                </a>
                <a href="https://wa.me/${item.no_wa.replace(/\D/g, '')}?text=Halo%20${item.nama.split(' ')[0]},%20saya%20Driver%20SOBAT.%20Saya%20lihat%20pesanan%20jemputanmu%20ke%20${encodeURIComponent(tujuanFix)}%20searah.%20Saya%20jemput%20sekarang%20ya!" target="_blank" class="flex-[2] text-center bg-green-500 hover:bg-green-600 py-2.5 rounded-xl text-white text-xs font-bold shadow-md shadow-green-100 transition flex items-center justify-center gap-1">
                    <i class="fa-solid fa-comment-sms"></i> Ambil / Chat WA
                </a>
            </div>
            <div class="text-center mt-1">
                <a href="https://wa.me/6282292067618?text=Halo%20Admin,%20saya%20ingin%20melaporkan%20orderan%20palsu%20atas%20nama%20${item.nama}" target="_blank" class="text-[9px] text-red-400 underline font-medium">
                    <i class="fa-solid fa-flag"></i> Laporkan orderan palsu
                </a>
            </div>
        </div>`;
    }).join('') : '<p class="text-white text-center p-4">Belum ada penumpang yang mencari tumpangan saat ini.</p>';
}

// --- PERBAIKAN LOGIKA KIRIM FORM TEBENGAN ---
document.getElementById('nebengForm').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Mengirim...';
    
    try {
        // 1. Ambil informasi sesi user aktif dari Supabase Auth secara otomatis
        const { data: { session } } = await sb.auth.getSession();
        if (!session) {
            alert("Sesi Anda berakhir. Silakan login kembali.");
            bukaModalLogin();
            return;
        }

        const metadata = session.user.user_metadata || {};
        const namaUser = metadata.full_name || session.user.email.split('@')[0];
        const waUser = metadata.phone_wa || '';

        // Proteksi jika user belum melengkapi nomor WhatsApp di profil mereka
        if (!waUser) {
            alert("Harap lengkapi Nomor WhatsApp Anda di menu 'Profil' terlebih dahulu sebelum membagikan jok!");
            tutupFormBagikan();
            bukaProfil();
            return;
        }
        
        const formData = new FormData(e.target);
        
        // 2. Susun payload data yang disinkronkan dengan input HTML dan Metadata Auth
        const payload = {
            nama: namaUser,
            tujuan: formData.get('Tujuan'),
            titik_jemput: formData.get('Titik Jemput'), // Diambil dari input name="Titik Jemput"
            tarif: Number(formData.get('Tarif')),
            jam_berangkat: formData.get('Jam Berangkat'),
            no_wa: waUser
        };
        
        // 3. Masukkan data ke tabel Supabase
        const { error } = await sb.from(TABLE_TEBENGAN).insert([payload]);
        if (error) throw error;
        
        tutupFormBagikan();
        tampilNotif(); 
        e.target.reset();
    } catch (error) { 
        console.error('Gagal mengirim data:', error);
        alert('Gagal mengirim data tebengan ke database.'); 
    } 
    finally { 
        submitBtn.disabled = false; 
        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Mulai Bagikan Jok'; 
    }
};
/**
 * Menyaring daftar pencarian orderan berdasarkan ketikan teks alamat tujuan secara offline.
 */
function filterData() {
    const teks = document.getElementById('filterTujuan').value.toLowerCase();
    const hasil = semuaData.filter(item => {
        const tujuanFix = item.alamat_tujuan || item.tujuan || '';
        return tujuanFix.toLowerCase().includes(teks);
    });
    tampilkanData(hasil);
}


// =========================================================================
// 🔒 PENGONTROL MODAL ALUR KEAMANAN (FORM & MODAL TRIGGER)
// =========================================================================

async function bukaFormBagikan() { 
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
        bukaModalLogin(); 
        return;
    }
    document.getElementById('modal-form-bagikan').classList.remove('hidden'); 
}

function tutupFormBagikan() { 
    document.getElementById('modal-form-bagikan').classList.add('hidden'); 
}

async function bukaModalCariJok() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
        bukaModalLogin(); 
        return;
    }
    document.getElementById('modal-jok').classList.remove('hidden');
    loadDataTebengan(); 
}

function tutupModal() { 
    document.getElementById('modal-jok').classList.add('hidden'); 
}

function bukaDonasi() { 
    document.getElementById('modal-donasi').classList.remove('hidden'); 
}

function tutupDonasi() { 
    document.getElementById('modal-donasi').classList.add('hidden'); 
}

function tampilNotif() {
    const notif = document.getElementById('notif-berhasil');
    if(notif) {
        notif.classList.remove('hidden');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                notif.classList.remove('opacity-0');
                notif.classList.add('opacity-100');
            });
        });
    }
}

function tutupNotif() {
    const notif = document.getElementById('notif-berhasil');
    if(notif) {
        notif.classList.remove('opacity-100');
        notif.classList.add('opacity-0');
        setTimeout(() => notif.classList.add('hidden'), 300);
    }
}


// =========================================================================
// 🤖 CORE MODUL KONEKTIVITAS EDGE FUNCTION CHATBOT AI SOBAT
// =========================================================================

function kirimPesanKeAI() {
    const inputField = document.getElementById('inputUser');
    const displayArea = document.getElementById('jawabanAI');
    const pesan = inputField.value;

    if (!pesan) return;
    displayArea.innerText = "Sedang mengetik...";

    const webAppUrl = "https://jdmvepfxiuvjsebvypfa.supabase.co/functions/v1/chat-ai";

    fetch(webAppUrl, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({ message: pesan })
    })
    .then(response => response.json()) 
    .then(data => {
        if (data.reply) { displayArea.innerText = data.reply; } 
        else { displayArea.innerText = "Terjadi kendala data: " + JSON.stringify(data); }
    })
    .catch(error => {
        displayArea.innerText = "Error: Gagal terhubung ke server AI.";
    });
}

function toggleChatbot() {
    const chatModal = document.getElementById('chat-modal');
    if (chatModal.style.display === 'none' || chatModal.style.display === '') {
        chatModal.style.display = 'flex';
    } else {
        chatModal.style.display = 'none';
    }
}


// =========================================================================
// 📡 DETEKTOR REAL-TIME KESEHATAN JARINGAN INTERNET (OFFLINE DETECTOR)
// =========================================================================

function updateOnlineStatus() {
    if (!navigator.onLine) {
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px 20px; font-family: sans-serif;">
                <h2 style="color: #333;">Koneksi Terputus 📡</h2>
                <p style="color: #666;">Sepertinya kamu sedang offline. Silakan periksa koneksi internetmu agar bisa mengakses kembali SOBAT.</p>
                <button onclick="window.location.reload()" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 8px; margin-top: 20px;">Coba Ulang</button>
            </div>
        `;
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus(); 


// =========================================================================
// 🔑 GERBANG AUTENTIKASI SUPABASE (LOGIN, DAFTAR, LOGOUT)
// =========================================================================

function bukaModalLogin() {
    document.getElementById('modal-login').classList.remove('hidden');
}

function tutupModalLogin() {
    document.getElementById('modal-login').classList.add('hidden');
}

async function loginEmail() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    if (!email || !password) {
        alert("Harap isi email dan password Anda!");
        return;
    }

    try {
        const { error } = await sb.auth.signInWithPassword({ email: email, password: password });
        if (error) throw error;
        
        alert("Selamat datang kembali! Login Berhasil.");
        tutupModalLogin();
        window.location.reload(); 
    } catch (err) {
        alert("Gagal masuk: " + err.message);
    }
}

async function daftarEmail() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    if (!email || !password) {
        alert("Harap lengkapi email dan password untuk mendaftar!");
        return;
    }

    try {
        const { error } = await sb.auth.signUp({ email: email, password: password });
        if (error) throw error;
        alert("Pendaftaran berhasil! Silakan langsung klik tombol 'Masuk'.");
    } catch (err) {
        alert("Gagal mendaftar: " + err.message);
    }
}

async function handleAuthAction() {
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
        if (confirm("Apakah Anda yakin ingin keluar dari akun SOBAT?")) {
            await sb.auth.signOut(); 
            tutupMenu();
            window.location.reload();
        }
    } else {
        tutupMenu();
        bukaModalLogin(); 
    }
}


// =========================================================================
// 👤 KONTROL LOGIKA MANAJEMEN PROFIL USER (NATIVE VERSION)
// =========================================================================

async function bukaProfil() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
        bukaModalLogin();
        return;
    }
    
    const user = session.user;
    document.getElementById('profil-email').value = user.email;
    
    const metadata = user.user_metadata || {};
    document.getElementById('profil-nama').value = metadata.full_name || '';
    document.getElementById('profil-hp').value = metadata.phone_wa || '';
    document.getElementById('profil-status').value = metadata.status_info || '';
    
    document.getElementById('modal-profil').classList.remove('hidden');
}

function tutupProfil() {
    document.getElementById('modal-profil').classList.add('hidden');
}

async function simpanPerubahanProfil() {
    const btnSimpan = document.getElementById('btn-simpan-profil');
    const nama = document.getElementById('profil-nama').value.trim();
    const hp = document.getElementById('profil-hp').value.trim();
    const status = document.getElementById('profil-status').value.trim();
    
    if (!nama || !hp) {
        alert("Nama Lengkap dan Nomor WhatsApp wajib diisi demi keamanan!");
        return;
    }
    
    btnSimpan.disabled = true;
    btnSimpan.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin"></i> Menyimpan...`;
    
    try {
        const { error } = await sb.auth.updateUser({
            data: { full_name: nama, phone_wa: hp, status_info: status }
        });
        if (error) throw error;
        
        alert("Profil Anda berhasil diperbarui secara permanen!");
        tutupProfil();
    } catch (err) {
        alert("Gagal memperbarui profil: " + err.message);
    } finally {
        btnSimpan.disabled = false;
        btnSimpan.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan`;
    }
}
