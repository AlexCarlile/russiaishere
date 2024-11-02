import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Avatar, Upload, message, Spin } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';
import axios from 'axios';

export const Info = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

    useEffect(() => {
        const token = Cookies.get('token');

        axios.get('http://127.0.0.1:5000/user', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then(response => {
            form.setFieldsValue(response.data);
            setLoading(false);

            // Получаем фото пользователя, если оно существует
            const filename = response.data.photo; // Предполагается, что photo хранит имя файла в БД
            if (filename) {
                axios.get(`http://127.0.0.1:5000/download/${filename}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }).then(res => {
                    setPhotoUrl(res.data.download_url); // Сохраняем URL для загрузки
                }).catch(() => {
                    message.error('Ошибка при загрузке фото');
                });
            }
        }).catch(error => {
            message.error('Ошибка при загрузке данных пользователя'); // Использование message из antd
            setLoading(false);
        });
    }, [form]);

    const handleFinish = (values: any) => {
        const token = Cookies.get('token');

        axios.put('http://127.0.0.1:5000/user', values, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then(response => {
            message.success('Данные успешно обновлены'); // Использование message из antd
        }).catch(error => {
            message.error('Ошибка при обновлении данных пользователя'); // Использование message из antd
        });
    };

    if (loading) {
        return <Spin />;
    }

    return (
        <div>
            <h2>Личный кабинет</h2>
                <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                        <Avatar size={64} icon={<UserOutlined />} />
                        <Upload>
                            <Button icon={<UploadOutlined />}>Загрузить фото</Button>
                        </Upload>
                    </div>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleFinish}
                        initialValues={{}}
                        style={{display: 'flex'}}
                    >
                        <div>
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[{ required: true, message: 'Пожалуйста, введите ваш email' }]}
                            >
                                <Input disabled />
                            </Form.Item>
                            <Form.Item
                                name="name"
                                label="Имя"
                                rules={[{ required: true, message: 'Пожалуйста, введите ваше имя' }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="surname"
                                label="Фамилия"
                                rules={[{ required: true, message: 'Пожалуйста, введите вашу фамилию' }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="region"
                                label="Регион"
                                rules={[{ required: true, message: 'Пожалуйста, введите ваш регион' }]}
                            >
                                <Input />
                            </Form.Item>
                        </div>
                        
                        <div>
                            <Form.Item
                                name="locality"
                                label="Населенный пункт"
                                rules={[{ required: true, message: 'Пожалуйста, введите ваш населенный пункт' }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="school"
                                label="Школа"
                                rules={[{ required: true, message: 'Пожалуйста, введите вашу школу' }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="role"
                                label="Роль"
                                rules={[{ required: true, message: 'Пожалуйста, введите вашу роль' }]}
                            >
                                <Input disabled/>
                            </Form.Item>
                        </div>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Сохранить изменения
                        </Button>
                    </Form>
                </div>

                {/* Новый контейнер для отображения фотографии */}
                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <h3>Подтверждение наставника</h3>
                    <Avatar size={100} src={photoUrl} icon={!photoUrl && <UserOutlined />} />
                </div>
        </div>
        
    );
};