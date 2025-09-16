import React, { useState, useEffect } from 'react';
import { Tabs } from 'antd';
import { UsersTable, ActionsTable, TeamsTable, ProjectsTable, NewsTable } from './AdminTables';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const { TabPane } = Tabs;

export const AdminContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('1');
  const [userEmailFilter, setUserEmailFilter] = useState<string | null>(null);
  const [emailFilter, setEmailFilter] = useState<string | null>(null);
  const navigate = useNavigate();

  // Убираем фокус с активного элемента перед сменой вкладки
  const blurFocusedIfInHiddenTab = () => {
    if (document.activeElement && document.activeElement.closest('.ant-tabs-tabpane-hidden')) {
      (document.activeElement as HTMLElement).blur();
    }
  };

  const handleUserFilterFromAction = (email: string) => {
    setUserEmailFilter(email);
    blurFocusedIfInHiddenTab();
    setActiveTab('1');
  };

  const handleTabChange = (key: string) => {
    blurFocusedIfInHiddenTab();
    setActiveTab(key);
  };

  // Если переключение вкладки происходит где-то ещё — на всякий случай
  useEffect(() => {
    blurFocusedIfInHiddenTab();
  }, [activeTab]);

  return (
    <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button type="primary" onClick={() => navigate('/admin/news/create')}>
            Добавить новость
          </Button>
        </div>
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane tab="Пользователи" key="1">
            <UsersTable emailFilter={userEmailFilter} />
          </TabPane>
          <TabPane tab="Акции" key="2">
            <ActionsTable onCreatedByClick={handleUserFilterFromAction} />
          </TabPane>
          <TabPane tab="Команды" key="3">
            <TeamsTable />
          </TabPane>
          <TabPane tab="Проекты" key="4">
            <ProjectsTable />
          </TabPane>
          <TabPane tab="Новости" key="5">
            <NewsTable />
          </TabPane>
      </Tabs>
    </div>
  );
};
