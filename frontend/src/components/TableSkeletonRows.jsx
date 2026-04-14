import React from 'react';

const WIDTH_PATTERN = ['w-44', 'w-36', 'w-28', 'w-24', 'w-20', 'w-32'];

export default function TableSkeletonRows({
  rowCount = 5,
  colCount = 4,
  colSpan = 0,
}) {
  const rows = Math.max(1, Number(rowCount) || 1);
  const cols = Math.max(1, Number(colCount) || 1);

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={`table-skeleton-row-${rowIndex}`} className="table-skeleton-row">
          {colSpan > 0 ? (
            <td colSpan={colSpan} className="px-6 py-4">
              <div className="table-skeleton-bar w-full"></div>
            </td>
          ) : (
            Array.from({ length: cols }).map((__, colIndex) => (
              <td key={`table-skeleton-cell-${rowIndex}-${colIndex}`} className="px-6 py-4">
                <div className={`table-skeleton-bar ${WIDTH_PATTERN[colIndex % WIDTH_PATTERN.length]}`}></div>
              </td>
            ))
          )}
        </tr>
      ))}
    </>
  );
}
