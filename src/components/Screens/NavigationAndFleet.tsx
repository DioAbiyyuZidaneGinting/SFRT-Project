/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Users, Flame, ShieldAlert, Sparkles, Navigation as NavIcon, 
  Calendar, Eye, FileSpreadsheet, Compass, Camera, RefreshCw, Layers, 
  ArrowRight, Star, Clock, Fuel, Search, CheckCircle2, AlertTriangle, Info 
} from 'lucide-react';
import GlassCard from '../GlassCard';
import { Station, Vehicle, Transaction } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

// Helper to calculate Haversine distance in km
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return parseFloat(d.toFixed(2));
}

// Generate mock stations near a given latitude/longitude as fallback or enhancement
const generateMockStations = (lat: number, lng: number): (Station & { brand: string; rating: number })[] => {
  let cityName = "Jakarta";
  if (lat > 3.5 && lat < 3.7) {
    if (lng > 98.4 && lng < 98.55) {
      cityName = "Binjai";
    } else if (lng > 98.55 && lng < 98.8) {
      cityName = "Medan";
    } else {
      cityName = "Sumatera Utara";
    }
  } else if (lat > -6.5 && lat < -5.9) {
    cityName = "Jakarta";
  } else {
    cityName = "Lokal";
  }

  return [
    {
      id: 'mock-pertamina-1',
      name: `SPBU Pertamina ${cityName} Sentral`,
      address: `Jl. Utama ${cityName} No. 21`,
      distance: 0.8,
      latitude: lat + 0.003,
      longitude: lng + 0.004,
      queueCount: 4,
      estWaitMinutes: 8,
      status: 'OPEN' as const,
      rating: 4.4,
      brand: 'Pertamina',
      fuelStock: { 'Pertalite': true, 'Pertamax': true, 'Pertamax Turbo': true, 'Solar': true }
    },
    {
      id: 'mock-shell-2',
      name: `Shell ${cityName} Bypass`,
      address: `Jl. Bypass Sudirman No. 102, ${cityName}`,
      distance: 1.5,
      latitude: lat - 0.004,
      longitude: lng + 0.003,
      queueCount: 2,
      estWaitMinutes: 4,
      status: 'OPEN' as const,
      rating: 4.6,
      brand: 'Shell',
      fuelStock: { 'Pertalite': false, 'Pertamax': true, 'Pertamax Turbo': true, 'Solar': true }
    },
    {
      id: 'mock-vivo-3',
      name: `Vivo SPBU ${cityName} Raya`,
      address: `Jl. Ahmad Yani No. 5, ${cityName}`,
      distance: 2.1,
      latitude: lat + 0.002,
      longitude: lng - 0.005,
      queueCount: 7,
      estWaitMinutes: 14,
      status: 'BUSY' as const,
      rating: 4.3,
      brand: 'Vivo',
      fuelStock: { 'Pertalite': true, 'Pertamax': true, 'Pertamax Turbo': false, 'Solar': false }
    },
    {
      id: 'mock-bp-4',
      name: `BP AKR ${cityName} Merdeka`,
      address: `Jl. Merdeka No. 15, ${cityName}`,
      distance: 3.4,
      latitude: lat - 0.005,
      longitude: lng - 0.004,
      queueCount: 1,
      estWaitMinutes: 2,
      status: 'OPEN' as const,
      rating: 4.5,
      brand: 'BP',
      fuelStock: { 'Pertalite': true, 'Pertamax': true, 'Pertamax Turbo': true, 'Solar': true }
    }
  ];
};

interface NearbyStationPageProps {
  stations: Station[];
  selectedStation: Station | null;
  onSelectStation: (station: Station) => void;
  onStartRefuelFlow: (station: Station) => void;
  isLoadingStations?: boolean;
}

