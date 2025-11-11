import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function RevenueChart({ data }) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Google ads',
        data: data.googleAds,
        borderColor: '#4ECDC4',
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: false,
        pointRadius: 6,
        pointBackgroundColor: 'white',
        pointBorderColor: '#4ECDC4',
        pointBorderWidth: 2,
        pointHoverRadius: 8
      },
      {
        label: 'Facebook ads',
        data: data.facebookAds,
        borderColor: '#FF8C42',
        backgroundColor: 'rgba(255, 140, 66, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: false,
        pointRadius: 6,
        pointBackgroundColor: 'white',
        pointBorderColor: '#FF8C42',
        pointBorderWidth: 2,
        pointHoverRadius: 8
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'white',
        titleColor: '#2c3e50',
        bodyColor: '#7f8c8d',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 400,
        ticks: {
          stepSize: 100,
          color: '#95a5a6',
          font: {
            size: 12
          }
        },
        grid: {
          color: '#f0f0f0',
          drawBorder: false
        }
      },
      x: {
        ticks: {
          color: '#95a5a6',
          font: {
            size: 12
          }
        },
        grid: {
          display: false,
          drawBorder: false
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  return (
    <div className="revenue-section">
      <div className="section-header">
        <h3 className="section-title">Revenue</h3>
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-dot google"></span>
            <span>Google ads</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot facebook"></span>
            <span>Facebook ads</span>
          </div>
        </div>
      </div>
      <div style={{ height: '350px', position: 'relative' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}