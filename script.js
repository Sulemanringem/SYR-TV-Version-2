// Config
const YT_API_KEY = 'AIzaSyCgBmV2-W0AUvlqk7po_i1byEii3Bv3Puo';
const GOOGLE_CLIENT_ID = '589005932399-6up9c79vtirn6p74ufdc4jjsvsclijl6.apps.googleusercontent.com';
const SYR_API = 'https://api.syr-tv.com';

// State
let currentUser = null;
let currentVideo = null;
let currentSource = 'youtube';
let googleAuthInitialized = false;
let searchTimeout = null;
let recognition = null;
let searchHistory = [];
let trendingSearches = ['New video', 'Shorts', 'Music', 'Gaming', 'Live'];

// DOM Elements
const dom = {
  loading: document.getElementById('loading-overlay'),
  videoGrid: document.getElementById('video-grid'),
  player: document.getElementById('video-player'),
  closePlayer: document.getElementById('close-player'),
  likeBtn: document.getElementById('like-btn'),
  platformBtns: document.querySelectorAll('.platform-btn'),
  searchInput: document.getElementById('search-input'),
  searchForm: document.getElementById('search-form'),
  searchSuggestions: document.getElementById('search-suggestions'),
  searchHistory: document.getElementById('search-history'),
  searchChips: document.getElementById('search-chips'),
  trendingChips: document.getElementById('trending-chips'),
  micButton: document.getElementById('mic-button'),
  mobileSearchBtn: document.getElementById('mobile-search-btn'),
  headerCenter: document.querySelector('.header-center'),
  playerInfo: document.querySelector('.player-info-container'),
  playerTitle: document.getElementById('player-video-title'),
  playerChannel: document.getElementById('player-channel-name'),
  videoIframe: document.getElementById('video-iframe'),
  sidebar: document.getElementById('sidebar'),
  menuIcon: document.querySelector('.menu-icon'),
  commentInput: document.getElementById('comment-input'),
  commentButton: document.getElementById('comment-button'),
  commentsList: document.getElementById('comments-list'),
  uploadBtn: document.getElementById('upload-btn'),
  uploadModal: document.getElementById('upload-modal'),
  closeModal: document.querySelector('.close-modal'),
  uploadForm: document.getElementById('upload-form'),
  userDropdown: document.getElementById('user-dropdown'),
  userAvatar: document.getElementById('user-avatar'),
  signinBtn: document.getElementById('signin-btn'),
  signoutBtn: document.getElementById('signout-btn'),
  sidebarLinks: document.querySelectorAll('.nav-link'),
  homeLink: document.getElementById('home-link'),
  likedVideosLink: document.getElementById('liked-videos-link'),
  historyLink: document.getElementById('history-link')
};
  window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');

    // Create video element
    const startupVideo = document.createElement('video');
    startupVideo.id = 'startup-video';
    startupVideo.autoplay = true;
    startupVideo.muted = true;
    startupVideo.playsInline = true;

    // Set source with GitHub Pages path check
    const source = document.createElement('source');
    source.src = location.pathname.includes('SYR-TV') ? '/SYR-TV/startup-animation.mp4' : './startup-animation.mp4';
    source.type = 'video/mp4';
    startupVideo.appendChild(source);

    // Apply styles inline
    Object.assign(startupVideo.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      objectFit: 'cover',
      backgroundColor: '#000',
      zIndex: '10000',
      opacity: '0',
      transition: 'opacity 0.5s ease-in-out',
      pointerEvents: 'none'
    });

    document.body.appendChild(startupVideo);
    console.log('Video element added');

    // Show video when first frame is loaded
    startupVideo.addEventListener('loadeddata', () => {
      console.log('Video loadeddata');
      startupVideo.style.opacity = '1';
    });

    // Log play event
    startupVideo.addEventListener('play', () => {
      console.log('Video started playing');
    });

    // Fade out and remove on video end
    startupVideo.addEventListener('ended', () => {
      console.log('Video ended, removing it');
      startupVideo.style.opacity = '0';
      setTimeout(() => {
        if (startupVideo.parentNode) {
          startupVideo.remove();
          console.log('Video element removed after fade-out');
        }
      }, 500); // Wait for fade-out
    });

    // Fallback: Remove after 7 seconds
    setTimeout(() => {
      if (startupVideo.parentNode) {
        console.log('Fallback timeout reached, forcing removal');
        startupVideo.style.opacity = '0';
        setTimeout(() => {
          if (startupVideo.parentNode) startupVideo.remove();
        }, 500);
      }
    }, 7000);
  });
// Initialize
document.addEventListener('DOMContentLoaded', () => {
  dom.loading.style.display = 'flex';
  setTimeout(initApp, 100);
});

function initApp() {
  setupEventListeners();
  checkAuth();
  loadVideos();
  initGoogleAuth();
  initVoiceSearch();
  
  // Load search history if not logged in
  if (!currentUser) {
    const savedHistory = localStorage.getItem('syr-tv-search-history');
    searchHistory = savedHistory ? JSON.parse(savedHistory) : [];
    dom.signinBtn.style.display = 'flex';
  }
}

// Google Auth Initialization
function initGoogleAuth() {
  if (typeof google !== 'undefined' && !googleAuthInitialized) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleSignIn,
      ux_mode: 'popup'
    });
    googleAuthInitialized = true;
    
    // Render the sign-in button
    renderGoogleSignInButton();
    
    if (window.innerWidth <= 768) {
      google.accounts.id.prompt();
    }
  } else if (typeof google === 'undefined') {
    setTimeout(initGoogleAuth, 300);
  }
}

