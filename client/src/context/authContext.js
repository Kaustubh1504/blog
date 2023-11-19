import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();
const baseurl = "https://blog-backend-2-q24f.onrender.com"
export const AuthContexProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  const login = async (inputs) => {
    
    console.log(inputs)
    try{
      const res = await axios.post(`${baseurl}/login`,
      {headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Credentials": true,
      }},
      inputs);
      setCurrentUser(res.data);
    }catch(err){
      console.error('Login error:', err);
    }
    
  };

  const logout = async (inputs) => {
    await axios.post(`${baseurl}/logout`);
    setCurrentUser(null);
  };

  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(currentUser));
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
