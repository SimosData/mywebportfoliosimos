// Initialize IndexedDB
const dbName = 'YouTubeCloneDB';
let db;

const openDatabase = () => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = (event) => {
        console.log('Upgrading database...');
        db = event.target.result;
        const objectStore = db.createObjectStore('videos', { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('title', 'title', { unique: false });
        objectStore.createIndex('category', 'category', { unique: false });
    };

    request.onsuccess = (event) => {
        console.log('Database opened successfully.');
        db = event.target.result;
        fetchVideos();
    };

    request.onerror = (event) => {
        console.error('Database error:', event.target.errorCode);
    };
};

// Generate a thumbnail from the video file
const generateThumbnail = (file) => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        video.src = URL.createObjectURL(file);
        video.currentTime = 1; // Capture the frame at 1 second

        video.addEventListener('loadeddata', () => {
            canvas.width = video.videoWidth / 4; // Scale down the thumbnail
            canvas.height = video.videoHeight / 4;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnailData = canvas.toDataURL('image/png');
            resolve(thumbnailData);
        });

        video.addEventListener('error', (error) => {
            reject('Error generating thumbnail:', error);
        });
    });
};

// Save video to IndexedDB with thumbnail
const saveVideo = (title, file, category) => {
    if (!file.type.startsWith('video/')) {
        alert('Please upload a valid video file.');
        return;
    }

    generateThumbnail(file).then((thumbnail) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const videoData = event.target.result;

            const transaction = db.transaction(['videos'], 'readwrite');
            const objectStore = transaction.objectStore('videos');
            objectStore.add({ title, videoData, thumbnail, category, date: new Date() });

            transaction.oncomplete = () => {
                alert('Video uploaded successfully!');
                fetchVideos();
            };

            transaction.onerror = (event) => {
                console.error('Transaction error:', event.target.errorCode);
            };
        };

        reader.onerror = (event) => {
            console.error('FileReader error:', event.target.error);
        };

        reader.readAsDataURL(file); // Convert the video file to a Base64 string
    }).catch((error) => {
        console.error(error);
    });
};

// Fetch videos from IndexedDB
const fetchVideos = () => {
    const transaction = db.transaction(['videos'], 'readonly');
    const objectStore = transaction.objectStore('videos');
    const request = objectStore.getAll();

    request.onsuccess = (event) => {
        const videos = event.target.result;
        console.log('Fetched Videos:', videos); // Debug: Log the fetched videos
        displayVideos(videos);
    };

    request.onerror = (event) => {
        console.error('Fetch error:', event.target.errorCode);
    };
};

// Display videos with thumbnails
const displayVideos = (videos) => {
    const videoList = document.getElementById('videos');
    videoList.innerHTML = '';

    videos.forEach((video) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <img src="${video.thumbnail}" alt="Video Thumbnail" class="video-thumbnail">
            <h3>${video.title}</h3>
            <video controls>
                <source src="${video.videoData}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        `;
        videoList.appendChild(li);
    });
};

// Handle video upload
document.getElementById('upload-form').addEventListener('submit', (event) => {
    event.preventDefault();

    const title = document.getElementById('video-title').value;
    const file = document.getElementById('video-file').files[0];
    const category = document.getElementById('category-filter').value;

    if (title && file) {
        saveVideo(title, file, category);
        document.getElementById('upload-form').reset();
    } else {
        alert('Please provide a title and select a video file.');
    }
});

// Search videos
document.getElementById('search-bar').addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase();

    const transaction = db.transaction(['videos'], 'readonly');
    const objectStore = transaction.objectStore('videos');
    const request = objectStore.getAll();

    request.onsuccess = (event) => {
        const videos = event.target.result.filter((video) =>
            video.title.toLowerCase().includes(searchTerm)
        );
        displayVideos(videos);
    };
});

document.getElementById('category-filter').addEventListener('change', (event) => {
    const selectedCategory = event.target.value;
    // Filter videos based on the selected category
});

document.getElementById('sort-options').addEventListener('change', (event) => {
    const sortBy = event.target.value;
    // Sort videos based on the selected option
});

document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

document.getElementById('submit-comment').addEventListener('click', () => {
    const comment = document.getElementById('comment-input').value;
    // Save the comment to IndexedDB and display it
});

const dragDropArea = document.getElementById('drag-drop-area');

dragDropArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    dragDropArea.classList.add('drag-over');
});

dragDropArea.addEventListener('dragleave', () => {
    dragDropArea.classList.remove('drag-over');
});

dragDropArea.addEventListener('drop', (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    // Handle file upload
});

document.getElementById('share-button').addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Video link copied to clipboard!');
});

const backgroundVideo = document.getElementById('background-video');

// Ensure the video plays on page load
backgroundVideo.play().catch((error) => {
    console.error('Autoplay failed:', error);
});

// Open the database
openDatabase();

particlesJS('particles-js', {
    particles: {
        number: { value: 100 },
        color: { value: '#ffffff' },
        shape: { type: 'circle' },
        opacity: { value: 0.5 },
        size: { value: 3 },
        line_linked: { enable: true, color: '#ffffff' },
        move: { enable: true, speed: 2 }
    }
});

// User Authentication
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const userInfo = document.getElementById('user-info');
const userNameDisplay = document.getElementById('user-name');
const logoutButton = document.getElementById('logout-button');

// Check if a user is already logged in
const checkLoginStatus = () => {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        showUserInfo(loggedInUser);
    } else {
        showLoginForm();
    }
};

// Show login form
const showLoginForm = () => {
    loginForm.style.display = 'flex';
    userInfo.style.display = 'none';
};

// Show user info
const showUserInfo = (username) => {
    loginForm.style.display = 'none';
    userInfo.style.display = 'flex';
    userNameDisplay.textContent = username;
};

// Handle login
loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = usernameInput.value;
    const password = passwordInput.value;

    // Check if user exists in localStorage
    const storedPassword = localStorage.getItem(`user_${username}`);
    if (storedPassword) {
        if (storedPassword === password) {
            alert('Login successful!');
            localStorage.setItem('loggedInUser', username);
            showUserInfo(username);
        } else {
            alert('Incorrect password!');
        }
    } else {
        // If user doesn't exist, create a new account
        localStorage.setItem(`user_${username}`, password);
        alert('Account created successfully! You are now logged in.');
        localStorage.setItem('loggedInUser', username);
        showUserInfo(username);
    }

    // Clear input fields
    usernameInput.value = '';
    passwordInput.value = '';
});

// Handle logout
logoutButton.addEventListener('click', () => {
    localStorage.removeItem('loggedInUser');
    alert('You have been logged out.');
    showLoginForm();
});

// Check login status on page load
checkLoginStatus();