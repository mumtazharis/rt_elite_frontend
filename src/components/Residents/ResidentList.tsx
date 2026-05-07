// src/components/Residents/ResidentList.tsx
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import TanStackTable from '../Common/TanStackTable';
import { Eye, PlusCircle, Edit, Power } from "lucide-react";
import Swal from 'sweetalert2';

// Import sub-components
import ResidentKtpModal from './ResidentKtpModal';
import ResidentFormModal, { type ResidentFormData } from './ResidentFormModal';

interface Resident {
  id: number;
  nik: string;
  ktp: boolean;
  full_name: string;
  phone_number: string;
  marriage_status: string;
  is_active: boolean;
}

// Interface untuk state Modal KTP
interface KtpModalState {
  isOpen: boolean;
  isLoading: boolean;
  imageUrl: string | null;
  error: string | null;
}

interface FormModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

const ResidentList = () => {
  const [data, setData] = useState<Resident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // State TanStack
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0, 
    pageSize: 10,
  });

  // State untuk Modal KTP
  const [ktpModal, setKtpModal] = useState<KtpModalState>({
    isOpen: false,
    isLoading: false,
    imageUrl: null,
    error: null,
  });

  // State untuk Modal Form (Tambah/Edit)
  const [formModal, setFormModal] = useState<FormModalState>({
    isOpen: false,
    mode: 'create',
    isLoading: false,
    isSaving: false,
    error: null,
  });

  const [selectedResidentId, setSelectedResidentId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ResidentFormData>({
    nik: '',
    full_name: '',
    phone_number: '',
    marriage_status: 'belum_menikah',
    ktp: null,
    hasCurrentKtp: false,
    currentKtpUrl: null,
    removeKtp: false,
  });

  // 1. Efek khusus untuk Debounce Pencarian
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setDebouncedFilter(globalFilter);
      if (globalFilter !== '') {
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [globalFilter]);

  // 2. Efek TUNGGAL untuk Fetch Data
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

        const response = await fetch(`${apiUrl}/api/residents?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const result = await response.json();
        
        setData(result.data);
        setTotalRecords(result.recordsFiltered); 

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pagination.pageIndex, pagination.pageSize, debouncedFilter, refreshTrigger]);

  // --- Fungsi untuk menangani klik dan fetch foto KTP ---
  const handleViewKtp = async (residentId: number) => {
    setSelectedResidentId(residentId);
    setKtpModal({ isOpen: true, isLoading: true, imageUrl: null, error: null });

    try {
      const token = Cookies.get('access_token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(`${apiUrl}/api/residents/${residentId}/ktp`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Gagal memuat foto KTP. Mungkin file tidak ditemukan.');
      }

      // Karena responsnya adalah file gambar, kita ubah menjadi Blob
      const blob = await response.blob();
      // Buat URL lokal sementara dari Blob tersebut untuk ditampilkan di tag <img>
      const objectUrl = URL.createObjectURL(blob);

      setKtpModal({ isOpen: true, isLoading: false, imageUrl: objectUrl, error: null });
    } catch (error: any) {
      setKtpModal({ isOpen: true, isLoading: false, imageUrl: null, error: error.message });
    }
  };

  // Fungsi untuk menutup modal dan membersihkan memori
  const closeKtpModal = () => {
    if (ktpModal.imageUrl) {
      // Hapus URL sementara dari memori browser
      URL.revokeObjectURL(ktpModal.imageUrl);
    }
    setKtpModal({ isOpen: false, isLoading: false, imageUrl: null, error: null });
  };

  // --- Fungsi untuk menangani Tambah ---
  const handleAdd = () => {
    setSelectedResidentId(null);
    setFormData({
      nik: '',
      full_name: '',
      phone_number: '',
      marriage_status: 'belum_menikah',
      ktp: null,
      hasCurrentKtp: false,
      currentKtpUrl: null,
      removeKtp: false,
    });
    setFormModal({
      isOpen: true,
      mode: 'create',
      isLoading: false,
      isSaving: false,
      error: null
    });
  };

  // --- Fungsi untuk menangani Edit ---
  const handleEdit = async (residentId: number) => {
    setSelectedResidentId(residentId);
    setFormModal({ isOpen: true, mode: 'edit', isLoading: true, isSaving: false, error: null });

    try {
      const token = Cookies.get('access_token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(`${apiUrl}/api/residents/${residentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Gagal mengambil data warga');

      const result = await response.json();
      
      let currentKtpUrl = null;
      if (result.ktp) {
        try {
          const ktpResponse = await fetch(`${apiUrl}/api/residents/${residentId}/ktp`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (ktpResponse.ok) {
            const blob = await ktpResponse.blob();
            currentKtpUrl = URL.createObjectURL(blob);
          }
        } catch (err) {
          console.error("Gagal memuat pratinjau KTP saat ini", err);
        }
      }

      setFormData({
        nik: result.nik || '',
        full_name: result.full_name || '',
        phone_number: result.phone_number || '',
        marriage_status: result.marriage_status || 'belum_menikah',
        ktp: null,
        hasCurrentKtp: !!result.ktp,
        currentKtpUrl: currentKtpUrl,
        removeKtp: false,
      });

      setFormModal(prev => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      setFormModal(prev => ({ ...prev, isLoading: false, error: error.message }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = formModal.mode === 'edit';
    if (isEdit && !selectedResidentId) return;

    setFormModal(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      const token = Cookies.get('access_token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL;

      const submitData = new FormData();
      
      if (isEdit) {
        submitData.append('_method', 'PUT');
      }

      submitData.append('nik', formData.nik);
      submitData.append('full_name', formData.full_name);
      submitData.append('phone_number', formData.phone_number);
      submitData.append('marriage_status', formData.marriage_status);
      
      if (formData.ktp) {
        submitData.append('ktp', formData.ktp);
      } else if (isEdit && formData.removeKtp) {
        submitData.append('ktp', ''); 
      }

      const url = isEdit 
        ? `${apiUrl}/api/residents/${selectedResidentId}`
        : `${apiUrl}/api/residents`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: submitData
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          const firstError = Object.values(result.errors)[0] as string[];
          throw new Error(firstError[0] || 'Terjadi kesalahan pada server');
        }
        throw new Error(result.message || 'Terjadi kesalahan pada server');
      }

      // Refresh table
      setRefreshTrigger(prev => prev + 1);
      setFormModal({ ...formModal, isOpen: false, isSaving: false });
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: isEdit ? 'Data warga berhasil diperbarui' : 'Warga baru berhasil ditambahkan',
        confirmButtonColor: '#2563eb',
      });
    } catch (error: any) {
      setFormModal(prev => ({ ...prev, isSaving: false, error: error.message }));
    }
  };

  const closeFormModal = () => {
    if (formData.currentKtpUrl) {
      URL.revokeObjectURL(formData.currentKtpUrl);
    }
    setFormModal({ ...formModal, isOpen: false, isSaving: false, error: null });
  };

  const handleDeactivate = async (residentId: number) => {
    const result = await Swal.fire({
      title: 'Nonaktifkan Warga?',
      text: 'Warga yang dinonaktifkan tidak dapat diedit lagi.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Nonaktifkan',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const token = Cookies.get('access_token');
        const apiUrl = import.meta.env.VITE_API_BASE_URL;

        const response = await fetch(`${apiUrl}/api/residents/${residentId}/deactivate`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });

        const resultData = await response.json();

        if (!response.ok) throw new Error(resultData.message || 'Gagal menonaktifkan warga');

        setRefreshTrigger(prev => prev + 1);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Warga telah dinonaktifkan.',
          confirmButtonColor: '#2563eb',
        });
      } catch (error: any) {
        Swal.fire('Gagal', error.message, 'error');
      }
    }
  };

  // Definisikan Kolom
  const columns: ColumnDef<Resident>[] = [
    {
      accessorKey: 'nik',
      header: 'NIK',
      cell: (info) => info.getValue() || '-', 
    },
    {
      accessorKey: 'full_name',
      header: 'Nama Lengkap',
      cell: (info) => info.getValue() || '-', 
    },
    {
      accessorKey: 'phone_number',
      header: 'No. HP',
      cell: (info) => info.getValue() || '-', 
    },
    {
      accessorKey: 'marriage_status',
      header: 'Status Pernikahan',
      cell: (info) => (
        <span className="capitalize">{String(info.getValue()).replace('_', ' ')}</span>
      )
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
      accessorKey: 'ktp',
      header: 'KTP',
      cell: ({ row }) => {
        const hasKtp = row.getValue('ktp');
        
        if (hasKtp) {
          return (
            <button 
              onClick={() => handleViewKtp(row.original.id)}
              className="text-teal-600 hover:text-teal-800 transition-colors bg-teal-50 p-2 rounded-full"
              title="Lihat KTP"
            >
              <Eye size={18} />
            </button>
          );
        }
        
        return <span className="text-slate-400 italic text-sm">Tidak ada</span>;
      },
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => row.original.is_active ? (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleEdit(row.original.id)}
            className="bg-teal-100 text-teal-700 px-3 py-1 rounded hover:bg-teal-200 transition-colors text-sm font-medium"
          >
            <Edit size={14} />
            Edit
          </button>
          <button 
            onClick={() => handleDeactivate(row.original.id)}
            className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Power size={14} />
            Nonaktifkan
          </button>
        </div>
      ) : null,
    },
  ];

  return (
    <div className="space-y-4 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Data Warga</h1>
        <button 
          onClick={handleAdd}
          className="bg-teal-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <PlusCircle size={20} />
          Tambah Warga
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

      <ResidentFormModal 
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

      <ResidentKtpModal 
        isOpen={ktpModal.isOpen}
        isLoading={ktpModal.isLoading}
        imageUrl={ktpModal.imageUrl}
        error={ktpModal.error}
        residentId={selectedResidentId}
        onClose={closeKtpModal}
      />
    </div>
  );
};

export default ResidentList;