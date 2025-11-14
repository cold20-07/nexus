import React from 'react';

/**
 * SkeletonLoader Component
 * Provides loading skeleton UI for various content types
 */

/**
 * File List Skeleton
 * Used in DocumentViewer while files are loading
 */
export const FileListSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 animate-pulse"
        >
          <div className="flex items-center space-x-4 flex-1">
            {/* Icon skeleton */}
            <div className="w-8 h-8 bg-slate-300 rounded" />
            
            {/* Content skeleton */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-300 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          </div>
          
          {/* Actions skeleton */}
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-slate-300 rounded-lg" />
            <div className="w-9 h-9 bg-slate-300 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Table Row Skeleton
 * Used in FormSubmissions table while loading
 */
export const TableRowSkeleton = ({ columns = 7, rows = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="animate-pulse">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
              <div className="h-4 bg-slate-200 rounded w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

/**
 * Form Data Skeleton
 * Used in FormDataParser while parsing
 */
export const FormDataSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <div key={sectionIndex} className="space-y-3">
          {/* Section title */}
          <div className="h-6 bg-slate-300 rounded w-1/4 mb-4" />
          
          {/* Fields */}
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, fieldIndex) => (
              <div key={fieldIndex} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="sm:col-span-2 h-4 bg-slate-200 rounded w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Card Skeleton
 * Generic card skeleton for dashboard cards
 */
export const CardSkeleton = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 animate-pulse"
        >
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-8 bg-slate-300 rounded w-1/2" />
            <div className="h-3 bg-slate-200 rounded w-2/3" />
          </div>
        </div>
      ))}
    </>
  );
};

export default {
  FileListSkeleton,
  TableRowSkeleton,
  FormDataSkeleton,
  CardSkeleton
};
