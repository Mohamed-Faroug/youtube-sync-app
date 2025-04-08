const socket = io();
let player;
let seeking = false;

// YouTube Iframe API setup
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: 'dQw4w9WgXcQ', // default video
    events: {
      onReady: () => {
        updateVideoTitle();
        setupEventHandlers();
      },
      onStateChange: (event) => {
        if (event.data === YT.PlayerState.PLAYING) {
          socket.emit('sync', { action: 'play' });
        } else if (event.data === YT.PlayerState.PAUSED && !seeking) {
          socket.emit('sync', { action: 'pause' });
        }
      }
    }
  });
}

function extractVideoID(url) {
  const regex = /(?:v=|\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : url.trim(); // fallback to plain ID
}

function updateVideoTitle() {
  const data = player.getVideoData();
  document.getElementById('videoTitle').textContent = `🎞️ ${data.title}`;
}

function setupEventHandlers() {
  document.getElementById('playBtn').onclick = () => {
    player.playVideo();
  };

  document.getElementById('pauseBtn').onclick = () => {
    player.pauseVideo();
  };

  document.getElementById('loadVideoBtn').onclick = () => {
    const input = document.getElementById('videoInput').value;
    const videoID = extractVideoID(input);

    if (videoID.length === 11) {
      player.loadVideoById(videoID);
      updateVideoTitle();
      socket.emit('sync', { action: 'load', videoId: videoID });
    } else {
      alert('Invalid YouTube link or ID.');
    }
  };

  setInterval(() => {
    if (player && player.getPlayerState() === YT.PlayerState.PLAYING && !seeking) {
      socket.emit('sync', { action: 'seek', time: player.getCurrentTime() });
    }
  }, 3000);
}

// Handle sync events
socket.on('sync', (data) => {
  if (!player) return;

  if (data.action === 'play') {
    player.playVideo();
  } else if (data.action === 'pause') {
    player.pauseVideo();
  } else if (data.action === 'seek') {
    seeking = true;
    player.seekTo(data.time, true);
    setTimeout(() => seeking = false, 1000);
  } else if (data.action === 'load') {
    player.loadVideoById(data.videoId);
    setTimeout(updateVideoTitle, 1000);
  }
});

// 🌙 Dark Mode Toggle
const toggleBtn = document.getElementById('toggleDarkMode');
const body = document.body;

function applyTheme(theme) {
  if (theme === 'dark') {
    body.classList.add('dark');
  } else {
    body.classList.remove('dark');
  }
  localStorage.setItem('theme', theme);
}

toggleBtn.onclick = () => {
  const isDark = body.classList.contains('dark');
  applyTheme(isDark ? 'light' : 'dark');
};

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);
});
