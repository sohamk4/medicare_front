// RegisterDoctorModal.jsx
import React from "react";
import { X } from "lucide-react";

const RegisterDoctorModal = ({
  show,
  onClose,
  onSubmit,
  formData,
  setFormData,
  loading,
  error
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold text-[#16697A]">Register New Doctor</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#21748C] mb-1">Username *</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#21748C]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#21748C] mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#21748C]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#21748C] mb-1">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#21748C]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#21748C] mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              maxLength="10"
              value={formData.phoneNo}
              onChange={(e) => setFormData({...formData, phoneNo: e.target.value.replace(/\D/g, "")})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#21748C]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#21748C] mb-1">Registration Number *</label>
            <input
              type="text"
              required
              value={formData.registrationNumber}
              onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#21748C]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#21748C] mb-1">Password *</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#21748C]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#21748C] mb-1">Confirm Password *</label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#21748C]"
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#2BA2A5] to-[#44BAA0] text-white py-2 rounded-lg font-semibold hover:from-[#219494] hover:to-[#379874] transition disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register Doctor"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterDoctorModal;