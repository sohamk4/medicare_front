import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./components/Homepage";
import HospitalExplorer from "./pages/Explore_now";
import Login from "./pages/login";
import RegisterPatient from "./pages/register/register_patient";
import RegisterDoctor from "./pages/register/register_doctor";
import RegisterHospital from "./pages/register/register_hospital";
import PatientDashboard from "./pages/dashboard/patient_dashboard";
import DoctorDashboard from "./pages/dashboard/doctor_dashboard";
import HospitalDashboard from "./pages/dashboard/HospitalDashboard";
import EditProfile from "./pages/dashboard/edit_profile";
import CompleteProfile from "./pages/CompletePaitentProfile";
import CompleteDoctorProfile from "./pages/CompleteDoctorProfile";
import EditDoctorProfile from "./pages/dashboard/edit_doc_profile";
import DoctorProfile from "./pages/dashboard/DoctorProfile";
import DoneAppointment from "./pages/DoneAppointment";
import Consultation from "./pages/Consultation";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/explore" element={<HospitalExplorer />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register/register_patient" element={<RegisterPatient />} />
        <Route path="/register/register_doctor" element={<RegisterDoctor />} />
        <Route path="/register/register_hospital" element={<RegisterHospital />} />
        <Route path="/dashboard/patient" element={<PatientDashboard />} />
        <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
        <Route path="/dashboard/hospital" element={<HospitalDashboard />} />
        <Route path="/edit_profile" element={<EditProfile />} />
        <Route path="/edit_profile_doc" element={<EditDoctorProfile />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/complete-doctor-profile" element={<CompleteDoctorProfile />} />
        <Route path="/doctor/:username" element={<DoctorProfile />} />
        <Route path="/done-appointment/:appointmentId" element={<DoneAppointment />} />
        <Route path="/consultation/:appointmentId" element={<Consultation />} />
      </Routes>
    </Router>
  );
}

export default App;
