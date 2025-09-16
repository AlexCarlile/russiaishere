interface HeaderItems {
  key: number;
  label: string;
  url: string;
  roleRequired?: string | null // Этот пункт только для роли admin
}


export const headerItems:HeaderItems[] = [
    {
      key: 1,
      label: "Главная страница",
      url: "/",
      roleRequired: null,
    },
  
    {
      key: 2,
      label: "Акции",
      url: "/actions",
      roleRequired: null,
    },
    
    {
      key: 3,
      label: "Новости",
      url: "/news",
      roleRequired: null, // Этот пункт только для роли admin
    },

    {
      key: 4,
      label: "О проекте",
      url: "/about",
      roleRequired: null,
    },

    {
      key: 5,
      label: "Партнеры",
      url: "/partners",
      roleRequired: null,
    },

    {
      key: 6,
      label: "Админ",
      url: "/admin",
      roleRequired: 'админ', // Этот пункт только для роли admin
    },


  ]