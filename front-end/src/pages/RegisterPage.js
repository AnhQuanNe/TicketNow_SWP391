import { useState } from "react";
import { registerUser } from "../api/authAPI";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", passwordHash: "", phone: "", studentId: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await registerUser(form);
      setMessage(`✅ Đăng ký thành công: ${res.data.name}`);
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.message || "Lỗi đăng ký"}`);
    }
  };

  return (
    <div className="app-shell">
      <div className="card">
        <h1>Đăng ký</h1>
        <p className="lead">Tạo tài khoản mới. Nếu là sinh viên, hãy nhập Mã sinh viên để hưởng ưu đãi.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input className="input" name="name" placeholder="Họ & tên" onChange={handleChange} required />
          </div>

          <div className="form-row">
            <input className="input" name="email" placeholder="Email" onChange={handleChange} type="email" required />
          </div>

          <div className="form-row">
            <input className="input" name="passwordHash" placeholder="Mật khẩu" onChange={handleChange} type="password" required />
          </div>

          <div className="form-row">
            <input className="input" name="phone" placeholder="Số điện thoại (tùy chọn)" onChange={handleChange} />
          </div>

          <div className="form-row">
            <input className="input" name="studentId" placeholder="Mã sinh viên (nếu có)" onChange={handleChange} />
          </div>

          <button className="btn" type="submit">Đăng ký</button>

          <div className="form-foot">
            <small className="small-msg">{message}</small>
            <a className="link" href="/login">Đã có tài khoản?</a>
          </div>
        </form>
      </div>
    </div>
  );
}
