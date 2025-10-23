import express from "express";
import { getEvents, getEventById } from "../controllers/eventController.js";

const router = express.Router();

router.get("/search", getEvents);
router.get("/:id", getEventById);

export default router;      
