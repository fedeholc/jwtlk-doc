//cspell: disable
import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Intro',
      collapsible: true,
      collapsed: false,
      link: { type: 'doc', id: 'intro/intro' },
      items: ['intro/problemas', 'intro/soluciones-con-JWT',],
    },
    {
      type: 'category',
      label: 'La aplicación',
      collapsible: true,
      collapsed: false,
      link: { type: 'doc', id: 'la-aplicacion/la-aplicacion' },
      items: ['la-aplicacion/backend', 'la-aplicacion/frontend', {
        type: 'category',
        label: 'Procesos de autenticación',
        collapsible: true,
        collapsed: false,
        items: ['la-aplicacion/procesos/registro', 'la-aplicacion/procesos/login', 'la-aplicacion/procesos/login-oauth', 'la-aplicacion/procesos/login-token', 'la-aplicacion/procesos/logout', 'la-aplicacion/procesos/delete', 'la-aplicacion/procesos/reset', 'la-aplicacion/procesos/middleware-verificacion']
      },],
    },
    {
      type: 'category',
      label: 'Anexos',
      collapsible: true,
      collapsed: true,
      items: ['anexos/herramientas', 'anexos/listas-denegacion', 'anexos/manipular-jwt', 'anexos/testing', 'anexos/links'],
    },

  ],

};

export default sidebars;
