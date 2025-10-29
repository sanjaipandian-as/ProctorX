import axios from "axios";

const API = axios.create({
  baseURL: "https://proctorx-03u1.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;