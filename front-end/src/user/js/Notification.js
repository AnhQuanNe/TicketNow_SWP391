import React, { useCallback, useEffect, useRef, useState } from "react";
import { IoNotifications } from "react-icons/io5";

import "../css/Notification.css";

let socketSingleton = null;
const getSocket = async () => {
    if (socketSingleton) return socketSingleton;
    const { io } = await import("socket.io-client");
    socketSingleton = io("http://localhost:5000", { transports: ["websocket"] });
    return socketSingleton;
};

// Show all notifications by default (no 10-item limit)
const LIMIT = 100000;

const Notification = ({ user }) => {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const ref = useRef(null);
    const token = localStorage.getItem('token');
    const isFetchingRef = useRef(false);

    // Close when clicking outside
    useEffect(() => {
        const onDocClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, []);

    const fetchList = useCallback(async (p = 1) => {
        if (!token || isFetchingRef.current) return;
        try {
            setLoading(true);
            isFetchingRef.current = true;
            const res = await fetch(`http://localhost:5000/api/notifications?page=${p}&limit=${LIMIT}` , {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            const data = Array.isArray(json.data) ? json.data : [];
            if (p === 1) setItems(data);
            else setItems((prev) => [...prev, ...data]);
            // If server gives totalPages, prefer it; otherwise fall back to data length vs LIMIT
            if (json.totalPages) setHasMore(p < json.totalPages);
            else setHasMore(data.length >= LIMIT);
        } catch { /* ignore */ }
        finally { setLoading(false); isFetchingRef.current = false; }
    }, [token]);

    // Open panel: refresh from first page
    useEffect(() => {
        if (open) {
            setPage(1);
            fetchList(1);
        }
    }, [open, fetchList]);

    // On login or token change, prefetch once so badge shows without clicking
    useEffect(() => {
        if (user?._id && token) {
            setPage(1);
            fetchList(1);
        }
    }, [user?._id, token, fetchList]);

    // Socket realtime: join user room, refresh when notify
    useEffect(() => {
        let mounted = true;
        let s;
        let handler;
        (async () => {
            s = await getSocket();
            if (!mounted) return;
            if (user?._id) s.emit("join", { userId: String(user._id) });
            handler = () => {
                // new notify -> reset to first page to see newest first
                setPage(1);
                fetchList(1);
            };
            s.on("notify", handler);
        })();
        return () => {
            mounted = false;
            if (s && handler) s.off("notify", handler);
            if (s && user?._id) s.emit("leave", { userId: String(user._id) });
        };
    }, [user?._id, fetchList]);

    // Infinite scroll handler
    const onScroll = (e) => {
        const el = e.currentTarget;
        if (!hasMore || loading) return;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
            const next = page + 1;
            setPage(next);
            fetchList(next);
        }
    };

    const markAsRead = async (id) => {
        try {
            await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
            setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
        } catch {}
    };

    const unread = items.filter((i) => !i.read).length;

    // Hide icon when not logged in
    if (!user?._id || !token) return null;

    return (
        <div ref={ref} style={{ position: "relative", marginRight: 12 }}>
            <button
                onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
                style={{
                    position: "relative",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 25,
                    color: "#ff9800",
                }}
                aria-label="Notifications"
                title="Thông báo"
            >
                <IoNotifications />

                {unread > 0 && (
                    <span style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        background: "#ff9800",
                        color: "#fff",
                        borderRadius: 12,
                        padding: "0 6px",
                        fontSize: 12,
                    }}>{unread}</span>
                )}
            </button>

            {open && (
                <div className="notification-panel"
                    onScroll={onScroll}
                    style={{
                        position: "absolute",
                        right: 0,
                        top: 36,
                        width: 300,
                        maxHeight: 360,
                        overflowY: "auto",
                        background: "#fff",
                        border: "1px solid #ffe6cc",
                        borderRadius: 12,
                        boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                        zIndex: 1000,
                    }}
                >
                    <div style={{ padding: 10, borderBottom: "1px solid #fff3e0", fontWeight: 600, color: "#ff9800" }}>Thông báo</div>
                    {items.length === 0 ? (
                        <div style={{ padding: 12, color: "#777" }}>{loading ? "Đang tải..." : "Không có thông báo"}</div>
                    ) : (
                        <>
                            {items.map((n) => (
                                <div key={n._id || n.id} style={{ padding: 12, borderBottom: "1px solid #fff3e0", background: n.read ? '#fff' : '#fff7ef' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 600 }}>{n.title || "Sự kiện"}</div>
                                        {!n.read && (
                                            <button onClick={() => markAsRead(n._id)} style={{ border: 'none', background: 'transparent', color: '#ff9800', cursor: 'pointer' }}>Đánh dấu đã đọc</button>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 14, color: "#555" }}>{n.message}</div>
                                    <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>{new Date(n.createdAt || n.time || Date.now()).toLocaleString()}</div>
                                </div>
                            ))}

                            <div style={{ padding: 8, textAlign: 'center', color: '#999' }}>
                                {loading ? 'Đang tải...' : (hasMore ? 'Kéo xuống để tải thêm' : 'Đã hết thông báo')}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Notification;
