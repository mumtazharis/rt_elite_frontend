// src/components/Common/TanStackTable.tsx
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,      
  type PaginationState,
} from '@tanstack/react-table';

interface TanStackTableProps<T extends object> {
  columns: ColumnDef<T, any>[];
  data: T[];
  loading: boolean;
  totalRecords: number;
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  globalFilter: string;
  setGlobalFilter: React.Dispatch<React.SetStateAction<string>>;
  getRowClass?: (row: T) => string;
}

const TanStackTable = <T extends object>({
  columns,
  data,
  loading,
  totalRecords,
  pagination,
  setPagination,
  globalFilter,
  setGlobalFilter,
  getRowClass,
}: TanStackTableProps<T>) => {
  
  // Inisialisasi TanStack Table
  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(totalRecords / pagination.pageSize),
    state: {
      pagination,
      globalFilter,
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // Beri tahu TanStack bahwa pagination di-handle oleh server (Yajra)
    manualFiltering: true,  // Beri tahu TanStack bahwa filter di-handle oleh server (Yajra)
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      {/* Search Bar */}
      <div className="p-5 border-b border-slate-200 flex justify-between items-center">
        <select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className="border border-slate-300 rounded px-2 py-1 focus:outline-none"
          >
            {[10, 20, 50, 100].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        <input
          type="text"
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder="Cari data..."
          className="w-full sm:w-64 px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse relative">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-slate-50 text-slate-600 text-sm uppercase tracking-wider border-b border-slate-200">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-6 py-4 font-medium">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">
                  Memuat data...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">
                  Data tidak ditemukan.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr 
                  key={row.id} 
                  className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${getRowClass ? getRowClass(row.original) : ''}`}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-600">
        <div>
          Menampilkan <span className="font-semibold">{data.length === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1}</span> hingga <span className="font-semibold">{Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRecords)}</span> dari <span className="font-semibold">{totalRecords}</span> entri
        </div>
        
        <div className="flex items-center gap-2">
          

          <div className="flex border border-slate-300 rounded-md overflow-hidden">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage() || loading}
              className="px-3 py-1 bg-white hover:bg-slate-100 disabled:bg-slate-50 disabled:text-slate-400 border-r border-slate-300 transition-colors"
            >
              Prev
            </button>
            <span className="px-4 py-1 bg-slate-50 font-medium">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage() || loading}
              className="px-3 py-1 bg-white hover:bg-slate-100 disabled:bg-slate-50 disabled:text-slate-400 border-l border-slate-300 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TanStackTable;