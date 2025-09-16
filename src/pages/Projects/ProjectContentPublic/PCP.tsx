import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Alert, Spin, Card } from 'antd';
import ProjectHeader from '../ProjectsContent/ProjectHeader';
import TeamInfo from '../ProjectsContent/TeamInfo';
import ProjectSurveyPublic from './ProjectSurveyPublic';

// TEST
interface Campaign {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  image_url: string;
}

interface TeamMember {
    name: string;
    surname: string;
    role?: string; // добавили роль
    mentor: string; 
}

const PCP: React.FC = () => {
  const { teamId } = useParams<{ teamId?: string }>(); // Получаем teamId из URL
  const { projectId } = useParams<{ projectId: string }>();
  const [projectData, setProjectData] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [mentor, setMentor] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>(''); // Сохраняем роль пользователя

  // Загрузка проекта (только победителей)
  useEffect(() => {
    const fetchProjectData = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = `http://127.0.0.1:5000/api/projects/${teamId}`;
        const token = Cookies.get('token');

        // Передаем Authorization только если есть токен
        const headers: any = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await axios.get(url, { headers });

        setProjectData(response.data.project);
        setTeamMembers(response.data.team_members);

        // Наставник
        const mentorMember = response.data.team_members.find((m: any) => m.role === 'наставник');
        setMentor(mentorMember || null);

      } catch (err: any) {
        console.error("Ошибка загрузки:", err);

        if (err.response?.status === 403) {
          setError("Этот проект недоступен для публичного просмотра (он не является победителем).");
        } else if (err.response?.status === 404) {
          setError("Проект не найден.");
        } else {
          setError("Ошибка при загрузке проекта. Попробуйте позже.");
        }

      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [teamId]);


  // Загрузка кампании
  useEffect(() => {
    const fetchCampaign = async () => {
      if (!projectData?.campaign_id) return;

      try {
        const response = await fetch(`http://127.0.0.1:5000/campaigns/${projectData.campaign_id}`);
        if (!response.ok) throw new Error(`Ошибка ${response.status}`);
        const data: Campaign = await response.json();
        setCampaign(data);
      } catch (error) {
        console.error("Ошибка при загрузке кампании:", error);
        setCampaign(null);
      }
    };

    fetchCampaign();
  }, [projectData]);

  // Состояния загрузки/ошибок
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "50px" }}>
        <Spin size="large" tip="Загрузка..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Ошибка"
        description={error}
        type="error"
        showIcon
        style={{ margin: 20 }}
      />
    );
  }

  // Основной рендер
  return (
    <div>
      <Spin spinning={!projectData}></Spin>

      {campaign && <ProjectHeader campaign={campaign} />}

      {projectData?.description === 'yes' && (
        <Alert
          message="Поздравляем!"
          description="Этот проект признан победителем. Отличная работа всей команды!"
          type="success"
          showIcon
          style={{ marginBottom: 20 }}
        />
      )}

      {projectData?.description === 'no' && (
        <Alert
          message="Благодарим за участие"
          description="Этот проект не был выбран победителем, но команда проделала отличную работу."
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />
      )}

      {projectData && (
        <TeamInfo
          teamName={projectData.title}
          mentor={mentor}
          members={teamMembers}
          projectCode={""} // код проекта не нужен в публичном просмотре
        />
      )}

      <h2>Файлы проекта</h2>
      {(projectData?.file || projectData?.file_design) && (
        <div
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 16,
            alignItems: 'flex-start',
          }}
        >
          {projectData.file && projectData.file.file_url && (
            <Card
              title="Изображение проекта"
              style={{ maxWidth: 300, width: '100%' }}
              bodyStyle={{ padding: 8 }}
            >
              {projectData.file.file_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img
                  src={projectData.file.file_url}
                  alt={projectData.file.filename}
                  style={{ width: '100%', borderRadius: 8 }}
                />
              ) : (
                <a
                  href={projectData.file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📎 {projectData.file.filename}
                </a>
              )}
            </Card>
          )}

          {projectData.file_design && projectData.file_design.file_url && (
            <Card
              title="Отрисованное изображение"
              style={{ maxWidth: 300, width: '100%' }}
              bodyStyle={{ padding: 8 }}
            >
              {projectData.file_design.file_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img
                  src={projectData.file_design.file_url}
                  alt={projectData.file_design.filename_design || "Design"}
                  style={{ width: '100%', borderRadius: 8 }}
                />
              ) : (
                <a
                  href={projectData.file_design.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📎 {projectData.file_design.filename_design || "Design"}
                </a>
              )}
            </Card>
          )}
        </div>
      )}


      <h2>Проект</h2>

      {projectData && (
        <ProjectSurveyPublic
          teamId={teamId}
        />
      )}
    </div>
  );
};

export default PCP;
