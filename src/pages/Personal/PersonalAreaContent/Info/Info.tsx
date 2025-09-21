import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Avatar, Upload, message, Spin } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';
import axios from 'axios';
import "./Info.css";

export const Info = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [fileList, setFileList] = useState<any[]>([]);

    useEffect(() => {
        const token = Cookies.get('token');

        axios.get('http://1180973-cr87650.tw1.ru/user', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then(response => {
            form.setFieldsValue(response.data);
            setLoading(false);

            // Получаем фото пользователя, если оно существует
            const savedImage = localStorage.getItem('personnelImage');
            if (savedImage) {
                setPhotoUrl(savedImage);
            } else {
                axios.get('http://1180973-cr87650.tw1.ru/random-icon', {
                    responseType: 'blob'
                }).then(res => {
                    const imageUrl = URL.createObjectURL(res.data);
                    setPhotoUrl(imageUrl);

                    // Преобразуем blob в base64 для хранения
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        if (reader.result) {
                            localStorage.setItem('personnelImage', reader.result.toString());
                        }
                    };
                    reader.readAsDataURL(res.data);
                }).catch(() => {
                    message.error('Не удалось загрузить иконку');
                });
            }

            // Если есть файл наставника
            const savedFile = response.data.file;
            if (savedFile) {
            setFileList([{
                uid: '-1',
                name: savedFile,
                status: 'done',
                url: `http://1180973-cr87650.tw1.ru/uploads/mentorsRequest/${savedFile}`
            }]);
            }
        }).catch(error => {
            message.error('Ошибка при загрузке данных пользователя'); // Использование message из antd
            setLoading(false);
        });
    }, [form]);

    const handleFinish = (values: any) => {
        const token = Cookies.get('token');

        // Если есть файл наставника, берем только имя
        if (fileList.length > 0) {
            values.file = fileList[0].name;
        } else {
            values.file = null;
        }

        axios.put('http://1180973-cr87650.tw1.ru/user', values, {
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
        <div className="info-container">
            <div className='info-main'>
                <div className='title'>
                    <h2 className='info-title'>Личный кабинет</h2>
                </div>

                <div className='info-hero'>
                    <div className='responsive-avatar'>
                        <Avatar size='default' src={photoUrl} icon={<UserOutlined />} />
                    </div>

                    <div>
                        <div className="info-form">
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleFinish}
                                initialValues={{}}
                                style={{display: 'flex'}}
                            >
                                <div className='form-content'>
                                    <div className="form-columns">
                                        <div className="form-column">
                                            <Form.Item
                                                name="name"
                                                label="Имя"
                                                rules={[{ required: true, message: 'Пожалуйста, введите ваше имя' }]}
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

                                            <Form.Item
                                                name="email"
                                                label="Email"
                                                rules={[{ required: true, message: 'Пожалуйста, введите ваш email' }]}
                                            >
                                                <Input disabled />
                                            </Form.Item>
                                        </div>
                                    
                                    
                                        <div className="form-column">
                                            <Form.Item
                                                name="surname"
                                                label="Фамилия"
                                                rules={[{ required: true, message: 'Пожалуйста, введите вашу фамилию' }]}
                                            >
                                                <Input />
                                            </Form.Item>

                                            <Form.Item
                                                name="locality"
                                                label="Населенный пункт"
                                                rules={[{ required: true, message: 'Пожалуйста, введите ваш населенный пункт' }]}
                                            >
                                                <Input />
                                            </Form.Item>
                                            <Form.Item
                                                name="school"
                                                label="Название школы"
                                                rules={[{ required: true, message: 'Пожалуйста, введите вашу школу' }]}
                                            >
                                                <Input />
                                            </Form.Item>
                                        </div>
                                    </div>

                                    <div className='info-role'>
                                        <Form.Item
                                            name="role"
                                            label="Роль"
                                            rules={[{ required: true, message: 'Пожалуйста, введите вашу роль' }]}
                                        >
                                            <Input disabled/>
                                        </Form.Item>
                                    </div>

                                    {form.getFieldValue('role') === '?наставник' && (
                                        <div style={{ width: '100%', marginTop: 24 }}>
                                            <Form.Item label="Файл наставника" name="file">
                                                <Upload
                                                    beforeUpload={() => false} // отменяем автоматическую загрузку
                                                    maxCount={1}
                                                    fileList={fileList} // используем состояние
                                                    onChange={({ fileList }) => setFileList(fileList)} // синхронизация с Upload
                                                    onRemove={async (file) => {
                                                        const oldFile = form.getFieldValue('file');
                                                        if (oldFile) {
                                                        await axios.delete(`http://1180973-cr87650.tw1.ru/uploads/mentorsRequest/${oldFile}`);
                                                        form.setFieldsValue({ file: null });
                                                        setFileList([]); // очистка состояния
                                                        }
                                                    }}
                                                    customRequest={async ({ file, onSuccess, onError }) => {
                                                        try {
                                                        const formData = new FormData();
                                                        formData.append('file', file as File);

                                                        const response = await axios.post(
                                                            'http://1180973-cr87650.tw1.ru/upload',
                                                            formData,
                                                            { headers: { 'Content-Type': 'multipart/form-data' } }
                                                        );

                                                        form.setFieldsValue({ file: response.data.filename });
                                                        onSuccess?.(response.data, file as any);
                                                        setFileList([{
                                                            uid: '-1',
                                                            name: response.data.filename,
                                                            status: 'done',
                                                            url: `http://1180973-cr87650.tw1.ru/uploads/mentorsRequest/${response.data.filename}`
                                                        }]);
                                                        message.success('Файл успешно загружен');
                                                        } catch (err) {
                                                        console.error(err);
                                                        onError?.(err as any);
                                                        message.error('Ошибка при загрузке файла');
                                                        }
                                                    }}
                                                    >
                                                    <Button icon={<UploadOutlined />}>Выбрать файл</Button>
                                                    </Upload>


                                            </Form.Item>
                                        </div>
                                        )}

                                    <div>
                                        <Button 
                                            type="primary" 
                                            htmlType="submit" 
                                            loading={loading}
                                            style={{
                                                backgroundColor: '#f44336', // Красный цвет (как в вашем макете)
                                                borderColor: '#f44336',
                                                width: '100%'               // Кнопка на всю ширину
                                            }}
                                        >
                                            Сохранить изменения
                                        </Button>
                                    </div>
                                </div>
                            </Form>
                        </div>
                    </div>

                    {/* Новый контейнер для отображения фотографии */}
                    {/* <div style={{ marginTop: '24px', textAlign: 'center' }}>
                        <h3>Подтверждение наставника</h3>
                        <Avatar size={100} src={photoUrl} icon={!photoUrl && <UserOutlined />} />
                    </div> */}
                </div>
            </div>
        </div>
        
    );
};