import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from "react";
import { Tabs, Form, Input, Button, message } from "antd";
import { questions } from "./questions"; // Массив вопросов с type: "text" или "file"
import Cookies from "js-cookie";
import ProjectFileUpload, { ProjectFileUploadRef } from "./ProjectFileUpload"; // 👈
import { useAuth } from "../../../store/AuthContext"; 
import firstImage from '../../../media/projectPic/first.jpg';
import secondImage from '../../../media/projectPic/second.jpg';
import thirdImage from '../../../media/projectPic/third.jpg';
import { LeftOutlined, RightOutlined } from "@ant-design/icons";


const { TabPane } = Tabs;

interface Question {
  number: string;
  descr: string;
  subtext?: string;
  title: string;
  placeholder?: string;
  maxLength?: number;
  type?: "text" | "file";
}

export interface ProjectSurveyRef {
  validateSurvey: () => boolean;
  getSurveyData: () => Record<string, any>;
}

interface ProjectSurveyProps {
  status?: string;
  winnerStatus?: string;
}

export const ProjectSurvey = forwardRef<ProjectSurveyRef, ProjectSurveyProps>(({ status, winnerStatus}, ref) => {
  const { userRole } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const teamId = window.location.pathname.split("/").pop();
  const fileUploadRef = useRef<ProjectFileUploadRef>(null);
  const [activeKey, setActiveKey] = useState<string>("firstMassive");
  const [firstPage, setFirstPage] = useState(0);
  const QUESTIONS_PER_PAGE = 4;


  useEffect(() => {
    if (userRole === "админ") {
      setIsDisabled(false); // 👈 для админа всегда разрешено редактирование
    } else {
      setIsDisabled(status === "yes" || winnerStatus === "yes" || winnerStatus === "no");
    }
  }, [status, winnerStatus, userRole]);

  useImperativeHandle(ref, () => ({
    validateSurvey: () => {
      const values = form.getFieldsValue();
      for (const section of Object.values(values)) {
        for (const value of Object.values(section || {})) {
          if (
            value === undefined ||
            value === null ||
            value === ""
          ) {
            return false;
          }
        }
      }
      return true;
    },
    getSurveyData: () => form.getFieldsValue(),
  }));

  useEffect(() => {
    if (!teamId) {
      message.error("Не удалось определить team_id");
      return;
    }

    const fetchAnswers = async () => {
      try {
        const response = await fetch(`http://1180973-cr87650.tw1.ru/api/get-answers?team_id=${teamId}`, {
          headers: { Authorization: `Bearer ${Cookies.get("token")}` },
        });
        if (!response.ok) throw new Error("Ошибка загрузки данных");
        const data = await response.json();

        if (data.answers) {
          const formValues: Record<string, any> = {};
          for (const section in data.answers) {
            formValues[section] = {};
            for (const question in data.answers[section]) {
              const val = data.answers[section][question];
              formValues[section][question] = val;
            }
          }
          form.setFieldsValue(formValues);
        }
      } catch (error) {
        message.error("Не удалось загрузить данные");
        console.error(error);
      }
    };

    fetchAnswers();
  }, [teamId, form]);

  const handleSubmit = async (values: Record<string, any>) => {
    setLoading(true);
    if (!teamId) {
      message.error("Не удалось определить team_id");
      setLoading(false);
      return;
    }

    try {
      await fileUploadRef.current?.handleUpload();
      await fetch("http://1180973-cr87650.tw1.ru/api/save-answers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          team_id: teamId,
          answers: values,
        }),
      });

      message.success("Данные успешно сохранены!");
    } catch (error) {
      message.error("Ошибка при сохранении");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onTabChange = (key: string) => {
    setActiveKey(key);
  };

  const tabImages: Record<string, string> = {
    firstMassive: firstImage,
    secondMassive: secondImage,
    thirdMassive: thirdImage,
  };


  return (
    <div style={{ display: "flex", gap: 24 }}>
      <div style={{ flex: "0 0 450px" }}>
        <img
          src={tabImages[activeKey]}
          alt={`Изображение для ${activeKey}`}
          style={{ width: "100%", borderRadius: 8 }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onFinishFailed={({ errorFields }) => {
            console.log("Не прошла валидация:", errorFields);
            message.error("Форма содержит ошибки");
          }}
          disabled={isDisabled}
        >
          <Tabs activeKey={activeKey} onChange={onTabChange}>
            {Object.entries(questions).map(([sectionKey, questionList], index) => {
              const isSecond = sectionKey === "secondMassive";
              const isFirst = sectionKey === "firstMassive";
              const tabLabel = `Раздел ${index + 1}`;

              const paginatedQuestions = isFirst
                ? questionList.slice(firstPage * QUESTIONS_PER_PAGE, (firstPage + 1) * QUESTIONS_PER_PAGE)
                : questionList;

              return (
                <TabPane tab={tabLabel} key={sectionKey}>
                  {/* Заголовок для secondMassive */}
                  {isSecond && (
                    <div style={{ marginBottom: 24 }}>
                      <strong style={{fontSize: '18px'}}>{questions.secondMassive[0].descr}</strong>
                      {/* {questions.secondMassive[0].subtext && (
                        <div style={{ fontSize: 12, color: "#888" }}>
                          {questions.secondMassive[0].subtext}
                        </div>
                      )} */}
                    </div>
                  )}

                  {paginatedQuestions.map((q) => (
                    <div key={q.number} style={{ marginBottom: 24 }}>
                      <div style={{ marginBottom: 4 }}>
                        <strong>{q.descr}</strong>
                        {q.subtext && <div style={{ fontSize: 12, color: "#888" }}>{q.subtext}</div>}
                      </div>
                      <Form.Item
                        name={[sectionKey, q.number]}
                        rules={[{ required: false, message: "Обязательное поле" }]}
                      >
                        <Input.TextArea
                          placeholder={q.placeholder}
                          maxLength={q.maxLength}
                          disabled={isDisabled}
                          autoSize={{ minRows: 3, maxRows: 8 }}
                        />
                      </Form.Item>
                    </div>
                  ))}

                  {/* 👇 Кнопки пагинации только для firstMassive */}
                  {isFirst && (
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginTop: 24, marginBottom: '2rem' }}>
                      <Button
                        icon={<LeftOutlined />}
                        disabled={firstPage === 0}
                        onClick={() => setFirstPage((prev) => prev - 1)}
                        style={{ width: "49%", fontSize: '18px', padding: '1.5rem 0 1.5rem 0' }}
                      >
                        Назад
                      </Button>
                      <Button
                        icon={<RightOutlined />}
                        iconPosition="end"
                        disabled={(firstPage + 1) * QUESTIONS_PER_PAGE >= questionList.length}
                        onClick={() => setFirstPage((prev) => prev + 1)}
                        style={{ width: "49%", fontSize: '18px', padding: '1.5rem 0 1.5rem 0' }}
                      >
                        Далее
                      </Button>
                    </div>
                  )}

                  {sectionKey === "thirdMassive" && (
                    <ProjectFileUpload
                      ref={fileUploadRef}
                      teamId={teamId || ""}
                      disabled={isDisabled}
                      onFileUploaded={(filename, url) => {
                        message.success(`Файл "${filename}" успешно загружен`);
                      }}
                    />
                  )}
                </TabPane>
              );
            })}

          </Tabs>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} disabled={isDisabled} style={{width: '100%', fontSize: '18px', padding: '1.5rem 0 1.5rem 0'}}>
              Сохранить изменения
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
});

export default ProjectSurvey;