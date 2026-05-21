import React, { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router'
import Navbar from './Navbar'
import axios from 'axios'
const PrivateLayout = () => {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const token = localStorage.getItem('token');
  const verifyUser = async () => {
    if (!token || token === "null") {
      navigate('/login', { state: { message: 'Please login to continue' } });
      return;
    }
    try {
      const response = await axios.get('https://student-admission-management-system.vercel.app/auth', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (response.data.user) {
        setIsVerified(true);
      }
    } catch (error) {
      console.error("Auth failed:", error);
      localStorage.removeItem('authorization');
      navigate('/login', { state: { message: 'Please login to continue' } });
    }
  }
  useEffect(() => {
    verifyUser();
  }, [navigate, token])
  if (!isVerified) {
    return (
      <div>Loading...</div>
    )
  }
  return (<>
    <Navbar/>
    <Outlet />
  </>)
}

export default PrivateLayout