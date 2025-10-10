import { createContext, useState, useEffect, useContext } from "react";
import * as jwtModule from "jwt-decode"; // import everything

// Use either default or named export
const jwt_decode = jwtModule.default || jwtModule.jwtDecode;

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const loadUserFromToken = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwt_decode(token);
        setUser({
          id: decodedToken.id,
          name: decodedToken.name,
          email: decodedToken.email,
          role: decodedToken.role,
        });
      } catch (err) {
        console.error("Invalid token:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    loadUserFromToken();
    const handleStorageChange = () => loadUserFromToken();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = (token) => {
  try {
    localStorage.setItem("token", token);
    const decodedToken = jwt_decode(token);

    const userData = {
      id: decodedToken.id,
      name: decodedToken.name || "",
      email: decodedToken.email || "",
      role: decodedToken.role || "teacher",
    };

    localStorage.setItem("userRole", userData.role);
    setUser(userData);
  } catch (err) {
    console.error("Invalid token during login:", err);
    logout();
  }
};


  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
