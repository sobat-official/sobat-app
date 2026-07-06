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


// =========================================================================
// 🔐 LOGIKA UTAMA OTOMATISASI AUTHENTICATION (SESSION LISTENER)
// =========================================================================

/**
 * Listener global dari Supabase untuk memantau perubahan status akun (Login/Logout).
 * Fungsi ini otomatis berjalan setiap kali ada pengguna yang berhasil masuk atau keluar.
 */
sb.auth.onAuthStateChange((event, session) => {
    const textMenu = document.getElementById('text-auth-menu');
    const iconMenu = document.getElementById('icon-auth-menu');
    
    if (session) {
        // Jika pengguna berhasil login, ambil nama dari metadata, atau potong email depan jika nama kosong
        const namaUser = session.user.user_metadata.full_name || session.user.email.split('@')[0];
        // Ubah teks menu di sidebar menjadi Keluar beserta nama panggilan pengguna
        if (textMenu) textMenu.innerText = `Keluar (${namaUser})`;
        // Ganti ikon menu menjadi ikon logout berwarna merah
        if (iconMenu) iconMenu.className = "fa-solid fa-right-from-bracket text-red-500 w-6";
    } else {
        // Jika pengguna dalam posisi offline/belum login, atur teks sidebar menjadi Masuk Akun
        if (textMenu) textMenu.innerText = "Masuk Akun";
        // Atur ikon menu menjadi ikon masuk berwarna abu-abu standar
        if (iconMenu) iconMenu.className = "fa-solid fa-right-to-bracket text-gray-600 w-6";
    }
});


// =========================================================================
// 🛍️ KONTROL MODUL PAPAN IKLAN UMKM LOKAL TENTENA
// =========================================================================

/**
 * Mengambil data iklan UMKM dari tabel Supabase lalu merendernya ke dalam bentuk
 * kartu tampilan (card) di halaman depan secara dinamis.
 */
async function loadBulletinBoard() {
    const container = document.getElementById('bulletin-container');
    
    try {
        // Mengambil seluruh baris data dari tabel iklan_umkm
        const { data, error } = await sb.from(TABLE_UMKM).select('*');
        if (error) throw error;
        
        container.innerHTML = ''; // Membersihkan teks loading bawaan HTML
        
        // Melakukan perulangan untuk menyusun elemen card per baris data UMKM
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
        // Menampilkan pesan error di container jika koneksi gagal atau data tidak ditemukan
        container.innerHTML = '<p class="text-gray-400 text-xs p-2">Gagal memuat pengumuman. Silakan coba lagi nanti.</p>';
        console.error('Error fetching data:', error);
    }
}

/**
 * Menangani aksi klik tombol WhatsApp pada iklan UMKM.
 * Membuka chat WA otomatis (redirect) sekaligus menambahkan jumlah tracking klik di database.
 */
async function handleWaClick(id, nomorWa, namaProduk, currentClicks) {
    // Menyusun template pesan otomatis untuk penjual UMKM
    const pesan = `Halo, saya tertarik dengan produk ${namaProduk} yang saya lihat di SOBAT.`;
    const waUrl = `https://wa.me/${nomorWa}?text=${encodeURIComponent(pesan)}`;
    
    // Membuka tautan WhatsApp di tab browser baru
    window.open(waUrl, '_blank');
    
    // Skema Optimistic Tracking: menghitung jumlah klik baru (+1)
    const newClicks = parseInt(currentClicks || 0) + 1;
    
    try {
        // Mengirimkan update jumlah klik terbaru ke database berdasarkan ID iklan terkait
        const { error } = await sb.from(TABLE_UMKM).update({ jumlah_klik: newClicks }).eq('id', id);
        if (error) throw error;
        console.log('Tracking berhasil dicatat:', newClicks);
    } catch (error) {
        console.error('Gagal mencatat tracking:', error);
    }
}

// Menjalankan fungsi memuat papan pengumuman UMKM setelah halaman selesai dimuat sempurna
document.addEventListener('DOMContentLoaded', loadBulletinBoard);


// =========================================================================
// 📱 KONTROL UTILITAS ANTARMUKA (UI / UX UTILITIES)
// =========================================================================

/**
 * Mengatur kelas aktif navigasi bawah (bottom-nav) agar ikon yang sedang diklik 
 * berwarna biru terang mencolok dibanding menu lainnya.
 */
