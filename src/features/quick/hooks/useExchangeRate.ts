import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://v6.exchangerate-api.com/v6/df0d7cbee01d28d57dbd2f89/latest/TWD';
const STORAGE_KEY = '@twd_to_idr_rate_data';
const CACHE_TTL = 12 * 60 * 60 * 1000;

export function useExchangeRate() {
  const [rate, setRate] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
          const { idrRate, lastFetched } = JSON.parse(cached);
          if (Date.now() - lastFetched <= CACHE_TTL) {
            if (active) setRate(idrRate);
            return;
          }
        }
        const response = await fetch(API_URL);
        const data = await response.json();
        if (active && data.result === 'success') {
          const idrRate = data.conversion_rates.IDR;
          setRate(idrRate);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ idrRate, lastFetched: Date.now() }));
        }
      } catch (error) {
        console.warn('Unable to load exchange rate', error);
      }
    };
    load();
    return () => { active = false; };
  }, []);
  return rate;
}
