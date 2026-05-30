/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Station } from '../types';
import { Navigation as NavIcon, MapPin, Loader2, Sparkles, Filter, Users } from 'lucide-react';

interface CyberMapProps {
  stations: Station[];
  selectedStation: Station | null;
  onSelectStation: (station: Station) => void;
  userVehicleCoordinates?: { x: number; y: number };
}

export default function CyberMap({
  stations,
  selectedStation,
  onSelectStation,
  userVehicleCoordinates = { x: 350, y: 220 }, // Center
}: CyberMapProps) {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'OPEN' | 'BUSY'>('ALL');
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);

  // Simple hardcoded SVG coordinates for mock stations on our cyber grid
  const stationCoords: { [id: string]: { x: number; y: number } } = {
    'st-1': { x: 180, y: 120 },
    'st-2': { x: 520, y: 150 },
    'st-3': { x: 260, y: 340 },
    'st-4': { x: 580, y: 310 },
  };

  const filteredStations = stations.filter((st) => {
    if (activeFilter === 'ALL') return true;
    return st.status === activeFilter;
  });

  return (
    <div className="relative w-full h-[320px] md:h-[420px] bg-panel-bg rounded-xl border border-border-primary overflow-hidden shadow-sm font-sans" id="cyber-map-container">
      {/* Subtle Grid Layer */}
      <div className="absolute inset-0 cyber-grid-bg opacity-35 pointer-events-none" />
      
      {/* Navigation HUD */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-0.5 text-[10px] text-text-secondary bg-panel-bg/90 px-3 py-2 rounded-lg border border-border-primary/80 backdrop-blur-md shadow-xs">
        <span className="font-semibold text-text-primary">GPS Navigation Active</span>
        <span className="flex items-center gap-1.5 mt-0.5">
          <span className="w-1.5 h-1.5 bg-brand-emerald rounded-full animate-pulse" />
          4 stations found in area
        </span>
      </div>

      {/* Filter Overlay */}
      <div className="absolute top-4 right-4 z-20 flex bg-panel-bg/95 p-1 rounded-lg border border-border-primary/80 backdrop-blur-md shadow-xs">
        {(['ALL', 'OPEN', 'BUSY'] as const).map((mode) => (
          <button
            key={mode}
            id={`map-filter-${mode.toLowerCase()}`}
            onClick={() => setActiveFilter(mode)}
            className={`px-3 py-1 rounded-md text-[9px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              activeFilter === mode
                ? 'bg-brand-emerald text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {mode === 'ALL' ? 'All' : mode === 'OPEN' ? 'Open' : 'Busy'}
          </button>
        ))}
      </div>

      {/* Vector Interactive Map */}
      <svg
        className="absolute inset-0 w-full h-full select-none"
        viewBox="0 0 800 500"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Modern EV-style roads */}
        <path d="M 50,250 Q 400,50 750,250" fill="none" stroke="currentColor" className="text-border-primary/20" strokeWidth="4" />
        <path d="M 50,250 Q 400,450 750,250" fill="none" stroke="currentColor" className="text-border-primary/20" strokeWidth="4" />
        
        {/* Soft Gridlines */}
        <line x1="100" y1="0" x2="100" y2="500" stroke="currentColor" className="text-border-primary/10" strokeWidth="1" />
        <line x1="300" y1="0" x2="300" y2="500" stroke="currentColor" className="text-border-primary/10" strokeWidth="1" />
        <line x1="500" y1="0" x2="500" y2="500" stroke="currentColor" className="text-border-primary/10" strokeWidth="1" />
        <line x1="700" y1="0" x2="700" y2="500" stroke="currentColor" className="text-border-primary/10" strokeWidth="1" />
        
        <line x1="0" y1="150" x2="800" y2="150" stroke="currentColor" className="text-border-primary/10" strokeWidth="1" />
        <line x1="0" y1="300" x2="800" y2="300" stroke="currentColor" className="text-border-primary/10" strokeWidth="1" />
        <line x1="0" y1="400" x2="800" y2="400" stroke="currentColor" className="text-border-primary/10" strokeWidth="1" />

        {/* Dynamic Route Line from User to Selected Station */}
        {selectedStation && stationCoords[selectedStation.id] && (
          <>
            {/* Route path glow */}
            <path
              d={`M ${userVehicleCoordinates.x},${userVehicleCoordinates.y} 
                  Q ${(userVehicleCoordinates.x + stationCoords[selectedStation.id].x) / 2},${(userVehicleCoordinates.y + stationCoords[selectedStation.id].y) / 2 + 30} 
                  ${stationCoords[selectedStation.id].x},${stationCoords[selectedStation.id].y}`}
              fill="none"
              stroke="#10b981"
              strokeOpacity="0.1"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* High-speed route path */}
            <path
              id="route-path"
              d={`M ${userVehicleCoordinates.x},${userVehicleCoordinates.y} 
                  Q ${(userVehicleCoordinates.x + stationCoords[selectedStation.id].x) / 2},${(userVehicleCoordinates.y + stationCoords[selectedStation.id].y) / 2 + 30} 
                  ${stationCoords[selectedStation.id].x},${stationCoords[selectedStation.id].y}`}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="6, 10"
              className="animate-[dash_2s_linear_infinite]"
              style={{
                strokeDashoffset: 100,
              }}
            />
          </>
        )}

        {/* User Vehicle Node */}
        <g id="user-location-node">
          {/* Subtle Halo */}
          <circle
            cx={userVehicleCoordinates.x}
            cy={userVehicleCoordinates.y}
            r="20"
            fill="none"
            stroke="#10b981"
            strokeOpacity="0.2"
            strokeWidth="1.5"
          >
            <animate attributeName="r" values="8;20;8" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="3s" repeatCount="indefinite" />
          </circle>
          
          <circle
            cx={userVehicleCoordinates.x}
            cy={userVehicleCoordinates.y}
            r="8"
            fill="#ffffff"
            stroke="#10b981"
            strokeWidth="2.5"
            className="shadow-sm"
          />
          <circle
            cx={userVehicleCoordinates.x}
            cy={userVehicleCoordinates.y}
            r="3"
            fill="#10b981"
          />
        </g>

        {/* Station Map Pins */}
        {filteredStations.map((st) => {
          const coord = stationCoords[st.id] || { x: 100, y: 100 };
          const isSelected = selectedStation?.id === st.id;
          const isHovered = hoveredStation === st.id;
          const statusColor = st.status === 'OPEN' ? '#10b981' : st.status === 'BUSY' ? '#f59e0b' : '#ef4444';

          return (
            <g
              key={st.id}
              className="cursor-pointer group"
              onClick={() => onSelectStation(st)}
              onMouseEnter={() => setHoveredStation(st.id)}
              onMouseLeave={() => setHoveredStation(null)}
              id={`map-node-${st.id}`}
            >
              {/* Outer circle on hover or select */}
              <circle
                cx={coord.x}
                cy={coord.y}
                r={isSelected || isHovered ? "22" : "16"}
                fill="none"
                stroke={isSelected ? '#10b981' : statusColor}
                strokeWidth="1.5"
                strokeDasharray="3, 3"
                className="transition-all duration-300"
              />

              {/* Marker pin background */}
              <circle
                cx={coord.x}
                cy={coord.y}
                r="10"
                fill="#ffffff"
                stroke={isSelected ? '#10b981' : '#e4e4e7'}
                strokeWidth={isSelected ? '2.5' : '1.5'}
                className="transition-all dark:fill-zinc-900 dark:stroke-zinc-700"
              />

              {/* Station Dot Core */}
              <circle
                cx={coord.x}
                cy={coord.y}
                r="5"
                fill={statusColor}
                className="transition-transform duration-300"
              />

              {/* Floating Hologram Label */}
              <g transform={`translate(${coord.x - 70}, ${coord.y - 45})`}>
                <rect
                  width="140"
                  height="26"
                  rx="6"
                  fill="currentColor"
                  className="text-white border border-zinc-200/50 shadow-sm dark:text-zinc-900 dark:border-zinc-800"
                  stroke={isSelected ? '#10b981' : 'transparent'}
                  strokeWidth="1"
                />
                
                <text
                  x="70"
                  y="12"
                  textAnchor="middle"
                  className="fill-zinc-900 dark:fill-white font-semibold text-[8px] tracking-wide"
                >
                  {st.name.replace('SFRT - ', '')}
                </text>
                
                <text
                  x="70"
                  y="20"
                  textAnchor="middle"
                  className="font-medium text-[7px]"
                  fill={statusColor}
                >
                  {st.distance} km • {st.queueCount} cars waiting
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>

      {/* Floating Bottom Panel: Selected Station Quick Telemetry */}
      {selectedStation && (
        <div className="absolute bottom-4 left-4 right-4 z-20 transition-all duration-300">
          <div className="bg-panel-bg/95 border border-border-primary rounded-xl p-3.5 flex flex-row items-center justify-between gap-3 shadow-md backdrop-blur-md">
            <div className="flex items-start gap-3 max-w-[65%]">
              <div className="bg-brand-emerald/10 p-2 rounded-lg border border-brand-emerald/20 mt-0.5 shrink-0 text-brand-emerald">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="truncate">
                <h4 className="font-semibold text-xs text-text-primary truncate">
                  {selectedStation.name}
                </h4>
                <p className="text-[10px] text-text-secondary truncate mt-0.5">
                  {selectedStation.address}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-brand-emerald/10 text-brand-emerald text-[9px] font-semibold px-2 py-0.5 rounded border border-brand-emerald/20">
                    {selectedStation.distance} km
                  </span>
                  <span className="flex items-center gap-1 text-[9px] text-text-secondary font-medium">
                    <Users className="w-3.5 h-3.5 text-amber-500" />
                    Queue: {selectedStation.queueCount} cars
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right flex flex-col items-end gap-1 shrink-0">
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Est. Wait</span>
              <span className="font-display font-bold text-lg leading-none text-brand-emerald">
                ~{selectedStation.estWaitMinutes} <span className="text-xs font-sans font-medium text-text-secondary">min</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