function setAktif(id) {
    const links = document.querySelectorAll('.bottom-nav a');
    // Menghapus kelas penanda aktif dari semua link navigasi terlebih dahulu
    links.forEach(link => link.classList.remove('active-nav'));
    // Menambahkan kelas penanda aktif ke elemen yang dituju sesuai parameter ID[cite: 3]
    document.getElementById(id).classList.add('active-nav');
}

/**
 * Efek transisi pudar (fade-out) untuk layar pembuka (Splash Screen) 
 * berdurasi total sekitar 2,3 detik dari saat web diakses.
 */
window.addEventListener('load', () => {
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        splash.style.opacity = '0'; // Membuat elemen menjadi transparan lembut
        // Menghilangkan elemen sepenuhnya dari hierarki layout setelah transisi selesai
        setTimeout(() => splash.style.display = 'none', 500);
    }, 1800);
});

/**
 * Memformat otomatis input teks jam berangkat agar membentuk pola "HH.MM" (Jam.Menit)
 * secara real-time saat pengguna mengetik angka di form tebengan.
 */
function formatJam(input) {
    let val = input.value.replace(/\D/g, ''); // Membuang semua karakter non-angka
    if (val.length > 2) {
        val = val.substring(0, 2) + '.' + val.substring(2, 4); // Menyisipkan tanda titik setelah dua angka pertama
    }
    input.value = val;
}

/**
 * Melakukan pengecekan status persetujuan Aturan Komunitas (ToS Modal) pengguna lewat localStorage.
 * Jika belum pernah menyetujui, modal wajib baca akan otomatis terbuka di awal.
 */
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('tos-modal');
    const btnSetuju = document.getElementById('btn-setuju');

    if (localStorage.getItem('sudahSetuju')) {
        modal.style.display = 'none'; // Sembunyikan modal jika status persetujuan bernilai true
    } else {
        modal.style.display = 'flex'; // Tampilkan modal jika pengguna baru pertama kali masuk
    }

    btnSetuju.addEventListener('click', function() {
        // Menyimpan status persetujuan permanen di browser lokal pengguna
        localStorage.setItem('sudahSetuju', 'true');
        modal.style.display = 'none';
    });
});

/**
 * Menyimpan narasi hukum, privasi, keselamatan, dan landasan hukum aplikasi SOBAT,
 * lalu menampilkannya secara rapi di dalam modal info global.
 */
function bukaTentangKami() {
    const narasi = `SOBAT Tentena adalah inisiatif berbasis teknologi yang hadir untuk memfasilitasi kebutuhan mobilitas harian civitas akademika dan Pelajar Tentena dengan semangat "Dibuat oleh Sobat untuk Sobat". Kami berfokus pada efisiensi, aksesibilitas, dan penguatan nilai gotong-royong.

Keamanan Data & Privasi
Privasi adalah prioritas kami. Seluruh data bersifat sementara dan dibersihkan otomatis setiap satu jam. Kami tidak menyimpan data perjalanan jangka panjang untuk meminimalisir risiko kebocoran informasi pribadi.

Keselamatan di Jalan
Keselamatan adalah prioritas utama. Kami mengimbau seluruh pengguna untuk selalu menaati aturan lalu lintas dan melakukan verifikasi titik jemput yang akurat. Harap diingat bahwa segala interaksi di luar sistem koordinasi platform sepenuhnya merupakan tanggung jawab pribadi masing-masing pengguna.

Landasan Hukum & Etika
Platform ini dikembangkan dengan mematuhi etika bermasyarakat dan ketentuan UU ITE terkait pemanfaatan teknologi yang bertanggung jawab. Dengan menggunakan layanan ini, Anda sepakat untuk saling menghargai, menjaga ketertiban, dan berkontribusi pada ekosistem komunitas yang sehat serta saling mendukung.`;
    
    bukaModalInfo('Tentang Kami', narasi);
}

/**
 * Membuka bilah menu samping (Sidebar Menu) dengan transisi opasitas tipis.
 */
function bukaMenu() {
    const menu = document.getElementById('menu-side');
    menu.classList.remove('hidden');
    setTimeout(() => menu.classList.add('opacity-100'), 10);
}

/**
 * Menutup dan menyembunyikan bilah menu samping (Sidebar Menu) kembali dari layar.
 */
function tutupMenu() {
    const menu = document.getElementById('menu-side');
    menu.classList.add('hidden');
    menu.classList.remove('opacity-100');
}

