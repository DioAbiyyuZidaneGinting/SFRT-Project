import { create } from 'zustand';
import { Vehicle, Station, FuelType, Transaction } from '../types';
import { vehicleService } from '../services/vehicleService';
import { stationService } from '../services/stationService';
import { transactionService } from '../services/transactionService';
import { fuelService } from '../services/fuelService';
interface DataState {
  vehicles: Vehicle[];
  stations: Station[];
  fuels: FuelType[];
  history: Transaction[];
  selectedStation: Station | null;
  selectedVehicle: Vehicle | null;
  activeTransaction: Transaction | null;

  setFuels: (fuels: FuelType[]) => void;
  loadStationFuels: (stationId: string) => Promise<void>;
  loadFallbackFuels: () => Promise<void>;
  isLoadingFuels: boolean;
  setVehicles: (vehicles: Vehicle[]) => void;
  setStations: (stations: Station[]) => void;
  setHistory: (history: Transaction[]) => void;
  setSelectedStation: (station: Station | null) => void;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  setActiveTransaction: (tx: Transaction | null) => void;
  addVehicle: (vehicle: Vehicle) => void;
  deleteVehicle: (id: string) => void;
  addTransactionToHistory: (tx: Transaction) => void;

  // Async actions
  isLoadingVehicles: boolean;
  vehicleError: string | null;
  loadUserVehicles: (userId: string) => Promise<void>;
  asyncAddVehicle: (userId: string, vehicle: Omit<Vehicle, 'id' | 'currentFuelLevel'>) => Promise<boolean>;
  asyncDeleteVehicle: (id: string) => Promise<boolean>;

  isLoadingStations: boolean;
  stationError: string | null;
  loadStations: () => Promise<void>;

  isLoadingHistory: boolean;
  historyError: string | null;
  loadUserHistory: (userId: string) => Promise<void>;
  asyncAddTransactionToHistory: (tx: Transaction) => Promise<boolean>;
  asyncUpdateTransactionStatus: (txId: string, status: string, queueNumber?: string) => Promise<boolean>;
}

