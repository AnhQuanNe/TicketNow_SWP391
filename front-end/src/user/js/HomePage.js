import React, { useState, useEffect } from "react";
import Banner from "./Banner";
import Categories from "./Categories";
import EventSection from "./EventSection";
import Favourites from "./Favourites";
import EventFilterBar from "./EventFilterBar";
import { API_BASE_URL } from "../../config";


// 🟢 TRANG CHÍNH - HOMEPAGE
function HomePage({ searchTerm, selectedCategory, setSelectedCategory }) {
  const [bannerIndex, setBannerIndex] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [sortOption, setSortOption] = useState("");

  // 🟢 FETCH EVENTS từ backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/events`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setFilteredEvents(data);
      })
      .catch((err) => console.error(err));
  }, []);

  // 🟢 FETCH CATEGORIES từ backend
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error(err));
  }, []);

  // 🟢 Banner tự động chuyển
  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex((prev) =>
        events.length > 0 ? (prev + 1) % events.length : 0
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [events.length]);

  const nextBanner = () => setBannerIndex((prev) => (prev + 1) % events.length);
  const prevBanner = () =>
    setBannerIndex((prev) => (prev === 0 ? events.length - 1 : prev - 1));
  const selectBanner = (index) => setBannerIndex(index);

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleCategoryChange = (category) => setSelectedCategory(category);
  const handleSortChange = (sort) => setSortOption(sort);

  // 🟢 Áp dụng Search, Filter, Sort
  useEffect(() => {
    let result = [...events];

    if (searchTerm) {
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory && selectedCategory !== "all") {
      result = result.filter(
        (e) => e.categoryId?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (sortOption === "date_asc") {
      result.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortOption === "date_desc") {
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortOption === "price_asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === "price_desc") {
      result.sort((a, b) => b.price - a.price);
    }

    setFilteredEvents(result);
  }, [events, searchTerm, selectedCategory, sortOption]);

  const sectionNames = [
    "Thịnh hành",
    "Âm nhạc",
    "Hội thảo",
    "Thể thao",
    "Hội chợ",
    "Dành cho bạn",
  ];

  return (
    <>
      <Banner
        eventsFromDB={events}
        bannerIndex={bannerIndex}
        nextBanner={nextBanner}
        prevBanner={prevBanner}
        selectBanner={selectBanner}
      />

      <Categories
        categories={[{ _id: "all", name: "Tất cả" }, ...categories]}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {sectionNames.map((name) => {
        let filtered = [];
        if (name === "Thịnh hành") filtered = events;
        else if (name === "Dành cho bạn")
          filtered = events.filter((ev) => favorites.includes(ev._id));
        else {
          const cat = categories.find(
            (c) => c?.name?.toLowerCase() === name.toLowerCase()
          );
          filtered = cat ? events.filter((ev) => ev.categoryId === cat._id) : [];
        }

        if (selectedCategory !== "all") {
          const selectedCat = categories.find(
            (c) => c?.name === selectedCategory
          );
          filtered = filtered.filter((ev) => ev.categoryId === selectedCat?._id);
        }

        return (
          <EventSection
            key={name}
            title={name}
            events={filtered}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        );
      })}

      <Favourites
        eventsFromDB={events}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />

      <EventFilterBar
        onCategoryChange={handleCategoryChange}
        onSortChange={handleSortChange}
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        sortOption={sortOption}
      />

      <EventSection
        title="Kết quả tìm kiếm"
        events={filteredEvents}
        favorites={[]}
        toggleFavorite={() => {}}
      />
    </>
  );
}

export default HomePage;
