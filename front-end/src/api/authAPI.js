// src/api/authAPI.js
const API_URL = "http://localhost:5000/api/auth";

// 🟠 reCAPTCHA v3 — Site Key
const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

/* ----------------------- TẠO TOKEN reCAPTCHA ----------------------- */
async function generateRecaptchaToken(actionName) {
  return new Promise((resolve, reject) => {
    if (!window.grecaptcha) {
      console.error("⚠️ reCAPTCHA chưa load");
      return resolve(null);
    }

    window.grecaptcha.ready(async () => {
      try {
        const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, {
          action: actionName,
        });
        resolve(token);
      } catch (err) {
        console.error("⚠️ Lỗi khi tạo reCAPTCHA token:", err);
        resolve(null);
      }
    });
  });
}


/* ----------------------- LOGIN ----------------------- */
export async function loginUser(credentials) {
  const recaptchaToken = await generateRecaptchaToken("login");

  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...credentials,
      recaptchaToken, // 🔥 gửi token
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Đăng nhập thất bại");
  return data;
}

/* ----------------------- REGISTER ----------------------- */
export async function registerUser(userData) {
  let recaptchaToken = await generateRecaptchaToken("register");
if (!recaptchaToken) {
    console.warn("Token null, retry...");
    recaptchaToken = await generateRecaptchaToken("register");
}

  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...userData,
      recaptchaToken, // 🔥 gửi token
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Đăng ký thất bại");
  return data;
}

/* ----------------------- GOOGLE LOGIN ----------------------- */
export async function googleLoginUser(googleData) {
  const recaptchaToken = await generateRecaptchaToken("google");

  const res = await fetch(`${API_URL}/google-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...googleData,
      recaptchaToken, // 🔥 thêm token để tránh spam bot
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Đăng nhập Google thất bại");
  return data;
}

/* ----------------------- FORGOT PASSWORD ----------------------- */
export async function forgotPassword(email) {
  const res = await fetch(`${API_URL}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

/* ----------------------- VERIFY OTP ----------------------- */
export async function verifyOtp(email, otp) {
  const res = await fetch(`${API_URL}/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

/* ----------------------- RESET PASSWORD ----------------------- */
export async function resetPassword(email, otp, newPassword) {
  const res = await fetch(`${API_URL}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}