// Render Google Sign-In Button
function renderGoogleSignInButton() {
  if (!google.accounts || !google.accounts.id) {
    setTimeout(renderGoogleSignInButton, 100);
    return;
  }
  
  dom.signinBtn.innerHTML = '';
  
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'center';
  buttonContainer.style.alignItems = 'center';
  buttonContainer.style.minWidth = '120px';
  buttonContainer.style.height = '40px';
  
  google.accounts.id.renderButton(
    buttonContainer,
    {
      theme: "outline",
      size: "medium",
      width: "auto",
      text: "signin_with",
      shape: "pill",
      logo_alignment: "left"
    }
  );
  
  dom.signinBtn.appendChild(buttonContainer);
  dom.signinBtn.style.display = 'flex';
  dom.signinBtn.style.visibility = 'visible';
}

// Voice Search Initialization
function initVoiceSearch() {
  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      dom.searchInput.value = transcript;
      searchVideos(transcript);
    };
    
    recognition.onerror = (event) => {
      console.error('Voice recognition error', event.error);
    };
  } else {
    dom.micButton.style.display = 'none';
  }
}

// Search History Functions
function updateSearchHistory(query) {
  if (!query.trim()) return;
  
  searchHistory = searchHistory.filter(item => item !== query);
  searchHistory.unshift(query);
  searchHistory = searchHistory.slice(0, 5);
  
  if (currentUser) {
    if (!currentUser.syrData) currentUser.syrData = { likes: [], history: [] };
    currentUser.syrData.searchHistory = searchHistory;
    saveUserData();
  } else {
    localStorage.setItem('syr-tv-search-history', JSON.stringify(searchHistory));
  }
  
  renderSearchHistory();
}

function renderSearchHistory() {
  if (!dom.searchChips || !dom.trendingChips) return;
  
  dom.searchChips.innerHTML = '';
  dom.trendingChips.innerHTML = '';
  
  searchHistory.forEach(query => {
    const chip = document.createElement('div');
    chip.className = 'search-chip';
    chip.innerHTML = `<span class="material-icons">history</span>${query}`;
    chip.addEventListener('click', () => {
      dom.searchInput.value = query;
      searchVideos(query);
    });
    dom.searchChips.appendChild(chip);
  });
  
  trendingSearches.forEach(query => {
    const chip = document.createElement('div');
    chip.className = 'search-chip';
    chip.innerHTML = `<span class="material-icons">trending_up</span>${query}`;
    chip.addEventListener('click', () => {
      dom.searchInput.value = query;
      searchVideos(query);
    });
    dom.trendingChips.appendChild(chip);
  });
}

// Event Listeners
function setupEventListeners() {
  // Platform switching
  dom.platformBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.platformBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSource = btn.dataset.platform;
      loadVideos();
    });
  });

  // Search functionality
  dom.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    searchVideos(dom.searchInput.value);
  });
  
  dom.searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    if (dom.searchInput.value.length > 2) {
      searchTimeout = setTimeout(() => {
        fetchSearchSuggestions(dom.searchInput.value);
      }, 300);
    } else {
      dom.searchSuggestions.innerHTML = '';
    }
  });
  
  // Voice search
  dom.micButton.addEventListener('click', toggleVoiceSearch);

  // Mobile search
  dom.mobileSearchBtn.addEventListener('click', toggleMobileSearch);

  // Sidebar navigation
  dom.menuIcon.addEventListener('click', toggleSidebar);
  
  // Sidebar links
  dom.sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.id.replace('sidebar-', '');
      handleSidebarNavigation(id);
    });
  });

  // Auth
  dom.signoutBtn.addEventListener('click', signOut);
  dom.likedVideosLink.addEventListener('click', showLikedVideos);
  dom.historyLink.addEventListener('click', showWatchHistory);
  dom.homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    loadVideos();
  });

  // Video player controls
  dom.closePlayer.addEventListener('click', closeVideoPlayer);
  
  // Comments
  dom.commentButton.addEventListener('click', addComment);
  dom.commentInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addComment();
    }
  });

  // Upload modal
  dom.uploadBtn.addEventListener('click', () => {
    dom.uploadModal.style.display = 'flex';
  });
  
  dom.closeModal.addEventListener('click', () => {
    dom.uploadModal.style.display = 'none';
  });
  
  dom.uploadForm.addEventListener('submit', handleUpload);

  // Fullscreen change event
  document.addEventListener('fullscreenchange', handleFullscreenChange);
}

function handleFullscreenChange() {
  if (!document.fullscreenElement) {
    dom.player.classList.remove('landscape-fullscreen');
    if (screen.orientation?.unlock) {
      screen.orientation.unlock();
    }
  }
}

// Mobile Search
function toggleMobileSearch() {
  if (window.innerWidth > 768) return;
  
  dom.headerCenter.classList.toggle('active');
  if (dom.headerCenter.classList.contains('active')) {
    if (currentUser?.syrData?.searchHistory) {
      searchHistory = currentUser.syrData.searchHistory;
    } else {
      const savedHistory = localStorage.getItem('syr-tv-search-history');
      searchHistory = savedHistory ? JSON.parse(savedHistory) : [];
    }
    renderSearchHistory();
    dom.searchInput.focus();
    document.querySelector('.filter-bar').style.display = 'none';
  } else {
    document.querySelector('.filter-bar').style.display = 'flex';
    loadVideos();
  }
}

