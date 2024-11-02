import React from 'react';
import { Button, Space } from 'antd';

interface JoinTeamModalContentProps {
    onCreateTeam: () => void;
    onJoinTeam: () => void;
    onContinueWork: () => void;
}

export const JoinTeamModalContent: React.FC<JoinTeamModalContentProps> = ({ onCreateTeam, onJoinTeam, onContinueWork }) => {
    return (
        <div>
            <Space direction="vertical" style={{ width: '100%' }}>
                <Button type="primary" onClick={onCreateTeam} style={{ marginBottom: '1rem' }}>
                    Создать команду
                </Button>
                <Button type="default" onClick={onJoinTeam} style={{ marginBottom: '1rem' }}>
                    Присоединиться к команде
                </Button>
                <Button type="default" onClick={onContinueWork}>
                    Продолжить работу в команде
                </Button>
            </Space>
        </div>
    );
};
