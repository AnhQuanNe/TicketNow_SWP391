import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getOrganizerProfile } from "../../api/organizerApi";
import "../css/organizer.css";

// MyEventsList: hiển thị danh sách event của organizer, có search + filter status
export default function MyEventsList({ setActivePage, setSelectedEventId }) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [organizer, setOrganizer] = useState(null);
	const [events, setEvents] = useState([]);

	// UI state
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	const token = localStorage.getItem("token");

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			setError("");
			try {
				const org = await getOrganizerProfile(token);
				if (!org || org.message === "not_found") {
					setOrganizer(null);
					setError("Bạn chưa có hồ sơ Organizer. Vui lòng tạo hồ sơ trước.");
					setEvents([]);
					setLoading(false);
					return;
				}
				setOrganizer(org);

				const res = await axios.get(`http://localhost:5000/api/events/search?organizerId=${org._id}`);
				setEvents(res.data || []);
			} catch (err) {
				console.error("Lỗi khi tải sự kiện organizer:", err);
				setError("Không thể tải danh sách sự kiện. Vui lòng thử lại sau.");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [token]);

	// derive status for each event
	const eventsWithStatus = useMemo(() => {
		return events.map((ev) => {
			const now = new Date();
			const evDate = ev.date ? new Date(ev.date) : null;
			let status = "unknown";
			if (evDate) status = evDate > now ? "upcoming" : "past";
			if (typeof ev.ticketsAvailable === "number" && ev.ticketsAvailable <= 0) status = "soldout";
			return { ...ev, _status: status };
		});
	}, [events]);

	// filtered + searched list
	const filtered = useMemo(() => {
		return eventsWithStatus.filter((ev) => {
			if (statusFilter !== "all" && ev._status !== statusFilter) return false;
			if (query && !ev.title.toLowerCase().includes(query.toLowerCase())) return false;
			return true;
		});
	}, [eventsWithStatus, query, statusFilter]);

	// Pagination
	const PAGE_SIZE = 12; // max per page
	const [currentPage, setCurrentPage] = useState(1);
	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

	useEffect(() => {
		// reset to first page when filters/search change
		setCurrentPage(1);
	}, [filtered.length, query, statusFilter]);

	const paged = useMemo(() => {
		const start = (currentPage - 1) * PAGE_SIZE;
		return filtered.slice(start, start + PAGE_SIZE);
	}, [filtered, currentPage]);

	const openDetail = (ev) => {
		// set selected id in parent and switch to detail view
		if (typeof setSelectedEventId === "function") setSelectedEventId(ev._id);
		if (typeof setActivePage === "function") setActivePage("event-detail");
	};

	if (loading) return <p>Đang tải danh sách sự kiện...</p>;

	return (
		<div className="my-events-container">
			<div className="my-events-header">
				<h3 className="fw-bold">Danh sách sự kiện của tôi</h3>

				<div className="controls">
					<input
						className="search-input"
						placeholder="Tìm theo tiêu đề..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>

					<select className="status-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
						<option value="all">Tất cả</option>
						<option value="upcoming">Sắp diễn ra</option>
						<option value="past">Đã diễn ra</option>
						<option value="soldout">Hết vé</option>
					</select>
				</div>
			</div>

			{error ? (
				<p className="muted">{error}</p>
			) : (
				<>
					{filtered.length === 0 ? (
						<p>Không tìm thấy sự kiện khớp điều kiện.</p>
					) : (
						<>
						<div className="events-grid">
							{paged.map((ev) => (
								<div className="event-card" key={ev._id}>
									<div className="event-card-img">{ev.imageUrl ? <img src={ev.imageUrl} alt={ev.title} /> : <div className="placeholder">No image</div>}</div>
									<div className="event-card-body">
										<div className="title-row">
											<h3 className="fw-bold">{ev.title}</h3>
										</div>
										<p className="muted"><span className="field-label">Ngày:</span>{ev.date ? new Date(ev.date).toLocaleString() : "Chưa có"}</p>
										<p className="muted"><span className="field-label">Vé còn lại:</span>{ev.ticketsAvailable}</p>
										<p className="muted"><span className="field-label">Địa điểm:</span>{ev.locationId || "—"}</p>
										<div className="event-actions">
											<button className="btn-edit" onClick={() => openDetail(ev)}>View Detail</button>
											<span className={`badge badge-${ev._status} action-badge`}>{ev._status}</span>
										</div>
									</div>
								</div>
							))}
						</div>

						{/* pagination controls */}
						{filtered.length > PAGE_SIZE && (
							<div className="pagination">
								<button className="page-btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>⏮ First</button>
								<button className="page-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>← Prev</button>
								<div className="page-numbers">
									{Array.from({ length: totalPages }).map((_, idx) => {
										const p = idx + 1;
										return (
											<button key={p} className={`page-number ${p === currentPage ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
										);
									})}
								</div>
								<button className="page-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next →</button>
								<button className="page-btn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Last ⏭</button>
							</div>
						)}
						</>
					)}
				</>
			)}

			
		</div>
	);
}

