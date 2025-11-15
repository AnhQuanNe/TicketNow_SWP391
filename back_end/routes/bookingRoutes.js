import express from "express";
import { createBookingAfterPayment, getBookingsByUser, getBookingsByEvent } from "../controllers/bookingController.js";

const router = express.Router();

router.post("/create", createBookingAfterPayment);
router.get("/:userId", getBookingsByUser);
// Lấy danh sách booking theo event (organizer)
router.get("/event/:eventId", getBookingsByEvent);

export default router;
