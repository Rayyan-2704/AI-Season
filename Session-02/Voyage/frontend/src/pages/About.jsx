import { Link } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";

import aboutImage from "../assets/images/about-philosophy.jpg";

const principles = [
  {
    title: "Fewer places, deeper time",
    body: "A week in one city teaches you more than a day each in seven. We design itineraries that linger rather than sprint — fewer pins on the map, more time actually standing in front of them.",
  },
  {
    title: "Written, not listed",
    body: "A bulleted itinerary tells you where to be. A narrative one tells you why it matters. We believe the second kind is the only one worth planning around.",
  },
  {
    title: "Pace is personal",
    body: "Relaxed, moderate, or packed — your ideal pace isn't a settings toggle, it's a description of how you actually want to feel at the end of each day. We ask, and we listen.",
  },
  {
    title: "Leave room for nothing",
    body: "The best afternoons are often unplanned. Every itinerary we write leaves space — an empty hour, a wandering path — because the itinerary isn't the trip. It's just the invitation.",
  },
];

function About() {
  const { isAuthenticated } = useAuth();

  return (
    <PageLayout>
      {/* Intro */}
      <section className="mx-auto max-w-4xl px-6 pt-16 pb-12 text-center">
        <p className="uppercase tracking-[0.2em] text-xs text-terracotta font-medium mb-4">
          Our philosophy
        </p>
        <h1 className="text-4xl md:text-5xl text-charcoal leading-tight">
          Travel slower. Read deeper. Arrive differently.
        </h1>
        <p className="mt-6 text-lg text-charcoal/70 leading-relaxed max-w-2xl mx-auto">
          Voyage was built on a simple belief: the way a trip is planned
          shapes the way it's lived. A rushed checklist produces a rushed
          trip. A thoughtfully written story produces something closer to
          what travel is actually for.
        </p>
      </section>

      {/* Image + pull quote */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="relative rounded-card overflow-hidden h-[420px] md:h-[520px]">
          <img
            src={aboutImage}
            alt="A quiet morning scene evoking slow travel"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/10 to-transparent" />
          <div className="relative h-full flex items-end p-8 md:p-12">
            <p className="font-serif text-2xl md:text-4xl text-white leading-snug max-w-2xl">
              "We don't plan trips to check places off a list. We plan them
              to remember how a place felt."
            </p>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-3xl md:text-4xl text-charcoal mb-12 text-center">
          What slow travel means to us
        </h2>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-12">
          {principles.map((p, i) => (
            <div key={p.title} className="flex gap-5">
              <span className="font-serif text-3xl text-terracotta/60 leading-none">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-xl text-charcoal mb-2">{p.title}</h3>
                <p className="text-charcoal/70 leading-relaxed">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="bg-sand/60 rounded-card px-10 py-14 text-center">
          <h2 className="text-3xl md:text-4xl text-charcoal">
            Ready to plan something unhurried?
          </h2>
          <p className="text-charcoal/70 mt-4 max-w-lg mx-auto">
            Tell us where you're going and how you like to travel — the
            rest is just narrative.
          </p>
          <Link to={isAuthenticated ? "/planner" : "/register"} className="inline-block mt-8">
            <Button variant="primary">Start planning</Button>
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}

export default About;