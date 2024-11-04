import React, { useEffect, useState } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import axios from 'axios';
import { InputChange } from '../../../../components';

interface Projects {
    id: number;
    project_code: number;
    title: string;
    description: string;
    campaign_id: number;
    team_id: number;
}

const status = ['Да', 'Нет', 'Доработка'];

export const ProjectsTable: React.FC = () => {
    const [title, setTitle] = useState<string>();
    const [projects, setProjects] = useState<Projects[]>([]);

    const fetchProjects = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:5000/api/projects');
            setProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    
    const updateProjects = async (projectId: number, newTitle: string) => {
        try {
            const data: any = { title: newTitle }; // Объект для обновления
            
            await axios.put(`http://127.0.0.1:5000/api/projects/${projectId}`, data);
            
            setProjects(prevProjects => 
                prevProjects.map(project => 
                    project.id === projectId ? { ...project, approval_status: newTitle} : project
                )
            );
            alert('Данные проекта успешно обновлены');
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    const columns = [
        { header: 'ID', accessorKey: 'id' },
        { header: 'Код-приглашения', accessorKey: 'project_code' },
        { header: 'Название команды', accessorKey: 'title',
            Cell: ({ cell }: any) => (
                <InputChange 
                    initialValue={cell.getValue() as string} 
                    onUpdate={(newTitle) => updateProjects(cell.row.original.id, newTitle)} 
                />
            )
        },
        { header: 'ID акции', accessorKey: 'campaign_id' },
        { header: 'ID команды', accessorKey: 'team_id' },
    ];

    const table = useMaterialReactTable({
        columns,
        data: projects,
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
