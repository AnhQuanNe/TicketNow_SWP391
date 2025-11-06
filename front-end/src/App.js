import React, { useState } from "react";
import "./user/css/Banner.css";
import "./user/css/EventSection.css";
import "./user/css/Favourites.css";
import "./user/css/Footer.css";
import "./user/css/Header.css";
import "./user/css/MyNavbar.css";
import "./App.css";

import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./user/js/Header";
import MyNavbar from "./user/js/MyNavbar";
import Footer from "./user/js/Footer";
import EventDetail from "./user/js/EventDetail";
import HomePage from "./user/js/HomePage";
import TicketPage from "./user/js/PaymentPage";
import SelectTicket from "./user/js/SelectTickets";
import PaymentSuccess from "./user/js/PaymentSuccess";
import MyTickets from "./user/js/MyTickets";
import PaymentFail from "./user/js/PaymentFail";
import MyAccount from "./user/js/MyAccount";
import ImageUpload from "./api/ImageUpload";

// ✅ import modal đăng nhập
import LoginRegisterModal from "./user/js/LoginRegisterModal";

function CategoryPage() {
  return <div>Category Page</div>;
}

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // ✅ quản lý modal đăng nhập
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState("login");
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  const handleSearch = (term) => {
    setSearchTerm(term);
    setSelectedCategory("all");
  };

  const handleLoginSuccess = (data) => {
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
    setShowAuthModal(false);
  };

  return (
    <Router>
      <Header onSearch={handleSearch} searchTerm={searchTerm} />
      <MyNavbar />

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              searchTerm={searchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
          }
        />
        <Route path="/category/:id" element={<CategoryPage />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/upload" element={<ImageUpload />} />

        {/* ✅ Truyền onRequireLogin và user vào SelectTicket */}
        <Route
          path="/select-ticket/:id"
          element={
            <SelectTicket
              user={user}
              onRequireLogin={() => {
                setAuthType("login");
                setShowAuthModal(true);
              }}
            />
          }
        />

        <Route path="/payment" element={<TicketPage />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-fail" element={<PaymentFail />} />
        <Route path="/my-tickets" element={<MyTickets />} />
        <Route path="/my-account" element={<MyAccount />} />
      </Routes>

      <Footer />

      {/* ✅ Modal đăng nhập / đăng ký */}
      {showAuthModal && (
        <LoginRegisterModal
          type={authType}
          onClose={() => setShowAuthModal(false)}
          switchType={setAuthType}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </Router>
  );
}

export default App;
