interface HeaderItems {
  key: number;
  label: string;
  url: string
}


export const headerItems:HeaderItems[] = [
    {
      key: 1,
      label: "Главная страница",
      url: "/"
    },
  
    {
      key: 2,
      label: "Акции",
        url: "/actions"
    },

    {
      key: 3,
      label: "О проекте",
      url: "/about"
    },
    {
      key: 4,
      label: "Партнеры",
      url: "/partners"
    },
    {
      key: 5,
      label: "Админ-панель",
      url: "/admin"
    },
  ]