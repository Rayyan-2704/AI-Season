import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../common/Button";

function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  const navLinkClass = ({ isActive }) =>
    `font-sans text-sm tracking-wide transition-colors ${
      isActive ? "text-terracotta" : "text-charcoal/70 hover:text-charcoal"
    }`;

  return (
    <header className="bg-sand backdrop-blur-md sticky top-0 z-40 shadow-sm">
      <nav className="mx-auto max-w-6xl px-12 py-5 flex items-center justify-between">
        <Link to="/" className="font-serif text-2xl tracking-wide text-charcoal">
          Voyage
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/explore" className={navLinkClass}>
            Explore
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/planner" className={navLinkClass}>
                AI Planner
              </NavLink>
              <NavLink to="/trips" className={navLinkClass}>
                Saved Trips
              </NavLink>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Button variant="outline" onClick={logout}>
              Log out
            </Button>
          ) : (
            <>
              <Link to="/login" className="font-sans text-sm text-charcoal/70 hover:text-charcoal">
                Log in
              </Link>
              <Link to="/register">
                <Button variant="primary">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;