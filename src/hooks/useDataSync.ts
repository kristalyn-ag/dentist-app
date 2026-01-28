import { useEffect, useCallback } from 'react';
import { patientAPI, appointmentAPI, inventoryAPI, referralAPI, treatmentRecordAPI, paymentAPI, announcementAPI } from '../api';

/**
 * Custom hook for real-time data synchronization across the application
 * Automatically refreshes data from the server at intervals and when triggered
 */

type UseDataSyncProps = {
  setPatients: (patients: any[]) => void;
  setAppointments: (appointments: any[]) => void;
  setTreatmentRecords: (records: any[]) => void;
  setInventory?: (inventory: any[]) => void;
  setReferrals?: (referrals: any[]) => void;
  setPayments?: (payments: any[]) => void;
  setAnnouncements?: (announcements: any[]) => void;
};

export function useDataSync({
  setPatients,
  setAppointments,
  setTreatmentRecords,
  setInventory,
  setReferrals,
  setPayments,
  setAnnouncements,
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
   * Fetch and update treatment records
   */
  const refreshTreatmentRecords = useCallback(async () => {
    try {
      const recordsData = await treatmentRecordAPI.getAll();
      const convertedRecords = (recordsData || []).map(record => ({
        ...record,
        cost: typeof record.cost === 'string' ? parseFloat(record.cost) : record.cost,
        amountPaid: typeof record.amountPaid === 'string' ? parseFloat(record.amountPaid) : record.amountPaid,
        remainingBalance: typeof record.remainingBalance === 'string' ? parseFloat(record.remainingBalance) : record.remainingBalance,
      }));
      setTreatmentRecords(convertedRecords);
      return true;
    } catch (error) {
      console.error('Failed to refresh treatment records:', error);
      return false;
    }
  }, [setTreatmentRecords]);

  /**
   * Fetch and update payments
   */
  const refreshPayments = useCallback(async () => {
    try {
      if (!setPayments) return false;
      const paymentsData = await paymentAPI.getAll();
      const convertedPayments = (paymentsData || []).map(payment => ({
        ...payment,
        amount: typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount,
      }));
      setPayments(convertedPayments);
      return true;
    } catch (error) {
      console.error('Failed to refresh payments:', error);
      return false;
    }
  }, [setPayments]);

  /**
   * Fetch and update announcements
   */
  const refreshAnnouncements = useCallback(async () => {
    try {
      if (!setAnnouncements) return false;
      const announcementsData = await announcementAPI.getAll();
      setAnnouncements(announcementsData || []);
      return true;
    } catch (error) {
      console.error('Failed to refresh announcements:', error);
      return false;
    }
  }, [setAnnouncements]);

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
        refreshTreatmentRecords(),
        refreshPayments(),
        refreshAnnouncements(),
      ]);
      return results.every(r => r);
    } catch (error) {
      console.error('Failed to refresh all data:', error);
      return false;
    }
  }, [refreshPatients, refreshAppointments, refreshInventory, refreshReferrals, refreshTreatmentRecords, refreshPayments, refreshAnnouncements]);

  /**
   * Set up auto-refresh intervals
   */
  useEffect(() => {
    const patientsInterval = setInterval(refreshPatients, 30000);
    const appointmentsInterval = setInterval(refreshAppointments, 30000);
    const treatmentRecordsInterval = setInterval(refreshTreatmentRecords, 30000);
    const paymentsInterval = setInterval(refreshPayments, 30000);
    const announcementsInterval = setInterval(refreshAnnouncements, 60000);
    const inventoryInterval = setInterval(refreshInventory, 60000);

    return () => {
      clearInterval(patientsInterval);
      clearInterval(appointmentsInterval);
      clearInterval(treatmentRecordsInterval);
      clearInterval(paymentsInterval);
      clearInterval(announcementsInterval);
      clearInterval(inventoryInterval);
    };
  }, [refreshPatients, refreshAppointments, refreshInventory, refreshTreatmentRecords, refreshPayments, refreshAnnouncements]);

  return {
    refreshAll,
    refreshPatients,
    refreshAppointments,
    refreshInventory,
    refreshReferrals,
    refreshTreatmentRecords,
    refreshPayments,
    refreshAnnouncements,
  };
}
