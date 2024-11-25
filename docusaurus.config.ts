import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'JWT Learning Kit',
  tagline: 'Roll your own auth, al menos una vez en la vida.',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://jwtlk.fedeholc.ar',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'fedeholc', // Usually your GitHub org/user name.
  projectName: 'jwtlk', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/fedeholc/jwtlk/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'JWT Learning Kit',
      logo: {
        alt: 'My Site Logo',
        src: 'img/g3.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'La Guía',
        },


        {
          href: 'https://github.com/fedeholc/jwtlk',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'La Guía',
              to: '/',
            },
          ],
        },

        {
          title: 'Repo',
          items: [

            {
              label: 'GitHub',
              href: 'https://github.com/fedeholc/jwt-lk',
            },
          ],
        },
        {
          title: 'Contactame',
          items: [
            {
              label: 'Portfolio',
              href: 'https://portfolio.fedeholc.ar',
            },
          ],
        },
      ],
      copyright: `Federico Holc, ${new Date().getFullYear()}.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
