import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Landing.css'

const icons = {
  camera: (
    <>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </>
  ),
  sparkle: (
    <path d="M12 3l1.9 5.7a2 2 0 0 0 1.3 1.3L21 12l-5.8 2a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.7a2 2 0 0 0-1.3-1.3L3 12l5.8-2a2 2 0 0 0 1.3-1.3L12 3z" />
  ),
  route: (
    <>
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </>
  ),
  wrench: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  ),
  tag: (
    <>
      <path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z" />
      <circle cx="7.5" cy="7.5" r="0.5" fill="currentColor" />
    </>
  ),
  heart: (
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" />
  ),
  recycle: (
    <>
      <path d="M3 12a9 9 0 0 1 9-9c2.6 0 5 1.1 6.7 2.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9c-2.6 0-5-1.1-6.7-2.7L3 16" />
      <path d="M3 21v-5h5" />
    </>
  ),
  ban: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </>
  ),
}

function Icon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  )
}

const STEPS = [
  {
    icon: 'camera',
    title: 'Snap a photo',
    body: 'Any device, any brand, any decade. One photo of what you have is enough to start.',
  },
  {
    icon: 'sparkle',
    title: 'Get the read',
    body: 'AI identifies the exact model, grades its condition, and estimates what it is worth today.',
  },
  {
    icon: 'route',
    title: 'Take the best route',
    body: 'A ranked recommendation — repair, resell, donate, or recycle — with the reasoning, not just a price.',
  },
]

const ROUTES = [
  {
    icon: 'wrench',
    name: 'Repair',
    body: 'Most retired tech is one cheap part away from years more use. We tell you which part.',
  },
  {
    icon: 'tag',
    name: 'Resell',
    body: 'Working devices deserve a second owner — and you deserve a fair price, not a lowball.',
  },
  {
    icon: 'heart',
    name: 'Donate',
    body: 'Worth little on the market can still mean a lot to a school, a shelter, a neighbour.',
  },
  {
    icon: 'recycle',
    name: 'Recycle',
    body: 'Truly done? Then the copper, cobalt, and glass go back into circulation — properly.',
  },
]

const COMPARISONS = [
  {
    them: 'Brand trade-in programs',
    theirLine: 'One brand, one route, and the answer is always "hand it over and buy ours."',
    us: 'Still Good works across every brand and never ends with a checkout.',
  },
  {
    them: 'Resale marketplaces',
    theirLine: 'A price, if you do the work — photos, listings, messages, haggling.',
    us: 'Still Good gives you a straight answer first, and only then the effort.',
  },
  {
    them: 'The drawer',
    theirLine: 'Zero effort, zero value, and a working device slowly becoming e-waste.',
    us: 'Still Good makes the good outcome the easy one.',
  },
]

