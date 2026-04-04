// DoctorProfile.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  MapPin,
  Star,
  Clock,
  Phone,
  Mail,
  Calendar,
  User,
  Award,
  GraduationCap,
  Languages,
  ArrowLeft,
  Shield,
  Clock4,
  Building,
  IndianRupee,
} from "lucide-react";
import axios from "axios";

const DoctorProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  const [doctor, setDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    date: "",
    timeSlot: "",
    reason: "",
    symptoms: []
  });
  const [isBooking, setIsBooking] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [availabilityInfo, setAvailabilityInfo] = useState(null);
  const [paymentSessionId, setPaymentSessionId] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);


  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchDoctorProfile();
  }, [username]);

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

  const fetchDoctorProfile = async () => {
    setIsLoading(true);
    try {
      console.log(username);
      const response = await axios.get(`${API_BASE_URL}/doctors/${username}`);
      console.log(response);
      if (response.data.success) {
        setDoctor(response.data.data);
      } else {
        setError("Doctor not found");
      }
    } catch (error) {
      console.error("Error fetching doctor profile:", error);
      setError("Failed to load doctor profile");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableSlots = async (date) => {
    if (!date || !username) return;
    
    setIsLoadingSlots(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/doctors/schedule/availability`, {
        params: {
          username: username,
          date: date
        }
      });

      if (response.data.success) {
        setAvailabilityInfo(response.data.data);
        // Filter only available slots
        const available = response.data.data.availableSlots.filter(slot => slot.available);
        setAvailableSlots(available);
        
        // Reset time slot if current selection is not available
        if (appointmentData.timeSlot && !available.some(slot => slot.timeSlot === appointmentData.timeSlot)) {
          setAppointmentData(prev => ({ ...prev, timeSlot: "" }));
        }
      } else {
        setAvailableSlots([]);
        setAvailabilityInfo(null);
      }
    } catch (error) {
      console.error("Error fetching available slots:", error);
      setAvailableSlots([]);
      setAvailabilityInfo(null);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleDateChange = (date) => {
    setAppointmentData(prev => ({ 
      ...prev, 
      date: date,
      timeSlot: "" // Reset time slot when date changes
    }));
    fetchAvailableSlots(date);
  };

  const handleBookAppointment = () => {
    if (!user) {
      navigate("/login", { state: { returnTo: `/doctor/${username}` } });
      return;
    }

    if (user.userType !== "patient") {
      alert("Only patients can book appointments");
      return;
    }

    setShowAppointmentModal(true);
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
  
    if (!user || user.userType !== "patient") {
      alert("Only patients can book appointments");
      return;
    }
  
    const selectedSlot = availableSlots.find(slot => slot.timeSlot === appointmentData.timeSlot);
    if (!selectedSlot || !selectedSlot.available) {
      alert("Please select an available time slot");
      return;
    }
  
    setIsBooking(true);
    try {
      const appointmentPayload = {
        patientId: user.id,
        doctorId: doctor.id,
        date: appointmentData.date,
        timeSlot: appointmentData.timeSlot,
        reason: appointmentData.reason,
        symptoms: appointmentData.symptoms.filter(s => s.trim() !== "")
      };

      const response = await axios.post(`${API_BASE_URL}/book-appointment`, appointmentPayload);
  
      if (!response.data.success) {
        throw new Error(response.data.message || "Booking failed");
      }
  
      const { payment_session_id, payment_link, appointmentId } = response.data.data;
  
      if (!payment_session_id) {
        window.location.href = payment_link;
        return;
      }
  
      // Open payment modal
      setIsProcessingPayment(true);
      const CashfreeSDK = await loadCashfreeSDK();
      const cashfree = CashfreeSDK({
        mode: process.env.REACT_APP_CASHFREE_MODE || "sandbox"
      });
  
      // Start polling for appointment status
      let pollInterval = setInterval(async () => {
        try {
          const statusRes = await axios.get(`${API_BASE_URL}/appointments/${appointmentId}/status`);
          if (statusRes.data.status === 'completed') {
            // Payment succeeded
            clearInterval(pollInterval);
            cleanupAfterPayment(true);
          } else if (statusRes.data.status === 'cancelled' || statusRes.data.status === 'failed') {
            // Payment failed
            clearInterval(pollInterval);
            cleanupAfterPayment(false);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 3000); // check every 3 seconds
  
      // Set a timeout to stop polling after 2 minutes to avoid infinite loops
      const timeout = setTimeout(() => {
        if (pollInterval) {
          clearInterval(pollInterval);
          console.log('Polling timeout after 2 minutes');
          cleanupAfterPayment(false);
        }
      }, 120000);
  
      function cleanupAfterPayment(success) {
        clearTimeout(timeout);
        if (pollInterval) clearInterval(pollInterval);
        setShowAppointmentModal(false);
        setAppointmentData({
          date: "",
          timeSlot: "",
          reason: "",
          symptoms: []
        });
        setAvailableSlots([]);
        setAvailabilityInfo(null);
        setIsBooking(false);
        setIsProcessingPayment(false);
        if (success) {
          alert("Appointment booked successfully you will receive a confirmation mail !");
          // Optionally navigate to appointments page
          // navigate("/patient-appointments");
        } else {
          alert("Payment verification failed. Please contact support if amount was deducted.");
        }
      }
  
      // Now open the Cashfree modal
      cashfree.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget: "_modal",
        onSuccess: (data) => {
          console.log('Payment Successful (onSuccess):', data);
          cleanupAfterPayment(true);
        },
        onFailure: (data) => {
          console.error('Payment Failed (onFailure):', data);
          cleanupAfterPayment(false);
        },
        onClose: () => {
          console.log('Checkout closed by user');
          // Don't mark as failed immediately – the user may have completed payment in another tab
          // The polling will eventually detect the status if payment succeeded.
          // If after a few seconds the status is still 'pending', we can consider it abandoned.
          setTimeout(() => {
            if (pollInterval) {
              // If still polling and no success after 30 seconds, clean up
              cleanupAfterPayment(false);
            }
          }, 30000);
        }
      });
    } catch (error) {
      console.error("Booking error:", error);
      alert(error.message || "Failed to book appointment. Please try again.");
      setShowAppointmentModal(false);
      setIsBooking(false);
      setIsProcessingPayment(false);
    }
  };
  const addSymptomField = () => {
    setAppointmentData(prev => ({
      ...prev,
      symptoms: [...prev.symptoms, ""]
    }));
  };

  const updateSymptom = (index, value) => {
    setAppointmentData(prev => ({
      ...prev,
      symptoms: prev.symptoms.map((s, i) => i === index ? value : s)
    }));
  };

  const removeSymptom = (index) => {
    setAppointmentData(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index)
    }));
  };

  const formatTimeSlot = (timeSlot) => {
    // Convert "09:00-10:00" to "09:00 AM - 10:00 AM"
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C6975]"></div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">{error || "Doctor not found"}</h2>
          <button 
            onClick={() => navigate("/explore")}
            className="bg-[#2C6975] text-white px-6 py-2 rounded hover:bg-[#1f5460]"
          >
            Back to Doctors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-[#2C6975] text-white px-8 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate("/explore")}
              className="flex items-center gap-2 hover:text-yellow-300"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Doctors
            </button>
            <div className="flex items-center space-x-2">
              <img src="/images/logo.png" alt="Logo" className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Medicare</h1>
            </div>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-sm">Welcome, {user.name}</span>
            </div>
          )}
        </div>
      </nav>

      {/* Doctor Profile Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-lg">
                {doctor.profilePhoto ? (
                  <img 
                    src={doctor.profilePhoto} 
                    alt={doctor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-full h-full text-gray-400 p-6" />
                )}
              </div>
            </div>

            {/* Doctor Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-[#2C6975] mb-2">
                    Dr. {doctor.name}
                  </h1>
                  <p className="text-xl text-gray-600 mb-3">{doctor.specialization}</p>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="font-semibold">{doctor.ratings?.average?.toFixed(1) || "0.0"}</span>
                      <span className="text-gray-500">
                        ({doctor.ratings?.totalReviews || 0} reviews)
                      </span>
                    </div>
                    
                    {doctor.isVerified && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-medium">Verified</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleBookAppointment}
                  className="bg-[#2C6975] text-white px-6 py-3 rounded-lg hover:bg-[#1f5460] font-semibold flex items-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Book Appointment
                </button>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock4 className="w-5 h-5 text-[#2C6975]" />
                  <span>{doctor.totalExperience || 0}+ years experience</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-5 h-5 text-[#2C6975]" />
                  <span>{doctor.averageConsultationTime || 15} min consultation</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-5 h-5 text-[#2C6975]" />
                  <span>{doctor.address?.city}, {doctor.address?.state}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Doctor Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-[#2C6975] mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed">
                {doctor.bio || "No bio available."}
              </p>
            </div>

            {/* Qualifications */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-[#2C6975] mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Qualifications
              </h2>
              <div className="space-y-4">
                {doctor.qualifications?.map((qual, index) => (
                  <div key={index} className="border-l-4 border-[#2C6975] pl-4 py-2">
                    <h3 className="font-semibold text-gray-800">{qual.degree}</h3>
                    <p className="text-gray-600">{qual.institution}</p>
                    <p className="text-sm text-gray-500">Year: {qual.year}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Specializations */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-[#2C6975] mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Specializations
              </h2>
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {doctor.specialization}
                </span>
                {doctor.subSpecialization?.map((subSpec, index) => (
                  <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    {subSpec}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Contact & Languages */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-[#2C6975] mb-4">Contact Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#2C6975]" />
                  <span className="text-gray-700">{doctor.phoneNo}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#2C6975]" />
                  <span className="text-gray-700">{doctor.email}</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#2C6975] mt-1" />
                  <div className="text-gray-700">
                    <p>{doctor.address?.street}</p>
                    <p>{doctor.address?.city}, {doctor.address?.state}</p>
                    <p>Pincode: {doctor.address?.pincode}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Languages */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-[#2C6975] mb-4 flex items-center gap-2">
                <Languages className="w-5 h-5" />
                Languages Spoken
              </h2>
              <div className="flex flex-wrap gap-2">
                {doctor.languages?.map((language, index) => (
                  <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                    {language}
                  </span>
                ))}
              </div>
            </div>

            {doctor.hospital_name && doctor.hospital_name !== '' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-[#2C6975] mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Hospital Affiliation
                </h2>
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-[#2C6975]" />
                  <span className="text-gray-700 font-medium">{doctor.hospital_name}</span>
                </div>
              </div>
            )}


            {/* Availability */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-[#2C6975] mb-4">Availability</h2>
              <div className="space-y-2">
                {doctor.weeklySchedule && doctor.weeklySchedule.length > 0 ? (
                  doctor.weeklySchedule
                    .filter(daySchedule => daySchedule.isWorking && daySchedule.slots && daySchedule.slots.length > 0)
                    .map((daySchedule) => (
                      <div key={daySchedule.day} className="flex justify-between items-center">
                        <span className="font-medium capitalize">{daySchedule.day}</span>
                        <span className="text-gray-600">
                          {daySchedule.slots[0].startTime} - {daySchedule.slots[daySchedule.slots.length - 1].endTime}
                        </span>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-500">Availability information not available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Booking Modal */}
      {showAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-[#2C6975] mb-4">
                Book Appointment with Dr. {doctor.name}
              </h2>
              
              <form onSubmit={handleAppointmentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={appointmentData.date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2C6975]"
                  />
                  
                  {/* Availability Status */}
                  {appointmentData.date && availabilityInfo && (
                    <div className={`mt-2 text-sm p-2 rounded ${
                      availabilityInfo.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {availabilityInfo.isAvailable ? (
                        <span>✅ Available on {new Date(appointmentData.date).toLocaleDateString()}</span>
                      ) : (
                        <span>❌ Not available: {availabilityInfo.reason}</span>
                      )}
                      {availabilityInfo.hasOverride && availabilityInfo.overrideReason && (
                        <div className="mt-1 text-xs">
                          Note: {availabilityInfo.overrideReason}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Time Slot *
                  </label>
                  
                  {isLoadingSlots ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2C6975]"></div>
                      <span>Loading available slots...</span>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <select
                      required
                      value={appointmentData.timeSlot}
                      onChange={(e) => setAppointmentData(prev => ({ ...prev, timeSlot: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2C6975]"
                    >
                      <option value="">Select time slot</option>
                      {availableSlots.map((slot, index) => (
                        <option 
                          key={index} 
                          value={slot.timeSlot}
                          disabled={!slot.available}
                        >
                          {formatTimeSlot(slot.timeSlot)}
                          {!slot.available && " (Fully booked)"}
                          {slot.available && ` (${slot.remainingSlots}/${slot.maxPatients} slots available)`}
                        </option>
                      ))}
                    </select>
                  ) : appointmentData.date ? (
                    <div className="text-sm text-gray-500 p-2 bg-gray-100 rounded">
                      {availabilityInfo?.isAvailable 
                        ? "No available slots for this date" 
                        : "Select a date to see available slots"}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 p-2 bg-gray-100 rounded">
                      Please select a date first
                    </div>
                  )}
                  
                  {availableSlots.some(slot => slot.available) && (
                    <div className="mt-2 text-xs text-green-600">
                      {availableSlots.filter(slot => slot.available).length} slot(s) available
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Visit *
                  </label>
                  <textarea
                    required
                    value={appointmentData.reason}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Please describe your symptoms or reason for consultation"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2C6975]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Symptoms (optional)
                  </label>
                  {appointmentData.symptoms.map((symptom, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={symptom}
                        onChange={(e) => updateSymptom(index, e.target.value)}
                        placeholder="Enter symptom"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2C6975]"
                      />
                      <button
                        type="button"
                        onClick={() => removeSymptom(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSymptomField}
                    className="text-[#2C6975] hover:text-[#1f5460] text-sm font-medium"
                  >
                    + Add Symptom
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center border border-gray-200">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-[#2C6975]" />
                    <span className="text-sm font-medium text-gray-700">Consultation Fee</span>
                  </div>
                  <span className="text-lg font-bold text-[#2C6975]">₹{doctor.consultationFee || 500}</span>
                </div>
      
                {/* Payment Note */}
                <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                  <p>💡 You will be redirected to a secure payment gateway after confirming. Your appointment will be confirmed only after successful payment.</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAppointmentModal(false);
                      setAvailableSlots([]);
                      setAvailabilityInfo(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isBooking || !appointmentData.date || !appointmentData.timeSlot || !availabilityInfo?.isAvailable}
                    className="flex-1 bg-[#2C6975] text-white px-4 py-2 rounded hover:bg-[#1f5460] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBooking ? "Processing..." : `Pay ₹${doctor.consultationFee || 500} & Confirm`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorProfile;