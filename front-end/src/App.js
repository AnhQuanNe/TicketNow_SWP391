import React, { useState } from "react";
import "./user/css/Banner.css";
import "./user/css/EventSection.css";
import "./user/css/Favourites.css";
import "./user/css/Footer.css";
import "./user/css/Header.css";
import "./user/css/MyNavbar.css";
import "./App.css";

import "bootstrap/dist/css/bootstrap.min.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import Header from "./user/js/Header";
import MyNavbar from "./user/js/MyNavbar";
import Footer from "./user/js/Footer";
import EventDetail from "./user/js/EventDetail";
import HomePage from "./user/js/HomePage";
import OrganizerLayout from "./organizer/js/OrganizerLayout";
import TicketPage from "./user/js/PaymentPage";
import SelectTicket from "./user/js/SelectTickets";
import PaymentSuccess from "./user/js/PaymentSuccess";
import MyTickets from "./user/js/MyTickets";
import PaymentFail from "./user/js/PaymentFail";
import SearchResult from "./user/js/SearchResult";
import MyAccount from "./user/js/MyAccount";
import FavoritesPage from "./user/js/FavoritesPage";
import ImageUpload from "./api/ImageUpload";
import CategoryPage from "./user/js/CategoryPage";

import AdminLayout from "./admin/js/AdminLayout";
import Dashboard from "./admin/js/Dashboard";
import UserManagement from "./admin/js/UserManager";
import Report from "./admin/js/Report";
import Notification from "./admin/js/Notification";
import AdminRoute from "./admin/js/AdminRoute";
import EventManager from "./admin/js/EventManager";
import VerifyEmail from "./user/js/VerifyEmail";

// 🧩 Tách phần logic ra component riêng
function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin"); // 🟢 nếu đang ở /admin thì ẩn header/footer

  const [favorites, setFavorites] = useState(
    JSON.parse(localStorage.getItem("favorites")) || []
  );

  const toggleFavorite = (eventId) => {
    setFavorites((prev) => {
      const updated = prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId];
      localStorage.setItem("favorites", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <>
      {/* ✅ Chỉ hiện Header và Navbar nếu KHÔNG phải trang admin */}
      {!isAdminPage && <Header />}
      {!isAdminPage && <MyNavbar />}

      <Routes>
        <Route
          path="/"
          element={
            <HomePage favorites={favorites} toggleFavorite={toggleFavorite} />
          }
        />
        <Route path="/category/:id" element={<CategoryPage />} />
        <Route path="/event/:id" element={<EventDetail />} />
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
        <Route path="/organizer/*" element={<OrganizerLayout />} />
        <Route path="/upload" element={<ImageUpload />} />
        <Route path="/select-ticket/:id" element={<SelectTicket />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-fail" element={<PaymentFail />} />
        <Route path="/my-tickets" element={<MyTickets />} />
        <Route path="/payment" element={<TicketPage />} />
        <Route path="/my-account" element={<MyAccount />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />


        {/* 🟠 Trang admin (ẩn header/footer) */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Dashboard />} /> {/* /admin */}
          <Route path="users" element={<UserManagement />} />{" "}
          {/* /admin/users */}
          <Route path="events" element={<EventManager />} /> {/* /admin/events */}
          <Route path="reports" element={<Report />} /> {/* /admin/reports */}
          <Route path="notifications" element={<Notification />} />{" "}
          {/* /admin/notifications */}
        </Route>
      </Routes>

      {/* ✅ Chỉ hiện Footer nếu KHÔNG phải trang admin */}
      {!isAdminPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <Router>
        <AppContent />
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
