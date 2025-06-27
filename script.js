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
  const startupVideo = document.getElementById('startup-video');

  if (startupVideo) {
    startupVideo.addEventListener('ended', () => {
      startupVideo.remove();
    });

    // Fallback in case video doesn't trigger "ended"
    setTimeout(() => {
      if (startupVideo) startupVideo.remove();
    }, 6000); // Set to match your animation duration
  }
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