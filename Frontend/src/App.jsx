import './App.css'
import Login from './components/Authentication/Login.jsx'
import PatientDashboard from './components/Authentication/PatientDashboard.jsx'
import Register from './components/Authentication/Register.jsx'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ChatPage from './components/ChatPage.jsx'
function App() {

  return (
    <>
    <Router>
       <Routes> 
       <Route path="/" element={<Register/>}/>
       <Route path="/login" element={<Login/>}/>
       <Route path="/dashboard" element={<PatientDashboard/>}/>
       <Route path="/chat" element={<ChatPage/>}/>
       </Routes>
    </Router>
    </>
  )
}

export default App