function Landing() {
  useEffect(() => {
    const targets = document.querySelectorAll('.landing [data-reveal]')
    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('revealed'))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 },
    )
    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="landing">
      <header className="lp-header">
        <span className="wordmark">Still Good</span>
        <Link to="/app" className="header-cta">
          Try it
        </Link>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">A field guide for the tech you already own</p>
          <h1 className="hero-title">
            Don&rsquo;t buy new <em>yet.</em>
          </h1>
          <p className="hero-sub">
            Photograph any device. AI identifies the exact model, grades its
            condition, estimates its value — and finds its best next life,
            so upgrading stops being the default.
          </p>
          <div className="hero-actions">
            <Link to="/app" className="cta-primary">
              Try it — photograph a device
            </Link>
            <a href="#how" className="cta-quiet">
              How it works
            </a>
          </div>
        </div>

        <figure className="assessment" aria-label="Example device assessment">
          <div className="assessment-head">
            <span>Assessment</span>
            <span>No. 0142</span>
          </div>
          <div className="assessment-row" style={{ '--i': 1 }}>
            <span className="row-label">Device</span>
            <span className="row-value">
              iPhone 12 · 128&thinsp;GB <small>(A2403, 2020)</small>
            </span>
          </div>
          <div className="assessment-row" style={{ '--i': 2 }}>
            <span className="row-label">Condition</span>
            <span className="row-value">
              <span className="grade-meter" aria-hidden="true">
                <i className="on" />
                <i className="on" />
                <i className="on" />
                <i className="on" />
                <i />
              </span>
              B&thinsp;· Good — battery 84%, cracked back glass
            </span>
          </div>
          <div className="assessment-row" style={{ '--i': 3 }}>
            <span className="row-label">Value</span>
            <span className="row-value">
              $170–210 as-is · <strong>$260 repaired</strong>
            </span>
          </div>
          <div className="assessment-routes" style={{ '--i': 4 }}>
            <span className="row-label">Best route</span>
            <ol>
              <li className="pick">
                <Icon name="wrench" /> Repair back glass ($89), keep or resell
              </li>
              <li>
                <Icon name="tag" /> Resell as-is on secondary market
              </li>
              <li>
                <Icon name="heart" /> Donate to a refurb program
              </li>
              <li className="last-resort">
                <Icon name="ban" /> <s>Buy new</s> — not recommended
              </li>
            </ol>
          </div>
        </figure>
      </section>

      <section className="problem" data-reveal>
        <p className="eyebrow">The problem</p>
        <h2 className="problem-title">
          Everyone has <em>the drawer.</em>
        </h2>
        <p className="problem-body">
          Old phones, tired laptops, tangled chargers. Most of it still works.
          It sits there because figuring out what it&rsquo;s worth — and where it
          should actually go — is a chore. So we buy new, and the drawer grows.
        </p>
        <dl className="stats">
          <div>
            <dt>~60M tonnes</dt>
            <dd>of e-waste generated worldwide every year</dd>
          </div>
          <div>
            <dt>&lt;25%</dt>
            <dd>of it formally collected and recycled</dd>
          </div>
          <div>
            <dt>Years of life</dt>
            <dd>left in a typical &ldquo;retired&rdquo; device</dd>
          </div>
        </dl>
        <p className="stats-note">Illustrative figures — the drawer is real.</p>
      </section>

      <section className="how" id="how" data-reveal>
        <p className="eyebrow">How it works</p>
        <h2 className="section-title">Three steps, no spreadsheet.</h2>
        <ol className="steps">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="step-icon">
                <Icon name={step.icon} />
              </span>
              <span className="step-index">Step {index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="outcomes" data-reveal>
        <p className="eyebrow">The four outcomes</p>
        <h2 className="section-title">
          Every good ending, ranked. <em>Buying new comes last.</em>
        </h2>
        <ul className="routes">
          {ROUTES.map((route, index) => (
            <li key={route.name}>
              <span className="route-rank">0{index + 1}</span>
              <span className="route-icon">
                <Icon name={route.icon} />
              </span>
              <h3>{route.name}</h3>
              <p>{route.body}</p>
            </li>
          ))}
        </ul>
        <p className="buy-new">
          <span className="route-rank">05</span>
          <Icon name="ban" />
          <s>Buy new</s>
          <span className="buy-new-note">the last resort, not the default</span>
        </p>
      </section>

      <section className="different" data-reveal>
        <p className="eyebrow">Why it&rsquo;s different</p>
        <h2 className="section-title">
          Not a trade-in. Not a marketplace. <em>An honest second opinion.</em>
        </h2>
        <ul className="compare">
          {COMPARISONS.map((row) => (
            <li key={row.them}>
              <h3>{row.them}</h3>
              <p className="their-line">{row.theirLine}</p>
              <p className="our-line">{row.us}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="closing" data-reveal>
        <h2 className="closing-title">
          Before you buy new, <em>ask what you&rsquo;re holding.</em>
        </h2>
        <Link to="/app" className="cta-primary">
          Try it now
        </Link>
      </section>

      <footer className="lp-footer">
        <span className="wordmark">Still Good</span>
        <span>Built at the CSESoc Flagship Hackathon 2026 · powered by Gemini</span>
      </footer>
    </div>
  )
}

export default Landing
