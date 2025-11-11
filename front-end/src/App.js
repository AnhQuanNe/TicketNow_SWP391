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
import { GoogleOAuthProvider } from "@react-oauth/google";

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
import SearchResult from "./user/js/SearchResult";

import MyAccount from "./user/js/MyAccount";
// import OrganizerLayout from "./organizer/OrganizerLayout";
import FavoritesPage from "./user/js/FavoritesPage"; // 🟩 file hiển thị sự kiện đã tim

import ImageUpload from "./api/ImageUpload";

// 🟨 [A] THÊM Ở ĐÂY: import CategoryPage từ file riêng
// 🟨 bạn cần tạo file: src/user/js/CategoryPage.js
// rồi thêm dòng này:
import CategoryPage from "./user/js/CategoryPage"; 

// 🟨 [B] SAU KHI THÊM DÒNG TRÊN, XÓA ĐOẠN DƯỚI NÀY:
// function CategoryPage() {
//   return <div>Category Page</div>;
// }

function App() {
  // 🟩 [1] Thêm state quản lý danh sách yêu thích
  const [favorites, setFavorites] = useState(
    JSON.parse(localStorage.getItem("favorites")) || []
  );

  // 🟩 [2] Hàm toggleFavorite: thêm / xóa sự kiện khỏi danh sách
  const toggleFavorite = (eventId) => {
    setFavorites((prev) => {
      const updated = prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId];

      // 🟩 lưu lại vào localStorage
      localStorage.setItem("favorites", JSON.stringify(updated));
      return updated;
    });
  };


  return (
    
            <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      {/* ✅ Bọc toàn bộ ứng dụng bên trong */}
    <Router>
      <Header />
      <MyNavbar />
      <Routes>
        {/* 🟩 [3] Truyền favorites & toggleFavorite vào HomePage */}
        <Route
          path="/"
          element={
            <HomePage
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />
          }
        />

        <Route path="/category/:id" element={<CategoryPage />} />
        <Route path="/event/:id" element={<EventDetail />} />
        {/* 🟩 [4] Truyền favorites & toggleFavorite vào FavoritesPage */}
        <Route
          path="/favorites"
          element={
            <FavoritesPage
              favorites={favorites}
toggleFavorite={toggleFavorite}
            />
          }
        />
        <Route path="/search" element={<SearchResult />} />
        {/* <Route path="/organizer/*" element={<OrganizerLayout />} /> */}
        {/* ✅ Thêm route test upload ảnh */}
        <Route path="/upload" element={<ImageUpload />} />
        <Route path="/select-ticket/:id" element={<SelectTicket />} />
  <Route path="/select-ticket/:eventId" element={<SelectTicket />} />
  <Route path="/payment-success" element={<PaymentSuccess />} />
  <Route path="/payment-fail" element={<PaymentFail />} />
   <Route path="/my-tickets" element={<MyTickets />} /> 

        {/* Trang thanh toán */}
        <Route path="/payment" element={<TicketPage />} />

        <Route path="/my-account" element={<MyAccount />} />
      </Routes>
      <Footer />
    </Router>
</GoogleOAuthProvider>
  );
}

export default App;
