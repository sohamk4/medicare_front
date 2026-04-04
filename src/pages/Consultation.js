import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, User, FileText, Pill, Activity, Save, History, X, AlertTriangle } from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_FLOW = ['scheduled', 'confirmed', 'checked-in', 'in-consultation', 'completed'];
const TERMINAL_STATUSES = ['completed', 'cancelled', 'no-show'];

export default function Consultation() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [showMedicalHistory, setShowMedicalHistory] = useState(false);
  const [showStatusWarning, setShowStatusWarning] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMedicalHistory, setLoadingMedicalHistory] = useState(false);
  const [consultationData, setConsultationData] = useState({
    diagnosis: "",
    prescription: [],
    notes: "",
    followUpDate: "",
    testsRecommended: [],
    vitalSigns: {
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      weight: "",
      spo2: ""
    }
  });

  useEffect(() => {
    fetchAppointmentDetails();
  }, [appointmentId]);

  const fetchAppointmentDetails = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await axios.get(
        `${API_BASE_URL}/appointments/${appointmentId}?username=${userData.username}`
      );

      if (response.data.success) {
        const appointmentData = response.data.data.appointment;
        if (TERMINAL_STATUSES.includes(appointmentData.status)) {
          navigate('/dashboard/doctor');
        }
        setAppointment(appointmentData);
        
        if (appointmentData.consultation) {
          setConsultationData({
            diagnosis: appointmentData.consultation.diagnosis || "",
            prescription: appointmentData.consultation.prescription || [],
            notes: appointmentData.consultation.notes || "",
            followUpDate: appointmentData.consultation.followUpDate ? 
              new Date(appointmentData.consultation.followUpDate).toISOString().split('T')[0] : "",
            testsRecommended: appointmentData.consultation.testsRecommended || [],
            vitalSigns: {
              bloodPressure: appointmentData.consultation.vitalSigns?.bloodPressure || "",
              heartRate: appointmentData.consultation.vitalSigns?.heartRate || "",
              temperature: appointmentData.consultation.vitalSigns?.temperature || "",
              weight: appointmentData.consultation.vitalSigns?.weight || "",
              spo2: appointmentData.consultation.vitalSigns?.spo2 || ""
            }
          });
        }
      } else {
        setError("Failed to fetch appointment details");
      }
    } catch (err) {
      setError("Error fetching appointment details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicalHistory = async () => {
    if (medicalHistory) {
      setShowMedicalHistory(true);
      return;
    }
    
    setLoadingMedicalHistory(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await axios.get(
        `${API_BASE_URL}/doctors/patients/${appointment.patient.username}/medical-history?doctorUsername=${userData.username}&appointmentId=${appointmentId}`
      );
      if (response.data.success) {
        setMedicalHistory(response.data.data);
        setShowMedicalHistory(true);
      }
    } catch (err) {
      setError("Error fetching medical history: " + err.message);
    } finally {
      setLoadingMedicalHistory(false);
    }
  };

  const closeMedicalHistory = () => {
    setShowMedicalHistory(false);
  };

  const getAvailableStatuses = () => {
    if (!appointment) return [];
    const currentIndex = STATUS_FLOW.indexOf(appointment.status);
    const terminalStatuses = ['cancelled', 'no-show'];
    let availableStatuses = [];
    if (currentIndex !== -1) {
      availableStatuses = [
        appointment.status,
        ...STATUS_FLOW.slice(currentIndex + 1),
        ...terminalStatuses
      ];
    } else {
      availableStatuses = [...terminalStatuses, appointment.status];
    }
    return [...new Set(availableStatuses)];
  };

  const isConsultationFilled = () => {
    return consultationData.diagnosis.trim() !== "" || 
           consultationData.prescription.length > 0 ||
           consultationData.notes.trim() !== "" ||
           consultationData.testsRecommended.length > 0;
  };

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'completed' && !isConsultationFilled()) {
      setError("Cannot mark as completed without consultation details. Please fill diagnosis, prescription, or notes.");
      return;
    }

    const currentIndex = STATUS_FLOW.indexOf(appointment.status);
    const newIndex = STATUS_FLOW.indexOf(newStatus);
    
    if (newIndex > currentIndex && newStatus !== 'cancelled' && newStatus !== 'no-show') {
      setPendingStatus(newStatus);
      setShowStatusWarning(true);
    } else {
      updateAppointmentStatus(newStatus);
    }
  };

  const confirmStatusUpdate = () => {
    updateAppointmentStatus(pendingStatus);
    setShowStatusWarning(false);
    setPendingStatus("");
  };

  const cancelStatusUpdate = () => {
    setShowStatusWarning(false);
    setPendingStatus("");
  };

  const updateAppointmentStatus = async (newStatus) => {
    setStatusUpdating(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      await axios.put(`${API_BASE_URL}/appointments/${appointmentId}/status`, {
        status: newStatus,
        username: userData.username
      });
      
      if (newStatus === 'completed' && isConsultationFilled()) {
        navigate('/dashboard/doctor');
      } else if (newStatus === 'cancelled') {
        navigate('/dashboard/doctor');
      } else {
        fetchAppointmentDetails();
      }
      
      setError(null);
    } catch (err) {
      console.log(err);
      setError("Error updating status: " + (err.response?.data?.message || err.message));
    } finally {
      setStatusUpdating(false);
    }
  };

  const saveConsultation = async () => {
    setSaving(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      await axios.put(`${API_BASE_URL}/appointments/${appointmentId}/consultation`, {
        doctorUsername: userData.username,
        ...consultationData
      });
      
      alert("Consultation details saved successfully! now change status to complete to end appointment");
    } catch (err) {
      setError("Error saving consultation: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addPrescription = () => {
    setConsultationData(prev => ({
      ...prev,
      prescription: [...prev.prescription, { medicine: "", dosage: "", frequency: "", duration: "" }]
    }));
  };

  const updatePrescription = (index, field, value) => {
    setConsultationData(prev => ({
      ...prev,
      prescription: prev.prescription.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const removePrescription = (index) => {
    setConsultationData(prev => ({
      ...prev,
      prescription: prev.prescription.filter((_, i) => i !== index)
    }));
  };

  const addTest = () => {
    setConsultationData(prev => ({
      ...prev,
      testsRecommended: [...prev.testsRecommended, ""]
    }));
  };

  const updateTest = (index, value) => {
    setConsultationData(prev => ({
      ...prev,
      testsRecommended: prev.testsRecommended.map((test, i) => i === index ? value : test)
    }));
  };

  const removeTest = (index) => {
    setConsultationData(prev => ({
      ...prev,
      testsRecommended: prev.testsRecommended.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6FAF8] flex items-center justify-center">
        <div className="text-[#21748C] text-lg">Loading appointment details...</div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-[#F6FAF8] flex items-center justify-center">
        <div className="text-red-500 text-lg">{error || "Appointment not found"}</div>
      </div>
    );
  }

  const availableStatuses = getAvailableStatuses();

  return (
    <div className="min-h-screen bg-[#F6FAF8]">
      <nav className="w-full bg-[#0E5F73] flex items-center px-6 py-3">
        <button onClick={() => navigate(-1)} className="flex items-center text-white text-sm font-medium mr-3">
          <ArrowLeft size={20} className="mr-1" />
          Back
        </button>
        <span className="flex items-center text-[#FDFDFB] text-2xl font-semibold ml-2">
          Consultation
        </span>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-[#16697A]">
                Consultation #{appointment.appointmentId.slice(-6)}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  appointment.status === 'checked-in' ? 'bg-yellow-100 text-yellow-800' :
                  appointment.status === 'in-consultation' ? 'bg-purple-100 text-purple-800' :
                  appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {appointment.status.toUpperCase()}
                </span>
                <div className="flex items-center gap-2 text-[#21748C]">
                  <Calendar size={16} />
                  {new Date(appointment.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-[#21748C]">
                  <Clock size={16} />
                  {appointment.timeSlot}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <select
                value={appointment.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={statusUpdating}
                className="border border-gray-300 rounded-lg px-3 py-2 disabled:opacity-50"
              >
                {availableStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
              
              {!appointment.isGuest && (
                <button
                  onClick={fetchMedicalHistory}
                  className="flex items-center gap-2 bg-[#21748C] text-white px-4 py-2 rounded-lg hover:bg-[#1D6278] transition"
                >
                  <History size={16} />
                  Medical History
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Patient Information */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-[#16697A] flex items-center gap-2 mb-4">
                <User size={20} />
                Patient Information
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-[#21748C]">Name</label>
                  <p className="text-[#16697A] font-medium">{appointment.patient.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#21748C]">Age & Gender</label>
                  <p className="text-[#16697A]">{appointment.patient.age} years, {appointment.patient.gender}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#21748C]">Blood Group</label>
                  <p className="text-[#16697A]">{appointment.patient.bloodGroup}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#21748C]">Contact</label>
                  <p className="text-[#16697A]">{appointment.patient.phoneNo}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-[#16697A] flex items-center gap-2 mb-4">
                <FileText size={20} />
                Appointment Details
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-[#21748C]">Reason</label>
                  <p className="text-[#16697A]">{appointment.reason}</p>
                </div>
                {appointment.symptoms && appointment.symptoms.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-[#21748C]">Symptoms</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {appointment.symptoms.map((symptom, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Consultation Form */}
          <div className="lg:col-span-3 space-y-6">
            {appointment.status === 'in-consultation' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle size={20} />
                  <span className="font-semibold">Consultation Required</span>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  Please fill in consultation details before marking this appointment as completed.
                </p>
              </div>
            )}

            {/* Vital Signs */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-[#16697A] flex items-center gap-2 mb-4">
                <Activity size={20} />
                Vital Signs
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#21748C]">Blood Pressure</label>
                  <input
                    type="text"
                    placeholder="120/80"
                    value={consultationData.vitalSigns.bloodPressure}
                    onChange={(e) => setConsultationData(prev => ({
                      ...prev,
                      vitalSigns: { ...prev.vitalSigns, bloodPressure: e.target.value }
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#21748C]">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    placeholder="72"
                    value={consultationData.vitalSigns.heartRate}
                    onChange={(e) => setConsultationData(prev => ({
                      ...prev,
                      vitalSigns: { ...prev.vitalSigns, heartRate: e.target.value }
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#21748C]">Temperature (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="98.6"
                    value={consultationData.vitalSigns.temperature}
                    onChange={(e) => setConsultationData(prev => ({
                      ...prev,
                      vitalSigns: { ...prev.vitalSigns, temperature: e.target.value }
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#21748C]">Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="70"
                    value={consultationData.vitalSigns.weight}
                    onChange={(e) => setConsultationData(prev => ({
                      ...prev,
                      vitalSigns: { ...prev.vitalSigns, weight: e.target.value }
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#21748C]">SpO2 (%)</label>
                  <input
                    type="number"
                    placeholder="98"
                    value={consultationData.vitalSigns.spo2}
                    onChange={(e) => setConsultationData(prev => ({
                      ...prev,
                      vitalSigns: { ...prev.vitalSigns, spo2: e.target.value }
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-[#16697A] mb-4">Diagnosis</h2>
              <textarea
                placeholder="Enter diagnosis..."
                value={consultationData.diagnosis}
                onChange={(e) => setConsultationData(prev => ({ ...prev, diagnosis: e.target.value }))}
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Prescription */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[#16697A] flex items-center gap-2">
                  <Pill size={20} />
                  Prescription
                </h2>
                <button
                  onClick={addPrescription}
                  className="bg-[#21748C] text-white px-3 py-1 rounded text-sm hover:bg-[#1D6278]"
                >
                  Add Medicine
                </button>
              </div>
              
              <div className="space-y-3">
                {consultationData.prescription.map((med, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="text-sm font-medium text-[#21748C]">Medicine</label>
                        <input
                          type="text"
                          placeholder="Medicine name"
                          value={med.medicine}
                          onChange={(e) => updatePrescription(index, 'medicine', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[#21748C]">Dosage</label>
                        <input
                          type="text"
                          placeholder="5mg"
                          value={med.dosage}
                          onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[#21748C]">Frequency</label>
                        <input
                          type="text"
                          placeholder="Once daily"
                          value={med.frequency}
                          onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[#21748C]">Duration</label>
                        <input
                          type="text"
                          placeholder="30 days"
                          value={med.duration}
                          onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removePrescription(index)}
                      className="text-red-500 text-sm hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tests Recommended */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[#16697A]">Tests Recommended</h2>
                <button
                  onClick={addTest}
                  className="bg-[#21748C] text-white px-3 py-1 rounded text-sm hover:bg-[#1D6278]"
                >
                  Add Test
                </button>
              </div>
              
              <div className="space-y-2">
                {consultationData.testsRecommended.map((test, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Test name"
                      value={test}
                      onChange={(e) => updateTest(index, e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded"
                    />
                    <button
                      onClick={() => removeTest(index)}
                      className="text-red-500 hover:text-red-700 px-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-semibold text-[#16697A] mb-4">Follow-up Date</h2>
                <input
                  type="date"
                  value={consultationData.followUpDate}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, followUpDate: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-semibold text-[#16697A] mb-4">Doctor's Notes</h2>
                <textarea
                  placeholder="Additional notes..."
                  value={consultationData.notes}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, notes: e.target.value }))}
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveConsultation}
                disabled={saving}
                className="flex items-center gap-2 bg-gradient-to-r from-[#2BA2A5] to-[#44BAA0] text-white px-8 py-3 rounded-lg font-semibold hover:from-[#219494] hover:to-[#379874] transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Consultation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Warning Modal */}
      {showStatusWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-100 p-2 rounded-full">
                  <AlertTriangle className="text-yellow-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-[#16697A]">Confirm Status Update</h3>
              </div>
              <p className="text-gray-600 mb-6">
                You are about to change the appointment status from <strong>{appointment.status}</strong> to <strong>{pendingStatus}</strong>. 
                This action cannot be reversed. Are you sure you want to proceed?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelStatusUpdate}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatusUpdate}
                  disabled={statusUpdating}
                  className="px-4 py-2 bg-[#21748C] text-white rounded-lg hover:bg-[#1D6278] transition disabled:opacity-50"
                >
                  {statusUpdating ? "Updating..." : "Confirm Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medical History Modal */}
      {showMedicalHistory && !appointment.isGuest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#16697A]">
                  Medical History - {medicalHistory?.patientInfo?.name || "Loading..."}
                </h2>
                <button onClick={closeMedicalHistory} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {loadingMedicalHistory ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C6975]"></div>
                </div>
              ) : (
                <>
                  {/* Patient Basic Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-[#21748C]">Age</label>
                      <p className="text-[#16697A] font-medium">{medicalHistory?.patientInfo?.age} years</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#21748C]">Gender</label>
                      <p className="text-[#16697A] font-medium">{medicalHistory?.patientInfo?.gender}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#21748C]">Blood Group</label>
                      <p className="text-[#16697A] font-medium">{medicalHistory?.patientInfo?.bloodGroup}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#21748C]">Total Consultations</label>
                      <p className="text-[#16697A] font-medium">{medicalHistory?.completeHistory?.totalConsultations}</p>
                    </div>
                  </div>

                  {/* Medical Profile */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-[#16697A] mb-3">Medical Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {medicalHistory?.medicalProfile?.allergies?.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-[#21748C]">Allergies</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {medicalHistory.medicalProfile.allergies.map((allergy, idx) => (
                              <span key={idx} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                                {allergy}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {medicalHistory?.medicalProfile?.chronicConditions?.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-[#21748C]">Chronic Conditions</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {medicalHistory.medicalProfile.chronicConditions.map((condition, idx) => (
                              <span key={idx} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                                {condition}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {medicalHistory?.medicalProfile?.currentMedications?.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-[#21748C]">Current Medications</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {medicalHistory.medicalProfile.currentMedications.map((med, idx) => (
                              <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                {med}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {medicalHistory?.medicalProfile?.surgicalHistory?.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-[#21748C]">Surgical History</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {medicalHistory.medicalProfile.surgicalHistory.map((surgery, idx) => (
                              <span key={idx} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                                {surgery}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {medicalHistory?.medicalProfile?.familyHistory && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-[#21748C]">Family History</label>
                        <p className="text-[#16697A] mt-1">{medicalHistory.medicalProfile.familyHistory}</p>
                      </div>
                    )}
                    {medicalHistory?.medicalProfile?.medicalHistory && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-[#21748C]">Medical History</label>
                        <p className="text-[#16697A] mt-1">{medicalHistory.medicalProfile.medicalHistory}</p>
                      </div>
                    )}
                  </div>

                  {/* Latest Vitals */}
                  {medicalHistory?.latestVitals && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-[#16697A] mb-3">Latest Vital Signs</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {medicalHistory.latestVitals.bloodPressure && (
                          <div>
                            <label className="text-sm font-medium text-[#21748C]">BP</label>
                            <p className="text-[#16697A] font-medium">{medicalHistory.latestVitals.bloodPressure}</p>
                          </div>
                        )}
                        {medicalHistory.latestVitals.heartRate && (
                          <div>
                            <label className="text-sm font-medium text-[#21748C]">Heart Rate</label>
                            <p className="text-[#16697A] font-medium">{medicalHistory.latestVitals.heartRate} bpm</p>
                          </div>
                        )}
                        {medicalHistory.latestVitals.temperature && (
                          <div>
                            <label className="text-sm font-medium text-[#21748C]">Temperature</label>
                            <p className="text-[#16697A] font-medium">{medicalHistory.latestVitals.temperature}°F</p>
                          </div>
                        )}
                        {medicalHistory.latestVitals.weight && (
                          <div>
                            <label className="text-sm font-medium text-[#21748C]">Weight</label>
                            <p className="text-[#16697A] font-medium">{medicalHistory.latestVitals.weight} kg</p>
                          </div>
                        )}
                        {medicalHistory.latestVitals.spo2 && (
                          <div>
                            <label className="text-sm font-medium text-[#21748C]">SpO2</label>
                            <p className="text-[#16697A] font-medium">{medicalHistory.latestVitals.spo2}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Previous Consultations */}
                  {medicalHistory?.completeHistory?.consultations?.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-[#16697A] mb-3">Previous Consultations</h3>
                      <div className="space-y-4">
                        {medicalHistory.completeHistory.consultations.map((consultation, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-semibold text-[#16697A]">
                                {new Date(consultation.date).toLocaleDateString()}
                              </span>
                              <span className="text-sm text-[#21748C]">{consultation.specialization}</span>
                            </div>
                            {consultation.diagnosis && (
                              <p className="text-sm text-[#16697A] mb-2">
                                <strong>Diagnosis:</strong> {consultation.diagnosis}
                              </p>
                            )}
                            {consultation.notes && (
                              <p className="text-sm text-[#16697A]">
                                <strong>Notes:</strong> {consultation.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}