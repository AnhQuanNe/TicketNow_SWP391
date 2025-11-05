import express from "express";
import { getEvents, getEventById, getFeaturedEvents } from "../controllers/eventController.js";

const router = express.Router();

router.get("/featured", getFeaturedEvents); // 🆕 Thêm dòng này
router.get("/search", getEvents);
router.get("/:id", getEventById);

export default router;      
