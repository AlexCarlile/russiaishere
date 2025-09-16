import React, { useState, useEffect } from "react";
import { Tabs, Form, Input, Button, message } from "antd";
import { questions } from "../ProjectsContent/questions";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

const { TabPane } = Tabs;

interface ProjectSurveyPublicProps {
  teamId?: string;
}

const ProjectSurveyPublic: React.FC<ProjectSurveyPublicProps> = ({ teamId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState<string>("firstMassive");
  const [firstPage, setFirstPage] = useState(0);
  const QUESTIONS_PER_PAGE = 4;

  // Загрузка ответов
  useEffect(() => {
    if (!teamId) {
      message.error("Не удалось определить team_id");
      setLoading(false);
      return;
    }

    const fetchAnswers = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:5000/api/get-public-answers?team_id=${teamId}`
        );
        if (!response.ok) throw new Error("Ошибка загрузки данных");

        const data = await response.json();

        if (data.answers) {
          const formValues: Record<string, any> = {};
          for (const section in data.answers) {
            formValues[section] = {};
            for (const question in data.answers[section]) {
              formValues[section][question] = data.answers[section][question];
            }
          }
          form.setFieldsValue(formValues);
        }
      } catch (error) {
        console.error(error);
        message.error("Не удалось загрузить данные");
      } finally {
        setLoading(false);
      }
    };

    fetchAnswers();
  }, [teamId, form]);

  const onTabChange = (key: string) => setActiveKey(key);

  if (loading) return <div>Загрузка...</div>;

  return (
    <Form form={form} layout="vertical" disabled>
      <Tabs activeKey={activeKey} onChange={onTabChange}>
        {Object.entries(questions).map(([sectionKey, questionList], index) => {
          const isFirst = sectionKey === "firstMassive";

          const paginatedQuestions = isFirst
            ? questionList.slice(
                firstPage * QUESTIONS_PER_PAGE,
                (firstPage + 1) * QUESTIONS_PER_PAGE
              )
            : questionList;

          return (
            <TabPane tab={`Раздел ${index + 1}`} key={sectionKey}>
              {paginatedQuestions.map((q) => {
                const value = form.getFieldValue([sectionKey, q.number]);
                return (
                  <div key={q.number} style={{ marginBottom: 24 }}>
                    <div style={{ marginBottom: 4 }}>
                      <strong>{q.descr}</strong>
                      {q.subtext && (
                        <div style={{ fontSize: 12, color: "#888" }}>
                          {q.subtext}
                        </div>
                      )}
                    </div>
                    <Form.Item name={[sectionKey, q.number]}>
                      <Input.TextArea
                        placeholder={q.placeholder}
                        autoSize={{ minRows: 3, maxRows: 8 }}
                        disabled
                        value={value}
                      />
                    </Form.Item>
                  </div>
                );
              })}

              {/* Кнопки пагинации для firstMassive */}
              {isFirst && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    marginTop: 24,
                  }}
                >
                  <Button
                    icon={<LeftOutlined />}
                    disabled={firstPage === 0}
                    onClick={() => setFirstPage((prev) => prev - 1)}
                    style={{ width: "48%" }}
                  >
                    Назад
                  </Button>
                  <Button
                    icon={<RightOutlined />}
                    iconPosition="end"
                    disabled={
                      (firstPage + 1) * QUESTIONS_PER_PAGE >= questionList.length
                    }
                    onClick={() => setFirstPage((prev) => prev + 1)}
                    style={{ width: "48%" }}
                  >
                    Далее
                  </Button>
                </div>
              )}
            </TabPane>
          );
        })}
      </Tabs>
    </Form>
  );
};

export default ProjectSurveyPublic;