export function NearbyStationPage({
  stations: globalStations,
  selectedStation,
  onSelectStation,
  onStartRefuelFlow,
  isLoadingStations = false,
}: NearbyStationPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'prompt' | 'granted' | 'denied' | 'error'>('prompt');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({ lat: -6.2088, lng: 106.8456 }); // Default Jakarta
  const [localStations, setLocalStations] = useState<(Station & { brand: string; rating: number })[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { t, language } = useTranslation();

  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  // Load Google Maps JavaScript API SDK
  useEffect(() => {
    const GOOGLE_API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || "";
    const SCRIPT_ID = 'google-maps-sdk-script';

    const initializeSDK = () => {
      if ((window as any).google) {
        setMapReady(true);
        return;
      }

      let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      const handleLoad = () => setMapReady(true);
      script.addEventListener('load', handleLoad);

      return () => {
        script.removeEventListener('load', handleLoad);
      };
    };

    initializeSDK();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapReady || !mapRef.current || map) return;

    // Premium dark/emerald theme style
    const darkMapStyles = [
      { elementType: "geometry", stylers: [{ color: "#141419" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#141419" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#8796a5" }] },
      { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#10b981" }] },
      { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#10b981" }] },
      { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1a2e26" }] },
      { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#10b981" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#22252c" }] },
      { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1c1e24" }] },
      { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
      { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2d333f" }] },
      { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f232d" }] },
      { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#e5e7eb" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
      { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#38bdf8" }] }
    ];

    const mapInstance = new (window as any).google.maps.Map(mapRef.current, {
      center: userLocation,
      zoom: 14,
      styles: darkMapStyles,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    setMap(mapInstance);
  }, [mapReady, map]);

  // Request browser Geolocation API
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      // Fallback
      const fallbackList = generateMockStations(userLocation.lat, userLocation.lng);
      setLocalStations(fallbackList);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(coords);
        setGpsStatus('granted');
        if (map) {
          map.setCenter(coords);
          map.setZoom(14);
          fetchNearbyGasStations(coords, map);
        }
      },
      (err) => {
        console.warn("GPS Permission Denied. Falling back to default Jakarta center.", err);
        setGpsStatus('denied');
        const defaultCoords = { lat: -6.2088, lng: 106.8456 };
        setUserLocation(defaultCoords);
        if (map) {
          map.setCenter(defaultCoords);
          map.setZoom(14);
          fetchNearbyGasStations(defaultCoords, map);
        } else {
          const fallbackList = generateMockStations(defaultCoords.lat, defaultCoords.lng);
          setLocalStations(fallbackList);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [mapReady, map]);

  // Fetch Nearby SPBU using Google Places API (New)
  const fetchNearbyGasStations = async (coords: { lat: number; lng: number }, mapInstance: any) => {
    if (!(window as any).google || !mapInstance) return;

    setIsSearching(true);
    console.log("[DEBUG] Places API (New) User Coordinates:", coords);

    try {
      const { Place } = await (window as any).google.maps.importLibrary("places");
      
      const request = {
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'types'],
        locationRestriction: {
          center: { lat: coords.lat, lng: coords.lng },
          radius: 10000 // 10km (radius in meters: 10000)
        },
        includedTypes: ['gas_station'],
        maxResultCount: 20
      };

      console.log("[DEBUG] Places API (New) Request:", request);
      const { places } = await Place.searchNearby(request);
      console.log("[DEBUG] Places API (New) Response places:", places);
      console.log("[DEBUG] Places API (New) Results Count:", places?.length || 0);

      if (places && places.length > 0) {
        const resolvedPlaces = await Promise.all(places.map(async (place: any) => {
          const name = place.displayName || "";
          let brand = 'Lainnya';
          if (/pertamina/i.test(name)) brand = 'Pertamina';
          else if (/shell/i.test(name)) brand = 'Shell';
          else if (/bp/i.test(name)) brand = 'BP';
          else if (/vivo/i.test(name)) brand = 'Vivo';

          // Get location coordinates safely
          const placeLat = place.location?.lat ? place.location.lat() : coords.lat;
          const placeLng = place.location?.lng ? place.location.lng() : coords.lng;

          const dist = getHaversineDistance(
            coords.lat,
            coords.lng,
            placeLat,
            placeLng
          );

          // Simulated queue count and wait minutes
          const queueCount = Math.floor(Math.random() * 6) + 2; // 2-7 cars
          const estWaitMinutes = queueCount * 2; // 4-14 mins

          let isOpenStatus: 'OPEN' | 'CLOSED' | 'BUSY' = 'OPEN';
          try {
            if (typeof place.isOpen === 'function') {
              const openRes = await place.isOpen();
              if (openRes === false) {
                isOpenStatus = 'CLOSED';
              } else if (openRes === true) {
                isOpenStatus = Math.random() > 0.7 ? 'BUSY' : 'OPEN';
              }
            }
          } catch (e) {
            console.log("Failed to fetch isOpen status", e);
          }

          return {
            id: place.id || crypto.randomUUID(),
            name: name || "Stasiun BBM",
            address: place.formattedAddress || "Alamat tidak tersedia",
            distance: dist,
            latitude: placeLat,
            longitude: placeLng,
            queueCount,
            estWaitMinutes,
            status: isOpenStatus,
            rating: place.rating || 4.2,
            brand,
            fuelStock: {
              'Pertalite': true,
              'Pertamax': true,
              'Pertamax Turbo': true,
              'Solar': true
            }
          };
        }));

        // Sort by distance
        resolvedPlaces.sort((a: any, b: any) => a.distance - b.distance);
        setLocalStations(resolvedPlaces);
      } else {
        console.warn("Places API (New) returned 0 results. Using location-aware dynamic fallback.");
        const fallbackList = generateMockStations(coords.lat, coords.lng);
        setLocalStations(fallbackList);
      }
    } catch (error) {
      console.error("Error fetching nearby gas stations via Places API (New):", error);
      const fallbackList = generateMockStations(coords.lat, coords.lng);
      setLocalStations(fallbackList);
    } finally {
      setIsSearching(false);
    }
  };

  // Update Markers on map
  useEffect(() => {
    if (!map || !(window as any).google) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // Add user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }

    userMarkerRef.current = new (window as any).google.maps.Marker({
      position: userLocation,
      map: map,
      title: "Lokasi Anda",
      icon: {
        path: (window as any).google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: "#10b981", // Emerald user dot
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      }
    });

    // Add stations markers
    localStations.forEach((st) => {
      let pinColor = "#6b7280"; // Gray
      if (st.brand === "Pertamina") pinColor = "#ef4444"; // Red
      else if (st.brand === "Shell") pinColor = "#eab308"; // Yellow
      else if (st.brand === "BP") pinColor = "#22c55e"; // Green
      else if (st.brand === "Vivo") pinColor = "#3b82f6"; // Blue

      const marker = new (window as any).google.maps.Marker({
        position: { lat: st.latitude, lng: st.longitude },
        map: map,
        title: st.name,
        icon: {
          path: (window as any).google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: pinColor,
          fillOpacity: 0.95,
          strokeColor: "#000000",
          strokeWeight: 1.5,
        }
      });

      marker.addListener("click", () => {
        onSelectStation(st);
        map.panTo({ lat: st.latitude, lng: st.longitude });
      });

      markersRef.current.push(marker);
    });

    // Center map around user
    map.panTo(userLocation);
  }, [map, localStations, userLocation]);

  // Handler for custom search (New Places API)
  const handleLocationSearch = async () => {
    if (!searchQuery || !map || !(window as any).google) return;

    try {
      setIsSearching(true);
      const { Place } = await (window as any).google.maps.importLibrary("places");
      
      const request = {
        textQuery: searchQuery,
        fields: ['id', 'displayName', 'location', 'formattedAddress']
      };

      console.log("[DEBUG] Places API (New) Text Search Request:", request);
      const { places } = await Place.searchByText(request);
      console.log("[DEBUG] Places API (New) Text Search Response:", places);

      if (places && places.length > 0 && places[0].location) {
        const loc = places[0].location;
        const newCoords = { lat: loc.lat(), lng: loc.lng() };
        setUserLocation(newCoords);
        map.setCenter(newCoords);
        map.setZoom(14);
        await fetchNearbyGasStations(newCoords, map);
      } else {
        console.warn("Places API (New) Text Search returned 0 results.");
      }
    } catch (error) {
      console.error("Error during Places API (New) Text Search:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const getBrandBadgeColor = (brand: string) => {
    switch (brand) {
      case 'Pertamina': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Shell': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'BP': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Vivo': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  // Simulated queue lane details for selected station
  const simulatedDispenserLanes = [
    { lane: 1, name: 'Dispenser #1 (Pertalite)', status: 'ACTIVE', timeRemaining: '2 min' },
    { lane: 2, name: 'Dispenser #2 (Pertamax/Turbo)', status: 'AVAILABLE', timeRemaining: 'Ready' },
    { lane: 3, name: 'Dispenser #3 (Dexlite/Diesel)', status: 'ACTIVE', timeRemaining: '5 min' }
  ];

  return (
    <div className="flex-grow space-y-6 text-text-primary text-left" id="stations-module">
      {/* Search Header Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-panel-bg backdrop-blur-md p-4 rounded-xl border border-border-primary shadow-sm text-left">
        <div className="md:col-span-6 relative flex gap-2">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder={language === 'id' ? 'Masukkan kota, daerah, atau nama jalan...' : 'Enter city, area, or street...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
              className="w-full bg-overlay backdrop-blur-md border border-border-primary rounded-lg py-2.5 pl-9 pr-4 text-sm font-sans text-text-primary placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
          </div>
          <button
            onClick={handleLocationSearch}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-sans font-bold text-xs px-4 py-2.5 rounded-lg border-2 border-black hover:-translate-y-0.5 active:translate-y-0 shadow-[1px_1px_0px_#000] hover:shadow-[2px_2px_0px_#000] transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            {language === 'id' ? 'Cari' : 'Search'}
          </button>
        </div>

        <div className="md:col-span-6 flex justify-end items-center gap-4 text-xs font-sans">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">{language === 'id' ? 'Status GPS:' : 'GPS Status:'}</span>
            {gpsStatus === 'granted' ? (
              <span className="flex items-center gap-1 text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> {language === 'id' ? 'Terkalibrasi' : 'Calibrated'}
              </span>
            ) : gpsStatus === 'denied' ? (
              <span className="flex items-center gap-1 text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20" title="Using default center">
                <AlertTriangle className="w-3.5 h-3.5" /> {language === 'id' ? 'Default GPS' : 'Default GPS'}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-zinc-500 bg-overlay px-2 py-0.5 rounded border border-border-primary animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {language === 'id' ? 'Mendapatkan Lokasi...' : 'Acquiring GPS...'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main split grid: map and details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column - map container */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative w-full h-[400px] md:h-[500px] bg-panel-bg rounded-xl border border-border-primary overflow-hidden shadow-sm font-sans">
            {!mapReady && (
              <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-zinc-950/80 z-20">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
                <span className="text-xs text-zinc-400 font-medium">Loading Google Maps SDK...</span>
              </div>
            )}
            {isSearching && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-panel-bg/95 border border-emerald-500/30 text-emerald-500 text-xs px-3 py-1.5 rounded-full backdrop-blur-md shadow-md z-20 font-sans font-semibold flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {language === 'id' ? 'Memindai SPBU Terdekat...' : 'Searching Places Nearby...'}
              </div>
            )}
            <div ref={mapRef} className="w-full h-full" id="google-maps-container" />
          </div>
        </div>

        {/* Right column - details panel */}
        <div className="lg:col-span-5 flex flex-col gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
          {/* Selected Station card detailed telemetry */}
          {selectedStation ? (
            <div className="space-y-4">
              <GlassCard
                title={selectedStation.name}
                subtitle={selectedStation.address}
                headerAction={
                  <span className={`font-sans text-[10px] font-semibold px-2 py-0.5 rounded border capitalize ${
                    getBrandBadgeColor((selectedStation as any).brand || 'Lainnya')
                  }`}>
                    {(selectedStation as any).brand || 'Stasiun'}
                  </span>
                }
              >
                <div className="space-y-4">
                  {/* Quick stats grid */}
                  <div className="grid grid-cols-3 gap-2 font-sans text-xs text-text-secondary">
                    <div className="text-center bg-overlay p-2.5 rounded-lg border border-border-primary">
                      <span className="block text-[9px] uppercase tracking-wider font-semibold text-zinc-500">{language === 'id' ? 'Jarak' : 'Distance'}</span>
                      <span className="text-emerald-500 font-bold block mt-1 text-sm">
                        {selectedStation.distance} km
                      </span>
                    </div>
                    <div className="text-center bg-overlay p-2.5 rounded-lg border border-border-primary">
                      <span className="block text-[9px] uppercase tracking-wider font-semibold text-zinc-500">{language === 'id' ? 'Rating Maps' : 'Google Rating'}</span>
                      <span className="text-text-primary font-bold block mt-1 text-sm flex items-center justify-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {(selectedStation as any).rating || '4.2'}
                      </span>
                    </div>
                    <div className="text-center bg-overlay p-2.5 rounded-lg border border-border-primary">
                      <span className="block text-[9px] uppercase tracking-wider font-semibold text-zinc-500">{language === 'id' ? 'Jam Buka' : 'Status'}</span>
                      <span className={`font-bold block mt-1 text-sm ${selectedStation.status === 'CLOSED' ? 'text-red-500' : 'text-emerald-500'}`}>
                        {selectedStation.status === 'CLOSED' ? 'Tutup' : 'Buka'}
                      </span>
                    </div>
                  </div>

                  {/* FUEL AVAILABILITY PANEL */}
                  <div className="border-t border-border-primary pt-3 space-y-2">
                    <h4 className="font-sans text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5 text-emerald-500" />
                      {language === 'id' ? 'Ketersediaan & Simulasi Harga BBM' : 'Fuel Availability & Simulated Pricing'}
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-2 font-sans">
                      {/* Pertalite */}
                      <div className="bg-overlay/50 border border-border-primary p-2.5 rounded-lg flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-semibold text-text-primary">Pertalite</span>
                          <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.2 rounded">RON 90</span>
                        </div>
                        <div className="mt-2 flex justify-between items-end">
                          <span className="text-xs font-bold text-text-primary">Rp 10.000<span className="text-[9px] font-medium text-zinc-500">/L</span></span>
                          <div className="text-[9px] text-zinc-500 text-right">
                            <span>Stok: 85%</span>
                            <div className="w-12 h-1 bg-border-primary rounded-full overflow-hidden mt-0.5">
                              <div className="bg-emerald-500 h-full" style={{ width: '85%' }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pertamax */}
                      <div className="bg-overlay/50 border border-border-primary p-2.5 rounded-lg flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-semibold text-text-primary">Pertamax</span>
                          <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.2 rounded">RON 92</span>
                        </div>
                        <div className="mt-2 flex justify-between items-end">
                          <span className="text-xs font-bold text-text-primary">Rp 12.500<span className="text-[9px] font-medium text-zinc-500">/L</span></span>
                          <div className="text-[9px] text-zinc-500 text-right">
                            <span>Stok: 90%</span>
                            <div className="w-12 h-1 bg-border-primary rounded-full overflow-hidden mt-0.5">
                              <div className="bg-emerald-500 h-full" style={{ width: '90%' }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pertamax Turbo */}
                      <div className="bg-overlay/50 border border-border-primary p-2.5 rounded-lg flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-semibold text-text-primary">Pertamax Turbo</span>
                          <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.2 rounded">RON 98</span>
                        </div>
                        <div className="mt-2 flex justify-between items-end">
                          <span className="text-xs font-bold text-text-primary">Rp 14.850<span className="text-[9px] font-medium text-zinc-500">/L</span></span>
                          <div className="text-[9px] text-zinc-500 text-right">
                            <span>Stok: 78%</span>
                            <div className="w-12 h-1 bg-border-primary rounded-full overflow-hidden mt-0.5">
                              <div className="bg-emerald-500 h-full" style={{ width: '78%' }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dexlite */}
                      <div className="bg-overlay/50 border border-border-primary p-2.5 rounded-lg flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-semibold text-text-primary">Dexlite</span>
                          <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.2 rounded">CN 51</span>
                        </div>
                        <div className="mt-2 flex justify-between items-end">
                          <span className="text-xs font-bold text-text-primary">Rp 16.200<span className="text-[9px] font-medium text-zinc-500">/L</span></span>
                          <div className="text-[9px] text-zinc-500 text-right">
                            <span>Stok: 60%</span>
                            <div className="w-12 h-1 bg-border-primary rounded-full overflow-hidden mt-0.5">
                              <div className="bg-emerald-500 h-full" style={{ width: '60%' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QUEUE INFORMATION PANEL */}
                  <div className="border-t border-border-primary pt-3 space-y-2 font-sans">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-500" />
                        {language === 'id' ? 'Status Antrian Dispenser' : 'Dispenser Queue Status'}
                      </h4>
                      <span className="text-[10px] text-zinc-400 font-semibold bg-overlay border border-border-primary px-2 py-0.5 rounded-md">
                        {selectedStation.queueCount} {language === 'id' ? 'Armada Antri' : 'Vehicles Queueing'}
                      </span>
                    </div>

                    <div className="bg-overlay/40 rounded-lg border border-border-primary p-2 space-y-1.5 text-xs text-text-secondary">
                      {simulatedDispenserLanes.map((d) => (
                        <div key={d.lane} className="flex justify-between items-center py-1 border-b border-border-primary/40 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'AVAILABLE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                            <span className="font-medium text-text-primary">{d.name}</span>
                          </div>
                          <span className={d.status === 'AVAILABLE' ? 'text-emerald-500 font-bold' : 'text-zinc-500'}>
                            {d.status === 'AVAILABLE' ? (language === 'id' ? 'Tersedia' : 'Available') : `${language === 'id' ? 'Antri' : 'Busy'} (${d.timeRemaining})`}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-xs bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2 mt-1">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        {language === 'id' ? 'Estimasi Waktu Tunggu:' : 'Est. Waiting Duration:'}
                      </span>
                      <span className="text-emerald-500 font-bold text-sm">~ {selectedStation.estWaitMinutes} Menit</span>
                    </div>
                  </div>

                  {/* Primary Selection Trigger */}
                  <button
                    onClick={() => onStartRefuelFlow(selectedStation)}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-sans font-bold text-sm py-3.5 rounded-lg border-2 border-black hover:-translate-y-0.5 active:translate-y-0 shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <NavIcon className="w-4 h-4" />
                    {language === 'id' ? 'Pilih Stasiun & Isi Bahan Bakar' : 'Confirm & Start Refueling'}
                  </button>
                </div>
              </GlassCard>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-panel-bg/50 border border-border-primary border-dashed rounded-xl p-6 font-sans">
              <Compass className="w-12 h-12 text-zinc-600 mb-3 animate-pulse" />
              <h3 className="font-semibold text-sm text-text-primary">{language === 'id' ? 'Pilih SPBU Terdekat' : 'Select a Fuel Station'}</h3>
              <p className="text-xs text-text-secondary mt-1.5 max-w-[80%]">
                {language === 'id' 
                  ? 'Klik salah satu pin marker stasiun di peta atau cari area untuk melihat info antrian dan persediaan bahan bakar' 
                  : 'Click on a station marker pin on the map or enter a search query to view real-time availability and queues'}
              </p>
            </div>
          )}

          {/* List view of nearby places found */}
          <div className="space-y-3">
            <h3 className="font-sans text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 pl-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              {language === 'id' ? `Stasiun BBM Terdekat (${localStations.length})` : `Stations Nearby (${localStations.length})`}
            </h3>

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {localStations.map((st) => {
                const isSelected = selectedStation?.id === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => {
                      onSelectStation(st);
                      if (map) {
                        map.panTo({ lat: st.latitude, lng: st.longitude });
                      }
                    }}
                    className={`p-3.5 rounded-lg border transition-all duration-200 cursor-pointer flex flex-col gap-2 font-sans ${
                      isSelected
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : 'bg-panel-bg border-border-primary hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="truncate">
                        <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border uppercase mr-2 ${getBrandBadgeColor(st.brand)}`}>
                          {st.brand}
                        </span>
                        <span className="font-bold text-xs text-text-primary">{st.name}</span>
                        <p className="text-[10px] text-zinc-500 mt-1 truncate">{st.address}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs text-emerald-500 font-bold block">{st.distance} km</span>
                        <span className="text-[9px] text-zinc-500">{language === 'id' ? 'Jarak' : 'Distance'}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-zinc-400 border-t border-border-primary/40 pt-2">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-amber-500" /> {st.queueCount} {language === 'id' ? 'Antrian' : 'In queue'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-500" /> ~{st.estWaitMinutes} Min
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. VEHICLE REGISTRATION COMPONENT
// ==========================================
interface VehicleRegistrationPageProps {
  onRegister: (vehicleData: {
    plateNumber: string;
    vehicleType: 'car' | 'motorcycle';
    brand: string;
    model: string;
    fuelTypePreference: string;
    tankCapacity: number;
  }) => Promise<void>;
}

export function VehicleRegistrationPage({ onRegister }: VehicleRegistrationPageProps) {
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle'>('car');
  const [brand, setBrand] = useState('Tesla');
  const [model, setModel] = useState('');
  const [fuelPref, setFuelPref] = useState('Pertamax Turbo');
  const [tankCapacity, setTankCapacity] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t, language } = useTranslation();
  
  // Interactive scanning effects state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [simulatedScannedPlate, setSimulatedScannedPlate] = useState('');

  // Auto-scan simulator loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (isScanning) {
      setScanProgress(0);
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsScanning(false);
            // Autofill mock plate
            const mockPlate = `B ${Math.floor(1000 + Math.random() * 8999)} S${characters[Math.floor(Math.random() * 35)]}${characters[Math.floor(Math.random() * 35)]}`;
            setPlateNumber(mockPlate);
            setBrand('Tesla');
            setModel('Model Y');
            return 100;
          }
          // Randomize plate character rolling visualizer
          const tempPlate = `B ${Math.floor(1000 + Math.random() * 8999)} ` + 
                             characters[Math.floor(Math.random() * 35)] + 
                             characters[Math.floor(Math.random() * 35)];
          setSimulatedScannedPlate(tempPlate);
          return prev + 6;
        });
      }, 70);
    }
    return () => clearInterval(timer);
  }, [isScanning]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onRegister({
        plateNumber: plateNumber.toUpperCase(),
        vehicleType,
        brand: brand || 'Generic',
        model: model || 'Standard',
        fuelTypePreference: fuelPref,
        tankCapacity: tankCapacity || 40,
      });
    } catch (err: any) {
      setError(err.message || t('vehicles.errorMsg'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startPlateScanSimulation = () => {
    setIsScanning(true);
  };

  return (
    <div className="flex-grow space-y-6 text-text-primary text-left" id="vehicle-registration-module">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
        
        {/* Left Column: Interactive Plate Scanner Frame (Col 1 to 5) */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <GlassCard
            title={language === 'id' ? 'Pemindai Plat Nomor' : 'License Plate Scanner'}
            subtitle={language === 'id' ? 'Identifikasi kendaraan otomatis' : 'Automated vehicle identification'}
            className="overflow-hidden min-h-[300px] flex flex-col justify-between"
          >
            {/* Camera View */}
            <div className="flex-1 flex flex-col items-center justify-center relative py-8">
              
              {/* Scan box area */}
              <div className="absolute w-48 h-28 border-2 border-emerald-500/30 rounded-lg flex items-center justify-center">
                {/* Horizontal scanning light inside target */}
                {isScanning && (
                  <motion.div
                    className="absolute h-0.5 bg-emerald-500/60 left-0 right-0"
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  />
                )}
                
                <div className="font-sans text-[11px] text-text-secondary absolute -bottom-7 font-medium">
                  {isScanning ? (language === 'id' ? 'Memproses citra...' : 'Processing image...') : (language === 'id' ? 'Sejajarkan plat nomor' : 'Align license plate')}
                </div>
              </div>

              {/* Dynamic Scanning metrics rendering */}
              {isScanning ? (
                <div className="text-center space-y-2 z-10 bg-panel-bg backdrop-blur-md p-4 rounded-xl border border-border-primary shadow-sm">
                  <span className="font-sans text-xs text-emerald-600 flex items-center gap-2 justify-center font-medium">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    {language === 'id' ? `Memindai: ${scanProgress}%` : `Scanning: ${scanProgress}%`}
                  </span>
                  <div className="font-display font-semibold text-xl text-text-primary">
                    {simulatedScannedPlate}
                  </div>
                  <div className="font-sans text-[10px] text-text-secondary">
                    {language === 'id' ? 'Mencocokkan database kendaraan...' : 'Matching vehicle database...'}
                  </div>
                </div>
              ) : plateNumber ? (
                <div className="text-center space-y-2 z-10 bg-panel-bg backdrop-blur-md p-5 rounded-xl border border-emerald-500/25 shadow-sm">
                  <span className="font-sans text-[11px] text-emerald-600 font-semibold">{language === 'id' ? 'Kecocokan Ditemukan' : 'Match Found'}</span>
                  <div className="font-display font-semibold text-2xl text-text-primary py-2 px-6 bg-overlay rounded-lg select-all">
                    {plateNumber}
                  </div>
                  <p className="font-sans text-[10px] text-text-secondary">
                    {language === 'id' ? 'Klik tombol pindai untuk mengulang' : 'Click scan button to retry'}
                  </p>
                </div>
              ) : (
                <div className="text-center p-4">
                  <Camera className="w-10 h-10 text-text-secondary mx-auto mb-3 opacity-60" />
                  <p className="text-xs text-text-secondary font-sans">
                    {language === 'id' ? 'Menunggu umpan kamera' : 'Awaiting camera feed'}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={startPlateScanSimulation}
              disabled={isScanning}
              type="button"
              className="w-full bg-text-primary text-bg-primary hover:bg-text-secondary transition-all py-3 rounded-lg text-sm font-sans font-medium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              id="btn-scan-plate"
            >
              <Camera className="w-4 h-4" />
              {isScanning ? (language === 'id' ? 'Memindai...' : 'Scanning...') : (language === 'id' ? 'Pindai dengan Kamera' : 'Scan with Camera')}
            </button>
          </GlassCard>
        </div>

        {/* Right Column: Registration Input Form (Col 6 to 12) */}
        <div className="md:col-span-7">
          <GlassCard title={t('vehicles.addVehicle')} subtitle={language === 'id' ? 'Informasi registrasi' : 'Registration information'}>
            {error && (
              <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg text-sm font-sans">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              
              {/* Vehicle Type Radio Group */}
              <div className="space-y-2">
                <label className="block text-[11px] font-sans font-semibold tracking-wider text-text-secondary uppercase">
                  {language === 'id' ? 'Jenis Kendaraan' : 'Vehicle Type'}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setVehicleType('car')}
                    id="btn-reg-type-car"
                    className={`py-3.5 rounded-lg border text-sm font-sans font-medium transition-all cursor-pointer ${
                      vehicleType === 'car'
                        ? 'border-emerald-500 bg-emerald-500/5 text-text-primary'
                        : 'border-border-primary text-text-secondary hover:border-emerald-500/30'
                    }`}
                  >
                    {language === 'id' ? 'Mobil / EV' : 'Car / EV'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVehicleType('motorcycle')}
                    id="btn-reg-type-moto"
                    className={`py-3.5 rounded-lg border text-sm font-sans font-medium transition-all cursor-pointer ${
                      vehicleType === 'motorcycle'
                        ? 'border-emerald-500 bg-emerald-500/5 text-text-primary'
                        : 'border-border-primary text-text-secondary hover:border-emerald-500/30'
                    }`}
                  >
                    {language === 'id' ? 'Sepeda Motor' : 'Motorcycle'}
                  </button>
                </div>
              </div>

              {/* License Plate number Manual */}
              <div className="space-y-2">
                <label className="block text-[11px] font-sans font-semibold tracking-wider text-text-secondary uppercase">
                  {t('vehicles.plateNumber')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. B 1234 SZY"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-overlay backdrop-blur-md border border-border-primary rounded-lg py-3 px-4 text-base font-sans font-medium text-text-primary placeholder-zinc-500 uppercase focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Brand and Model Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[11px] font-sans font-semibold tracking-wider text-text-secondary uppercase">
                    {t('vehicles.brand')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tesla"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-overlay backdrop-blur-md border border-border-primary rounded-lg py-3 px-4 text-sm font-sans text-text-primary focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[11px] font-sans font-semibold tracking-wider text-text-secondary uppercase">
                    {t('vehicles.model')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Model Y"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-overlay backdrop-blur-md border border-border-primary rounded-lg py-3 px-4 text-sm font-sans text-text-primary focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Fuel spec and tank limit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[11px] font-sans font-semibold tracking-wider text-text-secondary uppercase">
                    {language === 'id' ? 'Preferensi BBM' : 'Recommended Fuel'}
                  </label>
                  <select
                    value={fuelPref}
                    onChange={(e) => setFuelPref(e.target.value)}
                    className="w-full bg-overlay backdrop-blur-md border border-border-primary rounded-lg py-3 px-4 text-sm font-sans text-text-primary focus:border-emerald-500 focus:outline-none transition-colors"
                  >
                    <option value="Pertamax Turbo">Pertamax Turbo (RON 98)</option>
                    <option value="Pertamax">Pertamax (RON 92)</option>
                    <option value="Pertalite">Pertalite (RON 90)</option>
                    <option value="Solar">Solar Diesel (CN 48)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-sans font-semibold tracking-wider text-text-secondary uppercase">
                    {t('vehicles.tankCapacity')}
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="150"
                    value={tankCapacity}
                    onChange={(e) => setTankCapacity(Number(e.target.value))}
                    className="w-full bg-overlay backdrop-blur-md border border-border-primary rounded-lg py-3 px-4 text-sm font-sans text-text-primary focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isScanning}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-black dark:border-zinc-800 font-sans font-bold py-3.5 rounded-lg text-sm hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#000] active:translate-y-0 active:shadow-none shadow-[2px_2px_0px_#000] transition-all mt-6 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {language === 'id' ? 'Mendaftarkan...' : 'Registering...'}
                  </>
                ) : (
                  t('vehicles.registerButton')
                )}
              </button>
            </form>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// 13. TRANSACTION HISTORY COMPONENT
// ==========================================
interface TransactionHistoryPageProps {
  transactions: Transaction[];
  onViewReceipt: (tx: Transaction) => void;
  isLoadingHistory?: boolean;
}

export function TransactionHistoryPage({
  transactions,
  onViewReceipt,
  isLoadingHistory = false,
}: TransactionHistoryPageProps) {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'ALL' | 'Pertamax Turbo' | 'Pertalite' | 'Solar'>('ALL');
  const { t, language } = useTranslation();

  // Dynamic SVG spending horizontal charts calculation
  const spendByFuel = transactions.reduce((acc, tx) => {
    acc[tx.fuelTypeName] = (acc[tx.fuelTypeName] || 0) + tx.totalPrice;
    return acc;
  }, {} as { [fuel: string]: number });

  const totalExpense = transactions.reduce((sum, tx) => sum + tx.totalPrice, 0);

  // Derive average RON
  const getRonFromName = (name: string) => {
    if (name.includes('Turbo')) return 98;
    if (name.includes('Pertamax')) return 92;
    if (name.includes('Pertalite')) return 90;
    if (name.includes('Solar')) return 48;
    return 90;
  };
  
  const avgDetect = transactions.length > 0 
    ? (transactions.reduce((sum, tx) => sum + getRonFromName(tx.fuelTypeName), 0) / transactions.length).toFixed(1)
    : '0.0';

  const filteredTx = transactions.filter((tx) => {
    if (activeCategoryFilter === 'ALL') return true;
    return tx.fuelTypeName === activeCategoryFilter;
  });

  return (
    <div className="flex-grow space-y-6 text-text-primary text-left" id="transaction-history-module">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
        
        {/* Metric and summary cards */}
        <div className="md:col-span-5 flex flex-col gap-4 text-left">
          <GlassCard title={t('dashboard.analytics')} subtitle={language === 'id' ? 'Ringkasan konsumsi dan pengeluaran' : 'Consumption and spending summary'}>
            <div className="space-y-6 text-left">
              <span className="font-sans text-[11px] text-text-secondary uppercase tracking-wider font-semibold block text-left">
                {language === 'id' ? 'Pengeluaran per Jenis BBM' : 'Spending by Fuel Type'}
              </span>

              {/* Progress bars */}
              <div className="space-y-4">
                {Object.entries(spendByFuel).map(([fuel, value]) => {
                  const maxVal = 1000000;
                  const ratio = (value / maxVal) * 100;
                  return (
                    <div key={fuel} className="space-y-2">
                      <div className="flex justify-between font-sans text-xs">
                        <span className="text-text-secondary">{fuel}</span>
                        <span className="text-text-primary font-medium">
                          Rp {value.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-border-primary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(ratio, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Monthly stats panel */}
              <div className="pt-6 border-t border-border-primary grid grid-cols-2 gap-4 font-sans text-xs text-left">
                <div className="bg-overlay p-3 rounded-xl border border-border-primary text-left">
                  <span className="text-text-secondary block uppercase text-[10px] font-semibold tracking-wider">{language === 'id' ? 'Total Pengeluaran' : 'Total Expense'}</span>
                  <span className="text-text-primary font-semibold block mt-1.5 text-base">Rp {totalExpense.toLocaleString()}</span>
                </div>
                <div className="bg-overlay p-3 rounded-xl border border-border-primary text-left">
                  <span className="text-text-secondary block uppercase text-[10px] font-semibold tracking-wider">{language === 'id' ? 'Rata-rata Oktan' : 'Avg. Octane'}</span>
                  <span className="text-emerald-600 font-semibold block mt-1.5 text-base">RON {avgDetect}</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Transaction History log items */}
        <div className="md:col-span-7 text-left">
          <GlassCard
            title={t('dashboard.history')}
            subtitle={`${filteredTx.length} records found`}
            headerAction={
              <div className="flex gap-1.5 bg-overlay p-1 rounded-lg border border-border-primary">
                {(['ALL', 'Pertamax Turbo', 'Pertalite'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-sans font-medium transition-all cursor-pointer ${
                      activeCategoryFilter === cat
                        ? 'bg-panel-bg text-text-primary shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {cat === 'ALL' ? (language === 'id' ? 'Semua' : 'All') : cat}
                  </button>
                ))}
              </div>
            }
          >
            {isLoadingHistory ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border border-border-primary rounded-xl bg-panel-bg flex items-center gap-4 animate-pulse">
                    <div className="w-10 h-10 rounded-lg bg-border-primary shrink-0" />
                    <div className="space-y-2 w-full text-left">
                      <div className="h-3 bg-border-primary rounded w-1/2" />
                      <div className="h-2 bg-border-primary rounded w-1/3" />
                    </div>
                    <div className="h-4 bg-border-primary rounded w-20 shrink-0" />
                  </div>
                ))}
              </div>
            ) : filteredTx.length === 0 ? (
              <div className="text-center py-16 text-text-secondary font-sans text-sm">
                {t('dashboard.noHistory')}
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar text-left">
                {filteredTx.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => onViewReceipt(tx)}
                    className="p-4 border border-border-primary rounded-xl bg-panel-bg flex items-center justify-between gap-4 hover:border-emerald-500/20 transition-all cursor-pointer shadow-sm hover:shadow text-left"
                  >
                    <div className="flex items-start gap-3.5 truncate text-left">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 font-sans font-medium text-sm shrink-0 select-none">
                        {tx.fuelTypeName.includes('Turbo') ? 'R98' : tx.fuelTypeName.includes('Pertamax') ? 'R92' : 'R90'}
                      </div>
                      <div className="truncate space-y-0.5 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-sans font-medium text-sm text-text-primary truncate text-left">
                            {tx.stationName.replace('SFRT - ', '')}
                          </h4>
                          <span className="font-sans text-[10px] font-medium bg-border-primary/40 px-1.5 py-0.5 rounded text-text-secondary">
                            {tx.plateNumber}
                          </span>
                        </div>
                        <p className="font-sans text-xs text-text-secondary truncate text-left">
                          {tx.date} • {tx.time} • {tx.liters} L
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col justify-center items-end font-sans">
                      <span className="text-sm text-text-primary block font-semibold">
                        Rp {tx.totalPrice.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-emerald-600 hover:text-emerald-700 mt-1 transition-all flex items-center gap-1">
                        {language === 'id' ? 'Lihat struk' : 'View receipt'} <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
