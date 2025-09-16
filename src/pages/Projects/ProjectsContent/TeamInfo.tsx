import React from 'react';
import './Project.css';
import { CopyOutlined } from '@ant-design/icons';
import { message } from 'antd';

interface TeamMember {
    name: string;
    surname: string;
    role?: string; // добавили роль
}

interface TeamInfoProps {
    members: TeamMember[];
    mentor: TeamMember | null;   // ✅ объект или null
    teamName: string;
    projectCode: string; // ⬅️ добавили
}

const TeamInfo: React.FC<TeamInfoProps> = ({ members, mentor, teamName, projectCode }) => {
    const handleCopy = () => {
    navigator.clipboard.writeText(projectCode)
        .then(() => message.success('Код проекта скопирован!'))
        .catch(() => message.error('Не удалось скопировать код'));
    };


    return (
        <div className='team-block flex'>
            <div className="team-section">
                <h2 className="team-section__title">Моя команда</h2>

                <div className='team-details flex'>
                    <div className='team-micro-block'>
                        <div className="team-section__block">
                            <p className="team-section__label">Название команды</p>
                            <p className="team-section__value">{teamName}</p>
                        </div>

                        <div className="team-section__block">
                            <p className="team-section__label">Наставник</p>
                            <p className="mb-3">
                                {mentor ? `${mentor.name} ${mentor.surname}` : '—'}
                            </p>
                        </div>
                    </div>
                    
                    <div className='team-micro-block'>
                        <div className="team-section__block">
                            <p className="team-section__label">Количество участников</p>
                            <p className="team-section__value">{members.length} участник</p>
                        </div>
                        <div className="team-section__block">
                            <p className="team-section__label">Код проекта</p>
                            <div className="team-section__value copyable-code" onClick={handleCopy} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>{projectCode}</span>
                                <CopyOutlined />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="team-section__avatars">
                {members.map((member, index) => (
                <div
                    key={index}
                    className="team-section__avatar"
                >
                    {member.name[0]}
                    {member.surname[0]}
                </div>
                ))}
            </div>
        </div>
    );
};

export default TeamInfo;
