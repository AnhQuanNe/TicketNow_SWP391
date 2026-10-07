import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import EventList from "./EventList";

function EventSection({
  title,
  icon,
  events = [],
  favorites = [],
  toggleFavorite,
  variant = "standard",
  seeMoreLink,
  tabs,
  activeTab,
  onTabChange,
}) {
  return (
    <section className={`event-section section-${variant}`}>
      {/* Section Header */}
      <div className="section-header-row">
        <div className="section-title-wrap">
          {tabs && tabs.length > 0 ? (
            <div className="section-tabs-bar">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`section-tab-btn ${activeTab === tab ? "active" : ""}`}
                  onClick={() => onTabChange && onTabChange(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          ) : (
            <h2 className="section-heading">
              {icon && <span className="section-heading-icon">{icon}</span>}
              {title}
            </h2>
          )}
        </div>

        {seeMoreLink && (
          <Link to={seeMoreLink} className="section-see-more">
            <span>Xem thêm</span>
            <ChevronRight size={16} />
          </Link>
        )}
      </div>

      {/* Danh sách sự kiện */}
      <EventList
        events={events}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        variant={variant}
      />
    </section>
  );
}

export default EventSection;