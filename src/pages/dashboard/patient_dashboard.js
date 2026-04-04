import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, ArrowLeft, LogOut, Calendar, Clock, User, Stethoscope } from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
console.log(API_BASE_URL);
const TABS = [
  "Overview",
  "Medical History",
  "Appointments",
  "Prescriptions",
  "Lab Results",
  "Consultation History"
];

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [canceling, setCanceling] = useState(false);

  // Add these functions
  const handleCancelClick = (appointment) => {
    console.log(appointment);
    setAppointmentToCancel(appointment);
    setShowCancelModal(true);
  };
  
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setAppointmentToCancel(null);
  };
  
  const confirmCancelAppointment = async () => {
    if (!appointmentToCancel) return;
    
    setCanceling(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await axios.put(
        `${API_BASE_URL}/patient/${userData.username}/cancel?appointmentId=${appointmentToCancel._id}`
      );
  
      if (response.data.success) {
        alert("Appointment cancelled successfully!");
        closeCancelModal();
        // Reload the page to reflect changes
        window.location.reload();
      } else {
        alert("Failed to cancel appointment: " + response.data.message);
      }
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      alert("Error cancelling appointment: " + (err.response?.data?.message || err.message));
    } finally {
      setCanceling(false);
    }
  };
  
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
    }
  }, []);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          navigate("/login");
          return;
        }

        const userData = JSON.parse(storedUser);
        const authToken = localStorage.getItem("authToken");

        const response = await axios.get(
          `${API_BASE_URL}/patients/${userData.username}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        );

        if (response.data.success) {
          const patient = response.data.data;
          setPatientData(patient);
          
          // Check if profile is completed
          if (!patient.profileCompleted) {
            navigate("/complete-profile");
            return;
          }

          // Update localStorage with latest patient data
          const updatedUser = {
            ...userData,
            ...patient.basicInfo,
            ...patient.medicalInfo,
            ...patient.contactInfo,
            latestVitals: patient.latestVitals,
            profileCompleted: patient.profileCompleted
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      } catch (error) {
        console.error("Error fetching patient data:", error);
        if (error.response?.status === 404) {
          navigate("/complete-profile");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    navigate("/explore");
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FCFCF9] text-[#21748C] text-lg">
        Loading your profile...
      </div>
    );
  }

  if (!user || !patientData) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FCFCF9] text-[#21748C] text-lg">
        Unable to load profile data.
      </div>
    );
  }

  // Helper function to format address
  const formatAddress = (address) => {
    if (!address) return "";
    if (typeof address === "string") return address;
    
    const parts = [
      address.street,
      address.city,
      address.state,
      address.pincode,
      address.country
    ].filter(part => part && part.trim() !== "");
    
    return parts.join(", ");
  };

  // Helper function to get latest vitals
  const getLatestVitals = () => {
    if (patientData.latestVitals?.vitalSigns) {
      return patientData.latestVitals.vitalSigns;
    }
    return {
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      weight: ""
    };
  };

  const latestVitals = getLatestVitals();

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function to format time
  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString;
  };

  return (
    <div className="min-h-screen bg-[#F6FAF8]">
      {/* Top navBar */}
      <nav className="w-full bg-[#0E5F73] flex items-center px-6 py-3">
        <button
          onClick={() => navigate('/explore')}
          className="flex items-center text-white text-sm font-medium mr-3"
        >
          <ArrowLeft size={20} className="mr-1" />
          Back
        </button>
        <span className="flex items-center text-[#FDFDFB] text-2xl font-semibold ml-2">
          <span className="inline-flex justify-center items-center rounded-full bg-[#83C6B6] w-7 h-7 mr-2">
            <svg viewBox="0 0 20 20" fill="#FCFCF9" className="w-5 h-5">
              <path d="M10 18s-7.094-5.507-8.708-8.07A5.25 5.25 0 019.98 3.49h.04a5.25 5.25 0 018.687 6.439C17.094 12.493 10 18 10 18z"></path>
            </svg>
          </span>
          My Profile
        </span>
        <div className="flex-1" />
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-[#ECF2F9] hover:bg-[#E4ECF7] shadow px-4 py-2.5 rounded-lg text-[#21748C] font-semibold text-base ml-16"
        >
          <LogOut size={19} /> Logout
        </button>
      </nav>

      {/* Profile Card */}
      <div
        className="bg-white shadow rounded-xl mt-8 mx-auto flex items-center justify-between"
        style={{ maxWidth: 1600, padding: "32px 40px" }}
      >
        <div className="flex items-center">
          <div className="w-22 h-22 min-w-[88px] min-h-[88px] rounded-full bg-gradient-to-tr from-[#21748C] to-[#A7C7B7] flex items-center justify-center text-white text-4xl font-bold mr-8">
            {user.name ? user.name[0] : "U"}
          </div>
          <div className="flex flex-col">
            <span className="text-[#165273] text-3xl font-bold">{user.name}</span>
            <span className="text-[#206B84] mt-1 text-base">{user.email}</span>
            {!!patientData.basicInfo.bloodGroup && !!patientData.basicInfo.gender && (
              <div className="flex gap-2 mt-2">
                {patientData.basicInfo.bloodGroup && (
                  <span className="bg-[#DBF3E6] text-[#4ABDA7] font-medium px-3 py-1 rounded-full text-sm">
                    Blood Type: {patientData.basicInfo.bloodGroup}
                  </span>
                )}
                {patientData.basicInfo.gender && (
                  <span className="bg-[#D2EAF6] text-[#379CB8] font-medium px-3 py-1 rounded-full text-sm">
                    {patientData.basicInfo.gender}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate("/edit_profile")}
          className="flex items-center gap-2 bg-gradient-to-r from-[#2BA2A5] to-[#44BAA0] shadow px-6 py-2.5 rounded-lg text-white font-semibold text-base hover:from-[#219494] hover:to-[#379874] transition"
        >
          <Edit2 size={19} /> Edit Profile
        </button>
      </div>

      {/* Dynamic Tabs Section */}
      <div className="pt-6 px-12" style={{ maxWidth: 1600, margin: "0 auto" }}>
        <div className="flex items-center gap-0 bg-[#EEF4F0] rounded-xl p-1">
          {TABS.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={`flex-1 transition text-base font-semibold py-2
                ${activeTab === idx
                  ? "bg-white shadow rounded-lg text-[#18788E]"
                  : "text-[#21748C]"
                }`}
              style={{
                margin: "0 3px",
                minWidth: "200px",
                fontWeight: activeTab === idx ? "600" : "500"
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-8 px-12" style={{ maxWidth: 1600, margin: "0 auto" }}>
        {activeTab === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl p-8 shadow flex flex-col min-h-[290px]">
              <h2 className="text-2xl font-semibold text-[#16697A] flex items-center gap-3">
                <User size={28} />
                Personal Information
              </h2>
              <ul className="mt-4 space-y-3 text-[#16697A] text-lg">
                <li className="flex items-center gap-2">
                  <svg width="22" height="22" fill="none" stroke="#16697A" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16v16H4z" /><path d="M22 6l-10 7L2 6" /></svg>
                  {patientData.basicInfo.email || ""}
                </li>
                <li className="flex items-center gap-2">
                  <svg width="22" height="22" fill="none" stroke="#16697A" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M15 11l-3 3-1-1" /></svg>
                  {patientData.basicInfo.phoneNo || ""}
                </li>
                <li className="flex items-center gap-2">
                  <Calendar size={20} />
                  DOB: {formatDate(patientData.basicInfo.dateOfBirth)}
                </li>
                <li className="flex items-center gap-2">
                  <svg width="20" height="20" fill="none" stroke="#16697A" strokeWidth="2" viewBox="0 0 24 24"><path d="M5.121 18.364A9 9 0 0020.485 7.95" /></svg>
                  {formatAddress(patientData.contactInfo.address) || "No address provided"}
                </li>
              </ul>
            </div>

            {/* Health Statistics */}
            <div className="bg-white rounded-xl p-8 shadow flex flex-col min-h-[290px]">
              <h2 className="text-2xl font-semibold text-[#16697A] flex items-center gap-3">
                <Stethoscope size={28} />
                Health Statistics
              </h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-0 mt-4 text-[#16697A] text-lg">
                <div>
                  <div className="font-medium">Height</div>
                  <div className="font-bold text-2xl mt-1">{patientData.medicalInfo.height || "N/A"} cm</div>
                </div>
                <div>
                  <div className="font-medium">Weight</div>
                  <div className="font-bold text-2xl mt-1">{patientData.medicalInfo.weight || "N/A"} kg</div>
                </div>
                <div>
                  <div className="font-medium">Blood Type</div>
                  <div className="font-bold text-2xl mt-1">{patientData.basicInfo.bloodGroup || "N/A"}</div>
                </div>
                <div>
                  <div className="font-medium">BMI</div>
                  <div className="font-bold text-2xl mt-1">{patientData.medicalInfo.bmi || "N/A"}</div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white rounded-xl p-8 shadow flex flex-col min-h-[290px]">
              <h2 className="text-2xl font-semibold text-[#16697A] flex items-center gap-3">
                <span className="text-red-500">
                  <svg width="22" height="22" fill="none" stroke="red" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
                </span>
                Emergency Contact
              </h2>
              <div className="mt-4 text-[#16697A] text-lg">
                <div className="mb-1"><span className="font-semibold">Name</span><br />{patientData.contactInfo.emergencyContact?.name || "N/A"}</div>
                <div className="mb-1"><span className="font-semibold">Relationship</span><br />{patientData.contactInfo.emergencyContact?.relationship || "N/A"}</div>
                <div className="mb-1"><span className="font-semibold">Phone</span><br />{patientData.contactInfo.emergencyContact?.phoneNo || "N/A"}</div>
                {patientData.contactInfo.emergencyContact?.email && (
                  <div className="mb-1"><span className="font-semibold">Email</span><br />{patientData.contactInfo.emergencyContact.email}</div>
                )}
              </div>
            </div>

            {/* Latest Vital Signs */}
            <div className="bg-white rounded-xl p-8 shadow flex flex-col min-h-[290px]">
              <h2 className="text-2xl font-semibold text-[#16697A] flex items-center gap-3">
                <svg width="28" height="28" fill="none" stroke="#16697A" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 21C6.477 21 2 16.523 2 11V6.303A1 1 0 013.658 5.05l1.394.696a7 7 0 005.482 0l1.394-.696A1 1 0 0112 6.303V11c0 5.523 4.477 10 10 10h0a1 1 0 001-1v-1c0-.47-.33-.87-.797-.982A10.943 10.943 0 0112 21z" /></svg>
                Latest Vital Signs
              </h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-0 mt-4 text-[#16697A] text-lg">
                <div>
                  <div className="font-medium">Blood Pressure</div>
                  <div className="font-bold text-2xl mt-1">{latestVitals.bloodPressure || "N/A"}</div>
                </div>
                <div>
                  <div className="font-medium">Heart Rate</div>
                  <div className="font-bold text-2xl mt-1">{latestVitals.heartRate ? `${latestVitals.heartRate} bpm` : "N/A"}</div>
                </div>
                <div>
                  <div className="font-medium">Temperature</div>
                  <div className="font-bold text-2xl mt-1">{latestVitals.temperature ? `${latestVitals.temperature} °F` : "N/A"}</div>
                </div>
                <div>
                  <div className="font-medium">Weight</div>
                  <div className="font-bold text-2xl mt-1">{latestVitals.weight ? `${latestVitals.weight} kg` : "N/A"}</div>
                </div>
              </div>
              <div className="text-sm mt-4 text-[#8AA0A6]">
                Last updated: {patientData.latestVitals?.date ? formatDate(patientData.latestVitals.date) : "No records available"}
                {patientData.latestVitals?.doctor && ` by Dr. ${patientData.latestVitals.doctor}`}
              </div>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="bg-white rounded-xl p-8 shadow">
            <h2 className="text-2xl font-semibold text-[#16697A] mb-6">Medical History</h2>
            <div className="space-y-8">
              {/* Medical History */}
              <div>
                <h3 className="text-xl font-semibold text-[#21748C] mb-4">Medical History</h3>
                <p className="text-[#16697A] bg-gray-50 p-4 rounded-lg">
                  {patientData.medicalInfo.medicalHistory || "No medical history recorded."}
                </p>
              </div>

              {/* Allergies */}
              <div>
                <h3 className="text-xl font-semibold text-[#21748C] mb-4">Allergies</h3>
                {patientData.medicalInfo.allergies && patientData.medicalInfo.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patientData.medicalInfo.allergies.map((allergy, index) => (
                      <span key={index} className="bg-[#FFE6E6] text-[#D32F2F] px-3 py-2 rounded-full text-sm font-medium">
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#16697A]">No allergies recorded.</p>
                )}
              </div>

              {/* Current Medications */}
              <div>
                <h3 className="text-xl font-semibold text-[#21748C] mb-4">Current Medications</h3>
                {patientData.medicalInfo.currentMedications && patientData.medicalInfo.currentMedications.length > 0 ? (
                  <div className="space-y-2">
                    {patientData.medicalInfo.currentMedications.map((medication, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-[#16697A] font-medium">{medication}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#16697A]">No current medications.</p>
                )}
              </div>

              {/* Chronic Conditions */}
              <div>
                <h3 className="text-xl font-semibold text-[#21748C] mb-4">Chronic Conditions</h3>
                {patientData.medicalInfo.chronicConditions && patientData.medicalInfo.chronicConditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patientData.medicalInfo.chronicConditions.map((condition, index) => (
                      <span key={index} className="bg-[#E3F2FD] text-[#1976D2] px-3 py-2 rounded-full text-sm font-medium">
                        {condition}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#16697A]">No chronic conditions recorded.</p>
                )}
              </div>

              {/* Family History */}
              <div>
                <h3 className="text-xl font-semibold text-[#21748C] mb-4">Family History</h3>
                <p className="text-[#16697A] bg-gray-50 p-4 rounded-lg">
                  {patientData.medicalInfo.familyHistory || "No family history recorded."}
                </p>
              </div>

              {/* Surgical History */}
              <div>
                <h3 className="text-xl font-semibold text-[#21748C] mb-4">Surgical History</h3>
                {patientData.medicalInfo.surgicalHistory && patientData.medicalInfo.surgicalHistory.length > 0 ? (
                  <div className="space-y-2">
                    {patientData.medicalInfo.surgicalHistory.map((surgery, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-[#16697A]">{surgery}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#16697A]">No surgical history recorded.</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 2 && (
          <div className="bg-white rounded-xl p-8 shadow">
            <h2 className="text-2xl font-semibold text-[#16697A] mb-6">Appointments</h2>
            
            {/* Upcoming Appointments */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-[#21748C] mb-4">Upcoming Appointments</h3>
              {patientData.upcomingAppointments && patientData.upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {patientData.upcomingAppointments.map((appointment, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-[#16697A] text-lg">{appointment.doctorName}</h4>
                          <p className="text-[#21748C]">{appointment.doctorSpecialization}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {appointment.status}
                          </span>
                          
                          {/* Cancel Button - Only show for scheduled/confirmed appointments */}
                          {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                            <button
                              onClick={() => handleCancelClick(appointment)}
                              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-[#21748C]">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>{formatDate(appointment.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} />
                          <span>{appointment.timeSlot}</span>
                        </div>
                      </div>
                      {appointment.reason && (
                        <div className="mt-3">
                          <p className="text-[#21748C]"><strong>Reason:</strong> {appointment.reason}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#21748C]">No upcoming appointments.</p>
              )}
            </div>
        
            {/* Appointment Statistics */}
            <div>
              <h3 className="text-xl font-semibold text-[#21748C] mb-4">Appointment Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#E8F5E8] p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#2E7D32]">{patientData.statistics.totalAppointments}</div>
                  <div className="text-[#21748C] text-sm">Total Appointments</div>
                </div>
                <div className="bg-[#E3F2FD] p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#1976D2]">{patientData.statistics.completedConsultations}</div>
                  <div className="text-[#21748C] text-sm">Completed</div>
                </div>
                <div className="bg-[#FFF3E0] p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#F57C00]">{patientData.statistics.statusBreakdown.scheduled || 0}</div>
                  <div className="text-[#21748C] text-sm">Scheduled</div>
                </div>
                <div className="bg-[#FCE4EC] p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#C2185B]">{patientData.statistics.statusBreakdown.cancelled || 0}</div>
                  <div className="text-[#21748C] text-sm">Cancelled</div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 3 && (
          <div className="bg-white rounded-xl p-8 shadow">
            <h2 className="text-2xl font-semibold text-[#16697A] mb-6">Prescriptions</h2>
            
            {patientData.consultationHistory && patientData.consultationHistory.length > 0 ? (
              <div className="space-y-6">
                {/* Filter consultations that have prescriptions */}
                {patientData.consultationHistory
                  .filter(consultation => 
                    consultation.consultation && 
                    consultation.consultation.prescriptions && // Changed from prescription to prescriptions
                    consultation.consultation.prescriptions.length > 0
                  )
                  .map((consultation, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      {/* Doctor and Date Header */}
                      <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                        <div>
                          <h3 className="font-semibold text-[#16697A] text-lg">Dr. {consultation.doctor.name}</h3>
                          <p className="text-[#21748C]">{consultation.doctor.specialization}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm text-[#21748C]">
                            <Calendar size={16} />
                            <span>{formatDate(consultation.date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[#21748C]">
                            <Clock size={16} />
                            <span>{formatTime(consultation.timeSlot)}</span>
                          </div>
                        </div>
                      </div>
        
                      {/* Diagnosis */}
                      {consultation.consultation.diagnosis && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-[#21748C] mb-2">Diagnosis</h4>
                          <p className="text-[#16697A] bg-gray-50 p-3 rounded">{consultation.consultation.diagnosis}</p>
                        </div>
                      )}
        
                      {/* Prescriptions List */}
                      <div>
                        <h4 className="font-semibold text-[#21748C] mb-4">Prescribed Medications</h4>
                        <div className="space-y-4">
                          {consultation.consultation.prescriptions.map((prescription, idx) => ( // Changed from prescription to prescriptions
                            <div key={idx} className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-100">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <h5 className="font-bold text-lg text-[#16697A] mb-1">{prescription.medicine}</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                    <div>
                                      <span className="font-medium text-[#21748C]">Dosage:</span>
                                      <span className="ml-2 text-[#16697A]">{prescription.dosage}</span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-[#21748C]">Frequency:</span>
                                      <span className="ml-2 text-[#16697A]">{prescription.frequency}</span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-[#21748C]">Duration:</span>
                                      <span className="ml-2 text-[#16697A]">{prescription.duration}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-white px-3 py-1 rounded-full border border-blue-200">
                                  <span className="text-sm font-medium text-[#21748C]">
                                    {(() => {
                                      const duration = prescription.duration.toLowerCase();
                                      if (duration.includes('day')) return 'Daily';
                                      if (duration.includes('week')) return 'Weekly';
                                      if (duration.includes('month')) return 'Monthly';
                                      return 'As directed';
                                    })()}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Instructions Summary */}
                              <div className="bg-white p-3 rounded border border-blue-100">
                                <p className="text-sm text-[#16697A]">
                                  <strong>Instructions:</strong> Take {prescription.dosage} {prescription.frequency.toLowerCase()} for {prescription.duration}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
        
                      {/* Doctor's Notes */}
                      {consultation.consultation.notes && (
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <h4 className="font-semibold text-[#21748C] mb-2">Doctor's Instructions</h4>
                          <p className="text-[#16697A] whitespace-pre-wrap">{consultation.consultation.notes}</p>
                        </div>
                      )}
        
                      {/* Follow-up Information */}
                      {consultation.consultation.followUpDate && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-[#21748C]">
                          <Calendar size={16} />
                          <span>
                            <strong>Follow-up:</strong> {formatDate(consultation.consultation.followUpDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                }
        
                {/* No Prescriptions Message */}
                {patientData.consultationHistory.filter(consultation => 
                  consultation.consultation && 
                  consultation.consultation.prescriptions && // Changed from prescription to prescriptions
                  consultation.consultation.prescriptions.length > 0
                ).length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-[#21748C] text-lg mb-2">No Prescriptions Found</div>
                    <p className="text-gray-500">You don't have any prescriptions yet. Prescriptions will appear here after your consultations.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-[#21748C] text-lg mb-2">No Consultation History</div>
                <p className="text-gray-500">Your prescriptions will appear here after consultations with doctors.</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 4 && (
          <div className="bg-white rounded-xl p-8 shadow">
            <h2 className="text-2xl font-semibold text-[#16697A] mb-6">Lab Results</h2>
            
            {patientData.consultationHistory && patientData.consultationHistory.length > 0 ? (
              <div className="space-y-6">
                {/* Filter consultations that have lab tests recommended */}
                {patientData.consultationHistory
                  .filter(consultation => 
                    consultation.consultation && 
                    consultation.consultation.testsRecommended && 
                    consultation.consultation.testsRecommended.length > 0
                  )
                  .map((consultation, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-[#16697A] text-lg">Dr. {consultation.doctor.name}</h3>
                          <p className="text-[#21748C]">{consultation.doctor.specialization}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm text-[#21748C]">
                            <Calendar size={16} />
                            <span>{formatDate(consultation.date)}</span>
                          </div>
                        </div>
                      </div>
        
                      {/* Tests Recommended */}
                      <div>
                        <h4 className="font-semibold text-[#21748C] mb-3">Recommended Tests</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {consultation.consultation.testsRecommended.map((test, idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-[#16697A]">{test}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  test.toLowerCase().includes('complete') ? 'bg-green-100 text-green-800' :
                                  test.toLowerCase().includes('pending') ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {test.toLowerCase().includes('complete') ? 'Completed' :
                                   test.toLowerCase().includes('pending') ? 'Pending' : 'Recommended'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
        
                      {/* Diagnosis Context */}
                      {consultation.consultation.diagnosis && (
                        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                          <p className="text-sm text-[#16697A]">
                            <strong>Reason for tests:</strong> {consultation.consultation.diagnosis}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                }
        
                {/* No Lab Tests Message */}
                {patientData.consultationHistory.filter(consultation => 
                  consultation.consultation && 
                  consultation.consultation.testsRecommended && 
                  consultation.consultation.testsRecommended.length > 0
                ).length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-[#21748C] text-lg mb-2">No Lab Tests Recommended</div>
                    <p className="text-gray-500">Your doctor will recommend lab tests here when needed during consultations.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-[#21748C] text-lg mb-2">No Lab Results</div>
                <p className="text-gray-500">Your lab results and recommended tests will appear here after consultations.</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 5 && (
          <div className="bg-white rounded-xl p-8 shadow">
            <h2 className="text-2xl font-semibold text-[#16697A] mb-6">Consultation History</h2>
            {patientData.consultationHistory && patientData.consultationHistory.length > 0 ? (
              <div className="space-y-6">
                {patientData.consultationHistory.map((consultation, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-[#16697A] text-lg">Dr. {consultation.doctor.name}</h3>
                        <p className="text-[#21748C]">{consultation.doctor.specialization}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm text-[#21748C]">
                          <Calendar size={16} />
                          <span>{formatDate(consultation.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#21748C]">
                          <Clock size={16} />
                          <span>{formatTime(consultation.timeSlot)}</span>
                        </div>
                      </div>
                    </div>
        
                    {consultation.consultation && (
                      <div className="space-y-4">
                        {/* Diagnosis */}
                        {consultation.consultation.diagnosis && (
                          <div>
                            <h4 className="font-semibold text-[#21748C] mb-2">Diagnosis</h4>
                            <p className="text-[#16697A] bg-gray-50 p-3 rounded">{consultation.consultation.diagnosis}</p>
                          </div>
                        )}
        
                        {/* Vital Signs */}
                        {consultation.consultation.vitalSigns && Object.keys(consultation.consultation.vitalSigns).length > 0 && (
                          <div>
                            <h4 className="font-semibold text-[#21748C] mb-2">Vital Signs</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {consultation.consultation.vitalSigns.bloodPressure && (
                                <div className="text-center">
                                  <div className="text-sm text-[#21748C]">BP</div>
                                  <div className="font-semibold text-[#16697A]">{consultation.consultation.vitalSigns.bloodPressure}</div>
                                </div>
                              )}
                              {consultation.consultation.vitalSigns.heartRate && (
                                <div className="text-center">
                                  <div className="text-sm text-[#21748C]">Heart Rate</div>
                                  <div className="font-semibold text-[#16697A]">{consultation.consultation.vitalSigns.heartRate} bpm</div>
                                </div>
                              )}
                              {consultation.consultation.vitalSigns.temperature && (
                                <div className="text-center">
                                  <div className="text-sm text-[#21748C]">Temperature</div>
                                  <div className="font-semibold text-[#16697A]">{consultation.consultation.vitalSigns.temperature}°F</div>
                                </div>
                              )}
                              {consultation.consultation.vitalSigns.weight && (
                                <div className="text-center">
                                  <div className="text-sm text-[#21748C]">Weight</div>
                                  <div className="font-semibold text-[#16697A]">{consultation.consultation.vitalSigns.weight} kg</div>
                                </div>
                              )}
                              {consultation.consultation.vitalSigns.spo2 && (
                                <div className="text-center">
                                  <div className="text-sm text-[#21748C]">SpO2</div>
                                  <div className="font-semibold text-[#16697A]">{consultation.consultation.vitalSigns.spo2}%</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
        
                        {/* Prescriptions */}
                        {consultation.consultation.prescriptions && consultation.consultation.prescriptions.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-[#21748C] mb-2">Prescriptions</h4>
                            <div className="space-y-2">
                              {consultation.consultation.prescriptions.map((prescription, idx) => (
                                <div key={idx} className="bg-blue-50 p-3 rounded border border-blue-200">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <h5 className="font-semibold text-[#16697A]">{prescription.medicine}</h5>
                                      <p className="text-sm text-[#21748C]">{prescription.dosage} • {prescription.frequency}</p>
                                    </div>
                                    <span className="text-sm text-[#21748C] bg-white px-2 py-1 rounded border">
                                      {prescription.duration}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
        
                        {/* Tests Recommended */}
                        {consultation.consultation.testsRecommended && consultation.consultation.testsRecommended.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-[#21748C] mb-2">Tests Recommended</h4>
                            <div className="flex flex-wrap gap-2">
                              {consultation.consultation.testsRecommended.map((test, idx) => (
                                <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                  {test}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
        
                        {/* Follow-up Date */}
                        {consultation.consultation.followUpDate && (
                          <div>
                            <h4 className="font-semibold text-[#21748C] mb-2">Follow-up Date</h4>
                            <p className="text-[#16697A] bg-gray-50 p-3 rounded">
                              {formatDate(consultation.consultation.followUpDate)}
                            </p>
                          </div>
                        )}
        
                        {/* Notes */}
                        {consultation.consultation.notes && (
                          <div>
                            <h4 className="font-semibold text-[#21748C] mb-2">Doctor's Notes</h4>
                            <p className="text-[#16697A] bg-gray-50 p-3 rounded whitespace-pre-wrap">
                              {consultation.consultation.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#21748C]">No consultation history available.</p>
            )}
          </div>
        )}
        {showCancelModal && appointmentToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-2 rounded-full">
                  <svg width="24" height="24" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[#16697A]">Cancel Appointment</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-2">
                  Are you sure you want to cancel your appointment with <strong>Dr. {appointmentToCancel.doctorName}</strong>?
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Date:</strong> {formatDate(appointmentToCancel.date)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Time:</strong> {appointmentToCancel.timeSlot}
                  </p>
                  {appointmentToCancel.reason && (
                    <p className="text-sm text-gray-600">
                      <strong>Reason:</strong> {appointmentToCancel.reason}
                    </p>
                  )}
                </div>
                <p className="text-red-600 text-sm mt-3 font-medium">
                  This action cannot be undone.
                </p>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={closeCancelModal}
                  disabled={canceling}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Keep Appointment
                </button>
                <button
                  onClick={confirmCancelAppointment}
                  disabled={canceling}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                >
                  {canceling ? "Cancelling..." : "Yes, Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}