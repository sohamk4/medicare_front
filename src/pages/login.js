import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, ArrowLeft } from "lucide-react";
import { apiService } from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiService.login(credentials);
      console.log(response);
      if (response.data.success) {
        const user = response.data.data;
        localStorage.setItem("user", JSON.stringify(user));
        console.log('here');
        // Redirect to respective dashboard
        if (user.userType === "doctor") {
          navigate("/dashboard/doctor");
        } else if (user.userType === "patient") {
          navigate("/dashboard/patient");
        } else if (user.userType === "hospital"){
          navigate("/dashboard/hospital");
        }
        else {
          navigate("/explore");
        }
      } else {
        setError(response.data.message || "Invalid credentials.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
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
          <button className="w-1/2 py-2.5 text-sm bg-[#21748C] text-white font-semibold rounded-l-lg border border-[#21748C]">
            Login
          </button>
          <Link to="/register/register_patient" className="w-1/2">
            <button className="w-full py-2.5 text-sm bg-[#D4E6DC] text-[#21748C] font-semibold rounded-r-lg border border-[#BED5C9] hover:bg-[#C5DDD0] transition-all duration-300">
              Register
            </button>
          </Link>
        </div>

        <div className="min-h-[400px]">
          {error && (
            <div className="p-3 mb-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#134252] font-medium mb-1.5 text-sm">
                Email
              </label>
              <div className="flex items-center border border-[#BED5C9] rounded-lg px-3 py-2.5">
                <User className="text-[#626C71] mr-2" size={18} />
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={credentials.email}
                  onChange={handleChange}
                  required
                  className="w-full outline-none text-[#134252] text-sm placeholder:text-[#A7A9A9]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#134252] font-medium mb-1.5 text-sm">
                Password
              </label>
              <div className="flex items-center border border-[#BED5C9] rounded-lg px-3 py-2.5">
                <Lock className="text-[#626C71] mr-2" size={18} />
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={handleChange}
                  required
                  className="w-full outline-none text-[#134252] text-sm placeholder:text-[#A7A9A9]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#21748C] text-white rounded-lg font-semibold hover:bg-[#1D6278] transition-colors mt-5 text-sm disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <p className="text-xs text-center mt-3 text-[#626C71]">
              Don't have an account?{" "}
              <Link
                to="/register/register_patient"
                className="text-[#21748C] font-semibold hover:underline"
              >
                Register now
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
