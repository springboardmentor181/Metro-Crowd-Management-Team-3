import Image from "next/image";
import Link from "next/link";

import {
  Activity,
  ArrowRight,
  BellRing,
  BrainCircuit,
  Clock3,
  Gauge,
  MapPin,
  Route,
  ShieldCheck,
  Sparkles,
  TrainFront,
  Users,
} from "lucide-react";

import ThemeToggle from "@/components/layout/ThemeToggle";

const capabilities = [
  {
    icon: Users,
    number: "01",
    title: "Live Crowd Intelligence",
    text:
      "Turn gates, ticketing, occupancy and station records into a real-time understanding of passenger movement.",

    image: "/images/capability-crowd.jpg",

    alt:
      "Passenger crowd inside metro",
  },

  {
    icon: BrainCircuit,
    number: "02",
    title: "Demand Forecasting",
    text:
      "Predict congestion before it happens using AI and historical travel behaviour.",

    image: "/images/capability-forecast.jpg",

    alt:
      "Metro Platform",
  },

  {
    icon: Route,
    number: "03",
    title: "Adaptive Scheduling",
    text:
      "Recommend train frequency based on passenger demand and operational intelligence.",

    image: "/images/capability-schedule.jpg",

    alt:
      "Metro Train",
  },

  {
    icon: BellRing,
    number: "04",
    title: "Passenger Alerts",
    text:
      "Notify commuters instantly about delays, emergencies and platform congestion.",

    image: "/images/capability-alerts.jpg",

    alt:
      "Metro Station",
  },
];

