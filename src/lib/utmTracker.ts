"use client";

export function initializeTrafficSourceTracker() {
  if (typeof window === "undefined" || !window.sessionStorage) return;

  // 1. Check if traffic source is already recorded in this session to prevent overwrite
  if (window.sessionStorage.getItem("lg_traffic_source")) return;

  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get("utm_source");
  const utmMedium = urlParams.get("utm_medium");
  const utmCampaign = urlParams.get("utm_campaign");
  const gclid = urlParams.get("gclid");

  let source = "Direct";
  const referrer = document.referrer;

  // 2. Classify traffic source based on parameters and referrer
  if (gclid || (utmMedium && ["cpc", "ppc", "ad"].includes(utmMedium.toLowerCase()))) {
    source = "Google Ads";
  } else if (utmSource) {
    source = utmSource; // Custom campaign source
  } else if (referrer) {
    try {
      const refUrl = new URL(referrer);
      const host = refUrl.hostname.toLowerCase();
      if (host.includes("google") || host.includes("bing") || host.includes("yahoo") || host.includes("duckduckgo")) {
        source = "Google Organic";
      } else if (host.includes("facebook") || host.includes("instagram") || host.includes("t.co") || host.includes("twitter") || host.includes("tiktok") || host.includes("youtube")) {
        source = "Social Media";
      } else {
        source = `Referral (${refUrl.hostname})`;
      }
    } catch (e) {
      source = "Direct";
    }
  }

  // 3. Save to sessionStorage
  window.sessionStorage.setItem("lg_traffic_source", source);
  if (utmSource) window.sessionStorage.setItem("lg_utm_source", utmSource);
  if (utmMedium) window.sessionStorage.setItem("lg_utm_medium", utmMedium);
  if (utmCampaign) window.sessionStorage.setItem("lg_utm_campaign", utmCampaign);
  if (gclid) window.sessionStorage.setItem("lg_gclid", gclid);
  
  // Save initial landing page path
  window.sessionStorage.setItem("lg_landing_page", window.location.pathname);
}

export function getTrafficSourceData() {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return {
      trafficSource: "Direct",
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      gclid: null,
    };
  }

  return {
    trafficSource: window.sessionStorage.getItem("lg_traffic_source") || "Direct",
    utmSource: window.sessionStorage.getItem("lg_utm_source") || null,
    utmMedium: window.sessionStorage.getItem("lg_utm_medium") || null,
    utmCampaign: window.sessionStorage.getItem("lg_utm_campaign") || null,
    gclid: window.sessionStorage.getItem("lg_gclid") || null,
    landingPage: window.sessionStorage.getItem("lg_landing_page") || "/",
  };
}
