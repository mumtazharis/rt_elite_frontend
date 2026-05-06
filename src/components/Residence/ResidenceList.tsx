import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import TanStackTable from '../Common/TanStackTable';
import { Eye, Plus, Edit } from 'lucide-react';
import Swal from 'sweetalert2';
import ResidenceFormModal, { type ResidenceFormData } from './ResidenceFormModal';

interface Residence {
  id: number;
  house_number: string;
  address: string;
  total_penghuni: number;
  primary_resident: string;
  is_active: boolean;
}

const ResidenceList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Residence[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  
  // State TanStack
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0, 
    pageSize: 10,
  });
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // State untuk Modal Form (Tambah/Edit)
  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
  }>({
    isOpen: false,
    mode: 'create',
    isLoading: false,
    isSaving: false,
    error: null,
  });

  const [selectedResidenceId, setSelectedResidenceId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ResidenceFormData>({
    house_number: '',
    address: '',
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

        const response = await fetch(`${apiUrl}/api/residences?${params.toString()}`, {
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
  }, [pagination.pageIndex, pagination.pageSize, debouncedFilter, refreshTrigger]);

  const handleAdd = () => {
    setSelectedResidenceId(null);
    setFormData({ house_number: '', address: '' });
    setFormModal({
      isOpen: true,
      mode: 'create',
      isLoading: false,
      isSaving: false,
      error: null
    });
  };

  const handleEdit = async (residence: Residence) => {
    setSelectedResidenceId(residence.id);
    setFormData({
      house_number: residence.house_number,
      address: residence.address,
    });
    setFormModal({
      isOpen: true,
      mode: 'edit',
      isLoading: false,
      isSaving: false,
      error: null
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = formModal.mode === 'edit';
    if (isEdit && !selectedResidenceId) return;

    setFormModal(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      const token = Cookies.get('access_token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL;

      const url = isEdit 
        ? `${apiUrl}/api/residences/${selectedResidenceId}`
        : `${apiUrl}/api/residences`;

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          const firstError = Object.values(result.errors)[0] as string[];
          throw new Error(firstError[0] || 'Terjadi kesalahan pada server');
        }
        throw new Error(result.message || 'Terjadi kesalahan pada server');
      }

      setRefreshTrigger(prev => prev + 1);
      setFormModal(prev => ({ ...prev, isOpen: false, isSaving: false }));
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: isEdit ? 'Data rumah berhasil diperbarui' : 'Rumah baru berhasil ditambahkan',
        confirmButtonColor: '#2563eb',
      });
    } catch (error: any) {
      setFormModal(prev => ({ ...prev, isSaving: false, error: error.message }));
    }
  };

  const closeFormModal = () => {
    setFormModal(prev => ({ ...prev, isOpen: false, isSaving: false, error: null }));
  };

  const handleDeactivate = async (residenceId: number) => {
    const { value: moveOutDate } = await Swal.fire({
      title: 'Nonaktifkan Rumah?',
      text: 'Seluruh penghuni di rumah ini juga akan dinonaktifkan.',
      icon: 'warning',
      input: 'date',
      inputValue: new Date().toISOString().split('T')[0],
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Nonaktifkan',
      cancelButtonText: 'Batal',
    });

    if (moveOutDate !== undefined) {
      try {
        const token = Cookies.get('access_token');
        const apiUrl = import.meta.env.VITE_API_BASE_URL;

        const response = await fetch(`${apiUrl}/api/residences/${residenceId}/deactivate`, {
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

        if (!response.ok) throw new Error(resultData.message || 'Gagal menonaktifkan rumah');

        setRefreshTrigger(prev => prev + 1);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Rumah dan penghuni telah dinonaktifkan.',
          confirmButtonColor: '#2563eb',
        });
      } catch (error: any) {
        Swal.fire('Gagal', error.message, 'error');
      }
    }
  };

  // Definisikan Kolom
  const columns: ColumnDef<Residence>[] = [
    {
      accessorKey: 'house_number',
      header: 'No. Rumah',
      cell: (info) => info.getValue() || '-', 
    },
    {
      accessorKey: 'address',
      header: 'Alamat',
      cell: (info) => info.getValue() || '-', 
    },
    {
      accessorKey: 'primary_resident',
      header: 'Kepala Rumah',
      cell: (info) => info.getValue() || '-', 
    },
    {
      accessorKey: 'total_penghuni',
      header: 'Total Penghuni',
      cell: (info) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{Number(info.getValue())}</span>
          <span className="text-slate-500 text-sm italic">Orang</span>
        </div>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: (info) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${info.getValue() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {info.getValue() ? 'Aktif' : 'Non-Aktif'}
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.is_active ? (
            <>
              <button 
                onClick={() => handleEdit(row.original)}
                className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-200 transition-colors text-sm font-medium"
                title="Edit Rumah"
              >
                <Edit size={16} />
                Edit
              </button>
              <button 
                onClick={() => handleDeactivate(row.original.id)}
                className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
                title="Nonaktifkan Rumah"
              >
                Nonaktifkan
              </button>
            </>
          ) : null}
          <button 
            onClick={() => navigate(`/rumah/${row.original.id}`, { state: { residence: row.original } })}
            className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            <Eye size={16} />
            Penghuni
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Data Rumah</h1>
        <button 
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={20} />
          Tambah Rumah
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
        getRowClass={(row) => !row.is_active ? 'opacity-60 bg-slate-50 grayscale-[0.5]' : ''}
      />

      <ResidenceFormModal 
        isOpen={formModal.isOpen}
        mode={formModal.mode}
        isLoading={formModal.isLoading}
        isSaving={formModal.isSaving}
        error={formModal.error}
        formData={formData}
        onClose={closeFormModal}
        onSubmit={handleSubmit}
        setFormData={setFormData}
      />
    </div>
  );
};

export default ResidenceList;
