import { useState } from 'react';
import { Bell, Shield, Globe, Palette, Database, Mail, Save, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

const tabs = [
  { id: 'general', label: 'Chung', icon: Globe },
  { id: 'notifications', label: 'Thông báo', icon: Bell },
  { id: 'security', label: 'Bảo mật', icon: Shield },
  { id: 'appearance', label: 'Giao diện', icon: Palette },
  { id: 'integrations', label: 'Tích hợp', icon: Database },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0
        ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
      style={{ height: '22px' }}
    >
      <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform
        ${checked ? 'translate-x-4' : 'translate-x-0'}`}
        style={{ width: '18px', height: '18px' }}
      />
    </button>
  );
}

export default function Settings() {
  const { addToast } = useApp();
  const [activeTab, setActiveTab] = useState('general');
  const [showPw, setShowPw] = useState(false);

  const [notifSettings, setNotifSettings] = useState({
    newOrder: true, statusChange: true, paymentSuccess: true,
    deliveryComplete: true, shipperAssign: false, systemAlert: true,
    emailNotif: true, smsNotif: false, pushNotif: true,
  });

  const save = () => {
    addToast({ type: 'success', title: 'Đã lưu cài đặt', message: 'Thay đổi của bạn đã được áp dụng thành công' });
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h2 className="text-lg font-700 text-slate-900">Cài đặt hệ thống</h2>
        <p className="text-xs text-slate-500 mt-0.5">Quản lý cấu hình và tùy chọn của hệ thống</p>
      </div>

      <div className="flex gap-6">
        {/* Tab sidebar */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-500 text-left transition-colors
                  ${activeTab === id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Icon size={15} className={activeTab === id ? 'text-blue-600' : 'text-slate-400'} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {activeTab === 'general' && (
            <>
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-700 text-slate-900 mb-4">Thông tin hệ thống</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Tên hệ thống', value: 'DeliveryMS', placeholder: 'Nhập tên hệ thống' },
                    { label: 'Tên công ty', value: 'Công ty TNHH Giao Hàng Nhanh', placeholder: '' },
                    { label: 'Email liên hệ', value: 'support@deliveryms.vn', placeholder: '' },
                    { label: 'Số điện thoại', value: '1900 1234', placeholder: '' },
                    { label: 'Địa chỉ', value: '123 Nguyễn Huệ, Q.1, TP.HCM', placeholder: '' },
                  ].map(({ label, value, placeholder }) => (
                    <div key={label} className="grid grid-cols-3 gap-4 items-center">
                      <label className="text-xs font-600 text-slate-600">{label}</label>
                      <input defaultValue={value} placeholder={placeholder}
                        className="col-span-2 h-9 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 bg-slate-50 focus:bg-white" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-700 text-slate-900 mb-4">Cài đặt giao hàng</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Phí giao hàng cơ bản (đ/km)', value: '5000' },
                    { label: 'Khoảng cách tối đa (km)', value: '50' },
                    { label: 'Thời gian xử lý đơn (giờ)', value: '2' },
                    { label: 'Phí COD (%)', value: '1.5' },
                  ].map(({ label, value }) => (
                    <div key={label} className="grid grid-cols-3 gap-4 items-center">
                      <label className="text-xs font-600 text-slate-600">{label}</label>
                      <input defaultValue={value} type="number"
                        className="col-span-2 h-9 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 bg-slate-50 focus:bg-white w-48" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-700 text-slate-900 mb-4">Loại thông báo</h3>
                <div className="space-y-3">
                  {[
                    { key: 'newOrder', label: 'Đơn hàng mới', desc: 'Khi có đơn hàng mới được tạo' },
                    { key: 'statusChange', label: 'Thay đổi trạng thái', desc: 'Khi trạng thái đơn hàng thay đổi' },
                    { key: 'paymentSuccess', label: 'Thanh toán thành công', desc: 'Khi khách hàng thanh toán xong' },
                    { key: 'deliveryComplete', label: 'Giao hàng thành công', desc: 'Khi shipper giao hàng xong' },
                    { key: 'shipperAssign', label: 'Phân công shipper', desc: 'Khi shipper được phân công đơn' },
                    { key: 'systemAlert', label: 'Cảnh báo hệ thống', desc: 'Thông báo bảo trì và lỗi hệ thống' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-slate-50">
                      <div>
                        <p className="text-sm font-500 text-slate-800">{label}</p>
                        <p className="text-xs text-slate-400">{desc}</p>
                      </div>
                      <Toggle
                        checked={notifSettings[key as keyof typeof notifSettings]}
                        onChange={v => setNotifSettings(p => ({ ...p, [key]: v }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-700 text-slate-900 mb-4">Kênh thông báo</h3>
                <div className="space-y-3">
                  {[
                    { key: 'emailNotif', label: 'Email', icon: Mail, desc: 'Nhận thông báo qua email' },
                    { key: 'smsNotif', label: 'SMS', icon: Bell, desc: 'Nhận thông báo qua tin nhắn SMS' },
                    { key: 'pushNotif', label: 'Push Notification', icon: Bell, desc: 'Thông báo trên trình duyệt' },
                  ].map(({ key, label, icon: Icon, desc }) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Icon size={14} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-500 text-slate-800">{label}</p>
                          <p className="text-xs text-slate-400">{desc}</p>
                        </div>
                      </div>
                      <Toggle
                        checked={notifSettings[key as keyof typeof notifSettings]}
                        onChange={v => setNotifSettings(p => ({ ...p, [key]: v }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-700 text-slate-900 mb-4">Đổi mật khẩu</h3>
              <div className="space-y-4 max-w-sm">
                {[
                  { label: 'Mật khẩu hiện tại', placeholder: '••••••••' },
                  { label: 'Mật khẩu mới', placeholder: 'Tối thiểu 8 ký tự' },
                  { label: 'Xác nhận mật khẩu mới', placeholder: 'Nhập lại mật khẩu' },
                ].map(({ label, placeholder }) => (
                  <div key={label}>
                    <label className="block text-xs font-600 text-slate-700 mb-1.5">{label}</label>
                    <div className="relative">
                      <input type={showPw ? 'text' : 'password'} placeholder={placeholder}
                        className="w-full h-10 pl-3 pr-10 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 bg-slate-50 focus:bg-white" />
                      <button onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100">
                <h3 className="text-sm font-700 text-slate-900 mb-3">Bảo mật 2 lớp (2FA)</h3>
                <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div>
                    <p className="text-sm font-600 text-amber-800">Chưa bật xác thực 2 lớp</p>
                    <p className="text-xs text-amber-600 mt-0.5">Tăng cường bảo mật tài khoản của bạn</p>
                  </div>
                  <button className="h-8 px-4 rounded-lg bg-amber-600 text-white text-xs font-600 hover:bg-amber-700">
                    Kích hoạt
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-700 text-slate-900 mb-4">Chủ đề giao diện</h3>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { id: 'light', label: 'Sáng', preview: 'bg-white border-blue-400' },
                  { id: 'dark', label: 'Tối', preview: 'bg-slate-900 border-slate-600' },
                  { id: 'system', label: 'Theo hệ thống', preview: 'bg-gradient-to-r from-white to-slate-900' },
                ].map(({ id, label, preview }) => (
                  <button key={id}
                    className={`p-4 rounded-xl border-2 text-center ${id === 'light' ? 'border-blue-400 bg-blue-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                    <div className={`w-full h-16 rounded-lg mb-2 border ${preview}`} />
                    <p className="text-xs font-500 text-slate-700">{label}</p>
                  </button>
                ))}
              </div>

              <h3 className="text-sm font-700 text-slate-900 mb-3">Màu chủ đạo</h3>
              <div className="flex gap-2">
                {['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2'].map(color => (
                  <button key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === '#2563EB' ? 'border-slate-400 scale-110' : 'border-transparent'}`}
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-700 text-slate-900 mb-4">Tích hợp thanh toán</h3>
              <div className="space-y-3">
                {[
                  { name: 'VNPay', status: 'Đã kết nối', connected: true, logo: '🏦' },
                  { name: 'Momo', status: 'Đã kết nối', connected: true, logo: '📱' },
                  { name: 'ZaloPay', status: 'Chưa kết nối', connected: false, logo: '💙' },
                  { name: 'VNPT Pay', status: 'Chưa kết nối', connected: false, logo: '📶' },
                ].map(({ name, status, connected, logo }) => (
                  <div key={name} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{logo}</span>
                      <div>
                        <p className="text-sm font-600 text-slate-900">{name}</p>
                        <p className={`text-xs ${connected ? 'text-green-600' : 'text-slate-400'}`}>{status}</p>
                      </div>
                    </div>
                    <button className={`h-8 px-4 rounded-lg text-xs font-600 ${connected ? 'border border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                      {connected ? 'Cài đặt' : 'Kết nối'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={save}
              className="flex items-center gap-2 h-10 px-6 rounded-xl bg-blue-600 text-sm text-white font-600 hover:bg-blue-700">
              <Save size={14} /> Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
