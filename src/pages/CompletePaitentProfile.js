import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Plus, X } from "lucide-react";

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

export default function CompleteProfile() {
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
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
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
    } else if (name.startsWith("emergencyContact.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
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

  // Handle array fields (allergies, medications, conditions, surgical history)
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

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.bloodGroup) newErrors.bloodGroup = "Blood group is required";
    if (!formData.weight) newErrors.weight = "Weight is required";
    if (!formData.height) newErrors.height = "Height is required";
    
    // Address required fields
    if (!formData.address.street) newErrors["address.street"] = "Street address is required";
    if (!formData.address.city) newErrors["address.city"] = "City is required";
    if (!formData.address.state) newErrors["address.state"] = "State is required";
    if (!formData.address.pincode) newErrors["address.pincode"] = "Pincode is required";
    if (!formData.address.country) newErrors["address.country"] = "Country is required";
    
    // Emergency contact required fields
    if (!formData.emergencyContact.name) newErrors["emergencyContact.name"] = "Emergency contact name is required";
    if (!formData.emergencyContact.relationship) newErrors["emergencyContact.relationship"] = "Relationship is required";
    if (!formData.emergencyContact.phoneNo) newErrors["emergencyContact.phoneNo"] = "Emergency contact phone is required";

    // Validate numeric values
    if (formData.weight && (formData.weight < 20 || formData.weight > 300)) {
      newErrors.weight = "Weight must be between 20kg and 300kg";
    }
    if (formData.height && (formData.height < 100 || formData.height > 250)) {
      newErrors.height = "Height must be between 100cm and 250cm";
    }

    // Validate date not in future
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        newErrors.dateOfBirth = "Date of birth cannot be in the future";
      }
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

      // Prepare data for submission - filter out empty array items
      const submissionData = {
        ...formData,
        username: user.username,
        allergies: formData.allergies.filter(item => item.trim() !== ""),
        currentMedications: formData.currentMedications.filter(item => item.trim() !== ""),
        chronicConditions: formData.chronicConditions.filter(item => item.trim() !== ""),
        surgicalHistory: formData.surgicalHistory.filter(item => item.trim() !== "")
      };

      const response = await fetch(`${API_BASE_URL}/fill-patient-info`, {
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
        navigate("/dashboard/patient");
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
          Complete Your Profile
        </span>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#16697A] mb-2">
              Complete Your Profile
            </h1>
            <p className="text-[#21748C] text-lg">
              Please provide your personal and health information to continue using the platform
            </p>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-[#16697A] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
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

                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">
                    Blood Group *
                  </label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent ${
                      errors.bloodGroup ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                  {errors.bloodGroup && (
                    <p className="text-red-500 text-sm mt-1">{errors.bloodGroup}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="Enter weight in kg"
                    min="20"
                    max="300"
                    step="0.1"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent ${
                      errors.weight ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.weight && (
                    <p className="text-red-500 text-sm mt-1">{errors.weight}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">
                    Height (cm) *
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="Enter height in cm"
                    min="100"
                    max="250"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent ${
                      errors.height ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.height && (
                    <p className="text-red-500 text-sm mt-1">{errors.height}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-[#16697A] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
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

            {/* Medical Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-[#16697A] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Medical Information
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">
                    Medical History
                  </label>
                  <textarea
                    name="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={handleChange}
                    placeholder="Describe your general medical history"
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent"
                  />
                </div>

                <ArrayFieldSection
                  title="Allergies"
                  field="allergies"
                  placeholder="e.g., Penicillin, Peanuts, Dust"
                  description="List any allergies you have"
                  formData={formData}
                  handleArrayChange={handleArrayChange}
                  removeArrayField={removeArrayField}
                  addArrayField={addArrayField}
                />

                <ArrayFieldSection
                  title="Current Medications"
                  field="currentMedications"
                  placeholder="e.g., Metformin 500mg, Lisinopril 10mg"
                  description="List medications you're currently taking"
                  formData={formData}
                  handleArrayChange={handleArrayChange}
                  removeArrayField={removeArrayField}
                  addArrayField={addArrayField}
                />

                <ArrayFieldSection
                  title="Chronic Conditions"
                  field="chronicConditions"
                  placeholder="e.g., Diabetes, Hypertension, Asthma"
                  description="List any chronic health conditions"
                  formData={formData}
                  handleArrayChange={handleArrayChange}
                  removeArrayField={removeArrayField}
                  addArrayField={addArrayField}
                
                />

                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">
                    Family History
                  </label>
                  <textarea
                    name="familyHistory"
                    value={formData.familyHistory}
                    onChange={handleChange}
                    placeholder="Enter family medical history (e.g., Father: Asthma, Mother: Diabetes)"
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent"
                  />
                </div>

                <ArrayFieldSection
                  title="Surgical History"
                  field="surgicalHistory"
                  placeholder="e.g., Appendectomy in 2015, Knee replacement in 2020"
                  description="List any surgical procedures you've had"
                  formData={formData}
                  handleArrayChange={handleArrayChange}
                  removeArrayField={removeArrayField}
                  addArrayField={addArrayField}

                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-[#16697A] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Emergency Contact
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="emergencyContact.name"
                    value={formData.emergencyContact.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent ${
                      errors["emergencyContact.name"] ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors["emergencyContact.name"] && (
                    <p className="text-red-500 text-sm mt-1">{errors["emergencyContact.name"]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">
                    Relationship *
                  </label>
                  <input
                    type="text"
                    name="emergencyContact.relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={handleChange}
                    placeholder="e.g., Spouse, Parent, Sibling"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent ${
                      errors["emergencyContact.relationship"] ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors["emergencyContact.relationship"] && (
                    <p className="text-red-500 text-sm mt-1">{errors["emergencyContact.relationship"]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="emergencyContact.phoneNo"
                    value={formData.emergencyContact.phoneNo}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent ${
                      errors["emergencyContact.phoneNo"] ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors["emergencyContact.phoneNo"] && (
                    <p className="text-red-500 text-sm mt-1">{errors["emergencyContact.phoneNo"]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#21748C] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="emergencyContact.email"
                    value={formData.emergencyContact.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2BA2A5] focus:border-transparent"
                  />
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