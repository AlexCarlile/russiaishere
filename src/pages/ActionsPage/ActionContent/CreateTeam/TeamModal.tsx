import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Input } from 'antd';
import axios from 'axios';
import Cookies from 'js-cookie';
import { User } from '../CampaignList';

interface TeamModalProps {
    campaignId: number;
    user: any;
    onClose: () => void;
    isCreateTeam: boolean;
}

export const TeamModal: React.FC<TeamModalProps> = ({ campaignId, user, onClose, isCreateTeam }) => {
    // const [isCreateTeam, setIsCreateTeam] = useState(true);
    const [teamName, setTeamName] = useState('');
    const [teamCode, setTeamCode] = useState('');

    const navigate = useNavigate();

    const handleCreateTeam = async () => {
        if (!user) return;

        try {
            const token = Cookies.get('token');
            const response = await axios.post('http://127.0.0.1:5000/createTeam', {
                name: teamName,
                campaignId,
                userId: user.email
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.status === 201) {
                alert('Команда создана успешно');
                navigate(`/projects/${response.data.teamId}`); // Переход к проекту с teamId
            } else {
                alert('Ошибка создания команды');
            }
            onClose();
        } catch (error) {
            console.error('Ошибка создания команды:', error);
            alert('Ошибка создания команды');
        }
    };

    const handleJoinTeam = async () => {
        if (!user || !teamCode) return;

        try {
            const token = Cookies.get('token');
            const response = await axios.post('http://127.0.0.1:5000/joinTeam', {
                userId: user.email,
                campaignId,
                teamCode // Передаем код команды
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.status === 200) {
                alert('Вы присоединились к команде успешно');
                navigate(`/projects/${response.data.teamId}`); // Переход к проекту с teamId
            } else {
                alert('Ошибка присоединения к команде');
            }
            onClose();
        } catch (error) {
            console.error('Ошибка присоединения к команде:', error);
            alert('Ошибка присоединения к команде');
        }
    };

    useEffect(() => {
        console.log('Устанавливаем name:', campaignId);
        console.log('Устанавливаем name:', teamName);
        console.log('Устанавливаем name:', user?.email);

    }, [teamName]);

    return (
        <Modal
            title={isCreateTeam ? "Создать команду" : "Присоединиться к команде"}
            open
            onCancel={onClose}
            footer={null}
        >
            {isCreateTeam ? (
                <div>
                    <Input
                        placeholder="Название команды"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                    />
                    <Button type="primary" onClick={handleCreateTeam} style={{ marginTop: '1rem' }}>
                        Создать команду
                    </Button>

                    <div>
                        <Input
                            placeholder="Введите код команды"
                            value={teamCode}
                            onChange={(e) => setTeamCode(e.target.value)}
                        />
                        <Button type="primary" onClick={handleJoinTeam} style={{ marginTop: '1rem' }}>
                            Присоединиться к команде
                        </Button>
                    </div>
                </div>
            ) : null}
        </Modal>
    );
};
