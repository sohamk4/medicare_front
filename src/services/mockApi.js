// Mock API service for development
const MOCK_DELAY = 1000; // 1 second delay to simulate network latency
const isWorking = true; // explicitly control mock behavior

const mockDelay = () => new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

// In-memory mock database
let mockUsers = [];

export const mockApi = {
  // Patient Registration
  registerPatient: async (userData) => {
    await mockDelay();

    if (!isWorking) {
      return {
        success: false,
        status: 503,
        data: { message: "Mock API currently disabled." },
      };
    }

    const existingUser = mockUsers.find(
      (u) => u.email === userData.email || u.username === userData.username
    );

    if (existingUser) {
      return {
        success: false,
        status: 400,
        data: {
          message: "User with this email or username already exists",
        },
      };
    }

    const newUser = {
      userId: `patient_${Date.now()}`,
      username: userData.username,
      name: userData.name,
      email: userData.email,
      phoneNo: userData.phoneNo,
      aadharCardNo: userData.aadharCardNo,
      password: userData.password,
      userType: "patient",
      createdAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);

    return {
      success: true,
      status: 201,
      data: {
        message: "Patient registered successfully",
        user: {
          userId: newUser.userId,
          username: newUser.username,
          name: newUser.name,
          email: newUser.email,
          phoneNo: newUser.phoneNo,
          userType: newUser.userType,
        },
        token: `mock_token_${newUser.userId}`,
      },
    };
  },

  // Doctor Registration
  registerDoctor: async (userData) => {
    await mockDelay();

    if (!isWorking) {
      return {
        success: false,
        status: 503,
        data: { message: "Mock API currently disabled." },
      };
    }

    const existingDoctor = mockUsers.find(
      (u) => u.email === userData.email || u.username === userData.username
    );

    if (existingDoctor) {
      return {
        success: false,
        status: 400,
        data: {
          message: "Doctor with this email or username already exists",
        },
      };
    }

    const newDoctor = {
      userId: `doctor_${Date.now()}`,
      username: userData.username,
      name: userData.name,
      email: userData.email,
      phoneNo: userData.phoneNo,
      registrationNumber: userData.registrationNumber,
      specialization: userData.specialization || "General Medicine",
      experience: userData.experience || "0",
      password: userData.password,
      userType: "doctor",
      createdAt: new Date().toISOString(),
      hospitalemail:userData.hospitalEmail
    };

    mockUsers.push(newDoctor);

    return {
      success: true,
      status: 201,
      data: {
        message: "Doctor registered successfully",
      },
    };
  },
  
  // User Login
  login: async (credentials) => {
    await mockDelay();

    if (!isWorking) {
      return {
        success: false,
        status: 503,
        data: { message: "Mock API disabled. Cannot log in." },
      };
    }

    const user = mockUsers.find(
      (u) =>
        (u.email === credentials.email || u.username === credentials.username) &&
        u.password === credentials.password
    );
    

    if (!user) {
      return {
        success: false,
        status: 401,
        data: { message: "Invalid email or password" },
      };
    }

    return {
      success: true,
      status: 200,
      data: {
        message: "Login successful",
        user: {
          userId: user.userId,
          username: user.username,
          name: user.name,
          email: user.email,
          userType: user.userType,
        },
        token: `mock_token_${user.userId}`,
      },
    };
  },
};

// Backend availability check
export const isBackendAvailable = async () => {
  try {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/health`, {
      method: "GET",
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};
