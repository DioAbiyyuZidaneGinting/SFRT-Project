import { Vehicle, FuelType, Transaction } from '../types';
import { supabase } from '../lib/supabase';


export const AIService = {
  /**
   * 1. Fuel Recommendation AI
   * Analyzes vehicle properties against available fuels to recommend the best option.
   */
  getFuelRecommendation: (vehicle: Vehicle | null, fuel: FuelType): {
    isOptimal: boolean;
    compatibilityScore: number;
    advisory: string;
  } => {
    if (!vehicle) {
      return { isOptimal: false, compatibilityScore: 0, advisory: 'No vehicle profile selected.' };
    }

    const isOptimal = vehicle.fuelTypePreference === fuel.name;
    let compatibilityScore = isOptimal ? 100 : 65;
    
    // Engine compression simulation logic
    if (!isOptimal && fuel.name.includes('Turbo') && vehicle.fuelTypePreference.includes('Pertamax')) {
      compatibilityScore = 95; // Acceptable upgrade
    } else if (vehicle.fuelTypePreference.includes('Turbo') && !fuel.name.includes('Turbo')) {
      compatibilityScore = 40; // Dangerous downgrade
    }

    let advisory = isOptimal
      ? `✓ Match Verified: RON Compatibility ${compatibilityScore}%. Peak combustion outputs achieved.`
      : `⚠ Advisory Deviation: RON Compatibility ${compatibilityScore}%. Running below preference parameter triggers valve throttle offset.`;

    if (compatibilityScore < 50) {
      advisory = `🚨 DANGER: Critical mismatch! Expected ${vehicle.fuelTypePreference}, selected ${fuel.name}. Engine knocking risk high.`;
    }

    return { isOptimal, compatibilityScore, advisory };
  },

  /**
   * 2. Queue Prediction AI
   * Estimates waiting time based on current queue count and pump efficiency.
   */
  predictQueueTime: (queueCount: number, activePumps: number = 2): number => {
    if (queueCount === 0) return 0;
    // Assume average 4 minutes per vehicle, divided by active pumps
    const baseWait = (queueCount * 4) / activePumps;
    // Add 15% random variance for realism
    const variance = baseWait * (Math.random() * 0.3 - 0.15);
    return Math.max(1, Math.round(baseWait + variance));
  },

  /**
   * 3. Vehicle Classification AI
   * Parses string properties to apply smart tags for the UI.
   */
  classifyVehicle: (vehicle: Vehicle): string[] => {
    const tags = [vehicle.vehicleType.toUpperCase()];
    if (vehicle.brand.toLowerCase().includes('tesla') || vehicle.model.toLowerCase().includes('ev')) {
      tags.push('EV HYBRID');
    }
    if (vehicle.tankCapacity > 50) {
      tags.push('HEAVY LOAD');
    } else {
      tags.push('COMMUTER');
    }
    return tags;
  },

  /**
   * 4. Fraud Detection System
   * Simulates detection of reused QR tokens or mismatched plates.
   */
  detectFraudRisk: (transaction: Transaction, currentScannedPlate: string): {
    isFraud: boolean;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    reason: string | null;
  } => {
    if (transaction.plateNumber !== currentScannedPlate) {
      return {
        isFraud: true,
        riskLevel: 'HIGH',
        reason: `Plate mismatch! Expected ${transaction.plateNumber}, scanned ${currentScannedPlate}`,
      };
    }
    
    // Mock check for expired transaction (> 10 mins old)
    const txTime = new Date(`${transaction.date}T${transaction.time}`).getTime();
    const now = new Date().getTime();
    if (now - txTime > 10 * 60 * 1000) {
      return {
        isFraud: true,
        riskLevel: 'MEDIUM',
        reason: 'Transaction token expired (Timeout > 10 mins).',
      };
    }

    return { isFraud: false, riskLevel: 'LOW', reason: null };
  },

  /**
   * 5. Maintenance Prediction
   * Returns a simulated health score for hardware.
   */
  getHardwareHealth: (deviceId: string, totalPumpedLiters: number): {
    healthScore: number;
    needsMaintenance: boolean;
  } => {
    // Pure mock logic
    const degradation = (totalPumpedLiters / 10000) * 100; 
    const health = Math.max(0, 100 - degradation);
    return {
      healthScore: Math.round(health),
      needsMaintenance: health < 40
    };
  },

  /**
   * 6. Live Chat with AI Assistant
   * Sends user message and conversation history to the Chat AI Edge Function.
   */
  chatWithAI: async (
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[]
  ): Promise<{ response: string | null; error: string | null }> => {
    try {
      // Retrieve the current user's session token and attach it explicitly to the request headers
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: { message, history },
        headers,
      });

      if (error) {
        // Try to extract detailed error from the response context
        let detailedMsg = error.message || 'Unknown Edge Function error';
        if (error.context && typeof error.context.json === 'function') {
          try {
            const errorBody = await error.context.json();
            console.error('[AIService] Edge Function error body:', errorBody);
            detailedMsg = errorBody?.error || errorBody?.details || detailedMsg;
          } catch {
            // If parsing fails, use the original error message
          }
        }
        console.error('[AIService] Failed to chat with AI:', detailedMsg);
        return { response: null, error: detailedMsg };
      }

      return { response: data.response, error: null };
    } catch (err: any) {
      console.error('[AIService] Failed to chat with AI:', err);
      return { response: null, error: err.message || 'Failed to get response from AI.' };
    }
  }
};
