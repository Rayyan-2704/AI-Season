import PageLayout from "../components/layout/PageLayout";

import destKyoto from "../assets/images/dest-kyoto.jpg";
import destAlgarve from "../assets/images/dest-algarve.jpg";
import destTuscany from "../assets/images/dest-tuscany.jpg";
import exploreSantorini from "../assets/images/explore-santorini.jpg";
import exploreLisbon from "../assets/images/explore-lisbon.jpg";
import exploreProvence from "../assets/images/explore-provence.jpg";

const gridFeatures = [
  {
    id: "santorini",
    name: "Santorini, Greece",
    image: exploreSantorini,
    quote: "White walls, blue domes, and a horizon that never quite ends.",
  },
  {
    id: "lisbon",
    name: "Lisbon, Portugal",
    image: exploreLisbon,
    quote: "A city of hills, trams, and unhurried afternoons.",
  },
  {
    id: "algarve",
    name: "Algarve, Portugal",
    image: destAlgarve,
    quote: "Sea cliffs, golden light, and mornings that ask nothing of you.",
  },
  {
    id: "provence",
    name: "Provence, France",
    image: exploreProvence,
    quote: "Lavender fields and villages that haven't changed their pace in centuries.",
  },
];

function FeatureBanner({ name, image, quote, body }) {
  return (
    <div className="relative rounded-card overflow-hidden group h-[420px] md:h-[480px]">
      <img
        src={image}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/25 to-transparent" />

      <div className="relative h-full flex flex-col justify-end p-8 md:p-12">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-3">
          {name}
        </p>
        <p className="font-serif text-2xl md:text-3xl text-white leading-snug mb-3 max-w-xl">
          "{quote}"
        </p>
        <p className="text-sm text-white/75 leading-relaxed max-w-md">
          {body}
        </p>
      </div>
    </div>
  );
}

function GridCard({ name, image, quote }) {
  return (
    <div className="relative rounded-card overflow-hidden group h-[280px]">
      <img
        src={image}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/15 to-transparent" />

      <div className="relative h-full flex flex-col justify-end p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-2">
          {name}
        </p>
        <p className="font-serif text-lg text-white leading-snug">
          "{quote}"
        </p>
      </div>
    </div>
  );
}

function Explore() {
  return (
    <PageLayout>
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        <p className="uppercase tracking-[0.2em] text-xs text-terracotta font-medium mb-4">
          The Explore feed
        </p>
        <h1 className="text-4xl md:text-5xl text-charcoal max-w-2xl">
          Destinations worth slowing down for.
        </h1>
        <p className="mt-5 text-charcoal/70 max-w-xl leading-relaxed">
          A curated look at places where the pace of life invites you to stay
          a little longer — chosen for quiet mornings, unhurried streets, and
          stories that unfold rather than rush by.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-8">
        <FeatureBanner
          name="Kyoto, Japan"
          image={destKyoto}
          quote="The city doesn't rush you. It waits for you to slow down first."
          body="Between the moss gardens of the eastern hills and the quiet wooden machiya of the old textile district, Kyoto rewards travelers who let go of the itinerary entirely."
        />
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid sm:grid-cols-2 gap-6">
          {gridFeatures.map((item) => (
            <GridCard key={item.id} {...item} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-24">
        <FeatureBanner
          name="Tuscany, Italy"
          image={destTuscany}
          quote="Every hill has a story, and every story has a vineyard nearby."
          body="Tuscany's countryside is best explored the way its wine is best tasted — slowly, in good company, with nowhere else to be."
        />
      </section>
    </PageLayout>
  );
}

export default Explore;