export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    role: string;
    fullName: string;
    email: string;
    phone?: string;
    isFirstLogin?: boolean;
    patientId?: number | string;
  };
  error?: string;
  message?: string;
}

export interface Patient {
  id: number;
  name: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  sex: 'Male' | 'Female';
  medicalHistory: string;
  allergies: string;
}

export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  date: string;
  time: string;
  type: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  supplier: string;
  cost: number;
}

export interface Referral {
  id: number;
  patientId: number;
  patientName: string;
  referringDentist: string;
  referredTo: string;
  specialty: string;
  reason: string;
  date: string;
  urgency: 'routine' | 'urgent' | 'emergency';
}

export const setAuthToken: (token: string) => void;
export const getAuthToken: () => string | null;

export const authAPI: {
  login: (username: string, password: string) => Promise<AuthResponse>;
  register: (userData: any) => Promise<any>;
};

export const patientAPI: {
  getAll: () => Promise<Patient[]>;
  getById: (id: number) => Promise<Patient>;
  create: (data: any) => Promise<Patient>;
  update: (id: number, data: any) => Promise<Patient>;
  delete: (id: number) => Promise<any>;
};

export const appointmentAPI: {
  getAll: () => Promise<Appointment[]>;
  create: (data: any) => Promise<Appointment>;
  update: (id: number, data: any) => Promise<Appointment>;
  delete: (id: number) => Promise<any>;
};

export const inventoryAPI: {
  getAll: () => Promise<InventoryItem[]>;
  create: (data: any) => Promise<InventoryItem>;
  update: (id: number, data: any) => Promise<InventoryItem>;
  delete: (id: number) => Promise<any>;
};

export const referralAPI: {
  getAll: () => Promise<Referral[]>;
  create: (data: any) => Promise<Referral>;
  update: (id: number, data: any) => Promise<Referral>;
  delete: (id: number) => Promise<any>;
};

export const patientClaimingAPI: {
  searchRecords: (data: { fullName: string; dateOfBirth: string; phone: string }) => Promise<any>;
  selectPatient: (data: { patientId: number; lastVisit?: string }) => Promise<any>;
  sendOTP: (patientId: number) => Promise<any>;
  resendOTP: (patientId: number) => Promise<any>;
  verifyAndLink: (data: { patientId: number; otp: string; userData: any }) => Promise<any>;
};
