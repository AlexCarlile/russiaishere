import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Form, Input, Button, Upload, message, Alert, Typography } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { Paragraph } = Typography;

export const ProjectsContent: React.FC = () => {
    const { teamId } = useParams<{ teamId: string }>(); // Получаем teamId из URL
    const [projectData, setProjectData] = useState<any>(null);
    const [teamMembers, setTeamMembers] = useState<{ name: string; surname: string }[]>([]); // Список участников
    const [userRole, setUserRole] = useState<string>(''); // Сохраняем роль пользователя
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Статус отправки

    useEffect(() => {
        const fetchProjectData = async () => {
            const token = Cookies.get('token');
            try {
                // Делаем запрос к эндпоинту для получения данных проекта и участников команды
                const response = await axios.get(`http://127.0.0.1:5000/team/${teamId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                // Сохраняем данные проекта и участников в стейт
                setProjectData(response.data.project);
                setTeamMembers(response.data.team_members);
                setUserRole(response.data.user_role);
            } catch (error) {
                console.error('Ошибка загрузки данных проекта и команды:', error);
            }
        };

        fetchProjectData();
    }, [teamId]);

    const handleSubmit = async (values: { comment: string; file: any }) => {
        const token = Cookies.get('token');
        const formData = new FormData();
        formData.append('comment', values.comment);
        if (values.file && values.file.fileList.length > 0) {
            formData.append('file', values.file.fileList[0].originFileObj);
        }

        try {
            await axios.post(`http://127.0.0.1:5000/upload/${teamId}`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            message.success('Файл успешно загружен');
        } catch (error) {
            console.error('Ошибка при загрузке файла:', error);
            message.error('Ошибка при загрузке файла');
        }
    };

    const handleProjectSubmit = () => {
        if (userRole === 'участник') {
            message.error('Только наставник может отправить проект. Добавьте наставника в команду или попросите его отправить проект.');
        } else if (userRole === '?наставник') {
            message.error('Подтвердите ваш статус наставника. Напишите на support@russiaishere.ru.');
        } else if (userRole === 'наставник') {
            // Логика отправки проекта
            setIsSubmitting(true);
            message.success('Проект отправлен!');
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <div></div>
            <h2>Моя команда: {projectData?.title}</h2>
            {/* <p>Описание: {projectData?.description}</p> */}
            <h2>Участники команды</h2>
            <ul>
                {teamMembers.map((member, index) => (
                    <li key={index}>
                        {member.name} {member.surname}
                    </li>
                ))}
            </ul>

            <h2>Создание проекта</h2>
            <Form onFinish={handleSubmit}>
                <Form.Item
                    name="comment"
                    rules={[{ required: true, message: 'Пожалуйста, введите комментарий!' }]}
                >
                    <Input placeholder="Опишите вашу идею" />
                </Form.Item>
                <Form.Item name="file">
                    <Upload beforeUpload={() => false}>
                        <Button icon={<UploadOutlined />}>Прикрепить файл</Button>
                    </Upload>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Сохранить
                    </Button>
                </Form.Item>
            </Form>

            {userRole === 'наставник' ? (
                <Button type="primary" onClick={handleProjectSubmit} loading={isSubmitting}>
                    Отправить проект
                </Button>
            ) : (
                <Button type="primary" disabled>
                    Отправить проект
                </Button>
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
