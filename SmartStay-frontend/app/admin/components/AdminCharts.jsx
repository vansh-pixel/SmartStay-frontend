"use client"
import React, { useMemo, useState, useCallback } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, Sector
} from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
  
  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#f3f4f6" fontSize="16" fontWeight="bold">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10} // Explode effect (make it bigger)
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        filter="url(#pie3DShadow)" // Keep shadow on active shape
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 15}
        outerRadius={outerRadius + 20}
        fill={fill}
      />
      <text x={cx} y={cy + 25} textAnchor="middle" fill="#9ca3af" fontSize="12">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
};

export default function AdminCharts({ roomMonthlyRevenue, eventMonthlyRevenue, roomStatusCounts, eventStatusCounts }) {
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [chartType, setChartType] = useState('room');

  const onPieEnter = useCallback((_, index) => {
    setActiveIndex(index);
  }, []);

  const monthlyRevenue = chartType === 'room' ? roomMonthlyRevenue : eventMonthlyRevenue;
  const statusCounts = chartType === 'room' ? roomStatusCounts : eventStatusCounts;

  // Process Monthly Revenue for Chart
  const lineData = useMemo(() => {
    // Return empty fallback structure if no data
    if (!monthlyRevenue || !Array.isArray(monthlyRevenue) || monthlyRevenue.length === 0) {
       return Array.from({ length: 6 }, (_, i) => ({ name: `Mon ${i+1}`, revenue: 0 }));
    }
    
    // Map month number to short name
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dataMap = {};
    monthlyRevenue.forEach(item => {
      dataMap[parseInt(item._id)] = item.total || 0;
    });

    const data = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthIndex = d.getMonth() + 1;
      const monthName = monthNames[d.getMonth()];
      data.push({
        name: monthName,
        revenue: dataMap[monthIndex] || 0
      });
    }
    return data;
  }, [monthlyRevenue]);

  // Process Status Counts for Pie Chart
  const pieData = useMemo(() => {
     if (!statusCounts || !Array.isArray(statusCounts) || statusCounts.length === 0) {
        return [{ name: 'No Bookings', value: 1 }]; 
     }
    return statusCounts.map(item => ({
      name: (item._id || 'Unknown').charAt(0).toUpperCase() + (item._id || 'unknown').slice(1),
      value: item.count || 0
    }));
  }, [statusCounts]);

  return (
    <div className="mb-8">
      {/* Chart Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-neutral-900/80 p-1 rounded-xl flex gap-1 border border-white/10">
          <button
            onClick={() => { setChartType('room'); setActiveIndex(0); }}
            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${
              chartType === 'room' 
                ? 'bg-orange-500 text-white shadow-lg' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Room Bookings
          </button>
          <button
            onClick={() => { setChartType('event'); setActiveIndex(0); }}
            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${
              chartType === 'event' 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Event Bookings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border border-transparent">
        
      {/* 3D Worm Graph - Using AreaChart for depth + Thick Line */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-neutral-900/50 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/10 h-full"
        >
          <h3 className="text-xl font-bold mb-6 text-neutral-200">
            {chartType === 'room' ? 'Room' : 'Event'} Revenue Trend (6 Months)
          </h3>
          <div className="h-[300px]" suppressHydrationWarning>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData}>
                <defs>
                  {/* Gradient for the Area (Under the worm) */}
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  
                  {/* Gradient for the Worm Stroke */}
                  <linearGradient id="wormGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f97316" />   {/* Orange */}
                    <stop offset="50%" stopColor="#a855f7" />  {/* Purple */}
                    <stop offset="100%" stopColor="#3b82f6" /> {/* Blue */}
                  </linearGradient>

                  {/* 3D Shadow Filter for the Worm Line */}
                  <filter id="wormShadow" height="200%">
                    <feDropShadow dx="0" dy="5" stdDeviation="3" floodColor="#a855f7" floodOpacity="0.5"/>
                  </filter>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#e5e7eb' }}
                />
                
                {/* 1. The Area (Glow below) */}
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="none" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  animationDuration={2000}
                />

                {/* 2. The Worm (Thick Line via another Area or Composite) */}
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="url(#wormGradient)" 
                  strokeWidth={6}
                  fill="none" 
                  filter="url(#wormShadow)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      {/* 3D Pie Chart - Booking Status */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-neutral-900/50 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/10 h-full"
        >
          <h3 className="text-xl font-bold mb-6 text-neutral-200">
            {chartType === 'room' ? 'Room' : 'Event'} Booking Status
          </h3>
          <div className="h-[300px]" suppressHydrationWarning>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                   {/* 3D Filter for Pie Slices */}
                   <filter id="pie3DShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
                      <feOffset in="blur" dx="2" dy="4" result="offsetBlur"/>
                      <feFlood floodColor="#000000" floodOpacity="0.5" result="offsetColor"/>
                      <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="offsetShadow"/>
                      <feMerge>
                        <feMergeNode in="offsetShadow"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                   </filter>
                </defs>

                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={onPieEnter}
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={6}
                  dataKey="value"
                  stroke="none"
                  animationDuration={1500}
                  animationEasing="ease-out"
                  filter="url(#pie3DShadow)"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                  ))}
                </Pie>
                {/* Custom Tooltip is handled by Active Shape mostly, but we can keep standard one or remove it if Active Shape shows enough info. 
                    Let's remove standard tooltip to avoid clutter on active shape. */}
                <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-neutral-400">{value}</span>}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

    </div>
    </div>
  );
}
