import { useRef, useState, useLayoutEffect } from 'react';
import { graphql, useStaticQuery } from 'gatsby';

export function useDimensions() {
  const ref = useRef();
  const [dimensions, setDimensions] = useState({});

  useLayoutEffect(() => {
    setDimensions(ref.current.getBoundingClientRect().toJSON());
  }, [ref.current]);

  return [ref, dimensions];
}

export const navQuery = graphql`
  query NavQuery {
    allMarkdownRemark(
      filter: { fields: { isIndex: { ne: true }, draft: { ne: true } } }
      sort: [
        { fields: { sortOrder: ASC } }
        { fields: { sortSubOrder: ASC } }
        { fields: { order: ASC } }
        { fields: { pageTitle: ASC } }
      ]
    ) {
      edges {
        node {
          fields {
            slug
            navGroup
            navSubGroup
            order
            isPackageIndex
            pageTitle
          }
        }
      }
    }
  }
`;

export function useNavData() {
  // We filter out the index.md pages from the nav list
  let data = useStaticQuery(navQuery);
  const navData = data.allMarkdownRemark.edges.reduce(
    (
      pageList,
      {
        node,
        node: {
          fields: { slug, navGroup, navSubGroup },
        },
      }
    ) => {
      // Map MarkdownRemark node to the structure expected by the rest of the app (which previously used SitePage)
      const nodeWithContext = {
        path: slug,
        context: node.fields,
        pageContext: node.fields, // for safety
      };

      if (navGroup !== null) {
        // finding out what directory the file is in (eg '/keystone-alpha')

        const addPage = page => {
          page.pages.push(nodeWithContext);
        };

        if (Boolean(!pageList.find(obj => obj.navTitle === navGroup))) {
          pageList.push({ navTitle: navGroup, pages: [], subNavs: [] });
        }

        if (navSubGroup === null) {
          const page = pageList.find(obj => obj.navTitle === navGroup);
          addPage(page);
        } else {
          const page = pageList.find(obj => obj.navTitle === navGroup);
          if (Boolean(!page.subNavs.find(obj => obj.navTitle === navSubGroup))) {
            page.subNavs.push({ navTitle: navSubGroup, pages: [] });
          }
          const subPage = page.subNavs.find(obj => obj.navTitle === navSubGroup);
          addPage(subPage);
        }
      }
      return pageList;
    },
    []
  );

  return navData;
}