// Search functionality
async function searchVideos(query) {
  if (!query.trim()) return;
  
  showLoading();
  try {
    let videos = [];
    if (currentSource === 'youtube') {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${YT_API_KEY}`);
      const data = await res.json();
      videos = data.items || [];
    } else {
      const res = await fetch(`${SYR_API}/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      videos = data.videos || [];
    }
    
    displayVideos(videos);
    dom.searchSuggestions.innerHTML = '';
    updateSearchHistory(query);
    
    if (dom.headerCenter.classList.contains('active')) {
      dom.headerCenter.classList.remove('active');
      document.querySelector('.filter-bar').style.display = 'flex';
    }
  } catch (error) {
    console.error("Search error:", error);
    dom.videoGrid.innerHTML = `
      <div class="no-results">
        <span class="material-icons">error</span>
        <p>Error searching videos</p>
      </div>
    `;
  } finally {
    hideLoading();
  }
}

async function fetchSearchSuggestions(query) {
  if (currentSource !== 'youtube') return;
  
  try {
    const res = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`);
    const data = await res.json();
    const suggestions = data[1] || [];
    
    dom.searchSuggestions.innerHTML = '';
    suggestions.forEach(suggestion => {
      const suggestionEl = document.createElement('div');
      suggestionEl.className = 'suggestion-item';
      suggestionEl.textContent = suggestion;
      suggestionEl.addEventListener('click', () => {
        dom.searchInput.value = suggestion;
        searchVideos(suggestion);
      });
      dom.searchSuggestions.appendChild(suggestionEl);
    });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
  }
}

// Voice Search
function toggleVoiceSearch() {
  if (!recognition) return;
  
  if (dom.micButton.classList.contains('recording')) {
    recognition.stop();
    dom.micButton.classList.remove('recording');
  } else {
    recognition.start();
    dom.micButton.classList.add('recording');
    dom.searchInput.placeholder = 'Listening...';
    
    recognition.onend = () => {
      dom.micButton.classList.remove('recording');
      dom.searchInput.placeholder = 'Search';
    };
  }
}

// Sidebar Navigation
function toggleSidebar() {
  dom.sidebar.classList.toggle('active');
}

function handleSidebarNavigation(section) {
  switch(section) {
    case 'home':
      loadVideos();
      break;
    case 'subscriptions':
      alert('Subscriptions feature coming soon!');
      break;
    case 'library':
      alert('Library feature coming soon!');
      break;
    case 'history':
      showWatchHistory({preventDefault: () => {}});
      break;
    case 'liked':
      showLikedVideos({preventDefault: () => {}});
      break;
  }
  
  dom.sidebarLinks.forEach(link => {
    link.classList.remove('active');
    if (link.id === `sidebar-${section}`) {
      link.classList.add('active');
    }
  });
  
  if (window.innerWidth <= 768) {
    dom.sidebar.classList.remove('active');
  }
}

// Video Loading
async function loadVideos() {
  showLoading();
  try {
    const videos = currentSource === 'youtube' 
      ? await fetchYTVideos() 
      : await fetchSYRVideos();
    displayVideos(videos);
    document.querySelector('.filter-bar').style.display = 'flex';
  } catch (error) {
    console.error("Error loading videos:", error);
    dom.videoGrid.innerHTML = `
      <div class="no-results">
        <span class="material-icons">error</span>
        <p>Error loading ${currentSource} videos</p>
      </div>
    `;
  } finally {
    hideLoading();
  }
}

// YouTube API
async function fetchYTVideos() {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=20&key=${YT_API_KEY}`);
  const data = await res.json();
  return data.items || [];
}

// SYR TV API
async function fetchSYRVideos() {
  try {
    const res = await fetch(`${SYR_API}/videos`);
    const data = await res.json();
    return data.videos || [];
  } catch (error) {
    console.error("Error fetching SYR videos:", error);
    return [
      {
        id: 'syr1',
        snippet: {
          title: 'SYR TV Demo Video',
          channelTitle: 'SYR TV Official',
          thumbnails: {
            medium: { url: 'https://via.placeholder.com/320x180' }
          }
        }
      },
      {
        id: 'syr2',
        snippet: {
          title: 'Another SYR Video',
          channelTitle: 'SYR TV Official',
          thumbnails: {
            medium: { url: 'https://via.placeholder.com/320x180' }
          }
        }
      }
    ];
  }
}

// Display Videos
function displayVideos(videos) {
  dom.videoGrid.innerHTML = '';
  
  if (!videos || videos.length === 0) {
    dom.videoGrid.innerHTML = `
      <div class="no-results">
        <span class="material-icons">video_library</span>
        <p>No videos found</p>
      </div>
    `;
    return;
  }

  videos.forEach(video => {
    const videoEl = createVideoElement(video);
    dom.videoGrid.appendChild(videoEl);
  });
}

function createVideoElement(video) {
  const el = document.createElement('div');
  el.className = 'video-card';
  
  const thumbnail = video.snippet?.thumbnails?.medium?.url || video.thumbnail;
  const title = video.snippet?.title || video.title;
  const channel = video.snippet?.channelTitle || video.channel;
  const videoId = video.id?.videoId || video.id;
  
  el.innerHTML = `
    <img src="${thumbnail}" class="video-thumbnail" alt="${title}">
    <div class="video-info">
      <img src="https://via.placeholder.com/36" class="channel-avatar" alt="${channel}">
      <div class="video-details">
        <h3 class="video-title">${title}</h3>
        <span class="video-source ${currentSource}">${currentSource.toUpperCase()}</span>
        <p class="channel-name">${channel}</p>
      </div>
    </div>
  `;
  el.addEventListener('click', () => playVideo({...video, id: videoId}));
  return el;
}

