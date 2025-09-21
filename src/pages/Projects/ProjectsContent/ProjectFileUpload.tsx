import React, { useState, useEffect, useImperativeHandle, forwardRef  } from "react";
import { Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile, RcFile } from "antd/es/upload/interface";
import axios from "axios";
import Cookies from "js-cookie";

interface ProjectFileUploadProps {
  teamId: string;
  disabled?: boolean;
  onFileUploaded?: (filename: string, fileUrl: string) => void;
}

export interface ProjectFileUploadRef {
  handleUpload: () => Promise<void>;
}

const ProjectFileUpload = forwardRef<ProjectFileUploadRef, ProjectFileUploadProps>(
  ({ teamId, disabled, onFileUploaded }, ref) => {
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [existingFile, setExistingFile] = useState<{ filename: string; file_url: string } | null>(null);
    
    useEffect(() => {
        const fetchExistingFile = async () => {
            try {
            const token = Cookies.get("token");
            const response = await axios.get(`http://1180973-cr87650.tw1.ru/get_project_file`, {
                params: { team_id: teamId },
                headers: {
                Authorization: `Bearer ${token}`,
                },
            });

            if (response.data?.file_url && response.data?.filename) {
                setExistingFile({
                filename: response.data.filename,
                file_url: response.data.file_url,
                });

                // Также показать его в Upload как уже "загруженный"
                setFileList([
                {
                    uid: "-1",
                    name: response.data.filename,
                    status: "done",
                    url: response.data.file_url,
                },
                ]);
            }
            } catch (error) {
            console.error("Ошибка при получении файла проекта", error);
            }
        };

        fetchExistingFile();
    }, [teamId]);

    // Загружать файл вручную, отменяем автозагрузку
    const beforeUpload = (file: RcFile) => {
        setFileList([
            {
            uid: file.uid,
            name: file.name,
            status: "uploading", // или "done", но "ready" нельзя
            originFileObj: file,
            },
        ]);
        return false;
        };

    // При выборе файла обновляем список
    const handleChange = ({ fileList }: { fileList: UploadFile[] }) => {
        setFileList(fileList);
    };

    // Обработчик нажатия кнопки "Загрузить файл"
    const handleUploadClick = async () => {
        if (fileList.length === 0) {
            message.warning("Пожалуйста, выберите файл для загрузки");
            return;
        }

        // if (!existingFile?.file_url) {
        //     message.error("Не удалось получить файл");
        //     return;
        // }
        const file = fileList[0].originFileObj;

        
        if (!file) {
            message.error("Не удалось получить файл");
            return;
        }

        const formData = new FormData();
        formData.append("team_id", teamId);
        formData.append("image", file);

        try {
            const token = Cookies.get("token");
            const response = await axios.post(
            "http://1180973-cr87650.tw1.ru/upload_project_file",
            formData,
            {
                headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
                },
            }
            );

            message.success("Файл успешно загружен");

            setFileList((prev) =>
            prev.map((f) => ({ ...f, status: "done", url: response.data.file_url }))
            );

            if (response.data.filename && response.data.file_url) {
            onFileUploaded?.(response.data.filename, response.data.file_url);
            }
        } catch (error) {
            console.error("Ошибка при загрузке файла:", error);
            message.error("Ошибка при загрузке файла");
        }
        };

        // 👇 expose handleUploadClick to parent
        useImperativeHandle(ref, () => ({
        handleUpload: handleUploadClick,
    }));
    
    const handleRemove = async (file: UploadFile) => {
        try {
            const token = Cookies.get("token");
            // отправляем запрос на удаление файла
            await axios.post(
            "http://1180973-cr87650.tw1.ru/delete_project_file",
            { team_id: teamId },
            { headers: { Authorization: `Bearer ${token}` } }
            );

            // Очищаем состояние на фронте
            setFileList([]);
            setExistingFile(null);

            message.success("Файл успешно удалён");
        } catch (error) {
            message.error("Ошибка при удалении файла");
            console.error(error);
        }
    };


  return (
    <>

        <Upload
            fileList={fileList}
            beforeUpload={beforeUpload}
            onChange={handleChange}
            onRemove={handleRemove} 
            maxCount={1}
            disabled={disabled}
            onPreview={(file) =>
            window.open(file.url || file.thumbUrl || "", "_blank")
            }
            accept="image/*"
        >
            <Button icon={<UploadOutlined />} disabled={disabled}>
            Выбрать файл
            </Button>
        </Upload>
        </>
  );
});

export default ProjectFileUpload;
