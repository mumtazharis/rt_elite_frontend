const Dashboard = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard Utama</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-slate-500 font-medium">Total Warga</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">60</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-slate-500 font-medium">Kas RT</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">Rp 2.500.000</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-slate-500 font-medium">Kegiatan Aktif</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">2</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;