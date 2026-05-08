describe('Compare Interpolated Table', () => {
  before(() => {
    cy.window().then((win) => {
      win.localStorage.setItem('inferencex-star-modal-dismissed', String(Date.now()));
    });
    cy.visit('/compare/gb200-vs-h100');
    cy.get('[data-testid="compare-interpolated-table"]').should('exist');
  });

  beforeEach(() => {
    cy.document().then((doc) => {
      delete doc.body.dataset.scrollLocked;
      doc.body.style.removeProperty('pointer-events');
    });
  });

  it('renders the interpolated table with at least one target column', () => {
    cy.get('[data-testid="compare-interpolated-table"]').should('be.visible');
    cy.get('[data-testid="compare-interpolated-table"] thead th').should(
      'have.length.greaterThan',
      1,
    );
  });

  it('displays editable target interactivity input boxes', () => {
    cy.get('[data-testid^="compare-table-target-"]').should('have.length.greaterThan', 0);
    cy.get('[data-testid="compare-table-target-0"]').should('have.attr', 'type', 'text');
  });

  it('shows metric rows (throughput, cost, power, concurrency)', () => {
    const expectedMetrics = ['Throughput (tok/s/gpu)', 'Cost ($/M tok)', 'tok/s/MW', 'Concurrency'];
    for (const metric of expectedMetrics) {
      cy.get('[data-testid="compare-interpolated-table"] tbody').should('contain.text', metric);
    }
  });

  it('shows GPU labels in table cells', () => {
    cy.get('[data-testid="compare-interpolated-table"] tbody td').should('contain.text', 'GB200');
    cy.get('[data-testid="compare-interpolated-table"] tbody td').should('contain.text', 'H100');
  });

  it('commits target value when pressing Enter', () => {
    cy.get('[data-testid="compare-table-target-0"]').clear().type('25{enter}');
    cy.get('[data-testid="compare-table-target-0"]').should('have.value', '25');
    cy.get('[data-testid="compare-interpolated-table"] tbody').should('contain.text', 'Throughput');
  });

  it('updates interpolated values when a target input is changed', () => {
    cy.get('[data-testid="compare-table-target-0"]').clear().type('25').blur();
    cy.get('[data-testid="compare-table-target-0"]').should('have.value', '25');
  });

  it('flags out-of-range interactivity inputs and clears flag after blur commit', () => {
    cy.get('[data-testid="compare-table-target-0"]').clear().type('999999999');
    cy.get('[data-testid="compare-table-target-0"]').should(
      'have.attr',
      'data-compare-target-oob',
      'true',
    );
    cy.get('[data-testid="compare-table-target-0"]').blur();
    cy.get('[data-testid="compare-table-target-0"]').should(
      'not.have.attr',
      'data-compare-target-oob',
    );
  });

  it('displays the descriptive header text', () => {
    cy.get('[data-testid="compare-interpolated-table"]')
      .parent()
      .should('contain.text', 'Interpolated from real benchmark data');
  });
});
