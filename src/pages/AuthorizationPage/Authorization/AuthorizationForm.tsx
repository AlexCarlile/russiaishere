import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../../store';
import axios from 'axios';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, message as antdMessage } from 'antd';
import Cookies from 'js-cookie';

export const AuthorizationForm: React.FC = () => {
    const [message, setMessage] = useState(Boolean);
    const { authorized, toggleAuthorized } = useAuth();
    const navigate = useNavigate();
    
    const onFinish = async (values: any) => {
        const { email, password } = values;

        try {
            const response = await axios.post('http://1180973-cr87650.tw1.ru/login', {
                email,
                password,
            });

            // Сохраняем токен в куки на 10 минут
            Cookies.set('token', response.data.access_token, { expires: 24 * 60 * 60 }); // 24 часа
            setMessage(true);
            toggleAuthorized(true);

            console.log('Вы авторизованы')
            navigate('/protected')
        } catch (error: any) {
            toggleAuthorized(false);
            if (error.response && error.response.status === 401) {
                antdMessage.error('Неверные данные для входа');
            } else {
                antdMessage.error('Произошла ошибка при авторизации');
            }
        }
    };
  
    return (
        <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
            <Form
                name="normal_login"
                // className="login-form"
                initialValues={{ remember: true }}
                onFinish={onFinish}
                layout="vertical"
                style={{ width: '100%' }}
            >
            <Form.Item
                name="email"
                rules={[{ required: true, message: 'Please input your Username!' }]}
            >
                <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="E-mail" />
            </Form.Item>
            <Form.Item
                name="password"
                rules={[{ required: true, message: 'Please input your Password!' }]}
            >
                <Input
                prefix={<LockOutlined className="site-form-item-icon" />}
                type="password"
                placeholder="Пароль"
                />
            </Form.Item>

            <Form.Item>
                <a className="login-form-forgot" href="mailto:info@russiaishere.ru">
                    Забыли пароль?
                </a>
            </Form.Item>

            <Form.Item>
                <Button type="primary" htmlType="submit" className="login-form-button" style={{width: "100%"}}>
                    Войти
                </Button>
                Или <a href="">зарегистрируйтесь сейчас!</a>
            </Form.Item>
            </Form>
        </div>
    )
}
