/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VehicleType = 'car' | 'motorcycle';

export interface Vehicle {
  id: string;
  plateNumber: string;
  vehicleType: VehicleType;
  brand: string;
  model: string;
  fuelTypePreference: string;
  tankCapacity: number; // in liters
  currentFuelLevel: number; // in percentage (0-100)
  isVerified?: boolean;
  createdAt?: string;
}

export interface FuelType {
  id: string;
  name: string;
  pricePerLiter: number; // in IDR/currency
  stockLevel: number; // in percentage (0-100)
  rating: number; // octane or quality index
  recommendedFor: string[]; // vehicle models or types
  description: string;
}

export interface Station {
  id: string;
  name: string;
  address: string;
  distance: number; // in km
  latitude: number;
  longitude: number;
  queueCount: number;
  estWaitMinutes: number;
  status: 'OPEN' | 'BUSY' | 'CLOSED';
  fuelStock: { [fuelId: string]: boolean }; // availability
}

export interface Transaction {
  id: string;
  userId: string;
  stationId: string;
  stationName: string;
  vehicleId: string;
  plateNumber: string;
  fuelTypeId: string;
  fuelTypeName: string;
  liters: number;
  pricePerLiter: number;
  totalPrice: number;
  paymentMethod: string;
  date: string;
  time: string;
  status: 'pending' | 'paying' | 'queued' | 'refueling' | 'completed' | 'cancelled';
  queueNumber: string;
  paymentQrCode: string;
  compatibilityScore?: number;
}

export type ScreenId =
  | 'splash'
  | 'auth'
  | 'home'
  | 'stations'
  | 'vehicle-reg'
  | 'purchase'
  | 'payment'
  | 'queue'
  | 'qr-verify'
  | 'barrier'
  | 'refueling'
  | 'receipt'
  | 'history'
  | 'profile'
  | 'admin';

export type ViewMode = 'mobile' | 'tablet' | 'desktop';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  category: 'vehicle' | 'refuel' | 'payment' | 'system' | 'security';
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  sessionId: string;
  userId: string;
  deviceName: string;
  browser: string;
  os: string;
  ipAddress?: string;
  userAgent: string;
  lastActive: string;
  createdAt: string;
  isCurrentSession?: boolean;
}


