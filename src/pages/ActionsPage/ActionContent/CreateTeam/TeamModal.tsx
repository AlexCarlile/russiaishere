import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Input } from 'antd';
import axios from 'axios';
import Cookies from 'js-cookie';

interface TeamModalProps {
  campaignId: number;
  user: any;
  onClose: () => void;
  isCreateTeam: boolean;
}

export const TeamModal: React.FC<TeamModalProps> = ({
  campaignId,
  user,
  onClose,
  isCreateTeam,
}) => {
  const [step, setStep] = useState<'select' | 'create' | 'join'>('select');
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [successData, setSuccessData] = useState<null | { teamId: number }> (null);
  const navigate = useNavigate();
  const [actionType, setActionType] = useState<'create' | 'join' | null>(null);

  // const handleCreateTeam = async () => {
  //   if (!user || !teamName) return;
  //   try {
  //     const token = Cookies.get('token');
  //     const response = await axios.post(
  //       'http://1180973-cr87650.tw1.ru/createTeam',
  //       {
  //         name: teamName,
  //         campaignId,
  //         userId: user.email,
  //       },
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       }
  //     );
  //     if (response.status === 201) {
  //       // alert('Команда создана успешно');
  //       // navigate(`/projects/${response.data.teamId}`);
  //       if (response.status === 201) {
  //         setSuccessData({ teamId: response.data.teamId });
  //       }
  //       // onClose();
  //     } else {
  //       alert('Ошибка создания команды');
  //     }
  //   } catch (error) {
  //     console.error('Ошибка создания команды:', error);
  //     alert('Ошибка создания команды');
  //   }
  // };

  // const handleJoinTeam = async () => {
  //   if (!user || !teamCode) return;
  //   try {
  //     const token = Cookies.get('token');
  //     const response = await axios.post(
  //       'http://1180973-cr87650.tw1.ru/joinTeam',
  //       {
  //         userId: user.email,
  //         campaignId,
  //         teamCode,
  //       },
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       }
  //     );
  //     if (response.status === 200) {
  //       // alert('Вы присоединились к команде успешно');
  //       // navigate(`/projects/${response.data.teamId}`);
  //       if (response.status === 200) {
  //         setSuccessData({ teamId: response.data.teamId });
  //       }
  //     } else {
  //       alert('Ошибка присоединения к команде');
  //     }
  //   } catch (error) {
  //     console.error('Ошибка присоединения к команде:', error);
  //     alert('Ошибка присоединения к команде');
  //   }
  // };

  const handleCreateTeam = async () => {
    if (!user || !teamName) return;
    try {
      const token = Cookies.get('token');
      const response = await axios.post(
        'http://1180973-cr87650.tw1.ru/createTeam',
        {
          name: teamName,
          campaignId,
          userId: user.email,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('JOIN RESPONSE:', response.data);
      if (response.status === 201) {
        setSuccessData({ teamId: response.data.teamId });
        setActionType('create');
      } else {
        alert('Ошибка создания команды');
      }
    } catch (error) {
      console.error('Ошибка создания команды:', error);
      alert('Ошибка создания команды');
    }
  };

  const handleJoinTeam = async () => {
    if (!user || !teamCode) return;
    try {
      const token = Cookies.get('token');
      const response = await axios.post(
        'http://1180973-cr87650.tw1.ru/joinTeam',
        {
          userId: user.email,
          campaignId,
          teamCode,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.status === 200) {
        setSuccessData({ teamId: response.data.teamId });
        setActionType('join');
      } else {
        alert('Ошибка присоединения к команде');
      }
    } catch (error) {
      console.error('Ошибка присоединения к команде:', error);
      alert('Ошибка присоединения к команде');
    }
  };


  return (
    <Modal
      title={<div style={{ textAlign: 'center', width: '100%', fontSize: '32px' }}>Принять участие в акции</div>}
      open
      onCancel={onClose}
      footer={null}
      modalRender={(modal) => (
        <div style={{ borderRadius: 48, overflow: 'hidden' }}>{modal}</div>
      )}
    >
      {!successData && step === 'select' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: 16,
            minHeight: 200,
          }}
        >
          <Button
            style={{
              backgroundColor: '#EF2C2C',
              color: 'white',
              borderRadius: 30,
              height: 48,
              fontSize: 16,
              width: '100%',
            }}
            onClick={() => setStep('create')}
          >
            Создать команду
          </Button>
          <Button
            style={{
              backgroundColor: '#EF2C2C',
              color: 'white',
              borderRadius: 30,
              height: 48,
              fontSize: 16,
              width: '100%',
            }}
            onClick={() => setStep('join')}
          >
            Присоединиться к команде
          </Button>
        </div>
      )}

      {!successData && step === 'create' && (
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            minHeight: 200,
            textAlign: 'center',
          }}
        >
          <div style={{ width: '100%', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Придумайте название команды</label>
            <Input
              placeholder="Название команды"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              style={{ width: '100%', borderRadius: '24px' }}
            />
          </div>
          <Button
            type="primary"
            onClick={handleCreateTeam}
            style={{
              backgroundColor: '#EF2C2C',
              borderRadius: 30,
              height: 48,
              fontSize: 16,
              width: 220,
            }}
          >
            Подтвердить создание
          </Button>
        </div>
      )}

      {!successData && step === 'join' && (
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            minHeight: 200,
            textAlign: 'center',
          }}
        >
          <div style={{ width: '100%', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Код участия в команде</label>
            <Input
              placeholder="Введите код команды для присоединения"
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value)}
              style={{ width: '100%', borderRadius: '24px' }}
            />
          </div>
          <Button
            type="primary"
            onClick={handleJoinTeam}
            style={{
              backgroundColor: '#EF2C2C',
              borderRadius: 30,
              height: 48,
              fontSize: 16,
              width: 220,
            }}
          >
            Присоединиться
          </Button>
        </div>
      )}
      {successData && (
        <div
          style={{
            marginTop: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 24,
          }}
        >
          <div
            style={{
              backgroundColor: '#F0F7FF',
              borderRadius: '50%',
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
            }}
          >
            👍
          </div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>
            {actionType === 'create'
              ? 'Команда успешно создана!'
              : 'Вы успешно присоединились к команде'}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Button
              style={{
                borderColor: '#EF2C2C',
                color: '#EF2C2C',
                borderRadius: 30,
                height: 40,
                fontSize: 14,
                padding: '0 24px',
              }}
              onClick={onClose}
            >
              Назад к акциям
            </Button>
            <Button
              style={{
                backgroundColor: '#EF2C2C',
                color: 'white',
                borderRadius: 30,
                height: 40,
                fontSize: 14,
                padding: '0 24px',
              }}
              onClick={() => {
                navigate(`/projects/${successData.teamId}`);
                onClose();
              }}
            >
              К проекту
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
