// Konfigurasi koneksi Supabase (menggantikan SheetDB & SheetMonkey)
const SUPABASE_URL = 'https://jdmvepfxiuvjsebvypfa.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6VCuASp19-VvDklo6zAspg_elcuAWf4';
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// Nama tabel Supabase untuk Papan Iklan UMKM (menggantikan API_ID/TAB_NAME SheetDB)
const TABLE_UMKM = 'iklan_umkm';
const TABLE_TEBENGAN = 'tebengan';
let semuaData = [];

// Fungsi untuk mengambil dan menampilkan data UMKM
async function loadBulletinBoard() {
    const container = document.getElementById('bulletin-container');
    
    try {
        const { data, error } = await sb.from(TABLE_UMKM).select('*');
        if (error) throw error;
        
        container.innerHTML = ''; // Bersihkan loading text
        
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'umkm-card';
            
            card.innerHTML = `
                <img src="${item.foto_url}" alt="${item.produk}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">
                <div class="umkm-name">${item.nama_umkm}</div>
                <div class="product-name">${item.produk}</div>
                <div class="product-desc">${item.deskripsi}</div>
                <button class="wa-btn" 
                    onclick="handleWaClick('${item.id}', '${item.nomor_wa}', '${item.produk}', '${item.jumlah_klik}')">
                    Hubungi Penjual via WA
                </button>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        container.innerHTML = '<p>Gagal memuat pengumuman. Silakan coba lagi nanti.</p>';
        console.error('Error fetching data:', error);
    }
}

// Fungsi Pelacakan dan Redirect (Optimistic Tracking)
async function handleWaClick(id, nomorWa, namaProduk, currentClicks) {
    // 1. Siapkan URL WhatsApp dan Pesan Otomatis
    const pesan = `Halo, saya tertarik dengan produk ${namaProduk} yang saya lihat di NebengSobat.`;
    const waUrl = `https://wa.me/${nomorWa}?text=${encodeURIComponent(pesan)}`;
    
    // 2. Langsung Buka WhatsApp di Tab Baru
    window.open(waUrl, '_blank');
    
    // 3. Lakukan proses update jumlah klik di Background
    const newClicks = parseInt(currentClicks || 0) + 1;
    
    try {
        const { error } = await sb.from(TABLE_UMKM).update({ jumlah_klik: newClicks }).eq('id', id);
        if (error) throw error;
        console.log('Tracking berhasil dicatat:', newClicks);
    } catch (error) {
        console.error('Gagal mencatat tracking:', error);
    }
}

// Jalankan fungsi saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', loadBulletinBoard);

function setAktif(id) {
    // 1. Ambil semua link di bottom-nav
    const links = document.querySelectorAll('.bottom-nav a');
    
    // 2. Hapus class 'active-nav' dari semua link
    links.forEach(link => link.classList.remove('active-nav'));
    
    // 3. Tambahkan class 'active-nav' ke link yang diklik
    document.getElementById(id).classList.add('active-nav');
}

// Splash screen
window.addEventListener('load', () => {
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        splash.style.opacity = '0';
        setTimeout(() => splash.style.display = 'none', 500);
    }, 1800); // tampil selama 1.8 detik
});

function formatJam(input) {
    let val = input.value.replace(/\D/g, ''); // Hapus semua selain angka
    if (val.length > 2) {
        val = val.substring(0, 2) + '.' + val.substring(2, 4);
    }
    input.value = val;
}

document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('tos-modal');
    const btnSetuju = document.getElementById('btn-setuju');

    // Cek status
    if (localStorage.getItem('sudahSetuju')) {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'flex';
    }

    // Pasang listener
    btnSetuju.addEventListener('click', function() {
        localStorage.setItem('sudahSetuju', 'true');
        modal.style.display = 'none';
        console.log("Status tersimpan!");
    });
});

function bukaTentangKami() {
    const narasi = `NebengSobat Tentena adalah inisiatif berbasis teknologi yang hadir untuk memfasilitasi kebutuhan mobilitas harian civitas akademika dan Pelajar Tentena dengan semangat "Dibuat oleh Sobat untuk Sobat". Kami berfokus pada efisiensi, aksesibilitas, dan penguatan nilai gotong-royong.

Keamanan Data & Privasi
Privasi adalah prioritas kami. Seluruh data bersifat sementara dan dibersihkan otomatis setiap satu jam. Kami tidak menyimpan data perjalanan jangka panjang untuk meminimalisir risiko kebocoran informasi pribadi.

Keselamatan di Jalan
Keselamatan adalah prioritas utama. Kami mengimbau seluruh pengguna untuk selalu menaati aturan lalu lintas dan melakukan verifikasi titik jemput yang akurat. Harap diingat bahwa segala interaksi di luar sistem koordinasi platform sepenuhnya merupakan tanggung jawab pribadi masing-masing pengguna.

Landasan Hukum & Etika
Platform ini dikembangkan dengan mematuhi etika bermasyarakat dan ketentuan UU ITE terkait pemanfaatan teknologi yang bertanggung jawab. Dengan menggunakan layanan ini, Anda sepakat untuk saling menghargai, menjaga ketertiban, dan berkontribusi pada ekosistem komunitas yang sehat serta saling mendukung.
`;
    
    bukaModalInfo('Tentang Kami', narasi);
}

function bukaMenu() {
    const menu = document.getElementById('menu-side');
    menu.classList.remove('hidden');
    // Efek transisi halus
    setTimeout(() => menu.classList.add('opacity-100'), 10);
}

function tutupMenu() {
    const menu = document.getElementById('menu-side');
    menu.classList.add('hidden');
    menu.classList.remove('opacity-100');
}

