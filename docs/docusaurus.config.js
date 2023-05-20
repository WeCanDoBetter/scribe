// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: '📜 Scribe',
  tagline: 'An innovative context-aware workflow orchestrator',
  favicon: 'img/scroll.svg',

  // Set the production url of your site here
  url: 'https://WeCanDoBetter.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/scribe',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'WeCanDoBetter', // Usually your GitHub org/user name.
  projectName: 'scribe', // Usually your repo name.
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          // sidebarPath: require.resolve('./sidebars.js'),
          // // Please change this to your repo.
          // // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          routeBasePath: '/',
        },
        blog: false,
        // {
        //   showReadingTime: true,
        //   // Please change this to your repo.
        //   // Remove this to remove the "edit this page" links.
        //   editUrl:
        //     'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        // },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/scribe-text.png',
      navbar: {
        title: 'Scribe',
        logo: {
          alt: 'Scribe Logo',
          src: 'img/scroll.svg',
        },
        items: [
          // {
          //   type: 'docSidebar',
          //   sidebarId: 'defaultSidebar',
          //   position: 'left',
          //   label: 'Documentation',
          // },
          // {to: '/blog', label: 'Blog', position: 'left'},
          {
            href: 'https://github.com/WeCanDoBetter/scribe',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Getting Started',
                to: '/getting-started/introduction',
              },
              {
                label: 'Core Concepts',
                to: '/category/core-concepts',
              },
              {
                label: 'Workflows',
                to: '/category/workflows',
              },
              {
                label: 'FAQ',
                to: '/faq',
              },
            ],
          },
          {
            title: 'External',
            items: [
              {
                label: 'Type definitions',
                href: 'https://deno.land/x/scribeai/mod.ts',
              },
              {
                label: 'Discord',
                href: 'https://discordapp.com/invite/9y27VZkDEA',
              },
              {
                label: 'Website',
                href: 'https://www.wcdb.life//scribe',
              },
            ],
          },
        ],
        copyright: `<small>We Can Do Better, 2023.<br />This work is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License.</small>`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
