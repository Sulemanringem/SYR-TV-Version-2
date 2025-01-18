// DOM Elements
const menuButtons = document.querySelectorAll(".menu-button");
const screenOverlay = document.querySelector(".main-layout .screen-overlay");
const themeButton = document.querySelector(".navbar .theme-button i");
const videoList = document.getElementById("video-list");
const searchInput = document.querySelector(".search-input");
const searchForm = document.querySelector(".search-form");
const categoryButtons = document.querySelectorAll(".category-button");
const navLinks = document.querySelectorAll(".link-item");
const micButton = document.querySelector(".mic-button");
const showMoreButton = document.getElementById("show-more");

// Constants
const API_KEY = 'AIzaSyCmH-DDECRKwL8MGjg-oZN4eRSGmZGoXH4'; // Replace with your API Key
let nextPageToken = null;

// ======================= Helper Functions =======================

// Show Loading Animation
function showLoading() {
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.style.display = "flex";
  }
}

// Hide Loading Animation
function hideLoading() {
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.style.display = "none";
  }
}

// ======================= Fetch Videos =======================

// Fetch Trending Videos
async function fetchTrendingVideos() {
  try {
    showLoading();
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&regionCode=US&maxResults=10&key=${API_KEY}`
    );

    const data = await response.json();

    // Clear existing videos
    videoList.innerHTML = "";

    // Add video cards to the list
    data.items.forEach((video) => {
      const snippet = video.snippet;
      const videoId = video.id;
      addVideoCard(snippet, videoId);
    });

    hideLoading();
  } catch (error) {
    hideLoading();
    console.error("Error fetching trending videos:", error);
  }
}

// Fetch Videos from YouTube API
async function fetchYouTubeVideos(query = "", pageToken = "") {
  try {
    showLoading();
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&q=${query}&part=snippet,id&order=relevance&type=video&maxResults=10&pageToken=${pageToken}`
    );
    const data = await response.json();

    nextPageToken = data.nextPageToken || null;

    // Clear the video list if it's a new search (no page token)
    if (!pageToken) videoList.innerHTML = "";

    // Add video cards to the list
    data.items.forEach((item) => {
      if (item.id.kind === "youtube#video") {
        addVideoCard(item.snippet, item.id.videoId);
      }
    });

    // Show or hide the "Show More" button based on nextPageToken
    if (nextPageToken) {
      showMoreButton.style.display = "block";
    } else {
      showMoreButton.style.display = "none";
    }

    hideLoading();
  } catch (error) {
    hideLoading();
    console.error("Failed to fetch videos:", error);
  }
}

// Add Video Card to DOM
function addVideoCard(snippet, videoId) {
  const videoCard = document.createElement("div");
  videoCard.classList.add("video-card");

  videoCard.innerHTML = `
    <div class="thumbnail-container" data-video-id="${videoId}">
      <img src="${snippet.thumbnails.high.url}" alt="${snippet.title}" class="thumbnail">
      <div class="play-icon">
        <i class="uil uil-play-circle"></i>
      </div>
    </div>
    <div class="video-details">
      <h2 class="title">${snippet.title}</h2>
      <p class="channel-name">${snippet.channelTitle}</p>
      <p class="views">Published on: ${new Date(snippet.publishedAt).toDateString()}</p>
    </div>
  `;

  videoList.appendChild(videoCard);
}
self.addEventListener("fetch", (event) => {
  if (event.request.url.startsWith("https://suspicious-site.com")) {
    return fetch(event.request).catch(() => console.warn("Blocked suspicious request."));
  }
});

// ======================= Event Listeners =======================

// Function to load and play video
function loadVideo(videoId) {
  const videoPlayer = document.getElementById("video-player");
  const videoIframe = document.getElementById("video-iframe");

  videoIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  videoPlayer.style.display = "block";
}

