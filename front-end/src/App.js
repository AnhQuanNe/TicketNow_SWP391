import React, { useState, useEffect } from "react";
import "./user/css/Banner.css";
import "./user/css/Categories.css";
import "./user/css/EventSection.css";
import "./user/css/Favourites.css";
import "./user/css/Footer.css";
import "./user/css/Header.css";
import "./user/css/MyNavbar.css";
import "./App.css";

import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Banner from "./user/Banner";
import Categories from "./user/Categories";
import EventSection from "./user/EventSection";
import Favorites from "./user/Favourites";
import Footer from "./user/Footer";
import Header from "./user/Header";
import MyNavbar from "./user/MyNavbar";

// Trang chính
function HomePage() {
  const [bannerIndex, setBannerIndex] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch categories từ backend
  useEffect(() => {
    fetch("/api/categories")
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error(err));
  }, []);

  // Fetch events từ backend
  useEffect(() => {
    fetch("/api/events")
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(err => console.error(err));
  }, []);

  // Banner auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex(prev => (events.length > 0 ? (prev + 1) % events.length : 0));
    }, 5000);
    return () => clearInterval(interval);
  }, [events.length]);

  const nextBanner = () => setBannerIndex(prev => (prev + 1) % events.length);
  const prevBanner = () => setBannerIndex(prev => (prev === 0 ? events.length - 1 : prev - 1));
  const selectBanner = index => setBannerIndex(index);

  const toggleFavorite = id => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  // Sections cố định
  const sectionNames = ["Thịnh hành", "Âm nhạc", "Hội thảo", "Thể thao", "Hội chợ", "Dành cho bạn"];

  return (
    <>
      <Banner
        eventsFromDB={events}
        bannerIndex={bannerIndex}
        nextBanner={nextBanner}
        prevBanner={prevBanner}
        selectBanner={selectBanner}
      />

      {/* Menu chọn category */}
      <Categories
        categories={[{ _id: "all", name: "Tất cả" }, ...categories]}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* Các section scroll ngang */}
      {sectionNames.map(name => {
        let filteredEvents = [];
        if (name === "Thịnh hành") {
          filteredEvents = events;
        } else if (name === "Dành cho bạn") {
          filteredEvents = events.filter(ev => favorites.includes(ev._id));
        } else {
          const cat = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
          filteredEvents = cat ? events.filter(ev => ev.categoryId === cat._id) : [];
        }

        // Áp filter theo menu chọn category
        if (selectedCategory !== "all") {
          const selectedCat = categories.find(c => c.name === selectedCategory);
          filteredEvents = filteredEvents.filter(ev => ev.categoryId === selectedCat?._id);
        }

        return (
          <EventSection
            key={name}
            title={name}
            events={filteredEvents}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        );
      })}

      <Favorites
        eventsFromDB={events}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />
    </>
  );
}

// Trang category riêng
function CategoryPage() {
  return <div>Category Page</div>;
}

function App() {
  return (
    <Router>
      <Header />
      <MyNavbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:id" element={<CategoryPage />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
