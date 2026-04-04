import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Edit2, ArrowLeft, LogOut, Calendar, User, Stethoscope, 
  Plus, X, Eye, Phone, Mail, Award, Lock, Building, Users, 
  IndianRupee
} from "lucide-react";
import axios from "axios";
import RegisterDoctorModal from "./RegisterDoctor";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const TABS = ["Overview", "Doctors", "Upcoming Appointments"];

export default function HospitalDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [hospitalData, setHospitalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState("");
  const [doctorfilter, setdoctorfiler] = useState(true);
  const [appointmentfilter, setappointment] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0); // NEW
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAppointment, setPaymentAppointment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(500);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // ---- Doctors tab state ----
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorsFilters, setDoctorsFilters] = useState({
    specialization: "",
    search: "",
    minExperience: "",
    maxExperience: "",
    language: ""
  });
  const [doctorsPagination, setDoctorsPagination] = useState(null);

  // ---- Register Doctor Modal state ----
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    username: "",
    name: "",
    email: "",
    phoneNo: "",
    registrationNumber: "",
    password: "",
    confirmPassword: ""
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");

  // ---- Appointments tab state ----
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsFilters, setAppointmentsFilters] = useState({
    status: "all",
    date: "",
    patientName: "",
    doctorName: "",
    includePast: false
  });
  const [appointmentsPagination, setAppointmentsPagination] = useState(null);

  // ---- Quick Book modal state ----
  const [showQuickBookModal, setShowQuickBookModal] = useState(false);
  const [quickBookLoading, setQuickBookLoading] = useState(false);
  const [quickBookForm, setQuickBookForm] = useState({
    doctorId: "",
    patientName: "",
    patientAge: "",
    patientEmail: "",
    patientPhone: "",
    date: "",
    timeSlot: "",
    reason: "",
    symptoms: []
  });
  const [quickBookAvailableSlots, setQuickBookAvailableSlots] = useState([]);
  const [quickBookAvailabilityInfo, setQuickBookAvailabilityInfo] = useState(null);
  const [doctorList, setDoctorList] = useState([]); // for dropdown

  // Get logged‑in user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Fetch hospital overview data on mount
  useEffect(() => {
    const fetchHospitalData = async () => {
      if (!user?.email) return;
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/hospitals/${user.email}`);
        if (response.data.success) {
          setHospitalData(response.data.data);
        } else {
          setError("Failed to load hospital data");
        }
      } catch (err) {
        console.error("Error fetching hospital data:", err);
        setError("Error loading hospital data");
      } finally {
        setLoading(false);
      }
    };
    if (user?.email) fetchHospitalData();
  }, [user]);

  // Fetch doctors when Doctors tab is active
  useEffect(() => {
    if (activeTab === 1 && user?.email && doctorfilter) {
      fetchDoctors();
    }
  }, [activeTab, user, doctorsFilters, doctorsPagination?.page]);

  // Fetch appointments when Appointments tab is active
  useEffect(() => {
    if (activeTab === 2 && user?.email && appointmentfilter) {
      fetchAppointments();
    }
  }, [activeTab, user, appointmentsFilters, appointmentsPagination?.page]);

  // Fetch doctors for the hospital (used in quick book dropdown)
  const fetchDoctorList = async () => {
    if (!user?.email) return;
    try {
      const params = new URLSearchParams();
      params.append("limit", "100"); // fetch all doctors
      const response = await axios.get(`${API_BASE_URL}/hospitals/${user.email}/doctors?${params}`);
      if (response.data.success) {
        setDoctorList(response.data.data.doctors);
      }
    } catch (err) {
      console.error("Error fetching doctor list:", err);
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
  

  // Fetch doctors list with filters and pagination
  const fetchDoctors = async () => {
    if (!user?.email) return;
    try {
      setDoctorsLoading(true);
      setdoctorfiler(false);
      const params = new URLSearchParams();
      if (doctorsFilters.specialization) params.append("specialization", doctorsFilters.specialization);
      if (doctorsFilters.search) params.append("search", doctorsFilters.search);
      if (doctorsFilters.minExperience) params.append("minExperience", doctorsFilters.minExperience);
      if (doctorsFilters.maxExperience) params.append("maxExperience", doctorsFilters.maxExperience);
      if (doctorsFilters.language) params.append("language", doctorsFilters.language);
      params.append("limit", "12");
      params.append("page", doctorsPagination?.page || "1");

      const response = await axios.get(`${API_BASE_URL}/hospitals/${user.email}/doctors?${params}`);
      if (response.data.success) {
        setDoctors(response.data.data.doctors);
        setDoctorsPagination(response.data.data.pagination);
      } else {
        console.error("Failed to fetch doctors");
      }
    } catch (err) {
      console.error("Error fetching doctors:", err);
    } finally {
      setDoctorsLoading(false);
    }
  };
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
  // Fetch appointments with filters and pagination
  const fetchAppointments = async () => {
    if (!user?.email) return;
    try {
      setAppointmentsLoading(true);
      setappointment(false);
      const params = new URLSearchParams();
      if (appointmentsFilters.status !== "all") params.append("status", appointmentsFilters.status);
      if (appointmentsFilters.date) params.append("date", appointmentsFilters.date);
      if (appointmentsFilters.patientName) params.append("patientName", appointmentsFilters.patientName);
      if (appointmentsFilters.doctorName) params.append("doctorName", appointmentsFilters.doctorName);
      if (appointmentsFilters.includePast) params.append("includePast", "true");
      params.append("limit", "12");
      params.append("page", appointmentsPagination?.page || "1");

      const response = await axios.get(`${API_BASE_URL}/hospitals/${user.email}/appointments/upcoming?${params}`);
      if (response.data.success) {
        setAppointments(response.data.data.appointments);
        setAppointmentsPagination(response.data.data.pagination);
        setTotalEarnings(response.data.data.statistics?.totalEarnings || 0);
      } else {
        console.error("Failed to fetch appointments");
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  // Fetch available slots for quick book
  const fetchQuickBookSlots = async (doctorId, date) => {
    if (!doctorId || !date) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/doctors/schedule/availability`, {
        params: { username: doctorList.find(d => d.id === doctorId)?.username, date }
      });
      if (response.data.success) {
        setQuickBookAvailabilityInfo(response.data.data);
        setQuickBookAvailableSlots(response.data.data.availableSlots.filter(s => s.available));
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  // Handle quick book submission
  const handleQuickBook = async (e) => {
    e.preventDefault();
    setQuickBookLoading(true);
    try {
      const payload = {
        ...quickBookForm,
        symptoms: quickBookForm.symptoms.filter(s => s.trim())
      };
      const response = await axios.post(`${API_BASE_URL}/book-quick-appointment`, payload);
      if (response.data.success) {
        alert('Appointment booked successfully!');
        setShowQuickBookModal(false);
        // Reset form
        setQuickBookForm({
          doctorId: "",
          patientName: "",
          patientAge: "",
          patientEmail: "",
          patientPhone: "",
          date: "",
          timeSlot: "",
          reason: "",
          symptoms: []
        });
        setQuickBookAvailableSlots([]);
        setQuickBookAvailabilityInfo(null);
        // Refresh appointments list if needed
        if (activeTab === 2) fetchAppointments();
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

  // Handle doctor registration submission
  const handleRegisterDoctor = async (e) => {
    e.preventDefault();
    setRegisterError("");

    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError("Passwords do not match");
      return;
    }
    if (registerForm.password.length < 8) {
      setRegisterError("Password must be at least 8 characters");
      return;
    }
    if (registerForm.phoneNo.length !== 10) {
      setRegisterError("Phone number must be 10 digits");
      return;
    }
    if (!registerForm.registrationNumber) {
      setRegisterError("Registration number is required");
      return;
    }

    setRegisterLoading(true);
    try {
      const payload = {
        ...registerForm,
        hospitalemail: user.email
      };
      const response = await axios.post(`${API_BASE_URL}/register-doctor`, payload);
      if (response.data.success) {
        alert("Doctor registration successful! They can now log in.");
        setShowRegisterModal(false);
        setRegisterForm({
          username: "", name: "", email: "", phoneNo: "",
          registrationNumber: "", password: "", confirmPassword: ""
        });
        if (activeTab === 1) fetchDoctors();
      } else {
        setRegisterError(response.data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Doctor registration error:", err);
      setRegisterError(err.response?.data?.message || "Server error");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    navigate("/explore");
    window.location.reload();
  };

  const formatAddress = (address) => {
    if (!address) return "Not provided";
    if (typeof address === "string") return address;
    const parts = [
      address.building,
      address.street,
      address.city,
      address.state,
      address.pincode,
      address.country
    ].filter(p => p && p.trim());
    return parts.join(", ") || "Not provided";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric"
    });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FCFCF9] text-[#21748C] text-lg">
        Loading hospital data...
      </div>
    );
  }

  if (!hospitalData) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FCFCF9] text-red-600 text-lg">
        Unable to load hospital data. Please try again later.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6FAF8]">
      {/* Top navBar */}
      <nav className="w-full bg-[#0E5F73] flex items-center px-6 py-3">
        <button onClick={() => navigate(-1)} className="flex items-center text-white text-sm font-medium mr-3">
          <ArrowLeft size={20} className="mr-1" />
          Back
        </button>
        <span className="flex items-center text-[#FDFDFB] text-2xl font-semibold ml-2">
          <span className="inline-flex justify-center items-center rounded-full bg-[#83C6B6] w-7 h-7 mr-2">
            <Building size={16} color="#FCFCF9" />
          </span>
          Hospital Dashboard
        </span>
        <div className="flex-1" />
        <button onClick={handleLogout} className="flex items-center gap-2 bg-[#ECF2F9] hover:bg-[#E4ECF7] shadow px-4 py-2.5 rounded-lg text-[#21748C] font-semibold text-base ml-16">
          <LogOut size={19} /> Logout
        </button>
      </nav>

      {/* Profile Card */}
      <div className="bg-white shadow rounded-xl mt-8 mx-auto flex items-center justify-between" style={{ maxWidth: 1600, padding: "32px 40px" }}>
        <div className="flex items-center">
          {hospitalData.profilePhoto ? (
            <img src={hospitalData.profilePhoto} alt="Profile" className="w-20 h-20 min-w-[80px] min-h-[80px] rounded-full object-cover mr-8" />
          ) : (
            <div className="w-20 h-20 min-w-[80px] min-h-[80px] rounded-full bg-gradient-to-tr from-[#21748C] to-[#A7C7B7] flex items-center justify-center text-white text-3xl font-bold mr-8">
              {hospitalData.name?.[0] || "H"}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-[#165273] text-3xl font-bold">{hospitalData.name}</span>
            <span className="text-[#206B84] mt-1 text-base">{hospitalData.email}</span>
            <div className="flex gap-2 mt-2">
              <span className="bg-[#DBF3E6] text-[#4ABDA7] font-medium px-3 py-1 rounded-full text-sm">
                Tier {hospitalData.tier}
              </span>
              {hospitalData.isVerified && (
                <span className="bg-[#E8F5E8] text-[#2E7D32] font-medium px-3 py-1 rounded-full text-sm">Verified</span>
              )}
              <span className="bg-[#D2EAF6] text-[#379CB8] font-medium px-3 py-1 rounded-full text-sm">
                MSP: {hospitalData.mspId}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate("/edit_hospital_profile")}
          className="flex items-center gap-2 bg-gradient-to-r from-[#2BA2A5] to-[#44BAA0] shadow px-6 py-2.5 rounded-lg text-white font-semibold text-base hover:from-[#219494] hover:to-[#379874] transition"
        >
          <Edit2 size={19} /> Edit Profile
        </button>
      </div>

      {/* Tabs */}
      <div className="pt-6 px-12" style={{ maxWidth: 1600, margin: "0 auto" }}>
        <div className="flex items-center gap-0 bg-[#EEF4F0] rounded-xl p-1">
          {TABS.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={`flex-1 transition text-base font-semibold py-2 ${
                activeTab === idx
                  ? "bg-white shadow rounded-lg text-[#18788E]"
                  : "text-[#21748C]"
              }`}
              style={{ margin: "0 3px", minWidth: "200px" }}
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
            {/* Hospital Information */}
            <div className="bg-white rounded-xl p-8 shadow flex flex-col min-h-[290px]">
              <h2 className="text-2xl font-semibold text-[#16697A] flex items-center gap-3">
                <Building size={28} />
                Hospital Information
              </h2>
              <ul className="mt-4 space-y-3 text-[#16697A] text-lg">
                <li className="flex items-center gap-2">
                  <Mail size={20} />
                  {hospitalData.email}
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={20} />
                  {hospitalData.phoneNo || "Not provided"}
                </li>
                <li className="flex items-center gap-2">
                  <Award size={20} />
                  Tier: {hospitalData.tier}
                </li>
                <li className="flex items-center gap-2">
                  <svg width="20" height="20" fill="none" stroke="#16697A" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2a3 3 0 013 3c0 1.5-3 5-3 5S9 6.5 9 5a3 3 0 013-3z" /><path d="M12 22s8-4 8-10a8 8 0 10-16 0c0 6 8 10 8 10z" /></svg>
                  {formatAddress(hospitalData.address)}
                </li>
              </ul>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-xl p-8 shadow flex flex-col min-h-[290px]">
              <h2 className="text-2xl font-semibold text-[#16697A] flex items-center gap-3">
                <Users size={28} />
                Statistics
              </h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-4 text-[#16697A] text-lg">
                <div>
                  <div className="font-medium">Total Doctors</div>
                  <div className="font-bold text-2xl mt-1">{hospitalData.stats?.totalDoctors || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Total Appointments</div>
                  <div className="font-bold text-2xl mt-1">{hospitalData.stats?.totalAppointments || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Total Consultations</div>
                  <div className="font-bold text-2xl mt-1">{hospitalData.stats?.totalConsultations || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Joined</div>
                  <div className="font-bold text-2xl mt-1">{new Date(hospitalData.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Recent Doctors (first 5) */}
            <div className="bg-white rounded-xl p-8 shadow flex flex-col min-h-[290px] md:col-span-2">
              <h2 className="text-2xl font-semibold text-[#16697A] flex items-center gap-3">
                <Stethoscope size={28} />
                Recent Doctors
              </h2>
              {hospitalData.doctorReferences && hospitalData.doctorReferences.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hospitalData.doctorReferences.map((doctor, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-[#21748C] text-white flex items-center justify-center font-bold">
                        {doctor.name?.[0] || "D"}
                      </div>
                      <div>
                        <div className="font-medium">{doctor.name}</div>
                        <div className="text-sm text-gray-600">{doctor.specialization || "N/A"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-[#21748C] italic">No doctors associated yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="bg-white rounded-xl p-8 shadow">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-[#16697A]">Doctors at {hospitalData.name}</h2>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="flex items-center gap-2 bg-[#21748C] text-white px-4 py-2 rounded-lg hover:bg-[#1D6278] transition"
              >
                <Plus size={18} />
                Register New Doctor
              </button>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <input
                  type="text"
                  placeholder="Search name, specialization..."
                  value={doctorsFilters.search}
                  onChange={(e) => setDoctorsFilters({...doctorsFilters, search: e.target.value})}
                  className="p-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Specialization"
                  value={doctorsFilters.specialization}
                  onChange={(e) => setDoctorsFilters({...doctorsFilters, specialization: e.target.value})}
                  className="p-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Min Experience"
                  value={doctorsFilters.minExperience}
                  onChange={(e) => setDoctorsFilters({...doctorsFilters, minExperience: e.target.value})}
                  className="p-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Max Experience"
                  value={doctorsFilters.maxExperience}
                  onChange={(e) => setDoctorsFilters({...doctorsFilters, maxExperience: e.target.value})}
                  className="p-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Language"
                  value={doctorsFilters.language}
                  onChange={(e) => setDoctorsFilters({...doctorsFilters, language: e.target.value})}
                  className="p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    setdoctorfiler(true);
                    fetchDoctors()
                  }}
                  className="bg-gradient-to-r from-[#2BA2A5] to-[#44BAA0] text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Doctors List */}
            {doctorsLoading ? (
              <div className="flex justify-center py-8">Loading doctors...</div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-8 text-[#21748C]">No doctors found matching criteria.</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-6">
                  {doctors.map((doctor) => (
                    <div key={doctor.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start gap-4">
                        {doctor.profilePhoto ? (
                          <img src={doctor.profilePhoto} alt={doctor.name} className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-[#21748C] text-white flex items-center justify-center text-xl font-bold">
                            {doctor.name?.[0] || "D"}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-semibold text-[#16697A]">Dr. {doctor.name}</h3>
                              <p className="text-sm text-gray-600">{doctor.specialization}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${doctor.isVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                              {doctor.isVerified ? "Verified" : "Pending"}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-[#21748C]">
                            <div className="flex items-center gap-1"><Mail size={14} /> {doctor.email}</div>
                            <div className="flex items-center gap-1"><Phone size={14} /> {doctor.phoneNo}</div>
                            <div className="flex items-center gap-1"><Award size={14} /> Exp: {doctor.totalExperience} yrs</div>
                            <div className="flex items-center gap-1"><Star size={14} /> Rating: {doctor.stats?.averageRating?.toFixed(1) || "N/A"}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {doctorsPagination && doctorsPagination.pages > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <div className="text-sm text-[#21748C]">
                      Showing {((doctorsPagination.page-1)*doctorsPagination.limit)+1} to {Math.min(doctorsPagination.page*doctorsPagination.limit, doctorsPagination.total)} of {doctorsPagination.total} doctors
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDoctorsPagination({...doctorsPagination, page: doctorsPagination.page-1})}
                        disabled={doctorsPagination.page === 1}
                        className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 bg-[#21748C] text-white rounded">{doctorsPagination.page}</span>
                      <button
                        onClick={() => setDoctorsPagination({...doctorsPagination, page: doctorsPagination.page+1})}
                        disabled={doctorsPagination.page === doctorsPagination.pages}
                        className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 2 && (
          <div className="bg-white rounded-xl p-8 shadow">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-[#16697A]">Upcoming Appointments</h2>
              <button
                onClick={() => {
                  fetchDoctorList();
                  setShowQuickBookModal(true);
                }}
                className="bg-[#2C6975] text-white px-4 py-2 rounded-lg hover:bg-[#1f5460] flex items-center gap-2"
              >
                <Plus size={18} /> Quick Book
              </button>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <select
                  value={appointmentsFilters.status}
                  onChange={(e) => setAppointmentsFilters({...appointmentsFilters, status: e.target.value})}
                  className="p-2 border border-gray-300 rounded-lg"
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
                <input
                  type="date"
                  value={appointmentsFilters.date}
                  onChange={(e) => setAppointmentsFilters({...appointmentsFilters, date: e.target.value})}
                  className="p-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Patient Name"
                  value={appointmentsFilters.patientName}
                  onChange={(e) => setAppointmentsFilters({...appointmentsFilters, patientName: e.target.value})}
                  className="p-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Doctor Name"
                  value={appointmentsFilters.doctorName}
                  onChange={(e) => setAppointmentsFilters({...appointmentsFilters, doctorName: e.target.value})}
                  className="p-2 border border-gray-300 rounded-lg"
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={appointmentsFilters.includePast}
                    onChange={(e) => setAppointmentsFilters({...appointmentsFilters, includePast: e.target.checked})}
                    className="w-4 h-4 text-[#21748C]"
                  />
                  <span className="text-[#21748C]">Include Past</span>
                </label>
              </div>
              <div className="flex justify-end mt-4 gap-2">
                <button
                  onClick={() => fetchAppointments()}
                  className="bg-gradient-to-r from-[#2BA2A5] to-[#44BAA0] text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Apply Filters
                </button>
                <button
                  onClick={() => {
                    setappointment(true);
                    setAppointmentsFilters({ status: "all", date: "", patientName: "", doctorName: "", includePast: false });
                    fetchAppointments();
                  }}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600"
                >
                  Clear
                </button>
              </div>
            </div>


            {/* Appointments List */}
            {appointmentsLoading ? (
              <div className="flex justify-center py-8">Loading appointments...</div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-[#21748C]">No appointments found.</div>
            ) : (
              <div className="space-y-4">
                {/* Statistics Cards – added earnings card */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{appointments.length}</div>
                    <div className="text-[#21748C] text-sm">Total</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {appointments.filter(a => a.status === "confirmed" || a.status === "scheduled").length}
                    </div>
                    <div className="text-[#21748C] text-sm">Upcoming</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {appointments.filter(a => a.status === "completed").length}
                    </div>
                    <div className="text-[#21748C] text-sm">Completed</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {appointments.filter(a => a.status === "cancelled" || a.status === "no-show").length}
                    </div>
                    <div className="text-[#21748C] text-sm">Cancelled/No Show</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">₹{totalEarnings.toFixed(2)}</div>
                    <div className="text-[#21748C] text-sm">Total Earnings</div>
                  </div>
                </div>

                {/* Table unchanged */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-3 text-left text-sm font-semibold text-[#21748C] border-b">Appointment ID</th>
                        <th className="p-3 text-left text-sm font-semibold text-[#21748C] border-b">Doctor</th>
                        <th className="p-3 text-left text-sm font-semibold text-[#21748C] border-b">Patient</th>
                        <th className="p-3 text-left text-sm font-semibold text-[#21748C] border-b">Date & Time</th>
                        <th className="p-3 text-left text-sm font-semibold text-[#21748C] border-b">Status</th>
                        <th className="p-3 text-left text-sm font-semibold text-[#21748C] border-b">Reason</th>
                        <th className="p-3 text-left text-sm font-semibold text-[#21748C] border-b">Actions</th>
                       </tr>
                    </thead>
                    <tbody>
                      {appointments.map((apt) => (
                        <tr key={apt.appointmentId} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-sm text-[#16697A]">#{apt.appointmentNumber || apt.appointmentId.slice(-6)}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-[#21748C] text-white flex items-center justify-center text-sm">
                                {apt.doctor?.name?.[0] || "D"}
                              </div>
                              <span>Dr. {apt.doctorName || "N/A"}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-[#A7C7B7] text-white flex items-center justify-center text-sm">
                                {apt.patient?.name?.[0] || "P"}
                              </div>
                              <span>{apt.patient?.name || "N/A"}</span>
                            </div>
                          </td>
                          <td className="p-3 text-sm">
                            <div>{formatDate(apt.date)}</div>
                            <div className="text-xs text-gray-500">{apt.timeSlot}</div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              apt.status === "scheduled" ? "bg-blue-100 text-blue-800" :
                              apt.status === "confirmed" ? "bg-green-100 text-green-800" :
                              apt.status === "checked-in" ? "bg-yellow-100 text-yellow-800" :
                              apt.status === "in-consultation" ? "bg-purple-100 text-purple-800" :
                              apt.status === "completed" ? "bg-gray-100 text-gray-800" :
                              apt.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"
                            }`}>
                              {apt.status.replace("-", " ").toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-[#16697A] max-w-xs truncate">{apt.reason || "No reason"}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {/* View Button - always present */}
                              <button
                                onClick={() => viewAppointmentDetails(apt.appointmentId, apt.status)}
                                className="flex items-center gap-1 bg-[#21748C] text-white px-3 py-1 rounded text-xs hover:bg-[#1D6278]"
                              >
                                <Eye size={14} /> View
                              </button>
                          
                              {/* Pay Button - shown only for guest appointments, disabled unless conditions are met */}
                              {apt.patient?.isGuest ? (
                                <button
                                  onClick={() => {
                                    setPaymentAppointment(apt);
                                    setPaymentAmount(apt.paymentAmount || 500);
                                    setShowPaymentModal(true);
                                  }}
                                  disabled={
                                    !(
                                      (apt.paymentStatus === 'waiting' || apt.paymentStatus === 'pending') &&
                                      apt.status === 'completed'
                                    )
                                  }
                                  className={`px-3 py-1 rounded text-xs flex items-center gap-1 ${
                                    (apt.paymentStatus === 'waiting' || apt.paymentStatus === 'pending') &&
                                    apt.status === 'completed'
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

                {/* Pagination unchanged */}
                {appointmentsPagination && appointmentsPagination.pages > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <div className="text-sm text-[#21748C]">
                      Showing {((appointmentsPagination.page-1)*appointmentsPagination.limit)+1} to {Math.min(appointmentsPagination.page*appointmentsPagination.limit, appointmentsPagination.total)} of {appointmentsPagination.total} appointments
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAppointmentsPagination({...appointmentsPagination, page: appointmentsPagination.page-1})}
                        disabled={appointmentsPagination.page === 1}
                        className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 bg-[#21748C] text-white rounded">{appointmentsPagination.page}</span>
                      <button
                        onClick={() => setAppointmentsPagination({...appointmentsPagination, page: appointmentsPagination.page+1})}
                        disabled={appointmentsPagination.page === appointmentsPagination.pages}
                        className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showRegisterModal && (
        <RegisterDoctorModal
          show={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onSubmit={handleRegisterDoctor}
          formData={registerForm}
          setFormData={setRegisterForm}
          loading={registerLoading}
          error={registerError}
        />
      )}

      {/* Quick Book Modal */}
      {showQuickBookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-[#2C6975] mb-4">Quick Book Appointment</h2>
              <form onSubmit={handleQuickBook} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Doctor *</label>
                  <select
                    required
                    value={quickBookForm.doctorId}
                    onChange={(e) => {
                      const doctorId = e.target.value;
                      setQuickBookForm({...quickBookForm, doctorId, timeSlot: ''});
                      if (quickBookForm.date && doctorId) {
                        fetchQuickBookSlots(doctorId, quickBookForm.date);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="">Choose a doctor</option>
                    {doctorList.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        Dr. {doc.name} ({doc.specialization})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
                  <input
                    type="text"
                    required
                    value={quickBookForm.patientName}
                    onChange={(e) => setQuickBookForm({...quickBookForm, patientName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
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
                      const date = e.target.value;
                      setQuickBookForm({...quickBookForm, date, timeSlot: ''});
                      if (quickBookForm.doctorId && date) {
                        fetchQuickBookSlots(quickBookForm.doctorId, date);
                      }
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
// Star icon component (simple)
const Star = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);