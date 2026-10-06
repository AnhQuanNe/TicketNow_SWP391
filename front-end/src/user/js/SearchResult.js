import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import EventList from "./EventList";
import { searchEvents } from "../../api/eventApi";
import "../css/SearchResult.css";

function SearchResult() {
  // Lấy query từ URL
  const [searchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [favorites, setFavorites] = useState(
    () => JSON.parse(localStorage.getItem("favorites")) || []
  );

  const toggleFavorite = (eventId) => {
    const newFavorites = favorites.includes(eventId)
      ? favorites.filter((id) => id !== eventId)
      : [...favorites, eventId];

    setFavorites(newFavorites);

    localStorage.setItem(
      "favorites",
      JSON.stringify(newFavorites)
    );
  };

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);

      try {
        const data = await searchEvents({
          query: queryFromUrl,
          startDate,
          endDate,
        });

        setResults(data);
      } catch (err) {
        console.error("Lỗi khi gọi API:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [queryFromUrl, startDate, endDate]);

  return (
    <div className="ms-3">
      {/* Tiêu đề */}
      <h6 className="my-3">
        Kết quả tìm kiếm cho: "{queryFromUrl}"
      </h6>

      {/* Bộ lọc ngày */}
      <div className="filter-controls ms-auto">
        <label>
          From:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              padding: "7px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              marginLeft: "5px",
            }}
          />
        </label>

        <label>
          To:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              padding: "7px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              marginLeft: "5px",
            }}
          />
        </label>
      </div>

      <div>
        {loading && <p>Đang tìm kiếm...</p>}

        {!loading && results.length === 0 && (
          <p>
            Không tìm thấy sự kiện nào khớp với điều kiện.
          </p>
        )}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          <EventList
            events={results}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        </div>
      </div>
    </div>
  );
}

export default SearchResult;