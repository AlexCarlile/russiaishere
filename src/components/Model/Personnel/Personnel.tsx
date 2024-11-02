import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Dropdown, Space, Button } from 'antd';
import type { MenuProps } from 'antd';
import { UserOutlined, DownOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';



export const Personnel= () => {
    const navigate = useNavigate();
    
    const handleSignOut = () => {
        Cookies.remove('token');
        window.location.reload();
    };

    const handlePersonnelArea = () => {
        navigate('/personal')
    };

    const handleLogin = () => {
        navigate('/login');
    };
    
    const items: MenuProps['items'] = [
        {
            key: '1',
            label: (
            <div style={{cursor: "pointer"}} onClick={handlePersonnelArea}>Личный кабинет</div>
            ),
        },
        {
            key: '2',
            danger: true,
            label: (
            <div style={{cursor: "pointer"}} onClick={handleSignOut}>Выйти</div>
            ),
        },
    ];

    // Проверка наличия токена авторизации
    const isAuthenticated = !!Cookies.get('token');

    return (
        <div>
            {isAuthenticated ? (
                <Dropdown menu={{ items }} overlayStyle={{ paddingTop: '20px' }}>
                    <a onClick={(e) => e.preventDefault()}>
                        <Space>
                            <Avatar shape="square" size="large" icon={<UserOutlined />} />
                            <DownOutlined />
                        </Space>
                    </a>
                </Dropdown>
            ) : (
                <Button type="primary" onClick={handleLogin}>
                    Войти
                </Button>
            )}
        </div>
  )
}
