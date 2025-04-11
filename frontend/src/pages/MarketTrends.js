import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import '../styles/MarketTrends.css';

// Register the chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MarketTrends = () => {
  const [formData, setFormData] = useState({
    city: '',
    sqft: '',
    bhk: '',
    propertyType: ''
  });
  const [prediction, setPrediction] = useState({
    currentPrice: null,
    quarterlyProjections: [],
    roi: {
      totalGrowth: null,
      annualizedROI: null,
      quarterlyGrowth: null
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('prediction');
  const [marketInsights, setMarketInsights] = useState({
    trendingLocations: [
      { name: 'Mumbai - Bandra', growth: 12.5 },
      { name: 'Bangalore - Whitefield', growth: 10.8 },
      { name: 'Pune - Hinjewadi', growth: 9.7 },
      { name: 'Delhi - Dwarka', growth: 8.9 },
      { name: 'Hyderabad - Gachibowli', growth: 11.2 }
    ]
  });

  const propertyTypes = ['Apartment', 'Villa', 'Residential Plot', 'Independent House'];
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all required fields are filled
    if (!formData.city || !formData.sqft || !formData.bhk || !formData.propertyType) {
      setError('Please fill in all property details to generate a prediction.');
      return;
    }
    
    setLoading(true);
    setError('');
    setPrediction({
      currentPrice: null,
      quarterlyProjections: [],
      roi: {
        totalGrowth: null,
        annualizedROI: null,
        quarterlyGrowth: null
      }
    });

    try {
      // For demo purposes, generate some random data to simulate a response
      const mockResponse = generateMockPrediction(formData);
      setTimeout(() => {
        setPrediction(mockResponse);
        setLoading(false);
      }, 1500);
      
      // Comment out actual API call for demo
      /*
      const response = await axios.post('http://localhost:5000/api/predict-price', formData);
      if (response.data && typeof response.data.currentPrice === 'number') {
        // Convert projections from object format to array format
        let quarterlyProjections = [];
        if (response.data.projections) {
          // Handle object format (q1, q2, q3, q4)
          quarterlyProjections = [
            { price: response.data.projections.q1 },
            { price: response.data.projections.q2 },
            { price: response.data.projections.q3 },
            { price: response.data.projections.q4 }
          ];
        }

        setPrediction({
          currentPrice: response.data.currentPrice,
          quarterlyProjections: quarterlyProjections,
          roi: {
            totalGrowth: response.data.roi?.totalGrowth || null,
            annualizedROI: response.data.roi?.annualizedROI || null,
            quarterlyGrowth: response.data.roi?.quarterlyGrowth || null
          }
        });
      } else {
        throw new Error('Invalid prediction data received');
      }
      */
    } catch (err) {
      setError('Error predicting price. Please try again.');
      console.error('Prediction error:', err);
      setLoading(false);
    }
  };

  // Mock data generator function for demonstration
  const generateMockPrediction = (data) => {
    // Validate all required properties exist
    if (!data.city || !data.sqft || !data.bhk || !data.propertyType) {
      throw new Error('Missing property details');
    }

    const basePrice = 
      data.city === 'Mumbai' ? 15000 : 
      data.city === 'Delhi' ? 12000 : 
      data.city === 'Bangalore' ? 10000 : 
      data.city === 'Hyderabad' ? 8000 : 
      data.city === 'Chennai' ? 7000 : 
      data.city === 'Pune' ? 9000 : 
      data.city === 'Kolkata' ? 6500 : 9000;
    
    const sqft = parseInt(data.sqft) || 1000;
    const bhk = parseInt(data.bhk) || 2;
    
    const propertyMultiplier = 
      data.propertyType === 'Apartment' ? 1 : 
      data.propertyType === 'Villa' ? 1.5 : 
      data.propertyType === 'Independent House' ? 1.3 : 
      data.propertyType === 'Residential Plot' ? 0.8 : 1;
    
    const currentPrice = basePrice * sqft * (bhk * 0.2 + 0.8) * propertyMultiplier;
    
    const quarterlyGrowth = Math.random() * 4 + 2; // 2-6% quarterly growth
    
    const quarterlyProjections = [];
    let runningPrice = currentPrice;
    
    for (let i = 0; i < 4; i++) {
      runningPrice = runningPrice * (1 + quarterlyGrowth/100);
      quarterlyProjections.push({ price: runningPrice });
    }
    
    const finalPrice = quarterlyProjections[3].price;
    const totalGrowth = ((finalPrice - currentPrice) / currentPrice) * 100;
    const annualizedROI = Math.pow(1 + totalGrowth/100, 1) - 1;
    
    return {
      currentPrice,
      quarterlyProjections,
      roi: {
        totalGrowth,
        annualizedROI: annualizedROI * 100,
        quarterlyGrowth
      }
    };
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) return 'N/A';
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(price);
    } catch (error) {
      console.error('Error formatting price:', error);
      return 'N/A';
    }
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    try {
      return `${parseFloat(value).toFixed(2)}%`;
    } catch (error) {
      console.error('Error formatting percentage:', error);
      return 'N/A';
    }
  };

  // Prepare chart data if prediction is available
  const getChartData = () => {
    // Safety check - ensure prediction and all required properties exist
    if (!prediction?.currentPrice || !Array.isArray(prediction.quarterlyProjections) || prediction.quarterlyProjections.length === 0) {
      return null;
    }

    try {
      const labels = ['Current', 'Q1', 'Q2', 'Q3', 'Q4'];
      // Make sure all data points exist and are valid
      const prices = [
        prediction.currentPrice,
        ...prediction.quarterlyProjections.map(q => q && typeof q.price === 'number' ? q.price : null)
      ];
      
      // If any price is null, don't render the chart
      if (prices.some(price => price === null)) {
        return null;
      }

      return {
        labels,
        datasets: [
          {
            label: 'Projected Price (₹)',
            data: prices,
            borderColor: '#4A90E2',
            backgroundColor: 'rgba(74, 144, 226, 0.1)',
            pointBackgroundColor: '#4A90E2',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#4A90E2',
            pointRadius: 6,
            pointHoverRadius: 8,
            tension: 0.4,
            fill: true
          }
        ]
      };
    } catch (err) {
      console.error('Error generating chart data:', err);
      return null;
    }
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
            family: "'Poppins', sans-serif"
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        bodyFont: {
          size: 14,
          family: "'Poppins', sans-serif"
        },
        titleFont: {
          size: 16,
          family: "'Poppins', sans-serif",
          weight: 'bold'
        },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              notation: 'compact',
              compactDisplay: 'short',
              maximumFractionDigits: 0
            }).format(value);
          },
          font: {
            size: 12,
            family: "'Poppins', sans-serif",
            weight: '500'
          },
          color: '#333'
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 12,
            family: "'Poppins', sans-serif"
          }
        }
      }
    }
  };

  return (
    <div className="market-trends-page">
      <div className="market-header">
        <div className="market-header-content">
          <h1>Real Estate Market Trends & Analytics</h1>
          <p>Gain valuable insights into property price trends and make data-driven investment decisions</p>
        </div>
      </div>

      <div className="market-container">
        <div className="market-tabs">
          <button 
            className={`tab-button ${activeTab === 'prediction' ? 'active' : ''}`}
            onClick={() => setActiveTab('prediction')}
          >
            <i className="fas fa-chart-line"></i> Price Prediction
          </button>
          <button 
            className={`tab-button ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            <i className="fas fa-lightbulb"></i> Market Insights
          </button>
        </div>

        {activeTab === 'prediction' && (
          <div className="prediction-section">
            <div className="section-grid">
              <div className="form-card">
                <div className="card-header">
                  <h2><i className="fas fa-calculator"></i> Price Predictor</h2>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="city">
                          <i className="fas fa-city"></i> City
                        </label>
                        <select
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select City</option>
                          {cities.map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="sqft">
                          <i className="fas fa-vector-square"></i> Area (sqft)
                        </label>
                        <input
                          type="number"
                          id="sqft"
                          name="sqft"
                          value={formData.sqft}
                          onChange={handleChange}
                          required
                          min="1"
                          placeholder="e.g. 1000"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="bhk">
                          <i className="fas fa-home"></i> BHK
                        </label>
                        <input
                          type="number"
                          id="bhk"
                          name="bhk"
                          value={formData.bhk}
                          onChange={handleChange}
                          required
                          min="1"
                          max="10"
                          placeholder="e.g. 2"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="propertyType">
                          <i className="fas fa-building"></i> Property Type
                        </label>
                        <select
                          id="propertyType"
                          name="propertyType"
                          value={formData.propertyType}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Property Type</option>
                          {propertyTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button type="submit" disabled={loading} className="predict-button">
                      {loading ? (
                        <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                      ) : (
                        <><i className="fas fa-search-dollar"></i> Predict Price</>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {prediction.currentPrice !== null && (
                <div className="results-card">
                  <div className="card-header success-gradient">
                    <h2><i className="fas fa-check-circle"></i> Price Analysis</h2>
                  </div>
                  <div className="card-body">
                    <div className="current-price">
                      <span className="label">Estimated Current Value</span>
                      <span className="value">{formatPrice(prediction.currentPrice)}</span>
                      <span className="property-summary">
                        {formData.bhk || '0'} BHK {formData.propertyType || 'Property'} in {formData.city || 'Selected City'}, 
                        {formData.sqft || '0'} sq.ft
                      </span>
                    </div>
                    
                    <div className="roi-metrics">
                      <div className="metric">
                        <div className="metric-icon">
                          <i className="fas fa-chart-line"></i>
                        </div>
                        <span className="metric-value">{formatPercentage(prediction.roi?.totalGrowth)}</span>
                        <span className="metric-label">1-Year Growth</span>
                      </div>
                      <div className="metric">
                        <div className="metric-icon">
                          <i className="fas fa-percentage"></i>
                        </div>
                        <span className="metric-value">{formatPercentage(prediction.roi?.annualizedROI)}</span>
                        <span className="metric-label">Annual ROI</span>
                      </div>
                      <div className="metric">
                        <div className="metric-icon">
                          <i className="fas fa-chart-bar"></i>
                        </div>
                        <span className="metric-value">{formatPercentage(prediction.roi?.quarterlyGrowth)}</span>
                        <span className="metric-label">Quarterly Growth</span>
                      </div>
                    </div>

                    <div className="chart-container">
                      <div className="chart-title">Price Growth Projection</div>
                      {getChartData() && (
                        <Line 
                          data={getChartData()} 
                          options={chartOptions} 
                          height={300}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {prediction.currentPrice !== null && Array.isArray(prediction.quarterlyProjections) && prediction.quarterlyProjections.length > 0 && (
              <div className="projections-card">
                <div className="card-header">
                  <h2><i className="fas fa-table"></i> Quarterly Price Projections</h2>
                </div>
                <div className="card-body">
                  <div className="projection-summary">
                    <div className="summary-item">
                      <span className="summary-label">Starting Price</span>
                      <span className="summary-value">{formatPrice(prediction.currentPrice)}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Final Price (Q4)</span>
                      <span className="summary-value">
                        {prediction.quarterlyProjections.length >= 4 && prediction.quarterlyProjections[3]?.price ? 
                          formatPrice(prediction.quarterlyProjections[3].price) : 'N/A'}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Total Appreciation</span>
                      <span className="summary-value">{formatPercentage(prediction.roi?.totalGrowth)}</span>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="projections-table">
                      <thead>
                        <tr>
                          <th>Quarter</th>
                          <th>Projected Price (₹)</th>
                          <th>Growth from Current</th>
                          <th>Value Increase (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(prediction.quarterlyProjections) && prediction.quarterlyProjections.map((projection, index) => {
                          // Skip rendering if projection is null or price is not a number
                          if (!projection || typeof projection.price !== 'number') {
                            return null;
                          }
                          
                          const price = projection.price;
                          const growth = ((price - prediction.currentPrice) / prediction.currentPrice * 100);
                          const valueIncrease = price - prediction.currentPrice;
                          
                          return (
                            <tr key={index}>
                              <td><span className="quarter-badge">Q{index + 1}</span></td>
                              <td className="price-cell">{formatPrice(price)}</td>
                              <td>
                                <div className={`growth-indicator ${growth >= 0 ? 'positive' : 'negative'}`}>
                                  <i className={`fas fa-arrow-${growth >= 0 ? 'up' : 'down'}`}></i>
                                  <span>{formatPercentage(growth)}</span>
                                </div>
                              </td>
                              <td className="value-increase">{formatPrice(valueIncrease)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-triangle"></i>
                <div>
                  <h4>Please check your input</h4>
                  <p>{error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="insights-section">
            <div className="insights-grid">
              <div className="insight-card market-overview">
                <div className="card-header">
                  <h2><i className="fas fa-globe-asia"></i> Market Overview</h2>
                </div>
                <div className="card-body">
                  <p className="insight-description">
                    The Indian real estate market is showing strong signs of recovery post-pandemic, with residential sales
                    up by 17% year-over-year. Demand for premium properties has increased significantly, especially in major metropolitan areas.
                  </p>
                  <div className="stats-grid">
                    <div className="stat-box">
                      <span className="stat-value">17%</span>
                      <span className="stat-label">Sales Growth</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-value">9.2%</span>
                      <span className="stat-label">Price Appreciation</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-value">28%</span>
                      <span className="stat-label">New Launches</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-value">12.5%</span>
                      <span className="stat-label">Rental Yield</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="insight-card trending-locations">
                <div className="card-header">
                  <h2><i className="fas fa-fire"></i> Trending Locations</h2>
                </div>
                <div className="card-body">
                  <div className="trend-list">
                    {marketInsights.trendingLocations.map((location, index) => (
                      <div key={index} className="trend-item">
                        <div className="trend-info">
                          <span className="trend-name">{location.name}</span>
                          <div className="trend-growth">
                            <i className="fas fa-arrow-up"></i>
                            <span>{location.growth.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="trend-bar-container">
                          <div className="trend-bar" style={{ width: `${location.growth * 6}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="insight-card recommendation">
                <div className="card-header">
                  <h2><i className="fas fa-lightbulb"></i> Investment Insights</h2>
                </div>
                <div className="card-body">
                  <div className="recommendation-content">
                    <p className="highlight-text">
                      <i className="fas fa-quote-left"></i>
                      The residential sector is expected to grow by 5-10% in the upcoming year, with mid-segment properties showing the best growth potential.
                    </p>
                    <ul className="insight-list">
                      <li><i className="fas fa-check-circle"></i> Tier-2 cities are showing strong growth potential due to improved infrastructure</li>
                      <li><i className="fas fa-check-circle"></i> Properties near tech parks and business hubs continue to command premium prices</li>
                      <li><i className="fas fa-check-circle"></i> Government initiatives like RERA are improving market transparency and buyer confidence</li>
                      <li><i className="fas fa-check-circle"></i> Sustainable and smart homes are seeing increased demand among young professionals</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketTrends;