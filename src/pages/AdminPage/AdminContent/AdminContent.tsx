import React from 'react';
import { Tabs } from 'antd';
import { UsersTable } from './AdminTables';
// import { CampaignsTable } from './AdminTables';
// import { ProjectsTable } from './AdminTables';

const { TabPane } = Tabs;

export const AdminContent: React.FC = () => {
  return (
    <Tabs defaultActiveKey="1">
        <TabPane tab="Пользователи" key="1">
            <UsersTable />
        </TabPane>
        {/* <TabPane tab="Акции" key="2">
            <CampaignsTable />
        </TabPane>
        <TabPane tab="Проекты" key="3">
            <ProjectsTable />
        </TabPane> */}
    </Tabs>
  )
}
