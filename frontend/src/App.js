import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import PromptPage from "@/pages/PromptPage";
import BuilderPage from "@/pages/BuilderPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PromptPage />} />
        <Route path="/builder" element={<BuilderPage />} />
      </Routes>
      <Toaster position="bottom-right" theme="dark" />
    </BrowserRouter>
  );
}

export default App;
