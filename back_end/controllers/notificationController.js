import Notification from "../model/Notification.js";
import Event from "../model/Event.js";

// GET /api/notifications?page=&limit=
export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);

    const filter = { userId };
    const [items, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Notification.countDocuments(filter),
    ]);
    res.json({ data: items, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PATCH /api/notifications/:id/read
export const markRead = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;
    const n = await Notification.findOneAndUpdate({ _id: id, userId }, { read: true }, { new: true });
    if (!n) return res.status(404).json({ message: 'Not found' });
    res.json(n);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Utility: tạo thông báo (có thể là tức thời hoặc future)
export const createNotification = async ({ userId, title, message, eventId, scheduledFor }, io) => {
  const n = await Notification.create({ userId, title, message, eventId, scheduledFor });
  // Nếu không có scheduledFor hoặc thời điểm đã qua, gửi ngay
  if (!scheduledFor || scheduledFor <= new Date()) {
    io?.to(`user:${userId}`).emit('notify', {
      id: n._id.toString(),
      title: n.title,
      message: n.message,
      time: new Date().toISOString(),
    });
    n.sentAt = new Date();
    await n.save();
  }
  return n;
};

// POST /api/notifications/after-payment { eventId }
export const afterPayment = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { eventId } = req.body || {};
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!eventId) return res.status(400).json({ message: 'Missing eventId' });

    const ev = await Event.findById(eventId);
    if (!ev) return res.status(404).json({ message: 'Event not found' });

    const io = req.app.get('io');

    // Chỉ tạo thông báo nhắc nhở 1 giờ trước sự kiện (không tạo thông báo thanh toán thành công)
    let scheduledId = null;
    if (ev.date) {
      const startTime = new Date(ev.date);
      const oneHourBefore = new Date(startTime.getTime() - 60 * 60 * 1000);
      // Chỉ lên lịch nếu còn đủ 1 giờ trước sự kiện
      if (oneHourBefore > new Date()) {
        const scheduled = await createNotification({
          userId,
          eventId,
          title: 'Nhắc nhở sự kiện',
          message: 'Sự kiện bạn đã mua sẽ bắt đầu sau 1 giờ',
          scheduledFor: oneHourBefore,
        }, io);
        scheduledId = scheduled._id;
      }
    }

    res.json({ ok: true, scheduledId });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
