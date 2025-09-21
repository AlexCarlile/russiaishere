import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../store';
import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';


export const Protected: React.FC = () => {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const { authorized, toggleAuthorized } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProtected = async () => {
            const token = Cookies.get('token');
            if (!token) {
                setMessage('You are not logged in');
                console.log('You are not logged in');
                toggleAuthorized(false)
                navigate('/login');
                return;
            }
            try {
                const response = await axios.get('http://1180973-cr87650.tw1.ru/protected', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessage(`Welcome ${response.data.logged_in_as}`);
                toggleAuthorized(true)
                navigate('/')
            } catch (error: any) {
                if (error.response && error.response.status === 401) {
                    setMessage('Invalid token. Please log in again.');
                    console.log('Invalid token. Please log in again.');
                } else {
                    setMessage('An error occurred. Please try again later.');
                    console.log('An error occurred. Please try again later.')
                }
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchProtected();
    }, [navigate, toggleAuthorized])

    if (loading) {
        return <div>Loading...</div>
    }
  
    return (
        <div>
            <p>{message}</p>
        </div>
  )
}
