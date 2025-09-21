import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Button,
    Form,
    Input,
    Checkbox,
    Select,
    Upload,
    message,
    Row,
    Col
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { regions } from '../../../data';

const { Option } = Select;

const tailFormItemLayout = {
    wrapperCol: {
      xs: {
        span: 24,
        offset: 0,
      },
      sm: {
        span: 24,
        offset: 0,
      },
    },
};

export const RegistrationForm: React.FC = () => {
    const [form] = Form.useForm();
    const [selectedRegion, setSelectedRegion] = useState<string>(''); // Хранение выбранного региона
    const [localities, setLocalities] = useState<string[]>([]); // Список населенных пунктов для выбранного региона
    const [isMentor, setIsMentor] = useState<boolean>(false);

    const onRoleChange = (value: string) => {
        setIsMentor(value === '?наставник');
        // if (!isMentor) {
        //     setIsMentor(true);
        // } else {
        //     setIsMentor(false);
        // }
    };

    const handleRegionChange = (value: string) => {
        const selectedRegionData = regions.find(region => region.label === value);
        setLocalities(selectedRegionData ? selectedRegionData.locality : []);
        form.setFieldsValue({ locality: undefined }); // Сбрасываем значение locality при изменении региона
    };

    const handleUpload = async (rawFile: any) => {
        const formData = new FormData();
        formData.append('file', rawFile);  // ключ 'file' совпадает с Flask

        try {
            const response = await axios.post('http://1180973-cr87650.tw1.ru/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            message.success('Файл успешно загружен');
            return response.data.filename;
        } catch (error) {
            message.error('Ошибка при загрузке файла');
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
                const fileName = await handleUpload(file[0].originFileObj);// Дожидаемся завершения загрузки файла
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
            const response = await axios.post('http://1180973-cr87650.tw1.ru/register', dataToSend);
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
    // const validateLocality = (rule: any, value: string) => {
    //     if (!value) {
    //     return Promise.reject('Заполните поле');
    //     }
    //     if (!russianLettersRegex.test(value)) {
    //     return Promise.reject('Пожалуйста, введите только кириллические буквы');
    //     }
    //     return Promise.resolve();
    // };

    const validateLocality = (_: any, value: string) => {
        if (value && !russianLettersRegex.test(value)) {
            return Promise.reject('Пожалуйста, введите только кириллические буквы');
        }
        return Promise.resolve();
    };


    return (
        <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
            <Form form={form} onFinish={onFinish} layout="vertical" variant="filled" style={{ width: '100%' }}>
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
                        message: 'Вы ввели некорректный e-mail',
                    },
                    {
                        required: true,
                        message: 'Заполните поле',
                    },
                    ]}
                >
                    <Input />
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Регион"
                            name="region"
                            rules={[{ required: true, message: 'Выберите регион!' }]}
                            >
                            <Select
                                showSearch
                                placeholder="Выберите ваш регион"
                                optionFilterProp="label"
                                onChange={handleRegionChange}
                                filterOption={(input, option) =>
                                (option?.label as string).toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {regions.map((region, index) => (
                                <Option key={index} value={region.label} label={region.label}>
                                    {region.label}
                                </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Населённый пункт"
                            name="locality"
                            rules={[
                                { required: true, message: 'Выберите населённый пункт!' },
                                { validator: validateLocality },
                            ]}
                            >
                            <Select
                                showSearch
                                placeholder="Выберите ваш населённый пункт"
                                optionFilterProp="label"
                                filterOption={(input, option) =>
                                (option?.label as string).toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {localities.map((locality, index) => (
                                <Option key={index} value={locality} label={locality}>
                                    {locality}
                                </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    label="Название школы"
                    name="school"
                    rules={[
                        { required: true, message: 'Заполниет поле' },
                    ]}
                >
                    <Input />
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="password"
                            label="Придумайте пароль"
                            rules={[
                            {
                                required: true,
                                message: 'Пожалуста, введите пароль!',
                            },
                            ]}
                            hasFeedback
                        >
                            <Input.Password />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="confirm"
                            label="Повторите пароль"
                            dependencies={['password']}
                            hasFeedback
                            rules={[
                            {
                                required: true,
                                message: 'Пожалуйста, повторите пароль!',
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
                    </Col>
                </Row>
                
                <Row gutter={16}>
                    <Col span={12}>
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
                    </Col>

                    {
                        isMentor 
                        ?
                        <Col span={12}>
                            <Form.Item
                                name="file"
                                // 'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf'
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
                        </Col>

                        : null
                    }
                </Row>

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
                    <Button type="primary" htmlType="submit" className='login-form-button'>
                        Зарегистрироваться
                    </Button>
                </Form.Item>
            </Form>
        </div>
  )
}
