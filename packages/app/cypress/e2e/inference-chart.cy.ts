describe('Inference Chart', () => {
  before(() => {
    cy.window().then((win) => {
      win.localStorage.setItem('inferencex-star-modal-dismissed', String(Date.now()));
    });
    cy.visit('/inference');
  });

  it('renders the inference chart display wrapper', () => {
    cy.get('[data-testid="inference-chart-display"]').should('exist');
  });

  it('shows the Inference Performance heading', () => {
    cy.contains('h2', 'Inference Performance').should('be.visible');
  });

  it('renders at least one chart figure', () => {
    cy.get('[data-testid="chart-figure"]').should('have.length.at.least', 1);
  });

  it('renders at least one scatter graph with an SVG', () => {
    cy.get('[data-testid="scatter-graph"]').should('have.length.at.least', 1);
    cy.get('[data-testid="scatter-graph"]').first().find('svg').should('exist');
  });

  it('SVG contains data point circles', () => {
    cy.get('[data-testid="scatter-graph"]')
      .first()
      .find('svg circle')
      .should('have.length.greaterThan', 0);
  });

  it('does not show "No data available" when data loads', () => {
    cy.get('[data-testid="inference-chart-display"]').should('exist');
    cy.contains('No data available').should('not.exist');
  });

  it('shows a chart heading with metric title', () => {
    cy.get('[data-testid="chart-figure"]').first().find('h2').should('not.be.empty');
  });

  it('shows chart caption with model and source info', () => {
    cy.get('[data-testid="chart-figure"]')
      .first()
      .find('figcaption p')
      .should('contain', 'SemiAnalysis InferenceX');
  });

  it('shows the sidebar legend for GPU types', () => {
    cy.get('.sidebar-legend').should('be.visible');
  });
});

describe('GPU Comparison Card', () => {
  beforeEach(() => {
    cy.visit('/inference', {
      onBeforeLoad(win) {
        win.localStorage.setItem('inferencex-star-modal-dismissed', String(Date.now()));
      },
    });
    cy.get('[data-testid="gpu-comparison-card"]').should('be.visible');
  });

  it('renders the GPU comparison card with two slot selectors', () => {
    cy.get('[data-testid="gpu-comparison-select-1"]').should('be.visible');
    cy.get('[data-testid="gpu-comparison-select-2"]').should('be.visible');
    cy.get('[data-testid="gpu-comparison-select-3"]').should('not.exist');
  });

  it('shows date range shortcuts that are disabled until two GPUs are selected', () => {
    cy.get('[data-testid="date-range-shortcuts"]').should('be.visible');
    cy.get('[data-testid="date-shortcut-all-time"]').should('be.disabled');
  });

  it('selects two GPUs and verifies date range auto-defaults', () => {
    cy.get('[data-testid="gpu-comparison-select-1"]').click();
    cy.get('[role="option"]').first().click();

    cy.get('[data-testid="gpu-comparison-select-2"]').click();
    cy.get('[role="option"]').first().click();

    cy.get('[data-testid="date-shortcut-all-time"]').should('not.be.disabled');
    cy.get('#gpu-comparison-date-picker').should('not.be.disabled');
  });

  it('Add GPU button reveals a third slot', () => {
    cy.get('[data-testid="gpu-comparison-add-slot"]').should('be.visible').click();
    cy.get('[data-testid="gpu-comparison-select-3"]').should('be.visible');
  });
});
