describe('Embed — Scatter Chart', () => {
  describe('default URL', () => {
    before(() => {
      cy.visit('/embed/scatter');
    });

    it('renders the embed root container', () => {
      cy.get('[data-testid="embed-root"]').should('exist');
    });

    it('does not render the site header or footer', () => {
      cy.get('[data-testid="header"]').should('not.exist');
      cy.get('[data-testid="footer"]').should('not.exist');
    });

    it('renders an SVG chart with real data', () => {
      cy.get('[data-testid="embed-scatter-figure"]', { timeout: 15000 }).should('exist');
      cy.get('[data-testid="embed-scatter-figure"]').find('svg').should('exist');
      cy.contains('No data available').should('not.exist');
    });

    it('shows the SemiAnalysis InferenceX attribution link', () => {
      cy.get('[data-testid="embed-attribution"]')
        .should('exist')
        .should('contain.text', 'SemiAnalysis InferenceX');
    });

    it('attribution link points to the canonical /inference URL with seeded params', () => {
      cy.get('[data-testid="embed-attribution"]')
        .should('have.attr', 'href')
        .and('include', '/inference?')
        .and('include', 'g_model=DeepSeek-R1-0528')
        .and('include', 'i_metric=y_tpPerGpu');
    });

    it('does not show the Shift+Scroll instructions text', () => {
      cy.get('.no-export').should('have.text', '');
    });

    it('has robots noindex meta tag', () => {
      cy.get('meta[name="robots"]').should('have.attr', 'content').and('include', 'noindex');
    });
  });

  describe('custom params', () => {
    before(() => {
      cy.visit('/embed/scatter?model=dsr1&isl=8192&osl=1024&precisions=fp4&y=costh');
    });

    it('renders chart with the custom y metric', () => {
      cy.get('[data-testid="embed-scatter-figure"]', { timeout: 15000 }).should('exist');
      cy.contains('No data available').should('not.exist');
    });

    it('canonical link reflects the y metric override', () => {
      cy.get('[data-testid="embed-attribution"]')
        .should('have.attr', 'href')
        .and('include', 'i_metric=y_costh');
    });
  });

  describe('gpus param filters the legend', () => {
    before(() => {
      cy.visit('/embed/scatter?gpus=b200_sglang');
    });

    it('renders chart and legend reflects the active GPU set', () => {
      cy.get('[data-testid="embed-scatter-figure"]', { timeout: 15000 }).should('exist');
      cy.get('[data-testid="embed-scatter-figure"]').find('svg').should('exist');
      cy.contains('No data available').should('not.exist');
    });
  });

  describe('CSP headers', () => {
    it('embed routes allow framing from any origin', () => {
      cy.request('/embed/scatter').then((resp) => {
        const csp = resp.headers['content-security-policy'] as string;
        expect(csp).to.include('frame-ancestors *');
      });
    });

    it('non-embed routes restrict framing to self', () => {
      cy.request('/').then((resp) => {
        const csp = resp.headers['content-security-policy'] as string;
        expect(csp).to.include("frame-ancestors 'self'");
      });
    });
  });

  describe('viewport responsiveness', () => {
    it('renders chart at 600×500 (narrow iframe)', () => {
      cy.viewport(600, 500);
      cy.visit('/embed/scatter');
      cy.get('[data-testid="embed-scatter-figure"]', { timeout: 15000 }).should('exist');
      cy.get('[data-testid="embed-scatter-figure"]').find('svg').should('exist');
      cy.get('[data-testid="embed-legend-panel"]').should('be.visible');
    });

    it('renders chart at 800×600', () => {
      cy.viewport(800, 600);
      cy.visit('/embed/scatter');
      cy.get('[data-testid="embed-scatter-figure"]', { timeout: 15000 }).should('exist');
      cy.get('[data-testid="embed-scatter-figure"]').find('svg').should('exist');
      cy.get('[data-testid="embed-legend-panel"]').should('be.visible');
    });
  });

  describe('unofficial run overlay', () => {
    it('renders overlay points when unofficialrun param is provided', () => {
      cy.intercept('GET', '/api/unofficial-run*', {
        statusCode: 200,
        body: {
          runInfos: [
            {
              id: 99999,
              branch: 'test-branch',
              url: 'https://github.com/test/repo/actions/runs/99999',
            },
          ],
          benchmarks: [
            {
              model: 'DeepSeek-R1-0528',
              sequence: '8k/1k',
              chart_type: 'e2e',
              precision: 'fp4',
              hw_type: 'b200_sglang',
              tp: 8,
              concurrency: 64,
              ttft_ms: 300,
              tpot_ms: 10,
              e2e_latency_ms: 600,
              total_throughput: 2000,
              throughput_per_gpu: 250,
              run_url: 'https://github.com/test/repo/actions/runs/99999',
            },
          ],
        },
      }).as('unofficialRun');

      cy.visit('/embed/scatter?unofficialrun=99999');
      cy.get('[data-testid="embed-scatter-figure"]', { timeout: 15000 }).should('exist');
      cy.get('[data-testid="embed-scatter-figure"]').find('svg').should('exist');
    });
  });
});
