import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Activity, Loader2, ShieldAlert } from "lucide-react";
import api from "../../services/api";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/audit-logs");
      if (response.data.success) {
        setLogs(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <section className="flex items-end justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#8b6f2f]">Hệ thống</p>
          <h1 className="text-3xl font-black tracking-tight text-stone-950">Nhật ký hoạt động</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-stone-500">
            Theo dõi chi tiết mọi thay đổi, kiểm duyệt và giao dịch trên hệ thống để đảm bảo tính minh bạch.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="grid grid-cols-[160px_160px_1fr_180px] border-b border-stone-200 px-5 py-3 text-xs font-black uppercase tracking-wider text-stone-400">
          <div>Thời gian</div>
          <div>Hành động</div>
          <div>Mô tả chi tiết</div>
          <div>Người thực hiện</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-stone-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span className="text-sm font-bold">Đang tải nhật ký...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-stone-50 text-stone-400">
              <Activity className="h-7 w-7" />
            </div>
            <p className="text-lg font-black text-stone-900">Chưa có hoạt động nào</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {logs.map((log) => (
              <article
                key={log.auditId}
                className="grid grid-cols-[160px_160px_1fr_180px] items-center px-5 py-4 transition-colors hover:bg-stone-50"
              >
                <div className="text-sm font-medium text-stone-500">
                  {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                </div>
                <div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
                    {log.actionType}
                  </span>
                </div>
                <div className="text-sm font-medium text-stone-700">{log.description}</div>
                <div className="text-sm font-bold text-stone-900">{log.user ? log.user.email : "System"}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
