import Notification from '../model/Notification.js';

export default function defineNotificationJobs(agenda, io) {
  // send-notification: emits notification and marks it sent
  agenda.define('send-notification', { lockLifetime: 10000 }, async (job) => {
    try {
      const { notificationId } = job.attrs.data || {};
      if (!notificationId) return;

      const n = await Notification.findById(notificationId);
      if (!n) return;

      // If already sent, skip
      if (n.sentAt) return;

      // Emit via Socket.IO
      if (io) {
        io.to(`user:${String(n.userId)}`).emit('notify', {
          id: n._id.toString(),
          title: n.title,
          message: n.message,
          time: new Date().toISOString(),
        });
      }

      n.sentAt = new Date();
      await n.save();
    } catch (err) {
      console.error('Agenda job send-notification error:', err);
      throw err;
    }
  });
}
