import React from 'react';
import { Helmet } from 'react-helmet';
import { graphql, StaticQuery } from 'gatsby';

export const SiteMeta = ({ pathname }) => (
  <StaticQuery
    query={graphql`
      query SiteMetadata {
        site {
          siteMetadata {
            siteUrl
            title
            twitter
          }
        }
      }
    `}
    render={({
      site: {
        siteMetadata: { siteUrl, title },
      },
    }) => {
      // NOTE: site.webmanifest is handled in "gatsby-config.js" by "gatsby-plugin-manifest"
      return (
        <Helmet defaultTitle={title} titleTemplate={`%s | ${title}`}>
          <html lang="en" />
          <link rel="canonical" href={`${siteUrl}${pathname}`} />
          <meta
            name="viewport"
            content="width=device-width,initial-scale=1,shrink-to-fit=no,viewport-fit=cover"
          />
          <meta name="robots" content="noindex" />
          <meta name="robots" content="nofollow" />

          <link rel="apple-touch-icon" sizes="180x180" href="/favicon.svg" />
          <link rel="icon" type="image/svg" sizes="32x32" href="/safari-pinned-tab.svg" />
          <link rel="shortcut icon" href="/favicon.svg" />
          <meta name="theme-color" content="#ffffff" />

          <meta property="og:url" content={siteUrl} />
          <meta property="og:type" content="website" />
          <meta property="og:locale" content="en" />
          <meta property="og:site_name" content={title} />
          <meta property="og:image" content={`${siteUrl}/og-image-landscape.png`} />
          <meta property="og:image:width" content="761" />
          <meta property="og:image:height" content="410" />
        </Helmet>
      );
    }}
  />
);
