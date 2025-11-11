import QRCode from "qrcode";

export const generateQRCode = async (text) => {
  try {
    const qr = await QRCode.toDataURL(text);
    return qr;
  } catch (err) {
    console.error("Lỗi tạo QR:", err);
    throw err;
  }
};
