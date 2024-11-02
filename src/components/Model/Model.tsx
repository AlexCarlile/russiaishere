import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { headerItems }  from '../../pages/MainPage/Header';
import { Layout, Menu, theme, ConfigProvider, Dropdown, Space } from 'antd';
import logo from "../../media/rosatomSchoolLogo.jpg";
import { Personnel } from './Personnel';
import './model.css';


const { Header, Content, Footer } = Layout;

const items = headerItems;

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

  const handleMenuClick = (e: { key: string }) => {
    const key = parseInt(e.key, 10)
    const item = headerItems.find(item => item.key === key);
    if (item && item.url) {
      navigate(item.url);
    }
  };

  const handleMenuItem = (): string[] => {
    if (location.pathname === '/') {
      return ['1']
    }
    if (location.pathname === '/actions') {
      return ['2']
    }
    if (location.pathname === '/about') {
      return ['3']
    }
    if (location.pathname === '/partners') {
      return ['4']
    }
    return [''];
  }

  const handleImgClick = () => {
    navigate('/')
  }

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
        <div className="demo-logo" >
          <img onClick={handleImgClick} src={logo} alt="логотип школы росатома" style={{maxWidth: "100%", height: "120px"}} />
        </div>
        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={handleMenuItem()}
          items={items}
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
    
  )
}
