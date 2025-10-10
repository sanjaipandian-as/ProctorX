import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PerformanceChart = ({ data }) => {
  // Format the data for the chart, ensuring it's sorted by date
  const chartData = data
    .map(quiz => ({
      name: quiz.quiz?.title.slice(0, 15) + (quiz.quiz?.title.length > 15 ? '...' : ''), // Shorten title for tooltip
      date: new Date(quiz.completedAt).toLocaleDateString('en-CA'), // Format as YYYY-MM-DD for correct sorting
      Accuracy: parseFloat(quiz.accuracy.toFixed(1)),
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort chronologically

  return (
    <div className="bg-slate-800/60 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-lg mb-10 h-80">
      <h3 className="text-lg font-semibold text-white mb-4">Performance Over Time</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis 
            dataKey="date" 
            stroke="#9ca3af" 
            fontSize={12} 
            tick={{ angle: -35, textAnchor: 'end' }} 
            height={50}
          />
          <YAxis 
            domain={[0, 100]} 
            stroke="#9ca3af" 
            fontSize={12} 
            label={{ value: '%', position: 'insideLeft', angle: -90, dy: 10, fill: '#9ca3af' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.9)', 
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '0.75rem'
            }} 
            labelStyle={{ color: '#cbd5e1' }}
          />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          <Line 
            type="monotone" 
            dataKey="Accuracy" 
            stroke="#a855f7" 
            strokeWidth={2} 
            dot={{ r: 4, fill: '#a855f7' }}
            activeDot={{ r: 6, stroke: '#d8b4fe' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;