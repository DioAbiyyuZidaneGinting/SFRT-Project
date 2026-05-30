/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Flame, Check, ShieldCheck, ArrowRight, Gauge, HelpCircle, Navigation as NavIcon, QrCode, CreditCard, Wallet, Landmark } from 'lucide-react';
import GlassCard from '../GlassCard';
import { FuelType, Vehicle, Station } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

// Helper to calculate distance
const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return parseFloat(d.toFixed(2));
};

// Generate mock stations near a given latitude/longitude
const generateMockStations = (lat: number, lng: number): any[] => {
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

// ==========================================
// 6. FUEL PURCHASE PAGE COMPONENT
// ==========================================
interface FuelPurchasePageProps {
  fuels: FuelType[];
  isLoadingFuels?: boolean;
  vehicles?: Vehicle[];
  selectedVehicle: Vehicle | null;
  onSelectVehicle?: (vehicle: Vehicle | null) => void;
  selectedStation: Station | null;
  onSelectStation?: (station: Station | null) => void;
  onConfirmPurchase: (purchaseData: {
    fuel: FuelType;
    liters: number;
    totalPrice: number;
    paymentMethod: string;
    compatibilityScore: number;
  }) => void;
  onNavigateToVehicleReg: () => void;
}

export function FuelPurchasePage({
  fuels,
  isLoadingFuels = false,
  vehicles = [],
  selectedVehicle,
  onSelectVehicle,
  selectedStation,
  onSelectStation,
  onConfirmPurchase,
  onNavigateToVehicleReg,
}: FuelPurchasePageProps) {
  const [selectedFuel, setSelectedFuel] = useState<FuelType | null>(null);
  const [liters, setLiters] = useState<number>(30);
  const [paymentMethod, setPaymentMethod] = useState<string>('QRIS');
  const { t, language } = useTranslation();

  // Map and station states
  const [localStations, setLocalStations] = useState<any[]>([]);
  const [gpsStatus, setGpsStatus] = useState<'prompt' | 'granted' | 'denied' | 'error'>('prompt');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({ lat: -6.2088, lng: 106.8456 }); // Default Jakarta
  const [mapReady, setMapReady] = useState(false);
  const [miniMap, setMiniMap] = useState<any>(null);
  const miniMapRef = useRef<HTMLDivElement>(null);
  const miniMarkerRef = useRef<any>(null);
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

  // Fetch Nearby SPBU using Google Places API (New)
  const fetchNearbyGasStations = async (coords: { lat: number; lng: number }) => {
    if (!(window as any).google) return;

    try {
      const { Place } = await (window as any).google.maps.importLibrary("places");
      
      const request = {
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'types'],
        locationRestriction: {
          center: { lat: coords.lat, lng: coords.lng },
          radius: 10000 // 10km (radius in meters: 10000)
        },
        includedTypes: ['gas_station'],
        maxResultCount: 10
      };

      const { places } = await Place.searchNearby(request);

      if (places && places.length > 0) {
        const resolvedPlaces = await Promise.all(places.map(async (place: any) => {
          const name = place.displayName || "";
          let brand = 'Lainnya';
          if (/pertamina/i.test(name)) brand = 'Pertamina';
          else if (/shell/i.test(name)) brand = 'Shell';
          else if (/bp/i.test(name)) brand = 'BP';
          else if (/vivo/i.test(name)) brand = 'Vivo';

          const placeLat = place.location?.lat ? place.location.lat() : coords.lat;
          const placeLng = place.location?.lng ? place.location.lng() : coords.lng;

          const dist = getHaversineDistance(
            coords.lat,
            coords.lng,
            placeLat,
            placeLng
          );

          const queueCount = Math.floor(Math.random() * 6) + 2;
          const estWaitMinutes = queueCount * 2;

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

        resolvedPlaces.sort((a, b) => a.distance - b.distance);
        setLocalStations(resolvedPlaces);

        // If no station is selected yet, auto-select the closest one!
        if (!selectedStation && resolvedPlaces.length > 0 && onSelectStation) {
          onSelectStation(resolvedPlaces[0]);
        }
      } else {
        const fallbackList = generateMockStations(coords.lat, coords.lng);
        setLocalStations(fallbackList);
        if (!selectedStation && fallbackList.length > 0 && onSelectStation) {
          onSelectStation(fallbackList[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching nearby gas stations on purchase page:", error);
      const fallbackList = generateMockStations(coords.lat, coords.lng);
      setLocalStations(fallbackList);
      if (!selectedStation && fallbackList.length > 0 && onSelectStation) {
        onSelectStation(fallbackList[0]);
      }
    }
  };

  // Get Geolocation coords
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      const fallbackList = generateMockStations(userLocation.lat, userLocation.lng);
      setLocalStations(fallbackList);
      if (!selectedStation && fallbackList.length > 0 && onSelectStation) {
        onSelectStation(fallbackList[0]);
      }
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
        if (mapReady) {
          fetchNearbyGasStations(coords);
        }
      },
      (err) => {
        console.warn("GPS Permission Denied. Falling back to default Jakarta center.", err);
        setGpsStatus('denied');
        const defaultCoords = { lat: -6.2088, lng: 106.8456 };
        setUserLocation(defaultCoords);
        if (mapReady) {
          fetchNearbyGasStations(defaultCoords);
        } else {
          const fallbackList = generateMockStations(defaultCoords.lat, defaultCoords.lng);
          setLocalStations(fallbackList);
          if (!selectedStation && fallbackList.length > 0 && onSelectStation) {
            onSelectStation(fallbackList[0]);
          }
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [mapReady]);

  // Initialize Mini Map
  useEffect(() => {
    if (!mapReady || !miniMapRef.current || miniMap || !(window as any).google) return;

    const darkMapStyles = [
      { elementType: "geometry", stylers: [{ color: "#141419" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#141419" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#8796a5" }] },
      { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#10b981" }] },
      { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#10b981" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#22252c" }] },
      { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1c1e24" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] }
    ];

    const centerPos = selectedStation 
      ? { lat: selectedStation.latitude, lng: selectedStation.longitude }
      : userLocation;

    const mapInstance = new (window as any).google.maps.Map(miniMapRef.current, {
      center: centerPos,
      zoom: 14,
      styles: darkMapStyles,
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    setMiniMap(mapInstance);
  }, [mapReady, miniMapRef.current]);

  // Update Mini Map markers and center on change
  useEffect(() => {
    if (!miniMap || !(window as any).google) return;

    // Clear existing markers
    if (miniMarkerRef.current) {
      miniMarkerRef.current.setMap(null);
      miniMarkerRef.current = null;
    }
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }

    // Add user marker
    userMarkerRef.current = new (window as any).google.maps.Marker({
      position: userLocation,
      map: miniMap,
      title: "Lokasi Anda",
      icon: {
        path: (window as any).google.maps.SymbolPath.CIRCLE,
        scale: 6,
        fillColor: "#10b981",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 1.5
      }
    });

    if (selectedStation) {
      const stationPos = { lat: selectedStation.latitude, lng: selectedStation.longitude };
      
      let pinColor = "#6b7280";
      const brand = (selectedStation as any).brand || 'Lainnya';
      if (brand === "Pertamina") pinColor = "#ef4444";
      else if (brand === "Shell") pinColor = "#eab308";
      else if (brand === "BP") pinColor = "#22c55e";
      else if (brand === "Vivo") pinColor = "#3b82f6";

      miniMarkerRef.current = new (window as any).google.maps.Marker({
        position: stationPos,
        map: miniMap,
        title: selectedStation.name,
        icon: {
          path: (window as any).google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 4,
          fillColor: pinColor,
          fillOpacity: 0.95,
          strokeColor: "#000000",
          strokeWeight: 1
        }
      });

      miniMap.panTo(stationPos);
      miniMap.setZoom(14);
    } else {
      miniMap.panTo(userLocation);
      miniMap.setZoom(13);
    }
  }, [miniMap, selectedStation, userLocation]);

  // Helper to determine if vehicle is EV
  const isEV = (v: Vehicle | null) => {
    if (!v) return false;
    const brandLower = v.brand.toLowerCase();
    const fuelLower = v.fuelTypePreference.toLowerCase();
    return brandLower.includes('tesla') || brandLower.includes('byd') || brandLower.includes('ioniq') || brandLower.includes('ev') || fuelLower.includes('electricity') || fuelLower.includes('battery');
  };

  const vehicleIsEV = isEV(selectedVehicle);
  const evKwhPrice = 2465;

  // Auto-select recommended fuel when vehicle changes
  useEffect(() => {
    if (selectedVehicle && !isEV(selectedVehicle)) {
      const recommended = fuels.find(
        (f) => f.name.toLowerCase().trim() === selectedVehicle.fuelTypePreference.toLowerCase().trim()
      );
      if (recommended) {
        setSelectedFuel(recommended);
      } else if (fuels.length > 0) {
        setSelectedFuel(fuels[2] || fuels[0]);
      }
    } else {
      setSelectedFuel(null);
    }
  }, [selectedVehicle, fuels]);

  // Adjust volume if it exceeds tank capacity
  useEffect(() => {
    const maxVal = selectedVehicle ? selectedVehicle.tankCapacity : 100;
    if (liters > maxVal) {
      setLiters(maxVal);
    }
  }, [selectedVehicle, liters]);

  const efficiencyMultiplier = vehicleIsEV 
    ? 6.8 // km per kWh
    : (selectedFuel?.name === 'Pertamax Turbo' ? 1.15 : selectedFuel?.name === 'Pertamax' ? 1.05 : 0.95);
    
  const estimatedDistance = Math.floor(
    vehicleIsEV 
      ? liters * efficiencyMultiplier 
      : liters * 12.5 * efficiencyMultiplier
  );

  const totalPrice = vehicleIsEV 
    ? liters * evKwhPrice 
    : (selectedFuel ? liters * selectedFuel.pricePerLiter : 0);

  const isOptimalRON = !vehicleIsEV && selectedFuel && selectedVehicle?.fuelTypePreference === selectedFuel.name;
  const compatibilityScore = vehicleIsEV 
    ? 100 
    : (isOptimalRON ? 100 : selectedFuel?.name === 'Pertamax Turbo' && selectedVehicle?.fuelTypePreference === 'Pertamax' ? 95 : 65);

  const maxVolume = selectedVehicle ? selectedVehicle.tankCapacity : 100;
  const presets = vehicleIsEV ? [20, 40, 60] : [15, 30, 45];
  const unitLabel = vehicleIsEV ? t('refuel.chargeQuantity') : t('refuel.quantity');
  const unitSymbol = vehicleIsEV ? 'kWh' : 'L';

  const handleLitersQuickSelect = (value: number) => {
    if (value > maxVolume) {
      setLiters(maxVolume);
    } else {
      setLiters(value);
    }
  };

  const handleFullTankTrigger = () => {
    if (selectedVehicle) {
      const fillAmount = Math.max(5, Math.ceil(selectedVehicle.tankCapacity * (100 - (selectedVehicle as any).currentFuelLevel || 0) / 100));
      setLiters(fillAmount > maxVolume ? maxVolume : fillAmount);
    } else {
      setLiters(60);
    }
  };

  const submitPurchase = () => {
    if (!selectedStation) return;
    if (vehicleIsEV) {
      onConfirmPurchase({
        fuel: {
          id: fuels[0]?.id || '00000000-0000-0000-0000-000000000000',
          name: 'EV Fast Charge',
          rating: 100,
          pricePerLiter: evKwhPrice,
          stockLevel: 100,
          description: 'DC Ultra Fast Charging Port',
          recommendedFor: ['EV']
        },
        liters,
        totalPrice,
        paymentMethod,
        compatibilityScore: 100,
      });
    } else {
      if (!selectedFuel) return;
      onConfirmPurchase({
        fuel: selectedFuel,
        liters,
        totalPrice,
        paymentMethod,
        compatibilityScore,
      });
    }
  };

  return (
    <div className="flex-grow space-y-8 text-text-primary animate-fade-in font-sans" id="fuel-purchase-module text-left">
      
      {/* Dynamic Vehicle Selection Carousel */}
      {vehicles && vehicles.length > 0 && (
        <div className="space-y-4 bg-panel-bg border border-border-primary/80 p-5 rounded-3xl backdrop-blur-md text-left shadow-xs">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block leading-none">
            {t('refuel.selectVehicle')}
          </span>
          <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
            {vehicles.map((v) => {
              const isSelected = selectedVehicle?.id === v.id;
              const vehicleIsEV = isEV(v);

              return (
                <div
                  key={v.id}
                  onClick={() => onSelectVehicle && onSelectVehicle(v)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer min-w-[250px] shrink-0 select-none ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/5 shadow-xs'
                      : 'border-border-primary hover:border-emerald-500/30 bg-panel-bg'
                  }`}
                >
                  <div className="w-14 h-10 bg-overlay border border-border-primary/60 rounded-xl flex items-center justify-center shrink-0 p-1.5">
                    <img src="/ev_sports_car.png" alt="EV Sports Car" className="w-full h-full object-contain" />
                  </div>
                  <div className="text-left truncate space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-bold text-xs text-text-primary">
                        {v.plateNumber}
                      </span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-[10px] text-text-secondary font-semibold truncate leading-none">
                      {v.brand} {v.model}
                    </p>
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase block w-fit leading-none ${
                      vehicleIsEV ? 'text-sky-500 bg-sky-500/10' : 'text-emerald-600 bg-emerald-500/10'
                    }`}>
                      {vehicleIsEV ? 'Electric' : v.fuelTypePreference}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warning if no vehicle registered */}
      {!selectedVehicle && (
        <div className="p-5 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-amber-600 dark:text-amber-400 shadow-xs text-left">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shrink-0" />
            <span className="font-semibold">
              {language === 'id' 
                ? 'Belum ada profil kendaraan yang didaftarkan untuk pengisian otomatis.' 
                : 'No vehicle profile registered for automatic pump assignment.'}
            </span>
          </div>
          <button
            onClick={onNavigateToVehicleReg}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
          >
            {t('vehicles.addVehicle')}
          </button>
        </div>
      )}

      {/* Main Grid with Responsive Ordering */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left items-start">
        
        {/* Item 1: Specification (Vehicle selection is outside, warning is outside. Fuel selection, volume selector, AI advisory) */}
        <div className="md:col-span-7 md:row-start-1 md:col-start-1 space-y-8">
          
          {/* Fuel Options Interactive Radio Blocks or EV Mode */}
          {vehicleIsEV ? (
            <GlassCard title={t('refuel.evTitle')} subtitle={t('refuel.evSubtitle')}>
              <div className="p-5 border border-emerald-500/20 bg-emerald-500/[0.02] rounded-2xl space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-sky-500/10 rounded-2xl border border-sky-500/20 flex items-center justify-center shrink-0 text-sky-500">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-sm text-text-primary">
                      {language === 'id' ? 'Autopilot Pengisi LIDAR Aktif' : 'LIDAR Charger Autopilot Active'}
                    </h4>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                      {language === 'id' 
                        ? `Kamera LIDAR telah mendeteksi port pengisian daya ${selectedVehicle?.brand} Anda. Dispenser akan terhubung secara otomatis.`
                        : `LIDAR cameras have located your ${selectedVehicle?.brand} charging port. Dispenser will lock onto the chassis automatically.`}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 font-sans text-xs">
                  <div className="bg-overlay p-3 rounded-xl border border-border-primary text-left">
                    <span className="text-text-secondary block text-[9px] uppercase tracking-wider font-semibold">{t('refuel.chargeRate')}</span>
                    <span className="text-text-primary font-bold block mt-1">150 kW DC</span>
                  </div>
                  <div className="bg-overlay p-3 rounded-xl border border-border-primary text-left">
                    <span className="text-text-secondary block text-[9px] uppercase tracking-wider font-semibold">Price per kWh</span>
                    <span className="text-emerald-600 font-bold block mt-1">Rp {evKwhPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard title={language === 'id' ? 'Pilih Jenis Bahan Bakar' : 'Select Fuel Type'} subtitle={language === 'id' ? 'Pilihan formulasi bensin dan diesel yang tersedia' : 'Available fuel formulations and specifications'}>
              {isLoadingFuels ? (
                <div className="flex justify-center p-8 text-emerald-600 animate-pulse">
                  <span className="text-sm">{t('common.loading')}</span>
                </div>
              ) : fuels.length === 0 ? (
                <div className="flex justify-center p-8 text-amber-500">
                  <span className="text-sm">No fuels allocated for this station.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fuels.map((fuel) => {
                    const isSelected = selectedFuel?.id === fuel.id;
                    const isCriticalStock = fuel.stockLevel < 50;

                    return (
                      <div
                        key={fuel.id}
                        onClick={() => setSelectedFuel(fuel)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3.5 text-left ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/5 shadow-xs'
                            : 'border-border-primary hover:border-emerald-500/20'
                        }`}
                        id={`fuel-select-item-${fuel.id}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-sans font-semibold text-sm text-text-primary">
                                {fuel.name}
                              </h4>
                              <span className="text-[10px] bg-border-primary/50 text-text-secondary px-1.5 py-0.5 rounded font-medium">
                                RON {fuel.rating}
                              </span>
                            </div>
                            <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                              {fuel.description}
                            </p>
                          </div>

                          {isSelected && (
                            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center bg-overlay p-2 rounded-lg text-xs border border-border-primary">
                          <span className="text-text-secondary">Price per liter</span>
                          <span className="text-emerald-600 font-semibold">
                            Rp {(fuel.pricePerLiter || 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between text-[11px] text-text-secondary">
                          <span>Stock Level</span>
                          <span className={isCriticalStock ? 'text-amber-500 font-semibold' : 'text-text-secondary font-medium'}>
                            {fuel.stockLevel}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          )}

          {/* Volume / Power Control widget */}
          <GlassCard title={language === 'id' ? `Tentukan ${unitLabel}` : `Specify ${unitLabel}`} subtitle={language === 'id' ? `Masukkan volume pengisian dalam satuan ${unitSymbol.toLowerCase()}` : `Enter refueling volume in ${unitSymbol.toLowerCase()}`}>
            <div className="space-y-6">
              
              {/* slider container */}
              <div className="bg-overlay p-5 rounded-xl space-y-4 border border-border-primary shadow-inner">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary font-semibold">{language === 'id' ? 'Volume Pengisian' : 'Refuel Volume'}</span>
                  <span className="text-text-primary">
                    <span className="text-2xl font-bold text-emerald-600 inline-block">{liters}</span>{' '}
                    {unitSymbol}
                  </span>
                </div>

                <input
                  type="range"
                  min="5"
                  max={maxVolume}
                  step="1"
                  value={liters}
                  onChange={(e) => setLiters(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-border-primary rounded-full cursor-pointer outline-none"
                  id="liters-slider"
                />

                <div className="flex justify-between text-xs text-text-secondary">
                  <span>Min: 5 {unitSymbol}</span>
                  <span>Max: {maxVolume} {unitSymbol}</span>
                </div>
              </div>

              {/* Quick Preset Buttons with Selective Brutalist Highlights */}
              <div className="grid grid-cols-4 gap-3">
                {presets.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleLitersQuickSelect(val)}
                    className="bg-panel-bg border border-border-primary rounded-xl py-3 text-text-secondary hover:border-emerald-500 hover:text-text-primary transition-all cursor-pointer shadow-xs hover:shadow font-semibold text-xs"
                  >
                    {val} {unitSymbol}
                  </button>
                ))}
                
                <button
                  type="button"
                  onClick={handleFullTankTrigger}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-black dark:border-zinc-800 font-sans font-bold rounded-xl py-3 text-xs hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[3px_3px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-none shadow-[2px_2px_0px_#000] transition-all cursor-pointer uppercase tracking-wider"
                  id="btn-quick-fulltank"
                >
                  {vehicleIsEV ? (language === 'id' ? 'Isi Penuh' : 'Full Charge') : (language === 'id' ? 'Tangki Penuh' : 'Full Tank')}
                </button>
              </div>

            </div>
          </GlassCard>

          {/* AI Fuel advisory box */}
          <GlassCard title={vehicleIsEV ? t('refuel.evRecommendation') : t('refuel.fuelRecommendation')} subtitle={t('refuel.fuelSubtitle')} glow={isOptimalRON || vehicleIsEV}>
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-2 text-emerald-600">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold text-xs uppercase tracking-wider leading-none">
                  {language === 'id' ? 'Saran Kompatibilitas Mesin' : 'Engine Compatibility Advisory'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-text-secondary leading-relaxed">
                <p>
                  {selectedVehicle ? (
                    <>
                      {language === 'id' ? 'Kendaraan terdeteksi: ' : 'Detected vehicle: '} <span className="text-text-primary font-semibold">{selectedVehicle.brand} {selectedVehicle.model}</span>.
                      {vehicleIsEV ? (
                        <span className="block mt-3 text-xs text-emerald-600 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20">
                          ✓ {language === 'id' ? 'Koneksi pengisian daya EV optimal terverifikasi. LIDAR sejajar dengan port.' : 'Optimal EV charging handshake verified. LIDAR aligned with charging port.'}
                        </span>
                      ) : isOptimalRON ? (
                        <span className="block mt-3 text-xs text-emerald-600 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20">
                          ✓ {language === 'id' ? 'Kecocokan Formulasi Optimal: Kompatibilitas 100%. Bahan bakar ini memenuhi syarat performa manufaktur.' : 'Optimal Formulation Match: 100% compatibility. This fuel satisfies your manufacturer\'s performance requirements.'}
                        </span>
                      ) : (
                        <span className="block mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/5 p-3 rounded-xl border border-amber-500/20">
                          ⚠ {language === 'id' ? `Deviasi Kompatibilitas: Tingkat kecocokan ${compatibilityScore}%. Deviasi dari anjuran dapat menurunkan efisiensi mesin.` : `Advisory Deviation: ${compatibilityScore}% compatibility. Deviation from manufacturer recommendations may reduce engine efficiency.`}
                        </span>
                      )}
                    </>
                  ) : (
                    language === 'id' ? 'Silakan daftarkan kendaraan Anda untuk mengaktifkan pemindaian kompatibilitas otomatis.' : 'Please register your vehicle to enable automatic fuel compatibility scanning.'
                  )}
                </p>
              </div>

              {/* Dynamic distance estimator indicators */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border-primary text-center text-xs">
                <div className="bg-overlay p-3 rounded-xl border border-border-primary text-left">
                  <span className="text-text-secondary block text-[10px] uppercase tracking-wider font-semibold">{language === 'id' ? 'Estimasi Jarak' : 'Est. Range'}</span>
                  <span className="text-text-primary font-bold text-sm block mt-1">~{estimatedDistance} km</span>
                </div>
                <div className="bg-overlay p-3 rounded-xl border border-border-primary text-left">
                  <span className="text-text-secondary block text-[10px] uppercase tracking-wider font-semibold">{language === 'id' ? 'Kompatibilitas' : 'Compatibility'}</span>
                  <span className="text-emerald-600 font-semibold text-sm block mt-1">{compatibilityScore}%</span>
                </div>
              </div>
            </div>
          </GlassCard>

        </div>

        {/* Item 2: Lokasi Pengisian & Telemetri Antrean (Full Width below Row 1) */}
        <div className="md:col-span-12 md:row-start-2 md:col-start-1">
          
          <GlassCard 
            title={language === 'id' ? 'Lokasi Pengisian & Telemetri Antrean' : 'Refueling Location & Queue Telemetry'}
            subtitle={language === 'id' ? 'Konfirmasi SPBU dan pantau dispenser secara real-time' : 'Confirm fuel station and monitor dispensers in real-time'}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left items-stretch">
              
              {/* Left Side: Large Map */}
              <div className="lg:col-span-7 flex flex-col h-[320px] lg:h-[400px]">
                <div ref={miniMapRef} className="w-full h-full rounded-2xl border-2 border-black dark:border-zinc-800 overflow-hidden relative shadow-[2px_2px_0px_#000]" />
              </div>

              {/* Right Side: Details & Selector list */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                
                {/* Fallback Banner if no station selected */}
                {!selectedStation ? (
                  <div className="bg-amber-500/10 border-2 border-amber-500/30 p-4 rounded-xl text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2.5 font-sans font-bold shadow-[2px_2px_0px_rgba(245,158,11,0.15)]">
                    <HelpCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <span className="block">{language === 'id' ? 'Belum Ada Stasiun Terpilih' : 'No Station Selected'}</span>
                      <span className="text-[10px] opacity-80 block font-normal mt-0.5">
                        {language === 'id' ? 'Silakan pilih salah satu SPBU terdekat di bawah ini untuk melanjutkan.' : 'Please select one of the nearby fuel stations below to proceed.'}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Selected Station Detail Spec Card */
                  <div className="bg-overlay p-4 rounded-xl border-2 border-black dark:border-zinc-800 shadow-[3px_3px_0px_#000] space-y-3 font-sans">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border ${
                          (selectedStation as any).brand === 'Pertamina' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          (selectedStation as any).brand === 'Shell' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                          (selectedStation as any).brand === 'BP' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                          (selectedStation as any).brand === 'Vivo' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          'bg-zinc-500/10 text-text-secondary border-zinc-500/20'
                        }`}>
                          {(selectedStation as any).brand || 'Stasiun'}
                        </span>
                        <h4 className="text-sm font-extrabold text-text-primary mt-1.5 leading-tight">{selectedStation.name}</h4>
                        <p className="text-[11px] text-text-secondary mt-1">{selectedStation.address}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-emerald-600 block">{selectedStation.distance} km</span>
                        <span className="text-[10px] text-text-secondary block mt-0.5">{language === 'id' ? 'dari Anda' : 'away'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-border-primary text-center">
                      <div className="bg-panel-bg p-2 rounded-lg border border-border-primary">
                        <span className="text-[9px] text-text-secondary block uppercase tracking-wider font-semibold">{language === 'id' ? 'Status' : 'Status'}</span>
                        <span className={`text-[10px] font-bold block mt-0.5 ${selectedStation.status === 'CLOSED' ? 'text-red-500' : 'text-emerald-500'}`}>
                          {selectedStation.status}
                        </span>
                      </div>
                      <div className="bg-panel-bg p-2 rounded-lg border border-border-primary">
                        <span className="text-[9px] text-text-secondary block uppercase tracking-wider font-semibold">{language === 'id' ? 'Antrean' : 'Queue'}</span>
                        <span className="text-[10px] font-bold text-text-primary block mt-0.5">{selectedStation.queueCount} Armada</span>
                      </div>
                      <div className="bg-panel-bg p-2 rounded-lg border border-border-primary">
                        <span className="text-[9px] text-text-secondary block uppercase tracking-wider font-semibold">{language === 'id' ? 'Estimasi' : 'Est. Wait'}</span>
                        <span className="text-[10px] font-bold text-text-primary block mt-0.5">~{selectedStation.estWaitMinutes} Min</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Station Selector */}
                <div className="space-y-2.5 pt-2 flex-grow flex flex-col min-h-0">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-text-secondary flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {language === 'id' ? 'SPBU Terdekat' : 'Nearby Stations'}
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin flex-grow">
                    {localStations.map((st) => {
                      const isSelected = selectedStation?.id === st.id;
                      let pinColor = "border-zinc-500/20";
                      if (st.brand === "Pertamina") pinColor = "border-red-500/20";
                      else if (st.brand === "Shell") pinColor = "border-amber-500/20";
                      else if (st.brand === "BP") pinColor = "border-emerald-500/20";
                      else if (st.brand === "Vivo") pinColor = "border-blue-500/20";

                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => onSelectStation?.(st)}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all flex justify-between items-center gap-3 cursor-pointer ${
                            isSelected 
                              ? 'border-emerald-500 bg-emerald-500/5 shadow-[3px_3px_0px_#000]' 
                              : `border-border-primary hover:border-emerald-500/30 bg-overlay shadow-[1px_1px_0px_#000]`
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-panel-bg border ${pinColor}`}>
                                {st.brand}
                              </span>
                              <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                                ★ {st.rating}
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-text-primary mt-1 truncate">{st.name}</h5>
                            <p className="text-[10px] text-text-secondary mt-0.5 truncate">{st.address}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-bold text-text-primary block">{st.distance} km</span>
                            <span className="text-[9px] text-text-secondary block mt-0.5">~{st.estWaitMinutes}m ({st.queueCount} Armada)</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          </GlassCard>

        </div>

        {/* Item 3: Checkout Summary (Right side of Row 1) */}
        <div className="md:col-span-5 md:row-start-1 md:col-start-8">
          
          <GlassCard title={t('refuel.preAuthSummary')} subtitle={language === 'id' ? 'Detail tagihan digital langsung' : 'Direct digital invoice details'}>
            <div className="space-y-5 text-left">
              <div className="space-y-2.5 text-xs text-text-secondary">
                <div className="flex justify-between py-2 border-b border-border-primary">
                  <span>{language === 'id' ? 'Stasiun Terpilih:' : 'Selected Station:'}</span>
                  <span className="text-text-primary font-semibold truncate max-w-[160px]">
                    {selectedStation ? selectedStation.name.replace('SFRT - ', '') : 'Belum Ada'}
                  </span>
                </div>
                {selectedStation && (
                  <>
                    <div className="flex justify-between py-2 border-b border-border-primary">
                      <span>{language === 'id' ? 'Alamat:' : 'Address:'}</span>
                      <span className="text-text-primary font-semibold truncate max-w-[180px]">{selectedStation.address}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border-primary">
                      <span>{language === 'id' ? 'Jarak:' : 'Distance:'}</span>
                      <span className="text-text-primary font-semibold">{selectedStation.distance} km</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border-primary">
                      <span>{language === 'id' ? 'Estimasi Antre:' : 'Est. Queue:'}</span>
                      <span className="text-text-primary font-semibold">~{selectedStation.estWaitMinutes} Min ({selectedStation.queueCount} Armada)</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between py-2 border-b border-border-primary">
                  <span>{language === 'id' ? 'Plat Kendaraan:' : 'Vehicle Plate:'}</span>
                  <span className="text-text-primary font-semibold">{selectedVehicle ? selectedVehicle.plateNumber : 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border-primary">
                  <span>Volume:</span>
                  <span className="text-text-primary font-semibold">{liters} {unitSymbol}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Price per {unitSymbol.toLowerCase()}:</span>
                  <span className="text-text-primary font-semibold">
                    Rp {(vehicleIsEV ? evKwhPrice : (selectedFuel?.pricePerLiter || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-overlay border border-border-primary rounded-xl flex justify-between items-center shadow-inner">
                <span className="font-semibold text-xs text-text-secondary">{language === 'id' ? 'Total Harga' : 'Total Price'}</span>
                <span className="font-sans font-bold text-xl text-emerald-600">
                  Rp {totalPrice.toLocaleString()}
                </span>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2.5 pt-2">
                <span className="text-[11px] text-text-secondary uppercase tracking-wider font-semibold block leading-none">{t('refuel.paymentMethod')}</span>
                <div className="grid grid-cols-2 gap-2">
                  {['QRIS', 'DANA', 'ShopeePay', 'Bank Transfer'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-3 px-4 text-center rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        paymentMethod === method 
                          ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600' 
                          : 'border-border-primary text-text-secondary hover:border-emerald-500/20'
                      }`}
                    >
                      {method === 'Bank Transfer' ? (language === 'id' ? 'Transfer' : method) : method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct payment launch with Gorgeous Selective Brutalist design */}
              <button
                onClick={submitPurchase}
                type="button"
                disabled={!selectedStation}
                className={`w-full text-white border-2 border-black dark:border-zinc-800 transition-all py-3.5 rounded-xl text-xs font-sans font-bold flex items-center justify-center gap-2 cursor-pointer mt-4 uppercase tracking-wider ${
                  selectedStation 
                    ? 'bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[3px_3px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-none shadow-[2px_2px_0px_#000]'
                    : 'bg-zinc-500 cursor-not-allowed opacity-50 shadow-none'
                }`}
                id="btn-confirm-and-pay"
              >
                {vehicleIsEV ? t('refuel.evInitiateTransaction') : t('refuel.initiateTransaction')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>

        </div>

      </div>
    </div>
  );
}

// ==========================================
// 7. PAYMENT PAGE COMPONENT WITH QRIS TIMER
// ==========================================
interface PaymentPageProps {
  totalPrice: number;
  paymentMethod: string;
  onPaymentSuccess: (methodUsed: string) => Promise<void> | void;
  onCancelPayment: () => void;
}

export function PaymentPage({
  totalPrice,
  paymentMethod,
  onPaymentSuccess,
  onCancelPayment,
}: PaymentPageProps) {
  const [countdown, setCountdown] = useState<number>(180); // 3 minutes standard security timers
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const { t, language } = useTranslation();

  // Countdown clock ticker
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const clockFormatter = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleManualSuccessSim = async () => {
    setIsVerifying(true);
    // Simulate network authentication delays
    await new Promise(resolve => setTimeout(resolve, 1800));
    try {
      await onPaymentSuccess(paymentMethod);
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center min-h-[450px] text-text-primary p-4" id="payment-module">
      <div className="max-w-md w-full relative">
        <GlassCard
          title={language === 'id' ? 'Pembayaran Aman' : 'Secure Checkout'}
          subtitle={language === 'id' ? 'Menunggu verifikasi transaksi digital' : 'Awaiting digital transaction verification'}
          className="relative overflow-hidden shadow-xl"
        >
          {isVerifying && (
            <div className="absolute inset-0 bg-bg-primary/95 z-30 flex flex-col items-center justify-center text-center p-6 gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                className="w-12 h-12 rounded-full border-t-2 border-r-2 border-emerald-500"
              />
              <div className="space-y-1">
                <h4 className="font-sans font-semibold text-sm text-text-primary">
                  {language === 'id' ? 'Memverifikasi Pembayaran' : 'Verifying Payment'}
                </h4>
                <p className="font-sans text-xs text-text-secondary">
                  {language === 'id' ? 'Mengonfirmasi keamanan transaksi dengan jaringan bank...' : 'Confirming secure transaction with bank network...'}
                </p>
              </div>
            </div>
          )}

          {/* Core Invoice Summary */}
          <div className="text-center space-y-2 mb-6 border-b border-border-primary pb-5">
            <span className="font-sans text-[11px] text-text-secondary uppercase tracking-wider font-semibold block">{language === 'id' ? 'Total Tagihan' : 'Total Amount'}</span>
            <h2 className="font-sans font-extrabold text-3xl text-emerald-600">
              Rp {totalPrice.toLocaleString()}
            </h2>
            <div className="font-sans text-xs text-text-secondary">
              ID: SFRT-TX-{Math.floor(100000 + Math.random() * 899999)}
            </div>
          </div>

          {/* Method display details */}
          <div className="space-y-6 flex flex-col items-center">
            {paymentMethod === 'QRIS' ? (
              <div className="space-y-5 flex flex-col items-center">
                {/* QR barcode display with subtle pulsing emerald frame */}
                <div className="p-4 bg-white rounded-2xl border-2 border-emerald-500/20 shadow-md relative">
                  {/* Mock Qris Logo top */}
                  <div className="w-16 h-4 bg-sky-950 rounded-md mb-2 px-1 flex items-center justify-center font-sans font-bold text-[8px] text-sky-400 select-none">
                    QRIS GPN
                  </div>
                  {/* QR Core Image vector */}
                  <svg className="w-40 h-40 fill-zinc-900 mx-auto" viewBox="0 0 100 100">
                    <rect x="0" y="0" width="25" height="25" />
                    <rect x="5" y="5" width="15" height="15" fill="white" />
                    <rect x="0" y="75" width="25" height="25" />
                    <rect x="5" y="80" width="15" height="15" fill="white" />
                    <rect x="75" y="0" width="25" height="25" />
                    <rect x="80" y="5" width="15" height="15" fill="white" />
                    <rect x="35" y="10" width="10" height="20" />
                    <rect x="55" y="15" width="15" height="5" />
                    <rect x="40" y="45" width="20" height="20" />
                    <rect x="10" y="45" width="10" height="15" />
                    <rect x="75" y="45" width="20" height="10" />
                    <rect x="80" y="75" width="15" height="15" fill="white" />
                    <rect x="85" y="80" width="5" height="5" />
                    <rect x="45" y="75" width="15" height="10" />
                  </svg>
                </div>

                <div className="text-center space-y-1">
                  <span className="font-sans text-xs text-text-secondary block">{language === 'id' ? 'QR kedaluwarsa dalam' : 'QR expires in'}</span>
                  <span className="font-sans font-semibold text-base text-red-500">{clockFormatter(countdown)}</span>
                </div>
              </div>
            ) : (
              <div className="p-6 border border-border-primary bg-panel-bg rounded-2xl w-full max-w-sm space-y-4 flex flex-col items-center text-center">
                {paymentMethod === 'Bank Transfer' ? <Landmark className="w-12 h-12 text-emerald-500" /> : <Wallet className="w-12 h-12 text-emerald-500" />}
                <div className="space-y-1.5">
                  <h4 className="font-sans font-semibold text-sm">
                    {language === 'id' ? `Bayar via Aplikasi ${paymentMethod}` : `Pay via ${paymentMethod} App`}
                  </h4>
                  <p className="font-sans text-xs text-text-secondary max-w-[260px] mx-auto leading-relaxed">
                    {language === 'id' 
                      ? `Anda akan diarahkan secara aman ke aplikasi ${paymentMethod} untuk menyelesaikan otorisasi pembayaran.`
                      : `You will be securely redirected to your ${paymentMethod} application to authorize this transaction.`}
                  </p>
                </div>
              </div>
            )}

            {/* Instruction specs */}
            <div className="text-center font-sans text-[11px] text-text-secondary bg-overlay px-4 py-2.5 rounded-xl border border-border-primary w-full">
              {language === 'id' ? 'Diamankan di bawah protokol transaksi Bank Indonesia.' : 'Secured under Bank Indonesia transaction protocols.'}
            </div>

            {/* Simulated verification triggers */}
            <div className="w-full grid grid-cols-2 gap-3 mt-3">
              <button
                type="button"
                onClick={onCancelPayment}
                className="py-3 bg-panel-bg border border-border-primary hover:border-red-500/30 hover:text-red-500 rounded-xl text-xs font-sans font-medium transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              
              <button
                onClick={handleManualSuccessSim}
                type="button"
                className="py-3 bg-emerald-500 text-white hover:bg-emerald-600 font-sans font-medium rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                id="btn-simulate-payment-success"
              >
                <ShieldCheck className="w-4 h-4" />
                {language === 'id' ? 'Simulasi Sukses' : 'Simulate Success'}
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
