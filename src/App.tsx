import React, {useEffect} from "react";
import { Routes, Route, useNavigate } from 'react-router-dom';
import { 
  Login,
  MainPage,
  Protected,
  ActionPage,
  PrivateRoute,
  AboutPage,
  PersonalArea,
  PartnersPage,
  AdminPage,
} from "./pages";
import { Projects } from './pages';
import { AuthProvider, useAuth } from './store';

export const App: React.FC = () => {
  const { authorized } = useAuth();
  const navigate = useNavigate()

  useEffect(() => {
    console.log("Authorized:", authorized);
  }, [authorized]);
  
  return (
    <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/protected" element={<Protected />} />
        <Route path="/" element={<MainPage />}/>
        <Route path="/actions" element={<ActionPage />}/>
        <Route path="/about" element={<AboutPage />}/>
        <Route path="/partners" element={<PartnersPage />}/>
        <Route
          path='*'
          element={
            <PrivateRoute authorized={authorized}>
              <InternalRoutes />
            </PrivateRoute>
          }
        />
    </Routes>
  );
}

const InternalRoutes = () => {
  return(
    <Routes>
      {/* <Route path="/" element={<MainPage />}/> */}
      {/* <Route path="/actions" element={<ActionPage />}/>
      <Route path="/about" element={<AboutPage />}/> */}
      {/* <Route path="/partners" element={<PartnersPage />}/> */}
      <Route path="/personal" element={<PersonalArea />}/>
      <Route path="/projects/:teamId" element={<Projects />}/>
      <Route path="/admin" element={<AdminPage />} />
    </Routes>

  )
}