/**
 * Mengisi judul dan isi pesan teks ke dalam struktur Modal Informasi Global, 
 * lalu menampilkannya ke pengguna.
 */
function bukaModalInfo(judul, pesan) {
    document.getElementById('info-title').innerText = judul;
    document.getElementById('info-text').innerText = pesan;
    document.getElementById('modal-info').classList.remove('hidden');
}

/**
 * Menyembunyikan/menutup elemen Modal Informasi Global dari layar.
 */
function tutupModalInfo() {
    document.getElementById('modal-info').classList.add('hidden');
}

/**
 * Mengakses API Geolocation bawaan browser ponsel untuk mendeteksi koordinat GPS pengguna saat ini,
 * lalu mengubahnya menjadi link Google Maps otomatis untuk mempermudah titik penjemputan.
 */
async function getLokasiOtomatis() {
    const inputLink = document.getElementById('geo-link');
    const btn = document.getElementById('btn-lokasi');
    const text = document.getElementById('text-lokasi');
    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
    
    if (navigator.geolocation) {
        text.innerText = "Mendeteksi...";
        navigator.geolocation.getCurrentPosition((pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            // Menyusun link pencarian koordinat presisi Google Maps api v1
            inputLink.value = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
            text.innerText = "Lokasi Ditemukan!";
            // Mengubah visual tombol menjadi warna hijau sukses tanda koordinat sukses terkunci
            btn.classList.add('border-green-500', 'text-green-600', 'bg-green-50');
        }, (err) => { 
            alert("Gagal mendapatkan lokasi. Pastikan izin lokasi aktif."); 
            text.innerText = "Dapatkan Lokasi Saya"; 
        }, options);
    } else {
        alert("Browser tidak mendukung geolokasi.");
    }
}


// =========================================================================
// 🚗 LOGIKA SEKTOR INDUK LAYANAN TEBENGAN JOK (RIDE SHARING MATCHING)
// =========================================================================

/**
 * Menarik data perjalanan tebengan aktif dari database Supabase yang berdurasi 
 * maksimal 1 jam terakhir, diurutkan dari yang paling baru dirilis.
 */
async function loadDataTebengan() {
    const container = document.getElementById('modal-data-container');
    container.innerHTML = '<p class="text-white text-center p-4">Memuat data...</p>';
    try {
        // Membuat batasan waktu mundur 60 menit dari detik ini menggunakan standar format ISO String
        const satuJamLalu = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        
        const { data, error } = await sb
            .from(TABLE_TEBENGAN)
            .select('*')
            .gte('created_at', satuJamLalu) // Filter data: hanya ambil yang waktu dibuatnya >= 1 jam lalu
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        semuaData = data; // Memasukkan hasil query data ke dalam array global untuk kebutuhan pemfilteran offline
        tampilkanData(semuaData);
    } catch (e) { 
        container.innerHTML = '<p class="text-white text-center p-4">Gagal memuat data.</p>'; 
    }
}

/**
 * Menyusun data array tebengan menjadi struktur card HTML rapi, lengkap dengan
 * tautan koordinat peta, integrasi Chat WA langsung ke driver, serta fitur laporkan pelanggaran.
 */
function tampilkanData(data) {
    const container = document.getElementById('modal-data-container');
    container.innerHTML = data.length > 0 ? data.map(item => `
        <div class="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
            <div class="flex justify-between items-center">
                <h4 class="font-bold text-gray-800">${item.nama}</h4>
                <span class="text-blue-600 font-black">${item.jam_berangkat}</span>
            </div>
            <div class="text-sm text-gray-600 my-1"><i class="fa-solid fa-location-dot mr-1 text-blue-500"></i> ${item.tujuan}</div>
            <div class="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg inline-block mt-1">Tarif: ${item.tarif || '-'}</div>
            <div class="mt-3 flex gap-2">
                <a href="${item.titik_jemput}" target="_blank" class="flex-1 text-center bg-gray-100 py-2 rounded-xl text-sm font-bold text-gray-700">Peta</a>
                <a href="https://wa.me/${item.no_wa.replace(/\D/g, '')}?text=Halo%20${item.nama.split(' ')[0]},%20saya%20tertarik%20tebengan%20ke%20${item.tujuan}" target="_blank" class="flex-[2] text-center bg-green-500 py-2 rounded-xl text-white text-sm font-bold shadow-md">Chat Driver</a>
            </div>
            <div class="mt-2 text-center">
                <a href="https://wa.me/6282292067618?text=Halo%20Admin,%20saya%20ingin%20melaporkan%20pengemudi%20${item.nama}%20dengan%20tujuan%20${item.tujuan}%20karena:%20" target="_blank" class="text-[10px] text-red-500 underline font-medium">
                    <i class="fa-solid fa-flag mr-1"></i> Laporkan pelanggaran
                </a>
            </div>
        </div>`).join('') : '<p class="text-white text-center">Data tidak ditemukan.</p>';
}

