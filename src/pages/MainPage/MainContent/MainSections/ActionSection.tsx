import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MaterialReactTable, useMaterialReactTable, MRT_ColumnDef } from 'material-react-table';
import axios from 'axios';
import { Map } from './Map';
import './MainSection.css';

interface Winner {
  project_id: number;  
  campaign_id: number;
  campaign_title: string;
  team_name: string;
  region: string;
  members: string[];
  project_file: string | null;
  project_design: string | null;
}

export const ActionSection = () => {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/api/winners')
      .then(res => setWinners(res.data))
      .catch(err => console.error(err));
  }, []);

  const columns: MRT_ColumnDef<Winner>[] = [
    { 
      header: 'Акция',
      accessorKey: 'campaign_title',
      Cell: ({ row }) => {
        const { campaign_id, campaign_title } = row.original;
        return (
          <Link to={`/actions/${campaign_id}`} style={{ color: '#007bff', textDecoration: 'underline' }}>
            {campaign_title}
          </Link>
        );
      }  
    },
    { 
      header: 'Команда победитель',
      accessorKey: 'team_name',
      Cell: ({ row }) => {
        const { project_id, team_name } = row.original;
        return (
          <Link
            to={`/projects/winners/${project_id}`} 
            style={{ color: '#007bff', textDecoration: 'underline' }}
          >
            {team_name}
          </Link>
        );
      },
    },
    {
      header: 'Участники команды',
      accessorKey: 'members',
      Cell: ({ cell }) => (cell.getValue<string[]>() || []).join(', ')
    },
    { header: 'Регион', accessorKey: 'region' },
    {
      header: 'Изображение проекта',
      accessorKey: 'project_file',
      Cell: ({ cell }) => {
        const file = cell.getValue<string | null>();
        if (!file) return 'Нет изображения';
        const url = `http://127.0.0.1:5000/uploads/project_files/${file}`;
        return (
          <img
            src={url}
            alt="Проект"
            style={{ width: 80, height: 80, objectFit: 'cover', cursor: 'pointer' }}
            onClick={() => setSelectedImage(url)}
          />
        );
      }
    },
    {
      header: 'Отрисованное изображение',
      accessorKey: 'project_design',
      Cell: ({ cell }) => {
        const design = cell.getValue<string | null>();
        if (!design) return <i>Здесь скоро появится изображение от художника!</i>;

        const url = design.startsWith('http')
          ? design
          : `http://127.0.0.1:5000/uploads/project_files_design/${design}`;

        return (
          <img
            src={url}
            alt="Дизайн"
            style={{ width: 80, height: 80, objectFit: 'cover', cursor: 'pointer' }}
            onClick={() => setSelectedImage(url)}
          />
        );
      }
    }
  ];

  const table = useMaterialReactTable<Winner>({
    columns,
    data: winners,
    enableRowSelection: false,
    enableSorting: true,
    enableGlobalFilter: true,
    enableFilters: true,
    enablePagination: true,
    enableColumnActions: false,
    enableColumnOrdering: false,
    enableDensityToggle: false,
    enableHiding: false,
    // горизонтальный скролл для маленьких экранов
    muiTableContainerProps: {
      sx: {
        maxWidth: '100%',
        overflowX: 'auto',
      },
    },
    // скрытие колонок на маленьких экранах
    displayColumnDefOptions: {
      'mrt-row-actions': {
        muiTableHeadCellProps: {
          sx: { display: { xs: 'none', sm: 'table-cell' } },
        },
      },
    },
    initialState: {
      columnVisibility: {
        // скрываем некоторые колонки на мобильных
        region: window.innerWidth < 768 ? false : true,
        members: window.innerWidth < 768 ? false : true,
      },
    },
  });

  return (
    <section className="action-section">
      <h2 className="action-title" style={{textAlign: 'center'}}>Присоединяйтесь к команде, участвуйте в акции и занимайте призовые места!</h2>
      <div className="map-container">
        <Map />
      </div>
      <h2 className="action-title"style={{textAlign: 'center'}}>⭐Победители акций⭐</h2>
      <MaterialReactTable table={table} />

      {/* Модалка с увеличенной картинкой */}
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
    </section>
  );
};
