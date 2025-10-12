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
import MyAccount from "./user/js/MyAccount";
// import OrganizerLayout from "./organizer/OrganizerLayout";

import ImageUpload from "./api/ImageUpload";

function CategoryPage() {
  return <div>Category Page</div>;
}

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const handleSearch = (term) => {
    setSearchTerm(term);
    setSelectedCategory("all");
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
        {/* <Route path="/organizer/*" element={<OrganizerLayout />} /> */}
        {/* ✅ Thêm route test upload ảnh */}
        <Route path="/upload" element={<ImageUpload />} />

        <Route path="/my-account" element={<MyAccount />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