/**
 * Menangkap event submit form pengisian bagikan jok tebengan baru, memvalidasi muatan
 * payload data, dan menyimpannya secara terstruktur ke tabel database Supabase.
 */
document.getElementById('nebengForm').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true; // Mengunci tombol sementara dari klik ganda pengakses
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Mengirim...';
    
    try {
        const formData = new FormData(e.target);
        const payload = {
            nama: formData.get('Nama'),
            tujuan: formData.get('Tujuan'),
            titik_jemput: formData.get('Titik Jemput'),
            tarif: Number(formData.get('Tarif')),
            jam_berangkat: formData.get('Jam Berangkat'),
            no_wa: formData.get('No WA')
        };
        // Perintah menyisipkan (insert) payload baris baru ke tabel tebengan
        const { error } = await sb.from(TABLE_TEBENGAN).insert([payload]);
        if (error) throw error;
        
        tutupFormBagikan();
        tampilNotif(); // Membuka bar info melayang sukses di atas layar
        e.target.reset(); // Mengosongkan isian form kembali bersih
    } catch (error) { 
        console.error('Gagal mengirim data:', error);
        alert('Gagal mengirim data.'); 
    } 
    finally { 
        submitBtn.disabled = false; 
        submitBtn.innerHTML = '<i class="fa-solid fa-rocket mr-2"></i> Mulai Bagikan Jok'; 
    }
};

/**
 * Memfilter tampilan data tebengan secara offline/real-time berdasarkan input teks kata kunci tujuan
 * dan rentang waktu pengelompokan jam berangkat (Pagi, Siang, Sore, Malam).
 */
function filterData() {
    const teks = document.getElementById('filterTujuan').value.toLowerCase();
    const waktu = document.getElementById('filterWaktu').value;
    
    const hasil = semuaData.filter(item => {
        const cocokTujuan = item.tujuan.toLowerCase().includes(teks);
        let cocokWaktu = true;
        
        if (item.jam_berangkat) {
            // Mengambil angka jam dari depan string format (misal "08.30" diambil angka 8)
            const jam = parseInt(item.jam_berangkat.split('.')[0]);
            if (waktu === 'Pagi') cocokWaktu = (jam >= 5 && jam < 11);
            else if (waktu === 'Siang') cocokWaktu = (jam >= 11 && jam < 15);
            else if (waktu === 'Sore') cocokWaktu = (jam >= 15 && jam < 18);
            else if (waktu === 'Malam') cocokWaktu = (jam >= 18 || jam < 5);
        }
        return cocokTujuan && cocokWaktu;
    });
    tampilkanData(hasil);
}


// =========================================================================
// 🔒 PENGONTROL MODAL ALUR KEAMANAN (FORM & MODAL TRIGGER)
// =========================================================================

/**
 * Pengaman pintu gerbang Form Bagikan Jok. Memeriksa ketersediaan session login aktif[cite: 3].
 * Jika tidak ditemukan, form ditolak dan modal login langsung dipaksa keluar[cite: 3].
 */
async function bukaFormBagikan() { 
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
        bukaModalLogin(); // Hadang user non-aktif[cite: 3]
        return;
    }
    document.getElementById('modal-form-bagikan').classList.remove('hidden'); 
}

/**
 * Menutup/menyembunyikan panel Modal Form Pengisian Bagikan Jok.
 */
function tutupFormBagikan() { 
    document.getElementById('modal-form-bagikan').classList.add('hidden'); 
}

/**
 * Pengaman pintu gerbang Form Cari Jok. Memeriksa ketersediaan session login aktif[cite: 3].
 * Jika terverifikasi aktif, modal pencarian jok dibuka dan query data tebengan dijalankan[cite: 3].
 */
async function bukaModalCariJok() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
        bukaModalLogin(); // Hadang user non-aktif[cite: 3]
        return;
    }
    document.getElementById('modal-jok').classList.remove('hidden');
    loadDataTebengan(); 
}

