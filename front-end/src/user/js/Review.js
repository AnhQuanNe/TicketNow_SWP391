import React, { useEffect, useState } from "react";
import "../css/Review.css";

let socketSingleton = null;

const getSocket = async () => {
    if (socketSingleton) return socketSingleton;
    const { io } = await import("socket.io-client");
    socketSingleton = io("http://localhost:5000", { transports: ["websocket"] });
    return socketSingleton;
};

const Star = ({ filled, onClick }) => (
    <span onClick={onClick} className={`review-star ${filled ? "filled" : ""}`}>★</span>
);

const Review = ({ eventId, token, currentUser }) => {
    const [reviews, setReviews] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [avgAll, setAvgAll] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 8;
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const canPost = Boolean(token);
    /* Vì sao phải check Array.isArray(json)?

    Do backend có thể có 2 kiểu trả về:
    Kiểu đơn giản: chỉ trả về mảng review.
    Kiểu chuẩn phân trang: bao bọc trong object có data và totalPages. */
    const fetchPage = async (p) => {
        if (!eventId) return;
        try {
            const res = await fetch(`http://localhost:5000/api/reviews/event/${eventId}?page=${p}&limit=${limit}`);
            const json = await res.json();
            if (Array.isArray(json)) {
                // legacy array response (no pagination/stats)
                setReviews(json);
                setTotalPages(1);
                const cnt = json.length || 0;
                setTotalCount(cnt);
                const sum = json.reduce((acc, r) => acc + (r.rating || 0), 0);
                setAvgAll(cnt ? Math.round((sum / cnt) * 10) / 10 : 0);
            } else {
                const dataArr = Array.isArray(json.data) ? json.data : [];
                setReviews(dataArr);
                setTotalPages(json.totalPages || 1);
                const total = typeof json.total === 'number' ? json.total : dataArr.length;
                setTotalCount(total);
                // Ưu tiên avgRating từ server; nếu không có thì thử tính từ sumRating/total
                if (typeof json.avgRating === 'number') {
                    setAvgAll(Math.round(json.avgRating * 10) / 10);
                } else if (typeof json.sumRating === 'number' && total > 0) {
                    setAvgAll(Math.round((json.sumRating / total) * 10) / 10);
                } else {
                    setAvgAll(0);
                }
            }
        } catch { }
    };

    useEffect(() => {
        fetchPage(page);
    }, [eventId, page]);

    useEffect(() => {
        let canceled = false;
        let socketRef = null;
        let handlerRef = null;

        (async () => {
            const s = await getSocket();
            if (canceled) return;
            socketRef = s;
            handlerRef = (rev) => {
                if (rev?.eventId === eventId || rev?.eventId?._id === eventId) {
                    fetchPage(page);
                }
            };
            s.emit("join", { eventId });
            s.on("review:new", handlerRef);
        })();

        return () => {
            canceled = true;
            if (socketRef && handlerRef) {
                socketRef.off("review:new", handlerRef);
                socketRef.emit("leave", { eventId });
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    // avgAll & totalCount lấy từ API (hoặc tính nếu API trả mảng thuần), phản ánh TẤT CẢ đánh giá

    const submit = async (e) => {
        e?.preventDefault();
        if (!canPost) return alert("Vui lòng đăng nhập để đánh giá");
        try {
            const res = await fetch(`http://localhost:5000/api/reviews/event/${eventId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ rating, comment }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "Lỗi gửi review");
            setComment("");
            setTimeout(() => fetchPage(1), 0);
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="review-wrap">
            <h3 className="review-title fw-bold">Đánh giá & bình luận</h3>
            <div className="review-subtitle">Trung bình: {avgAll} / 5 ({totalCount} đánh giá)</div>

            <form onSubmit={submit} className="review-form">
                <div className="review-stars">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} filled={i <= rating} onClick={() => setRating(i)} />
                    ))}
                </div>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Chia sẻ cảm nhận của bạn..."
                    rows={3}
                    maxLength={1000}
                    className="review-textarea"
                />
                <div className="review-actions">
                    <button type="submit" disabled={!canPost} className="review-submit">Gửi đánh giá</button>
                </div>
            </form>

            <div className="review-list">
                {reviews.map((r) => (
                    <div key={r._id} className="review-item">
                        <div className="review-item-head">
                            <img src={r.userId?.avatar || "https://via.placeholder.com/32"} alt="avt" className="review-avatar" />
                            <b>{r.userId?.name || "Ẩn danh"}</b>
                            <span className="review-item-stars">{"★".repeat(r.rating)}</span>
                        </div>
                        {r.comment && (
                            <div className="review-comment">{r.comment}</div>
                        )}
                        <div className="review-date">{new Date(r.createdAt).toLocaleString()}</div>
                    </div>
                ))}
                {totalPages > 1 && (
                    <div className="review-pager">
                        <button className="review-page-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                            ‹ Trước
                        </button>
                        {Array.from({ length: totalPages }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setPage(idx + 1)}
                                className={`review-page-btn ${idx + 1 === page ? "active" : ""}`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                        <button className="review-page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                            Sau ›
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Review;
