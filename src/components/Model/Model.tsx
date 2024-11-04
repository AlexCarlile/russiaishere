import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { headerItems } from '../../pages/MainPage/Header';
import { Layout, Menu, theme, ConfigProvider } from 'antd';
import logo from "../../media/rosatomSchoolLogo.jpg";
import { Personnel } from './Personnel';
import './model.css';
import Cookies from 'js-cookie';
import axios from 'axios';

const { Header, Content, Footer } = Layout;

interface ModelProps {
  children?: React.ReactNode; // Указываем, что children могут быть любыми элементами React
}

export const Model: React.FC<ModelProps> = (props) => {
  const {
    token: { 
      colorBgContainer, 
      borderRadiusLG,
    },
  } = theme.useToken();

  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    
    if (storedRole) {
      setUserRole(storedRole);
      setLoading(false);
    } else {
      const fetchUserRole = async () => {
        const token = Cookies.get('token');
        if (token) {
          try {
            const response = await axios.get('http://127.0.0.1:5000/user', {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            const role = response.data.role;
            setUserRole(role);
            localStorage.setItem('userRole', role); // Сохраняем роль в localStorage
          } catch (error) {
            console.error('Error fetching user role:', error);
          } finally {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      };
  
      fetchUserRole();
    }
  }, []);

  const handleMenuClick = (e: { key: string }) => {
    const key = parseInt(e.key, 10);
    const item = headerItems.find(item => item.key === key);
    if (item && item.url) {
      navigate(item.url);
    }
  };

  const handleMenuItem = (): string[] => {
    switch (location.pathname) {
      case '/':
        return ['1'];
      case '/actions':
        return ['2'];
      case '/about':
        return ['3'];
      case '/partners':
        return ['4'];
      case '/admin':
        return ['5'];
      default:
        return [''];
    }
  };

  const handleImgClick = () => {
    navigate('/');
  };

  const filteredItems = useMemo(() => {
    return headerItems.filter(item => userRole === 'админ' || item.key !== 5);
  }, [userRole]);

  // if (loading) {
  //   return <div>Загрузка...</div>; // Индикатор загрузки
  // }

  return (
    <ConfigProvider
      theme={{
        components: {
          Layout: {
            headerBg: "#f5f5f5",
            bodyBg: "#f5f5f5",
          },
        },
      }}
    >
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: "space-between", backgroundColor: "white", height: "150px" }}>
          <div className="demo-logo">
            <img onClick={handleImgClick} src={logo} alt="логотип школы росатома" style={{ maxWidth: "100%", height: "120px" }} />
          </div>
          <Menu
            theme="light"
            mode="horizontal"
            selectedKeys={handleMenuItem()}
            items={filteredItems} // Используем отфильтрованные элементы
            style={{ flex: 1, minWidth: 0 }}
            onClick={handleMenuClick}
          />
          <Personnel />
        </Header>

        <Content style={{ padding: '48px 48px' }}>
          <div
            style={{
              background: colorBgContainer,
              minHeight: 280,
              padding: 24,
              borderRadius: borderRadiusLG,
            }}
          >
            {props.children}
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Здесь начинается Россия {new Date().getFullYear()} by Школа Росатома
        </Footer>
      </Layout>       
    </ConfigProvider>
  );
};
