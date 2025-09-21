import React, { useEffect, useState } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import axios from 'axios';
import { saveAs } from 'file-saver'; // установи пакет через npm i file-saver

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

interface UsersTableProps {
  emailFilter?: string | null;
}

const roles = ['админ', 'участник', 'наставник', '?наставник', 'модератор'];

export const UsersTable: React.FC<UsersTableProps> = ({ emailFilter }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

    // Вынес функция сюда, в тело компонента
    const fetchUsers = async () => {
        try {
            const response = await axios.get(`http://1180973-cr87650.tw1.ru/api/users`);
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
    if (emailFilter) {
        setFilteredUsers(users.filter(user => user.email === emailFilter));
    } else {
        setFilteredUsers(users);
    }
    }, [emailFilter, users]);

    const handleDelete = async (userId: number) => {
        const confirmDelete = window.confirm('Вы точно уверены, что хотите удалить пользователя?');

        if (!confirmDelete) return;

        try {
            await axios.delete(`http://1180973-cr87650.tw1.ru/api/users/${userId}`);
            setUsers(prev => prev.filter(user => user.id !== userId));
            alert('Пользователь успешно удалён');
        } catch (error) {
            console.error('Ошибка при удалении пользователя:', error);
            alert('Ошибка при удалении пользователя');
        }
    };
    
    const updateUser = async (userId: number, updateData: Partial<User>) => {
        setUsers(prevUsers =>
            prevUsers.map(user =>
                user.id === userId ? { ...user, ...updateData } : user
            )
        );

        try {
            await axios.put(`http://1180973-cr87650.tw1.ru/api/users/${userId}`, updateData);
            alert('Данные пользователя успешно обновлены');
            fetchUsers();
        } catch (error) {
            console.error('Ошибка обновления пользователя:', error);
            alert('Ошибка при обновлении');
        }
    };

    // Фильтруем users по email, если есть фильтр
    useEffect(() => {
    const fetchFilteredUsers = async () => {
        try {
        const url = emailFilter
            ? `http://1180973-cr87650.tw1.ru/api/users?email=${encodeURIComponent(emailFilter)}`
            : `http://1180973-cr87650.tw1.ru/api/users`;
        const response = await axios.get(url);
        setUsers(response.data);
        } catch (error) {
        console.error('Error fetching users:', error);
        }
    };
    fetchFilteredUsers();
    }, [emailFilter]);

    const dataToShow = users; 

    const columns = [
        { 
            header: 'Действия', 
            id: 'actions',
            Cell: ({ row }: any) => (
                <button
                onClick={() => handleDelete(row.original.id)}
                style={{
                    backgroundColor: 'red',
                    color: 'white',
                    padding: '5px 10px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
                >
                Удалить
                </button>
            )
        },
        { header: 'ID', accessorKey: 'id' },
        { header: 'Email', accessorKey: 'email', enableColumnFilter: true },
        {
            header: 'Пароль',
            accessorKey: 'password',
            Cell: ({ cell }: any) => {
                const [password, setPassword] = useState(cell.getValue() as string);

                const handleBlur = () => {
                if (password !== cell.getValue()) {
                    updateUser(cell.row.original.id, { password }); // Отправляем только при изменении
                }
                };

                return (
                <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={handleBlur}
                    style={{ width: '100%' }}
                />
                );
            }
        },
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
                onChange={(e) => updateUser(cell.row.original.id, { role: e.target.value })}
                >
                    {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                    ))}
                </select>
            )
        },
        { header: 'Согласие ПД', accessorKey: 'agreement' },
        { header: 'Дата регистрации', accessorKey: 'currentDate' },
        { 
            header: 'Файл наставника',
            accessorKey: 'file',
            Cell: ({ cell }: any) => {
                const fileName = cell.getValue() as string;

                if (!fileName) return <span>Нет файла</span>;

                return (
                <a
                    href={`http://1180973-cr87650.tw1.ru/uploads/mentorsRequest/${fileName}`}
                    download={fileName}
                >
                    <button
                    style={{
                        padding: '5px 10px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                    >
                    Скачать
                    </button>
                </a>
                );
            } 
        },
    ];

    const table = useMaterialReactTable({
        columns,
        data: filteredUsers,
        enableRowSelection: true,
        enableColumnOrdering: true,
        enableGlobalFilter: false,
    });

    // Функция для преобразования данных в CSV
    const convertToCSV = (data: User[]) => {
        const header = [
        'ID', 'Email', 'Пароль', 'Имя', 'Фамилия', 'Регион', 
        'Город', 'Школа', 'Роль', 'Согласие ПД', 'Дата регистрации', 'Имя файла наставника'
        ];
        const rows = data.map(user => [
        user.id, user.email, user.password, user.name, user.surname, user.region,
        user.localty, user.school, user.role, user.agreement, user.currentDate, user.file
        ]);

        const csvContent =
        [header, ...rows]
            .map(e => e.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(','))
            .join('\n');

        return csvContent;
    };

    // Обработчик клика по кнопке
    const handleDownload = () => {
        // ВАЖНО: скачать именно все данные из БД, а не отфильтрованные на клиенте
        axios.get('http://1180973-cr87650.tw1.ru/api/users') // без фильтра, все данные
        .then(response => {
            const csv = convertToCSV(response.data);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, 'users_export.csv');
        })
        .catch(err => {
            alert('Ошибка при скачивании данных');
            console.error(err);
        });
    };

    return (
        <>
            <button
                style={{
                    marginBottom: '20px',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#EF3124',
                    color: 'white',
                    cursor: 'pointer'
                }}
                onClick={handleDownload}
            >
                Скачать все данные (CSV)
            </button>

            <MaterialReactTable
                table={table}
            />
        </>
    )
}