// Player Controls
function playVideo(video) {
  currentVideo = video;
  dom.playerTitle.textContent = video.snippet?.title || video.title;
  dom.playerChannel.textContent = video.snippet?.channelTitle || video.channel;
  
  if (currentSource === 'youtube') {
    dom.videoIframe.src = `https://www.youtube.com/embed/${video.id}?autoplay=1&enablejsapi=1`;
  } else {
    dom.videoIframe.src = `${SYR_API}/embed/${video.id}`;
  }

  // Create rotate button if it doesn't exist
  if (!document.querySelector('.rotate-btn')) {
    const rotateBtn = document.createElement('button');
    rotateBtn.className = 'rotate-btn';
    rotateBtn.innerHTML = '<span class="material-icons">screen_rotation</span>';
    rotateBtn.addEventListener('click', toggleRotateScreen);
    
    // Add to player controls
    const playerActions = document.querySelector('.player-actions');
    if (playerActions) {
      playerActions.appendChild(rotateBtn);
    }
  }
  
  updateLikeButton();
  loadComments();
  dom.player.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  if (currentUser) {
    addToHistory(video);
  }
}

function toggleRotateScreen() {
  if (!document.fullscreenElement) {
    // Enter fullscreen and lock orientation
    dom.player.requestFullscreen().then(() => {
      if (screen.orientation?.lock) {
        screen.orientation.lock('landscape').catch(err => {
          console.log('Orientation lock failed: ', err);
        });
      }
      dom.player.classList.add('landscape-fullscreen');
    }).catch(err => {
      console.log('Fullscreen failed: ', err);
    });
  } else {
    // Exit fullscreen and unlock orientation
    document.exitFullscreen().then(() => {
      dom.player.classList.remove('landscape-fullscreen');
      if (screen.orientation?.unlock) {
        screen.orientation.unlock();
      }
    });
  }
}

function closeVideoPlayer() {
  if (document.fullscreenElement) {
    document.exitFullscreen().then(() => {
      actuallyClosePlayer();
    });
  } else {
    actuallyClosePlayer();
  }
}

function actuallyClosePlayer() {
  dom.videoIframe.src = '';
  dom.player.style.display = 'none';
  document.body.style.overflow = 'auto';
  
  // Remove rotate button if it exists
  const rotateBtn = document.querySelector('.rotate-btn');
  if (rotateBtn) {
    rotateBtn.remove();
  }
  
  // Unlock orientation if locked
  if (screen.orientation?.unlock) {
    screen.orientation.unlock();
  }
}

// Comments System
function loadComments() {
  if (!currentVideo) return;
  
  const comments = [
    {
      id: 1,
      author: 'User1',
      text: 'This video is amazing!',
      timestamp: '2023-05-15T10:30:00Z',
      likes: 42
    },
    {
      id: 2,
      author: 'User2',
      text: 'Great content, thanks for sharing!',
      timestamp: '2023-05-14T08:15:00Z',
      likes: 15
    }
  ];
  
  dom.commentsList.innerHTML = '';
  comments.forEach(comment => {
    const commentEl = document.createElement('div');
    commentEl.className = 'comment';
    commentEl.innerHTML = `
      <img src="https://via.placeholder.com/40" class="user-avatar">
      <div class="comment-content">
        <div class="comment-header">
          <span class="comment-author">${comment.author}</span>
          <span class="comment-time">${formatTime(comment.timestamp)}</span>
        </div>
        <p class="comment-text">${comment.text}</p>
        <button class="comment-like-btn">
          <span class="material-icons">thumb_up</span>
          <span>${comment.likes}</span>
        </button>
      </div>
    `;
    dom.commentsList.appendChild(commentEl);
  });
}

function addComment() {
  const text = dom.commentInput.value.trim();
  if (!text || !currentUser) return;
  
  const newComment = {
    id: Date.now(),
    author: currentUser.name,
    text: text,
    timestamp: new Date().toISOString(),
    likes: 0
  };
  
  const commentEl = document.createElement('div');
  commentEl.className = 'comment';
  commentEl.innerHTML = `
    <img src="${currentUser.avatar || 'https://via.placeholder.com/40'}" class="user-avatar">
    <div class="comment-content">
      <div class="comment-header">
        <span class="comment-author">${newComment.author}</span>
        <span class="comment-time">Just now</span>
      </div>
      <p class="comment-text">${newComment.text}</p>
      <button class="comment-like-btn">
        <span class="material-icons">thumb_up</span>
        <span>0</span>
      </button>
    </div>
  `;
  
  dom.commentsList.prepend(commentEl);
  dom.commentInput.value = '';
}

// Upload System
function handleUpload(e) {
  e.preventDefault();
  
  const title = document.getElementById('upload-title').value;
  const description = document.getElementById('upload-description').value;
  const videoFile = document.getElementById('upload-file').files[0];
  const thumbnailFile = document.getElementById('upload-thumbnail').files[0];
  
  if (!title || !videoFile) {
    alert('Please fill in all required fields');
    return;
  }
  
  console.log('Uploading video:', {
    title,
    description,
    videoFile,
    thumbnailFile
  });
  
  alert('Video uploaded successfully! (This is a demo)');
  dom.uploadModal.style.display = 'none';
  dom.uploadForm.reset();
}

