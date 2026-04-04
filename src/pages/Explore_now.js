import React, { useState, useEffect } from "react";
import {
  MapPin,
  Search,
  Star,
  Clock,
  Phone,
  Hospital,
  Stethoscope,
  Users,
  Award,
  Navigation,
  User as UserIcon,
  User, Lock, ArrowLeft
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const HospitalExplorer = () => {
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [visibleCount, setVisibleCount] = useState(3);
  const [user, setUser] = useState(null);
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const navigate = useNavigate();

  // Check if user is logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Fetch doctors on component mount and when filters change
  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialty, city, state, pincode, searchQuery]);

  const specialties = [
    "all",
    "Cardiology",
    "Neurology",
    "Orthopedics",
    "Pediatrics",
    "Gynecology",
    "Oncology",
    "Emergency",
    'General Physician',
    'Dermatology',
    'Psychiatry', 'Radiology', 'Urology',
    'Dentistry', 'ENT', 'Ophthalmology', 'Physiotherapy'
  ];

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const params = {
        specialization: selectedSpecialty !== "all" ? selectedSpecialty : "",
        city: city,
        state: state,
        pincode: pincode,
        search: searchQuery,
        limit: 20,
        page: 1
      };

      // Remove empty parameters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      console.log(params);
      const response = await axios.get(`${API_BASE_URL}/doctors`, { params });
      console.log(response);
      if (response.data.success) {
        setDoctors(response.data.data.doctors);
        setFilteredDoctors(response.data.data.doctors);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      // Fallback to sample data if API fails
      setDoctors([]);
      setFilteredDoctors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchDoctors();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedSpecialty("all");
    setCity("");
    setState("");
    setPincode("");
  };

  const loadMore = () => {
    setVisibleCount((prev) => prev + 3);
  };

  // Format qualifications array to string
  const formatQualifications = (qualifications) => {
    if (!qualifications || !Array.isArray(qualifications)) return "Medical Professional";
    
    // Extract just the degree names and join them
    return qualifications
      .map(q => q.degree)
      .filter(degree => degree)
      .join(", ") || "Medical Professional";
  };

  // Format doctor data for display
  const formatDoctorData = (doctor) => ({
    id: doctor.id,
    username: doctor.username,
    name: doctor.name || "Doctor",
    location: doctor.address ? `${doctor.address.city || ''}, ${doctor.address.state || ''}`.trim() : "Location not specified",
    distance: doctor.address?.pincode ? `Pincode: ${doctor.address.pincode}` : "",
    rating: doctor.ratings?.average || doctor.stats?.averageRating || 0,
    reviews: doctor.ratings?.totalReviews || doctor.stats?.reviewCount || 0,
    specialties: [doctor.specialization, ...(doctor.subSpecialization || [])].filter(Boolean),
    availability: "Check Availability",
    phone: doctor.phoneNo || "Not available",
    isPopular: (doctor.stats?.totalConsultations || 0) > 100,
    patients: doctor.stats?.totalPatients ? 
      `${doctor.stats.totalPatients >= 1000 ? Math.round(doctor.stats.totalPatients / 1000) + 'K+' : doctor.stats.totalPatients}+` 
      : "New",
    doctors: 1, // Individual doctor
    totalExperience: doctor.totalExperience || 0,
    isVerified: doctor.isVerified,
    qualifications: formatQualifications(doctor.qualifications),
    languages: doctor.languages?.slice(0, 2) || [],
    profilePhoto: doctor.profilePhoto,
    bio: doctor.bio
  });

  const displayedDoctors = filteredDoctors.slice(0, visibleCount).map(formatDoctorData);

  return (
    <div className="min-h-screen bg-white">

      {/* Navigation */}
      <nav className="bg-[#2C6975] text-white px-8 py-4 shadow-lg">
        
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Left: Logo + Title */}
          <div className="flex items-center space-x-2">
            <img src="/images/logo.png" alt="Logo" className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Medicare</h1>
          </div>

          {/* Right: Login or User Info */}
          <div className="flex items-center space-x-4">
            <Link to="/">
              <button className="border border-white px-4 py-2 rounded hover:bg-[#CDE0C9] hover:text-[#2C6975]">
                Home
              </button>
            </Link>

            {user ? (
              <div
                className="flex items-center bg-[#1f5460] rounded-full px-3 py-1 space-x-2 cursor-pointer hover:bg-[#17444f] transition"
                onClick={() =>
                  user.userType === "patient"
                    ? navigate("/dashboard/patient")
                    : navigate("/dashboard/doctor")
                }
              >
                <UserIcon className="h-5 w-5 text-yellow-300" />
                <span className="text-sm font-medium">{user.name}</span>
              </div>
            ) : (
              <Link to="/login">
                <button className="border border-white px-4 py-2 rounded hover:bg-[#CDE0C9] hover:text-[#2C6975]">
                  Login
                </button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-[#2C6975] text-white py-6 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">
            Find Doctors & Healthcare Providers
          </h1>
          <p className="text-yellow-300 text-lg">
            Discover qualified medical professionals near you
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Search & Filters Section */}
        <div className="bg-white rounded-xl p-6 shadow mb-8">
          <h2 className="text-xl font-semibold text-[#2C6975] mb-4">
            Find Healthcare Providers
          </h2>
          
          {/* Search Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Name
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doctors by name"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2C6975]"
            />
          </div>

          {/* Location Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2C6975]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Enter state"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2C6975]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode
              </label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Enter pincode"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2C6975]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex gap-4">
              <button 
                onClick={handleSearch}
                disabled={isLoading}
                className="bg-[#2C6975] text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-[#1f5460] disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                {isLoading ? "Searching..." : "Search"}
              </button>
              <button 
                onClick={handleClearFilters}
                className="border border-gray-300 px-6 py-2 rounded hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
            
            {/* Results Count */}
            <div className="text-sm text-gray-600 flex items-center">
              Found {doctors.length} doctors
            </div>
          </div>
        </div>

        {/* Specialty Filter */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[#2C6975] mb-4">
            Filter by Specialty
          </h3>
          <div className="flex flex-wrap gap-2">
            {specialties.map((specialty) => (
              <button
                key={specialty}
                onClick={() => setSelectedSpecialty(specialty)}
                className={`cursor-pointer px-4 py-2 rounded border transition-colors ${
                  selectedSpecialty === specialty
                    ? "bg-[#2C6975] text-white border-[#2C6975]"
                    : "border-gray-300 hover:bg-[#CDE0C9] hover:border-[#2C6975]"
                }`}
              >
                {specialty === "all" ? "All Specialties" : specialty}
              </button>
            ))}
          </div>
        </div>

        {/* Doctors List Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Award className="h-6 w-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-[#2C6975]">
              Available Doctors
            </h2>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C6975] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading doctors...</p>
            </div>
          ) : displayedDoctors.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No doctors found</h3>
              <p className="text-gray-500">Try adjusting your search criteria or filters</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {displayedDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
                >
                  <div className="flex gap-4">
                    {/* Doctor Profile Photo */}
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {doctor.profilePhoto ? (
                        <img 
                          src={doctor.profilePhoto} 
                          alt={doctor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Stethoscope className="w-8 h-8 text-[#2C6975]" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-[#2C6975] text-lg">
                            Dr. {doctor.name}
                          </h3>
                          <p className="text-sm text-gray-600">{doctor.qualifications}</p>
                          <div className="flex gap-2 mt-1">
                            {doctor.isVerified && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Verified
                              </span>
                            )}
                            {doctor.isPopular && (
                              <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                                Popular
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="font-semibold">{doctor.rating.toFixed(1)}</span>
                          <span className="text-sm text-gray-500">
                            ({doctor.reviews})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {doctor.location} • {doctor.distance}
                        </span>
                      </div>

                      {doctor.bio && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {doctor.bio}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1 mb-3">
                        {doctor.specialties.slice(0, 3).map((specialty, index) => (
                          <span
                            key={index}
                            className="text-xs border border-[#2C6975] text-[#2C6975] px-2 py-1 rounded"
                          >
                            {specialty}
                          </span>
                        ))}
                        {doctor.totalExperience > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {doctor.totalExperience} years exp
                          </span>
                        )}
                      </div>

                      {doctor.languages.length > 0 && (
                        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                          <span className="font-medium">Languages:</span>
                          <span>{doctor.languages.join(", ")}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-[#2C6975]" />
                            <span>{doctor.availability}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-[#2C6975]" />
                            <span>{doctor.patients} patients</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button className="border border-gray-300 px-3 py-1 rounded flex items-center text-sm hover:bg-gray-100">
                            <Phone className="w-4 h-4 mr-1" />
                            Call
                          </button>
                          <button 
                            onClick={() => navigate(`/doctor/${doctor.username}`)}
                            className="bg-[#2C6975] text-white px-3 py-1 rounded text-sm hover:bg-[#1f5460]"
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && visibleCount < filteredDoctors.length && (
            <div className="flex justify-center mt-6">
              <button
                onClick={loadMore}
                className="bg-[#2C6975] text-white px-6 py-2 rounded hover:bg-[#CDE0C9] hover:text-[#2C6975]"
              >
                View More
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-[#2C6975] text-white rounded-xl p-8">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-yellow-300 mb-1">
                {doctors.length}+
              </div>
              <div>Qualified Doctors</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-300 mb-1">
                {specialties.length - 1}+
              </div>
              <div>Medical Specialties</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-300 mb-1">
                100K+
              </div>
              <div>Patients Served</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-300 mb-1">24/7</div>
              <div>Online Booking</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalExplorer;