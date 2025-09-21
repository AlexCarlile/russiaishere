import React, { useState } from 'react';
import { Form, Input, DatePicker, Button, message } from 'antd';
import Cookies from 'js-cookie';
import axios from 'axios';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

type CampaignFormProps = {
    onClose: () => void;
};

export const CampaignForm: React.FC<CampaignFormProps> = ({ onClose }) => {
    const [form] = Form.useForm();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);


    const fetchCampaigns = async () => {
        try {
            const response = await axios.get('http://1180973-cr87650.tw1.ru/campaigns');
            setCampaigns(response.data);
        } catch (error) {
            console.error('Failed to fetch campaigns:', error);
        }
    };

    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
    };

    const token = Cookies.get('token');

    const headers = {
        'Authorization': `Bearer ${token}`
    };

    const handleSubmit = async (values: any) => {
        const formData = new FormData();
        formData.append('title', values.title);
        formData.append('description', values.description);
        formData.append('full_description', values.description);
        formData.append('rules', values.description);
        formData.append('start_date', values.dates[0].toISOString());
        formData.append('end_date', values.dates[1].toISOString());
        
        // Here, we use the native input file element to get the selected file
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput.files && fileInput.files[0]) {
            formData.append('image', fileInput.files[0]);
        } else {
            console.error('Image file is null or undefined');
        }

        try {
            const response = await axios.post('http://1180973-cr87650.tw1.ru/campaigns', formData, {
                headers: {
                    ...headers,
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Новая акция добавлена:', response.data);
            message.success('Новая акция успешно добавлена');
            fetchCampaigns(); // Запросить обновленный список акций
            form.resetFields(); // Сброс формы
            setPreviewUrl(null);
            setFileName(null);
            onClose(); 
        } catch (error) {
            console.error('Ошибка при добавлении акции:', error);
            message.error('Ошибка при добавлении акции');
        }
    };

    return (
        <Form
            form={form}
            name="campaignForm"
            onFinish={handleSubmit}
            onFinishFailed={onFinishFailed}
            initialValues={{ dates: [] }}
        >
            <Form.Item
                name="title"
                label="Название акции"
                rules={[{ required: true, message: 'Введите заголовок акции' }]}
                labelCol={{ span: 24 }}   // Лейбл занимает всю ширину (над инпутом)
                wrapperCol={{ span: 24 }} // Инпут под лейблом
            >
                <Input />
            </Form.Item>
            <Form.Item
                labelCol={{ span: 24 }}   // Лейбл занимает всю ширину (над инпутом)
                wrapperCol={{ span: 24 }} // Инпут под лейблом
             name="description" label="Краткое описание">
                <Input.TextArea />
            </Form.Item>
            <Form.Item
                labelCol={{ span: 24 }}   // Лейбл занимает всю ширину (над инпутом)
                wrapperCol={{ span: 24 }} // Инпут под лейблом
             name="full_description" label="Подробное описание акции">
                <Input.TextArea autoSize={{ minRows: 6, maxRows: 10 }} />
            </Form.Item>
            <Form.Item
                labelCol={{ span: 24 }}   // Лейбл занимает всю ширину (над инпутом)
                wrapperCol={{ span: 24 }} // Инпут под лейблом
             name="rules" label="Опишите правила акции">
                <Input.TextArea autoSize={{ minRows: 6, maxRows: 10 }}/>
            </Form.Item>
            <Form.Item
                labelCol={{ span: 24 }}   // Лейбл занимает всю ширину (над инпутом)
                wrapperCol={{ span: 24 }} // Инпут под лейблом
                name="dates" label="Дата проведения" 
                rules={[{ required: true, message: 'Выберите даты' }]}
            >
                <RangePicker 
                    disabledDate={(current) => {
                        return current && current < dayjs().startOf('day');
                    }}
                />
            </Form.Item>
            <Form.Item
                labelCol={{ span: 24 }}   // Лейбл занимает всю ширину (над инпутом)
                wrapperCol={{ span: 24 }} // Инпут под лейблом
                label="Обложка акции"
                style={{display: 'flex', flexDirection: 'column'}}
            >
                <input 
                    type="file" 
                    id="fileInput" 
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

                            if (!allowedTypes.includes(file.type)) {
                                message.error('Разрешены только изображения форматов JPG, PNG, WEBP');
                                // Сбросить инпут и состояние
                                setFileName(null);
                                setPreviewUrl(null);
                                e.target.value = '';
                                return;
                            }

                            setFileName(file.name);
                            setPreviewUrl(URL.createObjectURL(file));
                        }
                    }}
                />
                
                {previewUrl && (
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                        <img
                            src={previewUrl}
                            alt="Превью"
                            style={{
                                maxWidth: '300px',
                                maxHeight: '200px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                marginBottom: '10px'
                            }}
                        />
                        <Button
                            danger
                            type="default"
                            onClick={() => {
                                // Сбросить preview и имя
                                setPreviewUrl(null);
                                setFileName(null);

                                // Очистить значение input[type=file]
                                const input = document.getElementById('fileInput') as HTMLInputElement;
                                if (input) input.value = '';
                            }}
                            style={{ marginBottom: '10px' }}
                        >
                            Удалить файл
                        </Button>
                    </div>
                )}
                {fileName && <p style={{ margin: '0 0 8px' }}>Выбран файл: {fileName}</p>}
                <Button
                    onClick={() => document.getElementById('fileInput')?.click()}
                    style={{
                        backgroundColor: 'rgb(239, 49, 36)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        marginBottom: '10px'
                    }}
                >
                    Выбрать файл
                </Button>
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit" style={{backgroundColor: 'rgb(239, 49, 36)'}}>
                    Добавить
                </Button>
            </Form.Item>
        </Form>
    );
};
