import React, { useState } from 'react';
import { Form, Input, DatePicker, Button, message } from 'antd';
import Cookies from 'js-cookie';
import axios from 'axios';

const { RangePicker } = DatePicker;

export const CampaignForm: React.FC = () => {
    const [form] = Form.useForm();
    const [campaigns, setCampaigns] = useState<any[]>([]);

    const fetchCampaigns = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:5000/campaigns');
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
            const response = await axios.post('http://127.0.0.1:5000/campaigns', formData, {
                headers: {
                    ...headers,
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Новая акция добавлена:', response.data);
            message.success('Новая акция успешно добавлена');
            fetchCampaigns(); // Запросить обновленный список акций
            form.resetFields(); // Сброс формы
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
                label="Заголовок"
                rules={[{ required: true, message: 'Введите заголовок акции' }]}
            >
                <Input />
            </Form.Item>
            <Form.Item name="description" label="Описание">
                <Input.TextArea />
            </Form.Item>
            <Form.Item name="dates" label="Дата проведения" rules={[{ required: true, message: 'Выберите даты' }]}>
                <RangePicker />
            </Form.Item>
            <Form.Item label="Изображение">
                <input type="file" id="fileInput" accept="image/*" />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit">
                    Добавить
                </Button>
            </Form.Item>
        </Form>
    );
};
