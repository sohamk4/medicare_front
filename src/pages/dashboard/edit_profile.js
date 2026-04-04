import React, { useState } from "react";
import { apiService } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { User, Lock, ArrowLeft } from "lucide-react";

const initialProfile = {
  weight: "",
  height: "",
  address: {
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: ""
  },
  medicalHistory: "",
  allergies: [""],
  currentMedications: [""],
  chronicConditions: [""],
  familyHistory: "",
  surgicalHistory: [""],
  emergencyContact: {
    name: "",
    relationship: "",
    phoneNo: "",
    email: ""
  }
};

export default function EditProfile() {
  const API_BASE_URL=process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setProfile((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
    } else if (name.startsWith("emergencyContact.")) {
      const field = name.split(".")[1];
      setProfile((prev) => ({
        ...prev,
        emergencyContact: { ...prev.emergencyContact, [field]: value }
      }));
    } else if (name.includes("allergy_")) {
      const idx = +name.split("_")[1];
      setProfile((prev) => {
        const arr = [...prev.allergies];
        arr[idx] = value;
        return { ...prev, allergies: arr };
      });
    } else if (name.includes("medication_")) {
      const idx = +name.split("_")[1];
      setProfile((prev) => {
        const arr = [...prev.currentMedications];
        arr[idx] = value;
        return { ...prev, currentMedications: arr };
      });
    } else if (name.includes("chronicCondition_")) {
      const idx = +name.split("_")[1];
      setProfile((prev) => {
        const arr = [...prev.chronicConditions];
        arr[idx] = value;
        return { ...prev, chronicConditions: arr };
      });
    } else if (name.includes("surgery_")) {
      const idx = +name.split("_")[1];
      setProfile((prev) => {
        const arr = [...prev.surgicalHistory];
        arr[idx] = value;
        return { ...prev, surgicalHistory: arr };
      });
    } else {
      setProfile((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addField = (key) => {
    setProfile((prev) => ({
      ...prev,
      [key]: [...prev[key], ""]
    }));
  };

  const removeField = (key, idx) => {
    setProfile((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      // Get username from localStorage or context (assuming it's stored after login)
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const username = userData.username;

      if (!username) {
        setError("User not authenticated. Please login again.");
        setLoading(false);
        return;
      }

      const requestData = {
        username: username,
        ...profile
      };

      const response = await fetch(`${API_BASE_URL}/update-patient-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData)
      });
      const result = await response.json();
      setLoading(false);
      if (result.success) {
        navigate('/dashboard/patient');
        setSuccess("Profile updated successfully!");
      } else {
        setError(response.message || "Something went wrong");
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Network error or unexpected problem");
    }
  };

  return (
    <div className="min-h-screen bg-[#F6FAF8] py-8 px-4 sm:px-6 lg:px-8">
      <Link
        to="/dashboard/patient"
        className="flex items-center text-[#21748C] hover:text-[#1D6278] transition-colors mb-4"
      >
        <ArrowLeft size={20} className="mr-1" />
        <span className="text-sm font-medium">Back</span>
      </Link>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#1B6A94] mb-2">Medicare</h1>
          <p className="text-gray-400">Update your medical information</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <fieldset className="border p-6 rounded-xl bg-white shadow">
            <legend className="text-xl text-[#18788E] font-bold px-2">Personal Information</legend>
            <div className="grid md:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-[#21748c] font-medium mb-1">Weight (kg)</label>
                <input
                  className="w-full p-2 rounded border border-gray-300"
                  name="weight"
                  type="number"
                  value={profile.weight}
                  onChange={handleChange}
                  min={0}
                />
              </div>
              <div>
                <label className="block text-[#21748c] font-medium mb-1">Height (cm)</label>
                <input
                  className="w-full p-2 rounded border border-gray-300"
                  name="height"
                  type="number"
                  value={profile.height}
                  onChange={handleChange}
                  min={0}
                />
              </div>
            </div>
          </fieldset>

          {/* Address */}
          <fieldset className="border p-6 rounded-xl bg-white shadow">
            <legend className="text-xl text-[#18788E] font-bold px-2">Address</legend>
            <div className="grid md:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-[#21748c] font-medium mb-1">Street</label>
                <input
                  className="w-full p-2 rounded border border-gray-300"
                  name="address.street"
                  value={profile.address.street}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-[#21748c] font-medium mb-1">City</label>
                <input
                  className="w-full p-2 rounded border border-gray-300"
                  name="address.city"
                  value={profile.address.city}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-[#21748c] font-medium mb-1">State</label>
                <input
                  className="w-full p-2 rounded border border-gray-300"
                  name="address.state"
                  value={profile.address.state}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-[#21748c] font-medium mb-1">Pincode</label>
                <input
                  className="w-full p-2 rounded border border-gray-300"
                  name="address.pincode"
                  value={profile.address.pincode}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-[#21748c] font-medium mb-1">Country</label>
                <input
                  className="w-full p-2 rounded border border-gray-300"
                  name="address.country"
                  value={profile.address.country}
                  onChange={handleChange}
                />
              </div>
            </div>
          </fieldset>

          {/* Medical History */}
          <fieldset className="border p-6 rounded-xl bg-white shadow">
            <legend className="text-xl text-[#18788E] font-bold px-2">Medical History</legend>
            <div className="space-y-2 mt-2">
              <label className="block text-[#21748c] font-medium mb-1">Medical History</label>
              <textarea
                className="w-full p-2 rounded border border-gray-300"
                name="medicalHistory"
                rows={3}
                value={profile.medicalHistory}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2 mt-4">
              <label className="block text-[#21748c] font-medium">Allergies</label>
              {profile.allergies.map((allergy, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    className="flex-1 p-2 rounded border border-primary"
                    name={`allergy_${i}`}
                    value={allergy}
                    onChange={handleChange}
                    placeholder="Allergy"
                  />
                  <button
                    type="button"
                    onClick={() => removeField("allergies", i)}
                    className="bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addField("allergies")} className="border px-2 py-1 rounded text-[#18788E]">
                + Add Allergy
              </button>
            </div>

            <div className="space-y-2 mt-4">
              <label className="block text-[#21748c] font-medium">Current Medications</label>
              {profile.currentMedications.map((med, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    className="flex-1 p-2 rounded border border-primary"
                    name={`medication_${i}`}
                    value={med}
                    onChange={handleChange}
                    placeholder="Medication"
                  />
                  <button
                    type="button"
                    onClick={() => removeField("currentMedications", i)}
                    className="bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addField("currentMedications")} className="border px-2 py-1 rounded text-[#18788E]">
                + Add Medication
              </button>
            </div>

            <div className="space-y-2 mt-4">
              <label className="block text-[#21748c] font-medium">Chronic Conditions</label>
              {profile.chronicConditions.map((cond, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    className="flex-1 p-2 rounded border border-primary"
                    name={`chronicCondition_${i}`}
                    value={cond}
                    onChange={handleChange}
                    placeholder="Condition"
                  />
                  <button
                    type="button"
                    onClick={() => removeField("chronicConditions", i)}
                    className="bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addField("chronicConditions")} className="border px-2 py-1 rounded text-[#18788E]">
                + Add Condition
              </button>
            </div>

            <div className="space-y-2 mt-4">
              <label className="block text-[#21748c] font-medium mb-1">Family History</label>
              <textarea
                className="w-full p-2 rounded border border-gray-300"
                name="familyHistory"
                rows={3}
                value={profile.familyHistory}
                onChange={handleChange}
                placeholder="Family medical history"
              />
            </div>

            <div className="space-y-2 mt-4">
              <label className="block text-[#21748c] font-medium">Surgical History</label>
              {profile.surgicalHistory.map((surg, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    className="flex-1 p-2 rounded border border-primary"
                    name={`surgery_${i}`}
                    value={surg}
                    onChange={handleChange}
                    placeholder="Surgery"
                  />
                  <button
                    type="button"
                    onClick={() => removeField("surgicalHistory", i)}
                    className="bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addField("surgicalHistory")} className="border px-2 py-1 rounded text-[#18788E]">
                + Add Surgery
              </button>
            </div>
          </fieldset>

          {/* Emergency Contact */}
          <fieldset className="border p-6 rounded-xl bg-white shadow">
            <legend className="text-xl text-[#18788E] font-bold px-2">Emergency Contact</legend>
            <div className="grid md:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-[#21748c] font-medium mb-1">Name</label>
                <input
                  className="w-full p-2 rounded border border-gray-300"
                  name="emergencyContact.name"
                  value={profile.emergencyContact.name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-[#21748c] font-medium mb-1">Relationship</label>
                <input
                  className="w-full p-2 rounded border border-gray-300"
                  name="emergencyContact.relationship"
                  value={profile.emergencyContact.relationship}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-[#21748c] font-medium mb-1">Phone Number</label>
                <input
                  className="w-full p-2 rounded border border-gray-300"
                  name="emergencyContact.phoneNo"
                  value={profile.emergencyContact.phoneNo}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-[#21748c] font-medium mb-1">Email</label>
                <input
                  className="w-full p-2 rounded border border-gray-300"
                  name="emergencyContact.email"
                  type="email"
                  value={profile.emergencyContact.email}
                  onChange={handleChange}
                />
              </div>
            </div>
          </fieldset>

          {/* Submit Button & Alerts */}
          <div className="flex flex-col gap-4">
            <button
              type="submit"
              className="w-full h-12 rounded-lg font-semibold text-white bg-gradient-to-r from-[#21748c] to-[#169AB1] hover:opacity-90 transition"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            {success && (
              <div className="p-3 rounded bg-green-100 text-green-800 font-medium text-center">
                {success}
              </div>
            )}
            {error && (
              <div className="p-3 rounded bg-red-100 text-red-800 font-medium text-center">
                {error}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}