// ====================================================
// SUPABASE-CLIENT.JS — Supabase 클라이언트 싱글톤
// ====================================================
import { CONFIG } from './config.js';

let _client = null;

export function getSupabaseClient() {
  if (_client) return _client;

  if (window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      _client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    } catch (e) {
      console.warn('Supabase initialization warning:', e);
    }
  }
  return _client;
}
