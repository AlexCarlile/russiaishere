import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MaterialReactTable, useMaterialReactTable, MRT_Row  } from 'material-react-table';
import axios from 'axios';
import { MRT_ColumnDef } from 'material-react-table';
import { saveAs } from 'file-saver';

interface Project {
    id: number;
    project_code: string;
    title: string;
    description: string;
    status: string;
    campaign_id: number;
    team_id: number;
    answers: object;
    file?: string; 
    file_design?: string;
}

interface Campaign {
    id: number;
    title: string;
    // другие поля не обязательны
}

const winnerOptions = ['yes', 'no', 'InProcess']; // Пример статусов, замени на свои
const statusOptions = ['yes', 'no', 'InProcess', 'comment']; // 👈 Добавили 'comment'

export const ProjectsTable = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [uploadingId, setUploadingId] = useState<number | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const fetchProjects = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:5000/api/projects');
            setProjects(response.data);
        } catch (error) {
            console.error('Ошибка при загрузке акций:', error); 
        }

        try {
            const response = await axios.get('http://127.0.0.1:5000/api/campaigns');
            setCampaigns(response.data);
        } catch (error) {
            console.error('Ошибка при загрузке акций:', error);
        }
    };

    const handleUploadDesign = async (projectId: number, file: File) => {
        const formData = new FormData();
        formData.append('project_id', projectId.toString());
        formData.append('file', file);

        try {
            const res = await axios.post('http://127.0.0.1:5000/api/projects/upload-design', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Файл успешно загружен');
            // Можно обновить состояние проекта с новым URL
            setProjects(prev => 
                prev.map(p => 
                    p.id === projectId ? { ...p, file_design: res.data.file_url } : p
                )
            );
        } catch (error) {
            console.error(error);
            alert('Ошибка загрузки файла');
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    // Функция для обновления статуса статуса победителя
    const updateStatus = async (id: number, newStatus: string) => {
        try {
            await axios.put(`http://127.0.0.1:5000/api/projects/${id}`, {
                description: newStatus,  // правильное имя поля
            });

            alert('Статус победителя успешно обновлён');

            setProjects((prev) =>
                prev.map((p) =>
                    p.id === id ? { ...p, description: newStatus } : p
                )
            );
        } catch (error) {
            console.error('Ошибка обновления статуса:', error);
            alert('Ошибка при обновлении статуса');
        }
    };

    const updateStatusField = async (id: number, newStatus: string) => {
        try {
            await axios.put(`http://127.0.0.1:5000/api/projects/${id}`, {
                status: newStatus,  // 👈 здесь именно статус
            });

            alert('Статус отправки успешно обновлён');

            setProjects((prev) =>
                prev.map((p) =>
                    p.id === id ? { ...p, status: newStatus } : p
                )
            );
        } catch (error) {
            console.error('Ошибка обновления статуса:', error);
            alert('Ошибка при обновлении статуса');
        }
    };

    const campaignMap = Object.fromEntries(campaigns.map(c => [c.id, c.title]));

    const columns: MRT_ColumnDef<Project>[] = [
        { header: 'ID', accessorKey: 'id' },
        { header: 'Код проекта', accessorKey: 'project_code' },
        { header: 'Название команды', accessorKey: 'title' },
        {
            header: 'Название акции',
            accessorKey: 'campaign_id', // можно оставить, чтобы сортировка/фильтрация работала
            Cell: ({ row }) => {
                const campaignId = row.original.campaign_id;
                const title = campaignMap[campaignId] || '—';
                return <span>{title}</span>;
            }
        },
        // { header: 'ID Команды', accessorKey: 'team_id' },
        {
            header: 'Ответы',
            Cell: ({ row }) => {
                const teamId = row.original.team_id;
                return (
                    <Link to={`/projects/${teamId}`} style={{ color: '#007bff', textDecoration: 'underline' }}>
                        Посмотреть
                    </Link>
                );
            }
        },
        {
            header: 'Статус отправки',
            accessorKey: 'status',
            Cell: ({ cell, row }: any) => {
                const currentStatus = cell.getValue();
                const id = row.original.id;

                const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
                    const newStatus = e.target.value;
                    updateStatusField(id, newStatus);
                };

                return (
                    <select value={currentStatus} onChange={handleChange}>
                        {statusOptions.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                );
            }
        },
        {
            header: 'Победитель',
            accessorKey: 'description',
            Cell: ({ cell, row }: any) => {
                const currentStatus = cell.getValue();
                const id = row.original.id;

                const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
                    const newStatus = e.target.value;
                    updateStatus(id, newStatus);
                };

                return (
                    <select value={currentStatus} onChange={handleChange}>
                        {winnerOptions.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                );
            }
        },
        {
            header: 'Изображение',
            accessorKey: 'file',
            Cell: ({ row }) => {
                const fileName = row.original.file;

                if (!fileName) return null;

                const fullUrl = fileName.startsWith('http')
                ? fileName
                : `http://127.0.0.1:5000/uploads/project_files/${fileName}`;

                return fileName ? (
                <img
                    src={fullUrl}
                    alt="News"
                    style={{ width: 50, height: 50, objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => {
                        if (fullUrl) setSelectedImage(fullUrl);
                    }}
                />
                ) : null;
            },
        },
        {
            header: 'Изображение в дизайне',
            accessorKey: 'file_design',
            Cell: ({ row }) => {
                const project = row.original;
                const fileName = project.file_design; // используем отдельное поле для дизайна

                const fullUrl = fileName
                    ? fileName.startsWith('http')
                        ? fileName
                        : `http://127.0.0.1:5000/uploads/project_files_design/${fileName}`
                    : null;

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        {/* Превью изображения */}
                        {fullUrl ? (
                            <img
                            src={fullUrl}
                            alt="Design"
                            style={{ width: 50, height: 50, objectFit: 'cover', cursor: 'pointer' }}
                            onClick={() => setSelectedImage(fullUrl)}
                            />
                        ) : (
                            <div
                            style={{
                                width: 50,
                                height: 50,
                                backgroundColor: '#f0f0f0',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: 4,
                                fontSize: 10,
                                color: '#555',
                            }}
                            >
                            Design
                            </div>
                        )}

                        {/* Название текущего файла */}
                        {fileName && <span style={{ fontSize: 10 }}>{fileName}</span>}

                        {/* Кнопка выбора нового файла */}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadDesign(project.id, file);
                            }}
                        />
                    </div>
                );
            },
        }
    ];

    const table = useMaterialReactTable<Project>({
        columns,
        data: projects,
        enableRowSelection: true,
        enableColumnOrdering: true,
        enableGlobalFilter: false,
    });

    // Функция для форматирования поля answers в удобочитаемый текст
    const formatAnswers = (answersRaw: any): string => {
    if (!answersRaw) return '';

    let answersObj;
    try {
        if (typeof answersRaw === 'string') {
        answersObj = JSON.parse(answersRaw);
        } else {
        answersObj = answersRaw;
        }
    } catch {
        return 'Неверный формат JSON';
    }

    const parts: string[] = [];

    // Пример: раскрываем 2 уровня вложенности
    for (const sectionKey in answersObj) {
        if (!answersObj.hasOwnProperty(sectionKey)) continue;
        const section = answersObj[sectionKey];
        if (typeof section === 'object' && section !== null) {
        for (const key in section) {
            if (section.hasOwnProperty(key)) {
            const value = section[key];
            parts.push(`${sectionKey}.${key}: ${value}`);
            }
        }
        } else {
        parts.push(`${sectionKey}: ${section}`);
        }
    }

    return parts.join('; ');
    };


    const convertToCSV = (data: Project[], campaignsMap: Record<number, string>) => {
    const header = ['ID', 'Код проекта', 'Название команды', 'Название акции', 'Победитель', 'Ответы'];
    const rows = data.map(p => [
        p.id,
        p.project_code,
        p.title,
        campaignsMap[p.campaign_id] ?? '—',
        p.description,
        formatAnswers(p.answers),
    ]);

    return [header, ...rows]
        .map(row =>
        row
            .map(value => `"${(value ?? '').toString().replace(/"/g, '""')}"`)
            .join(',')
        )
        .join('\n');
    };

    // Обработчик скачивания CSV с актуальными данными
    const handleDownload = async () => {
      try {
        const [projectsRes, campaignsRes] = await Promise.all([
          axios.get('http://127.0.0.1:5000/api/projects'),
          axios.get('http://127.0.0.1:5000/api/campaigns'),
        ]);
        const projectsData: Project[] = projectsRes.data;
        const campaignsData: Campaign[] = campaignsRes.data;
        const campaignsMap = Object.fromEntries(campaignsData.map(c => [c.id, c.title]));

        const csv = convertToCSV(projectsData, campaignsMap);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'projects_export.csv');
      } catch (error) {
        alert('Ошибка при скачивании данных');
        console.error(error);
      }
    };

    

    return (
        <div>
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
            <MaterialReactTable table={table} />

            {/* Модалка с картинкой */}
            {selectedImage && (
                <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                }}
                onClick={() => setSelectedImage(null)}
                >
                <div style={{ position: 'relative' }}>
                    <img
                    src={selectedImage}
                    alt="Full view"
                    style={{ maxHeight: '80vh', maxWidth: '90vw', borderRadius: '8px' }}
                    />
                    <a
                    href={selectedImage}
                    download
                    style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        backgroundColor: 'white',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        color: 'black',
                        fontWeight: 'bold',
                    }}
                    onClick={(e) => e.stopPropagation()}
                    >
                    Скачать
                    </a>
                </div>
                </div>
            )}
        </div>
    );
};
