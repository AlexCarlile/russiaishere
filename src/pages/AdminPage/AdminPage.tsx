import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Model } from '../../components';
import { AdminContent } from './AdminContent';
import Cookies from 'js-cookie';
import axios from 'axios';

export const AdminPage = () => {
    const children = <AdminContent />
    const [user, setUser] = useState()
    const navigate = useNavigate()

    const checkUser = async () => {
        try {
            const token = Cookies.get('token');

            if (token) {
                // Получаем данные пользователя
                const userResponse = await axios.get('http://127.0.0.1:5000/user', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setUser(userResponse.data);
            
                const userRole = userResponse.data.role;
                if (userRole !== 'админ') {
                    navigate('/')
                }
            } else {
                navigate('/')
            }
        } catch (error) {
            console.error('Failed to get access:', error);
        }
    };

    useEffect(() => {
        checkUser(); // Вызов функции проверки при монтировании
    }, []);

    return (
        <Model children={children}/>
    )
}
