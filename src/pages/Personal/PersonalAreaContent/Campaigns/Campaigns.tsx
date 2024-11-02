import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'antd';
import { CampaignForm } from './CampaignForm';
import { ParticipantCampaignList } from './ParticipantCampaignList';
import { ModeratorCampaignList } from './ModeratorCampaignList';
import axios from 'axios';
import Cookies from 'js-cookie';

interface Campaign {
    id: number;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    approval_status: string;
    team_members: { user_id: number; name: string }[];  // Учитываем, что в команде есть члены
    image_url?: string;  // Поле может быть необязательным
}

export const Campaigns: React.FC = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [user, setUser] = useState<any | null>(null)
    const [userCampaigns, setUserCampaigns] = useState<any[]>([]); // Состояние для кампаний пользователя

    const fetchCampaigns = async () => {
        try {
            const token = Cookies.get('token');
            
            // Получаем данные пользователя
            const userResponse = await axios.get('http://127.0.0.1:5000/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setUser(userResponse.data);
        
            // Проверяем наличие userId и передаём его на сервер
        const userId = userResponse.data.email; // Предполагается, что id находится в userResponse.data
        if (userId) {
            const campaignsResponse = await axios.post('http://127.0.0.1:5000/selectedcampaigns', {
                userId: userId, // Используем userId вместо user.email
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            // Сохраняем полученные кампании пользователя
            console.log(campaignsResponse.data)
            setUserCampaigns(campaignsResponse.data);
        } else {
            console.error('User ID is not available');
        }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    useEffect(() => {
        fetchCampaigns(); // Загружаем кампании при монтировании компонента
    }, []);

    useEffect(() => {
        console.log(user)
    }, [user]);

    return (
        <div>
            {user && (user.role !== 'участник' && user.role !== 'наставник' && user.role !== '?наставник') ? (  // Отображаем раздел только если пользователь имеет нужную роль
                <div>
                    <h2>Мои акции</h2>
                    <Button type="primary" onClick={showModal} style={{ marginBottom: '1rem' }}>
                        Добавить акцию
                    </Button>
                    <Modal
                        title="Добавить новую акцию"
                        open={isModalVisible}
                        onCancel={handleCancel}
                        footer={null}
                        afterClose={fetchCampaigns}
                    >
                        <CampaignForm />
                    </Modal>
                    <ModeratorCampaignList campaigns={userCampaigns} /> {/* Отображаем только кампании пользователя */}
                </div>
            ) : (
                <div>
                    <h2>Мои проекты</h2>
                    <ParticipantCampaignList user={user} campaigns={userCampaigns} />  { /* Если роль "участник", показываем только его кампании*/ }
                </div>
                
            )}
        </div>
    );
};
