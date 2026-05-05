/** @jsx jsx */

import { Fragment, useState } from 'react';
import { jsx, Global } from '@emotion/core';
import { colors, borderRadius, gridSize } from '@open-arch-ui/theme';
import { SkipNavLink } from '@reach/skip-nav';

import { Header, NextBanner, SiteMeta } from '../components';
import { media, mediaMax } from '../utils/media';

const globalStyles = {
  body: {
    backgroundColor: colors.page,
    color: colors.N80,
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
    letterSpacing: '-0.005em',
    margin: 0,
    textDecorationSkip: 'ink',
    textRendering: 'optimizeLegibility',
    msOverflowStyle: '-ms-autohiding-scrollbar',
    MozFontFeatureSettings: "'liga' on",
    MozOsxFontSmoothing: 'grayscale',
    WebkitFontSmoothing: 'antialiased',
  },
  a: {
    textDecoration: 'none',
  },

  // Accessibility
  // ------------------------------

  '.js-focus-visible :focus:not(.focus-visible)': {
    outline: 'none',
  },
  '.js-focus-visible .focus-visible': {
    outline: `2px dashed ${colors.B.A60}`,
    outlineOffset: 2,
  },

  '[data-reach-skip-link]': {
    borderColor: 'initial',
    borderImage: 'initial',
    borderStyle: 'initial',
    borderWidth: '0px',
    clip: 'rect(0px, 0px, 0px, 0px)',
    color: colors.primary,
    fontSize: '0.875rem',
    height: '1px',
    margin: '-1px',
    overflow: 'hidden',
    padding: '0px',
    position: 'absolute',
    width: '1px',
    zIndex: '100',
  },
  '[data-reach-skip-link]:focus': {
    background: 'rgb(255, 255, 255)',
    clip: 'auto',
    height: 'auto',
    left: '1.5rem',
    padding: '1rem',
    position: 'fixed',
    textDecoration: 'none',
    top: '1.5rem',
    width: 'auto',
  },

  // Device Tweaks
  // ------------------------------

  [mediaMax.sm]: {
    body: { fontSize: 'inherit' },
    html: { fontSize: 14 },
  },
  [media.sm]: {
    body: { fontSize: 'inherit' },
    html: { fontSize: 16 },
  },
};

export const Layout = ({ children, showSearch = true }) => {
  const [sidebarIsVisible, setSidebarVisible] = useState(false);
  const toggleSidebar = () => setSidebarVisible(bool => !bool);

  return (
    <Fragment>
      <Global styles={globalStyles} />
      <SkipNavLink />
      <SiteMeta pathname="/" />
      <Header key="global-header" toggleMenu={toggleSidebar} showSearch={showSearch} />
      <NextBanner />
      {children({ sidebarIsVisible, toggleSidebar })}
    </Fragment>
  );
};

// ==============================
// Layout
// ==============================

export const Content = props => (
  <main
    css={{
      minWidth: 0,
      lineHeight: '1.6',

      [mediaMax.sm]: {
        padding: gridSize * 2,
      },
      [media.sm]: {
        paddingLeft: gridSize * 6,
      },

      // TODO: doesn't play nice with "gatsby-resp-image-wrapper"
      img: {
        backgroundColor: 'white',
        borderRadius,
        boxSizing: 'border-box',
        boxShadow: '0 0 0 1px hsla(0, 0%, 0%, 0.1), 0 4px 11px hsla(0, 0%, 0%, 0.1) !important',
        display: 'block',
        marginBottom: '2rem',
        marginTop: '2rem',
        maxWidth: '100%',
      },

      '.gatsby-resp-image-background-image': {
        borderRadius,
      },
      '.gatsby-resp-image-wrapper img': {
        marginTop: 0,
        marginBottom: 0,
      },

      // NOTE: consider removing `gatsby-resp-image-wrapper`
      '.gatsby-resp-image-link, .gatsby-resp-image-link:hover, .gatsby-resp-image-link:focus': {
        background: 0,
        border: 0,
        marginBottom: '2rem',
        marginTop: '2rem',
      },

      // Misc. Typography
      // ------------------------------
      'li, p': {
        lineHeight: 1.6,
      },
      'ul > li > ul, ol > li > ol, ul > li > ol, ol > li > ul': {
        paddingLeft: '1.33rem',
      },

      // Styles for Markdown content
      'h1, h2, h3, h4, h5, h6': {
          fontWeight: 500,
          lineHeight: 1.2,
          marginTop: '1.5em',
          marginBottom: '0.5em',
      },
      'h1': { fontSize: '2.5rem' },
      'h2': { fontSize: '2rem', borderBottom: `1px solid ${colors.N10}`, paddingBottom: '0.3em' },
      'h3': { fontSize: '1.5rem' },
      'a': {
          color: colors.B.base,
          textDecoration: 'none',
          ':hover': {
              textDecoration: 'underline',
          },
      },
      'blockquote': {
          borderLeft: `4px solid ${colors.N20}`,
          color: colors.N60,
          margin: '1.5em 0',
          paddingLeft: '1em',
      },
      'pre': {
          backgroundColor: colors.N05,
          borderRadius,
          padding: gridSize * 2,
          overflowX: 'auto',
          marginBottom: '1.5em',
      },
      'code': {
          fontFamily: 'SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace',
          fontSize: '0.85em',
          backgroundColor: colors.N05,
          padding: '0.2em 0.4em',
          borderRadius,
      },
      'pre code': {
          backgroundColor: 'transparent',
          padding: 0,
      },
    }}
    {...props}
  />
);
