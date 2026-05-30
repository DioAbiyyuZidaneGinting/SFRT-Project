import { create } from 'zustand'

export type TransactionStatus = 
  | 'PENDING'
  | 'PAYMENT'
  | 'VERIFIED'
  | 'QUEUED'
  | 'GATE_ACCESS'
  | 'REFUELING'
  | 'COMPLETED'
  | 'CLOSED'
  | 'FAILED'

export type PaymentMethod = 'QRIS' | 'DANA' | 'ShopeePay' | 'Bank Transfer' | 'Cash' | null

export interface TransactionState {
  status: TransactionStatus
  amount: number
  liters: number
  paymentMethod: PaymentMethod
  queueNumber: number | null
  stationId: string | null
  nozzleId: string | null
  
  // Actions
  setStatus: (status: TransactionStatus) => void
  setPaymentDetails: (amount: number, liters: number, method: PaymentMethod) => void
  setQueueDetails: (queueNumber: number, stationId: string) => void
  setRefuelingDetails: (nozzleId: string) => void
  reset: () => void
  
  // Transitions (State Machine)
  proceedToPayment: (amount: number, liters: number) => void
  confirmPayment: (method: PaymentMethod) => void
  assignQueue: (queueNumber: number, stationId: string) => void
  openGate: () => void
  startRefueling: (nozzleId: string) => void
  finishRefueling: () => void
  closeTransaction: () => void
  failTransaction: () => void
}

const initialState = {
  status: 'PENDING' as TransactionStatus,
  amount: 0,
  liters: 0,
  paymentMethod: null,
  queueNumber: null,
  stationId: null,
  nozzleId: null,
}

export const useTransactionStore = create<TransactionState>((set) => ({
  ...initialState,
  
  setStatus: (status) => set({ status }),
  setPaymentDetails: (amount, liters, paymentMethod) => set({ amount, liters, paymentMethod }),
  setQueueDetails: (queueNumber, stationId) => set({ queueNumber, stationId }),
  setRefuelingDetails: (nozzleId) => set({ nozzleId }),
  reset: () => set(initialState),

  // State Machine Transitions
  proceedToPayment: (amount, liters) => set({ status: 'PAYMENT', amount, liters }),
  confirmPayment: (paymentMethod) => set({ status: 'VERIFIED', paymentMethod }),
  assignQueue: (queueNumber, stationId) => set({ status: 'QUEUED', queueNumber, stationId }),
  openGate: () => set({ status: 'GATE_ACCESS' }),
  startRefueling: (nozzleId) => set({ status: 'REFUELING', nozzleId }),
  finishRefueling: () => set({ status: 'COMPLETED' }),
  closeTransaction: () => set(initialState),
  failTransaction: () => set({ status: 'FAILED' }),
}))
