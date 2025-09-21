import React, { useEffect, useState } from 'react';
import { MaterialReactTable, useMaterialReactTable, MRT_Row  } from 'material-react-table';
import axios from 'axios';
import { saveAs } from 'file-saver';  // <-- импортируем file-saver

interface Campaign {
    id: number;
    title: string;
    description: string;
    full_description: string;
    rules: string;
    start_date: string;
    end_date: string;
    created_by: string;
    image_path: string;
    approval_status: string;
    team_count: number;
}
// ва
interface ActionsTableProps {
  onCreatedByClick?: (email: string) => void;
}

const statusOptions = ['InProcess', 'yes', 'no']; // Пример статусов, замени на свои

export const ActionsTable: React.FC<ActionsTableProps> = ({ onCreatedByClick }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get('http://1180973-cr87650.tw1.ru/api/campaigns');
      setCampaigns(response.data);
        console.log("Данные", response.data)

    } catch (error) {
      console.error('Ошибка при загрузке акций:', error);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Функция для обновления статуса акции
  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await axios.put(`http://1180973-cr87650.tw1.ru/api/campaigns/${id}`, { approval_status: newStatus });
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, approval_status: newStatus } : c))
      );
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      alert('Ошибка при обновлении статуса');
    }
  };

  const columns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Название', accessorKey: 'title' },
    { header: 'Краткое описание', accessorKey: 'description' },
    { header: 'Полное описание', accessorKey: 'full_description' },
    { header: 'Правила', accessorKey: 'rules' },
    { header: 'Дата начала', accessorKey: 'start_date' },
    { header: 'Дата окончания', accessorKey: 'end_date' },

    {
        header: 'Создал (Email)',
        accessorKey: 'created_by',
        Cell: ({ row }: { row: MRT_Row<Campaign> }) => {
            const email = row.original.created_by;
            return (
            <span
                style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                onClick={() => onCreatedByClick && onCreatedByClick(email)}
            >
                {email}
            </span>
            );
        }
    },
    {
        header: 'Изображение',
        accessorKey: 'image_path',
        Cell: ({ cell }: any) => {
            let imagePath = cell.getValue();

            // Если imagePath — не полный URL, а имя файла, соберём полный URL:
            if (imagePath && !imagePath.startsWith('http')) {
                imagePath = `http://127.0.0.1:5000${imagePath}`;
            }

            return imagePath ? (
            <img
                src={imagePath}
                alt="Campaign"
                style={{ width: 50, height: 50, objectFit: 'cover', cursor: 'pointer' }}
                onClick={() => setSelectedImage(imagePath)}
            />
            ) : null;
        }
    },
    {
      header: 'Статус',
      accessorKey: 'approval_status',
      Cell: ({ cell, row }: any) => {
        const currentStatus = cell.getValue();
        const id = row.original.id;

        const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
          const newStatus = e.target.value;
          updateStatus(id, newStatus);
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
    { header: 'Кол-во команд', accessorKey: 'team_count' }
  ];

  const table = useMaterialReactTable({
    columns,
    data: campaigns,
    enableRowSelection: true,
    enableColumnOrdering: true,
    enableGlobalFilter: false,
  });

  // --- Функция для конвертации данных в CSV ---
  const convertToCSV = (data: Campaign[]) => {
    const header = [
      'ID',
      'Название',
      'Краткое описание',
      'Полное описание',
      'Правила',
      'Дата начала',
      'Дата окончания',
      'Создал (Email)',
      'Путь к изображению',
      'Статус',
      'Количество команд',
    ];

    const rows = data.map((c) => [
      c.id,
      c.title,
      c.description,
      c.full_description,
      c.rules,
      c.start_date,
      c.end_date,
      c.created_by,
      c.image_path,
      c.approval_status,
      c.team_count,
    ]);

    const csvContent = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${(value ?? '').toString().replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    return csvContent;
  };

  // --- Обработчик скачивания CSV ---
  const handleDownload = () => {
    // Получаем все данные с сервера, чтобы скачать именно актуальный полный список
    axios
      .get('http://1180973-cr87650.tw1.ru/api/campaigns')
      .then((response) => {
        const csv = convertToCSV(response.data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'campaigns_export.csv');
      })
      .catch((err) => {
        alert('Ошибка при скачивании данных');
        console.error(err);
      });
  };

  return (
    <div>
      {/* Кнопка скачивания CSV */}
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

      {/* Модальное окно для изображения */}
      {selectedImage && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
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
                fontWeight: 'bold'
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