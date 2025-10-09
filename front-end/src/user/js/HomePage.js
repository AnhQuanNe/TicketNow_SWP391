import React, { useState, useEffect } from "react";
import Banner from "./Banner";
import EventSection from "./EventSection";
import Favorites from "./Favourites";

function HomePage() {
  const [bannerIndex1, setBannerIndex1] = useState(0);
  const [bannerIndex2, setBannerIndex2] = useState(0);  
  const [favorites, setFavorites] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch("/api/categories")
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    fetch("/api/events")
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const interval1 = setInterval(() => {
      setBannerIndex1(prev => (events.length > 0 ? (prev + 1) % events.length : 0));
    }, 5000);
  
    const interval2 = setInterval(() => {
      setBannerIndex2(prev => (events.length > 0 ? (prev + 1) % events.length : 0));
    }, 5000); 
  
    return () => {
      clearInterval(interval1);
      clearInterval(interval2);
    };
  }, [events.length]);
  

  const nextBanner1 = () => setBannerIndex1(prev => prev + 1);
  const prevBanner1 = () => setBannerIndex1(prev => prev - 1);
  const selectBanner1 = (i) => setBannerIndex1(i);

  const nextBanner2 = () => setBannerIndex2(prev => prev + 1);
  const prevBanner2 = () => setBannerIndex2(prev => prev - 1);
  const selectBanner2 = (i) => setBannerIndex2(i);


  const toggleFavorite = id => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const sectionNames = ["Thịnh hành", "Âm nhạc", "Hội thảo", "Thể thao", "Hội chợ", "Dành cho bạn"];

  return (
    <>
    <div className="banner-container">
    <Banner
      bannerIndex={bannerIndex1}
      nextBanner={nextBanner1}
      prevBanner={prevBanner1}
      selectBanner={selectBanner1}
    />

    <Banner
      bannerIndex={bannerIndex2}
      nextBanner={nextBanner2}
      prevBanner={prevBanner2}
      selectBanner={selectBanner2}
    />
    </div>

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

export default HomePage;
