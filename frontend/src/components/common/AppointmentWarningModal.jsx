import { AlertCircle, Calendar, CheckCircle } from "lucide-react";
import Modal from "./Modal";

export default function AppointmentWarningModal({ isOpen, onClose, onViewAppointments }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Không thể đặt lịch" type="warning">
      <div className="space-y-4">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-yellow-100 p-3">
            <AlertCircle className="h-12 w-12 text-yellow-600" />
          </div>
        </div>

        {/* Message */}
        <div className="text-center">
          <p className="text-base font-semibold text-slate-900">
            Bạn đã có lịch hẹn chưa hoàn thành cho bất động sản này
          </p>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Vui lòng hoàn thành hoặc hủy lịch cũ trước khi đặt lịch mới.
          </p>
        </div>

        {/* Info boxes */}
        <div className="space-y-2 rounded-lg bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div>
              <p className="text-sm font-bold text-slate-900">Hoàn thành lịch hẹn</p>
              <p className="mt-1 text-xs font-medium text-slate-600">
                Sau khi xem nhà, broker sẽ đánh dấu lịch hẹn là hoàn thành
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <p className="text-sm font-bold text-slate-900">Hủy hoặc dời lịch</p>
              <p className="mt-1 text-xs font-medium text-slate-600">
                Bạn có thể hủy hoặc thay đổi thời gian lịch hẹn hiện tại
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
          >
            Đóng
          </button>
          <button
            onClick={onViewAppointments}
            className="flex-1 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Xem lịch hẹn
          </button>
        </div>
      </div>
    </Modal>
  );
}
