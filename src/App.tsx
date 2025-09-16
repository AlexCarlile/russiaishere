import React, {useEffect} from "react";
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
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
  CampaignDetails,
  NewsPage,
  CreateNews,
  NewsDetails,
  ProjectContentPublic
} from "./pages";
import { Projects } from './pages';
import { Spin } from 'antd';
import { AuthProvider, useAuth } from './store';

export const App: React.FC = () => {
  const { authorized, isLoading, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Authorized:", authorized);
  }, [authorized]);

    if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="Загрузка..." />
      </div>
    );
  }
  
  return (
    <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/protected" element={<Protected />} />
        <Route path="/" element={<MainPage />}/>
        <Route path="/actions" element={<ActionPage />}/>
        <Route path="/actions/:id" element={<CampaignDetails />} />
        <Route path="/about" element={<AboutPage />}/>
        <Route path="/partners" element={<PartnersPage />}/>
        <Route path="/news" element={<NewsPage />}/>
        <Route path="/news/:id" element={<NewsDetails />} />
        <Route path="/projects/winners/:teamId" element={<ProjectContentPublic />} />

        
        {/* Приватные маршруты */}
        <Route
          element={<PrivateRoute authorized={authorized} />}
        >
          <Route path="/personal" element={<PersonalArea />} />
          <Route path="/projects/:teamId" element={<Projects />} />
          <Route path="/admin" 
            element={userRole === 'админ' ? (
              <AdminPage />
            ) : (
            ""
            )} 
          />
          <Route path="/admin/news/create" element={<CreateNews />} />
        </Route>
        {/* <Route
          path='*'
          element={
            <PrivateRoute authorized={authorized}>
              <InternalRoutes />
            </PrivateRoute>
          }
        /> */}
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
