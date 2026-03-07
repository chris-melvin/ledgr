"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
  type MutableRefObject,
} from "react";
import {
  initializePaddle,
  type Paddle,
  type CheckoutOpenOptions,
} from "@paddle/paddle-js";
import { PADDLE_CONFIG } from "@/lib/payments/config";

interface PaddleContextValue {
  paddle: Paddle | null;
  isLoaded: boolean;
  openCheckout: (options: CheckoutOpenOptions) => void;
  onCheckoutComplete: MutableRefObject<(() => void) | null>;
}

const PaddleContext = createContext<PaddleContextValue>({
  paddle: null,
  isLoaded: false,
  openCheckout: () => {},
  onCheckoutComplete: { current: null },
});

export function usePaddle() {
  const context = useContext(PaddleContext);
  if (!context) {
    throw new Error("usePaddle must be used within a PaddleProvider");
  }
  return context;
}

interface PaddleProviderProps {
  children: ReactNode;
}

export function PaddleProvider({ children }: PaddleProviderProps) {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const onCheckoutComplete = useRef<(() => void) | null>(null);

  useEffect(() => {
    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const environment = (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT ?? "sandbox") as
      | "sandbox"
      | "production";

    if (!clientToken) {
      console.warn("Paddle client token not configured");
      return;
    }

    initializePaddle({
      environment,
      token: clientToken,
      eventCallback: (event) => {
        if (event.name === "checkout.completed") {
          onCheckoutComplete.current?.();
        }
      },
    })
      .then((paddleInstance) => {
        if (paddleInstance) {
          setPaddle(paddleInstance);
          setIsLoaded(true);
        }
      })
      .catch((error) => {
        console.error("Failed to initialize Paddle:", error);
      });
  }, []);

  const openCheckout = useCallback(
    (options: CheckoutOpenOptions) => {
      if (!paddle) {
        console.error("Paddle not initialized");
        return;
      }
      paddle.Checkout.open(options);
    },
    [paddle]
  );

  return (
    <PaddleContext.Provider value={{ paddle, isLoaded, openCheckout, onCheckoutComplete }}>
      {children}
    </PaddleContext.Provider>
  );
}
