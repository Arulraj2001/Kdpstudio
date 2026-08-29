import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Currency, 
  PlanName, 
  PaymentMethod, 
  LocationData, 
  PRICING_TABLE, 
  detectUserLocation, 
  getCurrencyForCountry, 
  getPaymentMethods, 
  formatPrice,
  normalizeToSupportedCurrency
} from './geo';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface GeoState {
  location: LocationData | null;
  currency: Currency;
  paymentMethods: PaymentMethod[];
  isDetecting: boolean;
  manualOverride: boolean;
  lastDetectedAt: number | null;

  initLocation: (force?: boolean) => Promise<void>;
  setCurrencyManually: (currency: Currency) => void;
  getPriceForPlan: (plan: PlanName) => number;
  getFormattedPrice: (plan: PlanName) => string;
  resetToAutoDetection: () => Promise<void>;
}

export const useGeoStore = create<GeoState>()(
  persist(
    (set, get) => ({
      location: null,
      currency: 'USD',
      paymentMethods: ['paypal', 'bmac'],
      isDetecting: false,
      manualOverride: false,
      lastDetectedAt: null,

      initLocation: async (force = false) => {
        const { location, manualOverride, lastDetectedAt, isDetecting } = get();

        // If currently detecting, prevent duplicate requests
        if (isDetecting) return;

        const isFresh = lastDetectedAt && (Date.now() - lastDetectedAt < ONE_DAY_MS);

        // If we already have fresh detected location and no force reload
        if (location && isFresh && !force) {
          return;
        }

        set({ isDetecting: true });

        try {
          const detected = await detectUserLocation();
          const now = Date.now();

          // Only change currency if user has not manually overridden it
          if (!manualOverride) {
            const mappedCurrency = normalizeToSupportedCurrency(detected.currency, detected.country);
            const methods = getPaymentMethods(mappedCurrency);

            set({
              location: detected,
              currency: mappedCurrency,
              paymentMethods: methods,
              lastDetectedAt: now,
              isDetecting: false,
            });
          } else {
            set({
              location: detected,
              lastDetectedAt: now,
              isDetecting: false,
            });
          }
        } catch (error) {
          console.warn('[GeoStore] Init location error, falling back to USD:', error);
          set({
            isDetecting: false,
          });
        }
      },

      setCurrencyManually: (currency: Currency) => {
        const methods = getPaymentMethods(currency);
        set({
          currency,
          paymentMethods: methods,
          manualOverride: true,
        });
      },

      resetToAutoDetection: async () => {
        set({ manualOverride: false });
        await get().initLocation(true);
      },

      getPriceForPlan: (plan: PlanName) => {
        const { currency } = get();
        const planTier = PRICING_TABLE[plan];
        if (!planTier) return 0;
        return planTier[currency] ?? planTier.USD ?? 0;
      },

      getFormattedPrice: (plan: PlanName) => {
        const { currency, getPriceForPlan } = get();
        const price = getPriceForPlan(plan);
        return formatPrice(price, currency);
      },
    }),
    {
      name: 'kdp_studio_geo_storage',
      partialize: (state) => ({
        location: state.location,
        currency: state.currency,
        paymentMethods: state.paymentMethods,
        manualOverride: state.manualOverride,
        lastDetectedAt: state.lastDetectedAt,
      }),
    }
  )
);
