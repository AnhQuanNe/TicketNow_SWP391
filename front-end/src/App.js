import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import './index.css';

function App() {
  return (
    <Router>
      <nav style={{ padding: 20 }}>
        <Link to="/register" style={{ marginRight: 10 }}>Đăng ký</Link>
        <Link to="/login">Đăng nhập</Link>
      </nav>

      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
