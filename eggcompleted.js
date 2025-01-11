let model;

async function loadModel() {
    if (!model) {
        try {
            model = await tf.loadGraphModel('eggking4mobilenet_web_model/model.json'); // Sesuaikan path model
            console.log('Model loaded successfully');
        } catch (error) {
            console.error('Error loading model:', error);
            alert('Gagal memuat model!');
        }
    }
}

async function proceedWithImage() {
    console.log('Lanjutkan clicked, proceeding with image.');

    const eggContainer = document.querySelector('.image-container');
    const imgElement = eggContainer.querySelector('img, canvas');

    if (!imgElement) {
        console.error('Tidak ada gambar atau canvas ditemukan!');
        alert('Gambar tidak ditemukan!');
        return;
    }

    if (!model) {
        console.error('Model belum dimuat!');
        alert('Model belum dimuat!');
        return;
    }

    // Konversi gambar atau canvas ke tensor
    const tensor = tf.browser
        .fromPixels(imgElement)
        .resizeNearestNeighbor([224, 224]) // Sesuaikan ukuran input model
        .toFloat()
        .div(tf.scalar(255)) // Normalisasi ke rentang [0, 1], sesuaikan jika model butuh normalisasi berbeda
        .expandDims();

    // Jalankan prediksi
    const predictions = await model.predict(tensor).data();
    
    // Logika untuk kelas prediksi dengan threshold 0.5
    const predictedClass = predictions[0] >= 0.5 ? 'tidak segar' : 'segar';
    console.log("Kelas Prediksi:", predictedClass);

    // Arahkan ke halaman hasil dengan parameter hasil prediksi
    window.location.href = `eggcompletedresult.html?result=${encodeURIComponent(predictedClass)}`;
}

// Fungsi untuk menginisialisasi tombol dan fungsi lainnya tetap sama seperti sebelumnya.
function initializeButtons() {
    const takePhotoBtn = document.querySelector('.green-btn');
    const chooseGalleryBtn = document.querySelector('.yellow-btn');

    if (takePhotoBtn && chooseGalleryBtn) {
        takePhotoBtn.onclick = takePhoto;
        chooseGalleryBtn.onclick = chooseFromGallery;
    } else {
        console.error('Buttons not found during initial load.');
    }
}

// Fungsi untuk membuka kamera dan mengambil foto
// Fungsi untuk membuka kamera dan mengambil foto
// Fungsi untuk membuka kamera perangkat dan mengambil foto
let videoStream = null;
let usingBackCamera = true; // Default menggunakan kamera belakang

// Fungsi untuk membuka kamera dan menampilkan kontrol tombol
function takePhoto() {
    const eggContainer = document.querySelector('.image-container');
    eggContainer.innerHTML = ''; // Kosongkan kontainer gambar

    const videoElement = document.createElement('video');
    videoElement.setAttribute('autoplay', true);
    videoElement.setAttribute('playsinline', true); // Untuk kompatibilitas mobile
    videoElement.style.width = '100%';
    eggContainer.appendChild(videoElement); // Tambahkan elemen video ke kontainer

    // Tombol tangkap gambar
    const captureButton = document.createElement('button');
    captureButton.textContent = 'Tangkap Gambar';
    captureButton.classList.add('capture-btn');
    eggContainer.appendChild(captureButton);

    // Tombol ganti kamera
    const switchCameraButton = document.createElement('button');
    switchCameraButton.textContent = 'Ganti Kamera';
    switchCameraButton.classList.add('switch-camera-btn');
    eggContainer.appendChild(switchCameraButton);

    // Tombol kembali
    const backButton = document.createElement('button');
    backButton.textContent = 'Kembali';
    backButton.classList.add('back-btn');
    eggContainer.appendChild(backButton);

    // Event listeners untuk tombol
    captureButton.onclick = () => captureImage(videoElement);
    switchCameraButton.onclick = () => switchCamera(videoElement);
    backButton.onclick = () => {
        stopVideoStream(); // Hentikan kamera
        resetToEggAnimation(); // Kembali ke tampilan awal
    };

    // Akses kamera
    startCamera(videoElement);
}

// Fungsi untuk memulai kamera
async function startCamera(videoElement) {
    stopVideoStream(); // Pastikan stream lama dihentikan
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: usingBackCamera ? 'environment' : 'user' },
        });
        videoElement.srcObject = videoStream;
        videoElement.onloadedmetadata = () => videoElement.play();
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan.');
    }
}

