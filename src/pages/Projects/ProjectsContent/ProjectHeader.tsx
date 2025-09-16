import React from 'react';
import dayjs from 'dayjs';
import './Project.css';

interface Campaign {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  image_url: string;
  winner_announcement_date?: string;
}

interface ProjectHeaderProps {
  campaign: Campaign;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ campaign }) => {
  return (
    <div className="project-header">
      <img
        src={`http://127.0.0.1:5000${campaign.image_url}`}
        alt={campaign.title}
        className="project-header__bg"
      />
      <div className="project-header__overlay" />
      <div className="project-header__card">
        <div className="project-header__badge">Текущий проект</div>
        <h2 className="project-header__title">{campaign.title}</h2>
        <p className="project-header__dates">
          {dayjs(campaign.start_date).format('DD.MM.YYYY')} — {dayjs(campaign.end_date).format('DD.MM.YYYY')}
        </p>
        <p className="project-header__desc">{campaign.description}</p>
        {campaign.winner_announcement_date && (
          <p className="project-header__winners">
            Победители будут объявлены: {dayjs(campaign.winner_announcement_date).format('DD.MM.YYYY')}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProjectHeader;
