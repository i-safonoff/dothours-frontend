import type { ReactNode } from 'react';
import './PhoneShell.css';

export default function PhoneShell({ children }: { children: ReactNode }) {
  const time = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date());

  return (
    <div className="phone-stage">
      <div className="phone-device">
        <div className="phone-notch" />
        <div className="phone-statusbar">
          <span className="phone-time">{time}</span>
          <div className="phone-icons">
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
              <rect x="0" y="7" width="3" height="5" rx="0.8" fill="currentColor" />
              <rect x="4.5" y="5" width="3" height="7" rx="0.8" fill="currentColor" />
              <rect x="9" y="2.5" width="3" height="9.5" rx="0.8" fill="currentColor" />
              <rect x="13.5" y="0" width="3" height="12" rx="0.8" fill="currentColor" />
            </svg>
            <svg width="22" height="12" viewBox="0 0 22 12" fill="none">
              <rect x="0.75" y="0.75" width="18.5" height="10.5" rx="3" stroke="currentColor" strokeWidth="1.2" />
              <rect x="2.25" y="2.25" width="14" height="7.5" rx="1.6" fill="currentColor" />
              <rect x="20" y="4" width="1.5" height="4" rx="0.7" fill="currentColor" />
            </svg>
          </div>
        </div>
        <div className="phone-screen">{children}</div>
        <div className="phone-home" />
      </div>
    </div>
  );
}
