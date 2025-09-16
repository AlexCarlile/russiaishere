import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { headerItems }  from '../../pages/MainPage/Header';
import { Layout, Menu, theme, ConfigProvider, Drawer, Button, Dropdown, Space, Spin } from 'antd';
import { MenuOutlined, CloseOutlined } from '@ant-design/icons';
import logo from "../../media/rosatomSchoolLogo.jpg";
import { Personnel } from './Personnel';
import { useAuth } from '../../store/AuthContext';
import './model.css';


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
  const { userRole } = useAuth();

  const [drawerVisible, setDrawerVisible] = useState(false);

  const filteredItems = headerItems.filter(item => {
    if (!item.roleRequired) return true; // показывать всем
    return item.roleRequired === userRole; // показывать только если роль совпадает
  });

  const handleMenuClick = (e: { key: string }) => {
    const key = parseInt(e.key, 10)
    const item = headerItems.find(item => item.key === key);
    if (item && item.url) {
      navigate(item.url);
      setDrawerVisible(false);
    }
  };

  const handleMenuItem = (): string[] => {
    if (location.pathname === '/') return ['1'];
    if (location.pathname === '/actions') return ['2'];
    if (location.pathname === '/news') return ['3'];
    if (location.pathname === '/about') return ['4'];
    if (location.pathname === '/partners') return ['5'];
    if (location.pathname === '/admin') return ['6'];
    return [''];
  };

  const handleImgClick = () => {
    navigate('/')
    setDrawerVisible(false);
  };

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
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'white',
            height: 150,
            padding: '0 24px',
          }}
        >
          <div className="demo-logo" onClick={handleImgClick} style={{ cursor: 'pointer' }}>
            <img src={logo} alt="логотип школы росатома" style={{ maxWidth: '100%', height: 120 }} />
          </div>

          <Button
            type="text"
            className="mobile-menu-button"
            icon={<MenuOutlined style={{ fontSize: '24px' }} />}
            onClick={() => setDrawerVisible(true)}
          />

          <Menu
            theme="light"
            mode="horizontal"
            selectedKeys={handleMenuItem()}
            items={filteredItems}
            onClick={handleMenuClick}
            style={{ flex: 1, minWidth: 0 }}
            className="desktop-menu"
          />

          {/* Показываем Personnel только на десктопе */}
          <div className="desktop-personnel">
            <Personnel />
          </div>
        </Header>

        {/* Drawer для мобильного меню */}
        <Drawer
          placement="right"
          onClose={() => setDrawerVisible(false)}
          visible={drawerVisible}
          bodyStyle={{ padding: 0 }}
          headerStyle={{ borderBottom: '1px solid #f0f0f0', padding: '0 16px' }}
          closable={false}  // отключаем дефолтный крестик
          width="100vw"
          title={
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '12px 0',
              boxSizing: 'border-box',
            }}>
              {/* Левая пустая часть для выравнивания */}
              <div style={{ width: 24 }} />
              
              {/* Центр — заголовок */}
              <div style={{ fontWeight: 'bold', fontSize: 18, userSelect: 'none' }}>
                Меню
              </div>

              {/* Крестик справа */}
              <Button
                type="text"
                icon={<CloseOutlined style={{ fontSize: 24 }} />}
                onClick={() => setDrawerVisible(false)}
                style={{ width: 24, height: 24, padding: 0 }}
              />
            </div>
          }
        >
          {/* остальное содержимое Drawer без изменений */}
          <Menu
            theme="light"
            mode="vertical"
            selectedKeys={handleMenuItem()}
            items={filteredItems}
            onClick={handleMenuClick}
          />

          <div className="drawer-personnel-container">
            <Personnel isMobile />
          </div>
        </Drawer>

      <Content className='content-container'>
        {/* style={{ padding: '48px 48px' }} */}
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
