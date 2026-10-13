import { useEffect } from 'react';
import { setAuthData } from '../game/authApi';

export default function GoogleCallback() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const token = url.searchParams.get('token');
      if (token) {
        setAuthData(token, null);
        fetch('/api/auth/me', {
          headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
        }).then(r => r.json()).then(d => {
          if (d && d.data) {
            localStorage.setItem('foodrush_user', JSON.stringify(d.data));
          }
          window.location.href = '/';
        }).catch(() => { window.location.href = '/'; });
      } else {
        window.location.href = '/';
      }
    } catch {
      window.location.href = '/';
    }
  }, []);
  return null;
}
