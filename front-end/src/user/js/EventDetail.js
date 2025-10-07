import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then(res => res.json())
      .then(data => setEvent(data))
      .catch(err => console.error(err));
  }, [id]);

  if (!event) return <div>Đang tải...</div>;

  const handleBuyTicket = () => {
    const loggedIn = false; // TODO: thay bằng check login thật
    if (!loggedIn) navigate("/login");
    else navigate(`/buy-ticket/${id}`);
  };

  return (
    <div className="container my-6">
      <h2>{event.title}</h2>
      <p>{event.description}</p>
      <p>Ngày: {new Date(event.date).toLocaleString()}</p>
      <p>Địa điểm: {event.locationId}</p>
      <p>Số vé còn: {event.ticketsAvailable}</p>
      <button className="btn btn-primary" onClick={handleBuyTicket}>
        Mua vé
      </button>
    </div>
  );
}

export default EventDetail;
