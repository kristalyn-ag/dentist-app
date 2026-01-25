import { useEffect, useCallback } from 'react';
import { patientAPI, appointmentAPI, inventoryAPI, referralAPI } from '../api';

/**
 * Custom hook for real-time data synchronization across the application
 * Automatically refreshes data from the server at intervals and when triggered
 * 
 * Usage:
 * const { refreshAll, refreshPatients, refreshAppointments } = useDataSync(
 *   setPatients,
 *   setAppointments,
 *   setTreatmentRecords,
 *   setInventory,
 *   setReferrals
 * );
 * 
 * // Refresh all data
 * await refreshAll();
 * 
 * // Refresh specific data
 * await refreshPatients();
 * await refreshAppointments();
 */

type UseDataSyncProps = {
  setPatients: (patients: any[]) => void;
  setAppointments: (appointments: any[]) => void;
  setTreatmentRecords: (records: any[]) => void;
  setInventory?: (inventory: any[]) => void;
  setReferrals?: (referrals: any[]) => void;
};

export function useDataSync({
  setPatients,
  setAppointments,
  setInventory,
  setReferrals,
}: UseDataSyncProps) {
  
  /**
   * Fetch and update patients
   */
  const refreshPatients = useCallback(async () => {
    try {
      const patientsData = await patientAPI.getAll();
      setPatients(patientsData || []);
      return true;
    } catch (error) {
      console.error('Failed to refresh patients:', error);
      return false;
    }
  }, [setPatients]);

  /**
   * Fetch and update appointments
   */
  const refreshAppointments = useCallback(async () => {
    try {
      const appointmentsData = await appointmentAPI.getAll();
      setAppointments(appointmentsData || []);
      return true;
    } catch (error) {
      console.error('Failed to refresh appointments:', error);
      return false;
    }
  }, [setAppointments]);

  /**
   * Fetch and update inventory
   */
  const refreshInventory = useCallback(async () => {
    try {
      if (!setInventory) return false;
      const inventoryData = await inventoryAPI.getAll();
      const convertedInventory = (inventoryData || []).map(item => ({
        ...item,
        quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity,
        minQuantity: typeof item.minQuantity === 'string' ? parseInt(item.minQuantity) : item.minQuantity,
        cost: typeof item.cost === 'string' ? parseFloat(item.cost) : item.cost,
      }));
      setInventory(convertedInventory);
      return true;
    } catch (error) {
      console.error('Failed to refresh inventory:', error);
      return false;
    }
  }, [setInventory]);

  /**
   * Fetch and update referrals
   */
  const refreshReferrals = useCallback(async () => {
    try {
      if (!setReferrals) return false;
      const referralsData = await referralAPI.getAll();
      setReferrals(referralsData || []);
      return true;
    } catch (error) {
      console.error('Failed to refresh referrals:', error);
      return false;
    }
  }, [setReferrals]);

  /**
   * Refresh all data
   */
  const refreshAll = useCallback(async () => {
    try {
      const results = await Promise.all([
        refreshPatients(),
        refreshAppointments(),
        refreshInventory(),
        refreshReferrals(),
      ]);
      return results.every(r => r);
    } catch (error) {
      console.error('Failed to refresh all data:', error);
      return false;
    }
  }, [refreshPatients, refreshAppointments, refreshInventory, refreshReferrals]);

  /**
   * Set up auto-refresh intervals
   * Refreshes patients and appointments every 30 seconds
   * Refreshes inventory every 60 seconds
   */
  useEffect(() => {
    // Auto-refresh patients and appointments every 30 seconds
    const patientsInterval = setInterval(refreshPatients, 30000);
    const appointmentsInterval = setInterval(refreshAppointments, 30000);
    
    // Auto-refresh inventory every 60 seconds (less frequently)
    const inventoryInterval = setInterval(refreshInventory, 60000);

    return () => {
      clearInterval(patientsInterval);
      clearInterval(appointmentsInterval);
      clearInterval(inventoryInterval);
    };
  }, [refreshPatients, refreshAppointments, refreshInventory]);

  return {
    refreshAll,
    refreshPatients,
    refreshAppointments,
    refreshInventory,
    refreshReferrals,
  };
}
