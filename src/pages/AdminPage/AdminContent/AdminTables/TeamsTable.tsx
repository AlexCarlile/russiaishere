import React, { useEffect, useState } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import axios from 'axios';
import { saveAs } from 'file-saver';

interface Team {
    id: number;
    name: string;
    campaign_id: number;
    created_by: string;
    members?: string[];
    campaign_title?: string; // ← Добавляем сюда
}

interface TeamMember {
    team_id: number;
    user_id: number;
    name: string;
    surname: string;
    campaign_id: number;
}

interface Campaign {
    id: number;
    title: string;
}

export const TeamsTable = () => {
    const [teams, setTeams] = useState<Team[]>([]);

    const fetchData = async () => {
        try {
            const [teamsRes, membersRes, campaignsRes] = await Promise.all([
                axios.get('http://127.0.0.1:5000/api/teams'),
                axios.get('http://127.0.0.1:5000/api/team_members'),
                axios.get('http://127.0.0.1:5000/api/campaigns'),
            ]);

            const teams: Team[] = teamsRes.data;
            const members: TeamMember[] = membersRes.data;
            const campaigns: Campaign[] = campaignsRes.data;

            // Создаём map: campaign_id → title
            const campaignMap: Record<number, string> = {};
            campaigns.forEach(c => {
                campaignMap[c.id] = c.title;
            });

            // Объединяем все данные
            const teamMap = teams.map(team => {
                const teamMembers = members.filter(m => m.team_id === team.id);
                return {
                    ...team,
                    members: teamMembers.map(m => `${m.name} ${m.surname}`),
                    campaign_title: campaignMap[team.campaign_id] || 'Неизвестно',
                };
            });

            setTeams(teamMap);

        } catch (error) {
            console.error('Ошибка при загрузке данных:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const columns = [
        { header: 'ID', accessorKey: 'id' },
        { header: 'Название команды', accessorKey: 'name' },
        { header: 'Акция', accessorKey: 'campaign_title' }, // ← Используем название
        { header: 'Создатель команды', accessorKey: 'created_by' },
        {
            header: 'Участники',
            accessorKey: 'members',
            Cell: ({ cell }: any) => (
                <div>{(cell.getValue() as string[]).join(', ')}</div>
            ),
        },
    ];

    const table = useMaterialReactTable({
        columns,
        data: teams,
        enableRowSelection: true,
        enableColumnOrdering: true,
        enableGlobalFilter: false,
    });

    // Функция конвертации в CSV
    const convertToCSV = (data: Team[]) => {
        const header = ['ID', 'Название команды', 'Акция', 'Создатель команды', 'Участники'];
        const rows = data.map(t => [
        t.id,
        t.name,
        t.campaign_title,
        t.created_by,
        (t.members ?? []).join('; '),
        ]);

        return [header, ...rows]
        .map(row =>
            row
            .map(value => `"${(value ?? '').toString().replace(/"/g, '""')}"`)
            .join(',')
        )
        .join('\n');
    };

    // Обработчик скачивания CSV
    const handleDownload = () => {
        // Для актуальных данных можно повторно запросить, если нужно:
        axios.get('http://127.0.0.1:5000/api/teams')
        .then((teamsRes) => {
            axios.get('http://127.0.0.1:5000/api/team_members').then((membersRes) => {
            axios.get('http://127.0.0.1:5000/api/campaigns').then((campaignsRes) => {
                const teamsData: Team[] = teamsRes.data;
                const membersData: TeamMember[] = membersRes.data;
                const campaignsData: Campaign[] = campaignsRes.data;

                const campaignMap: Record<number, string> = {};
                campaignsData.forEach(c => {
                campaignMap[c.id] = c.title;
                });

                const teamMap = teamsData.map(team => {
                const teamMembers = membersData.filter(m => m.team_id === team.id);
                return {
                    ...team,
                    members: teamMembers.map(m => `${m.name} ${m.surname}`),
                    campaign_title: campaignMap[team.campaign_id] || 'Неизвестно',
                };
                });

                const csv = convertToCSV(teamMap);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                saveAs(blob, 'teams_export.csv');
            });
            });
        })
        .catch(err => {
            alert('Ошибка при скачивании данных');
            console.error(err);
        });
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
        </div>
    );
};
