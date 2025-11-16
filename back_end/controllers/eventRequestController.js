// controllers/EventRequestController.js
import EventRequest from "../model/EventRequest.js";
import Event from '../model/Event.js';
import User from '../model/User.js';
import Role from '../model/Role.js';
import Organizer from '../model/Organizer.js';
import Category from '../model/Category.js';
import fs from "fs";
import path from "path";

// ================= CREATE EVENT REQUEST =================
export const createEventRequest = async (req, res) => {
  try {
    const {
      eventName,
      eventDate,
      eventLocation,
      ticketCount,
      studentPrice,
      regularPrice,
      categoryId: rawCategoryId,
      startTime,
      description,
    } = req.body;

    // Kiểm tra user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Không tìm thấy thông tin organizer." });
    }

    const organizerId = req.user.id;
    let coverImage = null;

    // 🔍 Debug xem multer có nhận file không
    console.log("📦 Dữ liệu form nhận được:", req.body);
    console.log("🖼️ File upload:", req.file);

    // Nếu có file upload
    if (req.file) {
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }
      coverImage = `/uploads/${req.file.filename}`;
    }

    // Chuẩn hoá categoryId: phải là _id (string) tồn tại trong Categories
    let categoryId = rawCategoryId || null;
    if (categoryId) {
      // Nếu client gửi tên (ví dụ "Âm nhạc") thay vì id, chuyển sang id
      const byId = await Category.findById(categoryId).lean();
      if (!byId) {
        const byName = await Category.findOne({ name: categoryId }).lean();
        if (byName) categoryId = byName._id; // map name -> id
      }
      // Nếu vẫn không tìm thấy => bỏ qua để tránh lưu tên
      const valid = await Category.findById(categoryId).lean();
      if (!valid) categoryId = null;
    }

    // ✅ Tạo mới request sự kiện
    const newEvent = new EventRequest({
      eventName,
      eventDate,
      eventLocation,
      ticketCount,
      studentPrice,
      regularPrice,
      categoryId: categoryId || null,
      startTime: startTime || null,
      description,
      coverImage,
      organizerId,
    });

    await newEvent.save();

    res.status(201).json({
      message: "🎉 Tạo sự kiện thành công!",
      event: newEvent,
    });
  } catch (error) {
    console.error("❌ Lỗi khi tạo sự kiện:", error);
    res.status(500).json({
      message: "Tạo sự kiện thất bại",
      error: error.message,
    });
  }
};

// ================= GET ALL EVENT REQUESTS =================
export const getAllEventRequests = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Không tìm thấy user." });
    }

    let events;
// Nếu là admin => lấy tất cả sự kiện pending
    if (req.user.roleName === "admin") {
      events = await EventRequest.find({ status: "pending" }).sort({ createdAt: -1 });
    } 
    // Nếu là organizer => chỉ lấy sự kiện của chính organizer đó
    else {
      events = await EventRequest.find({
        status: "pending",
        organizerId: req.user.id
      }).sort({ createdAt: -1 });
    }

    res.status(200).json(events);
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách sự kiện:", error);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách sự kiện",
      error: error.message,
    });
  }
};


