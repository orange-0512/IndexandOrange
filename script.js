/**
 * 電子喜帖婚宴全域設定
 * 可依新人實際場地與後端資料庫更換以下設定值
 */
const WEDDING_CONFIG = {
  // 婚宴目標時間（專案名稱 wedding1206 預設設為 2026/12/06 12:00）
  targetDate: new Date("2026-12-06T12:00:00+08:00").getTime(),

  // 婚宴場地名稱與地址
  venue: {
    name: "來來龍鳳城",
    address: "苗栗縣竹南鎮龍江街 103 之 1 號",
    mapQuery: "苗栗縣竹南鎮龍江街103之1號 來來龍鳳城",
  },

  // 賓客名單搜集後端 API（支援 Google Apps Script 網路應用程式網址）
  // 若為空字串，將預設儲存於瀏覽器 localStorage 作為本機測試
  sheetApiEndpoint: "https://script.google.com/macros/library/d/1UJFY2TJg70JiO_hf5quhH1DNyymR2qL1drFDcMBZAu8euxxIWfifAmnR/2"

document.addEventListener("DOMContentLoaded", () => {
    initCountdown();
    initCalendarAction();
    initMapAction();
    initFormInteractions();
  });

  /**
   * 1. 倒數計時模組
   */
  function initCountdown() {
    const daysEl = document.getElementById("daysVal");
const hoursEl = document.getElementById("hoursVal");
const minutesEl = document.getElementById("minutesVal");

function update() {
  const now = new Date().getTime();
  const diff = WEDDING_CONFIG.targetDate - now;

  if (diff <= 0) {
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

    feedbackEl.textContent = "";
    feedbackEl.className = "form-feedback";

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
      const storedList = JSON.parse(localStorage.getItem("wedding_rsvp_list") || "[]");
      storedList.push(payload);
      localStorage.setItem("wedding_rsvp_list", JSON.stringify(storedList));

      if (WEDDING_CONFIG.sheetApiEndpoint) {
        // 送出至後端 Google Apps Script（使用 no-cors 模式防止 GAS 重定向引發跨域阻擋）
        await fetch(WEDDING_CONFIG.sheetApiEndpoint, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
        });
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
      submitBtn.textContent = "確認送出，期待相見";
    }
  });

  function showFeedback(text, type) {
    feedbackEl.textContent = text;
    feedbackEl.className = `form-feedback is-${type}`;
  }
}
