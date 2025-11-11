import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function WebsiteVisitors({ data }) {
  const chartData = {
    labels: data.map(d => d.name),
    datasets: [{
      data: data.map(d => d.value),
      backgroundColor: data.map(d => d.color),
      borderWidth: 0,
      cutout: '75%'
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
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
        callbacks: {
          label: function(context) {
            return context.label + ': ' + context.parsed + '%';
          }
        }
      }
    }
  };

  return (
    <div className="visitors-section">
      <div className="section-header">
        <h3 className="section-title">Website Visitors</h3>
      </div>
      <div className="visitors-chart">
        <div className="donut-chart">
          <Doughnut data={chartData} options={options} />
        </div>
        <div className="visitors-list">
          {data.map((item, index) => (
            <div key={index} className="visitor-item">
              <div className="visitor-label">
                <span 
                  className="visitor-dot" 
                  style={{ background: item.color }}
                ></span>
                <span className="visitor-name">{item.name}</span>
              </div>
              <span className="visitor-percentage">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}