// Close the video player
const closePlayerButton = document.getElementById("close-player");
if (closePlayerButton) {
  closePlayerButton.addEventListener("click", () => {
    const videoPlayer = document.getElementById("video-player");
    const videoIframe = document.getElementById("video-iframe");
    videoIframe.src = "";
    videoPlayer.style.display = "none";
  });
}

// Event listener to play video when thumbnail or play icon is clicked
videoList.addEventListener("click", (event) => {
  const thumbnail = event.target.closest(".thumbnail-container");
  if (thumbnail) {
    const videoId = thumbnail.dataset.videoId;
    loadVideo(videoId);
  }
});

// Sidebar Navigation Click
navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();

    const linkText = link.textContent.trim();
    switch (linkText) {
      case "Home":
        fetchTrendingVideos();
        break;
      case "Settings":
        alert("Settings page coming soon!");
        break;
      case "Help":
        alert("Help page coming soon!");
        break;
      case "Report":
        alert("Report functionality coming soon!");
        break;
      case "Feedback":
        alert("Feedback page coming soon!");
        break;
      default:
        fetchYouTubeVideos(linkText);
    }

    navLinks.forEach((nav) => nav.classList.remove("active"));
    link.classList.add("active");
  });
});

// Search Form Submission
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (query) fetchYouTubeVideos(query);
});

// Category Button Click
categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const category = button.textContent.trim();
    fetchYouTubeVideos(category);
    categoryButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
  });
});

// Show More Button Click
showMoreButton.addEventListener("click", () => {
  const query = searchInput.value || "all";
  fetchYouTubeVideos(query, nextPageToken);
});
document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("sidebar-hidden"); // Start with sidebar hidden
  fetchTrendingVideos(); // Load videos
});

menuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-hidden");
  });
});

screenOverlay.addEventListener("click", () => {
  document.body.classList.add("sidebar-hidden");
});

// ======================= Voice Search =======================
if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";
  recognition.interimResults = false;

  micButton.addEventListener("click", () => {
    micButton.classList.add("active");
    recognition.start();
  });

  recognition.addEventListener("result", (event) => {
    micButton.classList.remove("active");
    const query = event.results[0][0].transcript;
    searchInput.value = query;
    fetchYouTubeVideos(query);
  });

  recognition.addEventListener("end", () => {
    micButton.classList.remove("active");
  });

  recognition.addEventListener("error", (event) => {
    micButton.classList.remove("active");
    console.error("Voice recognition error:", event.error);
    alert("Could not process your voice. Please try again.");
  });
} else {
  micButton.style.display = "none";
  console.warn("Speech Recognition API not supported in this browser.");
}

// ======================= Initialize Page =======================

document.addEventListener("DOMContentLoaded", () => {
  fetchTrendingVideos();
});
// Sidebar Menu Toggle
menuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-hidden");
  });
});

screenOverlay.addEventListener("click", () => {
  document.body.classList.toggle("sidebar-hidden");
});

// Sidebar Navigation Click
navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();

    const linkText = link.textContent.trim();
    switch (linkText) {
      case "Home":
        fetchTrendingVideos();
        break;
      case "Settings":
        alert("Settings page coming soon!");
        break;
      case "Help":
        alert("Help page coming soon!");
        break;
      case "Report":
        alert("Report functionality coming soon!");
        break;
      case "Feedback":
        alert("Feedback page coming soon!");
        break;
      default:
        fetchYouTubeVideos(linkText);
    }

    navLinks.forEach((nav) => nav.classList.remove("active"));
    link.classList.add("active");
  });
});

// Dark Mode Toggle
if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark-mode");
  themeButton.classList.replace("uil-moon", "uil-sun");
} else {
  themeButton.classList.replace("uil-sun", "uil-moon");
}

themeButton.addEventListener("click", () => {
  const isDarkMode = document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", isDarkMode ? "enabled" : "disabled");
  themeButton.classList.toggle("uil-sun", isDarkMode);
  themeButton.classList.toggle("uil-moon", !isDarkMode);
});
