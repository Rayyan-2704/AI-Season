import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, FileEdit, PlaneTakeoff, CheckCircle2 } from "lucide-react";
import PageLayout from "../components/layout/PageLayout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import SkeletonLoader from "../components/common/SkeletonLoader";
import apiClient from "../api/client";

const STATUS_CONFIG = {
  upcoming: {
    label: "Upcoming Trips",
    icon: PlaneTakeoff,
    color: "text-terracotta",
    badgeBg: "bg-terracotta/10",
    emptyText: "No upcoming trips yet. Plan one to see it here.",
  },
  draft: {
    label: "Drafts",
    icon: FileEdit,
    color: "text-charcoal/60",
    badgeBg: "bg-sand",
    emptyText: "No drafts. Anything you generate in the AI Planner starts here.",
  },
  past: {
    label: "Past Trips",
    icon: CheckCircle2,
    color: "text-deepgreen",
    badgeBg: "bg-deepgreen/10",
    emptyText: "No past trips yet.",
  },
};

function TripCard({ trip }) {
  const config = STATUS_CONFIG[trip.status] || STATUS_CONFIG.draft;
  const Icon = config.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-xl text-charcoal">{trip.title}</h3>
        <span className={`text-xs px-3 py-1 rounded-full ${config.badgeBg} ${config.color} whitespace-nowrap`}>
          {trip.status}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-charcoal/60 mb-2">
        <MapPin className="w-4 h-4" />
        {trip.destination}
      </div>

      <div className="flex items-center gap-2 text-sm text-charcoal/60 mb-4">
        <Calendar className="w-4 h-4" />
        {trip.start_date} → {trip.end_date}
      </div>

      {trip.travel_style && (
        <p className="text-xs uppercase tracking-wide text-charcoal/40 mb-4">
          {trip.travel_style}
        </p>
      )}

      <Link to={`/planner?trip=${trip.id}`}>
        <Button variant="outline" className="w-full text-sm">
          View itinerary
        </Button>
      </Link>
    </Card>
  );
}

function TripSection({ status, trips }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const sectionTrips = trips.filter((t) => t.status === status);

  return (
    <section className="mb-14">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-9 h-9 rounded-full ${config.badgeBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${config.color}`} strokeWidth={1.75} />
        </div>
        <h2 className="text-2xl text-charcoal">{config.label}</h2>
        <span className="text-sm text-charcoal/40">({sectionTrips.length})</span>
      </div>

      {sectionTrips.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-charcoal/50 text-sm">{config.emptyText}</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectionTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </section>
  );
}

function SavedTrips() {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await apiClient.get("/trips");
        setTrips(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load your trips. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrips();
  }, []);

  return (
    <PageLayout>
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        <p className="uppercase tracking-[0.2em] text-xs text-terracotta font-medium mb-4">
          My Trips
        </p>
        <h1 className="text-4xl md:text-5xl text-charcoal">
          Everywhere you're going, and everywhere you've been.
        </h1>
        <p className="mt-5 text-charcoal/70 max-w-xl leading-relaxed">
          Every itinerary you write with Voyage lives here — drafts you're
          still shaping, trips ahead of you, and journeys already told.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonLoader className="h-48 w-full" count={3} />
          </div>
        )}

        {!isLoading && error && (
          <Card className="text-center py-10">
            <p className="text-terracotta text-sm">{error}</p>
          </Card>
        )}

        {!isLoading && !error && trips.length === 0 && (
          <Card className="text-center py-16">
            <p className="text-charcoal/60 mb-6">
              You haven't planned any trips yet.
            </p>
            <Link to="/planner">
              <Button variant="primary">Plan your first trip</Button>
            </Link>
          </Card>
        )}

        {!isLoading && !error && trips.length > 0 && (
          <>
            <TripSection status="upcoming" trips={trips} />
            <TripSection status="draft" trips={trips} />
            <TripSection status="past" trips={trips} />
          </>
        )}
      </section>
    </PageLayout>
  );
}

export default SavedTrips;