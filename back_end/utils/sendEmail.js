import nodemailer from "nodemailer";

/**
 * sendTicketEmail(toEmail | userObj, eventObj, bookingObj, qrImageBase64)
 */
export const sendTicketEmail = async (
  firstArg,
  event = {},
  booking = {},
  qrImage = null
) => {
  try {
    /* --------------------------------------------------------
       1. Lấy email người nhận
    --------------------------------------------------------- */
    let toEmail = null;

    if (typeof firstArg === "string") {
      toEmail = firstArg;
    } else if (firstArg && typeof firstArg === "object") {
      toEmail = firstArg.email || firstArg?.contact?.email || null;
    }

    if (!toEmail || !toEmail.includes("@")) {
      throw new Error(`Email người nhận không hợp lệ: ${toEmail}`);
    }

    /* --------------------------------------------------------
       2. Format thông tin event + booking
    --------------------------------------------------------- */
    const eventTitle = event?.title || "Sự kiện chưa xác định";

    // ngày diễn ra
    let eventDateDisplay = "";
    if (event?.date) {
      const d = new Date(event.date);
      if (!isNaN(d)) eventDateDisplay = d.toLocaleString("vi-VN");
    }

    // địa điểm: nếu không có -> ẩn dòng
    const eventLocation = event?.locationId || "";


    const quantityDisplay = booking?.quantity ?? 1;
    const statusDisplay = booking?.status || "Đang xử lý";

    let totalPriceDisplay = "0";
    if (!isNaN(Number(booking.totalPrice))) {
      totalPriceDisplay = Number(booking.totalPrice).toLocaleString("vi-VN");
    }

    const ticketType = booking?.ticketType || "Không rõ";

    // Ngăn ReferenceError bookingId
    const bookingId = booking?._id || booking?.id || "";

    /* --------------------------------------------------------
       3. Chuẩn hóa QR code
    --------------------------------------------------------- */
    let qrBase64 = null;
    if (typeof qrImage === "string") {
      if (qrImage.includes("base64,")) qrBase64 = qrImage.split("base64,")[1];
      else qrBase64 = qrImage;
    }

    /* --------------------------------------------------------
       4. Cấu hình Gmail SMTP
    --------------------------------------------------------- */
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    /* --------------------------------------------------------
       5. Nội dung HTML email (đã FIX FULL)
    --------------------------------------------------------- */
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2b6cb0;">🎫 Cảm ơn bạn đã đặt vé tại <b>TicketNow</b>!</h2>
        <p>Dưới đây là thông tin vé của bạn:</p>
<table style="border-collapse: collapse; margin-top: 10px;">
        
          <tr><td style="padding:4px 8px;"><b>Sự kiện:</b></td><td>${eventTitle}</td></tr>

          ${eventDateDisplay
        ? `<tr><td style="padding:4px 8px;"><b>Ngày diễn ra:</b></td><td>${eventDateDisplay}</td></tr>`
        : ""
      }

          ${eventLocation
        ? `<tr><td style="padding:4px 8px;"><b>Địa điểm:</b></td><td>${eventLocation}</td></tr>`
        : ""
      }

          <tr><td style="padding:4px 8px;"><b>Loại vé:</b></td><td>${ticketType}</td></tr>
          <tr><td style="padding:4px 8px;"><b>Số lượng vé:</b></td><td>${quantityDisplay}</td></tr>
          <tr><td style="padding:4px 8px;"><b>Tổng tiền:</b></td><td>${totalPriceDisplay} VNĐ</td></tr>

          <!-- ❌ ĐÃ XÓA HOÀN TOÀN MÃ BOOKING -->
          <!-- (Không để ${bookingId} trong template nữa để tránh lỗi) -->

          <tr><td style="padding:4px 8px;"><b>Trạng thái:</b></td><td>${statusDisplay}</td></tr>
        </table>

        <br/>

        <p>🎟️ <b>Mã QR check-in của bạn:</b></p>
        ${qrBase64
        ? `<img src="cid:qrcode"
                    alt="QR Code"
                    style="width:180px;height:180px;border:1px solid #ccc;padding:5px;" />`
        : `<p style="color:#777;">QR code không có hoặc không hợp lệ.</p>`
      }

        <p style="margin-top:20px; color: #555;">
          Vui lòng sử dụng mã QR này để quét khi vào cổng.<br/>
          Chúc bạn có một trải nghiệm tuyệt vời tại sự kiện! 🌟
        </p>
      </div>
    `;

    /* --------------------------------------------------------
       6. Gửi email
    --------------------------------------------------------- */
    const mailOptions = {
      from: `"TicketNow 🎫" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `🎉 Vé sự kiện của bạn - ${eventTitle}`,
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

    console.log("📧 Sending email to:", toEmail);
    const info = await transporter.sendMail(mailOptions);

    console.log("📧 Email sent OK:", info.response);

    return info;
  } catch (err) {
    console.error("❌ Lỗi sendTicketEmail:", err);
    throw err;
  }
};