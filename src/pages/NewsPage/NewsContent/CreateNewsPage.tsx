import React, { useEffect, useState } from 'react';
import { Input, Button, Upload, message, DatePicker, Form } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { Editor } from '@tinymce/tinymce-react';

export const CreateNewsPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<string>('');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

// 🔍 Проверка, что текст не пустой (даже если там пустой HTML)
  const isHtmlEmpty = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.innerText.trim() === '';
  };

    const handleUploadChange = (info: any) => {
    const fileList = info.fileList;
    if (fileList.length > 0) {
        const selectedFile = fileList[0].originFileObj;
        setFile(selectedFile);
        console.log('Файл выбран:', selectedFile);
    } else {
        setFile(null);
    }
    };

  const handleSubmit = async () => {
    if (!title.trim() || !date || !file || isHtmlEmpty(text)) {
    message.error('Пожалуйста, заполните все поля');
    return;
    }
    console.log('Отправка:', {
        title,
        date,
        text,
        file,
        isHtmlEmpty: isHtmlEmpty(text)
    });

    const formData = new FormData();
    formData.append('title', title);
    formData.append('text', text);
    formData.append('date', date);
    formData.append('file', file);

    try {
      setLoading(true);
      await axios.post('http://1180973-cr87650.tw1.ru/api/news/admin', formData);
      message.success('Новость добавлена');
      setTitle('');
      setDate('');
      setText('');
      setFile(null);
    } catch (e) {
      console.error(e);
      message.error('Ошибка при добавлении новости');
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
    console.log('title:', title)
    console.log('text:', text)
    console.log('date:', date)
    console.log('file:', file)
    }, [title, text, date, file]);


  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h2>Создание новости</h2>
      <Form layout="vertical">
        <Form.Item label="Заголовок">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Form.Item>

        <Form.Item label="Дата публикации">
          <DatePicker 
            style={{ width: '100%' }} 
            onChange={(date, dateString) => setDate(dateString as string)} 
            value={date ? dayjs(date) : undefined}
          />
        </Form.Item>

        <Form.Item label="Текст новости">
            <Editor
                apiKey="2wipstahrgtynu4shamlfgkz7l9b0jtzt6h0g5d0sxh89vn9"
                value={text}
                init={{
                    height: 300,
                    menubar: false,
                    plugins: 'link image code lists',
                    toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | bullist numlist | code'
                }}
                onEditorChange={(newValue: string) => setText(newValue)}
            />
        </Form.Item>

        <Form.Item label="Изображение">
            <Upload
                beforeUpload={() => false}
                onChange={handleUploadChange}
                maxCount={1}
                accept="image/*"
                showUploadList={false} // опционально, чтобы не дублировать отображение
            >
                <Button icon={<UploadOutlined />}>Выбрать изображение</Button>
            </Upload>
            {file && <p style={{ marginTop: 8 }}>Выбран файл: {file.name}</p>}
        </Form.Item>

        <Form.Item>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            Сохранить
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