// Like System
function toggleLike() {
  if (!currentUser) {
    alert('Please sign in to like videos');
    return;
  }

  const videoId = currentVideo.id;
  const isLiked = dom.likeBtn.classList.contains('liked');
  
  if (currentSource === 'youtube' && currentUser.accessToken) {
    youtubeLikeVideo(videoId, !isLiked);
  }
  
  if (isLiked) {
    removeSYRLike(videoId);
  } else {
    addSYRLike(currentVideo);
  }
  
  updateLikeButton();
}

async function youtubeLikeVideo(videoId, like) {
  if (!currentUser?.accessToken) return;
  
  try {
    await fetch(`https://www.googleapis.com/youtube/v3/videos/rate?id=${videoId}&rating=${like ? 'like' : 'none'}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentUser.accessToken}`
      }
    });
  } catch (error) {
    console.error("YouTube like failed:", error);
  }
}

function addSYRLike(video) {
  if (!currentUser.syrData) currentUser.syrData = { likes: [], history: [] };
  
  currentUser.syrData.likes = currentUser.syrData.likes.filter(
    v => v.id !== video.id
  );
  
  currentUser.syrData.likes.unshift({
    id: video.id,
    title: video.snippet?.title || video.title,
    channel: video.snippet?.channelTitle || video.channel,
    thumbnail: video.snippet?.thumbnails?.medium?.url || video.thumbnail,
    timestamp: new Date().toISOString(),
    source: currentSource
  });
  
  saveUserData();
}

function removeSYRLike(videoId) {
  if (!currentUser.syrData) return;
  
  currentUser.syrData.likes = currentUser.syrData.likes.filter(
    v => v.id !== videoId
  );
  saveUserData();
}

function updateLikeButton() {
  if (!currentUser || !currentVideo) return;
  
  const isLiked = currentUser.syrData?.likes?.some(v => v.id === currentVideo.id);
  dom.likeBtn.classList.toggle('liked', isLiked);
  dom.likeBtn.innerHTML = `
    <span class="material-icons">thumb_up</span>
    ${isLiked ? 'Liked' : 'Like'}
  `;
}

// History System
function addToHistory(video) {
  if (!currentUser.syrData) currentUser.syrData = { likes: [], history: [] };
  
  currentUser.syrData.history = currentUser.syrData.history.filter(
    v => v.id !== video.id
  );
  
  currentUser.syrData.history.unshift({
    id: video.id,
    title: video.snippet?.title || video.title,
    channel: video.snippet?.channelTitle || video.channel,
    thumbnail: video.snippet?.thumbnails?.medium?.url || video.thumbnail,
    watchedAt: new Date().toISOString(),
    source: currentSource
  });
  
  saveUserData();
}

function showLikedVideos(e) {
  if (e) e.preventDefault();
  if (!currentUser) {
    alert('Please sign in to view liked videos');
    return;
  }
  
  showLoading();
  document.querySelector('.filter-bar').style.display = 'none';
  
  setTimeout(() => {
    const likedVideos = currentUser.syrData?.likes || [];
    if (likedVideos.length === 0) {
      dom.videoGrid.innerHTML = `
        <div class="no-results">
          <span class="material-icons">thumb_up</span>
          <p>No liked videos yet</p>
        </div>
      `;
    } else {
      displayVideos(likedVideos);
    }
    hideLoading();
  }, 500);
}

function showWatchHistory(e) {
  if (e) e.preventDefault();
  if (!currentUser) {
    alert('Please sign in to view history');
    return;
  }
  
  showLoading();
  document.querySelector('.filter-bar').style.display = 'none';
  
  setTimeout(() => {
    const history = currentUser.syrData?.history || [];
    if (history.length === 0) {
      dom.videoGrid.innerHTML = `
        <div class="no-results">
          <span class="material-icons">history</span>
          <p>No watch history yet</p>
        </div>
      `;
    } else {
      displayVideos(history);
    }
    hideLoading();
  }, 500);
}

// Auth System
function handleGoogleSignIn(response) {
  const payload = parseJWT(response.credential);
  
  google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/youtube.force-ssl',
    callback: (tokenResponse) => {
      currentUser = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        avatar: payload.picture,
        accessToken: tokenResponse.access_token,
        syrData: JSON.parse(localStorage.getItem(`syr-user-${payload.sub}`)) || {
          likes: [],
          history: [],
          searchHistory: []
        }
      };
      
      const savedHistory = localStorage.getItem('syr-tv-search-history');
      if (savedHistory) {
        currentUser.syrData.searchHistory = [
          ...new Set([...JSON.parse(savedHistory), ...(currentUser.syrData.searchHistory || [])])
        ];
        localStorage.removeItem('syr-tv-search-history');
      }
      
      saveUserData();
      updateUIForAuth();
      
      if (dom.commentUserAvatar) {
        dom.commentUserAvatar.src = currentUser.avatar;
      }
    }
  }).requestAccessToken();
}

function checkAuth() {
  const userData = localStorage.getItem('syr-tv-user');
  if (userData) {
    currentUser = JSON.parse(userData);
    currentUser.syrData = JSON.parse(localStorage.getItem(`syr-user-${currentUser.id}`)) || {
      likes: [],
      history: [],
      searchHistory: []
    };
    updateUIForAuth();
  }
}

function signOut() {
  if (currentUser?.accessToken) {
    google.accounts.oauth2.revoke(currentUser.accessToken);
  }
  
  currentUser = null;
  localStorage.removeItem('syr-tv-user');
  updateUIForAuth();
  dom.player.style.display = 'none';
}

