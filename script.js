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
const shortsContainer = document.getElementById("shorts-container");
const body = document.body;

// YouTube API Key (Replace with your actual key)
const API_KEY = "AIzaSyCmH-DDECRKwL8MGjg-oZN4eRSGmZGoXH4"; // Use only once

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

    videoList.innerHTML = ""; // Clear existing videos

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

// Fetch YouTube Shorts Videos
async function fetchYouTubeShorts() {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=shorts&type=video&key=${API_KEY}`
    );
    const data = await response.json();

    data.items.forEach((video) => {
      addShortsCard(video.snippet, video.id.videoId, "youtube");
    });
  } catch (error) {
    console.error("Error fetching YouTube Shorts:", error);
  }
}

// Fetch Self-Hosted Shorts
function fetchSelfHostedShorts() {
  const selfHostedVideos = [
    { title: "Self-Hosted Short 1", url: "videos/self_short1.mp4" },
    { title: "Self-Hosted Short 2", url: "videos/self_short2.mp4" }
  ];

  selfHostedVideos.forEach((video) => {
    addShortsCard(video, video.url, "self-hosted");
  });
}

// Function to Add Shorts Cards to the Shorts Section
function addShortsCard(snippet, videoId, source) {
  const shortCard = document.createElement("div");
  shortCard.classList.add("short-card");

  let videoSrc = "";
  if (source === "youtube") {
    videoSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
  } else if (source === "self-hosted") {
    videoSrc = videoId;
  }

  shortCard.innerHTML = `
        <video src="${videoSrc}" autoplay loop muted></video>
        <div class="overlay">
            <p class="title">${snippet.title || "Self-Hosted Video"}</p>
        </div>
    `;

  shortsContainer.appendChild(shortCard);
}

// Fetch Regular YouTube Videos
async function fetchYouTubeVideos(query = "", pageToken = "") {
  try {
    showLoading();
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&q=${query}&part=snippet,id&order=relevance&type=video&maxResults=10&pageToken=${pageToken}`
    );
    const data = await response.json();

    nextPageToken = data.nextPageToken || null;

    if (!pageToken) videoList.innerHTML = ""; // Clear list if it's a new search

    data.items.forEach((item) => {
      if (item.id.kind === "youtube#video") {
        addVideoCard(item.snippet, item.id.videoId);
      }
    });

    showMoreButton.style.display = nextPageToken ? "block" : "none";

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

// ======================= Event Listeners =======================

// Sidebar Navigation Click
navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();

    const linkText = link.textContent.trim();
    switch (linkText) {
      case "Home":
        fetchTrendingVideos();
        break;
      case "Shorts":
        fetchYouTubeShorts();
        fetchSelfHostedShorts();
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

// ======================= Initialize Page =======================

document.addEventListener("DOMContentLoaded", () => {
  fetchTrendingVideos();
  fetchYouTubeShorts();
  fetchSelfHostedShorts();
});

// Sidebar Toggle
menuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-hidden");
  });
});

screenOverlay.addEventListener("click", () => {
  document.body.classList.toggle("sidebar-hidden");
});

// Dark Mode Toggle
if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark-mode");
  themeButton.classList.replace("uil-moon", "uil-sun");
}

themeButton.addEventListener("click", () => {
  const isDarkMode = document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", isDarkMode ? "enabled" : "disabled");
  themeButton.classList.toggle("uil-sun", isDarkMode);
  themeButton.classList.toggle("uil-moon", !isDarkMode);
});