/**
 * Menutup/menyembunyikan jendela Modal Dashboard List Data Cari Jok.
 */
function tutupModal() { 
    document.getElementById('modal-jok').classList.add('hidden'); 
}

/**
 * Membuka jendela dialog Modal informasi dukungan pendanaan donasi Sobat Tentena.
 */
function bukaDonasi() { 
    document.getElementById('modal-donasi').classList.remove('hidden'); 
}

/**
 * Menutup/menyembunyikan jendela dialog Modal informasi donasi kembali.
 */
function tutupDonasi() { 
    document.getElementById('modal-donasi').classList.add('hidden'); 
}

/**
 * Memunculkan popup notifikasi keberhasilan melayang di atas layar dengan efek transisi transparan.
 */
function tampilNotif() {
    const notif = document.getElementById('notif-berhasil');
    notif.classList.remove('hidden');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            notif.classList.remove('opacity-0');
            notif.classList.add('opacity-100');
        });
    });
}

/**
 * Menyembunyikan kembali popup notifikasi sukses melayang dengan transisi halus keluar.
 */
function tutupNotif() {
    const notif = document.getElementById('notif-berhasil');
    notif.classList.remove('opacity-100');
    notif.classList.add('opacity-0');
    setTimeout(() => notif.classList.add('hidden'), 300);
}

/**
 * Menyaring input teks nomor handphone agar hanya menerima karakter numerik dan simbol plus (+)
 * untuk menjaga kebersihan data rujukan redirect WhatsApp.
 */
function formatWA(input) {
    let value = input.value.replace(/[^\d+]/g, '');
    input.value = value;
}


// =========================================================================
// 🤖 CORE MODUL KONEKTIVITAS EDGE FUNCTION CHATBOT AI SOBAT
// =========================================================================

/**
 * Mengirim pesan teks dari input user ke server Edge Function Supabase untuk 
 * diproses oleh mesin AI, kemudian merendernya kembali ke kotak obrolan.
 */
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
        console.error(error);
    });
}

/**
 * Membuka atau menutup panel kotak obrolan mengambang Asisten Chatbot AI (Toggle View).
 */
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

/**
 * Memonitor status fungsionalitas jaringan internet pengguna secara real-time.
 * Jika internet mati, web akan otomatis mengunci layar demi mengamankan kegagalan kirim query RLS.
 */