export const useDataStore = create<DataState>((set) => ({
  vehicles: [],
  stations: [],
  fuels: [],
  history: [],
  selectedStation: null,
  selectedVehicle: null,
  activeTransaction: null,
  
  isLoadingFuels: false,
  setFuels: (fuels) => set({ fuels }),
  loadStationFuels: async (stationId: string) => {
    set({ isLoadingFuels: true });
    const { data, error } = await fuelService.fetchStationFuels(stationId);
    if (!error && data.length > 0) {
      set({ fuels: data, isLoadingFuels: false });
    } else {
      // Fallback to base fuels if station has no specific pricing
      const { data: baseFuels } = await fuelService.fetchFuelTypes();
      set({ fuels: baseFuels || [], isLoadingFuels: false });
    }
  },
  loadFallbackFuels: async () => {
    set({ isLoadingFuels: true });
    const { data } = await fuelService.fetchFuelTypes();
    set({ fuels: data || [], isLoadingFuels: false });
  },

  setVehicles: (vehicles) => set({ vehicles }),
  setStations: (stations) => set({ stations }),
  setHistory: (history) => set({ history }),
  setSelectedStation: (station) => set({ selectedStation: station }),
  setSelectedVehicle: (vehicle) => set({ selectedVehicle: vehicle }),
  setActiveTransaction: (tx) => set({ activeTransaction: tx }),
  
  addVehicle: (vehicle) => set((state) => ({ vehicles: [vehicle, ...state.vehicles] })),
  deleteVehicle: (id) => set((state) => ({
    vehicles: state.vehicles.filter((v) => v.id !== id),
    selectedVehicle: state.selectedVehicle?.id === id ? null : state.selectedVehicle
  })),
  addTransactionToHistory: (tx) => set((state) => ({ history: [tx, ...state.history] })),

  isLoadingVehicles: false,
  vehicleError: null,
  loadUserVehicles: async (userId: string) => {
    set({ isLoadingVehicles: true, vehicleError: null });
    const { data, error } = await vehicleService.fetchUserVehicles(userId);
    if (error) {
      set({ vehicleError: error, isLoadingVehicles: false });
    } else {
      set({ 
        vehicles: data,
        selectedVehicle: data.length > 0 ? data[0] : null,
        isLoadingVehicles: false 
      });
    }
  },
  asyncAddVehicle: async (userId: string, vehicleData) => {
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticVehicle: Vehicle = {
      id: tempId,
      ...vehicleData,
      currentFuelLevel: 0
    };
    
    set((state) => ({ 
      vehicles: [optimisticVehicle, ...state.vehicles],
      selectedVehicle: state.selectedVehicle || optimisticVehicle 
    }));

    const { data, error } = await vehicleService.createVehicle(userId, vehicleData);
    
    if (error || !data) {
      // Rollback on failure
      set((state) => ({ 
        vehicles: state.vehicles.filter(v => v.id !== tempId),
        vehicleError: error,
        selectedVehicle: state.selectedVehicle?.id === tempId ? (state.vehicles.find(v => v.id !== tempId) || null) : state.selectedVehicle
      }));
      return false;
    }
    
    // Replace temp with real data
    set((state) => ({ 
      vehicles: state.vehicles.map(v => v.id === tempId ? data : v),
      selectedVehicle: state.selectedVehicle?.id === tempId ? data : state.selectedVehicle
    }));
    return true;
  },
  asyncDeleteVehicle: async (id: string) => {
    // Optimistic update
    const prevVehicles = useDataStore.getState().vehicles;
    const prevSelected = useDataStore.getState().selectedVehicle;
    
    set((state) => ({
      vehicles: state.vehicles.filter((v) => v.id !== id),
      selectedVehicle: state.selectedVehicle?.id === id ? (state.vehicles.find(v => v.id !== id) || null) : state.selectedVehicle
    }));

    const { success, error } = await vehicleService.deleteVehicle(id);
    if (!success) {
      // Rollback
      set({ 
        vehicles: prevVehicles, 
        selectedVehicle: prevSelected,
        vehicleError: error 
      });
      return false;
    }
    return true;
  },

  isLoadingStations: false,
  stationError: null,
  loadStations: async () => {
    set({ isLoadingStations: true, stationError: null });
    const { data, error } = await stationService.fetchStations();
    if (error) {
      set({ stationError: error, isLoadingStations: false });
    } else {
      set({
        stations: data,
        selectedStation: data.length > 0 ? data[0] : null,
        isLoadingStations: false
      });
    }
  },

  isLoadingHistory: false,
  historyError: null,
  loadUserHistory: async (userId: string) => {
    set({ isLoadingHistory: true, historyError: null });
    const { data, error } = await transactionService.fetchUserTransactions(userId);
    if (error) {
      set({ historyError: error, isLoadingHistory: false });
    } else {
      set({
        history: data,
        isLoadingHistory: false
      });
    }
  },
  asyncAddTransactionToHistory: async (tx: Transaction) => {
    const { data, error } = await transactionService.createTransaction(tx);
    if (error || !data) {
      set({ historyError: error });
      return false;
    }
    set((state) => ({ history: [data, ...state.history] }));
    return true;
  },
  asyncUpdateTransactionStatus: async (txId: string, status: string, queueNumber?: string) => {
    set({ historyError: null });
    const { success, error } = await transactionService.updateTransaction(txId, { status: status as any, queueNumber });
    if (!success) {
      set({ historyError: error });
      return false;
    }

    set((state) => ({
      history: state.history.map(tx => tx.id === txId ? { ...tx, status: status as any, queueNumber: queueNumber || tx.queueNumber } : tx),
      activeTransaction: state.activeTransaction?.id === txId
        ? { ...state.activeTransaction, status: status as any, queueNumber: queueNumber || state.activeTransaction.queueNumber }
        : state.activeTransaction
    }));
    return true;
  }
}));
