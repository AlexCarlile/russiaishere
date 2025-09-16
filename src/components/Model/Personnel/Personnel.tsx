import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Dropdown, Space, Button, Spin, message } from 'antd';
import type { MenuProps } from 'antd';
import { UserOutlined, DownOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';
import { useAuth } from '../../../store/AuthContext';
import axios from 'axios';

interface PersonnelProps {
  isMobile?: boolean;
}

export const Personnel: React.FC<PersonnelProps> = ({ isMobile }) => {
    const navigate = useNavigate();
    const { authorized, checkAuthorization } = useAuth();
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

    const handleSignOut = () => {
        Cookies.remove('token');
        checkAuthorization();
        window.location.reload(); // или navigate(0), если без перезагрузки не обойтись
    };

    const handlePersonnelArea = () => {
        navigate('/personal');
    };

    const handleLogin = () => {
        navigate('/login');
    };

    useEffect(() => {
        const savedImage = localStorage.getItem('personnelImage');
        if (savedImage) {
            setPhotoUrl(savedImage);
        } else {
            axios.get('http://127.0.0.1:5000/random-icon', {
                responseType: 'blob'
            }).then(res => {
                const imageUrl = URL.createObjectURL(res.data);
                setPhotoUrl(imageUrl);

                // Преобразуем blob в base64 для хранения
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (reader.result) {
                        localStorage.setItem('personnelImage', reader.result.toString());
                    }
                };
                reader.readAsDataURL(res.data);
            }).catch(() => {
                message.error('Не удалось загрузить иконку');
            });
        }
    }, []);

    // Можно добавить лоадер, если контекст еще не готов
    if (authorized === undefined) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Spin size="large" />
            </div>
        );
    };

    if (isMobile) {
        // Мобильный вариант: отдельные кнопки и аватар снизу
        return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '200px', justifyContent: 'space-between', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Avatar
                    shape="square"
                    size={200}
                    src={photoUrl}
                    style={{ borderRadius: 48, objectFit: 'cover' }} // тут задаём скругление
                />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px',  marginTop: '25px' }}>
                <Button block onClick={handlePersonnelArea}>Личный кабинет</Button>
                <Button block danger onClick={handleSignOut}>Выйти</Button>
            </div>
        </div>
        );
    }

    // Десктопный вариант: выпадающее меню с аватаром
    const items: MenuProps['items'] = [
        {
        key: '1',
        label: (
            <div style={{ cursor: 'pointer' }} onClick={handlePersonnelArea}>
            Личный кабинет
            </div>
        ),
        },
        {
        key: '2',
        danger: true,
        label: (
            <div style={{ cursor: 'pointer' }} onClick={handleSignOut}>
            Выйти
            </div>
        ),
        },
    ];

    return (
        <div>
            {authorized ? (
                <Dropdown menu={{ items }} overlayStyle={{ paddingTop: '20px' }}>
                    <a onClick={(e) => e.preventDefault()}>
                        <Space>
                            <Avatar shape="square" size="large" src={photoUrl} icon={!photoUrl && <UserOutlined />} />
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
    );
};