// Fungsi untuk memanggil modal
function bukaModalInfo(judul, pesan) {
    document.getElementById('info-title').innerText = judul;
    document.getElementById('info-text').innerText = pesan;
    document.getElementById('modal-info').classList.remove('hidden');
}

// Fungsi untuk menutup modal
function tutupModalInfo() {
    document.getElementById('modal-info').classList.add('hidden');
}

// --- TAMBAHKAN FUNGSI INI ---
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
            inputLink.value = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
            text.innerText = "Lokasi Ditemukan!";
            btn.classList.add('border-green-500', 'text-green-600', 'bg-green-50');
        }, (err) => { 
            alert("Gagal mendapatkan lokasi. Pastikan izin lokasi aktif."); 
            text.innerText = "Dapatkan Lokasi Saya"; 
        }, options);
    } else {
        alert("Browser tidak mendukung geolokasi.");
    }
}

// --- FUNGSI UTAMA ---
async function loadDataTebengan() {
    const container = document.getElementById('modal-data-container');
    container.innerHTML = '<p class="text-white text-center p-4">Memuat data...</p>';
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
    } catch (e) { container.innerHTML = '<p class="text-white text-center p-4">Gagal memuat data.</p>'; }
}

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

// --- LOGIKA FORM & NOTIFIKASI ---
document.getElementById('nebengForm').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
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
        const { error } = await sb.from(TABLE_TEBENGAN).insert([payload]);
        if (error) throw error;
        tampilNotif(); // Memanggil notifikasi keren
        e.target.reset();
    } catch (error) { 
        console.error('Gagal mengirim data:', error);
        alert('Gagal mengirim data.'); 
    } 
    finally { 
        submitBtn.disabled = false; 
        submitBtn.innerHTML = '<i class="fa-solid fa-rocket mr-2"></i> Bagikan Jok'; 
    }
};

// --- FUNGSI PENDUKUNG ---
function filterData() {
    const teks = document.getElementById('filterTujuan').value.toLowerCase();
    const waktu = document.getElementById('filterWaktu').value;
    const hasil = semuaData.filter(item => {
        const cocokTujuan = item.tujuan.toLowerCase().includes(teks);
        let cocokWaktu = true;
        if (item.jam_berangkat) {
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

document.getElementById('btn-bagikan').onclick = () => document.getElementById('nebengForm').scrollIntoView({ behavior: 'smooth' });
document.getElementById('btn-temukan').onclick = () => { document.getElementById('modal-jok').classList.remove('hidden'); loadDataTebengan(); };
function tutupModal() { document.getElementById('modal-jok').classList.add('hidden'); }
function bukaDonasi() { document.getElementById('modal-donasi').classList.remove('hidden'); }
function tutupDonasi() { document.getElementById('modal-donasi').classList.add('hidden'); }

function tampilNotif() {
    const notif = document.getElementById('notif-berhasil');
    notif.classList.remove('hidden');
    // Tunggu 1 frame agar 'hidden' benar-benar sudah dihapus sebelum animasi jalan
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            notif.classList.remove('opacity-0');
            notif.classList.add('opacity-100');
        });
    });
}

function tutupNotif() {
    const notif = document.getElementById('notif-berhasil');
    notif.classList.remove('opacity-100');
    notif.classList.add('opacity-0');
    setTimeout(() => notif.classList.add('hidden'), 300);
}

function formatWA(input) {
    // Menghapus karakter non-angka kecuali tanda '+'
    let value = input.value.replace(/[^\d+]/g, '');
    input.value = value;
}

// Script untuk membuka modal chatbot lama jika elemennya ada
if (document.getElementById('btnTanyaAI')) {
    document.getElementById('btnTanyaAI').onclick = function() {
        var modal = document.getElementById('modalChat');
        if (modal) {
            modal.style.display = (modal.style.display === 'none') ? 'block' : 'none';
        }
    };
}

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
            // TAMBAHKAN BARIS INI AGAR SUPABASE MENGIZINKAN AKSES WEBSITE ANDA
            'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({ message: pesan })
    })
    .then(response => response.json()) 
    .then(data => {
        // Pengaman ekstra: Jika sukses tampilkan reply, jika error tampilkan pesan sistem
        if (data.reply) {
            displayArea.innerText = data.reply; 
        } else {
            displayArea.innerText = "Terjadi kendala data: " + JSON.stringify(data);
        }
    })
    .catch(error => {
        displayArea.innerText = "Error: Gagal terhubung ke server AI.";
        console.error(error);
    });
}

function toggleChatbot() {
    const chatModal = document.getElementById('chat-modal');
    // Jika modal tidak terlihat, kita buka. Jika terlihat, kita tutup.
    if (chatModal.style.display === 'none' || chatModal.style.display === '') {
        chatModal.style.display = 'flex';
    } else {
        chatModal.style.display = 'none';
    }
}

// Fungsi untuk mengecek status internet
function updateOnlineStatus() {
    const mainForm = document.querySelector('.container'); // Sesuaikan dengan class/id bungkus form kamu
    
    if (!navigator.onLine) {
        // Jika Offline
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px 20px; font-family: sans-serif;">
                <h2 style="color: #333;">Koneksi Terputus 📡</h2>
                <p style="color: #666;">Sepertinya kamu sedang offline. Silakan periksa koneksi internetmu agar bisa mencari atau membagikan jok di NebengSobat.</p>
                <button onclick="window.location.reload()" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 8px; margin-top: 20px;">Coba Ulang</button>
            </div>
        `;
    }
}

// Pantau perubahan status internet
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Cek saat pertama kali dimuat
updateOnlineStatus();
