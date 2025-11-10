import express from "express";
import { createBookingAfterPayment, getBookingsByUser } from "../controllers/bookingController.js";

const router = express.Router();

router.post("/create", createBookingAfterPayment);
router.get("/:userId", getBookingsByUser);

export default router;
