import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, SlidersHorizontal, RefreshCw, Plane, Check } from "lucide-react";
import PageLayout from "../components/layout/PageLayout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import apiClient from "../api/client";

const STEPS = {
  FORM: "form",
  LOADING: "loading",
  RESULT: "result",
};

const featureCards = [
  {
    icon: Sparkles,
    title: "Written, not templated",
    body: "Every itinerary is shaped around your destination and style, never a generic checklist.",
  },
  {
    icon: SlidersHorizontal,
    title: "Tuned to your pace",
    body: "Relaxed, moderate, or packed — the rhythm of each day follows what you tell us.",
  },
  {
    icon: RefreshCw,
    title: "Regenerate anytime",
    body: "Not quite right? Ask for a fresh version until the story actually fits your trip.",
  },
];

function parseNarrative(text) {
  const dayPattern = /(?=Day\s+\d+\s*—)/g;
  const parts = text.split(dayPattern).filter(Boolean);

  if (parts.length <= 1) {
    return { intro: text, days: [] };
  }

  const firstPart = parts[0];
  const startsWithDay = /^Day\s+\d+\s*—/.test(firstPart.trim());

  const intro = startsWithDay ? "" : firstPart.trim();
  const dayParts = startsWithDay ? parts : parts.slice(1);

  const days = dayParts.map((part) => {
    const newlineIndex = part.indexOf("\n");
    const header = newlineIndex === -1 ? part.trim() : part.slice(0, newlineIndex).trim();
    const body = newlineIndex === -1 ? "" : part.slice(newlineIndex + 1).trim();
    const match = header.match(/Day\s+(\d+)\s*—\s*(.+)/);
    return {
      number: match ? match[1] : "",
      title: match ? match[2] : header,
      body,
    };
  });

  return { intro, days };
}

