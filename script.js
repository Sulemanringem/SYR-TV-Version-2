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
const loadingOverlay = document.getElementById("loading-overlay");

// API Key
const API_KEY = "AIzaSyCmH-DDECRKwL8MGjg-oZN4eRSGmZGoXH4";

// Fix: Ensure screen overlay doesn't block interaction
if (screenOverlay) {
    screenOverlay.style.display = "none"; // Hide overlay if still active
}

// Sidebar Toggle
menuButtons.forEach((button) => {
    button.addEventListener("click", () => {
        document.body.classList.toggle("sidebar-visible");
    });
});

screenOverlay.addEventListener("click", () => {
    document.body.classList.remove("sidebar-visible");
});

// Hide Loading Animation
function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = "none";
    }
}

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
        data.items.forEach((video) => {
            addShortsCard(video.snippet, video.id.videoId, "youtube");
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
        addShortsCard(video, video.url, "self-hosted");
    });
}

// Add Shorts Cards
function addShortsCard(snippet, videoId, source) {
    const shortCard = document.createElement("div");
    shortCard.classList.add("short-card");
    
    let videoSrc = "";
    if (source === "youtube") {
        videoSrc = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&mute=1`;
    } else if (source === "self-hosted") {
        videoSrc = videoId;
    }

    shortCard.innerHTML = `
        <div class="short-video" data-video-src="${videoSrc}">
            <img src="${snippet.thumbnails?.high?.url || "placeholder.jpg"}" alt="${snippet.title || "Self-Hosted Video"}" class="thumbnail">
        </div>
    `;
    
    shortsContainer.appendChild(shortCard);
}

// Fix: Attach event listener to handle video clicks properly
document.addEventListener("click", (event) => {
    const videoElement = event.target.closest(".short-video");
    if (videoElement) {
        console.log("Short clicked:", videoElement.dataset.videoSrc);
        const videoSrc = videoElement.dataset.videoSrc;
        if (shortsPlayer && shortsModal) {
            shortsPlayer.src = videoSrc;
            shortsModal.style.display = "block";
        }
    }
});

// Close Shorts Modal
if (shortsModal) {
    shortsModal.addEventListener("click", () => {
        console.log("Closing Shorts Modal...");
        shortsModal.style.display = "none";
        shortsPlayer.src = "";
    });
}

// Ensure Videos Load on Page Load
document.addEventListener("DOMContentLoaded", () => {
    console.log("Page Loaded, Fetching Shorts...");
    fetchYouTubeShorts();
    fetchSelfHostedShorts();
});
