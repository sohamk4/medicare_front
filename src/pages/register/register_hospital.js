import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  UserCircle,
  ArrowLeft,
  Phone,
  Award,
} from "lucide-react";
import { FaHospital } from "react-icons/fa";
import { apiService } from "../../services/api";

const RegisterHospital = () => {
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userType, setUserType] = useState("hospital");

  const [validation, setValidation] = useState({
    emailAvailable: null,
    regnoAvailable: null,
    phoneAvailable: null,
  });

  const [formData, setFormData] = useState({
    name: "",               // Hospital name
    email: "",
    phoneNo: "",
    tier: "",
    building: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    password: "",
    confirmPassword: "",
  });

  // ---------------- HANDLERS ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  // ---------------- VALIDATION ----------------
  const checkEmail = async (email) => {
    if (!email) return;
    const res = await fetch(`${API_BASE_URL}/check-email/${email}`);
    const data = await res.json();
    setValidation((prev) => ({ ...prev, emailAvailable: data.available }));
  };

  const checkPhoneno = async (phone) => {
    if (!phone) return;
    const res = await fetch(`${API_BASE_URL}/check-phoneno/${phone}`);
    const data = await res.json();
    setValidation((prev) => ({ ...prev, phoneAvailable: data.available }));
  };

  const checkRegno = async (reg) => {
    if (!reg) return;
    const res = await fetch(`${API_BASE_URL}/check-regisno/${reg}`);
    const data = await res.json();
    setValidation((prev) => ({ ...prev, regnoAvailable: data.available }));
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    if (!formData.name) {
      setError("Hospital name is required!");
      return;
    }
    if (!formData.email) {
      setError("Email is required!");
      return;
    }
    if (!formData.password) {
      setError("Password is required!");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long!");
      return;
    }
    if (formData.phoneNo && formData.phoneNo.length !== 10) {
      setError("Phone number must be 10 digits!");
      return;
    }

    if (!formData.tier) {
      setError("Please select hospital tier!");
      return;
    }

    // Validate address fields (all required)
    if (!formData.building || !formData.street || !formData.city || !formData.state || !formData.pincode) {
      setError("Please fill all address fields (Building, Street, City, State, Pincode)");
      return;
    }

    // Construct address object
    const address = {
      building: formData.building,
      street: formData.street,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
    };

    setLoading(true);

    try {
      const response = await apiService.registerHospital({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phoneNo: formData.phoneNo,
        tier: formData.tier,
        address: address,
      });

      if (response.success) {
        alert(response.message || "Hospital registration successful!");
        navigate("/login");
      } else {
        setError(response.message || "Registration failed!");
      }
    } catch (err) {
      setError("Unexpected error. Please try again.");
      console.error("Hospital registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="flex justify-center items-center min-h-screen bg-[#FCFCF9] px-4 py-4">
      <div className="bg-white shadow-lg rounded-xl w-full max-w-xl p-5 relative">

        {/* Back */}
        <Link to="/explore" className="flex items-center text-[#21748C] mb-4">
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
            <button className="w-full py-2.5 text-sm bg-[#D4E6DC] text-[#21748C] font-semibold rounded-l-lg border border-[#BED5C9]">
              Login
            </button>
          </Link>
          <button className="w-1/2 py-2.5 text-sm bg-[#21748C] text-white font-semibold rounded-r-lg border border-[#21748C]">
            Register
          </button>
        </div>

        {/* USER TYPE */}
        <div className="mb-5">
          <label className="block text-[#134252] font-medium mb-2.5 text-sm">
            I am registering as a:
          </label>
          <div className="flex gap-5">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={false}
                onChange={() => navigate("/register/register_patient")}
              />
              <User className="ml-2 mr-1 text-[#21748C]" size={18} />
              <span className="text-[#134252] font-medium text-sm">Patient</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={false}
                onChange={() => navigate("/register/register_doctor")}
              />
              <UserCircle className="ml-2 mr-1 text-[#21748C]" size={18} />
              <span className="text-[#134252] font-medium text-sm">Doctor</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input type="radio" checked readOnly />
              <FaHospital className="ml-2 mr-1 text-[#21748C]" size={18} />
              <span className="text-[#134252] font-medium text-sm">Hospital</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Hospital Name */}
          <div>
            <label className="block text-[#134252] font-medium mb-1.5 text-sm">
              Hospital Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter hospital name"
              required
              className="w-full border border-[#BED5C9] rounded-lg px-3 py-2.5 outline-none focus:border-[#21748C]"
            />
          </div>

          {/* Email */}
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
            </div>
            {validation.emailAvailable === false && (
              <p className="text-red-600 text-xs mt-1">Email already registered</p>
            )}
            {validation.emailAvailable === true && (
              <p className="text-green-600 text-xs mt-1">Email available</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-[#134252] font-medium mb-1.5 text-sm">
              Phone Number *
            </label>
            <div className="flex items-center border border-[#BED5C9] rounded-lg px-3 py-2.5">
              <Phone className="text-[#626C71] mr-2" size={18} />
              <input
                type="text"
                name="phoneNo"
                value={formData.phoneNo}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setFormData((prev) => ({ ...prev, phoneNo: value }));
                }}
                onBlur={() => checkPhoneno(formData.phoneNo)}
                placeholder="10-digit number"
                required
                maxLength="10"
                className="w-full outline-none text-sm"
              />
            </div>
            {validation.phoneAvailable === false && (
              <p className="text-red-600 text-xs mt-1">Phone Number already registered</p>
            )}
            {validation.phoneAvailable === true && (
              <p className="text-green-600 text-xs mt-1">Phone Number available</p>
            )}
          </div>

          {/* Tier */}
          <div>
            <label className="block text-[#134252] font-medium mb-1.5 text-sm">Tier *</label>
            <select
              name="tier"
              value={formData.tier}
              onChange={handleChange}
              className="w-full border border-[#BED5C9] rounded-lg px-3 py-2.5"
              required
            >
              <option value="">Select Tier</option>
              <option value="2">Tier 1</option>
              <option value="3">Tier 2</option>
            </select>
          </div>

          {/* Address fields */}
          <div>
            <label className="block text-[#134252] font-medium mb-1.5 text-sm">
              Building / No. *
            </label>
            <input
              type="text"
              name="building"
              value={formData.building}
              onChange={handleChange}
              placeholder="Building name or number"
              required
              className="w-full border border-[#BED5C9] rounded-lg px-3 py-2.5 outline-none"
            />
          </div>

          <div>
            <label className="block text-[#134252] font-medium mb-1.5 text-sm">
              Street / Landmark *
            </label>
            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleChange}
              placeholder="Street or landmark"
              required
              className="w-full border border-[#BED5C9] rounded-lg px-3 py-2.5 outline-none"
            />
          </div>

          <div>
            <label className="block text-[#134252] font-medium mb-1.5 text-sm">
              City *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="w-full border border-[#BED5C9] rounded-lg px-3 py-2.5 outline-none"
            />
          </div>

          <div>
            <label className="block text-[#134252] font-medium mb-1.5 text-sm">
              State *
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
              className="w-full border border-[#BED5C9] rounded-lg px-3 py-2.5 outline-none"
            />
          </div>

          <div>
            <label className="block text-[#134252] font-medium mb-1.5 text-sm">
              Pincode *
            </label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setFormData((prev) => ({ ...prev, pincode: value }));
              }}
              required
              maxLength="6"
              placeholder="6-digit pincode"
              className="w-full border border-[#BED5C9] rounded-lg px-3 py-2.5 outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[#134252] font-medium mb-1.5 text-sm">Password *</label>
            <div className="flex items-center border border-[#BED5C9] rounded-lg px-3 py-2.5">
              <Lock className="text-[#626C71] mr-2" size={18} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                required
                className="w-full outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#134252] font-medium mb-1.5 text-sm">Confirm Password *</label>
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

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#21748C] text-white rounded-lg font-semibold hover:bg-[#1D6278] transition-colors text-sm disabled:opacity-50"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </div>
        </form>

        <p className="text-xs text-center mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-[#21748C] font-semibold">
            Login here
          </Link>
        </p>

      </div>
    </div>
  );
};

export default RegisterHospital;