/***********************************************
 1) Basic Libraries (with fallback approach)
***********************************************/
/**
 * Fallback if remote fails => load "test.mp3" locally.
 * Place a short local "test.mp3" in this same folder.
 */
const FALLBACK_URL = "test.mp3";

/** 
 * A more robust library with free tracks from Mixkit or other free sources.
 */
const trackLibrary = {
  // Using stable direct .mp3 from Mixkit as examples:
  track1: {
    url: "https://assets.mixkit.co/music/preview/mixkit-city-walk-117.mp3",
    bpm: 95
  },
  track2: {
    url: "https://assets.mixkit.co/music/preview/mixkit-french-jazz-cafe-82.mp3",
    bpm: 120
  },
  track3: {
    url: "https://assets.mixkit.co/music/preview/mixkit-summer-morning-690.mp3",
    bpm: 100
  },
  track4: {
    url: "https://assets.mixkit.co/music/preview/mixkit-latenight-lofi-503.mp3",
    bpm: 85
  },
  // Xmas vibe or holiday track
  track5: {
    url: "https://assets.mixkit.co/music/preview/mixkit-a-holiday-in-france-75.mp3",
    bpm: 128
  },
  track6: {
    url: "https://assets.mixkit.co/music/preview/mixkit-a-very-happy-christmas-897.mp3",
    bpm: 110
  }
};

/** 
 * Sample library for performance pads 
 */
const sampleLib = {
  sample1: "https://cdn.pixabay.com/download/audio/2022/10/07/audio_e6bacf4ca6.mp3?filename=clap-121899.mp3",
  sample2: "https://cdn.pixabay.com/download/audio/2022/10/07/audio_4c9fa94b2f.mp3?filename=kick-121902.mp3",
  sample3: "https://cdn.pixabay.com/download/audio/2022/10/07/audio_207bb1072e.mp3?filename=hihat-121900.mp3",
  sample4: "https://cdn.pixabay.com/download/audio/2022/10/11/audio_8c03f6b877.mp3?filename=scratch-122258.mp3",
  sample5: "https://cdn.pixabay.com/download/audio/2022/02/07/audio_263d9ddc2d.mp3?filename=keyboard-typing-14357.mp3",
  sample6: "https://cdn.pixabay.com/download/audio/2022/07/10/audio_e7b501644e.mp3?filename=shaker-a-114650.mp3",
  sample7: "https://cdn.pixabay.com/download/audio/2022/01/28/audio_cef43e1e46.mp3?filename=snare-drum-ambiance-14514.mp3",
  sample8: "https://cdn.pixabay.com/download/audio/2022/12/11/audio_f55cdb52cd.mp3?filename=crowd-cheer-12672.mp3"
};

/***********************************************
 2) DOM Refs
***********************************************/
const errorBox = document.getElementById("errorBox");
const errorMessage = document.getElementById("errorMessage");

const volumeA = document.getElementById("volumeA");
const volumeB = document.getElementById("volumeB");
const crossfader = document.getElementById("crossfader");

const loadLeftBtn = document.getElementById("loadLeftBtn");
const loadLeftUrlBtn = document.getElementById("loadLeftUrlBtn");
const selectLeft = document.getElementById("selectLeft");
const customLeftUrl = document.getElementById("customLeftUrl");

const loadRightBtn = document.getElementById("loadRightBtn");
const loadRightUrlBtn = document.getElementById("loadRightUrlBtn");
const selectRight = document.getElementById("selectRight");
const customRightUrl = document.getElementById("customRightUrl");

const playBtn = document.getElementById("playBtn");
const tempoMatchBtn = document.getElementById("tempoMatchBtn");

const padsLeft = document.querySelectorAll("#padsLeft .padBtn");
const padsRight = document.querySelectorAll("#padsRight .padBtn");

const jogWheelLeft = document.getElementById("jogWheelLeft");
const jogWheelRight = document.getElementById("jogWheelRight");

