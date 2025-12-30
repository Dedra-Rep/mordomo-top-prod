import React, { useState } from "react";
import type { AIResponse, UserRole } from "./types";
import { ChatInterface } from "./components/ChatInterface";

export default function App() {
  const role: UserRole = "MORDOMO";

  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <ChatInterface
      role={role}
      lastResponse={lastResponse}
      setLastResponse={setLastResponse}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
    />
  );
}
