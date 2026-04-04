import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, ArrowLeft, LogOut, Calendar, Clock, User, Stethoscope, Settings, Plus, X, Eye } from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const TABS = [
  "Overview",
  "Upcoming Appointments", 
  "Set Schedule",
  "View Schedule",
  "Override Schedule"
];

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [overrideDate, setOverrideDate] = useState("");
  const [overrideWorking, setOverrideWorking] = useState(true);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideSlots, setOverrideSlots] = useState([{ startTime: "", endTime: "", maxPatients: 1 }]);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentStatus, setAppointmentStatus] = useState('all');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [searchPatientName, setSearchPatientName] = useState('');
  const [includePastAppointments, setIncludePastAppointments] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [showQuickBookModal, setShowQuickBookModal] = useState(false);
  const [quickBookForm, setQuickBookForm] = useState({
    patientName: '',
    patientAge: '',
    patientEmail: '',
    patientPhone: '',
    date: '',
    timeSlot: '',
    reason: '',
    symptoms: []
  });
  const [quickBookLoading, setQuickBookLoading] = useState(false);
  const [quickBookAvailableSlots, setQuickBookAvailableSlots] = useState([]);
  const [quickBookAvailabilityInfo, setQuickBookAvailabilityInfo] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAppointment, setPaymentAppointment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(500);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
    }
  }, []);

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          navigate("/login");
          return;
        }

        const userData = JSON.parse(storedUser);
        const authToken = localStorage.getItem("authToken");

        const response = await axios.get(
          `${API_BASE_URL}/doctors/${userData.username}`
        );

        if (response.data.success) {
          const doctor = response.data.data;
          if (!doctor.profileCompleted) {
            navigate("/complete-doctor-profile");
            return;
          }
          setDoctorData(doctor);
          
          // Initialize weekly schedule from doctor data
          if (doctor.weeklySchedule && doctor.weeklySchedule.length > 0) {
            setWeeklySchedule(doctor.weeklySchedule);
          } else {
            // Initialize empty weekly schedule with all days
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const emptySchedule = days.map(day => ({
              day,
              isWorking: false,
              slots: []
            }));
            setWeeklySchedule(emptySchedule);
          }

          const updatedUser = {
            ...userData,
            ...doctor,
            profileCompleted: true
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      } catch (error) {
        console.error("Error fetching doctor data:", error);
        if (error.response?.status === 404) {
          navigate("/complete-doctor-profile");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 1 && user) {
      fetchAppointments();
    }
  }, [activeTab, user]);
  const loadCashfreeSDK = () => {
    return new Promise((resolve, reject) => {
      if (window.Cashfree) {
        resolve(window.Cashfree);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.onload = () => {
        resolve(window.Cashfree);
      };
      script.onerror = () => {
        reject(new Error('Failed to load Cashfree SDK'));
      };
      document.head.appendChild(script);
    });
  };

  const fetchQuickBookSlots = async (date) => {
    if (!date) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/doctors/schedule/availability`, {
        params: { username: user.username, date }
      });
      if (response.data.success) {
        setQuickBookAvailabilityInfo(response.data.data);
        setQuickBookAvailableSlots(response.data.data.availableSlots.filter(s => s.available));
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };
  const handleQuickBook = async (e) => {
    e.preventDefault();
    setQuickBookLoading(true);
    try {
      const payload = {
        ...quickBookForm,
        doctorId: doctorData.id,
        symptoms: quickBookForm.symptoms.filter(s => s.trim())
      };
      const response = await axios.post(`${API_BASE_URL}/book-quick-appointment`, payload);
      if (response.data.success) {
        alert('Appointment booked successfully!');
        setShowQuickBookModal(false);
        // Refresh appointments list
        fetchAppointments();
        // Reset form
        setQuickBookForm({
          patientName: '', patientAge: '', patientEmail: '', patientPhone: '',
          date: '', timeSlot: '', reason: '', symptoms: []
        });
        setQuickBookAvailableSlots([]);
        setQuickBookAvailabilityInfo(null);
      } else {
        alert(response.data.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error(error);
      alert('Error booking appointment');
    } finally {
      setQuickBookLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    navigate("/explore");
    window.location.reload();
  };

  const handleWeeklyScheduleUpdate = async () => {
    try {
      const authToken = localStorage.getItem("authToken");
      const response = await axios.post(
        `${API_BASE_URL}/doctors/schedule/weekly`,
        {
          username: user.username,
          weeklySchedule: weeklySchedule
        }
      );

      if (response.data.success) {
        alert("Weekly schedule updated successfully!");
        setDoctorData(prev => ({
          ...prev,
          weeklySchedule: response.data.data.weeklySchedule
        }));
      }
    } catch (error) {
      console.error("Error updating weekly schedule:", error);
      alert("Failed to update schedule: " + error.response?.data?.message || error.message);
    }
  };

  const handleOverrideSchedule = async () => {
    try {
      const authToken = localStorage.getItem("authToken");
      const response = await axios.post(
        `${API_BASE_URL}/doctors/schedule/override`,
        {
          username: user.username,
          date: overrideDate,
          isWorking: overrideWorking,
          reason: overrideReason,
          slots: overrideWorking ? overrideSlots : []
        }
      );

      if (response.data.success) {
        alert("Schedule override added successfully!");
        // Reset form
        setOverrideDate("");
        setOverrideWorking(true);
        setOverrideReason("");
        setOverrideSlots([{ startTime: "", endTime: "", maxPatients: 1 }]);
      }
    } catch (error) {
      console.error("Error adding schedule override:", error);
      alert("Failed to add override: " + error.response?.data?.message || error.message);
    }
  };

  const toggleDayWorking = (dayIndex) => {
    const updatedSchedule = [...weeklySchedule];
    updatedSchedule[dayIndex].isWorking = !updatedSchedule[dayIndex].isWorking;
    
    if (updatedSchedule[dayIndex].isWorking && updatedSchedule[dayIndex].slots.length === 0) {
      updatedSchedule[dayIndex].slots = [{ startTime: "09:00", endTime: "10:00", maxPatients: 1 }];
    } else if (!updatedSchedule[dayIndex].isWorking) {
      updatedSchedule[dayIndex].slots = [];
    }
    
    setWeeklySchedule(updatedSchedule);
  };

  const addTimeSlot = (dayIndex) => {
    const updatedSchedule = [...weeklySchedule];
    updatedSchedule[dayIndex].slots.push({ startTime: "", endTime: "", maxPatients: 1 });
    setWeeklySchedule(updatedSchedule);
  };

  const removeTimeSlot = (dayIndex, slotIndex) => {
    const updatedSchedule = [...weeklySchedule];
    updatedSchedule[dayIndex].slots.splice(slotIndex, 1);
    setWeeklySchedule(updatedSchedule);
  };

  const updateTimeSlot = (dayIndex, slotIndex, field, value) => {
    const updatedSchedule = [...weeklySchedule];
    updatedSchedule[dayIndex].slots[slotIndex][field] = value;
    setWeeklySchedule(updatedSchedule);
  };

  const addOverrideSlot = () => {
    setOverrideSlots([...overrideSlots, { startTime: "", endTime: "", maxPatients: 1 }]);
  };

  const removeOverrideSlot = (index) => {
    const updatedSlots = [...overrideSlots];
    updatedSlots.splice(index, 1);
    setOverrideSlots(updatedSlots);
  };

  const updateOverrideSlot = (index, field, value) => {
    const updatedSlots = [...overrideSlots];
    updatedSlots[index][field] = value;
    setOverrideSlots(updatedSlots);
  };

  // Calculate schedule statistics
  const getScheduleStats = () => {
    const workingDays = weeklySchedule.filter(day => day.isWorking).length;
    const totalSlots = weeklySchedule.reduce((total, day) => total + day.slots.length, 0);
    const totalCapacity = weeklySchedule.reduce((total, day) => 
      total + day.slots.reduce((dayTotal, slot) => dayTotal + (slot.maxPatients || 1), 0), 0
    );
    
    return { workingDays, totalSlots, totalCapacity };
  };

  const fetchAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const params = new URLSearchParams();
      if (appointmentStatus !== 'all') params.append('status', appointmentStatus);
      if (appointmentDate) params.append('date', appointmentDate);
      if (searchPatientName) params.append('patientName', searchPatientName);
      if (includePastAppointments) params.append('includePast', 'true');
      params.append('limit', '20');
      params.append('page', pagination?.page || '1');
  
      const response = await axios.get(
        `${API_BASE_URL}/doctors/${user.username}/appointments/upcoming?${params}`
      );
  
      if (response.data.success) {
        setAppointments(response.data.data.appointments);
        setPagination({
        ...response.data.data.pagination,
        totalEarnings: response.data.data.statistics.totalEarnings
      });
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      alert('Failed to fetch appointments: ' + error.response?.data?.message || error.message);
    } finally {
      setLoadingAppointments(false);
    }
  };
  
  const clearFilters = () => {
    setAppointmentStatus('all');
    setAppointmentDate('');
    setSearchPatientName('');
    setIncludePastAppointments(false);
    fetchAppointments();
  };
  
  const handlePageChange = (newPage) => {
    if (pagination) {
      setPagination({ ...pagination, page: newPage });
      // Re-fetch appointments with new page
      fetchAppointments();
    }
  };
  const formatTimeSlot = (timeSlot) => {
    const [start, end] = timeSlot.split('-');
    const formatTime = (time) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };
    return `${formatTime(start)} - ${formatTime(end)}`;
  };
  const handleConfirmPayment = async () => {
    if (!paymentAppointment || paymentAmount <= 0) return;
    setPaymentProcessing(true);
    try {
      console.log(paymentAppointment);
      // Create payment order using the amount
      const orderRes = await axios.post(`${API_BASE_URL}/create-quick-payment-order`, {
        appointmentId: paymentAppointment.appointmentId,
        amount: paymentAmount
      });
  
      const { payment_session_id } = orderRes.data.data;
  
      // Close the amount modal
      setShowPaymentModal(false);
      setPaymentAppointment(null);
  
      // Load Cashfree SDK and open modal
      const CashfreeSDK = await loadCashfreeSDK();
      const cashfree = CashfreeSDK({
        mode: process.env.REACT_APP_CASHFREE_MODE || "sandbox"
      });
  
      // Polling for payment status
      let pollInterval = setInterval(async () => {
        try {
          const statusRes = await axios.get(`${API_BASE_URL}/appointments/${paymentAppointment.appointmentId}/status`);
          if (statusRes.data.status === 'completed') {
            clearInterval(pollInterval);
            alert('Payment successful! Appointment confirmed.');
            fetchAppointments(); // refresh list
          } else if (statusRes.data.status === 'cancelled' || statusRes.data.status === 'failed') {
            clearInterval(pollInterval);
            alert('Payment failed. Please try again.');
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 3000);
  
      const timeout = setTimeout(() => {
        if (pollInterval) {
          clearInterval(pollInterval);
          alert('Payment verification timeout. Please contact support if amount was deducted.');
        }
      }, 120000);
  
      // Open Cashfree checkout
      cashfree.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget: "_modal",
        onSuccess: (data) => {
          console.log('Payment success:', data);
          // The webhook will update the appointment; polling will catch it
        },
        onFailure: (data) => {
          console.error('Payment failure:', data);
          clearInterval(pollInterval);
          clearTimeout(timeout);
          alert('Payment failed. Please try again.');
        },
        onClose: () => {
          console.log('Checkout closed');
          // Optionally clean up
          clearInterval(pollInterval);
          clearTimeout(timeout);
        }
      });
  
    } catch (error) {
      console.error('Payment initiation error:', error);
      alert('Could not initiate payment: ' + error.message);
    }
  };
  const viewAppointmentDetails = (appointmentId, status) => {
    if (['completed', 'cancelled', 'no-show'].includes(status)) {
      // Navigate to DoneAppointment page for completed/cancelled appointments
      navigate(`/done-appointment/${appointmentId}`);
    } else {
      // Navigate to Consultation page for active appointments
      navigate(`/consultation/${appointmentId}`);
    }
  };
  
  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/appointments/${appointmentId}/status`,
        { status: newStatus }
      );
  
      if (response.data.success) {
        alert('Appointment status updated successfully!');
        fetchAppointments(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert('Failed to update appointment status: ' + error.response?.data?.message || error.message);
    }
  };
  

  const scheduleStats = getScheduleStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FCFCF9] text-[#21748C] text-lg">
        Loading your profile...
      </div>
    );
  }

  if (!user || !doctorData) {
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

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[#F6FAF8]">
      {/* Top navBar */}
      <nav className="w-full bg-[#0E5F73] flex items-center px-6 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-white text-sm font-medium mr-3"
        >
          <ArrowLeft size={20} className="mr-1" />
          Back
        </button>
        <span className="flex items-center text-[#FDFDFB] text-2xl font-semibold ml-2">
          <span className="inline-flex justify-center items-center rounded-full bg-[#83C6B6] w-7 h-7 mr-2">
            <Stethoscope size={16} color="#FCFCF9" />
          </span>
          Doctor Dashboard
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
          {user.profilePhoto ? (
            <img 
              src={user.profilePhoto} 
              alt="Profile" 
              className="w-20 h-20 min-w-[80px] min-h-[80px] rounded-full object-cover mr-8"
            />
          ) : (
            <div className="w-20 h-20 min-w-[80px] min-h-[80px] rounded-full bg-gradient-to-tr from-[#21748C] to-[#A7C7B7] flex items-center justify-center text-white text-3xl font-bold mr-8">
              {user.fullName ? user.fullName[0] : "D"}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-[#165273] text-3xl font-bold">Dr. {user.fullName}</span>
            <span className="text-[#206B84] mt-1 text-base">{user.email}</span>
            <div className="flex gap-2 mt-2">
              <span className="bg-[#DBF3E6] text-[#4ABDA7] font-medium px-3 py-1 rounded-full text-sm">
                {doctorData.specialization}
              </span>
              <span className="bg-[#D2EAF6] text-[#379CB8] font-medium px-3 py-1 rounded-full text-sm">
                {doctorData.totalExperience || 0} years experience
              </span>
              {doctorData.isVerified && (
                <span className="bg-[#E8F5E8] text-[#2E7D32] font-medium px-3 py-1 rounded-full text-sm">
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate("/edit_profile_doc")}
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
            {/* Professional Information */}
            <div className="bg-white rounded-xl p-8 shadow flex flex-col min-h-[290px]">
              <h2 className="text-2xl font-semibold text-[#16697A] flex items-center gap-3">
                <User size={28} />
                Professional Information
              </h2>
              <ul className="mt-4 space-y-3 text-[#16697A] text-lg">
                <li className="flex items-center gap-2">
                  <svg width="22" height="22" fill="none" stroke="#16697A" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16v16H4z" /><path d="M22 6l-10 7L2 6" /></svg>
                  {doctorData.email || ""}
                </li>
                <li className="flex items-center gap-2">
                  <svg width="22" height="22" fill="none" stroke="#16697A" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M15 11l-3 3-1-1" /></svg>
                  {doctorData.phoneNo || ""}
                </li>
                <li className="flex items-center gap-2">
                  <Calendar size={20} />
                  Registration: {doctorData.registrationNumber || "N/A"}
                </li>
                <li className="flex items-center gap-2">
                  <svg width="20" height="20" fill="none" stroke="#16697A" strokeWidth="2" viewBox="0 0 24 24"><path d="M5.121 18.364A9 9 0 0020.485 7.95" /></svg>
                  {formatAddress(doctorData.address) || "No address provided"}
                </li>
                <li className="flex items-center gap-2">
                    <svg width="20" height="20" fill="none" stroke="#16697A" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2a3 3 0 013 3c0 1.5-3 5-3 5S9 6.5 9 5a3 3 0 013-3z" /><path d="M12 22s8-4 8-10a8 8 0 10-16 0c0 6 8 10 8 10z" /></svg>
                    Languages: {doctorData.languages && doctorData.languages.length > 0 
                      ? doctorData.languages.join(", ") 
                      : "Not specified"}
                  </li>
                </ul>
              </div>

            {/* Specialization & Qualifications */}
            <div className="bg-white rounded-xl p-8 shadow flex flex-col min-h-[290px]">
              <h2 className="text-2xl font-semibold text-[#16697A] flex items-center gap-3">
                <Stethoscope size={28} />
                Specialization & Qualifications
              </h2>
              <div className="mt-4 space-y-4 text-[#16697A] text-lg">
                <div>
                  <div className="font-medium">Specialization</div>
                  <div className="font-bold text-xl mt-1">{doctorData.specialization}</div>
                </div>
                {doctorData.subSpecialization && doctorData.subSpecialization.length > 0 && (
                  <div>
                    <div className="font-medium">Sub-specializations</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {doctorData.subSpecialization.map((sub, index) => (
                        <span key={index} className="bg-[#E3F2FD] text-[#1976D2] px-3 py-1 rounded-full text-sm">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {doctorData.qualifications && doctorData.qualifications.length > 0 && (
                  <div>
                    <div className="font-medium">Qualifications</div>
                    <div className="space-y-1 mt-1">
                      {doctorData.qualifications.map((qual, index) => (
                        <div key={index} className="text-sm">
                          <strong>{qual.degree}</strong> - {qual.institution} ({qual.year})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Practice Statistics */}
            <div className="bg-white rounded-xl p-8 shadow flex flex-col min-h-[290px]">
              <h2 className="text-2xl font-semibold text-[#16697A] flex items-center gap-3">
                <svg width="28" height="28" fill="none" stroke="#16697A" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" /></svg>
                Practice Statistics
              </h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-4 text-[#16697A] text-lg">
                <div>
                  <div className="font-medium">Total Experience</div>
                  <div className="font-bold text-2xl mt-1">{doctorData.totalExperience || 0} years</div>
                </div>
                <div>
                  <div className="font-medium">Average Rating</div>
                  <div className="font-bold text-2xl mt-1">{doctorData.ratings?.average || "N/A"}</div>
                </div>
                <div>
                  <div className="font-medium">Total Reviews</div>
                  <div className="font-bold text-2xl mt-1">{doctorData.ratings?.totalReviews || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Consultation Time</div>
                  <div className="font-bold text-2xl mt-1">{doctorData.averageConsultationTime || 15} min</div>
                </div>
              </div>
            </div>

            {/* Schedule Summary */}
            <div className="bg-white rounded-xl p-8 shadow flex flex-col min-h-[290px]">
              <h2 className="text-2xl font-semibold text-[#16697A] flex items-center gap-3">
                <Calendar size={28} />
                Schedule Summary
              </h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-4 text-[#16697A] text-lg">
                <div>
                  <div className="font-medium">Working Days</div>
                  <div className="font-bold text-2xl mt-1">{scheduleStats.workingDays}</div>
                </div>
                <div>
                  <div className="font-medium">Total Slots</div>
                  <div className="font-bold text-2xl mt-1">{scheduleStats.totalSlots}</div>
                </div>
                <div>
                  <div className="font-medium">Weekly Capacity</div>
                  <div className="font-bold text-2xl mt-1">{scheduleStats.totalCapacity}</div>
                </div>
                <div>
                  <div className="font-medium">Status</div>
                  <div className={`font-bold text-2xl mt-1 ${
                    scheduleStats.workingDays > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {scheduleStats.workingDays > 0 ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="bg-white rounded-xl p-8 shadow">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-[#16697A]">Upcoming Appointments</h2>
              <button
                onClick={() => setShowQuickBookModal(true)}
                className="bg-[#2C6975] text-white px-4 py-2 rounded-lg hover:bg-[#1f5460] flex items-center gap-2"
              >
                <Plus size={18} /> Quick Book
              </button>
            </div>
        
            {/* Filters Section */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">Search Patient</label>
                  <input
                    type="text"
                    placeholder="Search by patient name..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent"
                    onChange={(e) => setSearchPatientName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && fetchAppointments()}
                  />
                </div>
        
                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">Status</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent"
                    value={appointmentStatus}
                    onChange={(e) => setAppointmentStatus(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked-in">Checked In</option>
                    <option value="in-consultation">In Consultation</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no-show">No Show</option>
                  </select>
                </div>
        
                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">Date</label>
                  <input
                    type="date"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                  />
                </div>
        
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includePastAppointments}
                      onChange={(e) => setIncludePastAppointments(e.target.checked)}
                      className="w-4 h-4 text-[#21748C] rounded"
                    />
                    <span className="text-[#21748C] font-medium">Include Past Appointments</span>
                  </label>
                </div>
              </div>
        
              <div className="flex gap-3 mt-4">
                <button
                  onClick={fetchAppointments}
                  className="bg-gradient-to-r from-[#2BA2A5] to-[#44BAA0] text-white px-6 py-2 rounded-lg font-semibold hover:from-[#219494] hover:to-[#379874] transition"
                >
                  Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 transition"
                >
                  Clear
                </button>
              </div>
            </div>
        
            {/* Appointments List */}
            {loadingAppointments ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-[#21748C]">Loading appointments...</div>
              </div>
            ) : appointments.length > 0 ? (
              <div className="space-y-4">
                {/* Statistics with Earnings */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{appointments.length}</div>
                    <div className="text-[#21748C] text-sm">Total Appointments</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {appointments.filter(a => a.status === 'confirmed' || a.status === 'scheduled').length}
                    </div>
                    <div className="text-[#21748C] text-sm">Upcoming</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {appointments.filter(a => a.status === 'completed').length}
                    </div>
                    <div className="text-[#21748C] text-sm">Completed</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {appointments.filter(a => a.status === 'cancelled' || a.status === 'no-show').length}
                    </div>
                    <div className="text-[#21748C] text-sm">Cancelled/No Show</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      ₹{pagination?.totalEarnings?.toFixed(2) || '0'}
                    </div>
                    <div className="text-[#21748C] text-sm">Total Earnings</div>
                  </div>
                </div>
        
                {/* Appointments Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-3 text-left text-sm font-semibold text-[#21748C] border-b">Appointment ID</th>
                        <th className="p-3 text-left text-sm font-semibold text-[#21748C] border-b">Patient</th>
                        <th className="p-3 text-left text-sm font-semibold text-[#21748C] border-b">Date & Time</th>
                        <th className="p-3 text-left text-sm font-semibold text-[#21748C] border-b">Status</th>
                        <th className="p-3 text-left text-sm font-semibold text-[#21748C] border-b">Reason</th>
                        <th className="p-3 text-left text-sm font-semibold text-[#21748C] border-b">Actions</th>
                       </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appointment) => (
                        <tr key={appointment.appointmentId} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-sm text-[#16697A]">
                            #{appointment.appointmentNumber || appointment.appointmentId.slice(-6)}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-tr from-[#21748C] to-[#A7C7B7] rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {appointment.patient?.name?.[0] || 'P'}
                              </div>
                              <div>
                                <div className="font-medium text-[#16697A]">{appointment.patient?.name || 'N/A'}</div>
                                <div className="text-xs text-gray-500">{appointment.patient?.phoneNo || 'No phone'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-[#16697A]">
                            <div>{new Date(appointment.date).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">{appointment.timeSlot}</div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'checked-in' ? 'bg-yellow-100 text-yellow-800' :
                              appointment.status === 'in-consultation' ? 'bg-purple-100 text-purple-800' :
                              appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                              appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {appointment.status.replace('-', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-[#16697A] max-w-xs truncate">
                            {appointment.reason || 'No reason provided'}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {/* View Button - always present */}
                              <button
                                onClick={() => viewAppointmentDetails(appointment.appointmentId, appointment.status)}
                                className="flex items-center gap-1 bg-[#21748C] text-white px-3 py-1 rounded text-xs hover:bg-[#1D6278]"
                              >
                                <Eye size={14} /> View
                              </button>                          
                              {appointment?.isGuest ? (
                                <button
                                  onClick={() => {
                                    setPaymentAppointment(appointment);
                                    setPaymentAmount(appointment.paymentAmount || 500);
                                    setShowPaymentModal(true);
                                  }}
                                  disabled={
                                    !(
                                      (appointment.paymentStatus === 'waiting' || appointment.paymentStatus === 'pending') &&
                                      appointment.status === 'completed'
                                    )
                                  }
                                  className={`px-3 py-1 rounded text-xs flex items-center gap-1 ${
                                    (appointment.paymentStatus === 'waiting' || appointment.paymentStatus === 'pending') &&
                                    appointment.status === 'completed'
                                      ? 'bg-green-600 text-white hover:bg-green-700'
                                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  }`}
                                >
                                  Pay
                                </button>
                              ) : (
                                // Optional: if you still want to show a disabled Pay button for non‑guest users
                                <button
                                  disabled
                                  className="bg-gray-300 text-gray-500 px-3 py-1 rounded text-xs cursor-not-allowed flex items-center gap-1"
                                >
                                  Pay
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
        
                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <div className="text-sm text-[#21748C]">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} appointments
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 bg-[#21748C] text-white rounded">
                        {pagination.page}
                      </span>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-[#21748C] text-lg mb-2">No appointments found</div>
                <p className="text-gray-500">Try adjusting your filters or check back later for new appointments.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 2 && (
          <div className="bg-white rounded-xl p-8 shadow">
            <h2 className="text-2xl font-semibold text-[#16697A] mb-6">Set Weekly Schedule</h2>
            
            <div className="space-y-6">
              {weeklySchedule.map((daySchedule, dayIndex) => (
                <div key={daySchedule.day} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xl font-semibold text-[#21748C] capitalize">
                        {daySchedule.day}
                      </h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={daySchedule.isWorking}
                          onChange={() => toggleDayWorking(dayIndex)}
                          className="w-4 h-4 text-[#21748C] rounded"
                        />
                        <span className="text-[#21748C] font-medium">Working Day</span>
                      </label>
                    </div>
                    {daySchedule.isWorking && (
                      <button
                        onClick={() => addTimeSlot(dayIndex)}
                        className="flex items-center gap-2 bg-[#21748C] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#1D6278]"
                      >
                        <Plus size={16} />
                        Add Slot
                      </button>
                    )}
                  </div>

                  {daySchedule.isWorking && (
                    <div className="space-y-4">
                      {daySchedule.slots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1 grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-[#21748C] mb-1">Start Time</label>
                              <input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'startTime', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#21748C] mb-1">End Time</label>
                              <input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'endTime', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#21748C] mb-1">Max Patients</label>
                              <input
                                type="number"
                                min="1"
                                value={slot.maxPatients}
                                onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'maxPatients', parseInt(e.target.value))}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                            className="text-red-500 hover:text-red-700 p-2"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleWeeklyScheduleUpdate}
                className="bg-gradient-to-r from-[#2BA2A5] to-[#44BAA0] text-white px-8 py-3 rounded-lg font-semibold hover:from-[#219494] hover:to-[#379874] transition"
              >
                Save Weekly Schedule
              </button>
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="bg-white rounded-xl p-8 shadow">
            <h2 className="text-2xl font-semibold text-[#16697A] mb-6">View Schedule</h2>
            
            {/* Schedule Statistics */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-[#E8F5E8] p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-[#2E7D32]">{scheduleStats.workingDays}</div>
                <div className="text-[#21748C] text-sm">Working Days</div>
              </div>
              <div className="bg-[#E3F2FD] p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-[#1976D2]">{scheduleStats.totalSlots}</div>
                <div className="text-[#21748C] text-sm">Total Slots</div>
              </div>
              <div className="bg-[#FFF3E0] p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-[#F57C00]">{scheduleStats.totalCapacity}</div>
                <div className="text-[#21748C] text-sm">Weekly Capacity</div>
              </div>
              <div className="bg-[#F3E5F5] p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-[#7B1FA2]">
                  {scheduleStats.workingDays > 0 ? 'Active' : 'Inactive'}
                </div>
                <div className="text-[#21748C] text-sm">Status</div>
              </div>
            </div>

            {/* Weekly Schedule Display */}
            <div className="space-y-4">
              {weeklySchedule.map((daySchedule, index) => (
                <div key={daySchedule.day} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-[#21748C] capitalize">
                      {daySchedule.day}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      daySchedule.isWorking 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {daySchedule.isWorking ? 'Working' : 'Day Off'}
                    </span>
                  </div>

                  {daySchedule.isWorking ? (
                    <div className="space-y-3">
                      {daySchedule.slots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-6">
                            <div>
                              <span className="font-medium text-[#16697A]">Time:</span>
                              <span className="ml-2">{slot.startTime} - {slot.endTime}</span>
                            </div>
                            <div>
                              <span className="font-medium text-[#16697A]">Max Patients:</span>
                              <span className="ml-2">{slot.maxPatients || 1}</span>
                            </div>
                            <div>
                              <span className="font-medium text-[#16697A]">Duration:</span>
                              <span className="ml-2">
                                {(() => {
                                  const start = new Date(`2000-01-01T${slot.startTime}`);
                                  const end = new Date(`2000-01-01T${slot.endTime}`);
                                  const diff = (end - start) / (1000 * 60);
                                  return `${diff} minutes`;
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#21748C] italic">No working hours scheduled for this day.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 4 && (
          <div className="bg-white rounded-xl p-8 shadow">
            <h2 className="text-2xl font-semibold text-[#16697A] mb-6">Override Schedule</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Override Form */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-[#21748C]">Add Schedule Override</h3>
                
                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">Date</label>
                  <input
                    type="date"
                    value={overrideDate}
                    onChange={(e) => setOverrideDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overrideWorking}
                      onChange={(e) => setOverrideWorking(e.target.checked)}
                      className="w-4 h-4 text-[#21748C] rounded"
                    />
                    <span className="text-[#21748C] font-medium">Working Day</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">Reason</label>
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g., Saturday Special Clinic, Personal Leave"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                {overrideWorking && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-[#21748C]">Time Slots</label>
                      <button
                        onClick={addOverrideSlot}
                        className="flex items-center gap-2 bg-[#21748C] text-white px-3 py-1 rounded-lg text-sm hover:bg-[#1D6278]"
                      >
                        <Plus size={14} />
                        Add Slot
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {overrideSlots.map((slot, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => updateOverrideSlot(index, 'startTime', e.target.value)}
                              className="p-2 border border-gray-300 rounded"
                              placeholder="Start Time"
                            />
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => updateOverrideSlot(index, 'endTime', e.target.value)}
                              className="p-2 border border-gray-300 rounded"
                              placeholder="End Time"
                            />
                          </div>
                          <button
                            onClick={() => removeOverrideSlot(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleOverrideSchedule}
                  className="w-full bg-gradient-to-r from-[#2BA2A5] to-[#44BAA0] text-white py-3 rounded-lg font-semibold hover:from-[#219494] hover:to-[#379874] transition"
                >
                  Add Schedule Override
                </button>
              </div>

              {/* Existing Overrides */}
              <div>
                <h3 className="text-xl font-semibold text-[#21748C] mb-4">Existing Overrides</h3>
                {doctorData.scheduleOverrides && doctorData.scheduleOverrides.length > 0 ? (
                  <div className="space-y-3">
                    {doctorData.scheduleOverrides.map((override, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-[#16697A]">
                            {formatDate(override.date)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            override.isWorking ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {override.isWorking ? 'Working' : 'Day Off'}
                          </span>
                        </div>
                        <p className="text-sm text-[#21748C] mb-2">{override.reason}</p>
                        {override.isWorking && override.slots && override.slots.length > 0 && (
                          <div className="text-xs text-gray-600">
                            {override.slots.length} slot(s) configured
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#21748C]">No schedule overrides configured.</p>
                )}
              </div>
            </div>
            
          </div>
        )}
      </div>
      {showQuickBookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-[#2C6975] mb-4">Quick Book Appointment</h2>
              <form onSubmit={handleQuickBook} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
                  <input
                    type="text"
                    required
                    value={quickBookForm.patientName}
                    onChange={(e) => setQuickBookForm({...quickBookForm, patientName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#2C6975]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Email *</label>
                  <input
                    type="email"
                    required
                    value={quickBookForm.patientEmail}
                    onChange={(e) => setQuickBookForm({...quickBookForm, patientEmail: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Phone *</label>
                  <input
                    type="tel"
                    required
                    value={quickBookForm.patientPhone}
                    onChange={(e) => setQuickBookForm({...quickBookForm, patientPhone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age (optional)</label>
                  <input
                    type="number"
                    value={quickBookForm.patientAge}
                    onChange={(e) => setQuickBookForm({...quickBookForm, patientAge: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={quickBookForm.date}
                    onChange={(e) => {
                      setQuickBookForm({...quickBookForm, date: e.target.value, timeSlot: ''});
                      fetchQuickBookSlots(e.target.value);
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                  {quickBookAvailabilityInfo && (
                    <div className={`mt-1 text-sm p-1 rounded ${quickBookAvailabilityInfo.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                      {quickBookAvailabilityInfo.isAvailable ? '✓ Available' : `✗ ${quickBookAvailabilityInfo.reason}`}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot *</label>
                  <select
                    required
                    value={quickBookForm.timeSlot}
                    onChange={(e) => setQuickBookForm({...quickBookForm, timeSlot: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="">Select time slot</option>
                    {quickBookAvailableSlots.map((slot, idx) => (
                      <option key={idx} value={slot.timeSlot}>
                        {formatTimeSlot(slot.timeSlot)} ({slot.remainingSlots}/{slot.maxPatients} slots left)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                  <textarea
                    required
                    rows="3"
                    value={quickBookForm.reason}
                    onChange={(e) => setQuickBookForm({...quickBookForm, reason: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
                  {quickBookForm.symptoms.map((sym, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={sym}
                        onChange={(e) => {
                          const newSymptoms = [...quickBookForm.symptoms];
                          newSymptoms[idx] = e.target.value;
                          setQuickBookForm({...quickBookForm, symptoms: newSymptoms});
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSymptoms = quickBookForm.symptoms.filter((_, i) => i !== idx);
                          setQuickBookForm({...quickBookForm, symptoms: newSymptoms});
                        }}
                        className="px-3 py-2 bg-red-500 text-white rounded"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setQuickBookForm({...quickBookForm, symptoms: [...quickBookForm.symptoms, '']})}
                    className="text-[#2C6975] text-sm"
                  >
                    + Add symptom
                  </button>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowQuickBookModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={quickBookLoading || !quickBookForm.timeSlot}
                    className="flex-1 bg-[#2C6975] text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    {quickBookLoading ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-[#2C6975] mb-4">Enter Payment Amount</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (INR) *
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseInt(e.target.value, 10) || 0)}
                  min="1"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  autoFocus
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={paymentProcessing || paymentAmount <= 0}
                  className="flex-1 bg-[#2C6975] text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {paymentProcessing ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    
  );
}