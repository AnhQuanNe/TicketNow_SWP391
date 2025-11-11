import nodemailer from "nodemailer";

export const sendTicketEmail = async (user, event, booking, qrImage) => {
  try {
    // 1️⃣ Tạo transporter gửi mail qua Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password (không phải mật khẩu Gmail)
      },
    });

    // 2️⃣ Kiểm tra dữ liệu an toàn
    const eventTitle = event?.title || "Sự kiện chưa xác định";
    const eventDate = event?.date
      ? new Date(event.date).toLocaleString("vi-VN")
      : "Chưa cập nhật";
    const eventLocation = event?.location || "Chưa có địa điểm";
    const totalPrice =
      booking?.totalPrice?.toLocaleString("vi-VN") || "0";

    // 3️⃣ Cấu hình nội dung email
    const mailOptions = {
      from: `"TicketNow 🎫" <${process.env.EMAIL_USER}>`,
      to: user?.email,
      subject: `🎉 Vé của bạn cho sự kiện "${eventTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #2b6cb0;">Cảm ơn bạn đã đặt vé tại <b>TicketNow!</b></h2>
          <p>Dưới đây là thông tin vé của bạn:</p>

          <table style="border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="padding: 4px 8px;"><b>Sự kiện:</b></td>
              <td>${eventTitle}</td>
            </tr>
            <tr>
              <td style="padding: 4px 8px;"><b>Ngày diễn ra:</b></td>
              <td>${eventDate}</td>
            </tr>
            <tr>
              <td style="padding: 4px 8px;"><b>Địa điểm:</b></td>
              <td>${eventLocation}</td>
            </tr>
            <tr>
              <td style="padding: 4px 8px;"><b>Số lượng vé:</b></td>
              <td>${booking?.quantity || 1}</td>
            </tr>
            <tr>
              <td style="padding: 4px 8px;"><b>Tổng tiền:</b></td>
              <td>${totalPrice} VNĐ</td>
            </tr>
            <tr>
              <td style="padding: 4px 8px;"><b>Trạng thái:</b></td>
              <td>${booking?.status || "Đang xử lý"}</td>
            </tr>
          </table>

          <br/>
          <p>🎟️ <b>Mã QR check-in của bạn:</b></p>
          <img src="cid:qrcode" alt="QR Code" style="width:180px; height:180px; border:1px solid #ccc; padding:5px;" />

          <p style="margin-top:20px; font-style: italic; color: #555;">
            Vui lòng mang mã này đến để quét khi vào cổng.<br/>
            Chúc bạn có một trải nghiệm tuyệt vời! 💫
          </p>
        </div>
      `,
      attachments: [
        {
          filename: "ticket_qr.png",
          content: qrImage?.split("base64,")[1],
          encoding: "base64",
          cid: "qrcode",
        },
      ],
    };

    // 4️⃣ Gửi email
    await transporter.sendMail(mailOptions);
    console.log("✅ Email vé đã được gửi thành công tới:", user?.email);
  } catch (error) {
    console.error("❌ Lỗi gửi email:", error);
    throw error;
  }
};
