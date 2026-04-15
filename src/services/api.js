import axios from "axios";
import { mockApi, isBackendAvailable } from "./mockApi";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
const USE_MOCK = false; // Set to false when your backend is ready

class ApiService {
  constructor() {
    this.useMock = USE_MOCK;
  }

  // Utility - Auto fallback to mock if backend is unavailable
  async handleRequest(endpoint, method, body, mockFunction) {
    if (!this.useMock) {
      try {

        const response = await axios({
          method,
          url: `${API_BASE_URL}${endpoint}`,
          headers: { "Content-Type": "application/json" },
          data: body,
          validateStatus: () => true, // Accept all status codes
        });

        return {
          success: response.status >= 200 && response.status < 300,
          status: response.status,
          data: response.data,
        };
      } catch (error) {
        console.warn(`Backend unavailable. Switched to mock for ${endpoint}`);
        return await mockFunction(body);
      }
    }

    // Always use mock if USE_MOCK = true
    return await mockFunction(body);
  }

  // ----------------- Patient Registration -----------------
  async registerPatient(userData) {
    return await this.handleRequest(
      "/register-patient",
      "POST",
      userData,
      mockApi.registerPatient
    );
  }

  // ----------------- Doctor Registration -----------------
  async registerDoctor(userData) {
    return await this.handleRequest(
      "/register-doctor",
      "POST",
      userData,
      mockApi.registerDoctor
    );
  }

  async registerHospital(userData) {
    return await this.handleRequest(
      "/register-hospital",
      "POST",
      userData,
      mockApi.registerDoctor
    );
  }

  // ----------------- User Login -----------------
  async login(credentials) {
    return await this.handleRequest(
      "/login",
      "POST",
      credentials,
      mockApi.login
    );
  }
}

export const apiService = new ApiService();
