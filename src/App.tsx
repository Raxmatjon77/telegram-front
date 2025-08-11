import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/authContext";
import { LoginPage } from "./features/auth/loginPage";
import { ChatApp } from "./features/chat/chatApp";

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading session...</div>
      </div>
    );
  }

  console.log("AppContent rendered, isAuthenticated:", isAuthenticated)
  ;
  
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <ChatApp />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <AppContent />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
