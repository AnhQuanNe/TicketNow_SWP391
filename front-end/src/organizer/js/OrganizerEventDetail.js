import React, { useEffect, useState } from "react";
import { AiTwotoneTags } from "react-icons/ai";
import { FaUserGroup } from "react-icons/fa6";
import { IoReceiptSharp } from "react-icons/io5";
import { IoReturnDownBackOutline } from "react-icons/io5";

// charts
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);



export default function OrganizerEventDetail({ eventId, setActivePage }) {
  const [event, setEvent] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [error, setError] = useState("");

  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [uniqueBuyers, setUniqueBuyers] = useState(0);
  const [revenueByDay, setRevenueByDay] = useState([]);
  const [revenueByDayByType, setRevenueByDayByType] = useState([]);
  const [ratingDistribution, setRatingDistribution] = useState([]);
  const [ticketTotal, setTicketTotal] = useState(null);
  const [ticketsSold, setTicketsSold] = useState(0);
  const [ticketsSoldByType, setTicketsSoldByType] = useState({});

  // theme colors (match stat-card icon gradients - choose one representative color)
  const COLOR_ORANGE = '#ff7a18'; // icon-orange
  const COLOR_BLUE = '#4f86ff';   // icon-blue
  const COLOR_GREEN = '#10b981';  // icon-green

  // helper: compute nice axis max and stepSize for given data max and desired tick count
  const computeNiceAxis = (dataMax, ticks = 5) => {
    if (!dataMax || dataMax <= 0) return { max: 1, stepSize: 1 };

    const rawStep = dataMax / ticks;
    const exp = Math.floor(Math.log10(rawStep));
    const pow10 = Math.pow(10, exp);
    const f = rawStep / pow10;
    let niceFraction;
    if (f <= 1) niceFraction = 1;
    else if (f <= 2) niceFraction = 2;
    else if (f <= 5) niceFraction = 5;
    else niceFraction = 10;

    const niceStep = niceFraction * pow10;
    const niceMax = Math.ceil(dataMax / niceStep) * niceStep;
    return { max: niceMax, stepSize: niceStep };
  };

  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!eventId) return;
    setLoadingEvent(true);
    fetch(`http://localhost:5000/api/events/${eventId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Không tìm thấy sự kiện");
        return r.json();
      })
      .then((data) => setEvent(data))
      .catch((err) => setError(err.message || "Lỗi khi tải sự kiện"))
      .finally(() => setLoadingEvent(false));
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    setLoadingBookings(true);
    setError("");
    fetch(`http://localhost:5000/api/bookings/event/${eventId}?page=${page}&limit=${limit}`)
      .then((r) => r.json())
        .then((data) => {
          if (data && Array.isArray(data.bookings)) {
            setBookings(data.bookings);
            setTotalPages(data.totalPages || 1);
            // set summary stats returned from backend
            setTotalOrders(data.total || 0);
            setTotalRevenue(data.totalRevenue || 0);
            setUniqueBuyers(data.uniqueBuyers || 0);
          } else {
            setBookings([]);
            setTotalPages(1);
            setTotalOrders(0);
            setTotalRevenue(0);
            setUniqueBuyers(0);
          }
        })
      .catch((err) => setError(err.message || "Lỗi khi tải danh sách người mua"))
      .finally(() => setLoadingBookings(false));
  }, [eventId, page, limit]);

  // fetch stats (revenue by month, rating distribution, tickets)
  useEffect(() => {
    if (!eventId) return;
    fetch(`http://localhost:5000/api/events/${eventId}/stats`)
      .then((r) => r.json())
      .then((data) => {
        if (data) {
              setRevenueByDay(data.revenueByDay || []);
              setRevenueByDayByType(data.revenueByDayByType || []);
              setRatingDistribution(data.ratingDistribution || []);
              setTicketTotal(data.ticketTotal ?? null);
              setTicketsSold(data.ticketsSold || 0);
              setTicketsSoldByType(data.ticketsSoldByType || {});
              // also ensure totalRevenue/orders consistent
              setTotalOrders(data.totalBookings || totalOrders);
              setTotalRevenue(data.totalRevenue || totalRevenue);
            }
      })
      .catch((err) => console.warn("Không thể tải stats:", err));
  }, [eventId]);

  const goBack = () => {
    if (typeof setActivePage === "function") setActivePage("my-events");
  };

  // compute nice axis for revenue and rating charts
  const revenueMax = revenueByDay && revenueByDay.length ? Math.max(...revenueByDay.map(r => r.total)) : 0;
  const niceRevenue = computeNiceAxis(revenueMax, 5);

  const ratingMax = ratingDistribution && ratingDistribution.length ? Math.max(...ratingDistribution.map(r => r.count)) : 0;
  const niceRating = computeNiceAxis(ratingMax, 5);

  // For the pie chart, compute sold/remaining from event fields if available
  // Requirement: pie should use ticketTotal and ticketsAvailable from the event
  // sold = ticketTotal - ticketsAvailable; remaining = ticketsAvailable
  let pieSold = ticketsSold;
  let pieRemaining = Math.max(0, (ticketTotal || 0) - ticketsSold);
  if (event && typeof event.ticketTotal === 'number' && typeof event.ticketsAvailable === 'number') {
    pieSold = Math.max(0, event.ticketTotal - event.ticketsAvailable);
    pieRemaining = Math.max(0, event.ticketsAvailable);
  }

  return (
    <div className="event-detail">
      <div className="event-header">
        <div className="container-fluid mb-3 text-end">
          <button className="back-btn" onClick={goBack}><IoReturnDownBackOutline/> Quay lại</button>
        </div>
      </div>

      {/* stats cards (styled like provided example) */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon icon-orange"><IoReceiptSharp/></div>
          <div className="stat-content text-end">
            <div className="stat-title">Tổng đơn</div>
            <div className="stat-value">{totalOrders.toLocaleString()}</div>

          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-blue"><AiTwotoneTags/></div>
          <div className="stat-content  text-end">
            <div className="stat-title">Tổng doanh thu</div>
            <div className="stat-value">{Number(totalRevenue).toLocaleString(undefined,{style:'currency',currency:'VND',maximumFractionDigits:0})}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-green"><FaUserGroup/></div>
          <div className="stat-content  text-end">
            <div className="stat-title ">Số người mua</div>
            <div className="stat-value">{uniqueBuyers.toLocaleString()}</div>
            <div style={{fontSize:12,color:'#6b7280',marginTop:6}}>
              Guest Ticket: <span className="fw-bolder">{Number(ticketsSoldByType.guest || ticketsSoldByType['guest'] || 0).toLocaleString()}</span> — Student Ticket: <span className="fw-bolder">{Number(ticketsSoldByType.student || ticketsSoldByType['student'] || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="attendees-section">
        {/* Charts area: top row rating & pie, bottom row revenue */}
        <div style={{display:'flex',flexDirection:'column',gap:16,marginTop:12}}>

          {/*Bar Chart */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div style={{background:'#ffffffff',padding:14,borderRadius:12,boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px'}}>
              <h5 style={{margin:0,marginBottom:8, fontWeight: "bold"}}>Phân Loại Đánh Giá</h5>
              <div className="chart-medium">
                <Bar data={{ labels: ratingDistribution.map(r=>String(r.rating)), datasets:[{ label:'Số đánh giá', data: ratingDistribution.map(r=>r.count), backgroundColor: COLOR_GREEN }] }} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, layout:{ padding:{ top:6, bottom:6 } }, scales:{ y:{ beginAtZero:true, max: niceRating.max, ticks:{ stepSize: Math.max(1, niceRating.stepSize) } } } }} />
              </div>
            </div>

            {/*Pie Chart */}
            <div style={{background:'#ffffffff',padding:14,borderRadius:12,boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px'}}>
              <h5 style={{margin:0,marginBottom:8,fontWeight:"bold"}}>Tỷ Lệ Vé Bán</h5>
                <div className="chart-medium">
                  <Pie
                    data={{ labels:[ `Sold Out (${pieSold})`, `Remaining (${pieRemaining})` ], datasets:[{ data: [ pieSold, pieRemaining ], backgroundColor: [COLOR_ORANGE,'#e5e7eb'] }] }}
                    options={{
                      responsive:true,
                      maintainAspectRatio:false,
                      plugins:{ legend:{ position:'bottom', labels:{ padding:12 } } },
                      layout:{ padding:{ top:6, bottom:20 } }
                    }}
                  />
                </div>
            </div>
          </div>

          {/* revenue chart */}
          <div style={{background:'#fff',padding:14,borderRadius:12,boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px'}}>
            <h5 style={{margin:0,marginBottom:8, fontWeight: "bold"}}>Doanh Thu Tích Lũy</h5>
            <div className="chart-large">
            {
              (() => {
                const labels = revenueByDay.map(d => d.dayLabel);
                // prepare datasets: if revenueByDayByType has entries, pivot them
                const hasByType = revenueByDayByType && revenueByDayByType.length > 0;
                if (!hasByType) {
                  return (
                    <Line data={{ labels, datasets: [{ label: 'Doanh thu', data: revenueByDay.map(r => r.total), borderColor: COLOR_BLUE, backgroundColor: 'rgba(79,134,255,0.12)', fill: true, tension:0.3 }] }} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, layout:{ padding:{ top:6, bottom:6 } }, elements:{ point:{ radius:3 } }, scales:{ y:{ beginAtZero:true, max: niceRevenue.max, ticks:{ stepSize: niceRevenue.stepSize } } } }} />
                  );
                }

                // build map: date -> { type: total }
                const types = Array.from(new Set(revenueByDayByType.map(x => x.ticketType || 'unknown')));
                const dateIndex = labels.reduce((acc, l, i) => (acc[l] = i, acc), {});
                const seriesByType = types.map(t => ({ type: t, data: new Array(labels.length).fill(0) }));
                revenueByDayByType.forEach((row) => {
                  const lbl = row.dayLabel;
                  const idx = dateIndex[lbl];
                  if (idx === undefined) return;
                  const s = seriesByType.find(s => s.type === (row.ticketType || 'unknown'));
                  if (s) s.data[idx] = row.total;
                });

                const colors = { Guest: COLOR_ORANGE, Student: COLOR_BLUE, unknown: '#888888' };
                const datasets = seriesByType.map(s => ({ label: s.type, data: s.data, borderColor: colors[s.type] || colors.unknown, backgroundColor: (colors[s.type] || colors.unknown) + '33', fill: false, tension:0.3 }));

                return <Line data={{ labels, datasets }} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } }, layout:{ padding:{ top:6, bottom:6 } }, elements:{ point:{ radius:3 } }, scales:{ y:{ beginAtZero:true, max: niceRevenue.max, ticks:{ stepSize: niceRevenue.stepSize } } } }} />;
              })()
            }
            </div>
          </div>
        </div>

        {loadingBookings ? (
          <p>Đang tải danh sách người mua...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : bookings.length === 0 ? (
          <p>Chưa có người mua vé cho sự kiện này.</p>
        ) : (
            <>
              <table className="attendees-table mt-5">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tên</th>
                  <th>Email</th>
                  <th>Số lượng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Ngày mua</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, idx) => (
                  <tr key={b._id}>
                    <td>{(page - 1) * limit + idx + 1}</td>
                    <td>{b.userId?.name || "—"}</td>
                    <td>{b.userId?.email || "—"}</td>
                    <td>{b.quantity}</td>
                    <td>{b.totalPrice}</td>
                    <td><span className="attendee-status">{b.status}</span></td>
                    <td>{new Date(b.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="attendees-footer">
              <div className="att-pager">
                <button onClick={() => setPage(1)} disabled={page === 1}>⏮</button>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>←</button>
                <span style={{margin:'0 8px'}}>{page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages}>⏭</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
