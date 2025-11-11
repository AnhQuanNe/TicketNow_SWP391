import React from 'react';
import "../css/StatsCard.css"
export default function StatsCard({ type, label, value, change, period, icon }) {
  const formatValue = (val) => {
    if (type === 'sales' || type === 'revenue') {
      return '$' + val.toLocaleString();
    }
    return val.toLocaleString();
  };

  const isPositive = change >= 0;
  const changeIcon = isPositive ? '↗' : '↘';

  return (
    <div className="stats-card">
      <div className={`stats-icon ${type}`}>
        {icon}
      </div>
      <div className="stats-content">
        <div className="stats-header">
          <span className="stats-label">{label}</span>
          <span className="stats-period">{period}</span>
        </div>
        <div className="stats-value">{formatValue(value)}</div>
        <div className={`stats-change ${isPositive ? 'positive' : 'negative'}`}>
          <span className="change-icon">{changeIcon}</span>
          <span>+{change}%</span>
          <span className="change-text">last month</span>
        </div>
      </div>
    </div>
  );
}