function updateOnlineStatus() {
    if (!navigator.onLine) {
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px 20px; font-family: sans-serif;">
                <h2 style="color: #333;">Koneksi Terputus 📡</h2>
                <p style="color: #666;">Sepertinya kamu sedang offline. Silakan periksa koneksi internetmu agar bisa mencari atau membagikan jok di SOBAT.</p>
                <button onclick="window.location.reload()" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 8px; margin-top: 20px;">Coba Ulang</button>
            </div>
        `;
    }
}

// Menghubungkan fungsi detektor online ke sistem event pemantau browser resmi
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus(); // Jalankan eksekusi awal saat aplikasi pertama kali dimuat


// =========================================================================
// 🔑 GERBANG AUTENTIKASI SUPABASE (LOGIN, DAFTAR, LOGOUT)
// =========================================================================

/**
 * Membuka/menampilkan jendela dialog Modal Formulir Akun Login Email.
 */
function bukaModalLogin() {
    document.getElementById('modal-login').classList.remove('hidden');
}

/**
 * Menutup/menyembunyikan jendela dialog Modal Formulir Akun Login.
 */
function tutupModalLogin() {
    document.getElementById('modal-login').classList.add('hidden');
}

/**
 * Mengeksekusi verifikasi masuk akun menggunakan email dan kata sandi langsung ke Supabase Auth core.
 */
async function loginEmail() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    if (!email || !password) {
        alert("Harap isi email dan password Anda!");
        return;
    }

    try {
        const { error } = await sb.auth.signInWithPassword({
            email: email,
            password: password
        });
        if (error) throw error;
        
        alert("Selamat datang kembali! Login Berhasil.");
        tutupModalLogin();
        window.location.reload(); // Memperbarui status token halaman dari awal agar RLS terbuka
    } catch (err) {
        alert("Gagal masuk: " + err.message);
    }
}

/**
 * Mendaftarkan baris kredensial pengguna baru ke layanan autentikasi Supabase.
 */
async function daftarEmail() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    if (!email || !password) {
        alert("Harap lengkapi email dan password untuk mendaftar!");
        return;
    }

    try {
        const { error } = await sb.auth.signUp({
            email: email,
            password: password
        });
        if (error) throw error;
        
        alert("Pendaftaran berhasil! Akun Anda telah aktif. Silakan langsung klik tombol 'Masuk'.");
    } catch (err) {
        alert("Gagal mendaftar: " + err.message);
    }
}

/**
 * Menangani aksi tombol keluar masuk akun terpadu yang berada di bilah menu sidebar[cite: 3, 4].
 * Menghancurkan session token aktif jika pengguna memilih keluar[cite: 2].
 */
async function handleAuthAction() {
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
        if (confirm("Apakah Anda yakin ingin keluar dari akun SOBAT?")) {
            await sb.auth.signOut(); // Hancurkan session token di server Supabase[cite: 2]
            tutupMenu();
            window.location.reload();
        }
    } else {
        tutupMenu();
        bukaModalLogin(); // Buka panel login bagi user anonim[cite: 3]
    }
}


// =========================================================================
// 👤 KONTROL LOGIKA MANAJEMEN PROFIL USER (NATIVE VERSION - USER METADATA)
// =========================================================================

/**
 * Memeriksa status login aktif pengguna, menarik kustom data user_metadata dari 
 * akun terkait, menyuntikkannya ke kolom-kolom formulir, dan menampilkan modal profil[cite: 3, 4].
 */
async function bukaProfil() {
    // 1. Ambil informasi sesi login aktif ter-update dari server lokal Supabase
    const { data: { session } } = await sb.auth.getSession();
    
    // Proteksi: Jika terdeteksi belum login, cegah akses dan arahkan ke login modal[cite: 3]
    if (!session) {
        bukaModalLogin();
        return;
    }
    
    const user = session.user;
    
    // 2. Memasukkan data email yang terkunci ke dalam kolom input email profil
    document.getElementById('profil-email').value = user.email;
    
    // 3. Menarik data kustom dari user_metadata (jika pengguna sudah pernah menyimpan sebelumnya)
    const metadata = user.user_metadata || {};
    document.getElementById('profil-nama').value = metadata.full_name || '';
    document.getElementById('profil-hp').value = metadata.phone_wa || '';
    document.getElementById('profil-status').value = metadata.status_info || '';
    
    // 4. Membuka dan menampilkan jendela Modal Profil Pengguna ke layar
    document.getElementById('modal-profil').classList.remove('hidden');
}

/**
 * Menyembunyikan/menutup elemen jendela Modal Profil Pengguna dari layar.
 */
function tutupProfil() {
    document.getElementById('modal-profil').classList.add('hidden');
}

/**
 * Mengambil isian data terbaru dari form input profil (*Username*, *Nomor HP*, *Instansi*),
 * memvalidasi kelengkapan data wajib, lalu mengikatnya secara permanen ke objek `user_metadata` Supabase.
 */
async function simpanPerubahanProfil() {
    const btnSimpan = document.getElementById('btn-simpan-profil');
    const nama = document.getElementById('profil-nama').value.trim();
    const hp = document.getElementById('profil-hp').value.trim();
    const status = document.getElementById('profil-status').value.trim();
    
    // Validasi ketat: mencegah pengosongan kolom krusial demi asas keamanan data komunitas
    if (!nama || !hp) {
        alert("Nama Lengkap dan Nomor WhatsApp wajib diisi demi keamanan!");
        return;
    }
    
    // Mengubah visual tombol menjadi kondisi memuat (loading state) agar user tahu proses berjalan
    btnSimpan.disabled = true;
    btnSimpan.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin"></i> Menyimpan...`;
    
    try {
        // Mengeksekusi pembaruan data user_metadata langsung ke core server Supabase Auth
        const { data, error } = await sb.auth.updateUser({
            data: {
                full_name: nama,
                phone_wa: hp,
                status_info: status
            }
        });
        
        if (error) throw error;
        
        alert("Profil Anda berhasil diperbarui secara permanen!");
        tutupProfil();
    } catch (err) {
        alert("Gagal memperbarui profil: " + err.message);
    } finally {
        // Mengembalikan tombol aksi ke kondisi awal setelah seluruh rangkaian proses tuntas
        btnSimpan.disabled = false;
        btnSimpan.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan`;
    }
}