// ================= ADMIN APPROVE / REJECT EVENT REQUEST =================
// ================= UPDATE EVENT REQUEST STATUS =================
export const updateEventStatus = async (req, res) => {
  try {
    const { eventId, status } = req.body;

    // Kiểm tra sự kiện có tồn tại trong EventRequest
    const eventRequest = await EventRequest.findById(eventId);
    if (!eventRequest) {
      console.log("Không tìm thấy sự kiện với ID:", eventId);
      return res.status(404).json({ message: "Sự kiện không tồn tại" });
    }

    // Nếu trạng thái là 'approved'
    if (status === 'approved') {
      // Tạo sự kiện mới trong collection 'Event'
      const newEvent = new Event({
        title: eventRequest.eventName,  // Tên sự kiện từ EventRequest
        description: eventRequest.description,  // Mô tả từ EventRequest
        // EventRequest may not include categoryId/locationId fields coming from the organizer form,
        // so provide safe fallbacks to avoid Mongoose validation errors when creating Event.
        categoryId: await (async () => {
          let cid = eventRequest.categoryId;
          if (cid) {
            const existsId = await Category.findById(cid).lean();
            if (existsId) return existsId._id; // hợp lệ dạng id
            const byName = await Category.findOne({ name: cid }).lean();
            if (byName) return byName._id; // map tên sang id
          }
          return 'uncategorized';
        })(),
        organizerId: eventRequest.organizerId,  // Organizer ID từ EventRequest
        // Map eventLocation (string) from EventRequest to Event.locationId (string expected)
        locationId: eventRequest.locationId || eventRequest.eventLocation || null,
        date: eventRequest.eventDate,  // Ngày tổ chức từ EventRequest
        ticketsAvailable: eventRequest.ticketCount,  // Số lượng vé từ EventRequest
        ticketTotal: eventRequest.ticketCount, // Tổng số vé ban đầu (không giảm khi bán)
        imageUrl: eventRequest.coverImage,  // Hình ảnh sự kiện từ EventRequest
        createdAt: Date.now(),  // Thời gian tạo mới sự kiện
      });
// Kiểm tra xem đối tượng mới có phải là instance của Mongoose không
      console.log(newEvent instanceof Event);  // Phải trả về true

      // Lưu sự kiện vào collection 'Event'
      await newEvent.save();  // Save sự kiện mới vào collection 'Event'
      console.log("Sự kiện đã được lưu vào collection 'Event'");

      // Cập nhật trạng thái sự kiện trong EventRequest
      eventRequest.status = 'approved';
      await eventRequest.save();  // Lưu sự kiện sau khi cập nhật trạng thái
      console.log("Trạng thái sự kiện đã được cập nhật thành công");

      // 🔰 Khi admin duyệt, nếu organizerId là user id thì promote user thành organizer (set roleId)
      try {
        if (eventRequest.organizerId) {
          const organizerRole = await Role.findOne({ name: 'organizer' }).lean();
          if (organizerRole) {
            await User.findByIdAndUpdate(eventRequest.organizerId, { roleId: organizerRole._id });
            console.log('🔼 Đã cập nhật roleId của user lên organizer', { userId: eventRequest.organizerId.toString(), roleId: organizerRole._id.toString() });
          } else {
            console.warn('⚠️ Role "organizer" không tồn tại trong DB, không thể promote user');
          }
        }
      } catch (e) {
        console.error('❌ Lỗi khi promote user thành organizer:', e);
      }
      // 🔰 TẠO HOẶC CẬP NHẬT DOCUMENT Organizer tương ứng
      try {
        if (eventRequest.organizerId) {
          // Lấy thông tin user
          const user = await User.findById(eventRequest.organizerId).lean();
          if (user) {
            // Kiểm tra organizer đã tồn tại chưa
            let org = await Organizer.findOne({ userId: user._id });
            if (!org) {
              org = new Organizer({
                userId: user._id,
                name: user.name || `${user.email}`,
                description: `Organizer created when approving event request ${eventRequest._id}`,
                contactEmail: user.email,
                phone: user.phone,
                locationId: eventRequest.locationId || null,
                address: "",
                socialLinks: {},
                events: [newEvent._id],
              });
              await org.save();
              console.log('✅ Đã tạo Organizer mới cho user:', user._id.toString());
            } else {
              // Nếu đã tồn tại thì cập nhật một số trường & thêm event vào danh sách nếu chưa có
              const needsPush = !org.events?.some(eid => eid.toString() === newEvent._id.toString());
              if (needsPush) org.events.push(newEvent._id);
              org.name = org.name || user.name || org.name;
              org.contactEmail = org.contactEmail || user.email;
              org.phone = org.phone || user.phone;
org.locationId = org.locationId || eventRequest.locationId;
              await org.save();
              console.log('🔁 Đã cập nhật Organizer tồn tại cho user:', user._id.toString());
            }

            // Sau khi có Organizer (mới hoặc tồn tại), gán organizerId cho Event thành _id của Organizer (luôn thực hiện)
            try {
              if (org && newEvent && newEvent._id) {
                await Event.findByIdAndUpdate(newEvent._id, { organizerId: org._id });
                console.log('✅ Đã gán organizerId (Organizer._id) cho Event:', { eventId: newEvent._id.toString(), organizerId: org._id.toString() });
              }
            } catch (e) {
              console.error('❌ Lỗi khi cập nhật Event.organizerId với Organizer._id:', e);
            }
          } else {
            console.warn('⚠️ Không tìm thấy user để tạo Organizer:', eventRequest.organizerId);
          }
        }
      } catch (e) {
        console.error('❌ Lỗi khi tạo/cập nhật Organizer:', e);
      }
    } else if (status === 'rejected') {
      eventRequest.status = 'rejected';
      await eventRequest.save();  // Lưu sự kiện sau khi từ chối
      console.log("Sự kiện đã bị từ chối");
    }

    res.status(200).json({ message: "Cập nhật trạng thái sự kiện thành công!" });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái sự kiện:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật trạng thái sự kiện", error: error.message });
  }
};