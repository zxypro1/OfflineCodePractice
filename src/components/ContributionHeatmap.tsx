import React, { useMemo } from 'react';
import { Tooltip, Text } from '@mantine/core';

type ContributionHeatmapProps = {
  data: Array<{ date: string; value: number }>;
  startDate: Date;
  endDate: Date;
  colorScale?: (value: number, max: number) => string;
};

// GitHub-style color scale
const getColor = (value: number, max: number): string => {
  if (value === 0) return '#ebedf0';
  const intensity = value / max;
  if (intensity < 0.25) return '#9be9a8';
  if (intensity < 0.5) return '#40c463';
  if (intensity < 0.75) return '#30a14e';
  return '#216e39';
};

export function ContributionHeatmap({
  data,
  startDate,
  endDate,
  colorScale = getColor,
}: ContributionHeatmapProps) {
  const { cells, maxValue, monthLabels } = useMemo(() => {
    const dataMap = new Map(data.map((d) => [d.date, d.value]));
    const maxValue = Math.max(...data.map((d) => d.value), 1);

    // Generate all dates in range
    const cells: Array<{ date: Date; value: number; dateStr: string }> = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      cells.push({
        date: new Date(current),
        value: dataMap.get(dateStr) || 0,
        dateStr,
      });
      current.setDate(current.getDate() + 1);
    }

    // Generate month labels
    const monthLabels: Array<{ month: number; week: number }> = [];
    const firstDate = new Date(startDate);
    let currentWeek = 0;
    let lastMonth = -1;

    cells.forEach((cell, index) => {
      const week = Math.floor(index / 7);
      const month = cell.date.getMonth();
      if (month !== lastMonth && week !== currentWeek) {
        monthLabels.push({ month, week });
        lastMonth = month;
        currentWeek = week;
      }
    });

    return { cells, maxValue, monthLabels };
  }, [data, startDate, endDate]);

  // Group cells into weeks (Sunday to Saturday)
  const weeks = useMemo(() => {
    if (cells.length === 0) return [];
    
    type WeekCell = { date: Date; value: number; dateStr: string } | null;
    const weekArrays: WeekCell[][] = [];
    let currentWeek: WeekCell[] = [];
    
    // Find the first Sunday before or on startDate
    const firstDate = new Date(startDate);
    const firstDayOfWeek = firstDate.getDay(); // 0 = Sunday
    
    // Pad the first week if it doesn't start on Sunday
    if (firstDayOfWeek !== 0) {
      const padding = firstDayOfWeek;
      currentWeek = new Array(padding).fill(null);
    }
    
    cells.forEach((cell) => {
      const dayOfWeek = cell.date.getDay();
      
      // If it's Sunday and we have a week, start a new week
      if (dayOfWeek === 0 && currentWeek.length > 0 && currentWeek.some(c => c !== null)) {
        // Pad current week to 7 days if needed
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        weekArrays.push(currentWeek);
        currentWeek = [];
      }
      
      currentWeek.push(cell);
    });

    // Add remaining cells and pad to 7 days
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weekArrays.push(currentWeek);
    }

    return weekArrays;
  }, [cells, startDate]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
      {/* Day labels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '20px' }}>
        {dayNames.map((day, idx) => {
          // Only show Mon and Wed for space
          if (idx === 1 || idx === 3) {
            return (
              <div
                key={day}
                style={{
                  height: '11px',
                  fontSize: '10px',
                  color: 'var(--mantine-color-dimmed)',
                  lineHeight: '11px',
                }}
              >
                {day}
              </div>
            );
          }
          return <div key={day} style={{ height: '11px' }} />;
        })}
      </div>

      {/* Heatmap grid */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Month labels */}
        <div style={{ display: 'flex', gap: '3px', marginBottom: '4px', height: '16px', position: 'relative' }}>
          {weeks.map((week, weekIdx) => {
            // Find first non-null cell in this week
            const firstCell = week?.find((c) => c !== null);
            
            // If this week has no data (all null), return empty div
            if (!firstCell) {
              return <div key={weekIdx} style={{ width: '11px' }} />;
            }
            
            const month = firstCell.date.getMonth();
            const dayOfMonth = firstCell.date.getDate();
            
            // Find previous week's month
            let prevMonth: number | undefined = undefined;
            for (let i = weekIdx - 1; i >= 0; i--) {
              const prevCell = weeks[i]?.find((c) => c !== null);
              if (prevCell) {
                prevMonth = prevCell.date.getMonth();
                break;
              }
            }
            
            // Show label if:
            // 1. First week with data, OR
            // 2. Day is in first week of month (<= 7), OR
            // 3. Month changed from previous week
            const shouldShowLabel = 
              weekIdx === 0 || 
              dayOfMonth <= 7 || 
              (prevMonth !== undefined && prevMonth !== month);
            
            if (shouldShowLabel) {
              return (
                <div
                  key={weekIdx}
                  style={{
                    width: '11px',
                    fontSize: '10px',
                    color: 'var(--mantine-color-dimmed)',
                    textAlign: 'left',
                    paddingLeft: '2px',
                  }}
                >
                  {monthNames[month]}
                </div>
              );
            }

            return <div key={weekIdx} style={{ width: '11px' }} />;
          })}
        </div>

        {/* Heatmap cells */}
        <div style={{ display: 'flex', gap: '3px' }}>
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {week?.map((cell, dayIdx) => {
                if (cell === null) {
                  return <div key={dayIdx} style={{ width: '11px', height: '11px' }} />;
                }

                const color = colorScale(cell.value, maxValue);
                const dateStr = cell.date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <Tooltip
                    key={`${cell.dateStr}-${dayIdx}`}
                    label={
                      <div>
                        <Text size="xs" fw={600}>
                          {cell.value} {cell.value === 1 ? 'submission' : 'submissions'}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {dateStr}
                        </Text>
                      </div>
                    }
                    position="top"
                  >
                    <div
                      style={{
                        width: '11px',
                        height: '11px',
                        backgroundColor: color,
                        borderRadius: '2px',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                    />
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
