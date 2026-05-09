import InferenceChartControls from '@/components/inference/ui/ChartControls';
import GpuComparisonCard from '@/components/inference/ui/GpuComparisonCard';
import { mountWithProviders } from '../support/test-utils';

describe('Inference ChartControls', () => {
  beforeEach(() => {
    mountWithProviders(<InferenceChartControls />, { inference: {} });
  });

  it('renders the model selector with the current model', () => {
    // Default mock: selectedModel = Model.DeepSeek_R1 -> "DeepSeek R1 0528"
    cy.get('#model-select').should('be.visible');
    cy.get('#model-select').should('contain.text', 'DeepSeek R1 0528');
  });

  it('renders the sequence selector with the current sequence', () => {
    // Default mock: selectedSequence = Sequence.EightK_OneK -> label "8K / 1K"
    cy.get('#sequence-select').should('be.visible');
    cy.get('#sequence-select').should('contain.text', '8K / 1K');
  });

  it('renders the precision multi-select with the current precision', () => {
    // Default mock: selectedPrecisions = [Precision.FP4] -> label "FP4"
    cy.get('[data-testid="precision-multiselect"]').should('be.visible');
    cy.get('[data-testid="precision-multiselect"]').should('contain.text', 'FP4');
  });

  it('renders the Y-axis metric selector', () => {
    cy.get('[data-testid="yaxis-metric-selector"]').should('be.visible');
  });

  it('Y-axis metric selector shows grouped options', () => {
    cy.get('[data-testid="yaxis-metric-selector"]').click();
    // Should contain at least the "Throughput" group
    cy.contains('Throughput').should('exist');
  });

  it('calls setSelectedYAxisMetric when a Y-axis option is chosen', () => {
    cy.get('[data-testid="yaxis-metric-selector"]').click();
    // "Throughput per GPU" is the label for y_tpPerGpu — pick a different one
    cy.contains('[role="option"]', 'Output Token Throughput per GPU').click();
    cy.get('@setSelectedYAxisMetric').should('have.been.calledOnce');
  });

  it('does not render GPU comparison date controls (moved to GpuComparisonCard)', () => {
    cy.contains('Comparison Date Range').should('not.exist');
    cy.contains('GPU Comparison').should('not.exist');
  });
});

describe('GpuComparisonCard', () => {
  it('renders two GPU slot selectors and no date range until two GPUs are selected', () => {
    mountWithProviders(<GpuComparisonCard />, {
      inference: {
        selectedGPUs: [],
        availableGPUs: [
          { value: 'h100_sglang', label: 'H100 SGLang' },
          { value: 'b200_sglang', label: 'B200 SGLang' },
        ],
      },
    });

    cy.get('[data-testid="gpu-comparison-card"]').should('be.visible');
    cy.contains('GPU Comparison').should('be.visible');
    cy.get('[data-testid="gpu-comparison-select-1"]').should('be.visible');
    cy.get('[data-testid="gpu-comparison-select-2"]').should('be.visible');
    cy.contains('Comparison Date Range').should('not.exist');
  });

  it('shows Comparison Date Range when two GPUs are selected', () => {
    mountWithProviders(<GpuComparisonCard />, {
      inference: {
        selectedGPUs: ['h100_sglang', 'b200_sglang'],
        selectedDateRange: { startDate: '', endDate: '' },
        availableGPUs: [
          { value: 'h100_sglang', label: 'H100 SGLang' },
          { value: 'b200_sglang', label: 'B200 SGLang' },
        ],
      },
    });

    cy.contains('Comparison Date Range').should('be.visible');
  });
});
