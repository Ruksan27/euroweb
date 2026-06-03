import { useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API } from '../config/api';

/**
 * Debounced auto‑save hook for CV builder.
 * @param {object} cvData Current CV state.
 * @param {function} setCvData Setter to update CV state after successful save.
 * @param {string} token Auth token for API calls.
 * @param {number} delay Debounce delay in ms (default 2000).
 */
export default function useAutoSave(cvData, setCvData, token, delay = 2000) {
  const timer = useRef(null);

  useEffect(() => {
    // Only auto‑save existing CVs (has an _id) and when a token is present.
    if (!token || !cvData?._id) return;

    // Clear any pending timer.
    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(async () => {
      try {
        const res = await axios.put(`${API.cv}/save/${cvData._id}`, cvData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Ensure the local state has the latest _id (in case the server mutated it).
        setCvData(prev => ({ ...prev, _id: res.data._id }));
        toast.success('Auto‑saved', { id: 'autosave' });
      } catch (e) {
        console.error('Auto‑save error:', e);
        toast.error('Auto‑save failed');
      }
    }, delay);

    // Cleanup on unmount or when dependencies change.
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [cvData, token, delay]);
}
