'use client';

import { useMemo, useState } from 'react';

import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

import { useInference } from '@/components/inference/InferenceContext';
import { MAX_COMPARISON_GPUS } from '@/components/inference/utils/normalize-comparison-gpus';
import { useComparisonChangelogs } from '@/hooks/api/use-comparison-changelogs';
import { DateRangePicker, getQuickDateRanges } from '@/components/ui/date-range-picker';
import { LabelWithTooltip } from '@/components/ui/label-with-tooltip';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

import ComparisonChangelog from './ComparisonChangelog';

const GPU_OPTIONS_GROUP = 'GPUs';

const MIN_SLOTS = 2;

const SLOT_INDICES = Array.from({ length: MAX_COMPARISON_GPUS }, (_, i) => i);

function buildSelectionAfterSlotChange(
  selectedGPUs: string[],
  slotIndex: number,
  rawValue: string,
): string[] {
  const v = rawValue.trim();
  const slots: string[] = [];
  for (let j = 0; j < MAX_COMPARISON_GPUS; j++) {
    slots.push(j === slotIndex ? v : (selectedGPUs[j] ?? ''));
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of slots) {
    if (!x) continue;
    if (seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
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

  const comparisonReady = selectedGPUs.length >= 2;

  const [slotCount, setSlotCount] = useState(() => Math.max(MIN_SLOTS, selectedGPUs.length));

  const optionsBySlot = useMemo(
    () =>
      SLOT_INDICES.map((i) => ({
        label: GPU_OPTIONS_GROUP,
        options: availableGPUs.filter(
          (o) => !selectedGPUs.some((g, j) => j !== i && g === o.value),
        ),
      })),
    [availableGPUs, selectedGPUs],
  );

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

  const handleSlotChange = (slotIndex: number, value: string) => {
    const next = buildSelectionAfterSlotChange(selectedGPUs, slotIndex, value);
    setSelectedGPUs(next);
    track('inference_gpu_comparison_slot_selected', {
      slot: slotIndex + 1,
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

  const clearSlot = (slotIndex: number) => {
    if (slotIndex < MIN_SLOTS) {
      handleSlotChange(slotIndex, '');
      return;
    }
    const next = selectedGPUs.filter((_, j) => j !== slotIndex);
    setSelectedGPUs(next);
    setSlotCount((c) => Math.max(MIN_SLOTS, c - 1));
    track('inference_gpu_comparison_slot_removed', {
      slot: slotIndex + 1,
      gpus: next.join(','),
    });
  };

  const addSlot = () => {
    setSlotCount((c) => Math.min(MAX_COMPARISON_GPUS, c + 1));
    track('inference_gpu_comparison_slot_added', { newSlotCount: slotCount + 1 });
  };

  const canAddSlot = slotCount < MAX_COMPARISON_GPUS && slotCount < availableGPUs.length;

  const slotDisabled = (i: number) => i > 0 && selectedGPUs.length < i;

  return (
    <Card data-testid="gpu-comparison-card">
      <TooltipProvider delayDuration={0}>
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">GPU Comparison</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SLOT_INDICES.slice(0, slotCount).map((i) => {
              const value = selectedGPUs[i] ?? '';
              const slotGroups = [optionsBySlot[i]!];
              const isOptional = i >= MIN_SLOTS;
              return (
                <div key={i} className="flex flex-col space-y-1.5">
                  <LabelWithTooltip
                    htmlFor={`gpu-comparison-slot-${i + 1}`}
                    label={`GPU ${i + 1}`}
                    tooltip={`Hardware configuration ${i + 1} for historical comparison (up to ${MAX_COMPARISON_GPUS} GPUs).`}
                  />
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 min-w-0">
                      <SearchableSelect
                        triggerId={`gpu-comparison-slot-${i + 1}`}
                        triggerTestId={`gpu-comparison-select-${i + 1}`}
                        value={value}
                        onValueChange={(v) => handleSlotChange(i, v)}
                        placeholder="Select GPU configuration"
                        trackPrefix={`inference_gpu_comparison_${i + 1}`}
                        groups={slotGroups}
                        disabled={slotDisabled(i)}
                      />
                    </div>
                    {(value || isOptional) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 mt-0.5"
                        aria-label={
                          isOptional && !value ? `Remove GPU ${i + 1} slot` : `Clear GPU ${i + 1}`
                        }
                        data-testid={`gpu-comparison-clear-${i + 1}`}
                        disabled={slotDisabled(i)}
                        onClick={() => clearSlot(i)}
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {canAddSlot && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              data-testid="gpu-comparison-add-slot"
              onClick={addSlot}
            >
              <Plus className="size-4 mr-1.5" />
              Add GPU
            </Button>
          )}

          <div
            className={cn(
              'flex flex-col space-y-1.5 md:max-w-xl',
              !comparisonReady && 'opacity-60',
            )}
          >
            <LabelWithTooltip
              htmlFor="gpu-comparison-date-picker"
              label="Comparison Date Range"
              tooltip="Select the start and end dates for the historical comparison. The chart will show performance data for the selected GPU configs across this time range."
            />
            <DateRangePicker
              triggerId="gpu-comparison-date-picker"
              dateRange={selectedDateRange}
              onChange={handleDateRangeChange}
              placeholder="Select date range"
              availableDates={dateRangeAvailableDates}
              isCheckingAvailableDates={isCheckingAvailableDates}
              disabled={!comparisonReady}
            />
            <div className="flex flex-wrap gap-1.5" data-testid="date-range-shortcuts">
              {getQuickDateRanges(dateRangeAvailableDates).map(({ label, range }) => {
                const isActive =
                  selectedDateRange.startDate === range.startDate &&
                  selectedDateRange.endDate === range.endDate;
                return (
                  <Button
                    key={label}
                    type="button"
                    variant={isActive ? 'secondary' : 'outline'}
                    size="sm"
                    disabled={!comparisonReady}
                    data-testid={`date-shortcut-${label.toLowerCase().replaceAll(/\s+/gu, '-')}`}
                    onClick={() => {
                      handleDateRangeChange(range);
                      track('inference_date_range_quick_select', {
                        label,
                        startDate: range.startDate,
                        endDate: range.endDate,
                      });
                    }}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          </div>

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
                expandWhenActive={
                  comparisonReady &&
                  Boolean(selectedDateRange.startDate && selectedDateRange.endDate)
                }
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
