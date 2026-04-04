import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  UserCircle,
  Stethoscope,
  Award,
  Calendar,
  ArrowLeft,
  Phone,
} from "lucide-react";
import { apiService } from "../../services/api";

const RegisterDoctor = () => {
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userType, setUserType] = useState("doctor");
  const [validation, setValidation] = useState({
    usernameAvailable: null,
    emailAvailable: null,
    regnoAvailable:null,
    phoneAvailable:null
  });
  const [hospitalEmail, setHospitalEmail] = useState('');
  const [hospitalVerified, setHospitalVerified] = useState(false);
  const [hospitalVerificationError, setHospitalVerificationError] = useState('');
  

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    phoneNo: "",
    registrationNumber: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const checkUsername = async (username) => {
    if (!username) return;
    try {
      const res = await checkUsername1(username);
      setValidation((prev) => ({ ...prev, usernameAvailable: res.available }));
    } catch (err) {
      console.error("Username check failed:", err);
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

  const checkPhoneno = async (Phoneno) => {
    if (!Phoneno) return;
    try {
      const res = await checkPhoneno1(Phoneno);
      setValidation((prev) => ({ ...prev, phoneAvailable: res.available }));
    } catch (err) {
      console.error("Email check failed:", err);
    }
  };

  const checkRegno = async (Regno) => {
    if (!Regno) return;
    try {
      const res = await checkRegno1(Regno);
      setValidation((prev) => ({ ...prev, regnoAvailable: res.available }));
    } catch (err) {
      console.error("Email check failed:", err);
    }
  };
  
  async function checkUsername1(username) {
    const response = await fetch(`${API_BASE_URL}/check-username/${username}`);
    console.log(response);
    return await response.json();
  };
  
  async function checkEmail1(email) {
    const response = await fetch(`${API_BASE_URL}/check-email/${email}`);
    return await response.json();
  };

  async function checkPhoneno1(Phoneno) {
    const response = await fetch(`${API_BASE_URL}/check-phoneno/${Phoneno}`);
    return await response.json();
  };

  async function checkRegno1(Regno) {
    const response = await fetch(`${API_BASE_URL}/check-regisno/${Regno}`);
    console.log(response);
    return await response.json();
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (formData.phoneNo.length !== 10) {
      setError("Phone number must be 10 digits!");
      return;
    }

    if (!formData.registrationNumber) {
      setError("Registration number is required!");
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.registerDoctor({
        username: formData.username,
        name: formData.name,
        email: formData.email,
        phoneNo: formData.phoneNo,
        registrationNumber: formData.registrationNumber,
        password: formData.password,
        hospitalemail: hospitalVerified ? hospitalEmail : '', 
      });
      console.log(response);
      if (response.success) {
        if (response.data.token) {
          localStorage.setItem("authToken", response.data.token);
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }

        alert(response.data.message || "Doctor registration successful!");
        navigate("/login");
      } else {
        setError(response.data.message || "Registration failed!");
      }
    } catch (err) {
      setError("Unexpected error. Please try again.");
      console.error("Doctor registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#FCFCF9] px-4 py-4">
      <div className="bg-white shadow-lg rounded-xl w-full max-w-xl p-5 relative">
        {/* Back Button */}
        <Link
          to="/explore"
          className="flex items-center text-[#21748C] hover:text-[#1D6278] transition-colors mb-4"
        >
          <ArrowLeft size={20} className="mr-1" />
          <span className="text-sm font-medium">Back</span>
        </Link>

        {/* Header */}
        <h1 className="text-2xl font-bold text-[#21748C] text-center mb-1">
          Medicare
        </h1>
        <p className="text-center text-[#626C71] text-sm mb-6">
          Your healthcare journey starts here
        </p>

        {/* Tabs */}
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
                onChange={(e) => {
                  setUserType(e.target.value);
                  navigate('/register/register_patient');
                }}
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
                onChange={(e) => setUserType(e.target.value)}
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
              <UserCircle className="ml-2 mr-1 text-[#21748C]" size={18} />
              <span className="text-[#134252] font-medium text-sm">Hospital</span>
            </label>
          </div>
        </div>

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
              placeholder="Enter full name"
              required
              className="w-full border border-[#BED5C9] rounded-lg px-3 py-2.5 outline-none focus:border-[#21748C]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[#134252] font-medium mb-1.5 text-sm">
              Email *
            </label>
            <div className="flex items-center border border-[#BED5C9] rounded-lg px-3 py-2.5">
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
            <div className="flex items-center border border-[#BED5C9] rounded-lg px-3 py-2.5">
              <Phone className="text-[#626C71] mr-2" size={18} />
              <input
                type="tel"
                name="phoneNo"
                value={formData.phoneNo}
                onChange={handleChange}
                onBlur={() => checkPhoneno(formData.phoneNo)}
                placeholder="10-digit number"
                required
                maxLength="10"
                pattern="[0-9]{10}"
                className="w-full outline-none text-sm"
              />
              {validation.phoneAvailable === false && (
                <p className="text-red-600 text-xs mt-1">Phone Number registered</p>
              )}
              {validation.phoneAvailable === true && (
                <p className="text-green-600 text-xs mt-1">Phone Number available</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[#134252] font-medium mb-1.5 text-sm">
              Registration Number *
            </label>
            <div className="flex items-center border border-[#BED5C9] rounded-lg px-3 py-2.5">
              <Award className="text-[#626C71] mr-2" size={18} />
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={(e) => {
                  const value = e.target.value; // remove non-digits
                  setFormData((prev) => ({ ...prev, registrationNumber: value }));
                }}
                onBlur={() => checkRegno(formData.registrationNumber)}
                placeholder="Example MCP223456"
                required
                className="w-full outline-none text-sm"
              />
              {validation.regnoAvailable === false && (
                <p className="text-red-600 text-xs mt-1">Registration Number registered</p>
              )}
              {validation.regnoAvailable === true && (
                <p className="text-green-600 text-xs mt-1">Registration Number available</p>
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[#134252] font-medium mb-1.5 text-sm">
              Associated Hospital (Optional)
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center border border-[#BED5C9] rounded-lg px-3 py-2.5">
                <Mail className="text-[#626C71] mr-2" size={18} />
                <input
                  type="email"
                  name="hospitalEmail"
                  value={hospitalEmail}
                  onChange={(e) => {
                    setHospitalEmail(e.target.value);
                    setHospitalVerified(false);
                    setHospitalVerificationError('');
                  }}
                  placeholder="Enter hospital email"
                  className="w-full outline-none text-sm"
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!hospitalEmail) return;
                  try {
                    const res = await fetch(`${API_BASE_URL}/check-hospital-email/${encodeURIComponent(hospitalEmail)}`);
                    const data = await res.json();
                    if (data.exists) {
                      setHospitalVerified(true);
                      setHospitalVerificationError('');
                    } else {
                      setHospitalVerified(false);
                      setHospitalVerificationError('No hospital found with this email');
                    }
                  } catch (err) {
                    setHospitalVerificationError('Verification failed. Try again.');
                  }
                }}
                className="px-4 py-2.5 bg-[#D4E6DC] text-[#21748C] rounded-lg text-sm font-medium hover:bg-[#C5DDD0] transition-colors"
              >
                Verify
              </button>
            </div>
            {hospitalVerificationError && (
              <p className="text-red-600 text-xs mt-1">{hospitalVerificationError}</p>
            )}
            {hospitalVerified && (
              <p className="text-green-600 text-xs mt-1">✓ Hospital verified</p>
            )}
          </div>
          <div>
            <label className="block text-[#134252] font-medium mb-1.5 text-sm">
              Password *
            </label>
            <div className="flex items-center border border-[#BED5C9] rounded-lg px-3 py-2.5">
              <Lock className="text-[#626C71] mr-2" size={18} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
                className="w-full outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#134252] font-medium mb-1.5 text-sm">
              Confirm Password *
            </label>
            <div className="flex items-center border border-[#BED5C9] rounded-lg px-3 py-2.5">
              <Lock className="text-[#626C71] mr-2" size={18} />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                required
                className="w-full outline-none text-sm"
              />
            </div>
          </div>

          <div className="md:col-span-2 mt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#21748C] text-white rounded-lg font-semibold hover:bg-[#1D6278] transition-colors text-sm disabled:opacity-50"
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

export default RegisterDoctor;
