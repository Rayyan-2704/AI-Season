import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-sand mt-24">
      <div className="mx-auto max-w-6xl px-3 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="font-serif text-xl text-charcoal">Voyage</p>
          <p className="text-sm text-charcoal/60 mt-1">
            Slow travel, thoughtfully planned.
          </p>
        </div>

        <div className="flex gap-8 text-sm text-charcoal/70">
          <Link to="/explore" className="hover:text-charcoal transition-colors">
            Explore
          </Link>
          <Link to="/about" className="hover:text-charcoal transition-colors">
            About
          </Link>
          <Link to="/planner" className="hover:text-charcoal transition-colors">
            AI Planner
          </Link>
        </div>

        <p className="text-xs text-charcoal/40">
          © {new Date().getFullYear()} Voyage. A slow-travel prototype.
        </p>
      </div>
    </footer>
  );
}

export default Footer;