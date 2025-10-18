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
import SearchResult from "./user/js/SearchResult";

import MyAccount from "./user/js/MyAccount";
// import OrganizerLayout from "./organizer/OrganizerLayout";

import ImageUpload from "./api/ImageUpload";

function CategoryPage() {
  return <div>Category Page</div>;
}

function App() {
  

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      {/* ✅ Bọc toàn bộ ứng dụng bên trong */}
      <Router>
        <Header />
        <MyNavbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route path="/event/:id" element={<EventDetail />} />
          <Route path="/search" element={<SearchResult />} />
          <Route path="/upload" element={<ImageUpload />} />
          <Route path="/select-ticket/:id" element={<SelectTicket />} />
          <Route path="/select-ticket/:eventId" element={<SelectTicket />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment" element={<TicketPage />} />
          <Route path="/my-account" element={<MyAccount />} />
        </Routes>
        <Footer />
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
