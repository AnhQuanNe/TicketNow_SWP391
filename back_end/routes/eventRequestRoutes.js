// routes/EventRequestRoutes.js
import express from 'express';
import multer from 'multer';
import { createEventRequest, getAllEventRequests } from '../controllers/eventRequestController.js';
import { protect as verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import { updateEventStatus } from '../controllers/eventRequestController.js';  // Import hàm updateEventStatus


const router = express.Router();

// Cấu hình lưu ảnh upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // thư mục uploads trong root
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Route tạo event request
router.post('/', verifyToken, upload.single('coverImage'), createEventRequest);

// Route lấy danh sách sự kiện theo organizer
router.get('/', verifyToken, getAllEventRequests);

// ================= ADMIN APPROVE / REJECT EVENT REQUEST =================
/**
 * Route admin duyệt hoặc từ chối sự kiện
 * - Admin sẽ sử dụng route này để cập nhật trạng thái sự kiện (approved/rejected)
 * - Cần token hợp lệ và quyền admin
 */
router.put('/status', verifyToken, verifyAdmin, updateEventStatus);  // Admin có thể cập nhật trạng thái sự kiện

export default router;