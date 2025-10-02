import React, { useState, useEffect } from "react";
import "./App.css";
import { demoEvents } from "./share/data";
import "bootstrap/dist/css/bootstrap.min.css";

import Banner from "./components/Banner";
import Categories from "./components/Categories";
import EventSection from "./components/EventSection";
import Favorites from "./components/Favorites";
import Footer from "./components/Footer";
import Header from "./components/Header";
import MyNavbar from "./components/MyNavbar";


const categories = [
  { key: "all", label: "Tất cả" },
  { key: "music", label: "Âm nhạc" },
  { key: "workshop", label: "Hội thảo" },
  { key: "competition", label: "Cuộc thi" },
  { key: "market", label: "Hội chợ" },
];

function App() {
  const [bannerIndex, setBannerIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex((prev) =>
        demoEvents.length > 0 ? (prev + 1) % demoEvents.length : 0
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextBanner = () => setBannerIndex((prev) => (prev + 1) % demoEvents.length);
  const prevBanner = () => setBannerIndex((prev) => (prev === 0 ? demoEvents.length - 1 : prev - 1));
  const selectBanner = (index) => setBannerIndex(index);

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  return (
    <div className="App">
      <Header />
      <MyNavbar />
      <Banner
        demoEvents={demoEvents}
        bannerIndex={bannerIndex}
        nextBanner={nextBanner}
        prevBanner={prevBanner}
        selectBanner={selectBanner}
      />
      <Categories
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      <EventSection
        title="Thịnh hành"
        events={demoEvents.filter(
          (ev) => selectedCategory === "all" || ev.category === selectedCategory
        )}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />

      <EventSection
        title="Âm nhạc"
        events={demoEvents.filter((ev) => ev.category === "music")}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />
      <EventSection
        title="Hội thảo"
        events={demoEvents.filter((ev) => ev.category === "workshop")}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />
      <EventSection
        title="Cuộc thi"
        events={demoEvents.filter((ev) => ev.category === "competition")}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />
      <EventSection
        title="Hội chợ"
        events={demoEvents.filter((ev) => ev.category === "market")}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />

      <Favorites
        demoEvents={demoEvents}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />

      <Footer />
    </div>
  );
}

export default App;
