import React, { useEffect, useState } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
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
        enableRowSelection: true, //enable some features
        enableColumnOrdering: true, //enable a feature for all columns
        enableGlobalFilter: false, //turn off a feature
    })

    return (
        <MaterialReactTable
            table={table}
        />
    )
}
