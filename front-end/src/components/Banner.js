import React from "react";

function Banner({ demoEvents, bannerIndex, nextBanner, prevBanner, selectBanner }) {
    return (
      <div className="banner">
        <button className="banner-btn prev" onClick={prevBanner}>&lt;</button>
        {demoEvents.length > 0 ? (
          <img src={demoEvents[bannerIndex].banner} alt={`Banner ${bannerIndex + 1}`} />
        ) : (
          <div className="no-banner">Không có sự kiện</div>
        )}
        <button className="banner-btn next" onClick={nextBanner}>&gt;</button>
  
        <div className="banner-dots">
          {demoEvents.map((_, idx) => (
            <span
              key={idx}
              className={`dot ${idx === bannerIndex ? "active" : ""}`}
              onClick={() => selectBanner(idx)}
            ></span>
          ))}
        </div>
      </div>
    );
  }
  export default Banner;
  