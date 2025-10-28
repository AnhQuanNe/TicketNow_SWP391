import Notification from "../model/Notification.js";
import Event from "../model/Event.js";

// GET /api/notifications?page=&limit=
export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    // By default, hide future scheduled notifications (scheduledFor > now).
    // Client can pass ?showUpcoming=true to include scheduled future reminders.
    const showUpcoming = String(req.query.showUpcoming || '').toLowerCase() === 'true';

    const now = new Date();
    let filter;
    if (showUpcoming) {
      filter = { userId };
    } else {
      // Only include notifications that are immediate (no scheduledFor), or scheduledFor <= now, or already sent (sentAt != null)
      filter = {
        userId,
        $or: [
          { scheduledFor: { $exists: false } },
          { scheduledFor: { $lte: now } },
          { sentAt: { $ne: null } },
        ],
      };
    }
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
export const createNotification = async ({ userId, title, message, eventId, scheduledFor }, io, agenda) => {
  // Defensive de-duplication: for immediate notifications, avoid creating the same message twice in a short window
  if (!scheduledFor) {
    try {
      const recent = await Notification.findOne({
        userId,
        title,
        message,
        createdAt: { $gte: new Date(Date.now() - 30 * 1000) },
      });
      if (recent) return recent;
    } catch (e) {
      // ignore dedupe errors and proceed to create
    }
  }

  const n = await Notification.create({ userId, title, message, eventId, scheduledFor });
  // If scheduledFor is not provided -> send immediately
  if (!scheduledFor) {
    io?.to(`user:${String(userId)}`).emit('notify', {
      id: n._id.toString(),
      title: n.title,
      message: n.message,
      time: new Date().toISOString(),
    });
    n.sentAt = new Date();
    await n.save();
    return n;
  }

  // If scheduledFor is in the past, treat it as immediate (send now)
    if (scheduledFor <= new Date()) {
    io?.to(`user:${String(userId)}`).emit('notify', {
      id: n._id.toString(),
      title: n.title,
      message: n.message,
      time: new Date().toISOString(),
    });
    n.sentAt = new Date();
    await n.save();
    console.log('createNotification: scheduledFor was in the past, sent immediately', { userId, eventId, scheduledFor: scheduledFor.toISOString() });
    return n;
  }

  // scheduledFor is in the future. If agenda is provided, schedule a job and record jobId
  if (agenda) {
    try {
      const job = await agenda.schedule(scheduledFor, 'send-notification', { notificationId: n._id.toString() });
      // store job id for potential cancel/reschedule
      n.jobId = job.attrs._id?.toString?.() || null;
      await n.save();
      console.log('createNotification: scheduled job with agenda', { notificationId: n._id.toString(), jobId: n.jobId, scheduledFor: scheduledFor.toISOString() });
      return n;
    } catch (err) {
      console.error('createNotification: failed to schedule agenda job, falling back to DB-only', err);
      // leave the notification in DB without jobId; scheduler-rescue on startup will pick it up
      return n;
    }
  }

  // If no agenda provided, just leave notification in DB (previous polling scheduler may pick it up)
  console.log('createNotification: agenda not provided, notification saved for future delivery', { notificationId: n._id.toString(), scheduledFor: scheduledFor.toISOString() });
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
  const agenda = req.app.get('agenda');

    // Chỉ tạo thông báo nhắc nhở 1 giờ trước sự kiện (không tạo thông báo thanh toán thành công)
    let scheduledId = null;
    if (ev.date) {
      const startTime = new Date(ev.date);
      let oneHourBefore = new Date(startTime.getTime() - 60 * 60 * 1000);
      // Normalize seconds/milliseconds
      oneHourBefore.setSeconds(0, 0);
      // Only schedule if more than 1 hour remains
      if (oneHourBefore > new Date()) {
        console.log('afterPayment: scheduling reminder', { eventId, userId, startTime: startTime.toISOString(), scheduledFor: oneHourBefore.toISOString() });
        const scheduled = await createNotification({
          userId,
          eventId,
          title: 'Nhắc nhở sự kiện',
          message: 'Sự kiện bạn đã mua sẽ bắt đầu sau 1 giờ',
          scheduledFor: oneHourBefore,
        }, io, agenda);
        scheduledId = scheduled._id;
      } else {
        console.log('afterPayment: reminder skipped because less than 1 hour remains', { eventId, userId, startTime: startTime.toISOString(), oneHourBefore: oneHourBefore.toISOString() });
      }
    }

    res.json({ ok: true, scheduledId });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
