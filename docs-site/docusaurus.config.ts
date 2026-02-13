import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'AWS Async Assertions',
  tagline: 'Tagline Here',
  favicon:
    'https://cdn.prod.website-files.com/673b05e9b4f6306838c02cd7/673db2ea588656e73cdd710f_Favicon.png',
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },
  url: 'https://leighton-digital.github.io', // Your org's GitHub Pages URL
  baseUrl: '/aws-async-assertions', // Repo name as base path
  organizationName: 'Leighton Digital', // Usually your GitHub org/user name.
  projectName: 'aws-async-assertions', // Usually your repo name.

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  markdown: {
    parseFrontMatter: async (params) => {
      const res = await params.defaultParseFrontMatter(params);
      if (res.frontMatter.hide_title === undefined) {
        res.frontMatter.hide_title = true;
      }
      return res;
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'docs',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
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
    image: 'img/aws-async-assertions.png',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'AWS Async Assertions',
      logo: {
        alt: 'AWS Async Assertions Logo',
        src: 'img/aws-async-assertions.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'reference',
          position: 'left',
          label: 'Library Reference',
        },
        {
          href: 'https://github.com/leighton-digital/aws-async-assertions',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Library Reference',
              to: '/',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub Issues',
              href: 'https://github.com/leighton-digital/aws-async-assertions/issues',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Leighton Digital. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
