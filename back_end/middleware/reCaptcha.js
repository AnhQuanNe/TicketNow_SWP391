// import axios from "axios";

// export const verifyRecaptcha = async (req, res, next) => {
//   try {
//     const token = req.body.recaptchaToken;
//     if (!token) {
//       return res.status(400).json({
//         message: "Thiếu reCAPTCHA token.",
//       });
//     }

//     const secretKey = process.env.RECAPTCHA_SECRET;

//     // Gửi request lên Google để verify token
//     const response = await axios.post(
//       "https://www.google.com/recaptcha/api/siteverify",
//       null,
//       {
//         params: {
//           secret: secretKey,
//           response: token,
//         },
//       }
//     );

//     const data = response.data;

//     // Debug nếu muốn xem data trả về
//     // console.log("Recaptcha verify result:", data);

//     // Kiểm tra hợp lệ
//     if (!data.success) {
//       return res.status(400).json({
//         message: "reCAPTCHA thất bại.",
//       });
//     }

//     // Kiểm tra score (v3 dùng điểm)
//     if (data.score !== undefined && data.score < 0.5) {
//       return res.status(400).json({
//         message: "reCAPTCHA bị nghi ngờ là bot.",
//       });
//     }

//     next();
//   } catch (err) {
//     console.error("reCAPTCHA error:", err);
//     return res.status(500).json({
//       message: "Lỗi xác minh reCAPTCHA.",
//     });
//   }
// };
