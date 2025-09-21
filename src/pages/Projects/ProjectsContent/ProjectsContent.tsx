import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Button, message, Alert, Typography, Spin } from 'antd';
import ProjectSurvey, { ProjectSurveyRef }  from './ProjectSurvey';
import ProjectHeader from './ProjectHeader';
import TeamInfo from './TeamInfo';

const { Paragraph } = Typography;

interface Campaign {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  image_url: string;
//   winner_announcement_date?: string;
}

interface TeamMember {
    name: string;
    surname: string;
    role?: string; // добавили роль
    mentor: string; 
}

interface ProjectsContentProps {
  winnerPublic?: boolean;
}

export const ProjectsContent: React.FC<ProjectsContentProps>  = ({ winnerPublic }) => {
    const { teamId, projectId } = useParams<{ teamId?: string; projectId?: string }>(); // Получаем teamId из URL
    const [projectData, setProjectData] = useState<any>(null);
    const [teamMembers, setTeamMembers] = useState<{ name: string; surname: string }[]>([]); // Список участников
    const [userRole, setUserRole] = useState<string>(''); // Сохраняем роль пользователя
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Статус отправки
    const surveyRef = useRef<ProjectSurveyRef>(null);
    const [isDisabled, setIsDisabled] = useState<boolean>(false)
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [mentor, setMentor] = useState<TeamMember | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    
    const onFileUploaded = (filename: string, fileUrl: string) => {
        setUploadedFileName(filename);
    };

    // useEffect(() => {
        // const fetchProjectData = async () => {
        //     const token = Cookies.get('token');
        //     try {
        //         const response = await axios.get(`http://127.0.0.1:5000/team/${teamId}`, {
        //             headers: {
        //                 'Authorization': `Bearer ${token}`
        //             }
        //         });

        //         setProjectData(response.data.project);
        //         setTeamMembers(response.data.team_members);
        //         setUserRole(response.data.user_role);
        //         // ⬇️ правильная логика выделения наставника
        //         if (response.data.team_members) {
        //             const mentorMember = response.data.team_members.find((m: any) => m.role === 'наставник');
        //             setMentor(mentorMember || null);
        //         }

        //     } catch (error) {
        //         console.error('Ошибка загрузки данных проекта и команды:', error);
        //     }
        // };
        useEffect(() => {
            const fetchProjectData = async () => {
                setLoading(true);
                setError(null);
                try {
                let url = '';
                const token = Cookies.get('token');

                if (winnerPublic && projectId) {
                    url = `http://1180973-cr87650.tw1.ru/api/projects/${projectId}`;
                } else if (teamId) {
                    url = `http://1180973-cr87650.tw1.ru/team/${teamId}`;
                } else return;

                const headers: any = {};
                if (!winnerPublic && token) headers['Authorization'] = `Bearer ${token}`;

                const response = await axios.get(url, { headers });

                if (winnerPublic) {
                    setProjectData(response.data.project);
                    setTeamMembers(response.data.members);
                    setMentor(response.data.mentor || null);
                } else {
                    setProjectData(response.data.project);
                    setTeamMembers(response.data.team_members);
                    setUserRole(response.data.user_role);
                    const mentorMember = response.data.team_members.find((m: any) => m.role === 'наставник');
                    setMentor(mentorMember || null);
                }
                } catch (err: any) {
                console.error("Ошибка загрузки:", err);
                if (err.response?.status === 403) {
                    setError("Этот проект недоступен для публичного просмотра (он не является победителем).");
                } else if (err.response?.status === 404) {
                    setError("Проект не найден.");
                } else {
                    setError("Ошибка при загрузке проекта. Попробуйте позже.");
                }
                } finally {
                setLoading(false);
                }
            };
                fetchProjectData();
            }, [teamId, projectId, winnerPublic]);


    useEffect(() => {
        const fetchCampaign = async () => {
            if (!projectData || !projectData.campaign_id) return;

            try {
                const response = await fetch(`http://1180973-cr87650.tw1.ru/campaigns/${projectData.campaign_id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${Cookies.get('token') || ''}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`Ошибка ${response.status}`);
                }

                const data: Campaign = await response.json();
                setCampaign(data);
            } catch (error) {
                console.error('Ошибка при загрузке кампании:', error);
                setCampaign(null);
            }
        };

        fetchCampaign();
    }, [projectData]); // ✅ безопасная подписка

    
    useEffect(() => {
        if (projectData) {
            if (
                projectData?.status === "yes" || 
                projectData?.description === "yes" || 
                projectData?.description === "no"
            ) {
                setIsDisabled(true)
            }
        }
    }, [projectData]);

    const handleProjectSubmit = async () => {
        if (userRole === 'участник') {
            message.error('Только наставник может отправить проект.');
            return;
        }

        if (userRole === '?наставник') {
            message.error('Подтвердите ваш статус наставника.');
            return;
        }

        if (!surveyRef.current?.validateSurvey()) {
            message.error('Пожалуйста, заполните все поля перед отправкой проекта.');
            return;
        }

        // ✅ Проверка наличия файла
        try {
            const token = Cookies.get('token');
            const response = await axios.get(`http://1180973-cr87650.tw1.ru/get_project_file?team_id=${teamId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            });

            const fileData = response.data;
            if (!fileData.filename) {
            message.error('Перед отправкой необходимо загрузить файл проекта.');
            return;
            }
        } catch (error) {
            console.error('Ошибка при проверке файла проекта:', error);
            message.error('Не удалось проверить наличие файла. Попробуйте позже.');
            return;
        }

        // ✅ Продолжение отправки проекта
        try {
            setIsSubmitting(true);
            const surveyData = surveyRef.current.getSurveyData();
            const token = Cookies.get('token');

            await axios.post('http://1180973-cr87650.tw1.ru/api/save-answers', {
            team_id: teamId,
            answers: surveyData,
            }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
            });

            await axios.post(`http://1180973-cr87650.tw1.ru/api/set-project-status`, {
            team_id: teamId,
            status: "yes"
            }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
            });

            message.success('Проект успешно отправлен!');
            setTimeout(() => {
            window.location.reload();
            }, 1500);
        } catch (err) {
            console.error(err);
            message.error('Ошибка при отправке проекта');
        } finally {
            setIsSubmitting(false);
        }    
    };

    // сразу в рендере, перед return JSX
    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "50px" }}>
            <Spin size="large" tip="Загрузка..." />
            </div>
        );
    }

    if (error) {
        return (
            <Alert
            message="Ошибка"
            description={error}
            type="error"
            showIcon
            style={{ margin: 20 }}
            />
        );
    }


    return (
        <div>
            <Spin spinning={!projectData}></Spin>
            <div></div>
            {campaign && <ProjectHeader campaign={campaign} />}
            
            {/* {campaign && (
            <div
                style={{
                width: '100%',
                height: '550px',
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '24px',
                }}
            >
                <img
                src={http://127.0.0.1:5000${campaign.image_url}}
                alt={campaign.title}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                }}
                />
            </div>
            )} */}

            {/* <h2>Моя команда: {projectData?.title}</h2>
            <h2>Участники команды</h2>
            <ul>
                {teamMembers.map((member, index) => (
                    <li key={index}>
                        {member.name} {member.surname}
                    </li>
                ))}
            </ul>
            <h2>Пригласить в команду: {projectData?.project_code ?? '—'}</h2> */}

            {projectData?.description === 'yes' && (
                <Alert
                    message="Поздравляем!"
                    description="Ваш проект признан победителем. Отличная работа всей команды!"
                    type="success"
                    showIcon
                    style={{ marginBottom: 20 }}
                />
            )}

            {projectData?.description === 'no' && (
                <Alert
                    message="Благодарим за участие"
                    description="Ваш проект не был выбран победителем, но вы проделали отличную работу. Удачи в следующий раз!"
                    type="info"
                    showIcon
                    style={{ marginBottom: 20 }}
                />
            )}

            {projectData && (
                <TeamInfo
                    teamName={projectData.title}
                    mentor={mentor} // или доставай из API
                    members={teamMembers}
                    projectCode={projectData.project_code}
                />
            )}

            <h2>Создание проекта</h2>

            {projectData && (
                <ProjectSurvey ref={surveyRef} status={projectData?.status} winnerStatus={projectData.description}/>
            )}

            {userRole === 'наставник' ? (
                <Button type="primary" onClick={handleProjectSubmit} loading={isSubmitting} disabled={isDisabled} style={{width: '100%', fontSize: '18px', padding: '1.5rem 0 1.5rem 0', backgroundColor: '#EF3124'}}>
                    Отправить проект
                </Button>
            ) : (
                <Button type="primary" disabled style={{width: '100%', fontSize: '18px', padding: '1.5rem 0 1.5rem 0',  backgroundColor: '#EF3124'}}>
                    Отправить проект
                </Button>
            )}

            {projectData?.status === 'yes' && projectData?.description === 'InProcess' && (
                <Alert
                    message="Вы успешно отправили ваш проект"
                    description="Ожидайте результаты. Изменения в проекте теперь недоступны."
                    type="success"
                    showIcon
                    style={{ marginTop: 16 }}
                />
            )}

            {userRole === 'участник' && (
                <Alert
                    message="Только наставник может отправить проект"
                    description="Добавьте наставника в команду или попросите его отправить проект."
                    type="warning"
                    showIcon
                />
            )}
            {userRole === '?наставник' && (
                <Alert
                    message="Подтвердите ваш статус наставника"
                    description={
                        <Paragraph>
                            Напишите на <a href="mailto:support@russiaishere.ru">support@russiaishere.ru</a> для подтверждения.
                        </Paragraph>
                    }
                    type="info"
                    showIcon
                />
            )}
        </div>
    );
};