const leftLoopInBtn = document.getElementById("leftLoopInBtn");
const leftLoopOutBtn = document.getElementById("leftLoopOutBtn");
const leftLoopToggleBtn = document.getElementById("leftLoopToggleBtn");

const rightLoopInBtn = document.getElementById("rightLoopInBtn");
const rightLoopOutBtn = document.getElementById("rightLoopOutBtn");
const rightLoopToggleBtn = document.getElementById("rightLoopToggleBtn");

const leftQuantizeBtn = document.getElementById("leftQuantizeBtn");
const leftHalfSpeedBtn = document.getElementById("leftHalfSpeedBtn");
const leftDoubleSpeedBtn = document.getElementById("leftDoubleSpeedBtn");

const rightQuantizeBtn = document.getElementById("rightQuantizeBtn");
const rightHalfSpeedBtn = document.getElementById("rightHalfSpeedBtn");
const rightDoubleSpeedBtn = document.getElementById("rightDoubleSpeedBtn");

/***********************************************
 3) DJ Error Log
***********************************************/
function djErrorLog(msg) {
  console.error("[DJ_error_log]", msg);
}
function showError(msg) {
  errorBox.style.display = "block";
  errorMessage.textContent = msg;
  djErrorLog(msg);
}
function clearError() {
  errorBox.style.display = "none";
  errorMessage.textContent = "";
}

/***********************************************
 4) Security Check & No YouTube
***********************************************/
function isSecureUrl(url) {
  // This won't handle YouTube links if the user tries "https://youtube.com/..."
  // They won't load due to DRM. We'll fallback anyway.
  return url.startsWith("https://");
}

/***********************************************
 5) WaveSurfer
***********************************************/
let waveSurferLeft = null;
let waveSurferRight = null;
let isPlaying = false;

// Loop data
let leftLoopIn = null, leftLoopOut = null, leftLoopActive = false;
let rightLoopIn = null, rightLoopOut = null, rightLoopActive = false;

function initWaveSurfers() {
  waveSurferLeft = WaveSurfer.create({
    container: "#waveformLeft",
    waveColor: "#999",
    progressColor: "#ff4081",
    backend: "MediaElement",
    height: 80
  });
  waveSurferLeft.on("error", err => showError("Left wave error: " + err));
  waveSurferLeft.on("finish", () => {
    if (leftLoopActive && leftLoopIn !== null && leftLoopOut !== null) {
      waveSurferLeft.seekTo(leftLoopIn / waveSurferLeft.getDuration());
      waveSurferLeft.play();
    }
  });

  waveSurferRight = WaveSurfer.create({
    container: "#waveformRight",
    waveColor: "#999",
    progressColor: "#42f5dd",
    backend: "MediaElement",
    height: 80
  });
  waveSurferRight.on("error", err => showError("Right wave error: " + err));
  waveSurferRight.on("finish", () => {
    if (rightLoopActive && rightLoopIn !== null && rightLoopOut !== null) {
      waveSurferRight.seekTo(rightLoopIn / waveSurferRight.getDuration());
      waveSurferRight.play();
    }
  });
}

/***********************************************
 6) HEAD check + fallback
***********************************************/
function loadTrackLeft(url) {
  if (!isSecureUrl(url)) {
    showError("Left deck: Insecure/YouTube link => fallback used.");
    waveSurferLeft.load(FALLBACK_URL);
    return;
  }
  fetch(url, { method: "HEAD" })
    .then(resp => {
      if (!resp.ok) {
        showError(`Left deck: Server responded ${resp.status}, fallback used.`);
        waveSurferLeft.load(FALLBACK_URL);
      } else {
        waveSurferLeft.load(url);
        clearError();
      }
    })
    .catch(err => {
      showError("Left deck HEAD failed, fallback used: " + err);
      waveSurferLeft.load(FALLBACK_URL);
    });
}

