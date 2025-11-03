import axios from "axios";

const API = axios.create({
  baseURL: "https://proctor-x-1685.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;