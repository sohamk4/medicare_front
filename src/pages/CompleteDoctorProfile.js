import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Plus, X, Calendar, MapPin, GraduationCap } from "lucide-react";

export const ArrayFieldSection = ({ title, field, placeholder, description, formData, handleArrayChange, removeArrayField, addArrayField }) => (
  <div className="space-y-3">
    <label className="block text-sm font-medium text-[#21748C]">
      {title}
    </label>
    {formData[field].map((item, index) => (
      <div key={index} className="flex gap-2">
        <input
          type="text"
          value={item}
          onChange={(e) => handleArrayChange(field, index, e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent"
        />
        {formData[field].length > 1 && (
          <button
            type="button"
            onClick={() => removeArrayField(field, index)}
            className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition"
          >
            <X size={16} />
          </button>
        )}
      </div>
    ))}
    <button
      type="button"
      onClick={() => addArrayField(field)}
      className="flex items-center gap-2 text-[#2BA2A5] hover:text-[#219494] transition"
    >
      <Plus size={16} />
      Add {title.toLowerCase()}
    </button>
    {description && (
      <p className="text-sm text-gray-500">{description}</p>
    )}
  </div>
);

export default function CompleteDoctorProfile() {
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    specialization: "",
    subSpecialization: [""],
    qualifications: [
      {
        degree: "",
        institution: "",
        year: ""
      }
    ],
    totalExperience: "",
    consultationFee: "",
    bio: "",
    languages: [""],
    dateOfBirth: "",
    gender: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: ""
    }
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validSpecializations = [
    'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology', 
    'General Physician', 'Gynecology', 'Neurology', 'Oncology', 
    'Orthopedics', 'Pediatrics', 'Psychiatry', 'Radiology', 'Urology',
    'Dentistry', 'ENT', 'Ophthalmology', 'Physiotherapy'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Handle array fields (subSpecialization, languages)
  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }));
  };

  const removeArrayField = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // Handle qualifications array
  const handleQualificationChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.map((qual, i) => 
        i === index ? { ...qual, [field]: value } : qual
      )
    }));
  };

  const addQualification = () => {
    setFormData(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, { degree: "", institution: "", year: "" }]
    }));
  };

  const removeQualification = (index) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.specialization) newErrors.specialization = "Specialization is required";
    if (!formData.totalExperience) newErrors.totalExperience = "Total experience is required";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    
    // Address required fields
    if (!formData.address.street) newErrors["address.street"] = "Street address is required";
    if (!formData.address.city) newErrors["address.city"] = "City is required";
    if (!formData.address.state) newErrors["address.state"] = "State is required";
    if (!formData.address.pincode) newErrors["address.pincode"] = "Pincode is required";
    if (!formData.address.country) newErrors["address.country"] = "Country is required";

    // Validate qualifications
    formData.qualifications.forEach((qual, index) => {
      if (!qual.degree) newErrors[`qualifications.${index}.degree`] = "Degree is required";
      if (!qual.institution) newErrors[`qualifications.${index}.institution`] = "Institution is required";
      if (!qual.year) newErrors[`qualifications.${index}.year`] = "Year is required";
    });

    // Validate date not in future
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        newErrors.dateOfBirth = "Date of birth cannot be in the future";
      }
    }

    // Validate experience
    if (formData.totalExperience && (formData.totalExperience < 0 || formData.totalExperience > 60)) {
      newErrors.totalExperience = "Experience must be between 0 and 60 years";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const authToken = localStorage.getItem("authToken");

      // Prepare data for submission - filter out empty array items
      const submissionData = {
        ...formData,
        username: user.username,
        subSpecialization: formData.subSpecialization.filter(item => item.trim() !== ""),
        languages: formData.languages.filter(item => item.trim() !== ""),
        qualifications: formData.qualifications.filter(qual => 
          qual.degree.trim() !== "" && qual.institution.trim() !== "" && qual.year !== ""
        ),
        totalExperience: parseInt(formData.totalExperience)
      };

      const response = await fetch(`${API_BASE_URL}/fill-doc-info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData)
      });

      const data = await response.json();

      if (data.success) {
        // Update local storage with new user data
        const updatedUser = {
          ...user,
          ...formData,
          profileCompleted: true
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Redirect to dashboard
        navigate("/dashboard/doctor");
      } else {
        setErrors({ submit: data.message || "Failed to update profile" });
      }
    } catch (error) {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6FAF8]">
      {/* Top navBar */}
      <nav className="w-full bg-[#0E5F73] flex items-center px-6 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-white text-sm font-medium mr-3"
        >
          <ArrowLeft size={20} className="mr-1" />
          Back
        </button>
        <span className="flex items-center text-[#FDFDFB] text-2xl font-semibold ml-2">
          <span className="inline-flex justify-center items-center rounded-full bg-[#83C6B6] w-7 h-7 mr-2">
            <svg viewBox="0 0 20 20" fill="#FCFCF9" className="w-5 h-5">
              <path d="M10 18s-7.094-5.507-8.708-8.07A5.25 5.25 0 019.98 3.49h.04a5.25 5.25 0 018.687 6.439C17.094 12.493 10 18 10 18z"></path>
            </svg>
          </span>
          Complete Your Doctor Profile
        </span>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#16697A] mb-2">
              Complete Your Doctor Profile
            </h1>
            <p className="text-[#21748C] text-lg">
              Please provide your professional and personal information to continue using the platform
            </p>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Professional Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-[#16697A] mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Professional Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">
                    Specialization *
                  </label>
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent ${
                      errors.specialization ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Specialization</option>
                    {validSpecializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                  {errors.specialization && (
                    <p className="text-red-500 text-sm mt-1">{errors.specialization}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">
                    Total Experience (Years) *
                  </label>
                  <input
                    type="number"
                    name="totalExperience"
                    value={formData.totalExperience}
                    onChange={handleChange}
                    placeholder="Enter years of experience"
                    min="0"
                    max="60"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent ${
                      errors.totalExperience ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.totalExperience && (
                    <p className="text-red-500 text-sm mt-1">{errors.totalExperience}</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <ArrayFieldSection
                  title="Sub-Specializations"
                  field="subSpecialization"
                  placeholder="e.g., Interventional Cardiology, Pediatric Cardiology"
                  description="Add your areas of sub-specialization"
                  formData={formData}
                  handleArrayChange={handleArrayChange}
                  removeArrayField={removeArrayField}
                  addArrayField={addArrayField}
                />
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-[#21748C] mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Describe your professional background, expertise, and approach to patient care"
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent"
                />
              </div>
            </div>

            {/* Qualifications */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-[#16697A] mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Qualifications
              </h2>
              
              <div className="space-y-4">
                {formData.qualifications.map((qual, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-[#21748C] mb-2">
                        Degree *
                      </label>
                      <input
                        type="text"
                        value={qual.degree}
                        onChange={(e) => handleQualificationChange(index, 'degree', e.target.value)}
                        placeholder="e.g., MBBS, MD, MS"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent ${
                          errors[`qualifications.${index}.degree`] ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#21748C] mb-2">
                        Institution *
                      </label>
                      <input
                        type="text"
                        value={qual.institution}
                        onChange={(e) => handleQualificationChange(index, 'institution', e.target.value)}
                        placeholder="e.g., AIIMS Delhi"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent ${
                          errors[`qualifications.${index}.institution`] ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-[#21748C] mb-2">
                          Year *
                        </label>
                        <input
                          type="number"
                          value={qual.year}
                          onChange={(e) => handleQualificationChange(index, 'year', e.target.value)}
                          placeholder="e.g., 2010"
                          min="1950"
                          max="2024"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent ${
                            errors[`qualifications.${index}.year`] ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                      </div>
                      {formData.qualifications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQualification(index)}
                          className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition mt-6"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addQualification}
                  className="flex items-center gap-2 text-[#2BA2A5] hover:text-[#219494] transition"
                >
                  <Plus size={16} />
                  Add Another Qualification
                </button>
              </div>
            </div>

            {/* Languages */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-[#16697A] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                Languages
              </h2>
              <ArrayFieldSection
                title="Languages Spoken"
                field="languages"
                placeholder="e.g., English, Hindi, Marathi"
                description="Add languages you can communicate with patients in"
                formData={formData}
                handleArrayChange={handleArrayChange}
                removeArrayField={removeArrayField}
                addArrayField={addArrayField}
              />
            </div>

            {/* Personal Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-[#16697A] mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Personal Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent ${
                      errors.dateOfBirth ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent ${
                      errors.gender ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  {errors.gender && (
                    <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#21748C] mb-2">
                  Consultation Fee (₹) *
                </label>
                <input
                  type="number"
                  name="consultationFee"
                  value={formData.consultationFee}
                  onChange={handleChange}
                  placeholder="e.g., 500"
                  min="100"
                  step="50"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent ${
                    errors.consultationFee ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.consultationFee && (
                  <p className="text-red-500 text-sm mt-1">{errors.consultationFee}</p>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-[#16697A] mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#21748C] mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    placeholder="Enter street address"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent ${
                      errors["address.street"] ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors["address.street"] && (
                    <p className="text-red-500 text-sm mt-1">{errors["address.street"]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent ${
                      errors["address.city"] ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors["address.city"] && (
                    <p className="text-red-500 text-sm mt-1">{errors["address.city"]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    placeholder="Enter state"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent ${
                      errors["address.state"] ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors["address.state"] && (
                    <p className="text-red-500 text-sm mt-1">{errors["address.state"]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    name="address.pincode"
                    value={formData.address.pincode}
                    onChange={handleChange}
                    placeholder="Enter pincode"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent ${
                      errors["address.pincode"] ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors["address.pincode"] && (
                    <p className="text-red-500 text-sm mt-1">{errors["address.pincode"]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                    placeholder="Enter country"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent ${
                      errors["address.country"] ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors["address.country"] && (
                    <p className="text-red-500 text-sm mt-1">{errors["address.country"]}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-gradient-to-r from-[#2BA2A5] to-[#44BAA0] shadow px-8 py-3 rounded-lg text-white font-semibold text-lg hover:from-[#219494] hover:to-[#379874] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                {loading ? "Saving..." : "Complete Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}