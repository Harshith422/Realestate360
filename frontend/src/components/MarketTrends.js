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
  Legend
} from 'chart.js';
import './MarketTrends.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MarketTrends = ({ propertyId, propertyDetails }) => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hpiData, setHpiData] = useState(null);

  // Function to parse price string to number
  const parsePrice = (priceStr) => {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return 0;
    
    const numericPart = priceStr.replace(/[^\d.]/g, '');
    const value = parseFloat(numericPart);
    
    if (priceStr.includes('Crore')) {
      return value * 10000000; // 1 Crore = 10,000,000
    } else if (priceStr.includes('Lakh')) {
      return value * 100000; // 1 Lakh = 100,000
    }
    return value;
  };

  // Function to fetch market trends data
  const fetchMarketTrends = async () => {
    try {
      setLoading(true);
      console.log('Fetching market trends with details:', propertyDetails);
      
      // Deep validation of propertyDetails
      if (!propertyDetails) {
        throw new Error('Property details are missing');
      }

      // Ensure all required fields are present and valid
      const validatedData = {
        propertyType: propertyDetails.propertyType || 'Apartment',
        sqft: typeof propertyDetails.area === 'number' 
          ? propertyDetails.area 
          : parseInt(propertyDetails.area) || 1000,
        city: propertyDetails.city || 'Unknown',
        bhk: typeof propertyDetails.bedrooms === 'number'
          ? propertyDetails.bedrooms
          : parseInt(propertyDetails.bedrooms) || 2
      };
      
      // Safety check for city
      if (!validatedData.city || validatedData.city === 'Unknown') {
        throw new Error('City information is missing or invalid');
      }

      console.log('Sending request with validated data:', validatedData);
      
      const response = await axios.post('http://localhost:5000/api/predict-price', validatedData);
      console.log('Received response:', response.data);

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setMarketData(response.data);
      setError(null);

      // Generate HPI data for visualization
      const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      const currentYear = new Date().getFullYear();
      const labels = quarters.map((q, i) => {
        const quarterNum = (currentQuarter + i) % 4 || 4;
        const year = currentQuarter + i > 4 ? currentYear + 1 : currentYear;
        return `${q} ${year}`;
      });
      
      // Calculate HPI values for next 4 quarters
      const hpiValues = quarters.map((_, i) => {
        return 100 * Math.pow(1 + (response.data.quarterlyGrowthRate || 0.02), i + 1);
      });

      setHpiData({
        labels: labels,
        datasets: [{
          label: 'Housing Price Index (Base 100)',
          data: hpiValues,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1
        }]
      });

    } catch (err) {
      console.error('Error fetching market trends:', err);
      setError(err.message || 'Failed to fetch market trends');
      setMarketData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyDetails && propertyDetails.city) {
      fetchMarketTrends();
    } else {
      setError('Incomplete property details');
      setLoading(false);
    }
  }, [propertyDetails]);

  if (loading) {
    return <div className="market-trends loading">Loading market trends...</div>;
  }

  if (error) {
    return (
      <div className="market-trends error">
        <h3>Market Trends Analysis</h3>
        <div className="error-container">
          <div className="error-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="error-details">
            <p>We couldn't load the market trends analysis at this time.</p>
            <p className="technical-error">Technical details: {error}</p>
            <button 
              className="retry-button"
              onClick={() => {
                setLoading(true);
                setError(null);
                if (propertyDetails && propertyDetails.city) {
                  fetchMarketTrends();
                } else {
                  setError('Incomplete property details');
                  setLoading(false);
                }
              }}
            >
              <i className="fas fa-sync-alt"></i> Retry
            </button>
            <p className="help-text">
              Please ensure all property details are available and try again.
              If this issue persists, please contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!marketData) {
    return null;
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="market-trends">
      <h3>Market Trends Analysis</h3>
      
      <div className="market-trends-grid">
        <div className="trend-card current-price">
          <h4>Current Market Value</h4>
          <p className="price">{formatCurrency(marketData.currentPrice)}</p>
        </div>

        <div className="trend-card roi">
          <h4>Expected ROI (1 Year)</h4>
          <p className="percentage">{formatPercentage(marketData.roi.annualizedROI / 100)}</p>
          </div>

        <div className="trend-card growth">
          <h4>Annual Growth Rate</h4>
          <p className="percentage">{formatPercentage(marketData.quarterlyGrowthRate * 4 / 100)}</p>
        </div>
      </div>

      <div className="price-comparison">
        <h4>Price Analysis</h4>
        <div className="comparison-grid">
          <div className="comparison-card">
            <h5>Listed Price</h5>
            <p className="price">{propertyDetails.price}</p>
          </div>
          <div className="comparison-card">
            <h5>Predicted Market Value</h5>
            <p className="price">{formatCurrency(marketData.currentPrice)}</p>
        </div>
          <div className="comparison-card">
            <h5>Price Difference</h5>
            <p className={`price-difference ${marketData.currentPrice > parsePrice(propertyDetails.price) ? 'positive' : 'negative'}`}>
              {formatCurrency(Math.abs(marketData.currentPrice - parsePrice(propertyDetails.price)))}
              <span className="difference-percentage">
                ({formatPercentage((marketData.currentPrice - parsePrice(propertyDetails.price)) / parsePrice(propertyDetails.price))})
              </span>
            </p>
          </div>
        </div>
        <div className="deal-analysis">
          <h5>Deal Analysis</h5>
          <p className={`deal-rating ${marketData.currentPrice > parsePrice(propertyDetails.price) ? 'good-deal' : 'bad-deal'}`}>
            {marketData.currentPrice > parsePrice(propertyDetails.price) ? 'Good Deal' : 'Consider Negotiation'}
          </p>
          <p className="deal-explanation">
            {marketData.currentPrice > parsePrice(propertyDetails.price) 
              ? 'The property is listed below its predicted market value, making it a potentially good investment opportunity.'
              : 'The property is listed above its predicted market value. Consider negotiating the price or exploring other options.'}
          </p>
        </div>
      </div>

      <div className="hpi-chart">
        <h4>Quarterly Price Index Projection</h4>
        {hpiData && (
          <Line
            data={hpiData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: true,
                  text: 'Next 4 Quarters Price Index (Base = Current Quarter)'
                }
              },
              scales: {
                y: {
                  title: {
                    display: true,
                    text: 'Price Index'
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: 'Quarter'
                  }
                }
              }
            }}
          />
        )}
      </div>

      <div className="future-projections">
        <h4>Future Price Projections</h4>
        <div className="projections-table">
          <table>
            <thead>
              <tr>
                <th>Quarter</th>
                <th>Projected Price</th>
                <th>Growth from Current</th>
                <th>Cumulative Growth</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(marketData.projections).map(([quarter, price], index) => {
                const growthFromCurrent = ((price - marketData.currentPrice) / marketData.currentPrice);
                const cumulativeGrowth = ((price - marketData.currentPrice) / marketData.currentPrice);
                
                return (
                  <tr key={quarter}>
                    <td>{quarter.toUpperCase()}</td>
                    <td>{formatCurrency(price)}</td>
                    <td className={growthFromCurrent >= 0 ? 'positive-growth' : 'negative-growth'}>
                      {formatPercentage(growthFromCurrent)}
                    </td>
                    <td className={cumulativeGrowth >= 0 ? 'positive-growth' : 'negative-growth'}>
                      {formatPercentage(cumulativeGrowth)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="market-source">
        Data source: {marketData.growthRateSource}
      </p>
    </div>
  );
};

export default MarketTrends;
