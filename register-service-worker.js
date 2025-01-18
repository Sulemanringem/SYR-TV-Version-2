if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/SYR-TV/service-worker.js").then(() => {
    console.log("Service Worker Registered");
  });
}
