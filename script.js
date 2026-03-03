// Change only this if your backend port changes
window.API_BASE = "http://localhost:3000";
const API = window.API_BASE;

function setToken(token) {
  localStorage.setItem("token", token);
}
function getToken() {
  return localStorage.getItem("token");
}

async function register() {
  const username = document.getElementById("r_username").value.trim();
  const email = document.getElementById("r_email").value.trim();
  const password = document.getElementById("r_password").value;

  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password })
  });

  const data = await res.json();
  document.getElementById("r_msg").innerText = data.message || JSON.stringify(data);
}

async function login() {
  const email = document.getElementById("l_email").value.trim();
  const password = document.getElementById("l_password").value;

  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    document.getElementById("l_msg").innerText = data.message || "Login failed";
    return;
  }

  setToken(data.token);
  localStorage.setItem("me_email", data.profile.email);
  localStorage.setItem("me_username", data.profile.username);
  localStorage.setItem("me_avatar", data.profile.avatar);

  window.location.href = "map.html";
}

document.getElementById("registerBtn").addEventListener("click", register);
document.getElementById("loginBtn").addEventListener("click", login);

// If already logged in, go straight to map
if (getToken()) {
  window.location.href = "map.html";
}
const API = window.API_BASE;
const token = localStorage.getItem("token");
const meEmail = localStorage.getItem("me_email");

if (!token) window.location.href = "index.html";

let map;
let myMarker;
const otherMarkers = new Map(); // email -> marker

const socket = io(API);

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

function toast(text) {
  const div = document.createElement("div");
  div.className = "toast";
  div.innerText = text;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

async function saveMyLocation(lat, lng) {
  await fetch(`${API}/me/location`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ lat, lng })
  });
}

function iconFor(user) {
  return {
    url: user.poolActive ? "avatars/active.png" : `avatars/${user.avatar || "default.png"}`,
    scaledSize: new google.maps.Size(42, 42)
  };
}

function renderNearby(users) {
  const keep = new Set(users.map(u => u.email));

  for (const [email, marker] of otherMarkers.entries()) {
    if (!keep.has(email)) {
      marker.setMap(null);
      otherMarkers.delete(email);
    }
  }

  users.forEach(user => {
    if (!user.location) return;

    const pos = { lat: user.location.lat, lng: user.location.lng };

    if (otherMarkers.has(user.email)) {
      const m = otherMarkers.get(user.email);
      m.setPosition(pos);
      m.setIcon(iconFor(user));
      return;
    }

    const marker = new google.maps.Marker({
      position: pos,
      map,
      icon: iconFor(user),
      title: `${user.username} (${user.distanceKm}km)`
    });

    marker.addListener("click", async () => {
      // Tap avatar → create/open group
      const res = await fetch(`${API}/chat/tap-user`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ otherEmail: user.email })
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.message || "Could not open chat");
        return;
      }

      localStorage.setItem("groupId", data.groupId);
      localStorage.setItem("chatWith", user.email);
      window.location.href = "chat.html";
    });

    otherMarkers.set(user.email, marker);
  });
}

async function refreshNearby() {
  const res = await fetch(`${API}/users/nearby?radiusKm=2`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const users = await res.json();
  renderNearby(users);
  document.getElementById("status").innerText = `Showing ${users.length} users within 2km`;
}

async function createPool() {
  const link = document.getElementById("marketLink").value.trim();

  const res = await fetch(`${API}/pools/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ marketLink: link })
  });

  const data = await res.json();
  toast(data.message || "Pool created");
}

async function endPool() {
  const res = await fetch(`${API}/pools/end`, {
    method: "POST",
    headers: authHeaders()
  });
  const data = await res.json();
  toast(data.message || "Pool ended");
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

document.getElementById("refreshBtn").addEventListener("click", refreshNearby);
document.getElementById("createPoolBtn").addEventListener("click", createPool);
document.getElementById("endPoolBtn").addEventListener("click", endPool);
document.getElementById("logoutBtn").addEventListener("click", logout);

// Google Maps callback
window.boot = function boot() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 15,
    center: { lat: 6.5244, lng: 3.3792 }
  });

  // In-app notification (toast) when pool nearby
  socket.on("poolCreatedNearby", (p) => {
    if (p.notified && meEmail && p.notified.includes(meEmail)) {
      toast(`Pool nearby: ${p.creatorUsername} created a pool!`);
    }
  });

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      const mePos = { lat, lng };
      map.setCenter(mePos);

      myMarker = new google.maps.Marker({
        position: mePos,
        map,
        title: "You",
        icon: { url: "avatars/default.png", scaledSize: new google.maps.Size(44, 44) }
      });

      await saveMyLocation(lat, lng);
      await refreshNearby();
      document.getElementById("status").innerText = "Location saved. Nearby loaded.";
    },
    () => toast("Location permission denied"),
    { enableHighAccuracy: true }
  );
};