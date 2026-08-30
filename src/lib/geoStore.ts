import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { onSnapshot, doc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { 
  Currency, 
  PlanName, 
  PaymentMethod, 
  LocationData, 
  PRICING_TABLE,
  PricingTable,
  PlanPricingOverrides,
  computeDynamicPricingTable,
  detectUserLocation, 
  getCurrencyForCountry, 
  getPaymentMethods, 
  formatPrice,
  normalizeToSupportedCurrency
} from './geo';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

let unsubscribePricingSnapshot: (() => void) | null = null;

interface GeoState {
  location: LocationData | null;
  currency: Currency;
  paymentMethods: PaymentMethod[];
  pricingTable: PricingTable;
  pricingOverrides: PlanPricingOverrides | null;
  isDetecting: boolean;
  manualOverride: boolean;
  lastDetectedAt: number | null;

  initLocation: (force?: boolean) => Promise<void>;
  setCurrencyManually: (currency: Currency) => void;
  getPriceForPlan: (plan: PlanName, currencyOverride?: Currency) => number;
  getFormattedPrice: (plan: PlanName, currencyOverride?: Currency) => string;
  resetToAutoDetection: () => Promise<void>;
  initPricingListener: () => void;
  fetchPricing: () => Promise<void>;
}

export const useGeoStore = create<GeoState>()(
  persist(
    (set, get) => {
      // Direct API fetch to guarantee immediate pricing data even if client snapshot is delayed
      const fetchPricingFromApi = async () => {
        try {
          const res = await fetch('/api/config/pricing');
          if (!res.ok) {
            console.debug(`[GeoStore] API pricing fetch non-OK status: ${res.status}`);
            return;
          }
          const contentType = res.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            // The endpoint is missing on the server and returned the SPA HTML fallback.
            console.debug('[GeoStore] API pricing returned non-JSON (SPA fallback).');
            return;
          }
          const data = await res.json();
          if (!data || typeof data !== 'object') return;

          const overrides = data.pricing && typeof data.pricing === 'object' ? data.pricing : null;
          const table = data.pricingTable || computeDynamicPricingTable(overrides);
          if (table) {
            set({
              pricingOverrides: overrides,
              pricingTable: table,
            });
          }
        } catch (e) {
          console.debug('[GeoStore] API pricing fetch fallback error:', e);
        }
      };

      // Initialize real-time pricing listener from Firestore
      const setupPricingListener = () => {
        if (typeof window === 'undefined') return;
        
        // Immediately fetch via API as instant reliable fallback
        fetchPricingFromApi();

        if (unsubscribePricingSnapshot) {
          unsubscribePricingSnapshot();
          unsubscribePricingSnapshot = null;
        }
        if (!isFirebaseConfigured || !db) return;

        try {
          unsubscribePricingSnapshot = onSnapshot(
            doc(db, 'appConfig', 'pricing'),
            (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data() as PlanPricingOverrides;
                const dynamicTable = computeDynamicPricingTable(data);
                set({
                  pricingOverrides: data,
                  pricingTable: dynamicTable,
                });
              } else {
                set({
                  pricingOverrides: null,
                  pricingTable: computeDynamicPricingTable(null),
                });
              }
            },
            (error) => {
              console.debug('[GeoStore] Pricing real-time listener notice:', error);
            }
          );
        } catch (err) {
          console.debug('[GeoStore] Error setting up pricing listener:', err);
        }
      };

      if (typeof window !== 'undefined') {
        setupPricingListener();
      }

      return {
        location: null,
        currency: 'USD',
        paymentMethods: ['paypal', 'bmac'],
        pricingTable: computeDynamicPricingTable(null),
        pricingOverrides: null,
        isDetecting: false,
        manualOverride: false,
        lastDetectedAt: null,

        fetchPricing: fetchPricingFromApi,
        initPricingListener: setupPricingListener,

        initLocation: async (force = false) => {
          setupPricingListener();
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

        getPriceForPlan: (plan: PlanName, currencyOverride?: Currency) => {
          const curr = currencyOverride || get().currency;
          const table = get().pricingTable || PRICING_TABLE;
          const planTier = table[plan];
          if (!planTier) return 0;
          return planTier[curr] ?? planTier.USD ?? 0;
        },

        getFormattedPrice: (plan: PlanName, currencyOverride?: Currency) => {
          const curr = currencyOverride || get().currency;
          const price = get().getPriceForPlan(plan, curr);
          return formatPrice(price, curr);
        },
      };
    },
    {
      name: 'kdp_studio_geo_storage',
      partialize: (state) => ({
        location: state.location,
        currency: state.currency,
        paymentMethods: state.paymentMethods,
        manualOverride: state.manualOverride,
        lastDetectedAt: state.lastDetectedAt,
        pricingTable: state.pricingTable,
        pricingOverrides: state.pricingOverrides,
      }),
    }
  )
);

