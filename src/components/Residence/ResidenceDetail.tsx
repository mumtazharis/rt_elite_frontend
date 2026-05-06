// src/components/Residence/ResidenceDetail.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import TanStackTable from '../Common/TanStackTable';
import { ChevronLeft, Plus } from 'lucide-react';
import Swal from 'sweetalert2';
import OccupantFormModal from './OccupantFormModal';

interface Occupant {
  id: number;
  is_active: boolean | number;
  occupant_type: string;
  is_primary_resident: boolean | number;
  move_in_date: string;
  move_out_date: string;
  nama_penghuni: string;
}

const ResidenceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const residence = location.state?.residence;
  
  const [data, setData] = useState<Occupant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State TanStack
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0, 
    pageSize: 10,
  });

  // Debounce Pencarian
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setDebouncedFilter(globalFilter);
      if (globalFilter !== '') {
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [globalFilter]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const token = Cookies.get('access_token');
        const apiUrl = import.meta.env.VITE_API_BASE_URL;

        const params = new URLSearchParams({
          draw: '1',
          start: (pagination.pageIndex * pagination.pageSize).toString(),
          length: pagination.pageSize.toString(),
          'search[value]': debouncedFilter,
        });

        const response = await fetch(`${apiUrl}/api/residences/${id}/occupants?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const result = await response.json();
        
        setData(result.data || []);
        setTotalRecords(result.recordsFiltered || 0); 

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, pagination.pageIndex, pagination.pageSize, debouncedFilter, refreshTrigger]);

  const handleAddSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: 'Penghuni berhasil ditambahkan.',
      confirmButtonColor: '#2563eb',
    });
  };

  const handleSetPrimary = async (occupantId: number) => {
    const result = await Swal.fire({
      title: 'Pindahkan Penghuni Utama?',
      text: 'Penghuni ini akan menjadi penanggung jawab utama rumah ini.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Pindahkan',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const token = Cookies.get('access_token');
        const apiUrl = import.meta.env.VITE_API_BASE_URL;

        const response = await fetch(`${apiUrl}/api/residences/${id}/occupants/${occupantId}/set-primary`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        const resultData = await response.json();

        if (!response.ok) throw new Error(resultData.message || 'Gagal mengubah penghuni utama');

        setRefreshTrigger(prev => prev + 1);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Penghuni utama telah diperbarui.',
          confirmButtonColor: '#2563eb',
        });
      } catch (error: any) {
        Swal.fire('Gagal', error.message, 'error');
      }
    }
  };

  const handleDeactivate = async (occupantId: number) => {
    const { value: moveOutDate } = await Swal.fire({
      title: 'Nonaktifkan Penghuni',
      text: 'Masukkan tanggal keluar penghuni ini (Kosongkan untuk tanggal hari ini)',
      input: 'date',
      inputValue: new Date().toISOString().split('T')[0],
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Nonaktifkan',
      cancelButtonText: 'Batal',
    });

    // Jika pengguna menekan "Ya, Nonaktifkan" (bukan cancel)
    if (moveOutDate !== undefined) {
      try {
        const token = Cookies.get('access_token');
        const apiUrl = import.meta.env.VITE_API_BASE_URL;

        const response = await fetch(`${apiUrl}/api/residences/${id}/occupants/${occupantId}/deactivate`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            move_out_date: moveOutDate || null 
          })
        });

        const resultData = await response.json();

        if (!response.ok) throw new Error(resultData.message || 'Gagal menonaktifkan penghuni');

        setRefreshTrigger(prev => prev + 1);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Penghuni telah dinonaktifkan.',
          confirmButtonColor: '#2563eb',
        });
      } catch (error: any) {
        Swal.fire('Gagal', error.message, 'error');
      }
    }
  };

  // Definisikan Kolom
  const columns: ColumnDef<Occupant>[] = [
    {
      accessorKey: 'nama_penghuni',
      header: 'Nama Penghuni',
      cell: (info) => info.getValue() || '-', 
    },
    {
      accessorKey: 'occupant_type',
      header: 'Tipe',
      cell: (info) => (
        <span className="capitalize">{String(info.getValue())}</span>
      ),
    },
    {
      accessorKey: 'is_primary_resident',
      header: 'Kepala Rumah',
      cell: (info) => {
        const val = info.getValue();
        return (val === true || val === 1) ? (
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">Ya</span>
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: (info) => {
        const val = info.getValue();
        return (val === true || val === 1) ? (
          <span className="text-green-600 font-medium">Aktif</span>
        ) : (
          <span className="text-slate-400 font-medium">Non-Aktif</span>
        );
      },
    },
    {
      accessorKey: 'move_in_date',
      header: 'Tgl Masuk',
      cell: (info) => info.getValue() || '-', 
    },
    {
      accessorKey: 'move_out_date',
      header: 'Tgl Keluar',
      cell: (info) => info.getValue() || '-', 
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => {
        const isPrimary = row.original.is_primary_resident;
        const val = row.original.is_active;
        const isActive = (val === true || val === 1);

        if (isActive) {
          return (
            <div className="flex items-center gap-2">
              {!isPrimary && (
                <button 
                  onClick={() => handleSetPrimary(row.original.id)}
                  className="bg-amber-50 text-amber-700 px-3 py-1 rounded border border-amber-200 hover:bg-amber-100 transition-colors text-xs font-semibold"
                >
                  Set Utama
                </button>
              )}
              <button 
                onClick={() => handleDeactivate(row.original.id)}
                className="bg-red-50 text-red-700 px-3 py-1 rounded border border-red-200 hover:bg-red-100 transition-colors text-xs font-semibold"
              >
                Nonaktifkan
              </button>
            </div>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/rumah')}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Detail Penghuni Rumah</h1>
          {residence ? (
            <p className="text-blue-600 font-medium flex items-center gap-2 mt-1">
              <span className="bg-blue-100 px-2 py-0.5 rounded text-sm font-bold">No. {residence.house_number}</span>
              <span className="text-slate-500 text-sm italic">{residence.address}</span>
            </p>
          ) : (
            <p className="text-slate-500 text-sm italic">ID Rumah: {id}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={20} />
          Tambah Penghuni
        </button>
      </div>
      
      <TanStackTable
        data={data}
        columns={columns}
        loading={loading}
        totalRecords={totalRecords}
        pagination={pagination}
        setPagination={setPagination}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        getRowClass={(row) => !(row.is_active === true || row.is_active === 1) ? 'opacity-60 bg-slate-50/50 grayscale-[0.5]' : ''}
      />

      {id && (
        <OccupantFormModal 
          isOpen={isModalOpen}
          residenceId={id}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  );
};

export default ResidenceDetail;