function saveUserData() {
  if (!currentUser) return;
  
  localStorage.setItem(`syr-user-${currentUser.id}`, JSON.stringify(currentUser.syrData));
  localStorage.setItem('syr-tv-user', JSON.stringify({
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    avatar: currentUser.avatar,
    accessToken: currentUser.accessToken
  }));
}

function updateUIForAuth() {
  if (currentUser) {
    dom.signinBtn.style.display = 'none';
    dom.userDropdown.style.display = 'flex';
    dom.userAvatar.src = currentUser.avatar;
    if (dom.commentUserAvatar) {
      dom.commentUserAvatar.src = currentUser.avatar;
    }
  } else {
    dom.signinBtn.style.display = 'flex';
    dom.userDropdown.style.display = 'none';
    
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      renderGoogleSignInButton();
    }
  }
}

// Helpers
function parseJWT(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  
  return JSON.parse(jsonPayload);
}

function formatTime(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diff = now - date;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 7) {
    return date.toLocaleDateString();
  } else if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

function showLoading() {
  dom.loading.style.display = 'flex';
  dom.loading.classList.remove('hidden');
}

function hideLoading() {
  dom.loading.classList.add('hidden');
  setTimeout(() => {
    dom.loading.style.display = 'none';
  }, 300);
}

// Ramadan Daily Hadith & Azkar Widget
(function() {
  'use strict';
  
  // Ramadan data - 20 Hadiths and 20 Azkars
  const ramadanData = {
    hadith: [
      { text: "Whoever fasts during Ramadan out of sincere faith and hoping for a reward from Allah, then all his past sins will be forgiven.", reference: "Bukhari" },
      { text: "When the month of Ramadan starts, the gates of heaven are opened and the gates of Hell are closed and the devils are chained.", reference: "Bukhari" },
      { text: "Fasting is a shield; so when one of you is fasting, he should neither indulge in obscene language nor should he raise his voice in anger.", reference: "Muslim" },
      { text: "By Him in Whose Hands my soul is, the smell coming out from the mouth of a fasting person is better in the sight of Allah than the smell of musk.", reference: "Bukhari" },
      { text: "There are two pleasures for the fasting person: one at the time of breaking his fast, and the other at the time when he will meet his Lord.", reference: "Bukhari" },
      { text: "If one does not give up false speech and evil actions, Allah is not in need of his leaving his food and drink.", reference: "Bukhari" },
      { text: "Whoever gives food to a fasting person with which to break his fast, he will have a reward equal to his, without it detracting in the slightest from the reward of the fasting person.", reference: "Tirmidhi" },
      { text: "The five daily prayers, and Friday prayer to the next Friday prayer, and Ramadan to the next Ramadan, are expiation for the sins committed between them, so long as major sins are avoided.", reference: "Muslim" },
      { text: "When you see the new moon of Ramadan, begin the fast, and when you see the new moon of Shawwal, break the fast. If it is cloudy, complete thirty days of Sha'ban.", reference: "Bukhari" },
      { text: "Paradise has eight gates, and one of them is called Ar-Rayyan, through which none will enter but those who observe fasting.", reference: "Bukhari" },
      { text: "Take sahur, for in sahur there is blessing.", reference: "Bukhari" },
      { text: "People will continue to be upon good as long as they hasten to break the fast.", reference: "Bukhari" },
      { text: "Whoever stands (in prayer) in Ramadan out of faith and in the hope of reward, his previous sins will be forgiven.", reference: "Bukhari" },
      { text: "Fasting and the Quran will intercede for a person on the Day of Resurrection.", reference: "Ahmad" },
      { text: "Whoever draws near to Allah during Ramadan with any good deed, it is as if he performed an obligatory act at any other time.", reference: "Bukhari" },
      { text: "The month of Ramadan is the month of patience, and the reward for patience is Paradise.", reference: "Ibn Majah" },
      { text: "Whoever provides food for a fasting person to break his fast with, then for him is the same reward as his, without that decreasing from the reward of the fasting person in the slightest.", reference: "Ibn Majah" },
      { text: "Allah says: 'Every deed of the son of Adam is for him except fasting; it is for Me and I shall reward for it.'", reference: "Bukhari" },
      { text: "The fasting person has two moments of joy: when he breaks his fast and when he meets his Lord.", reference: "Muslim" },
      { text: "Fasting is half of patience.", reference: "Tirmidhi" }
    ],
    
    azkar: [
      { text: "اللَّهُمَّ لَكَ صُمْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ", translation: "O Allah, for You I have fasted, and with Your provision I break my fast.", reference: "Morning Dua" },
      { text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ بِرَحْمَتِكَ الَّتِي وَسِعَتْ كُلَّ شَيْءٍ أَنْ تَغْفِرَ لِي", translation: "O Allah, I ask You by Your mercy which encompasses all things, that You forgive me.", reference: "General Dua" },
      { text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ", translation: "Glory is to Allah and praise is to Him. Glory is to Allah the Almighty.", reference: "Morning/Evening" },
      { text: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ", translation: "O Allah, help me to remember You, to give You thanks, and to worship You in an excellent manner.", reference: "Morning Dua" },
      { text: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ", translation: "My Lord, forgive me and accept my repentance, for You are the Accepter of Repentance, the Most Merciful.", reference: "Evening Dua" },
      { text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا", translation: "O Allah, I ask You for beneficial knowledge, good provision, and accepted deeds.", reference: "Morning Dua" },
      { text: "سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ", translation: "Glory is to Allah, and praise is to Allah, and there is none worthy of worship but Allah, and Allah is the Greatest.", reference: "General Dhikr" },
      { text: "اللَّهُمَّ أَجِرْنِي مِنَ النَّارِ", translation: "O Allah, protect me from the Fire.", reference: "Seven Times Daily" },
      { text: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", translation: "There is no power and no strength except with Allah.", reference: "Morning/Evening" },
      { text: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ", translation: "O Allah, send prayers upon Muhammad and the family of Muhammad.", reference: "Blessing Prophet" },
      { text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", translation: "Our Lord, give us in this world good and in the Hereafter good, and save us from the punishment of the Fire.", reference: "Quran 2:201" },
      { text: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، وَمِنْ عَذَابِ جَهَنَّمَ، وَمِنْ فِتْنَةِ الْمَحْيَا وَالْمَمَاتِ، وَمِنْ شَرِّ فِتْنَةِ الْمَسِيحِ الدَّجَّالِ", translation: "O Allah, I seek refuge in You from the punishment of the grave, and from the punishment of Hellfire, and from the trials of life and death, and from the evil of the trial of the False Messiah.", reference: "Morning Dua" },
      { text: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ", translation: "Allah is sufficient for me. None has the right to be worshipped but Him. I have placed my trust in Him, and He is the Lord of the Majestic Throne.", reference: "Seven Times Daily" },
      { text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَمَا قَرَّبَ إِلَيْهَا مِنْ قَوْلٍ أَوْ عَمَلٍ، وَأَعُوذُ بِكَ مِنَ النَّارِ وَمَا قَرَّبَ إِلَيْهَا مِنْ قَوْلٍ أَوْ عَمَلٍ", translation: "O Allah, I ask You for Paradise and for that which brings one closer to it, in word and deed. And I seek refuge in You from Hellfire and from that which brings one closer to it, in word and deed.", reference: "Morning Dua" },
      { text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ وَرِضَا نَفْسِهِ وَزِنَةَ عَرْشِهِ وَمِدَادَ كَلِمَاتِهِ", translation: "Glory is to Allah and praise is to Him, by the multitude of His creation, by His Pleasure, by the weight of His Throne, and by the extent of His Words.", reference: "Morning Dhikr" },
      { text: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْجُبْنِ وَالْبُخْلِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ", translation: "O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness, miserliness and cowardice, the burden of debts and from being overpowered by men.", reference: "Morning Dua" },
      { text: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", translation: "None has the right to be worshipped but Allah alone, with no partner or associate. His is the Dominion and to Him be praise, and He is able to do all things.", reference: "100 Times Daily" },
      { text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مُوجِبَاتِ رَحْمَتِكَ، وَعَزَائِمَ مَغْفِرَتِكَ، وَالسَّلَامَةَ مِنْ كُلِّ إِثْمٍ، وَالْغَنِيمَةَ مِنْ كُلِّ بِرٍّ، وَالْفَوْزَ بِالْجَنَّةِ، وَالنَّجَاةَ مِنَ النَّارِ", translation: "O Allah, I ask You for the means of Your mercy, the means of Your forgiveness, safety from every sin, the benefit of every good deed, success in attaining Paradise, and deliverance from the Fire.", reference: "Evening Dua" },
      { text: "سُبْحَانَ اللَّهِ الْعَظِيمِ وَبِحَمْدِهِ", translation: "Glory is to Allah the Almighty and praise is to Him.", reference: "100 Times Daily" },
      { text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ فِعْلَ الْخَيْرَاتِ، وَتَرْكَ الْمُنْكَرَاتِ، وَحُبَّ الْمَسَاكِينِ، وَأَنْ تَغْفِرَ لِي، وَتَرْحَمَنِي، وَإِذَا أَرَدْتَ فِتْنَةَ قَوْمٍ فَتَوَفَّنِي غَيْرَ مَفْتُونٍ", translation: "O Allah, I ask You to help me do good deeds, abandon bad deeds, love the poor, and that You forgive me and have mercy on me. And if You will trial for a people, then take me without being trialed.", reference: "Morning Dua" }
    ]
  };

  // Widget state
  const state = {
    currentCategory: 'hadith',
    dailyIndex: null,
    dailyDate: null,
    ramadanDay: 1
  };

  // Initialize the widget
  function initWidget() {
    // Check if we already have a daily selection for today
    const today = new Date().toDateString();
    const storedData = getStoredData();
    
    if (storedData && storedData.date === today) {
      // Use stored selection for today
      state.dailyIndex = storedData.dailyIndex;
      state.dailyDate = storedData.date;
      state.ramadanDay = storedData.ramadanDay || calculateRamadanDay();
    } else {
      // Generate new daily selection
      generateDailySelection();
      calculateRamadanDay();
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Display the initial content
    updateDisplay();
    
    // Show the widget after a short delay
    setTimeout(() => {
      document.getElementById('ramadan-widget-container').style.opacity = '1';
      document.getElementById('ramadan-widget').style.transform = 'translateY(0)';
    }, 100);
  }

  // Get stored data from localStorage
  function getStoredData() {
    try {
      const data = localStorage.getItem('ramadanWidgetData');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  // Save data to localStorage
  function saveStoredData() {
    const data = {
      dailyIndex: state.dailyIndex,
      date: state.dailyDate,
      ramadanDay: state.ramadanDay
    };
    
    try {
      localStorage.setItem('ramadanWidgetData', JSON.stringify(data));
    } catch (e) {
      // Silently fail if localStorage is not available
    }
  }

  // Generate a daily random index based on the date
  function generateDailySelection() {
    const today = new Date();
    state.dailyDate = today.toDateString();
    
    // Use the day of the year as a seed for consistency
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Generate a consistent random index based on the date
    const seed = dayOfYear * 9301 + 49297; // Simple pseudo-random seed
    const randomIndex = Math.floor((seed % 899 + 101) % ramadanData.hadith.length);
    
    state.dailyIndex = randomIndex;
    saveStoredData();
  }

  // Calculate current day of Ramadan with proper year handling
function calculateRamadanDay() {
  const today = new Date();
  const currentYear = today.getFullYear();
  
  // Ramadan start dates for upcoming years (update annually)
  const ramadanDates = {
    2025: new Date(2025, 2, 1),    // March 1, 2025
    2026: new Date(2026, 1, 18),   // February 18, 2026
    2027: new Date(2027, 1, 8),    // February 8, 2027
    2028: new Date(2028, 0, 28),   // January 28, 2028
    2029: new Date(2029, 0, 16)    // January 16, 2029
  };
  
  // Get start date for current or previous year
  let ramadanStart = ramadanDates[currentYear] || ramadanDates[currentYear - 1];
  
  if (!ramadanStart) {
    // No date defined - show day 1 as fallback
    state.ramadanDay = 1;
    return state.ramadanDay;
  }
  
  // Calculate days difference
  const diffTime = today - ramadanStart;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    // Before Ramadan starts
    state.ramadanDay = 1;
  } else if (diffDays >= 0 && diffDays < 30) {
    // During Ramadan (0-29 days)
    state.ramadanDay = diffDays + 1; // +1 because Day 1 is actually 0 days difference
  } else {
    // After Ramadan (30+ days)
    state.ramadanDay = 1; // Reset for next year
  }
  
  return state.ramadanDay;
}
  // Get a random text that's different from the daily one
  function getRandomText() {
    const category = state.currentCategory;
    const texts = ramadanData[category];
    let randomIndex;
    
    do {
      randomIndex = Math.floor(Math.random() * texts.length);
    } while (randomIndex === state.dailyIndex && texts.length > 1);
    
    return texts[randomIndex];
  }

  // Get today's daily text
  function getDailyText() {
    const category = state.currentCategory;
    const texts = ramadanData[category];
    return texts[state.dailyIndex] || texts[0];
  }

  // Update the display with current content
  function updateDisplay() {
    const textData = getDailyText();
    const dateElement = document.getElementById('widget-date');
    const textElement = document.getElementById('daily-text');
    const referenceElement = document.getElementById('text-reference');
    const dayCountElement = document.getElementById('day-count');
    
    // Format and display date
    const today = new Date();
    dateElement.textContent = today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Display the text
    textElement.innerHTML = `<p>${textData.text}</p>`;
    
    if (textData.translation) {
      textElement.innerHTML += `<p class="translation"><em>${textData.translation}</em></p>`;
    }
    
    // Display reference
    referenceElement.textContent = `Reference: ${textData.reference}`;
    
    // Update day counter with year context
if (state.ramadanDay === 1) {
  const today = new Date();
  const ramadanDates = {
    2025: new Date(2025, 2, 1),
    2026: new Date(2026, 1, 18),
    2027: new Date(2027, 1, 8)
  };
  
  const currentYear = today.getFullYear();
  const ramadanStart = ramadanDates[currentYear];
  
  if (ramadanStart && today < ramadanStart) {
    // Before Ramadan
    dayCountElement.textContent = "1 (Ramadan starts soon)";
  } else {
    // During or after Ramadan
    dayCountElement.textContent = state.ramadanDay;
  }
} else {
  dayCountElement.textContent = state.ramadanDay;
}
    
    // Update active category button
    document.querySelectorAll('.category-btn').forEach(btn => {
      if (btn.dataset.category === state.currentCategory) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Set up event listeners
  function setupEventListeners() {
    // Category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.currentCategory = btn.dataset.category;
        updateDisplay();
      });
    });
    
    // Refresh button (shows another random text without changing daily)
    document.getElementById('refresh-btn').addEventListener('click', () => {
      const textData = getRandomText();
      const textElement = document.getElementById('daily-text');
      const referenceElement = document.getElementById('text-reference');
      
      textElement.innerHTML = `<p>${textData.text}</p>`;
      
      if (textData.translation) {
        textElement.innerHTML += `<p class="translation"><em>${textData.translation}</em></p>`;
      }
      
      referenceElement.textContent = `Reference: ${textData.reference}`;
      
      // Add a temporary indicator
      const indicator = document.createElement('div');
      indicator.className = 'temporary-indicator';
      indicator.textContent = 'Random selection - daily will return tomorrow';
      textElement.prepend(indicator);
      
      // Remove indicator after 3 seconds
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.remove();
        }
      }, 3000);
    });
    
    // Share button
    document.getElementById('share-btn').addEventListener('click', () => {
      const textData = getDailyText();
      const shareText = `${textData.text}\n\nReference: ${textData.reference}\n\nShared from SYR TV Ramadan Daily`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Ramadan Daily',
          text: shareText,
          url: window.location.href
        }).catch(console.error);
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
          const btn = document.getElementById('share-btn');
          const originalText = btn.textContent;
          btn.textContent = '✓ Copied!';
          setTimeout(() => {
            btn.textContent = originalText;
          }, 2000);
        });
      }
    });
    
    // Close widget button
    document.getElementById('close-widget').addEventListener('click', () => {
      const container = document.getElementById('ramadan-widget-container');
      container.style.opacity = '0';
      setTimeout(() => {
        container.style.display = 'none';
      }, 300);
    });
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
