describe('Search', () => {
  before(() => cy.visit('/reset-db'));

  beforeEach(() => {
    cy.intercept('POST', '**/admin/api').as('graphqlPost');
  });

  const scenarios = [
    {
      url: '/admin/users',
      searchTerm: 'j',
      found: ['Jed Watson', 'John Molomby', 'Joss Mackison', 'Jared Crowe'],
      notFound: ['Boris Bozic', 'Ben Conolly', 'Luke Batchelor', 'Tom Walker'],
    },
    {
      url: '/admin/posts',
      searchTerm: 'hello planet',
      found: [],
      notFound: ['Hello Things'],
    },
    {
      url: '/admin/post-categories',
      searchTerm: 'key',
      found: ['Keystone'],
      notFound: ['GraphQL', 'Node', 'React'],
    },
  ];

  scenarios.forEach(({ url, searchTerm, found, notFound }) => {
    it(`Searching for "${searchTerm}" in ${url}`, () => {
      cy.visit(url);

      // 2) Assert that before searching, all expected items are visible
      [...notFound, ...found].forEach(name => {
        cy.get('main').should('contain', name); // ensure each name is present in the main content
      });

      // 3) Wait for the search input to load and be visible
      cy.get('#ks-list-search-input')
        .should('be.visible') // ensure input is rendered before interacting
        .clear({ force: true }) // clear any existing input (force in case it's covered)
        .type(searchTerm, { force: true }); // type the search term

      // 4) Wait for the stubbed GraphQL POST to complete
      // This ensures the UI has received and processed the search results
      cy.wait('@graphqlPost');

      // 5a) Confirm that all expected "found" items remain visible
      found.forEach(name => {
        cy.get('main').should('contain', name);
      });

      // 5b) Confirm that all "notFound" items are no longer present
      notFound.forEach(name => {
        cy.get('main').should('not.contain', name);
      });
    });
  });
});
