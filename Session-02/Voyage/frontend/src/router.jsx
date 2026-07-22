import { createBrowserRouter } from "react-router-dom";

import Home from "./pages/Home";
import Explore from "./pages/Explore";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AIPlanner from "./pages/AIPlanner";
import SavedTrips from "./pages/SavedTrips";
import ProtectedRoute from "./components/ProtectedRoute";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/explore", element: <Explore /> },
  { path: "/about", element: <About /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    path: "/planner",
    element: (
      <ProtectedRoute>
        <AIPlanner />
      </ProtectedRoute>
    ),
  },
  {
    path: "/trips",
    element: (
      <ProtectedRoute>
        <SavedTrips />
      </ProtectedRoute>
    ),
  },
]);

export default router;