// Fungsi untuk mengganti kamera
function switchCamera(videoElement) {
    usingBackCamera = !usingBackCamera; // Ganti antara kamera depan dan belakang
    startCamera(videoElement); // Restart kamera dengan mode baru
}

// Fungsi untuk menangkap gambar dari video
function captureImage(videoElement) {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    stopVideoStream(); // Hentikan kamera

    displaySelectedImage(canvas.toDataURL('image/png')); // Tampilkan gambar hasil tangkapan
    updateButtonsAfterImage(); // Perbarui tombol setelah gambar ditangkap
}

// Fungsi untuk menghentikan stream video
function stopVideoStream() {
    if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop()); // Hentikan semua stream aktif
        videoStream = null; // Reset stream ke null
    }
}

// Fungsi untuk menampilkan gambar yang ditangkap
function displaySelectedImage(imageSrc) {
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.width = '100px';
    img.style.height = '130px';

    const eggContainer = document.querySelector('.image-container');
    eggContainer.innerHTML = ''; // Hapus video
    eggContainer.appendChild(img); // Tampilkan gambar
}







async function captureImage(videoElement, stream) {
    // Buat canvas untuk menangkap gambar dari video
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Hentikan stream video setelah gambar ditangkap
    stream.getTracks().forEach((track) => track.stop());

    // Lakukan identifikasi gambar setelah gambar ditangkap
    await identifyAndRedirect(canvas);
}

async function identifyAndRedirect(canvas) {
    if (!model) {
        console.error('Model belum dimuat!');
        alert('Model belum dimuat!');
        return;
    }

    // Konversi gambar dari canvas ke tensor
    const tensor = tf.browser
        .fromPixels(canvas)
        .resizeNearestNeighbor([224, 224]) // Sesuaikan ukuran input model
        .toFloat()
        .div(tf.scalar(255)) // Normalisasi
        .expandDims();

    try {
        // Prediksi menggunakan model
        const predictions = await model.predict(tensor).data();
        
        // Logika untuk kelas prediksi dengan threshold 0.5
        const predictedClass = predictions[0] >= 0.5 ? 'tidak segar' : 'segar';
        console.log("Kelas Prediksi:", predictedClass);

        // Arahkan ke halaman hasil dengan parameter hasil prediksi
        window.location.href = `eggcompletedresult.html?result=${encodeURIComponent(predictedClass)}`;
    } catch (error) {
        console.error('Error saat melakukan prediksi:', error);
        alert('Gagal melakukan identifikasi gambar!');
    }
}

// Fungsi untuk membuka galeri dan memilih foto
function chooseFromGallery() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.onchange = function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                displaySelectedImage(e.target.result);
                updateButtonsAfterImage();
            };
            reader.readAsDataURL(file);
        }
    };

    fileInput.click();
}

// Fungsi untuk menampilkan gambar yang dipilih dari galeri
function displaySelectedImage(imageSrc) {
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.width = '100px';
    img.style.height = '130px';

    const eggContainer = document.querySelector('.image-container');
    eggContainer.innerHTML = '';
    eggContainer.appendChild(img);
}

// Fungsi untuk mengubah tombol "Ambil Foto" menjadi "Kembali" dan "Pilih dari Galeri" menjadi "Lanjutkan"
function updateButtonsAfterImage() {
    const takePhotoBtn = document.querySelector('.green-btn');
    const chooseGalleryBtn = document.querySelector('.yellow-btn');

    if (takePhotoBtn && chooseGalleryBtn) {
        takePhotoBtn.textContent = 'Kembali';
        chooseGalleryBtn.textContent = 'Lanjutkan';

        // Update button functionality
        takePhotoBtn.onclick = resetToEggAnimation;
        chooseGalleryBtn.onclick = proceedWithImage;
    }
}

// Fungsi untuk mengembalikan tampilan ke animasi telur awal
function resetToEggAnimation() {
    const eggContainer = document.querySelector('.image-container');
    eggContainer.innerHTML = `
        <div class="egg"></div>
        <div class="egg-shadow"></div>
    `;

    const takePhotoBtn = document.querySelector('.green-btn');
    const chooseGalleryBtn = document.querySelector('.yellow-btn');

    if (takePhotoBtn && chooseGalleryBtn) {
        takePhotoBtn.textContent = 'Ambil Foto';
        chooseGalleryBtn.textContent = 'Pilih dari Galeri';

        takePhotoBtn.onclick = takePhoto;
        chooseGalleryBtn.onclick = chooseFromGallery;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadModel();
    initializeButtons();
});
