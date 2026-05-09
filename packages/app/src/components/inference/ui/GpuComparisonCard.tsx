'use client';

import { useMemo } from 'react';

import { track } from '@/lib/analytics';

import { useInference } from '@/components/inference/InferenceContext';
import ComparisonChangelog from './ComparisonChangelog';
import { useComparisonChangelogs } from '@/hooks/api/use-comparison-changelogs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { LabelWithTooltip } from '@/components/ui/label-with-tooltip';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const GPU_OPTIONS_GROUP = 'GPUs';

function buildNextGpuSelection(
  selectedGPUs: string[],
  slotIndex: 0 | 1,
  rawValue: string,
): string[] {
  const value = rawValue.trim();
  const prev0 = selectedGPUs[0] ?? '';
  const prev1 = selectedGPUs[1] ?? '';
  let next0 = slotIndex === 0 ? value : prev0;
  let next1 = slotIndex === 1 ? value : prev1;
  if (next0 && next1 && next0 === next1) {
    if (slotIndex === 0) next1 = '';
    else next0 = '';
  }
  // Keep slot order: never leave GPU 1 empty while GPU 2 is set (compact upward).
  if (!next0 && next1) {
    next0 = next1;
    next1 = '';
  }
  const out: string[] = [];
  if (next0) out.push(next0);
  if (next1) out.push(next1);
  return out;
}

export default function GpuComparisonCard() {
  const {
    selectedGPUs,
    setSelectedGPUs,
    availableGPUs,
    selectedDateRange,
    setSelectedDateRange,
    dateRangeAvailableDates,
    isCheckingAvailableDates,
    selectedModel,
    selectedSequence,
    selectedPrecisions,
    selectedYAxisMetric,
    selectedDates,
    setSelectedDates,
  } = useInference();

  const {
    changelogs,
    loading: changelogsLoading,
    totalDatesQueried,
  } = useComparisonChangelogs(selectedGPUs, selectedDateRange, dateRangeAvailableDates);

  const gpu0 = selectedGPUs[0] ?? '';
  const gpu1 = selectedGPUs[1] ?? '';
  const comparisonReady = selectedGPUs.length === 2;

  const options0 = useMemo(() => {
    const filtered = gpu1 ? availableGPUs.filter((o) => o.value !== gpu1) : availableGPUs;
    return [{ label: GPU_OPTIONS_GROUP, options: filtered }];
  }, [availableGPUs, gpu1]);

  const options1 = useMemo(() => {
    const filtered = gpu0 ? availableGPUs.filter((o) => o.value !== gpu0) : availableGPUs;
    return [{ label: GPU_OPTIONS_GROUP, options: filtered }];
  }, [availableGPUs, gpu0]);

  const trackCombinedFilters = () => {
    if (selectedModel && selectedSequence && selectedPrecisions.length > 0 && selectedYAxisMetric) {
      track('inference_filters_changed', {
        model: selectedModel,
        sequence: selectedSequence,
        precision: selectedPrecisions.join(','),
        yAxisMetric: selectedYAxisMetric,
      });
    }
  };

  const handleSlotChange = (slot: 0 | 1, value: string) => {
    const next = buildNextGpuSelection(selectedGPUs, slot, value);
    setSelectedGPUs(next);
    track('inference_gpu_comparison_slot_selected', {
      slot: slot + 1,
      value: value || '',
      gpus: next.join(','),
    });
    setTimeout(trackCombinedFilters, 0);
  };

  const handleDateRangeChange = (range: { startDate: string; endDate: string }) => {
    setSelectedDateRange(range);
    track('inference_date_range_changed', {
      startDate: range.startDate,
      endDate: range.endDate,
    });
  };

  const clearSlot = (slot: 0 | 1) => {
    handleSlotChange(slot, '');
  };

  return (
    <Card data-testid="gpu-comparison-card">
      <TooltipProvider delayDuration={0}>
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">GPU Comparison</h2>
            <p className="text-muted-foreground text-sm mb-1">
              Compare historical performance for two GPU configurations over a date range. Select
              one configuration in each dropdown — both are required before choosing dates or
              viewing the comparison chart.
            </p>
            {!comparisonReady && (
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Select two different GPU configurations to enable comparison.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <LabelWithTooltip
                htmlFor="gpu-comparison-slot-1"
                label="GPU 1"
                tooltip="First hardware configuration for side-by-side historical comparison."
              />
              <div className="flex gap-2 items-start">
                <div className="flex-1 min-w-0">
                  <SearchableSelect
                    triggerId="gpu-comparison-slot-1"
                    triggerTestId="gpu-comparison-select-1"
                    value={gpu0}
                    onValueChange={(v) => handleSlotChange(0, v)}
                    placeholder="Select GPU configuration"
                    trackPrefix="inference_gpu_comparison_1"
                    groups={options0}
                  />
                </div>
                {gpu0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 mt-0.5"
                    aria-label="Clear GPU 1"
                    onClick={() => clearSlot(0)}
                  >
                    <X className="size-4" />
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col space-y-1.5">
              <LabelWithTooltip
                htmlFor="gpu-comparison-slot-2"
                label="GPU 2"
                tooltip="Second hardware configuration for side-by-side historical comparison."
              />
              <div className="flex gap-2 items-start">
                <div className="flex-1 min-w-0">
                  <SearchableSelect
                    triggerId="gpu-comparison-slot-2"
                    triggerTestId="gpu-comparison-select-2"
                    value={gpu1}
                    onValueChange={(v) => handleSlotChange(1, v)}
                    placeholder="Select GPU configuration"
                    trackPrefix="inference_gpu_comparison_2"
                    groups={options1}
                  />
                </div>
                {gpu1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 mt-0.5"
                    aria-label="Clear GPU 2"
                    onClick={() => clearSlot(1)}
                  >
                    <X className="size-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {comparisonReady && (
            <div className="flex flex-col space-y-1.5 md:max-w-xl">
              <LabelWithTooltip
                htmlFor="gpu-comparison-date-picker"
                label="Comparison Date Range"
                tooltip="Select the start and end dates for the historical comparison. The chart will show performance data for the selected GPU configs across this time range."
              />
              <DateRangePicker
                dateRange={selectedDateRange}
                onChange={handleDateRangeChange}
                placeholder="Select date range"
                availableDates={dateRangeAvailableDates}
                isCheckingAvailableDates={isCheckingAvailableDates}
                className={
                  !selectedDateRange.startDate || !selectedDateRange.endDate
                    ? 'border-red-500 ring-4 ring-red-500/40 animate-pulse'
                    : ''
                }
              />
            </div>
          )}

          {comparisonReady && (
            <div className="border-t border-border pt-4 mt-1">
              <ComparisonChangelog
                changelogs={changelogs}
                selectedGPUs={selectedGPUs}
                selectedPrecisions={selectedPrecisions}
                loading={changelogsLoading}
                totalDatesQueried={totalDatesQueried}
                selectedDates={selectedDates}
                selectedDateRange={selectedDateRange}
                onAddDate={(date) => {
                  if (!selectedDates.includes(date)) {
                    setSelectedDates([...selectedDates, date]);
                  }
                }}
                onRemoveDate={(date) => {
                  setSelectedDates(selectedDates.filter((d) => d !== date));
                }}
                onAddAllDates={(dates) => {
                  const merged = [...new Set([...selectedDates, ...dates])];
                  setSelectedDates(merged);
                }}
                firstAvailableDate={dateRangeAvailableDates[0]}
              />
            </div>
          )}
        </div>
      </TooltipProvider>
    </Card>
  );
}
