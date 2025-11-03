import axios from "axios";

// Check if the app is in production mode
const isProduction = process.env.NODE_ENV === 'production';

// Set the base URL dynamically
const baseURL = isProduction
  ? "https://proctor-x-1685.onrender.com"
  : "http://localhost:8000";

const API = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;