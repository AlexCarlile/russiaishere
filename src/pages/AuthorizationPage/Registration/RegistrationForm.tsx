import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Button,
    Form,
    Input,
    Checkbox,
    Select,
    Upload,
    message
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { regions } from '../../../data';

const { Option } = Select;

const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 6 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 14 },
    },
};

const tailFormItemLayout = {
    wrapperCol: {
      xs: {
        span: 24,
        offset: 0,
      },
      sm: {
        span: 16,
        offset: 8,
      },
    },
};

export const RegistrationForm: React.FC = () => {
    const [form] = Form.useForm();
    const [selectedRegion, setSelectedRegion] = useState<string>(''); // Хранение выбранного региона
    const [localities, setLocalities] = useState<string[]>([]); // Список населенных пунктов для выбранного региона
    const [isMentor, setIsMentor] = useState<boolean>(false);

    const onRoleChange = (value: string) => {
        if (!isMentor) {
            setIsMentor(true);
        } else {
            setIsMentor(false);
        }
    };

    const handleRegionChange = (value: string) => {
        const selectedRegionData = regions.find(region => region.label === value);
        setLocalities(selectedRegionData ? selectedRegionData.locality : []);
        form.setFieldsValue({ locality: undefined }); // Сбрасываем значение locality при изменении региона
    };

    const handleUpload = async (file: any) => {
        const formData = new FormData();
        formData.append('file', file);
      
        try {
            const response = await axios.post('http://127.0.0.1:5000/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            message.success('Файл успешно загружен');
            console.log('Файл успешно загружен:', response.data);
            return file.name;  // Возвращаем имя файла
        } catch (error) {
            if (axios.isAxiosError(error)) {
                message.error('Ошибка при загрузке файла');
                console.error('Ошибка загрузки файла:', error.response ? error.response.data : error.message);
            } else {
                console.error('Ошибка:', error);
            }
            throw error;
        }
    };

    const onFinish = async (values: any) => {
        // Получаем значения формы
        const { region, locality, name, surname, email, school, password, file, role, agreement } = values;
        
        let currentDate = null;

        if (agreement) {
            currentDate = new Date().toISOString(); // Если согласие дано, устанавливаем текущую дату
        }

        const dataToSend: any = {
            region,
            locality,
            name,
            surname,
            email,
            school,
            password,
            role,
            // file,
            agreement: agreement ? 'Да' : 'Нет',
            currentDate,
        };

        if (role === '?наставник' && file && file.length > 0) {
            try {
                const fileName = await handleUpload(file[0].originFileObj); // Дожидаемся завершения загрузки файла
                console.log(fileName)
                if (fileName.length > 0) {
                    dataToSend.file = fileName;
                } else {
                    dataToSend.file = 'None';
                }
            } catch (error) {
                console.error('Ошибка загрузки файла:', error);
                message.error('Ошибка загрузки файла');
                return;
            }
        }
        
        try {
            // Отправляем данные на сервер
            const response = await axios.post('http://127.0.0.1:5000/register', dataToSend);
            console.log('Registration successful:', response.data);
            message.success('Регистрация прошла успешно');
            setTimeout(() => {
                window.location.reload();
              }, 1500);

        } catch (error) {
            console.error('Registration failed:', error);
            message.error('Ошибка при регистрации');
        }
    };

    // Регулярное выражение для проверки на русские буквы, пробелы и тире
    const russianLettersRegex = /^[А-Яа-яЁё\s\-]+$/;

    // Функция для проверки валидности ввода
    const validateLocality = (rule: any, value: string) => {
        if (!value) {
        return Promise.reject('Заполните поле');
        }
        if (!russianLettersRegex.test(value)) {
        return Promise.reject('Пожалуйста, введите только кириллические буквы');
        }
        return Promise.resolve();
    };


    return (
        <Form form={form} onFinish={onFinish} {...formItemLayout} variant="filled" style={{ width: 600, justifySelf: "center" }}>
            <Form.Item 
                label="Имя" 
                name="name" 
                rules={[
                    { required: true, message: 'Заполните поле' },
                    { validator: validateLocality }
                ]}
            >
                <Input />
            </Form.Item>
            
            <Form.Item 
                label="Фамилия" 
                name="surname"
                rules={[
                    { required: true, message: 'Заполните поле' },
                    { validator: validateLocality }
                ]}
            >
                <Input />
            </Form.Item>
            
            <Form.Item
                name="email"
                label="E-mail"
                rules={[
                {
                    type: 'email',
                    message: 'The input is not valid E-mail!',
                },
                {
                    required: true,
                    message: 'Please input your E-mail!',
                },
                ]}
            >
                <Input />
            </Form.Item>
    
            <Form.Item
                label="Регион"
                name="region"
                rules={[{ required: true, message: 'Выберите регион!' }]}
            >
                <Select
                    showSearch
                    style={{ width: 200 }}
                    placeholder="Выберите ваш регион"
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                        option?.children 
                            ? option.children.toString().toLowerCase().indexOf(input.toLowerCase()) >= 0 
                            : false
                    }
                    onChange={handleRegionChange} // Обработчик изменения выбранного региона
                >
                    {regions.map((region, index) => (
                        <Option key={index} value={region.label}>{region.label}</Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                label="Населенный пункт"
                name="locality"
                rules={[
                    { required: true, message: 'Выберите населенный пункт!' },
                    { validator: validateLocality }
                ]}
            >
                <Select
                    showSearch
                    style={{ width: 200 }}
                    placeholder="Выберите ваш населенный пункт"
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                        option?.children 
                            ? option.children.toString().toLowerCase().indexOf(input.toLowerCase()) >= 0 
                            : false
                    }
                >
                    {localities.map((locality, index) => (
                        <Option key={index} value={locality}>{locality}</Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                label="Название школы"
                name="school"
                rules={[
                    { required: true, message: 'Заполниет поле' },
                ]}
            >
                <Input />
            </Form.Item>

            <Form.Item
                name="password"
                label="Придумайте пароль"
                rules={[
                {
                    required: true,
                    message: 'Please input your password!',
                },
                ]}
                hasFeedback
            >
                <Input.Password />
            </Form.Item>

            <Form.Item
                name="confirm"
                label="Повторите пароль"
                dependencies={['password']}
                hasFeedback
                rules={[
                {
                    required: true,
                    message: 'Please confirm your password!',
                },
                ({ getFieldValue }) => ({
                    validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                    }
                    return Promise.reject(new Error('The new password that you entered do not match!'));
                    },
                }),
                ]}
            >
                <Input.Password />
            </Form.Item>
     
            <Form.Item
                name="role"
                label="Вы наставник?"
                tooltip="Вы должны быть школьным учителем и предоставить документ подтверждающий статус"
            >
                <Select
                    defaultValue="Нет"
                    style={{ width: 120 }}
                    onChange={onRoleChange}
                    options={[
                        { value: '?наставник', label: 'Да' },
                        { value: 'участник', label: 'Нет' },
                    ]}
                />
            </Form.Item>

            {
                isMentor 
                ?
                <Form.Item
                    name="file"
                    label="Загрузите файл"
                    valuePropName="fileList"
                    getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
                    rules={[{ required: true, message: 'Загрузите файл подтверждающий статус' }]}
                >
                    <Upload 
                        name="file"
                        // customRequest={handleUpload}
                        beforeUpload={() => false} // Отключаем автоматическую загрузку
                    >
                        <Button icon={<UploadOutlined />}>Загрузить</Button>
                    </Upload>
                </Form.Item>

                : null
            }

            <Form.Item
                name="agreement"
                valuePropName="checked"
                rules={[
                {
                    validator: (_, value) =>
                    value ? Promise.resolve() : Promise.reject(new Error('Подтвердите свое согласие')),
                },
                ]}
                {...tailFormItemLayout}
            >
                <Checkbox>
                    Даю согласие на передачу персональных данных
                </Checkbox>
            </Form.Item>
        
            <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
                <Button type="primary" htmlType="submit">
                    Зарегистрироваться
                </Button>
            </Form.Item>
      </Form>
  )
}
