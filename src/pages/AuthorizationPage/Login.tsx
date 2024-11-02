import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs } from 'antd';
import { TabsProps } from 'antd';
import { 
    RegistrationForm,
} from './Registration';
import {
    AuthorizationForm
} from './Authorization';
import Cookies from 'js-cookie';

const onChange = (key: string) => {
    console.log(key);
};

const items: TabsProps['items'] = [
{
    key: '1',
    label: 'Авторизация',
    children: <AuthorizationForm/>,
},
{
    key: '2',
    label: 'Регистрация',
    children: <RegistrationForm/>,
},
];
  
const { TabPane } = Tabs;

export const Login: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = Cookies.get('token');
        if (token) {
            // Если токен есть, переходим на главную страницу
            navigate('/');
        }
    }, [navigate]);

    return (
        <section className='login-section'>
            <div className='login-container container'>
                <h2 className='login-title'>
                    Войдите на&nbsp;портал
                </h2>
                <div className='login-frame'>
                    <Tabs defaultActiveKey="1" items={items} onChange={onChange} style={{ display: "flex", justifyContent: "center" }}>
                    </Tabs>
                </div>
            </div>
        </section>

  )
}

