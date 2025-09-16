import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs } from 'antd';
import { TabsProps } from 'antd';
import { RegistrationForm } from './Registration';
import { AuthorizationForm } from './Authorization';
import Cookies from 'js-cookie';
import './Login.css';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('1');

    useEffect(() => {
        const token = Cookies.get('token');
        if (token) {
            navigate('/');
        }
    }, [navigate]);

    const onChange = (key: string) => {
        setActiveTab(key);
    };

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Авторизация',
            children: <AuthorizationForm />,
        },
        {
            key: '2',
            label: 'Регистрация',
            children: <RegistrationForm />,
        },
    ];

    const title =
        activeTab === '1'
            ? 'Авторизация на портале «Здесь начинается Россия»'
            : 'Регистрация на портале «Здесь начинается Россия»';

    return (
        <section className='login-section'>
            <div className='login-container'>
                <div className='login-left' />
                <div className='login-right'>
                    <h2 className='login-title'>{title}</h2>

                    <Tabs
                        defaultActiveKey="1"
                        activeKey={activeTab}
                        onChange={onChange}
                        items={items}
                        className="login-tabs"
                    />
                </div>
            </div>
        </section>
    );
};
