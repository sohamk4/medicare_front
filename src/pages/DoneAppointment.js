import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, User, FileText, Pill, Activity } from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

export default function DoneAppointment() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAppointmentDetails();
  }, [appointmentId]);

  const fetchAppointmentDetails = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await axios.get(
        `${API_BASE_URL}/appointments/${appointmentId}?username=${userData.username!=null?userData.username:userData.email}`
      );

      if (response.data.success) {
        setAppointment(response.data.data.appointment);
      } else {
        setError("Failed to fetch appointment details");
      }
    } catch (err) {
      setError("Error fetching appointment details: " + err.message);
    } finally {
      setLoading(false);
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-[#F6FAF8]">
      {/* Header */}
      <nav className="w-full bg-[#0E5F73] flex items-center px-6 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-white text-sm font-medium mr-3"
        >
          <ArrowLeft size={20} className="mr-1" />
          Back
        </button>
        <span className="flex items-center text-[#FDFDFB] text-2xl font-semibold ml-2">
          Appointment Details
        </span>
      </nav>

      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Appointment Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-[#16697A]">
                Appointment #{appointment.appointmentId.slice(-6)}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <p className="text-[#16697A] text-sm">{appointment.patient.email}</p>
                </div>
              </div>
            </div>

            {/* Appointment Details */}
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

          {/* Consultation Details */}
          <div className="lg:col-span-2 space-y-6">
            {appointment.consultation && (
              <>
                {/* Diagnosis */}
                <div className="bg-white rounded-xl shadow p-6">
                  <h2 className="text-xl font-semibold text-[#16697A] mb-4">Diagnosis</h2>
                  <p className="text-[#16697A]">{appointment.consultation.diagnosis || "No diagnosis recorded"}</p>
                </div>

                {/* Vital Signs */}
                {appointment.consultation.vitalSigns && Object.keys(appointment.consultation.vitalSigns).length > 0 && (
                  <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-xl font-semibold text-[#16697A] flex items-center gap-2 mb-4">
                      <Activity size={20} />
                      Vital Signs
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {appointment.consultation.vitalSigns.bloodPressure && (
                        <div>
                          <label className="text-sm font-medium text-[#21748C]">Blood Pressure</label>
                          <p className="text-[#16697A] font-medium">{appointment.consultation.vitalSigns.bloodPressure}</p>
                        </div>
                      )}
                      {appointment.consultation.vitalSigns.heartRate && (
                        <div>
                          <label className="text-sm font-medium text-[#21748C]">Heart Rate</label>
                          <p className="text-[#16697A] font-medium">{appointment.consultation.vitalSigns.heartRate} bpm</p>
                        </div>
                      )}
                      {appointment.consultation.vitalSigns.temperature && (
                        <div>
                          <label className="text-sm font-medium text-[#21748C]">Temperature</label>
                          <p className="text-[#16697A] font-medium">{appointment.consultation.vitalSigns.temperature}°F</p>
                        </div>
                      )}
                      {appointment.consultation.vitalSigns.weight && (
                        <div>
                          <label className="text-sm font-medium text-[#21748C]">Weight</label>
                          <p className="text-[#16697A] font-medium">{appointment.consultation.vitalSigns.weight} kg</p>
                        </div>
                      )}
                      {appointment.consultation.vitalSigns.spo2 && (
                        <div>
                          <label className="text-sm font-medium text-[#21748C]">SpO2</label>
                          <p className="text-[#16697A] font-medium">{appointment.consultation.vitalSigns.spo2}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Prescription */}
                {appointment.consultation.prescription && appointment.consultation.prescription.length > 0 && (
                  <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-xl font-semibold text-[#16697A] flex items-center gap-2 mb-4">
                      <Pill size={20} />
                      Prescription
                    </h2>
                    <div className="space-y-3">
                      {appointment.consultation.prescription.map((med, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-[#16697A]">{med.medicine}</h3>
                              <p className="text-sm text-[#21748C]">{med.dosage} • {med.frequency}</p>
                            </div>
                            <span className="text-sm text-[#21748C] bg-gray-100 px-2 py-1 rounded">
                              {med.duration}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tests & Follow-up */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {appointment.consultation.testsRecommended && appointment.consultation.testsRecommended.length > 0 && (
                    <div className="bg-white rounded-xl shadow p-6">
                      <h2 className="text-xl font-semibold text-[#16697A] mb-4">Tests Recommended</h2>
                      <ul className="list-disc list-inside space-y-1 text-[#16697A]">
                        {appointment.consultation.testsRecommended.map((test, index) => (
                          <li key={index}>{test}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {appointment.consultation.followUpDate && (
                    <div className="bg-white rounded-xl shadow p-6">
                      <h2 className="text-xl font-semibold text-[#16697A] mb-4">Follow-up</h2>
                      <p className="text-[#16697A]">
                        {new Date(appointment.consultation.followUpDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Doctor's Notes */}
                {appointment.consultation.notes && (
                  <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-xl font-semibold text-[#16697A] mb-4">Doctor's Notes</h2>
                    <p className="text-[#16697A] whitespace-pre-wrap">{appointment.consultation.notes}</p>
                  </div>
                )}
              </>
            )}

            {!appointment.consultation && (
              <div className="bg-white rounded-xl shadow p-6 text-center">
                <p className="text-[#21748C]">No consultation details available for this appointment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}