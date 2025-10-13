import Ticket from "../model/Ticket.js";

export const getTicketsByEventId = async (req, res) => {
  try {
    const { eventId } = req.params;
    const tickets = await Ticket.find({ eventId });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
