import nodemailer from "nodemailer";

/**
 * Flexible sendTicketEmail:
 *  sendTicketEmail(toEmailString, eventObj, bookingObj, qrImage)
 *  OR
 *  sendTicketEmail(userObject, eventObj, bookingObj, qrImage)
 *
 * qrImage may be a data URL (data:image/png;base64,...) or a plain base64 string.
 */
export const sendTicketEmail = async (firstArg, event = {}, booking = {}, qrImage = null) => {
  try {
    // --- normalize recipient email ---
    let toEmail = null;
    if (typeof firstArg === "string") {
      toEmail = firstArg;
    } else if (firstArg && typeof firstArg === "object") {
      toEmail = firstArg.email || firstArg?.contact?.email || null;
    }

    if (!toEmail || typeof toEmail !== "string" || !toEmail.includes("@")) {
      throw new Error(`Email người nhận không hợp lệ: ${toEmail}`);
    }

    // --- safe format for event & booking ---
    const eventTitle = event?.title || "Sự kiện chưa xác định";

    let eventDateDisplay = "Chưa cập nhật";
    if (event?.date) {
      const d = new Date(event.date);
      if (!isNaN(d)) eventDateDisplay = d.toLocaleString("vi-VN");
    }

    const eventLocation = event?.location || event?.venue || "Chưa có địa điểm";

    let totalPriceDisplay = "0";
    if (booking && booking.totalPrice != null) {
      const n = Number(booking.totalPrice);
      if (!Number.isNaN(n)) totalPriceDisplay = n.toLocaleString("vi-VN");
    }

    const quantityDisplay = booking?.quantity ?? 1;
    const statusDisplay = booking?.status || "Đang xử lý";
    const bookingId = booking?._id || booking?.id || "—";

    // --- prepare QR base64 (if provided) ---
    let qrBase64 = null;
    if (typeof qrImage === "string" && qrImage.includes("base64,")) {
      qrBase64 = qrImage.split("base64,")[1];
    } else if (typeof qrImage === "string") {
      qrBase64 = qrImage;
    }

    // --- transporter ---
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password
      },
    });

    // --- html ---
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2b6cb0;">Cảm ơn bạn đã đặt vé tại <b>TicketNow</b>!</h2>
        <p>Dưới đây là thông tin vé của bạn:</p>
        <table style="border-collapse: collapse; margin-top: 10px;">
          <tr><td style="padding:4px 8px;"><b>Sự kiện:</b></td><td>${eventTitle}</td></tr>
          <tr><td style="padding:4px 8px;"><b>Ngày diễn ra:</b></td><td>${eventDateDisplay}</td></tr>
          <tr><td style="padding:4px 8px;"><b>Địa điểm:</b></td><td>${eventLocation}</td></tr>
          <tr><td style="padding:4px 8px;"><b>Số lượng vé:</b></td><td>${quantityDisplay}</td></tr>
          <tr><td style="padding:4px 8px;"><b>Tổng tiền:</b></td><td>${totalPriceDisplay} VNĐ</td></tr>
<tr><td style="padding:4px 8px;"><b>Trạng thái:</b></td><td>${statusDisplay}</td></tr>
          <tr><td style="padding:4px 8px;"><b>Mã booking:</b></td><td>${bookingId}</td></tr>
        </table>

        <br/>
        <p>🎟️ <b>Mã QR check-in của bạn:</b></p>
        ${qrBase64 ? `<img src="cid:qrcode" alt="QR Code" style="width:180px;height:180px;border:1px solid #ccc;padding:5px;" />`
                   : `<p style="color:#777">QR code không có hoặc không hợp lệ.</p>`}

        <p style="margin-top:20px; font-style: italic; color: #555;">
          Vui lòng mang mã này đến để quét khi vào cổng.<br/>Chúc bạn có một trải nghiệm tuyệt vời! 💫
        </p>
      </div>
    `;

    const mailOptions = {
      from: `"TicketNow 🎫" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `🎉 Vé sự kiện "${eventTitle}" - TicketNow`,
      
      // ✅ Thêm header ưu tiên cao
  headers: {
    "X-Priority": "1",
    "X-MSMail-Priority": "High",
    Importance: "high",
  },

  html,
  attachments: qrBase64
    ? [
        {
          filename: "ticket_qr.png",
          content: qrBase64,
          encoding: "base64",
          cid: "qrcode",
        },
      ]
    : [],
    };

    console.log("📧 Sending email:", { to: toEmail, subject: mailOptions.subject, hasQr: !!qrBase64 });

    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent:", info && info.response ? info.response : info);
    return info;
  } catch (err) {
    console.error("❌ Lỗi trong sendTicketEmail:", err);
    throw err;
  }
};
