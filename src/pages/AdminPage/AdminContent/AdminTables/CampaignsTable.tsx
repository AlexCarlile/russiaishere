import React, { useEffect, useState } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import axios from 'axios';
import { InputChange } from '../../../../components';

interface Campaigns {
    id: number;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    created_by: string;
    image_path: string;
    approval_status: string;
}

const status = ['Да', 'Нет', 'Доработка'];

export const CampaignsTable: React.FC = () => {
    const [campaigns, setCampaigns] = useState<Campaigns[]>([]);
    const [statuses, setStatus] = useState<string>();

    const fetchCampaigns = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:5000/api/admin_campaigns');
            setCampaigns(response.data);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    
    const updateCampaigns = async (
        campaignId: number, 
        newStatus: string, 
        newTitle: string,
        newDescription: string,
    ) => {
        try {
            const data: any = { 
                title: newTitle,
                approval_status: newStatus,
                description: newDescription,
             }; // Объект для обновления

            await axios.put(`http://127.0.0.1:5000/api/campaigns/${campaignId}`, data);
            
            setCampaigns(prevCampaigns => 
                prevCampaigns.map(campaign => 
                    campaign.id === campaignId ? { ...campaign, titlele: newTitle, description: newDescription, approval_status: newStatus} : campaign
                )
            );
            alert('Данные акции успешно обновлены');
        } catch (error) {
            console.error('Error updating campaigns:', error);
        }
    };

    const columns = [
        { header: 'ID', accessorKey: 'id' },
        { header: 'Название акции', accessorKey: 'title',
            Cell: ({ cell }: any) => (
                <InputChange 
                initialValue={cell.getValue() as string} 
                onUpdate={(newTitle: string) => 
                    updateCampaigns(cell.row.original.id, cell.row.original.approval_status, newTitle, cell.row.original.description)} 
                />
            )
        },
        { header: 'Описание акци', accessorKey: 'description',
            Cell: ({ cell }: any) => (
                <InputChange 
                initialValue={cell.getValue() as string} 
                onUpdate={(newDescription: string) => 
                    updateCampaigns(cell.row.original.id, cell.row.original.approval_status, cell.row.original.title, newDescription)} 
                />
            )
         },
        { header: 'Дата начала', accessorKey: 'start_date' },
        { header: 'Дата конца', accessorKey: 'end_date' },
        { header: 'Создатель', accessorKey: 'created_by' },
        { header: 'Изображение', accessorKey: 'image_path' },
        { header: 'Согласование',
            accessorKey: 'approval_status',
            // Здесь мы добавляем редактируемый элемент
            Cell: ({ cell }: any) => (
                <select
                value={cell.getValue() as string}
                onChange={(e) => updateCampaigns(cell.row.original.id, e.target.value, cell.row.original.title, cell.row.original.description)}
                >
                    {status.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            )
        },
    ];

    const table = useMaterialReactTable({
        columns,
        data: campaigns,
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