function loadTrackRight(url) {
  if (!isSecureUrl(url)) {
    showError("Right deck: Insecure/YouTube link => fallback used.");
    waveSurferRight.load(FALLBACK_URL);
    return;
  }
  fetch(url, { method: "HEAD" })
    .then(resp => {
      if (!resp.ok) {
        showError(`Right deck: Server responded ${resp.status}, fallback used.`);
        waveSurferRight.load(FALLBACK_URL);
      } else {
        waveSurferRight.load(url);
        clearError();
      }
    })
    .catch(err => {
      showError("Right deck HEAD failed, fallback used: " + err);
      waveSurferRight.load(FALLBACK_URL);
    });
}

/***********************************************
 7) Load Event Handlers
***********************************************/
loadLeftBtn.addEventListener("click", () => {
  clearError();
  const sel = selectLeft.value;
  if (!sel || !trackLibrary[sel]) {
    showError("No valid library track for left deck => fallback used.");
    waveSurferLeft.load(FALLBACK_URL);
    return;
  }
  loadTrackLeft(trackLibrary[sel].url);
});

loadLeftUrlBtn.addEventListener("click", () => {
  clearError();
  const url = customLeftUrl.value.trim();
  if (!url) {
    showError("Left deck: No URL => fallback used.");
    waveSurferLeft.load(FALLBACK_URL);
    return;
  }
  loadTrackLeft(url);
});

loadRightBtn.addEventListener("click", () => {
  clearError();
  const sel = selectRight.value;
  if (!sel || !trackLibrary[sel]) {
    showError("No valid library track for right deck => fallback used.");
    waveSurferRight.load(FALLBACK_URL);
    return;
  }
  loadTrackRight(trackLibrary[sel].url);
});

loadRightUrlBtn.addEventListener("click", () => {
  clearError();
  const url = customRightUrl.value.trim();
  if (!url) {
    showError("Right deck: No URL => fallback used.");
    waveSurferRight.load(FALLBACK_URL);
    return;
  }
  loadTrackRight(url);
});

/***********************************************
 8) Play / Pause
***********************************************/
playBtn.addEventListener("click", async () => {
  try {
    await Tone.start();
  } catch (err) {
    showError("Tone.js start error: " + err);
  }
  if (!waveSurferLeft || !waveSurferRight) return;

  if (!isPlaying) {
    waveSurferLeft.play();
    waveSurferRight.play();
    playBtn.textContent = "Pause";
    isPlaying = true;
  } else {
    waveSurferLeft.pause();
    waveSurferRight.pause();
    playBtn.textContent = "Play";
    isPlaying = false;
  }
});

/***********************************************
 9) Volume & Crossfader
***********************************************/
volumeA.addEventListener("input", e => {
  const val = parseFloat(e.target.value);
  if (waveSurferLeft) waveSurferLeft.setVolume(val);
});
volumeB.addEventListener("input", e => {
  const val = parseFloat(e.target.value);
  if (waveSurferRight) waveSurferRight.setVolume(val);
});
crossfader.addEventListener("input", e => {
  const xfVal = parseFloat(e.target.value);
  if (waveSurferLeft) waveSurferLeft.setVolume(1.0 - xfVal);
  if (waveSurferRight) waveSurferRight.setVolume(xfVal);
});

/***********************************************
 10) Performance Pads (Tone.js)
***********************************************/
function playSample(sampleUrl) {
  const player = new Tone.Player(sampleUrl).toDestination();
  player.autostart = true;
}
padsLeft.forEach(btn => {
  btn.addEventListener("click", () => {
    const smp = btn.getAttribute("data-sample");
    if (sampleLib[smp]) playSample(sampleLib[smp]);
  });
});
padsRight.forEach(btn => {
  btn.addEventListener("click", () => {
    const smp = btn.getAttribute("data-sample");
    if (sampleLib[smp]) playSample(sampleLib[smp]);
  });
});

/***********************************************
 11) Jog Wheels
***********************************************/
jogWheelLeft.addEventListener("click", () => {
  alert("Left Jog clicked! (Scratching not implemented.)");
});
jogWheelRight.addEventListener("click", () => {
  alert("Right Jog clicked! (Scratching not implemented.)");
});

/***********************************************
 12) Tempo Match
***********************************************/
tempoMatchBtn.addEventListener("click", () => {
  alert("Tempo match not fully implemented in Xmas scaffold.");
});

