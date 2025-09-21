import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal, Button, message, DatePicker } from 'antd';
import { MaterialReactTable, useMaterialReactTable, MRT_ColumnDef } from 'material-react-table';
import axios from 'axios';
import { Editor } from '@tinymce/tinymce-react';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';

interface NewsItem {
  id: number;
  title: string;
  text: string;
  date: string;
  file: string;
  status: string;
}

const statusOptions = ['yes', 'no', 'archived'];

export const NewsTable = () => {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [selectedTextId, setSelectedTextId] = useState<number | null>(null);
  const [editorValue, setEditorValue] = useState<string>('');

  const fetchNews = async () => {
    try {
      const response = await axios.get('http://1180973-cr87650.tw1.ru/api/news');
      setNewsList(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке новостей:', error);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const updateText = async () => {
    if (selectedTextId === null) return;

    try {
      await axios.put(`http://1180973-cr87650.tw1.ru/api/news/${selectedTextId}`, {
        text: editorValue,
      });
      message.success('Текст обновлен');
      setIsEditorVisible(false);
      setSelectedTextId(null);
      setEditorValue('');
      fetchNews(); // перезагрузка данных
    } catch (e) {
      console.error(e);
      message.error('Ошибка при обновлении текста');
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await axios.put(`http://1180973-cr87650.tw1.ru/api/news/${id}`, { status: newStatus });
      setNewsList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: newStatus } : n))
      );
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    }
  };

  const updateField = async (id: number, field: 'title' | 'date', value: string) => {
    try {
      await axios.put(`http://1180973-cr87650.tw1.ru/api/news/${id}`, {
        [field]: value,
      });
      message.success(`Поле "${field}" обновлено`);
      setNewsList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, [field]: value } : n))
      );
    } catch (err) {
      console.error(err);
      message.error(`Ошибка при обновлении поля "${field}"`);
    }
  };


  function truncateHtml(html: string, maxLength: number): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
  }

    const stripHtml = (html: string): string => {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    };

    const convertToCSV = (data: any[]) => {
        const header = ['ID', 'Заголовок', 'Описание', 'Дата', 'Файл', 'Статус'];

        const rows = data.map((n) => [
            n.id,
            n.title,
            // n.text,
            stripHtml(n.text), // ✅ это правильное поле
            dayjs(n.date).format('DD.MM.YYYY'),
            n.file,
            n.status,
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


    const handleDownload = async () => {
        try {
            const response = await axios.get('http://1180973-cr87650.tw1.ru/api/news');
            const csv = convertToCSV(response.data);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, 'news_export.csv');
        } catch (err) {
            console.error('Ошибка при скачивании CSV:', err);
            alert('Ошибка при скачивании данных');
        }
    };

  const columns: MRT_ColumnDef<NewsItem>[] = [
    { header: 'ID', accessorKey: 'id' },
    {
      header: 'Заголовок',
      accessorKey: 'title',
      Cell: ({ row }) => {
        const { id, title } = row.original;
        return (
          <input
            type="text"
            defaultValue={title}
            onBlur={(e) => {
              const newValue = e.target.value.trim();
              if (newValue && newValue !== title) {
                updateField(id, 'title', newValue);
              }
            }}
            style={{ width: '100%', border: '1px solid #ccc', padding: '4px' }}
          />
        );
      },
    },
    {
      header: 'Текст',
      accessorKey: 'text',
      Cell: ({ cell, row }) => {
        const rawHtml = cell.getValue() as string;

        const handleClick = () => {
          setSelectedTextId(row.original.id);
          setEditorValue(rawHtml); // для TinyMCE
          setIsEditorVisible(true);
        };

        return (
          <div
            onClick={handleClick}
            style={{
              maxHeight: '100px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer',
              color: '#007bff',
            }}
            title="Нажмите для редактирования текста"
          >
            <div dangerouslySetInnerHTML={{ __html: truncateHtml(rawHtml, 200) }} />
          </div>
        );
      },
    },
    {
      header: 'Дата',
      accessorKey: 'date',
      Cell: ({ row }) => {
        const { id, date } = row.original;
        const current = dayjs(date);

        const handleChange = (newDate: dayjs.Dayjs | null) => {
          if (!newDate) return;
          const formatted = newDate.format('YYYY-MM-DD');
          if (formatted !== current.format('YYYY-MM-DD')) {
            updateField(id, 'date', formatted);
          }
        };

        return (
          <DatePicker
            value={current}
            onChange={handleChange}
            format="DD.MM.YYYY"
            style={{ width: '100%' }}
          />
        );
      },
    },
    {
      header: 'Изображение',
      accessorKey: 'file',
      Cell: ({ row }) => {
        const fileName = row.original.file;
        const fullUrl = fileName
          ? `http://1180973-cr87650.tw1.ru/uploads/news/${fileName}`
          : null;

        const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;

          const formData = new FormData();
          formData.append('file', file);

          try {
            await axios.put(
              `http://1180973-cr87650.tw1.ru/api/news/${row.original.id}`,
              formData,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            message.success('Изображение обновлено');
            fetchNews(); // обновить таблицу
          } catch (err) {
            console.error(err);
            message.error('Ошибка при обновлении изображения');
          }
        };

        return (
          <div>
            {fullUrl && (
              <img
                src={fullUrl}
                alt="News"
                style={{ width: 50, height: 50, objectFit: 'cover', display: 'block', marginBottom: 5 }}
                onClick={() => setSelectedImage(fullUrl)}
              />
            )}
            <input type="file" onChange={handleFileChange} />
          </div>
        );
      },
    },
    {
      header: 'Статус',
      accessorKey: 'status',
      Cell: ({ cell, row }) => {
        const currentStatus = cell.getValue() as string;
        const id = row.original.id;

        return (
          <select value={currentStatus} onChange={(e) => updateStatus(id, e.target.value)}>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      header: 'Ссылка',
      Cell: ({ row }) => {
        const newsId = row.original.id;
        return (
          <Link to={`/news/${newsId}`} style={{ color: '#007bff', textDecoration: 'underline' }}>
            Посмотреть
          </Link>
        );
      },
    },
  ];

  const table = useMaterialReactTable<NewsItem>({
    columns,
    data: newsList,
    enableColumnOrdering: true,
    enableRowSelection: false,
    enableGlobalFilter: true,
  });

  return (
    <div>
        <h2>Новости</h2>
        <button
            onClick={handleDownload}
            style={{
                marginBottom: '20px',
                padding: '10px 20px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#EF3124',
                color: 'white',
                cursor: 'pointer'
            }}
        >
            Скачать все данные (CSV)
        </button>

      <MaterialReactTable table={table} />

      {/* Модалка для TinyMCE */}
      <Modal
        open={isEditorVisible}
        onCancel={() => setIsEditorVisible(false)}
        onOk={updateText}
        title="Редактирование текста"
        okText="Сохранить"
        cancelText="Отмена"
        width={800}
      >
        <Editor
          apiKey="2wipstahrgtynu4shamlfgkz7l9b0jtzt6h0g5d0sxh89vn9"
          value={editorValue}
          onEditorChange={(content: string) => setEditorValue(content)}
          init={{
            height: 400,
            menubar: false,
            plugins: 'link image code lists',
            toolbar:
              'undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | code',
          }}
        />
      </Modal>

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
