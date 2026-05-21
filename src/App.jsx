import { useState } from 'react'
import './App.css'
import Login from './Login'
import Register from './Register';
import { BrowserRouter, Routes, Route } from 'react-router';
import PrivateLayout from './PrivateLayout';
import Home from './Home';
import StudentDashboard from './StudentDashboard';
import ApplyForAdmission from './ApplyForAdmission';
import ViewApplication from './ViewApplication';
import ViewAllApplications from './ViewAllApplications';
import ViewCourses from './ViewCourses';
import AddInstitute from './AddInstitute';
import ViewInstitutes from './ViewInstitutes';
import AddCourse from './AddCourse';

function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login />}></Route>
        <Route path='/login' element={<Login />}></Route>
        <Route path='/register' element={<Register />}></Route>
        <Route element={<PrivateLayout />}>
          <Route path='/student/dashboard' element={<StudentDashboard />} />
          <Route path='/student/apply' element={<ApplyForAdmission />} />
          <Route path='/home' element={<Home />} />
          <Route path='/student/view-application' element={<ViewApplication />} />
          <Route path='/admin/applications' element={<ViewAllApplications />} />
          <Route path='/admin/institutes' element={<ViewInstitutes/>} />
          <Route path='/admin/courses' element={<ViewCourses />} />
          <Route path='/admin/addinstitute' element={<AddInstitute/>}/>
          <Route path='/admin/addcourse' element={<AddCourse/>}/>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
