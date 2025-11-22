import { useState, useEffect, useRef } from "react";
import "../css/ChatGPT.css";

function cleanBotMessage(text) {
  if (!text) return "";

  let cleaned = text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/[-•]\s*/g, "")
    .trim();

  let lines = cleaned.split("\n").map(l => l.trim()).filter(l => l !== "");

  let result = [];
  let counter = 1;

  for (let line of lines) {
    if (!line.includes("Ngày") && !line.includes("Địa điểm")) {
      result.push(line);
      continue;
    }

    result.push(`${counter}. ${line}`);
    counter++;
  }

  return result.join("\n");
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [userAvatar, setUserAvatar] = useState("/guest.png");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

 useEffect(() => {
  try {
    const raw = localStorage.getItem("user");

    if (!raw) {
      setUserAvatar("/guest.png");
      return;
    }

    const user = JSON.parse(raw);

    if (user?.profilePic && user.profilePic.trim() !== "") {
      // Avatar đầy đủ URL
      if (user.profilePic.startsWith("http")) {
        setUserAvatar(user.profilePic);
      } else {
        // Avatar dạng filename => thêm đường dẫn uploads
        setUserAvatar(`http://localhost:5000/uploads/${user.profilePic}`);
      }
    } else {
      setUserAvatar("/guest.jpg");
    }
  } catch (err) {
    console.error("Avatar parse error:", err);
    setUserAvatar("/guest.jpg");
  }
}, []);

  // Auto scroll xuống cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const openChat = () => {
    setOpen(true);

    if (messages.length === 0) {
      setMessages([
        {
          sender: "bot",
          text: "Xin chào! 👋\nBạn cần mình giúp gì hôm nay? 😊",
        },
      ]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    const token = localStorage.getItem("token");

    // Bot đang suy nghĩ
    setIsTyping(true);

    const res = await fetch("http://localhost:5000/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: input }),
    });

    const data = await res.json();

    // Tắt typing
    setIsTyping(false);

    // Làm sạch tin nhắn bot
    const cleaned = cleanBotMessage(data.reply);

    const botMsg = { sender: "bot", text: cleaned };
    setMessages(prev => [...prev, botMsg]);
  };

  return (
    <>
      {open && (
        <div
          className="chat-widget-overlay"
          onClick={() => setOpen(false)}
        ></div>
      )}

      {!open && (
        <button className="chat-button chat-button-attention" onClick={openChat}>
          💬
        </button>
      )}

      {open && (
        <div className="chat-box">
          <div className="chat-header">
            TicketNow Assistant
            <span style={{ cursor: "pointer" }} onClick={() => setOpen(false)}>
              ✖
            </span>
          </div>

          <div className="chat-body">
            {messages.map((m, idx) => (
              <div key={idx} className={`message-row ${m.sender}`}>
                {m.sender === "bot" && (
                  <img className="avatar" src="/bot.jpg" alt="bot" />
                )}

                <div className={`bubble ${m.sender}`}>
                  {m.text}
                </div>

                {m.sender === "user" && (
                  <img className="avatar" src={userAvatar} alt="user" />
                )}
              </div>
            ))}

            {/* Bot đang suy nghĩ */}
            {isTyping && (
              <div className="message-row bot">
                <img className="avatar" src="/bot.png" alt="bot" />
                <div className="bubble bot typing-indicator">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-footer">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
            />
            <button onClick={sendMessage}>Gửi</button>
          </div>
        </div>
      )}
    </>
  );
}
