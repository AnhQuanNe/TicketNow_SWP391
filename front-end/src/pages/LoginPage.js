import { useState } from "react";
import { loginUser } from "../api/authAPI";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser(form);
      localStorage.setItem("token", res.data.token);
      setMessage(`✅ Xin chào ${res.data.name}`);
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.message || "Đăng nhập thất bại"}`);
    }
  };

  return (
    <div className="app-shell">
      <div className="card">
        <h1>Đăng nhập</h1>
        <p className="lead">Đăng nhập để tiếp tục mua vé và quản lý tài khoản.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input className="input" name="email" placeholder="Email" onChange={handleChange} type="email" required />
          </div>

          <div className="form-row">
            <input className="input" name="password" placeholder="Mật khẩu" onChange={handleChange} type="password" required />
          </div>

          <button className="btn" type="submit">Đăng nhập</button>

          <div className="form-foot">
            <small className="small-msg">{message}</small>
            <a className="link" href="/register">Đăng ký</a>
          </div>
        </form>
      </div>
    </div>
  );
}
