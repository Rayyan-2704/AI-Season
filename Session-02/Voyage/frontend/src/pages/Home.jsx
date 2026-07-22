import { Link } from "react-router-dom";
import { useState } from "react";
import { PenLine, SlidersHorizontal, BookHeart, Bookmark } from "lucide-react";
import PageLayout from "../components/layout/PageLayout";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import { useAuth } from "../context/AuthContext";

import heroImage from "../assets/images/hero-mountains.jpg";
import floatingKyoto from "../assets/images/floating-kyoto.jpg";
import floatingSantorini from "../assets/images/floating-santorini.jpg";
import floatingTemple from "../assets/images/floating-temple.jpg";
import destKyoto from "../assets/images/dest-kyoto.jpg";
import destAlgarve from "../assets/images/dest-algarve.jpg";
import destTuscany from "../assets/images/dest-tuscany.jpg";
import whyVoyageBg from "../assets/images/why-voyage-bg.jpg";

const featuredDestinations = [
  { name: "Kyoto, Japan", tagline: "Quiet temples and lantern-lit streets", image: destKyoto },
  { name: "Algarve, Portugal", tagline: "Slow coastal mornings and sea cliffs", image: destAlgarve },
  { name: "Tuscany, Italy", tagline: "Vineyard afternoons and quiet piazzas", image: destTuscany },
];

