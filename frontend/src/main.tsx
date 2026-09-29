import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { WalletProvider } from "./wallet/WalletContext";
import { ProvidersProvider } from "./providers/ProvidersContext";
import { App } from "./App";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <WalletProvider>
      <ProvidersProvider>
        <App />
      </ProvidersProvider>
    </WalletProvider>
  </StrictMode>,
);
