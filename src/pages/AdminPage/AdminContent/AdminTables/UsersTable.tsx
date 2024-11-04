import React, { useEffect, useState } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import axios from 'axios';

interface User {
    id: number;
    email: string;
    password: string;
    name: string;
    surname: string;
    region: string;
    localty: string;
    school: string;
    role: string;
    agreement: string;
    currentDate: string;
    file: string;
}

const roles = ['админ', 'участник', 'наставник', '?наставник', 'модератор'];

export const UsersTable: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [passwords, setPasswords] = useState<{ [key: number]: string }>({}); // Состояние для хранения паролей
    const [selectedUser, setSelectedUser] = useState<User | null>(null); // Выбранный пользователь
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchUsers = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:5000/api/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);


    const handleRowClick = (user: User) => {
        setSelectedUser(user);
        form.setFieldsValue(user);
        setIsModalVisible(true);
    };

    const updateUser = async (userId: number, newRole: string) => {
        try {
            const newPassword = passwords[userId]; // Получаем новый пароль для пользователя
            const data: any = { role: newRole }; // Объект для обновления

            if (newPassword) {
                data.password = newPassword; // Добавляем пароль, если он есть
            }

            await axios.put(`http://127.0.0.1:5000/api/users/${userId}`, data);
            
            setUsers(prevUsers => 
                prevUsers.map(user => 
                    user.id === userId ? { ...user, role: newRole, password: newPassword || user.password } : user
                )
            );
            alert('Данные пользователя успешно обновлены');
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };


    const handleSave = async () => {
        try {
            const updatedUser = form.getFieldsValue();
            await axios.put(`http://127.0.0.1:5000/api/users/${updatedUser.id}`, updatedUser);
            setUsers(prevUsers => 
                prevUsers.map(user => (user.id === updatedUser.id ? updatedUser : user))
            );
            message.success('Данные пользователя успешно обновлены');
            setIsModalVisible(false);
            setSelectedUser(null);
        } catch (error) {
            console.error('Error updating user:', error);
            message.error('Ошибка при обновлении данных пользователя');
        }
    };

    const columns = [
        { header: 'ID', accessorKey: 'id' },
        { header: 'Email', accessorKey: 'email' },
        { header: 'Пароль', accessorKey: 'password' },
        { header: 'Имя', accessorKey: 'name' },
        { header: 'Фамилия', accessorKey: 'surname' },
        { header: 'Регион', accessorKey: 'region' },
        { header: 'Город', accessorKey: 'locality' },
        { header: 'Школа', accessorKey: 'school' },
        { header: 'Роль',
            accessorKey: 'role',
            // Здесь мы добавляем редактируемый элемент
            Cell: ({ cell }: any) => (
                <select
                value={cell.getValue() as string}
                onChange={(e) => updateUser(cell.row.original.id, e.target.value)}
                >
                    {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                    ))}
                </select>
            )
        },
        { header: 'Согласие ПД', accessorKey: 'agreement' },
        { header: 'Дата регистрации', accessorKey: 'currentDate' },
        { header: 'Имя файла наставника', accessorKey: 'file' },
    ];

    const table = useMaterialReactTable({
        columns,
        data: users,
        enableRowSelection: true,
        enableColumnOrdering: true,
        enableGlobalFilter: false,
    });

    return (
        <>
            <MaterialReactTable
                columns={columns}
                data={users}
                renderRowActions={({ row }) => (
                    <Button type="link" onClick={() => handleRowClick(row.original)}>
                        Редактировать
                    </Button>
                )}
            />
            <Modal
                title="Редактирование пользователя"
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setIsModalVisible(false)}>
                        Отмена
                    </Button>,
                    <Button key="save" type="primary" onClick={handleSave}>
                        Сохранить
                    </Button>,
                ]}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="email" label="Email">
                        <Input disabled />
                    </Form.Item>
                    <Form.Item name="name" label="Имя" rules={[{ required: true, message: 'Пожалуйста, введите имя' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="surname" label="Фамилия" rules={[{ required: true, message: 'Пожалуйста, введите фамилию' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="region" label="Регион">
                        <Input />
                    </Form.Item>
                    <Form.Item name="locality" label="Город">
                        <Input />
                    </Form.Item>
                    <Form.Item name="school" label="Школа">
                        <Input />
                    </Form.Item>
                    <Form.Item name="role" label="Роль">
                        <Select>
                            {roles.map(role => (
                                <Select.Option key={role} value={role}>
                                    {role}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}
