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
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Attract from "./routes/Attract.jsx";
import EraOverview from "./routes/EraOverview.jsx";
import EraScreen from "./routes/EraScreen.jsx";
import Library from "./routes/Library.jsx";
import About from "./routes/About.jsx";
import { QuizHome, EraQuiz } from "./routes/Quiz.jsx";
import QuizComplete from "./routes/QuizComplete.jsx";
import AdminLogin from "./routes/admin/AdminLogin.jsx";
import Dashboard from "./routes/admin/Dashboard.jsx";
import Eras from "./routes/admin/Eras.jsx";
import Settings from "./routes/admin/Settings.jsx";
import Media from "./routes/admin/Media.jsx";
import MediaEdit from "./routes/admin/MediaEdit.jsx";
import Events from "./routes/admin/Events.jsx";
import EventEdit from "./routes/admin/EventEdit.jsx";
import AdminLayout from "./components/admin/AdminLayout.jsx";
import PreviewBar from "./components/admin/PreviewBar.jsx";
import { isCompanion } from "./lib/store/index.js";
import Certificate from "./routes/Certificate.jsx";

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
  const onCertificate = location.pathname === "/certificate";

  const idle = useIdleTimer({
    idleSeconds: content?.settings?.idleSeconds ?? 75,
    warningSeconds: content?.settings?.warningSeconds ?? 15,
    // Admin screens have their own, longer sign-out timer (AdminLayout).
    enabled: !onAttract && !onCertificate && !inAdmin,
    onReset: startOver,
  });

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {!inAdmin && !isCompanion && <HiddenAdminTrigger />}
      {!inAdmin && kiosk.adminToken && <PreviewBar />}
      <main className={`relative min-h-0 flex-1 overflow-y-auto ${kiosk.reach ? "pt-[30vh]" : ""}`}>
        {!content ? (
          <PageStatus />
        ) : (
          <ErrorBoundary resetKey={location.pathname}>
            <Routes>
              <Route path="/" element={<Attract />} />
              <Route path="/timeline" element={<EraOverview />} />
              <Route path="/era/:eraId" element={<EraScreen />} />
              <Route path="/era/:eraId/event/:eventId" element={<EraScreen />} />
              <Route path="/library" element={<Library />} />
              <Route path="/quiz" element={<QuizHome />} />
              <Route path="/quiz/era/:eraId" element={<EraQuiz />} />
              <Route path="/quiz/complete" element={<QuizComplete />} />
              <Route path="/about" element={<About />} />
              {/* The phone page the QR code opens (on the companion site). */}
              <Route path="/certificate" element={<Certificate />} />
              {/* No admin at all on the public companion site. */}
              {!isCompanion && <Route path="/admin" element={<AdminLogin />} />}
              {!isCompanion && (
                <Route element={<AdminLayout />}>
                  <Route path="/admin/dashboard" element={<Dashboard />} />
                  <Route path="/admin/events" element={<Events />} />
                  <Route path="/admin/events/:eventId" element={<EventEdit />} />
                  <Route path="/admin/media" element={<Media />} />
                  <Route path="/admin/media/:mediaId" element={<MediaEdit />} />
                  <Route path="/admin/eras" element={<Eras />} />
                  <Route path="/admin/settings" element={<Settings />} />
                </Route>
              )}
              <Route path="*" element={<Navigate to={isCompanion ? "/certificate" : "/"} replace />} />
            </Routes>
          </ErrorBoundary>
        )}
      </main>
      {!onAttract && !inAdmin && !onCertificate && <BottomNav />}
      {kiosk.a11yOpen && <A11yPanel />}
      {idle.warning && <IdleModal remaining={idle.remaining} onStay={idle.stayHere} />}
    </div>
  );
}
