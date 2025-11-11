import React, { useEffect, useState } from 'react';
import StatsCard from './StatsCard';
import RevenueChart from './RevenueChart';
import WebsiteVisitors from './WebVisitor';
import "../css/Dashboard.css"

export default function Dashboard() {
  const [stats, setStats] = useState({
    sales: { value: 230220, change: 55, period: 'May 2022' },
    customers: { value: 3200, change: 12, period: 'May 2022' },
    avgRevenue: { value: 2300, change: 210, period: 'May 2022' }
  });

  const [revenueData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
    googleAds: [100, 220, 180, 150, 120, 50, 120, 50],
    facebookAds: [50, 120, 100, 80, 300, 100, 180, 180]
  });

  const [visitorsData] = useState([
    { name: 'Direct', value: 38, color: '#FF6B6B' },
    { name: 'Organic', value: 22, color: '#4ECDC4' },
    { name: 'Paid', value: 12, color: '#45B7D1' },
    { name: 'Social', value: 28, color: '#FFA500' }
  ]);

  useEffect(() => {
    // Fetch dashboard data from API
    fetch('http://localhost:5000/api/dashboard/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Error fetching stats:', err));
  }, []);

  return (
    <div className="dashboard">
      {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard
          type="sales"
          label="Sales"
          value={stats.sales.value}
          change={stats.sales.change}
          period={stats.sales.period}
          icon="💰"
        />
        <StatsCard
          type="customers"
          label="Customers"
          value={stats.customers.value}
          change={stats.customers.change}
          period={stats.customers.period}
          icon="👥"
        />
        <StatsCard
          type="revenue"
          label="Avg Revenue"
          value={stats.avgRevenue.value}
          change={stats.avgRevenue.change}
          period={stats.avgRevenue.period}
          icon="💵"
        />
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <RevenueChart data={revenueData} />
        <WebsiteVisitors data={visitorsData} />
      </div>
    </div>
  );
}