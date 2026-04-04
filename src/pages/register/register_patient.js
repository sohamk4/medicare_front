import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, UserCircle, ArrowLeft, Phone, CreditCard } from "lucide-react";
import { apiService } from "../../services/api";
import { FaHospital } from "react-icons/fa";

const RegisterPatient = () => {
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();
  const [userType, setUserType] = useState("patient");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validation, setValidation] = useState({
    usernameAvailable: null,
    emailAvailable: null,
    aadharAvailable:null,
    phoneAvailable:null
  });
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    phoneNo: "",
    aadharCardNo: "",
    password: "",
    confirmPassword: ""
  });

  const checkUsername = async (username) => {
    if (!username) return;
    try {
      const res = await checkUsername1(username);
      setValidation((prev) => ({ ...prev, usernameAvailable: res.available }));
    } catch (err) {
      console.error("Username check failed:", err);
    }
  };
  
  const checkAadhar = async (aadhar) => {
    if (!aadhar) return;
    try {
      const res = await checkaadhar1(aadhar);
      setValidation((prev) => ({ ...prev, aadharAvailable: res.available }));
    } catch (err) {
      console.error("Username check failed:", err);
    }
  };

  const checkPhoneno = async (Phoneno) => {
    if (!Phoneno) return;
    try {
      const res = await checkPhoneno1(Phoneno);
      setValidation((prev) => ({ ...prev, phoneAvailable: res.available }));
    } catch (err) {
      console.error("Email check failed:", err);
    }
  };

  const checkEmail = async (email) => {
    if (!email) return;
    try {
      const res = await checkEmail1(email);
      setValidation((prev) => ({ ...prev, emailAvailable: res.available }));
    } catch (err) {
      console.error("Email check failed:", err);
    }
  };
  
  async function checkUsername1(username) {
    const response = await fetch(`${API_BASE_URL}/check-username/${username}`);
    console.log(response);
    return await response.json();
  };

  async function checkaadhar1(aadhar) {
    const response = await fetch(`${API_BASE_URL}/check-aadhar/${aadhar}`);
    console.log(response);
    return await response.json();
  };

  async function checkPhoneno1(Phoneno) {
    const response = await fetch(`${API_BASE_URL}/check-phoneno/${Phoneno}`);
    return await response.json();
  };
  
  async function checkEmail1(email) {
    const response = await fetch(`${API_BASE_URL}/check-email/${email}`);
    return await response.json();
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (formData.phoneNo.length !== 10) {
      setError("Phone number must be 10 digits!");
      return;
    }

    if (formData.aadharCardNo.length !== 12) {
      setError("Aadhar card number must be 12 digits!");
      return;
    }

    setLoading(true);

    try {
      // Use API service (will use mock or real API based on configuration)
      const response = await apiService.registerPatient({
        username: formData.username,
        name: formData.name,
        email: formData.email,
        phoneNo: formData.phoneNo,
        aadharCardNo: formData.aadharCardNo,
        password: formData.password
      });

      if (response.success) {
        // Store token in localStorage (optional)
        if (response.data.token) {
          localStorage.setItem("authToken", response.data.token);
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }

        alert(response.data.message || "Registration successful! Please login.");
        navigate("/login");
      } else {
        setError(response.data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#FCFCF9] px-4 py-4">
      <div className="bg-white shadow-lg rounded-xl w-full max-w-xl p-5 relative">
        {/* Back Button - Fixed Position */}
        <Link
          to="/explore"
          className="flex items-center text-[#21748C] hover:text-[#1D6278] transition-colors mb-4"
        >
          <ArrowLeft size={20} className="mr-1" />
          <span className="text-sm font-medium">Back</span>
        </Link>

        {/* Header - Fixed Position */}
        <h1 className="text-2xl font-bold text-[#21748C] text-center mb-1">
          Medicare
        </h1>
        <p className="text-center text-[#626C71] text-sm mb-6">
          Your healthcare journey starts here
        </p>

        {/* Toggle Buttons - Fixed Position */}
        <div className="flex mb-6">
          <Link to="/login" className="w-1/2">
            <button className="w-full py-2.5 text-sm bg-[#D4E6DC] text-[#21748C] font-semibold rounded-l-lg border border-[#BED5C9] hover:bg-[#C5DDD0] transition-all duration-300">
              Login
            </button>
          </Link>
          <button className="w-1/2 py-2.5 text-sm bg-[#21748C] text-white font-semibold rounded-r-lg border border-[#21748C] transition-all duration-300">
            Register
          </button>
        </div>

        {/* Dynamic Content Area - 2 Column Grid Layout */}
        <div className="min-h-[400px]">
        {/* User Type Selection */}
        <div className="mb-5">
          <label className="block text-[#134252] font-medium mb-2.5 text-sm">
            I am registering as a:
          </label>
          <div className="flex gap-5">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="userType"
                value="patient"
                checked={userType === "patient"}
                onChange={(e) => setUserType(e.target.value)}
                className="w-4 h-4 text-[#21748C] border-[#BED5C9] focus:ring-[#21748C] focus:ring-2"
              />
              <User className="ml-2 mr-1 text-[#21748C]" size={18} />
              <span className="text-[#134252] font-medium text-sm">Patient</span>
            </label>
      
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="userType"
                value="doctor"
                checked={userType === "doctor"}
                onChange={(e) => {
                  setUserType(e.target.value);
                  navigate('/register/register_doctor');
                }}
                className="w-4 h-4 text-[#21748C] border-[#BED5C9] focus:ring-[#21748C] focus:ring-2"
              />
              <UserCircle className="ml-2 mr-1 text-[#21748C]" size={18} />
              <span className="text-[#134252] font-medium text-sm">Doctor</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="userType"
                value="hospital"
                checked={userType === "hospital"}
                onChange={(e) => {
                  setUserType(e.target.value);
                  navigate('/register/register_hospital');
                }}
                className="w-4 h-4 text-[#21748C] border-[#BED5C9] focus:ring-[#21748C] focus:ring-2"
              />
              <FaHospital className="ml-2 mr-1 text-[#21748C]" size={18} />
              <span className="text-[#134252] font-medium text-sm">Hospital</span>
            </label>
          </div>
        </div>
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#134252] font-medium mb-1.5 text-sm">
                Username *
              </label>
              <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              onBlur={() => checkUsername(formData.username)}
              placeholder="Enter username"
              required
              className="w-full border border-[#BED5C9] rounded-lg px-3 py-2.5 outline-none focus:border-[#21748C]"
              />
              {validation.usernameAvailable === false && (
                <p className="text-red-600 text-xs mt-1">Username already taken</p>
              )}
              {validation.usernameAvailable === true && (
                <p className="text-green-600 text-xs mt-1">Username available</p>
              )}
            </div>

            <div>
              <label className="block text-[#134252] font-medium mb-1.5 text-sm">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
                className="w-full border border-[#BED5C9] rounded-lg px-3 py-2.5 outline-none focus:border-[#21748C] focus:ring-2 focus:ring-[#21748C]/20 text-[#134252] text-sm placeholder:text-[#A7A9A9]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[#134252] font-medium mb-1.5 text-sm">
                Email *
              </label>
              <div className="flex items-center border border-[#BED5C9] rounded-lg px-3 py-2.5 focus-within:border-[#21748C] focus-within:ring-2 focus-within:ring-[#21748C]/20">
                <Mail className="text-[#626C71] mr-2" size={18} />
                <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => checkEmail(formData.email)}
                placeholder="Enter your email"
                required
                className="w-full outline-none text-sm"
                />
                
                {validation.emailAvailable === false && (
                  <p className="text-red-600 text-xs mt-1">Email already registered</p>
                )}
                {validation.emailAvailable === true && (
                  <p className="text-green-600 text-xs mt-1">Email available</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[#134252] font-medium mb-1.5 text-sm">
                Phone Number *
              </label>
              <div className="flex items-center border border-[#BED5C9] rounded-lg px-3 py-2.5 focus-within:border-[#21748C] focus-within:ring-2 focus-within:ring-[#21748C]/20">
                <Phone className="text-[#626C71] mr-2" size={18} />
                <input
                  type="text"
                  name="phoneNo"
                  value={formData.phoneNo}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ""); // remove non-digits
                    setFormData((prev) => ({ ...prev, phoneNo: value }));
                  }}
                  onBlur={() => checkPhoneno(formData.phoneNo)}
                  placeholder="10-digit number"
                  required
                  maxLength="10"
                  className="w-full outline-none text-sm"
                />
                {validation.phoneAvailable === false && (
                  <p className="text-red-600 text-xs mt-1">phone Number registered</p>
                )}
                {validation.phoneAvailable === true && (
                  <p className="text-green-600 text-xs mt-1">phone Number available</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[#134252] font-medium mb-1.5 text-sm">
                Aadhar Card Number *
              </label>
              <div className="flex items-center border border-[#BED5C9] rounded-lg px-3 py-2.5 focus-within:border-[#21748C] focus-within:ring-2 focus-within:ring-[#21748C]/20">
                <CreditCard className="text-[#626C71] mr-2" size={18} />
                <input
                  type="text"
                  name="aadharCardNo"
                  value={formData.aadharCardNo}
                  onChange={handleChange}
                  onBlur={() => checkAadhar(formData.aadharCardNo)}
                  placeholder="12-digit Aadhar"
                  required
                  maxLength="12"
                  pattern="[0-9]{12}"
                  className="w-full outline-none text-[#134252] text-sm placeholder:text-[#A7A9A9]"
                />
                {validation.aadharAvailable === false && (
                  <p className="text-red-600 text-xs mt-1">Aadhar already registered</p>
                )}
                {validation.aadharAvailable === true && (
                  <p className="text-green-600 text-xs mt-1">Aadhar available</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[#134252] font-medium mb-1.5 text-sm">
                Password *
              </label>
              <div className="flex items-center border border-[#BED5C9] rounded-lg px-3 py-2.5 focus-within:border-[#21748C] focus-within:ring-2 focus-within:ring-[#21748C]/20">
                <Lock className="text-[#626C71] mr-2" size={18} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                  minLength="6"
                  className="w-full outline-none text-[#134252] text-sm placeholder:text-[#A7A9A9]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#134252] font-medium mb-1.5 text-sm">
                Confirm Password *
              </label>
              <div className="flex items-center border border-[#BED5C9] rounded-lg px-3 py-2.5 focus-within:border-[#21748C] focus-within:ring-2 focus-within:ring-[#21748C]/20">
                <Lock className="text-[#626C71] mr-2" size={18} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  required
                  minLength="6"
                  className="w-full outline-none text-[#134252] text-sm placeholder:text-[#A7A9A9]"
                />
              </div>
            </div>

            <div className="md:col-span-2 mt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#21748C] text-white rounded-lg font-semibold hover:bg-[#1D6278] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Registering May take time..." : "Register"}
              </button>
            </div>
          </form>

          <p className="text-xs text-center mt-4 text-[#626C71]">
            Already have an account?{" "}
            <Link to="/login" className="text-[#21748C] font-semibold hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPatient;
