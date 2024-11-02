import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Tabs, DatePicker } from 'antd';
import { CampaignForm } from '../../Personal';
import { CampaignList } from './CampaignList';
import axios from 'axios';
import Cookies from 'js-cookie';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

interface User {
    email: string;
    role: string;
}

export const ActionContent: React.FC = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isJoinModalVisible, setIsJoinModalVisible] = useState(false); // Добавьте состояние для модального окна
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [search, setSearch] = useState<string>('');
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
    const [activeTab, setActiveTab] = useState<string>('current');
    const [user, setUser] = useState<User | null>(null);

    // const fetchCampaigns = async () => {
    //     try {
    //         const token = Cookies.get('token');
    //         const response = await axios.get('http://127.0.0.1:5000/user', {
    //             headers: {
    //                 'Authorization': `Bearer ${token}`
    //             }
    //         });
    //         setUser(response.data);
    //     } catch (error) {
    //         console.error('Failed to fetch user:', error);
    //     }
    //     try {
    //         const token = Cookies.get('token');
    //         const response = await axios.get('http://127.0.0.1:5000/allcampaigns', {
    //             headers: {
    //                 'Authorization': `Bearer ${token}`
    //             }
    //         });
    //         setCampaigns(response.data);
    //     } catch (error) {
    //         console.error('Failed to fetch campaigns:', error);
    //     }
    // };

    // Функция для получения всех акций без авторизации
    const fetchCampaigns = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:5000/allcampaigns');
            setCampaigns(response.data);
        } catch (error) {
            console.error('Failed to fetch campaigns:', error);
        }
    };

    // Функция для получения данных пользователя с авторизацией
    const fetchUser = async () => {
        const token = Cookies.get('token');
        if (token) {
            try {
                const response = await axios.get('http://127.0.0.1:5000/user', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setUser(response.data);
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
        }
    };

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setIsJoinModalVisible(false); // Закройте модальное окно присоединения
    };

    const handleShowJoinModal = () => {
        setIsJoinModalVisible(true);
    };

    useEffect(() => {
        fetchCampaigns(); // Загружаем акции без токена
        fetchUser(); // Проверяем авторизацию для действий
    }, []);

    useEffect(() => {
        if (!isModalVisible) {
            fetchCampaigns();
        }
    }, [isModalVisible]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const handleDateChange = (dates: [Dayjs, Dayjs] | null, dateStrings: [string, string]) => {
        setDateRange(dates);
    };

    const handleTabChange = (key: string) => {
        setActiveTab(key);
    };

    const filteredCampaigns = campaigns
        .filter(campaign => campaign.approval_status === 'yes')
        .filter(campaign => {
            const matchesSearch = campaign.title.toLowerCase().includes(search.toLowerCase()) || campaign.description.toLowerCase().includes(search.toLowerCase());
            const inDateRange = !dateRange || (
                dayjs(campaign.start_date).isSameOrAfter(dateRange[0]) && 
                dayjs(campaign.end_date).isSameOrBefore(dateRange[1])
            );
            return matchesSearch && inDateRange;
        })
        .filter(campaign => {
            if (activeTab === 'current') {
                return dayjs(campaign.end_date).isSameOrAfter(dayjs());
            } else if (activeTab === 'past') {
                return dayjs(campaign.end_date).isBefore(dayjs());
            }
            return true;
        })
        .sort((a, b) => dayjs(b.start_date).diff(dayjs(a.start_date)));

    return (
        <div>
            <h2>Акции</h2>
            {user && (user.role !== 'участник' && user.role !== 'наставник' && user.role !== '?наставник') ? 
                <Button type="primary" onClick={showModal} style={{ marginBottom: '1rem' }}>
                    Добавить акцию
                </Button> :
                null
            }
            <Modal
                title="Добавить новую акцию"
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                afterClose={fetchCampaigns}
            >
                <CampaignForm />
            </Modal>
            <Input
                placeholder="Поиск по названию или описанию"
                value={search}
                onChange={handleSearchChange}
                style={{ marginBottom: '1rem' }}
            />
            <Tabs
                activeKey={activeTab}
                onChange={handleTabChange}
                items={[
                    {
                        key: 'current',
                        label: 'Текущие акции',
                        children: <CampaignList campaigns={filteredCampaigns} user={user} onJoinButtonClick={handleShowJoinModal} activeTab={activeTab}/>
                    },
                    {
                        key: 'past',
                        label: 'Прошедшие акции',
                        children: <CampaignList campaigns={filteredCampaigns} user={user} onJoinButtonClick={handleShowJoinModal} activeTab={activeTab}/>
                    }
                ]}
            />
        </div>
    );
};

