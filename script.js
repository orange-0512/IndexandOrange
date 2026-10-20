/**
 * 電子喜帖婚宴全域設定
 * 可依新人實際場地與後端資料庫更換以下設定值
 */
const WEDDING_CONFIG = {
  // 婚宴目標時間：2026 年 12 月 6 日 12:00（使用數值建構，百分之百相容所有手機與 iOS Safari）
  targetDate: new Date(2026, 11, 6, 12, 0, 0).getTime(),

  // 婚宴場地名稱與地址
  venue: {
    name: "來來龍鳳城",
    address: "苗栗縣竹南鎮龍江街 103 之 1 號",
    mapQuery: "苗栗縣竹南鎮龍江街103之1號 來來龍鳳城",
  },

  // 賓客名單搜集後端 API（支援 Google Apps Script 網路應用程式網址）
  sheetApiEndpoint: "https://script.google.com/macros/s/AKfycbyH8foO_0mg-xbfHIXXqkjQ5Z6NVbrRwL1IeWZMc0NAlrnVexKRhPx4s91BLy3WxSxyLg/exec",
};

// 立即執行或等待 DOM 就緒（防禦性執行，避免因載入時序錯過 DOMContentLoaded 事件）
function initAll() {
  initCountdown();
  initCalendarAction();
  initMapAction();
  initFormInteractions();
  initYouTubeAudio();
  initMusicToggle();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAll);
} else {
  initAll();
}

/**
 * 1. 倒數計時模組
 */
function initCountdown() {
  const daysEl = document.getElementById("daysVal");
  const hoursEl = document.getElementById("hoursVal");
  const minutesEl = document.getElementById("minutesVal");

  function update() {
    const now = Date.now();
    const diff = WEDDING_CONFIG.targetDate - now;

    if (diff <= 0 || isNaN(diff)) {
      if (daysEl) daysEl.textContent = "00";
      if (hoursEl) hoursEl.textContent = "00";
      if (minutesEl) minutesEl.textContent = "00";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (daysEl) daysEl.textContent = String(days).padStart(2, "0");
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, "0");
  }

  update();
  setInterval(update, 1000);
}

/**
 * 2. 加入 Google 行事曆
 */
function initCalendarAction() {
  const btn = document.getElementById("calendarBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const title = encodeURIComponent("葉政宣 & 翁千矞 文定之喜");
    const details = encodeURIComponent("誠摯邀請您共襄盛舉，見證我們的幸福時刻！");
    const location = encodeURIComponent(`${WEDDING_CONFIG.venue.name}（${WEDDING_CONFIG.venue.address}）`);
    // 20261206T040000Z to 20261206T080000Z (UTC 時間對應台灣中午 12:00 至 16:00)
    const dates = "20261206T040000Z/20261206T080000Z";

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
    window.open(googleCalendarUrl, "_blank", "noopener,noreferrer");
  });
}

/**
 * 3. 開啟 Google 地圖導航
 */
function initMapAction() {
  const btn = document.getElementById("mapsBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const query = encodeURIComponent(WEDDING_CONFIG.venue.mapQuery || WEDDING_CONFIG.venue.address);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  });
}

/**
 * 4. 出席調查表單互動與送出
 */
function initFormInteractions() {
  const form = document.getElementById("rsvpForm");
  const attendanceRadios = document.querySelectorAll('input[name="attendanceStatus"]');
  const attendeeDetails = document.getElementById("attendeeDetails");
  const feedbackEl = document.getElementById("formFeedback");
  const submitBtn = document.getElementById("submitBtn");

  if (!form) return;

  // 切換「出席」或「不克出席」時顯示/隱藏人數欄位
  attendanceRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const isAttending = e.target.value === "attend";
      if (attendeeDetails) {
        if (isAttending) {
          attendeeDetails.classList.remove("is-hidden");
        } else {
          attendeeDetails.classList.add("is-hidden");
        }
      }
    });
  });

  // 表單送出處理
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (feedbackEl) {
      feedbackEl.textContent = "";
      feedbackEl.className = "form-feedback";
    }

    const formData = new FormData(form);
    const guestName = formData.get("guestName")?.trim();
    const guestPhone = formData.get("guestPhone")?.trim();
    const attendanceStatus = formData.get("attendanceStatus");
    const isAttending = attendanceStatus === "attend";

    const adultCount = isAttending ? parseInt(formData.get("adultCount") || "0", 10) : 0;
    const childCount = isAttending ? parseInt(formData.get("childCount") || "0", 10) : 0;
    const meatCount = isAttending ? parseInt(formData.get("meatCount") || "0", 10) : 0;
    const vegCount = isAttending ? parseInt(formData.get("vegCount") || "0", 10) : 0;
    const blessingMsg = formData.get("blessingMsg")?.trim() || "";
    const remarks = formData.get("remarks")?.trim() || "";

    // 前端防呆驗證
    if (!guestName) {
      showFeedback("請填寫賓客真實姓名", "error");
      return;
    }

    if (!guestPhone || !/^09\d{8}$/.test(guestPhone.replace(/[-\s]/g, ""))) {
      showFeedback("請填寫正確的手機號碼（例：0912345678）", "error");
      return;
    }

    if (isAttending) {
      if (adultCount < 1) {
        showFeedback("出席大人人數至少需填寫 1 位", "error");
        return;
      }
      const totalPeople = adultCount + childCount;
      const totalMeals = meatCount + vegCount;
      if (totalMeals !== totalPeople) {
        showFeedback(`葷食與素食合計（${totalMeals} 份）需等於總人數（${totalPeople} 位）`, "error");
        return;
      }
    }

    const payload = {
      timestamp: new Date().toISOString(),
      guestName,
      guestPhone,
      attendanceStatus: isAttending ? "準時出席" : "不克出席（祝福滿滿）",
      adultCount,
      childCount,
      meatCount,
      vegCount,
      blessingMsg,
      remarks,
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "傳送中...";

    try {
      // 一律備份至本機 localStorage 避免意外遺失
      try {
        const storedList = JSON.parse(localStorage.getItem("wedding_rsvp_list") || "[]");
        storedList.push(payload);
        localStorage.setItem("wedding_rsvp_list", JSON.stringify(storedList));
      } catch (storageErr) {
        console.warn("LocalStorage backup warning:", storageErr);
      }

      // 送出至後端 Google Apps Script（需為 /exec 結尾的 Web App URL）
      const endpoint = WEDDING_CONFIG.sheetApiEndpoint?.trim();
      if (endpoint && endpoint.includes("/exec")) {
        await fetch(endpoint, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
        });
      } else if (endpoint) {
        console.warn("提醒：目前設定的 Google Apps Script 網址非 Web App 執行端點，資料已暫存於瀏覽器。");
      }

      showFeedback("已成功送出！感謝您的填寫與祝福。", "success");
      form.reset();
      // 還原預設值
      const defaultAttendRadio = form.querySelector('input[value="attend"]');
      if (defaultAttendRadio) defaultAttendRadio.checked = true;
      if (attendeeDetails) attendeeDetails.classList.remove("is-hidden");
    } catch (err) {
      showFeedback("送出失敗，請檢查網路連線或稍後再試。", "error");
      console.error("RSVP Submission Error:", err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "確認填寫，送出！";
    }
  });

  function showFeedback(text, type) {
    if (!feedbackEl) return;
    feedbackEl.textContent = text;
    feedbackEl.className = `form-feedback is-${type}`;
  }
}

