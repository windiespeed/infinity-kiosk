import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { useContent } from "./hooks/useContent.jsx";
import { useIdleTimer } from "./hooks/useIdleTimer.js";
import { useStartOver } from "./hooks/useStartOver.js";
import { useKiosk } from "./store/useKiosk.js";
import HiddenAdminTrigger from "./components/HiddenAdminTrigger.jsx";
import BottomNav from "./components/BottomNav.jsx";
import A11yPanel from "./components/A11yPanel.jsx";
import IdleModal from "./components/IdleModal.jsx";
import PageStatus from "./components/PageStatus.jsx";
import Attract from "./routes/Attract.jsx";
import EraOverview from "./routes/EraOverview.jsx";
import EraScreen from "./routes/EraScreen.jsx";
import Library from "./routes/Library.jsx";
import About from "./routes/About.jsx";
import { QuizHome, EventQuiz, QuizComplete } from "./routes/Quiz.jsx";
import AdminLogin from "./routes/admin/AdminLogin.jsx";
import Dashboard from "./routes/admin/Dashboard.jsx";

export default function App() {
  const { content } = useContent();
  const location = useLocation();
  const startOver = useStartOver();
  const kiosk = useKiosk();

  // Accessibility settings are applied as attributes on <html>; theme.css reacts to them.
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.textSize = kiosk.textSize;
    html.dataset.contrast = kiosk.contrast;
    html.dataset.motion = kiosk.reduceMotion ? "reduce" : "full";
  }, [kiosk.textSize, kiosk.contrast, kiosk.reduceMotion]);

  const onAttract = location.pathname === "/";
  const inAdmin = location.pathname.startsWith("/admin");

  const idle = useIdleTimer({
    idleSeconds: content?.settings.idleSeconds ?? 75,
    warningSeconds: content?.settings.warningSeconds ?? 15,
    enabled: !onAttract,
    onReset: startOver,
  });

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <HiddenAdminTrigger />
      <main className={`relative min-h-0 flex-1 overflow-y-auto ${kiosk.reach ? "pt-[30vh]" : ""}`}>
        {!content ? (
          <PageStatus />
        ) : (
          <Routes>
            <Route path="/" element={<Attract />} />
            <Route path="/timeline" element={<EraOverview />} />
            <Route path="/era/:eraId" element={<EraScreen />} />
            <Route path="/era/:eraId/event/:eventId" element={<EraScreen />} />
            <Route path="/library" element={<Library />} />
            <Route path="/quiz" element={<QuizHome />} />
            <Route path="/quiz/event/:eventId" element={<EventQuiz />} />
            <Route path="/quiz/complete" element={<QuizComplete />} />
            <Route path="/about" element={<About />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
      {!onAttract && !inAdmin && <BottomNav />}
      {kiosk.a11yOpen && <A11yPanel />}
      {idle.warning && <IdleModal remaining={idle.remaining} onStay={idle.stayHere} />}
    </div>
  );
}
