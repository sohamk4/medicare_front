import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, ArrowLeft } from "lucide-react";

const initialProfile = {
  subSpecialization: [""],
  qualifications: [
    {
      degree: "",
      institution: "",
      year: ""
    }
  ],
  totalExperience: "",
  bio: "",
  languages: [""],
  address: {
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India"
  }
};

export default function EditDoctorProfile() {
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Load existing profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        // If you have existing data, you can set it here
        // Example: setProfile(userData.profileData);
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setProfile((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
    } else if (name.includes("subSpecialization_")) {
      const idx = +name.split("_")[1];
      setProfile((prev) => {
        const arr = [...prev.subSpecialization];
        arr[idx] = value;
        return { ...prev, subSpecialization: arr };
      });
    } else if (name.includes("language_")) {
      const idx = +name.split("_")[1];
      setProfile((prev) => {
        const arr = [...prev.languages];
        arr[idx] = value;
        return { ...prev, languages: arr };
      });
    } else {
      setProfile((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle qualification changes
  const handleQualificationChange = (index, field, value) => {
    setProfile((prev) => ({
      ...prev,
      qualifications: prev.qualifications.map((qual, i) => 
        i === index ? { ...qual, [field]: value } : qual
      )
    }));
  };

  const addField = (key) => {
    if (key === "qualifications") {
      setProfile((prev) => ({
        ...prev,
        qualifications: [...prev.qualifications, { degree: "", institution: "", year: "" }]
      }));
    } else {
      setProfile((prev) => ({
        ...prev,
        [key]: [...prev[key], ""]
      }));
    }
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
      
      const response = await fetch(`${API_BASE_URL}/update-doctor-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData)
      });
      console.log(response);

      const result = await response.json();
      setLoading(false);

      if (result.success) {
        navigate('/dashboard/doctor');
        setSuccess("Profile updated successfully!");
        // Update local storage with new data if needed
      } else {
        setError(result.message || "Something went wrong");
      }
    } catch (err) {
      setLoading(false);
      setError("Network error or unexpected problem");
    }
  };

  return (
    <div className="min-h-screen bg-[#F6FAF8] py-8 px-4 sm:px-6 lg:px-8">
      <Link
        to="/dashboard/doctor"
        className="flex items-center text-[#21748C] hover:text-[#1D6278] transition-colors mb-4"
      >
        <ArrowLeft size={20} className="mr-1" />
        <span className="text-sm font-medium">Back</span>
      </Link>
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#1B6A94] mb-2">Medicare</h1>
          <p className="text-gray-400">Update your professional information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Professional Information */}
          <fieldset className="border p-6 rounded-xl bg-white shadow">
            <legend className="text-xl text-[#18788E] font-bold px-2">Professional Information</legend>
            
            <div className="grid md:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-[#21748c] font-medium mb-1">Total Experience (Years)</label>
                <input
                  className="w-full p-2 rounded border border-gray-300"
                  name="totalExperience"
                  type="number"
                  value={profile.totalExperience}
                  onChange={handleChange}
                  min="0"
                  max="60"
                  placeholder="Enter years of experience"
                />
              </div>
            </div>

            {/* Sub-Specializations */}
            <div className="space-y-2 mt-4">
              <label className="block text-[#21748c] font-medium">Sub-Specializations</label>
              {profile.subSpecialization.map((subSpec, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    className="flex-1 p-2 rounded border border-gray-300"
                    name={`subSpecialization_${i}`}
                    value={subSpec}
                    onChange={handleChange}
                    placeholder="e.g., Interventional Cardiology"
                  />
                  {profile.subSpecialization.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField("subSpecialization", i)}
                      className="bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addField("subSpecialization")} className="border px-2 py-1 rounded text-[#18788E]">
                + Add Sub-Specialization
              </button>
            </div>

            {/* Bio */}
            <div className="space-y-2 mt-4">
              <label className="block text-[#21748c] font-medium mb-1">Professional Bio</label>
              <textarea
                className="w-full p-2 rounded border border-gray-300"
                name="bio"
                rows={4}
                value={profile.bio}
                onChange={handleChange}
                placeholder="Describe your professional background, expertise, and approach to patient care"
              />
            </div>
          </fieldset>

          {/* Qualifications */}
          <fieldset className="border p-6 rounded-xl bg-white shadow">
            <legend className="text-xl text-[#18788E] font-bold px-2">Qualifications</legend>
            
            {profile.qualifications.map((qual, index) => (
              <div key={index} className="grid md:grid-cols-3 gap-4 mb-4 p-4 border rounded-lg">
                <div>
                  <label className="block text-[#21748c] font-medium mb-1">Degree</label>
                  <input
                    className="w-full p-2 rounded border border-gray-300"
                    value={qual.degree}
                    onChange={(e) => handleQualificationChange(index, 'degree', e.target.value)}
                    placeholder="e.g., MBBS, MD"
                  />
                </div>
                <div>
                  <label className="block text-[#21748c] font-medium mb-1">Institution</label>
                  <input
                    className="w-full p-2 rounded border border-gray-300"
                    value={qual.institution}
                    onChange={(e) => handleQualificationChange(index, 'institution', e.target.value)}
                    placeholder="e.g., AIIMS Delhi"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[#21748c] font-medium mb-1">Year</label>
                    <input
                      className="w-full p-2 rounded border border-gray-300"
                      type="number"
                      value={qual.year}
                      onChange={(e) => handleQualificationChange(index, 'year', e.target.value)}
                      placeholder="e.g., 2010"
                      min="1950"
                      max="2024"
                    />
                  </div>
                  {profile.qualifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField("qualifications", index)}
                      className="bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 mt-6"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            <button type="button" onClick={() => addField("qualifications")} className="border px-2 py-1 rounded text-[#18788E]">
              + Add Qualification
            </button>
          </fieldset>

          {/* Languages */}
          <fieldset className="border p-6 rounded-xl bg-white shadow">
            <legend className="text-xl text-[#18788E] font-bold px-2">Languages Spoken</legend>
            
            <div className="space-y-2 mt-2">
              {profile.languages.map((language, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    className="flex-1 p-2 rounded border border-gray-300"
                    name={`language_${i}`}
                    value={language}
                    onChange={handleChange}
                    placeholder="e.g., English, Hindi"
                  />
                  {profile.languages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField("languages", i)}
                      className="bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addField("languages")} className="border px-2 py-1 rounded text-[#18788E]">
                + Add Language
              </button>
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
                  placeholder="Enter street address"
                />
              </div>
              <div>
                <label className="block text-[#21748c] font-medium mb-1">City</label>
                <input
                  className="w-full p-2 rounded border border-gray-300"
                  name="address.city"
                  value={profile.address.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-[#21748c] font-medium mb-1">State</label>
                <input
                  className="w-full p-2 rounded border border-gray-300"
                  name="address.state"
                  value={profile.address.state}
                  onChange={handleChange}
                  placeholder="Enter state"
                />
              </div>
              <div>
                <label className="block text-[#21748c] font-medium mb-1">Pincode</label>
                <input
                  className="w-full p-2 rounded border border-gray-300"
                  name="address.pincode"
                  value={profile.address.pincode}
                  onChange={handleChange}
                  placeholder="Enter pincode"
                />
              </div>
              <div>
                <label className="block text-[#21748c] font-medium mb-1">Country</label>
                <input
                  className="w-full p-2 rounded border border-gray-300"
                  name="address.country"
                  value={profile.address.country}
                  onChange={handleChange}
                  placeholder="Enter country"
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