/**
 * 5. YouTube 背景音樂模組（韓寶儀《往事只能回味》）
 */
let ytPlayer = null;
let isMusicPlaying = false;
let ytReady = false;
let userManuallyPaused = false;

function initYouTubeAudio() {
  // 動態載入 YouTube IFrame API
  if (!window.YT) {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(tag, firstScript);
    } else {
      document.head.appendChild(tag);
    }
  }

  // 註冊 YouTube API 全域回呼
  window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player("ytPlayer", {
      height: "1",
      width: "1",
      videoId: "sXdEZlWADrY",
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        loop: 1,
        playlist: "sXdEZlWADrY",
        playsinline: 1,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: (event) => {
          ytReady = true;
          event.target.setVolume(75);
          // 嘗試直接自動播放
          tryStartMusic();
        },
        onStateChange: onPlayerStateChange,
      },
    });
  };

  // 行動裝置相容性：首次觸控或滑動時自動喚醒播放（突破 iOS/Android 自動發聲限制）
  setupFirstInteractionAutoplay();
}

function tryStartMusic() {
  if (!ytPlayer || userManuallyPaused) return;
  try {
    ytPlayer.playVideo();
  } catch (err) {
    console.log("瀏覽器等待使用者觸控後播放音訊:", err);
  }
}

function setupFirstInteractionAutoplay() {
  const events = ["click", "touchstart", "touchend", "pointerdown", "scroll"];
  
  function triggerOnFirstTouch() {
    if (!userManuallyPaused && ytPlayer && !isMusicPlaying) {
      try {
        ytPlayer.playVideo();
      } catch (err) {
        console.warn("Autoplay trigger:", err);
      }
    }
    // 成功觸發後清理監聽
    events.forEach((evt) => {
      window.removeEventListener(evt, triggerOnFirstTouch, { capture: true });
    });
  }

  events.forEach((evt) => {
    window.addEventListener(evt, triggerOnFirstTouch, { capture: true, once: true });
  });
}

function onPlayerStateChange(event) {
  const musicToggleBtn = document.getElementById("musicToggleBtn");
  const musicLabel = document.getElementById("musicLabel");
  const musicDiscIcon = document.getElementById("musicDiscIcon");

  // YT.PlayerState.PLAYING === 1
  if (event.data === 1) {
    isMusicPlaying = true;
    musicToggleBtn?.classList.add("is-playing");
    if (musicLabel) musicLabel.textContent = "音樂：開";
    musicDiscIcon?.classList.add("spinning");
  } else {
    isMusicPlaying = false;
    // 只有在使用者手動暫停或播放器真正停止時更新 UI
    if (userManuallyPaused) {
      musicToggleBtn?.classList.remove("is-playing");
      if (musicLabel) musicLabel.textContent = "音樂：關";
      musicDiscIcon?.classList.remove("spinning");
    }
  }
}

function initMusicToggle() {
  const btn = document.getElementById("musicToggleBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (!ytReady || !ytPlayer || typeof ytPlayer.playVideo !== "function") {
      btn.classList.add("is-loading");
      return;
    }

    if (isMusicPlaying) {
      userManuallyPaused = true;
      ytPlayer.pauseVideo();
      btn.classList.remove("is-playing");
      const musicLabel = document.getElementById("musicLabel");
      const musicDiscIcon = document.getElementById("musicDiscIcon");
      if (musicLabel) musicLabel.textContent = "音樂：關";
      musicDiscIcon?.classList.remove("spinning");
    } else {
      userManuallyPaused = false;
      ytPlayer.playVideo();
      btn.classList.add("is-playing");
      const musicLabel = document.getElementById("musicLabel");
      const musicDiscIcon = document.getElementById("musicDiscIcon");
      if (musicLabel) musicLabel.textContent = "音樂：開";
      musicDiscIcon?.classList.add("spinning");
    }
  });
}