function Home() {
  const { isAuthenticated } = useAuth();
  const [destination, setDestination] = useState("Kyoto, Japan");
  const [pace, setPace] = useState("moderate");

  const quickStartLink = isAuthenticated ? "/planner" : "/register";

  return (
    <PageLayout>
      {/* Hero — full-bleed background with overlay */}
      <section className="relative min-h-[820px] flex items-start overflow-hidden">
        <img
          src={heroImage}
          alt="Sweeping mountain landscape at golden hour"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/80 via-charcoal/50 to-charcoal/20" />

        <div className="relative mx-auto max-w-6xl px-6 pt-20 w-full grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block uppercase tracking-[0.2em] text-xs text-terracotta bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6">
              AI-powered, editorially written
            </span>
            <h1 className="text-5xl md:text-6xl leading-tight text-white">
              Travel planning,
              <br />
              written like a story.
            </h1>
            <p className="mt-6 text-lg text-white/80 leading-relaxed max-w-md">
              Describe how you like to travel — the pace, the mood, the
              destination — and Voyage writes back a narrative itinerary
              worth reading twice.
            </p>
            <div className="mt-8 flex gap-4">
              <Link to={quickStartLink}>
                <Button variant="primary">Start planning</Button>
              </Link>
              <Link to="/explore">
                <Button variant="outline" className="!text-white !border-white/40 hover:!bg-white/10">
                  Explore destinations
                </Button>
              </Link>
            </div>
          </div>

          {/* Floating stacked photos */}
          <div className="relative hidden md:block h-[420px]">
            <img
              src={floatingKyoto}
              alt="Kyoto street"
              className="absolute top-0 left-0 w-56 h-72 object-cover rounded-card shadow-lg rotate-[-4deg]"
            />
            <img
              src={floatingSantorini}
              alt="Coastal village"
              className="absolute top-24 left-40 w-56 h-72 object-cover rounded-card shadow-lg rotate-[3deg]"
            />
            <img
              src={floatingTemple}
              alt="Temple reflected in still water"
              className="absolute top-10 left-72 w-52 h-64 object-cover rounded-card shadow-lg rotate-[-2deg]"
            />
          </div>
        </div>

        {/* Quick-start widget — fully embedded within the hero image, no overflow past it */}
        <div className="absolute bottom-12 md:bottom-16 left-0 right-0 px-6">
          <div className="mx-auto max-w-4xl">
            <Card className="p-6 md:p-8 shadow-md">
              <div className="grid sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-charcoal/50 mb-2">
                    Destination
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full border border-charcoal/15 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-terracotta"
                    placeholder="Where to?"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-charcoal/50 mb-2">
                    Pace
                  </label>
                  <select
                    value={pace}
                    onChange={(e) => setPace(e.target.value)}
                    className="w-full border border-charcoal/15 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-terracotta bg-white"
                  >
                    <option value="relaxed">Relaxed</option>
                    <option value="moderate">Moderate</option>
                    <option value="packed">Packed</option>
                  </select>
                </div>
                <Link to={quickStartLink} className="w-full">
                  <Button variant="secondary" className="w-full">
                    Plan this trip
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Philosophy strip */}
      <section className="py-20 mt-8">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="font-serif text-2xl md:text-3xl text-charcoal leading-relaxed">
            "The best trips aren't rushed. They're written — one unhurried
            day after another."
          </p>
          <Link
            to="/about"
            className="inline-block mt-6 text-sm text-terracotta hover:opacity-80 transition-opacity"
          >
            Read our philosophy →
          </Link>
        </div>
      </section>

      {/* Featured destinations */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="flex items-end justify-between mb-10">
          <h2 className="text-3xl md:text-4xl text-charcoal">
            Where slow travelers are going
          </h2>
          <Link
            to="/explore"
            className="hidden md:block text-sm text-charcoal/70 hover:text-charcoal transition-colors"
          >
            View all →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {featuredDestinations.map((dest) => (
            <Card key={dest.name} className="p-0 overflow-hidden group">
              <div className="h-64 overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h3 className="text-xl text-charcoal">{dest.name}</h3>
                <p className="text-sm text-charcoal/60 mt-1">{dest.tagline}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Why choose Voyage */}
      <section className="relative py-24 md:py-28 overflow-hidden">
        <img
          src={whyVoyageBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/70 via-charcoal/60 to-charcoal/70" />

        <div className="relative mx-auto max-w-6xl px-6">
          <h2 className="text-3xl md:text-4xl text-center text-white mb-14">
            Why Choose <span className="italic text-terracotta">Voyage</span>
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-card p-6">
              <div className="w-10 h-10 rounded-full bg-terracotta/90 flex items-center justify-center mb-4">
                <PenLine className="w-5 h-5 text-white" strokeWidth={1.75} />
              </div>
              <h3 className="text-white font-medium mb-2">Written, not listed</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Every itinerary reads like a travel feature, full of mood and
                reason — not a bare checklist of stops.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-card p-6">
              <div className="w-10 h-10 rounded-full bg-terracotta/90 flex items-center justify-center mb-4">
                <SlidersHorizontal className="w-5 h-5 text-white" strokeWidth={1.75} />
              </div>
              <h3 className="text-white font-medium mb-2">Tuned to your pace</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Relaxed, moderate, or packed — regenerate any section until
                it actually fits how you travel.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-card p-6">
              <div className="w-10 h-10 rounded-full bg-terracotta/90 flex items-center justify-center mb-4">
                <BookHeart className="w-5 h-5 text-white" strokeWidth={1.75} />
              </div>
              <h3 className="text-white font-medium mb-2">Built for slow travel</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                No packed-to-the-minute schedules — itineraries designed to
                leave room for wandering.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-card p-6">
              <div className="w-10 h-10 rounded-full bg-terracotta/90 flex items-center justify-center mb-4">
                <Bookmark className="w-5 h-5 text-white" strokeWidth={1.75} />
              </div>
              <h3 className="text-white font-medium mb-2">Save & revisit</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Keep every itinerary you generate, organized in one place,
                ready whenever you're ready to travel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-24">
        <div className="bg-deepgreen rounded-card px-10 py-14 text-center">
          <h2 className="text-3xl md:text-4xl text-white">
            Ready to write your next trip?
          </h2>
          <p className="text-white/80 mt-4 max-w-lg mx-auto">
            Tell the AI Planner your destination, dates, and pace — and get
            back a narrative itinerary worth reading twice.
          </p>
          <Link to={quickStartLink} className="inline-block mt-8">
            <Button variant="primary" className="bg-terracotta">
              Create your first trip
            </Button>
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}

export default Home;