export default function HomePage() {

  return (

    <main className="site-shell">

      {/* ================= NAVBAR ================= */}

      <nav className="site-nav">

        <Link
          href="/"
          className="brand"
        >

          <span className="brand-mark">

            <TrainFront size={22} />

          </span>

          <span>

            MetroFlow

            <strong>

              {" "}AI

            </strong>

          </span>

        </Link>

        <div className="nav-links">

          <a href="#platform">

            Platform

          </a>

          <a href="#passengers">

            Passengers

          </a>

          <a href="#impact">

            Impact

          </a>

        </div>

        <div className="nav-actions">

          <ThemeToggle />

          <Link
            href="/login"
            className="text-button"
          >

            Sign In

          </Link>

          <Link
            href="/signup"
            className="primary-button"
          >

            Create Account

            <ArrowRight size={16} />

          </Link>

        </div>

      </nav>

      {/* ================= HERO ================= */}

      <section className="home-hero">

        <div className="hero-copy">

          <span className="eyebrow">

            <Sparkles size={15} />

            Intelligence For Urban Movement

          </span>

          <h1>

            A calmer commute

            <em>

              {" "}starts before

            </em>

            {" "}the crowd.

          </h1>

          <p>

            MetroFlow helps passengers travel with confidence
            while helping metro operators predict congestion,
            improve scheduling and deliver smarter journeys.

          </p>

          <div className="hero-actions">

            <Link
              href="/signup"
              className="primary-button large"
            >

              Passenger Signup

              <ArrowRight size={18} />

            </Link>

            <Link
              href="/login"
              className="secondary-button large"
            >

              Operator Login

            </Link>

          </div>

          <div className="trust-row">

            <span>

              <ShieldCheck size={17} />

              Privacy Friendly AI

            </span>

            <span>

              <Activity size={17} />

              Live Crowd Prediction

            </span>

          </div>

        </div>

        <div className="hero-visual">

          <div className="image-frame hero-photo">

            <Image
              src="/images/delhi-platform.jpg"
              alt="Delhi Metro"
              fill
              priority
            />

          </div>

          <div className="floating-card crowd-card">

            <span className="status-dot" />

            <div>

              <small>

                Central Station

              </small>

              <strong>

                Comfortable

              </strong>

            </div>

            <b>

              42%

            </b>

          </div>

          <div className="floating-card arrival-card">

            <Clock3 size={20} />

            <div>

              <small>

                Next Train

              </small>

              <strong>

                Arriving In 3 Min

              </strong>

            </div>

          </div>

        </div>

      </section>
            {/* ================= NETWORK STRIP ================= */}

      <section className="network-strip">

        <div>

          <strong>

            24/7

          </strong>

          <span>

            Network Awareness

          </span>

        </div>

        <div>

          <strong>

            60 Min

          </strong>

          <span>

            Demand Forecast

          </span>

        </div>

        <div>

          <strong>

            4 Signals

          </strong>

          <span>

            Unified Intelligence

          </span>

        </div>

        <div>

          <strong>

            0 Cameras

          </strong>

          <span>

            Privacy Friendly AI

          </span>

        </div>

      </section>

      {/* ================= STORY ================= */}

      <section
        className="story-section"
        id="passengers"
      >

        <div className="story-images">

          <div className="image-frame story-main">

            <Image
              src="/images/hyderabad-metro.jpg"
              alt="Hyderabad Metro"
              fill
            />

          </div>

          <div className="image-frame story-small">

            <Image
              src="/images/kolkata-platform.jpg"
              alt="Kolkata Metro"
              fill
            />

          </div>

          <span className="image-note">

            <MapPin size={15} />

            Built For India&apos;s Growing Metro Network

          </span>

        </div>

        <div className="story-copy">

          <span className="section-label">

            For Every Journey

          </span>

          <h2>

            Not just an operations platform.

            <br />

            A better experience for every passenger.

          </h2>

          <p>

            MetroFlow AI allows passengers to
            view live crowd levels, receive
            disruption alerts and choose the
            best departure time before leaving
            home.

          </p>

          <ul className="check-list">

            <li>

              <Gauge />

              Live Station Crowd Levels

            </li>

            <li>

              <BellRing />

              Real-Time Service Alerts

            </li>

            <li>

              <Route />

              Smart Route Recommendation

            </li>

          </ul>

          <Link
            href="/signup"
            className="inline-link"
          >

            Create Passenger Account

            <ArrowRight size={17} />

          </Link>

        </div>

      </section>

      {/* ================= CAPABILITIES ================= */}

      <section
        className="capabilities-section"
        id="platform"
      >

        <div className="section-heading">

          <div>

            <span className="section-label">

              One Connected Platform

            </span>

            <h2>

              See Pressure.

              <br />

              Predict Demand.

              <br />

              Act Earlier.

            </h2>

          </div>

          <p>

            MetroFlow transforms operational
            data into actionable insights,
            helping metro operators make
            faster and smarter decisions.

          </p>

        </div>

        <div className="capability-grid">

          {capabilities.map(

            ({
              icon: Icon,
              number,
              title,
              text,
              image,
              alt,
            }) => (

              <article
                key={title}
                className="capability-card"
              >

                <div className="capability-card-top">

                  <span>

                    {number}

                  </span>

                  <Icon size={22} />

                </div>

                <div className="capability-image">

                  <Image
                    src={image}
                    alt={alt}
                    fill
                  />

                </div>

                <div className="capability-copy">

                  <h3>

                    {title}

                  </h3>

                  <p>

                    {text}

                  </p>

                </div>

              </article>

            )

          )}

        </div>

      </section>
            {/* ================= IMPACT ================= */}

      <section
        className="impact-section"
        id="impact"
      >

        <div>

          <span className="section-label">

            Built For Action

          </span>

          <h2>

            One Shared Picture

            <br />

            Of The Entire Metro Network.

          </h2>

          <p>

            MetroFlow AI provides passengers,
            operators and metro authorities
            with the right information at the
            right time for smarter decisions.

          </p>

        </div>

        <div className="role-list">

          <article>

            <span>

              Passenger

            </span>

            <h3>

              Plan A Better Journey

            </h3>

            <p>

              Live crowd prediction,
              delay notifications,
              smart departure time,
              and station insights.

            </p>

          </article>

          <article>

            <span>

              Metro Operator

            </span>

            <h3>

              Respond Before Congestion

            </h3>

            <p>

              AI powered operational
              recommendations,
              intelligent scheduling
              and predictive alerts.

            </p>

          </article>

          <article>

            <span>

              Organization

            </span>

            <h3>

              Improve Network Performance

            </h3>

            <p>

              Analytics dashboards,
              passenger trends,
              operational KPIs
              and long-term forecasting.

            </p>

          </article>

        </div>

      </section>

      {/* ================= CTA ================= */}

      <section className="final-cta">

        <div>

          <span className="eyebrow">

            YOUR CITY IS ALREADY MOVING

          </span>

          <h2>

            Help It Move

            <br />

            Smarter With AI.

          </h2>

        </div>

        <Link
          href="/signup"
          className="light-button"
        >

          Get Started

          <ArrowRight size={18} />

        </Link>

      </section>

      {/* ================= FOOTER ================= */}

      <footer className="site-footer">

        <Link
          href="/"
          className="brand"
        >

          <span className="brand-mark">

            <TrainFront size={20} />

          </span>

          <span>

            MetroFlow

            <strong>

              {" "}AI

            </strong>

          </span>

        </Link>

        <p>

          Privacy-first Artificial Intelligence
          platform for smarter metro operations
          and better passenger journeys.

        </p>

        <div>

          <Link href="/login">

            Login

          </Link>

          <Link href="/signup">

            Sign Up

          </Link>

        </div>

      </footer>

    </main>

  );

}