/***********************************************
 13) Manual Looping
***********************************************/
waveSurferLeft && waveSurferLeft.on("finish", () => {
  if (leftLoopActive && leftLoopIn !== null && leftLoopOut !== null) {
    waveSurferLeft.seekTo(leftLoopIn / waveSurferLeft.getDuration());
    waveSurferLeft.play();
  }
});
waveSurferRight && waveSurferRight.on("finish", () => {
  if (rightLoopActive && rightLoopIn !== null && rightLoopOut !== null) {
    waveSurferRight.seekTo(rightLoopIn / waveSurferRight.getDuration());
    waveSurferRight.play();
  }
});

// Left
leftLoopInBtn.addEventListener("click", () => {
  if (waveSurferLeft) {
    leftLoopIn = waveSurferLeft.getCurrentTime();
    alert(`Left deck loop IN => ${leftLoopIn.toFixed(2)}s`);
  }
});
leftLoopOutBtn.addEventListener("click", () => {
  if (waveSurferLeft) {
    leftLoopOut = waveSurferLeft.getCurrentTime();
    alert(`Left deck loop OUT => ${leftLoopOut.toFixed(2)}s`);
  }
});
leftLoopToggleBtn.addEventListener("click", () => {
  leftLoopActive = !leftLoopActive;
  alert(`Left deck loop => ${leftLoopActive ? "ON" : "OFF"}`);
});

// Right
rightLoopInBtn.addEventListener("click", () => {
  if (waveSurferRight) {
    rightLoopIn = waveSurferRight.getCurrentTime();
    alert(`Right deck loop IN => ${rightLoopIn.toFixed(2)}s`);
  }
});
rightLoopOutBtn.addEventListener("click", () => {
  if (waveSurferRight) {
    rightLoopOut = waveSurferRight.getCurrentTime();
    alert(`Right deck loop OUT => ${rightLoopOut.toFixed(2)}s`);
  }
});
rightLoopToggleBtn.addEventListener("click", () => {
  rightLoopActive = !rightLoopActive;
  alert(`Right deck loop => ${rightLoopActive ? "ON" : "OFF"}`);
});

/***********************************************
 14) Advanced Controls
***********************************************/
// Left
leftQuantizeBtn.addEventListener("click", () => {
  alert("Left quantize toggled (placeholder).");
});
leftHalfSpeedBtn.addEventListener("click", () => {
  if (waveSurferLeft) {
    const rate = waveSurferLeft.getPlaybackRate();
    waveSurferLeft.setPlaybackRate(rate * 0.5);
    alert(`Left deck speed => ${waveSurferLeft.getPlaybackRate().toFixed(2)}x`);
  }
});
leftDoubleSpeedBtn.addEventListener("click", () => {
  if (waveSurferLeft) {
    const rate = waveSurferLeft.getPlaybackRate();
    waveSurferLeft.setPlaybackRate(rate * 2);
    alert(`Left deck speed => ${waveSurferLeft.getPlaybackRate().toFixed(2)}x`);
  }
});

// Right
rightQuantizeBtn.addEventListener("click", () => {
  alert("Right quantize toggled (placeholder).");
});
rightHalfSpeedBtn.addEventListener("click", () => {
  if (waveSurferRight) {
    const rate = waveSurferRight.getPlaybackRate();
    waveSurferRight.setPlaybackRate(rate * 0.5);
    alert(`Right deck speed => ${waveSurferRight.getPlaybackRate().toFixed(2)}x`);
  }
});
rightDoubleSpeedBtn.addEventListener("click", () => {
  if (waveSurferRight) {
    const rate = waveSurferRight.getPlaybackRate();
    waveSurferRight.setPlaybackRate(rate * 2);
    alert(`Right deck speed => ${waveSurferRight.getPlaybackRate().toFixed(2)}x`);
  }
});

/***********************************************
 15) On DOMContentLoaded
***********************************************/
document.addEventListener("DOMContentLoaded", () => {
  initWaveSurfers();
});
