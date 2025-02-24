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
const shortsModal = document.getElementById("shorts-modal");
const shortsPlayer = document.getElementById("shorts-player");
const closeShortModalButton = document.getElementById("close-short-modal");
const loadingOverlay = document.getElementById("loading-overlay");

// API Key
const API_KEY = "AIzaSyCmH-DDECRKwL8MGjg-oZN4eRSGmZGoXH4";

// Global array to store shorts data and current index
let shortsData = [];
let currentShortIndex = 0;

// --------------------- Sidebar & General Functions --------------------- //
menuButtons.forEach((button) => {
    button.addEventListener("click", () => {
        document.body.classList.toggle("sidebar-visible");
    });
});
if (screenOverlay) {
    screenOverlay.addEventListener("click", () => {
        document.body.classList.remove("sidebar-visible");
    });
}

// Hide Loading Animation (with logging)
function hideLoading() {
    console.log("hideLoading called");
    if (loadingOverlay) {
        loadingOverlay.style.display = "none";
    }
}

// Fallback: Hide loading after 10 seconds in case something stalls
setTimeout(hideLoading, 10000);

// --------------------- Shorts Section --------------------- //

// Fetch YouTube Shorts
async function fetchYouTubeShorts() {
    try {
        console.log("Fetching YouTube Shorts...");
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=shorts&type=video&key=${API_KEY}`
        );
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
            console.error("No Shorts found.");
            hideLoading();
            return;
        }
        
        shortsContainer.innerHTML = ""; // Clear previous shorts
        shortsData = []; // Clear global array
        
        data.items.forEach((video, index) => {
            const videoSrc = `https://www.youtube-nocookie.com/embed/${video.id.videoId}?autoplay=0&mute=1`;
            shortsData.push({
                videoSrc: videoSrc,
                title: video.snippet.title
            });
            addShortsCard(video.snippet, video.id.videoId, "youtube", index);
        });
        hideLoading();
    } catch (error) {
        console.error("Error fetching YouTube Shorts:", error);
        hideLoading();
    }
}

// Fetch Self-Hosted Shorts
function fetchSelfHostedShorts() {
    const selfHostedVideos = [
        { title: "Self-Hosted Short 1", url: "videos/self_short1.mp4" },
        { title: "Self-Hosted Short 2", url: "videos/self_short2.mp4" }
    ];
    
    selfHostedVideos.forEach((video) => {
        const index = shortsData.length;
        shortsData.push({
            videoSrc: video.url,
            title: video.title
        });
        addShortsCard({ title: video.title, thumbnails: { high: { url: "placeholder.jpg" } } }, video.url, "self-hosted", index);
    });
}

// Add Shorts Card to the Feed
function addShortsCard(snippet, videoId, source, index) {
    const shortCard = document.createElement("div");
    shortCard.classList.add("short-card");
    shortCard.setAttribute("data-index", index);
    
    let videoSrc = "";
    if (source === "youtube") {
        videoSrc = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&mute=1`;
    } else if (source === "self-hosted") {
        videoSrc = videoId;
    }
    
    shortCard.innerHTML = `
        <div class="short-video" data-video-src="${videoSrc}">
            <img src="${snippet.thumbnails?.high?.url || 'placeholder.jpg'}" alt="${snippet.title || 'Self-Hosted Video'}" class="thumbnail">
            <div class="play-icon"><i class="uil uil-play-circle"></i></div>
        </div>
        <div class="short-info"><p class="short-title">${snippet.title || "Untitled"}</p></div>
    `;
    shortsContainer.appendChild(shortCard);
}

// Open a Short in Fullscreen Modal
function openShortModal(index) {
    if (index < 0 || index >= shortsData.length) return;
    currentShortIndex = index;
    shortsPlayer.src = shortsData[currentShortIndex].videoSrc;
    shortsModal.style.display = "flex"; // Ensure modal covers full screen
}

// Delegate click event for Shorts cards
document.addEventListener("click", (event) => {
    const shortCard = event.target.closest(".short-card");
    if (shortCard && shortsContainer.contains(shortCard)) {
        const index = parseInt(shortCard.getAttribute("data-index"), 10);
        console.log("Short card clicked, index:", index);
        openShortModal(index);
    }
});

// Swipe Navigation in Modal (Basic Implementation)
let touchStartY = 0;
let touchEndY = 0;
const swipeThreshold = 50; // pixels

shortsModal.addEventListener("touchstart", (event) => {
    touchStartY = event.touches[0].clientY;
});

shortsModal.addEventListener("touchend", (event) => {
    touchEndY = event.changedTouches[0].clientY;
    const diff = touchStartY - touchEndY;
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0 && currentShortIndex < shortsData.length - 1) {
            openShortModal(currentShortIndex + 1);
        } else if (diff < 0 && currentShortIndex > 0) {
            openShortModal(currentShortIndex - 1);
        }
    }
});

// Close Shorts Modal via Close Button
if (closeShortModalButton) {
    closeShortModalButton.addEventListener("click", (event) => {
        event.stopPropagation();
        shortsModal.style.display = "none";
        shortsPlayer.src = "";
    });
}

// Load Shorts on Page Load
document.addEventListener("DOMContentLoaded", () => {
    console.log("Page Loaded, Fetching Shorts...");
    fetchYouTubeShorts();
    fetchSelfHostedShorts();
});

// --------------------- Regular Video Functions (unchanged) --------------------- //
async function fetchTrendingVideos() {
    try {
        showLoading();
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&regionCode=US&maxResults=10&key=${API_KEY}`
        );
        const data = await response.json();
        videoList.innerHTML = "";
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

async function fetchYouTubeVideos(query = "", pageToken = "") {
    try {
        showLoading();
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&q=${query}&part=snippet,id&order=relevance&type=video&maxResults=10&pageToken=${pageToken}`
        );
        const data = await response.json();
        nextPageToken = data.nextPageToken || null;
        if (!pageToken) videoList.innerHTML = "";
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

function addVideoCard(snippet, videoId) {
    const videoCard = document.createElement("div");
    videoCard.classList.add("video-card");
    videoCard.innerHTML = `
        <div class="thumbnail-container" data-video-id="${videoId}">
            <img src="${snippet.thumbnails.high.url}" alt="${snippet.title}" class="thumbnail">
            <div class="play-icon"><i class="uil uil-play-circle"></i></div>
        </div>
        <div class="video-details">
            <h2 class="title">${snippet.title}</h2>
            <p class="channel-name">${snippet.channelTitle}</p>
            <p class="views">Published on: ${new Date(snippet.publishedAt).toDateString()}</p>
        </div>
    `;
    videoList.appendChild(videoCard);
}

// Regular Video Event Listeners
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

searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) fetchYouTubeVideos(query);
});

categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const category = button.textContent.trim();
        fetchYouTubeVideos(category);
        categoryButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
    });
});

showMoreButton.addEventListener("click", () => {
    const query = searchInput.value || "all";
    fetchYouTubeVideos(query, nextPageToken);
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
