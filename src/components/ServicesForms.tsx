import { useState } from 'react';
import { Patient, TreatmentRecord } from '../App';
import { FileText, Printer, Download, Plus, X, CreditCard } from 'lucide-react';

type ServicesFormsProps = {
  patients: Patient[];
  treatmentRecords: TreatmentRecord[];
  setTreatmentRecords: (records: TreatmentRecord[]) => void;
  prefilledAppointment?: {
    patientId: string;
    patientName: string;
    appointmentType: string;
  };
  onServiceCreated?: (patientId: string, service: TreatmentRecord) => void;
};

type ServiceType = 'Extraction' | 'Pasta' | 'Braces' | 'Cleaning' | 'Pustiso/Dentures';

type Prescription = {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  dentist: string;
  notes: string;
};

export function ServicesForms({ patients, treatmentRecords, setTreatmentRecords, prefilledAppointment, onServiceCreated }: ServicesFormsProps) {
  const [activeForm, setActiveForm] = useState<'service' | 'prescription' | 'receipt' | null>(prefilledAppointment ? 'service' : null);
  const [selectedService, setSelectedService] = useState<ServiceType>(() => {
    // Try to match appointment type to service type
    if (prefilledAppointment) {
      const appointmentType = prefilledAppointment.appointmentType.toLowerCase();
      if (appointmentType.includes('extraction')) return 'Extraction';
      if (appointmentType.includes('cleaning')) return 'Cleaning';
      if (appointmentType.includes('braces')) return 'Braces';
      if (appointmentType.includes('root')) return 'Pasta';
      if (appointmentType.includes('denture')) return 'Pustiso/Dentures';
    }
    return 'Cleaning';
  });
  const [selectedPatient, setSelectedPatient] = useState<string>(prefilledAppointment?.patientId || '');
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<TreatmentRecord | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [showPrescriptionPrompt, setShowPrescriptionPrompt] = useState(false);
  const [lastCreatedService, setLastCreatedService] = useState<TreatmentRecord | null>(null);
  const [paymentType, setPaymentType] = useState<'full' | 'installment'>('full');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [numberOfInstallments, setNumberOfInstallments] = useState<number>(3);

  const services: ServiceType[] = ['Extraction', 'Pasta', 'Braces', 'Cleaning', 'Pustiso/Dentures'];

  const handleCreateService = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const patientId = formData.get('patientId') as string;
    const totalCost = parseInt(formData.get('cost') as string) || 0;
    const paid = parseInt(formData.get('amountPaid') as string) || 0;
    const type = (formData.get('paymentType') as 'full' | 'installment') || 'full';

    let installmentPlan;
    if (type === 'installment') {
      const numInstallments = parseInt(formData.get('numberOfInstallments') as string) || 3;
      const amountPerInstallment = totalCost / numInstallments;
      installmentPlan = {
        installments: numInstallments,
        amountPerInstallment,
        installmentsDue: Array.from({ length: numInstallments }, (_, i) => ({
          dueDate: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          amount: amountPerInstallment,
          paid: i === 0 && paid > 0,
        })),
      };
    }

    const newRecord: TreatmentRecord = {
      id: Date.now().toString(),
      patientId,
      date: formData.get('date') as string,
      description: formData.get('service') as string,
      treatment: formData.get('service') as string,
      tooth: formData.get('tooth') as string || undefined,
      notes: formData.get('notes') as string,
      cost: totalCost,
      dentist: formData.get('dentist') as string,
      paymentType: type,
      amountPaid: paid,
      remainingBalance: totalCost - paid,
      installmentPlan,
    };

    setTreatmentRecords([...treatmentRecords, newRecord]);
    setLastCreatedService(newRecord);
    setActiveForm(null);
    setPaymentType('full');
    setAmountPaid(0);
    setNumberOfInstallments(3);
    setSelectedPatient('');
    
    // Show prescription prompt instead of auto-opening
    setShowPrescriptionPrompt(true);
    
    // Call callback if provided
    if (onServiceCreated) {
      onServiceCreated(patientId, newRecord);
    }
  };

  const handleCreatePrescription = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const patientId = formData.get('patientId') as string;
    const patient = patients.find(p => p.id === patientId);

    const medications = [];
    let index = 0;
    while (formData.get(`medication_${index}`)) {
      medications.push({
        name: formData.get(`medication_${index}`) as string,
        dosage: formData.get(`dosage_${index}`) as string,
        frequency: formData.get(`frequency_${index}`) as string,
        duration: formData.get(`duration_${index}`) as string,
      });
      index++;
    }

    const newPrescription: Prescription = {
      id: Date.now().toString(),
      patientId,
      patientName: patient?.name || '',
      date: formData.get('date') as string,
      medications,
      dentist: formData.get('dentist') as string,
      notes: formData.get('notes') as string,
    };

    setPrescriptions([...prescriptions, newPrescription]);
    setViewingPrescription(newPrescription);
    setActiveForm(null);
  };

  const printPrescription = (prescription: Prescription) => {
    const patient = patients.find(p => p.id === prescription.patientId);
    
    const content = `
═══════════════════════════════════════════════════
              PRESCRIPTION / RESETA
═══════════════════════════════════════════════════

Date: ${new Date(prescription.date).toLocaleDateString()}
Prescription ID: ${prescription.id}

PATIENT INFORMATION
─────────────────────────────────────────────────
Name: ${prescription.patientName}
Age: ${patient ? calculateAge(patient.dateOfBirth) : 'N/A'}
Sex: ${patient?.sex || 'N/A'}
Address: ${patient?.address || 'N/A'}

MEDICATIONS
─────────────────────────────────────────────────
${prescription.medications.map((med, i) => `
${i + 1}. ${med.name}
   Dosage: ${med.dosage}
   Frequency: ${med.frequency}
   Duration: ${med.duration}
`).join('\n')}

INSTRUCTIONS
─────────────────────────────────────────────────
${prescription.notes || 'Follow dosage instructions as prescribed.'}

PRESCRIBING DENTIST
─────────────────────────────────────────────────
Dr. ${prescription.dentist}
License No: _____________________
Signature: _____________________

═══════════════════════════════════════════════════
This prescription is valid for 30 days from date of issue
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reseta_${prescription.patientName.replace(/\s/g, '_')}_${prescription.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const printReceipt = (record: TreatmentRecord) => {
    const patient = patients.find(p => String(p.id) === String(record.patientId));
    
    const balanceInfo = record.paymentType === 'installment' ? `
PAYMENT PLAN
─────────────────────────────────────────────────
Type: Installment Payment
Total Cost:                       ₱${record.cost}
Amount Paid:                      ₱${record.amountPaid || 0}
Remaining Balance:                ₱${record.remainingBalance || 0}
${record.installmentPlan ? `
Number of Installments: ${record.installmentPlan.installments}
Per Installment:                  ₱${Math.round(record.installmentPlan.amountPerInstallment)}

Installment Schedule:
${record.installmentPlan.installmentsDue.map((inst, i) => 
  `${i + 1}. Due ${inst.dueDate}: ₱${Math.round(inst.amount)} ${inst.paid ? '[PAID]' : '[PENDING]'}`
).join('\n')}
` : ''}` : `
PAYMENT INFORMATION
─────────────────────────────────────────────────
Type: Full Payment
Total Amount:                     ₱${record.cost}
Amount Paid:                      ₱${record.amountPaid || 0}
Remaining Balance:                ₱${record.remainingBalance || 0}
`;
    
    const content = `
═══════════════════════════════════════════════════
                  OFFICIAL RECEIPT
                     RESIBO
═══════════════════════════════════════════════════

Receipt No: ${record.id}
Date: ${new Date(record.date).toLocaleDateString()}

PATIENT INFORMATION
─────────────────────────────────────────────────
Name: ${patient?.name || 'N/A'}
Age: ${patient ? calculateAge(patient.dateOfBirth) : 'N/A'}
Sex: ${patient?.sex || 'N/A'}
Address: ${patient?.address || 'N/A'}
Phone: ${patient?.phone || 'N/A'}
Email: ${patient?.email || 'N/A'}

SERVICE DETAILS
─────────────────────────────────────────────────
Service: ${record.treatment}
${record.tooth ? `Tooth Number: ${record.tooth}` : ''}
Notes: ${record.notes || 'N/A'}
Performed by: Dr. ${record.dentist}

AMOUNT
─────────────────────────────────────────────────
Service Fee:                      ₱${record.cost}
                                  ─────────────
TOTAL AMOUNT:                     ₱${record.cost}
${balanceInfo}

PAYMENT METHOD
─────────────────────────────────────────────────
Payment Type: ${record.paymentType === 'full' ? 'Full Payment' : 'Installment Plan'}

═══════════════════════════════════════════════════
          Thank you for choosing our clinic!
              Please keep this receipt
═══════════════════════════════════════════════════
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resibo_${patient?.name.replace(/\s/g, '_')}_${record.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const [medicationCount, setMedicationCount] = useState(1);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl mb-2">Services & Forms</h1>
          <p className="text-gray-600">Manage dental services, prescriptions, and receipts</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setActiveForm('service')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Service
          </button>
          <button
            onClick={() => setActiveForm('prescription')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Create Reseta
          </button>
        </div>
      </div>

      {/* Recent Services */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="mb-4">Recent Services</h2>
        <div className="space-y-3">
          {treatmentRecords.slice(-5).reverse().map((record) => {
            const patient = patients.find(p => p.id === record.patientId);
            return (
              <div key={record.id} className="p-4 border border-gray-200 rounded hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-lg">{patient?.name}</p>
                    <p className="text-sm text-gray-600">{record.treatment} {record.tooth ? `- Tooth ${record.tooth}` : ''}</p>
                    <p className="text-sm text-gray-500">{new Date(record.date).toLocaleDateString()} • Dr. {record.dentist}</p>
                    <div className="mt-2 flex gap-4 text-sm">
                      <span className="font-semibold">₱{record.cost}</span>
                      {record.paymentType && (
                        <>
                          <span className={`px-2 py-1 rounded ${record.paymentType === 'full' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {record.paymentType === 'full' ? 'Full Payment' : 'Installment'}
                          </span>
                          {record.amountPaid !== undefined && record.amountPaid > 0 && (
                            <span className="text-gray-600">Paid: ₱{record.amountPaid}</span>
                          )}
                          {record.remainingBalance !== undefined && record.remainingBalance > 0 && (
                            <span className="text-orange-600 font-semibold">Balance: ₱{record.remainingBalance}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setViewingReceipt(record);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 text-sm"
                    >
                      <CreditCard className="w-4 h-4" />
                      Print Resibo
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {treatmentRecords.length === 0 && (
            <p className="text-gray-500 text-center py-8">No services recorded yet</p>
          )}
        </div>
      </div>

      {/* Recent Prescriptions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="mb-4">Recent Prescriptions (Reseta)</h2>
        <div className="space-y-3">
          {prescriptions.slice(-5).reverse().map((prescription) => (
            <div key={prescription.id} className="p-4 border border-gray-200 rounded hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg">{prescription.patientName}</p>
                  <p className="text-sm text-gray-600">{prescription.medications.length} medication(s) prescribed</p>
                  <p className="text-sm text-gray-500">{new Date(prescription.date).toLocaleDateString()} • Dr. {prescription.dentist}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewingPrescription(prescription)}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => printPrescription(prescription)}
                    className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {prescriptions.length === 0 && (
            <p className="text-gray-500 text-center py-8">No prescriptions created yet</p>
          )}
        </div>
      </div>

      {/* Add Service Modal */}
      {activeForm === 'service' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl">Record Service</h2>
              <button onClick={() => setActiveForm(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Patient *</label>
                <select
                  name="patientId"
                  required
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a patient</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Date *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Service Type *</label>
                  <select
                    name="service"
                    required
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value as ServiceType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {services.map(service => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Tooth (Optional)</label>
                <input
                  type="text"
                  name="tooth"
                  placeholder="e.g., #14, Upper Right"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Cost (₱) *</label>
                <input
                  type="number"
                  name="cost"
                  required
                  step="1"
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Payment Type Selection */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <label className="block text-sm font-medium mb-3">Payment Method *</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentType"
                      value="full"
                      checked={paymentType === 'full'}
                      onChange={(e) => setPaymentType(e.target.value as 'full' | 'installment')}
                      className="mr-2"
                    />
                    <span className="text-sm">Full Payment</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentType"
                      value="installment"
                      checked={paymentType === 'installment'}
                      onChange={(e) => setPaymentType(e.target.value as 'full' | 'installment')}
                      className="mr-2"
                    />
                    <span className="text-sm">Installment Plan</span>
                  </label>
                </div>
              </div>

              {/* Payment Amount */}
              <div>
                <label className="block text-sm mb-1">Amount Paid (₱)</label>
                <input
                  type="number"
                  name="amountPaid"
                  step="1"
                  placeholder="0"
                  value={amountPaid === 0 ? '' : amountPaid}
                  onChange={(e) => {
                    const value = e.target.value;
                    const parsed = parseInt(value) || 0;
                    setAmountPaid(parsed);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty or 0 if no payment yet</p>
              </div>

              {/* Number of Installments */}
              {paymentType === 'installment' && (
                <div>
                  <label className="block text-sm mb-1">Number of Installments</label>
                  <select
                    name="numberOfInstallments"
                    value={numberOfInstallments}
                    onChange={(e) => setNumberOfInstallments(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="2">2 months</option>
                    <option value="3">3 months</option>
                    <option value="4">4 months</option>
                    <option value="6">6 months</option>
                    <option value="12">12 months (1 year)</option>
                    <option value="24">24 months (2 years)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm mb-1">Dentist *</label>
                <input
                  type="text"
                  name="dentist"
                  required
                  placeholder="Dr. Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Service details and observations"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {selectedService === 'Extraction' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    Note: After recording this extraction, you will be prompted to create a prescription (reseta) for the patient.
                  </p>
                </div>
              )}

              {selectedService === 'Braces' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    Note: For braces, you may need to create a referral form for x-ray or if referring to another dentist.
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setActiveForm(null)}
                  className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Record Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Prescription Modal */}
      {activeForm === 'prescription' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl">Create Prescription (Reseta)</h2>
              <button onClick={() => setActiveForm(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreatePrescription} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Patient *</label>
                  <select
                    name="patientId"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Date *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg">Medications</h3>
                  <button
                    type="button"
                    onClick={() => setMedicationCount(medicationCount + 1)}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                  >
                    + Add Medication
                  </button>
                </div>

                {Array.from({ length: medicationCount }).map((_, index) => (
                  <div key={index} className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
                    <p className="text-sm mb-2">Medication #{index + 1}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-sm mb-1">Medicine Name *</label>
                        <input
                          type="text"
                          name={`medication_${index}`}
                          required
                          placeholder="e.g., Amoxicillin"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Dosage *</label>
                        <input
                          type="text"
                          name={`dosage_${index}`}
                          required
                          placeholder="e.g., 500mg"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Frequency *</label>
                        <input
                          type="text"
                          name={`frequency_${index}`}
                          required
                          placeholder="e.g., 3 times a day"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm mb-1">Duration *</label>
                        <input
                          type="text"
                          name={`duration_${index}`}
                          required
                          placeholder="e.g., 7 days"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm mb-1">Dentist *</label>
                <input
                  type="text"
                  name="dentist"
                  required
                  placeholder="Dr. Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Additional Instructions</label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Special instructions for patient..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setActiveForm(null)}
                  className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Create Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Prescription Modal */}
      {viewingPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-300">
              <h2 className="text-2xl">Prescription / Reseta</h2>
              <button onClick={() => setViewingPrescription(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Date</p>
                  <p>{new Date(viewingPrescription.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Prescription ID</p>
                  <p>{viewingPrescription.id}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="mb-3">Patient Information</h3>
                <p className="text-lg">{viewingPrescription.patientName}</p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="mb-3">Medications</h3>
                <div className="space-y-4">
                  {viewingPrescription.medications.map((med, index) => (
                    <div key={index} className="p-4 bg-green-50 border border-green-200 rounded">
                      <p className="mb-2">{index + 1}. {med.name}</p>
                      <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
                        <div>
                          <p className="text-xs">Dosage</p>
                          <p>{med.dosage}</p>
                        </div>
                        <div>
                          <p className="text-xs">Frequency</p>
                          <p>{med.frequency}</p>
                        </div>
                        <div>
                          <p className="text-xs">Duration</p>
                          <p>{med.duration}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {viewingPrescription.notes && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="mb-3">Instructions</h3>
                  <p className="text-gray-700">{viewingPrescription.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <h3 className="mb-3">Prescribing Dentist</h3>
                <p>Dr. {viewingPrescription.dentist}</p>
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={() => printPrescription(viewingPrescription)}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Print Reseta
                </button>
                <button
                  onClick={() => setViewingPrescription(null)}
                  className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Receipt Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-300">
              <h2 className="text-2xl">Official Receipt / Resibo</h2>
              <button onClick={() => setViewingReceipt(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Receipt No.</p>
                  <p>{viewingReceipt.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Date</p>
                  <p>{new Date(viewingReceipt.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="mb-3">Patient Information</h3>
                {(() => {
                  const patient = patients.find(p => String(p.id) === String(viewingReceipt.patientId));
                  return patient ? (
                    <div className="space-y-2">
                      <p><strong>Name:</strong> {patient.name}</p>
                      <p><strong>Age:</strong> {calculateAge(patient.dateOfBirth)}</p>
                      <p><strong>Sex:</strong> {patient.sex}</p>
                      <p><strong>Address:</strong> {patient.address}</p>
                      <p><strong>Phone:</strong> {patient.phone}</p>
                      <p><strong>Email:</strong> {patient.email}</p>
                    </div>
                  ) : null;
                })()}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="mb-3">Service Details</h3>
                <div className="space-y-2">
                  <p>Service: {viewingReceipt.treatment}</p>
                  {viewingReceipt.tooth && <p>Tooth Number: {viewingReceipt.tooth}</p>}
                  <p>Performed by: Dr. {viewingReceipt.dentist}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="mb-3">Amount</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Billed (Service Fee):</span>
                    <span>₱{viewingReceipt.cost}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Total Paid:</span>
                    <span>₱{viewingReceipt.amountPaid || 0}</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-gray-300 pt-2 font-semibold">
                    <span>Current Balance:</span>
                    <span className={viewingReceipt.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}>₱{viewingReceipt.remainingBalance || viewingReceipt.cost}</span>
                  </div>
                </div>
              </div>

              {viewingReceipt.paymentType && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="mb-3">Payment Information</h3>
                  <div className="space-y-2">
                    <p><strong>Payment Type:</strong> {viewingReceipt.paymentType === 'full' ? 'Full Payment' : 'Installment Plan'}</p>
                    {viewingReceipt.paymentType === 'installment' && viewingReceipt.installmentPlan && (
                      <>
                        <p><strong>Number of Installments:</strong> {viewingReceipt.installmentPlan.installments}</p>
                        <p><strong>Per Installment:</strong> ₱{Math.round(viewingReceipt.installmentPlan.amountPerInstallment)}</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {viewingReceipt.notes && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="mb-3">Notes</h3>
                  <p className="text-gray-700">{viewingReceipt.notes}</p>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={() => printReceipt(viewingReceipt)}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Print Resibo
                </button>
                <button
                  onClick={() => setViewingReceipt(null)}
                  className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Prompt Modal */}
      {showPrescriptionPrompt && lastCreatedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Prescription Required?</h2>
            <p className="text-gray-700 mb-6">
              Do you need to make a prescription for {patients.find(p => p.id === lastCreatedService.patientId)?.name || 'this patient'}?
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => {
                  setShowPrescriptionPrompt(false);
                  setLastCreatedService(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 font-semibold"
              >
                No
              </button>
              <button
                onClick={() => {
                  setShowPrescriptionPrompt(false);
                  setSelectedPatient(lastCreatedService.patientId);
                  setActiveForm('prescription');
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