function AIPlanner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(STEPS.FORM);
  const [error, setError] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    destination: "",
    start_date: "",
    end_date: "",
    pace: "moderate",
    travel_style: "",
    notes: "",
  });

  const [trip, setTrip] = useState(null);
  const [itinerary, setItinerary] = useState(null);

  // Load an existing trip's itinerary when arriving via /planner?trip={id}
  useEffect(() => {
    const tripId = searchParams.get("trip");
    if (!tripId) return;

    const loadExistingTrip = async () => {
      setIsLoadingExisting(true);
      setError("");

      try {
        const tripResponse = await apiClient.get(`/trips/${tripId}`);
        const existingTrip = tripResponse.data;
        setTrip(existingTrip);

        const itineraryResponse = await apiClient.get(`/trips/${tripId}/itinerary`);
        setItinerary(itineraryResponse.data);

        setForm((prev) => ({
          ...prev,
          title: existingTrip.title,
          destination: existingTrip.destination,
          start_date: existingTrip.start_date,
          end_date: existingTrip.end_date,
          travel_style: existingTrip.travel_style || "",
        }));

        setIsSaved(existingTrip.status !== "draft");
        setStep(STEPS.RESULT);
      } catch (err) {
        const detail =
          err.response?.data?.message || "Could not load that trip's itinerary.";
        setError(detail);
        setStep(STEPS.FORM);
      } finally {
        setIsLoadingExisting(false);
      }
    };

    loadExistingTrip();
  }, [searchParams]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStep(STEPS.LOADING);

    try {
      const tripResponse = await apiClient.post("/trips", {
        title: form.title,
        destination: form.destination,
        start_date: form.start_date,
        end_date: form.end_date,
        status: "draft",
        travel_style: form.travel_style || null,
      });
      const newTrip = tripResponse.data;
      setTrip(newTrip);

      const itineraryResponse = await apiClient.post(`/trips/${newTrip.id}/itinerary`, {
        pace: form.pace,
        travel_style: form.travel_style || null,
        notes: form.notes || null,
      });
      setItinerary(itineraryResponse.data);
      setIsSaved(false);
      setStep(STEPS.RESULT);
    } catch (err) {
      const detail = err.response?.data?.message || "Something went wrong generating your itinerary.";
      setError(detail);
      setStep(STEPS.FORM);
    }
  };

  const handleRegenerate = async () => {
    if (!trip) return;
    setIsRegenerating(true);
    setError("");

    try {
      const response = await apiClient.post(`/trips/${trip.id}/itinerary/regenerate`, {
        pace: form.pace,
        travel_style: form.travel_style || null,
        notes: form.notes || null,
      });
      setItinerary(response.data);
      setIsSaved(false);
    } catch (err) {
      const detail = err.response?.data?.message || "Failed to regenerate the itinerary.";
      setError(detail);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSaveTrip = async () => {
    if (!trip) return;
    setIsSaving(true);
    setError("");

    try {
      await apiClient.put(`/trips/${trip.id}`, { status: "upcoming" });
      setIsSaved(true);
    } catch (err) {
      const detail = err.response?.data?.message || "Failed to save trip.";
      setError(detail);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartOver = () => {
    setStep(STEPS.FORM);
    setTrip(null);
    setItinerary(null);
    setIsSaved(false);
    setError("");
    navigate("/planner");
  };

  const parsed = itinerary ? parseNarrative(itinerary.narrative_text) : null;

  return (
    <PageLayout>
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center mb-12">
          <p className="uppercase tracking-[0.2em] text-xs text-terracotta font-medium mb-4">
            AI Planner
          </p>
          <h1 className="text-4xl md:text-5xl text-charcoal">
            Tell us how you like to travel.
          </h1>
          <p className="text-charcoal/70 mt-4 max-w-lg mx-auto">
            We'll write back a narrative itinerary — not a checklist —
            shaped around your destination, pace, and style.
          </p>
        </div>

        {step === STEPS.FORM && (
          <>
            <Card>
              {error && (
                <div className="bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm rounded-xl px-4 py-3 mb-5">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-charcoal/50 mb-2">
                    Trip title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Kyoto in Autumn"
                    className="w-full border border-charcoal/15 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wide text-charcoal/50 mb-2">
                    Destination
                  </label>
                  <input
                    type="text"
                    name="destination"
                    value={form.destination}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Kyoto, Japan"
                    className="w-full border border-charcoal/15 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-charcoal/50 mb-2">
                      Start date
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={form.start_date}
                      onChange={handleChange}
                      required
                      className="w-full border border-charcoal/15 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-terracotta"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-charcoal/50 mb-2">
                      End date
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={form.end_date}
                      onChange={handleChange}
                      required
                      className="w-full border border-charcoal/15 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-terracotta"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-charcoal/50 mb-2">
                      Pace
                    </label>
                    <select
                      name="pace"
                      value={form.pace}
                      onChange={handleChange}
                      className="w-full border border-charcoal/15 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-terracotta bg-white"
                    >
                      <option value="relaxed">Relaxed</option>
                      <option value="moderate">Moderate</option>
                      <option value="packed">Packed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-charcoal/50 mb-2">
                      Travel style
                    </label>
                    <input
                      type="text"
                      name="travel_style"
                      value={form.travel_style}
                      onChange={handleChange}
                      placeholder="e.g. cultural, romantic, culinary"
                      className="w-full border border-charcoal/15 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-terracotta"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wide text-charcoal/50 mb-2">
                    Anything else? (optional)
                  </label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="e.g. interested in gardens and quiet temples"
                    className="w-full border border-charcoal/15 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-terracotta resize-none"
                  />
                </div>

                <Button type="submit" variant="primary" className="w-full">
                  Write my itinerary
                </Button>
              </form>
            </Card>

            {/* Feature cards */}
            <div className="grid sm:grid-cols-3 gap-5 mt-8">
              {featureCards.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white rounded-card shadow-sm p-6"
                >
                  <div className="w-10 h-10 rounded-full bg-sand flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-deepgreen" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-charcoal font-medium mb-2">{feature.title}</h3>
                  <p className="text-charcoal/60 text-sm leading-relaxed">{feature.body}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {(step === STEPS.LOADING || isLoadingExisting) && (
          <Card className="py-16">
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-xs h-6 mb-6">
                <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dashed border-terracotta/30" />
                <Plane
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-terracotta animate-fly"
                  strokeWidth={1.75}
                />
              </div>
              <p className="text-charcoal/60 text-sm">
                {isLoadingExisting ? "Loading your itinerary..." : "Crafting your itinerary..."}
              </p>
            </div>
          </Card>
        )}

        {step === STEPS.RESULT && itinerary && parsed && !isLoadingExisting && (
          <div>
            <Card className="mb-6">
              <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
                <div>
                  <h2 className="text-2xl text-charcoal">{trip.title}</h2>
                  <p className="text-charcoal/60 text-sm mt-1">
                    {trip.destination} · {trip.start_date} to {trip.end_date}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  isLoading={isRegenerating}
                >
                  Regenerate
                </Button>
              </div>

              {error && (
                <div className="bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm rounded-xl px-4 py-3 mb-5">
                  {error}
                </div>
              )}

              {/* Meta row */}
              <div className="grid sm:grid-cols-4 gap-6 border-b border-charcoal/10 pb-6 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-charcoal/40 mb-1">Destination</p>
                  <p className="font-serif italic text-terracotta">{trip.destination}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-charcoal/40 mb-1">Duration</p>
                  <p className="font-serif italic text-terracotta">
                    {trip.start_date} → {trip.end_date}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-charcoal/40 mb-1">Pace</p>
                  <p className="font-serif italic text-terracotta capitalize">{form.pace}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-charcoal/40 mb-1">Style</p>
                  <p className="font-serif italic text-terracotta">
                    {form.travel_style || "Open"}
                  </p>
                </div>
              </div>

              {parsed.intro && (
                <p className="text-charcoal/80 leading-relaxed mb-8">{parsed.intro}</p>
              )}

              <div className="space-y-8">
                {parsed.days.length > 0 ? (
                  parsed.days.map((day, i) => (
                    <div key={i} className="flex gap-5">
                      <span className="font-serif text-3xl text-terracotta/70 leading-none shrink-0">
                        {day.number ? String(day.number).padStart(2, "0") : String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="text-xl text-charcoal mb-2">{day.title}</h3>
                        <p className="text-charcoal/75 leading-relaxed whitespace-pre-line">
                          {day.body}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-charcoal/80 leading-relaxed whitespace-pre-line">
                    {itinerary.narrative_text}
                  </p>
                )}
              </div>
            </Card>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button
                variant="secondary"
                onClick={handleSaveTrip}
                isLoading={isSaving}
                disabled={isSaved}
              >
                {isSaved ? (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Marked as Upcoming
                  </span>
                ) : (
                  "Mark as Upcoming Trip"
                )}
              </Button>
              <Button variant="outline" onClick={handleStartOver}>
                Plan another trip
              </Button>
              {isSaved && (
                <Button variant="primary" onClick={() => navigate("/trips")}>
                  View Saved Trips
                </Button>
              )}
            </div>
          </div>
        )}
      </section>

      <style>{`
        @keyframes fly {
          0% { left: 0%; }
          100% { left: calc(100% - 20px); }
        }
        .animate-fly {
          animation: fly 1.8s ease-in-out infinite alternate;
        }
      `}</style>
    </PageLayout>
  );
}

export default AIPlanner;